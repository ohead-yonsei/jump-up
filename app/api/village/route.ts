import {storeFromEnv,type CohortStore} from '@/lib/cohort-store';
import {sha256,bearer,json,readJson,clientAddress,rateLimiter} from '@/lib/cohort-server';
import {isSameOrigin} from '@/lib/request-origin';
import {seoulDay} from '@/lib/cohort';
import {padsFor,frogsFor,cheersFor,cleanFrogCard,cheerTarget,isCheerKind,canOpenPad} from '@/lib/pond';
export const dynamic='force-dynamic';
export const runtime='nodejs';
// Arriving is one request each time the village opens; cheers are a tap each. Both are also limited per address, generously,
// so one institution's shared network still fits and made-up tokens cannot get around the limits.
const arriveLimit=rateLimiter(30);const cheerLimit=rateLimiter(40);const addressLimit=rateLimiter(600);
const closed=()=>json({error:'기수 기능을 준비 중이에요.',code:'not_configured'},503);
const unavailable=()=>json({error:'지금은 연못 마을에 닿기 어려워요. 잠시 후 다시 시도해 주세요.'},502);
const noToken=()=>json({error:'기수 참여 정보가 없어요.'},401);
const notMember=()=>json({error:'기수 참여 정보를 찾지 못했어요.',code:'not_member'},404);
const member=(store:CohortStore,token:string)=>store.participantByToken(sha256(token));
/** Opening the village. The member says how their frog looks, or sends null to look around unseen, and gets back today's frogs,
 * the pads, the cheers they received (never from whom) and what they already cheered today. Days are counted in Korean time. */
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return noToken();
 if(!arriveLimit(token)||!addressLimit(clientAddress(request)))return json({error:'잠시 뒤에 다시 들를게요.'},429);
 const input=await readJson(request,2000);if('error' in input)return input.error;
 const raw=(input.value as {card?:unknown}|null)?.card;const card=raw==null?null:cleanFrogCard(raw);
 if(raw!=null&&!card)return json({error:'개구리 모습을 확인해 주세요.'},400);
 try{
  const found=await member(store,token);if(!found)return notMember();
  const me=found.participant.id,cohortId=found.cohort.id,day=seoulDay();
  await store.arrive({cohortId,participantId:me,card,day});
  const [frogs,pads,cheers]=await Promise.all([store.cohortFrogs(cohortId),store.cohortPads(cohortId),store.cheersOf(me)]);
  return json({day,frogs:frogsFor(frogs,me,day),pads:padsFor(pads,me),cheers:cheersFor(cheers,me),sent:cheers.filter(c=>c.fromId===me&&c.day===day).map(c=>c.target)});
 }catch{return unavailable();}
}
/** Sends one of the set cheers to a frog that came by today or to a floating pad. The other person sees the phrase, not the sender. */
export async function PUT(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return noToken();
 if(!cheerLimit(token)||!addressLimit(clientAddress(request)))return json({error:'응원은 조금 쉬었다가 다시 보내요.'},429);
 const input=await readJson(request,300);if('error' in input)return input.error;
 const v=input.value as {target?:unknown;kind?:unknown}|null;const target=cheerTarget(v?.target);
 if(!target||!isCheerKind(v?.kind))return json({error:'입력을 확인해 주세요.'},400);
 const gone=()=>json({error:'지금은 응원을 보낼 수 없는 곳이에요.'},404);
 try{
  const found=await member(store,token);if(!found)return notMember();
  const me=found.participant,day=seoulDay();let toId='';
  if(target.on==='pad'){const pad=await store.pad(target.id);if(!pad||pad.hidden||!canOpenPad(pad,me))return gone();toId=pad.participantId;}
  else{const frog=frogsFor(await store.cohortFrogs(found.cohort.id),me.id,day).find(f=>f.id===target.id);if(!frog||frog.hidden)return gone();toId=frog.id;}
  if(toId===me.id)return json({error:'내 것에는 응원을 보내지 않아도 괜찮아요.'},400);
  await store.addCheer({cohortId:found.cohort.id,fromId:me.id,toId,target:`${target.on}:${target.id}`,kind:v!.kind as never,day});
  return json({ok:true});
 }catch{return unavailable();}
}
