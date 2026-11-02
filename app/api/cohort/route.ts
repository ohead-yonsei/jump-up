import {storeFromEnv} from '@/lib/cohort-store';
import {normalizeCode,validJoinCode,validSync,cohortEnded,MAX_SYNC_BYTES,type CohortInfo} from '@/lib/cohort';
import {sha256,newToken,bearer,json,readJson,clientAddress,rateLimiter} from '@/lib/cohort-server';
import {isSameOrigin} from '@/lib/request-origin';
import {validParticipant,recordId} from '@/lib/records';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const joinLimit=rateLimiter(10);const syncLimit=rateLimiter(30);
const info=(c:CohortInfo):CohortInfo=>({name:c.name,org:c.org,startsOn:c.startsOn,endsOn:c.endsOn});
const closed=()=>json({error:'기수 기능을 준비 중이에요.',code:'not_configured'},503);
const unavailable=()=>json({error:'지금은 기수에 연결하기 어려워요. 잠시 후 다시 시도해 주세요.'},502);
export async function GET(){return json({configured:!!await storeFromEnv()});}
/** Joins a cohort with the code an institution handed out. */
export async function POST(request:Request){
 const store=await storeFromEnv();if(!store)return closed();
 const input=await readJson(request,1000);if('error' in input)return input.error;
 if(!joinLimit(clientAddress(request)))return json({error:'잠시 쉬었다가 1분 뒤에 다시 해볼까요?'},429);
 const v=input.value as {code?:unknown;participant?:unknown};const code=normalizeCode(typeof v.code==='string'?v.code:'');
 if(!validJoinCode(code))return json({error:'기수 코드는 8자리예요. 받은 코드를 다시 확인해 주세요.'},400);
 try{
  const cohort=await store.cohortByJoinCode(code);if(!cohort)return json({error:'이 코드로 열린 기수를 찾지 못했어요. 다시 확인해 주세요.'},404);
  if(cohortEnded(cohort))return json({error:'이 기수는 이미 마쳤어요. 기관 담당자에게 다음 기수를 물어봐 주세요.'},410);
  const token=newToken();const participant=typeof v.participant==='string'&&validParticipant(v.participant)?v.participant:recordId().slice(0,8);
  await store.addParticipant({cohortId:cohort.id,code:participant,tokenHash:sha256(token)});
  return json({token,participant,cohort:info(cohort)});
 }catch{return unavailable();}
}
/** Adds the records made since the last send. */
export async function PUT(request:Request){
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return json({error:'기수 참여 정보가 없어요.'},401);
 const input=await readJson(request,MAX_SYNC_BYTES);if('error' in input)return input.error;
 if(!syncLimit(token))return json({error:'잠시 뒤에 다시 보낼게요.'},429);
 const sync=validSync(input.value);if(!sync)return json({error:'입력을 확인해 주세요.'},400);
 try{
  const found=await store.participantByToken(sha256(token));if(!found)return json({error:'기수 참여 정보를 찾지 못했어요.',code:'not_member'},404);
  await store.saveRecords(found.participant.id,sync.participant,sync.entries,sync.visits);
  return json({ok:true,cohort:info(found.cohort)});
 }catch{return unavailable();}
}
/** Leaves the cohort and deletes everything this person sent. */
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return json({error:'기수 참여 정보가 없어요.'},401);
 try{const found=await store.participantByToken(sha256(token));if(found)await store.removeParticipant(found.participant.id);return json({ok:true});}
 catch{return unavailable();}
}
