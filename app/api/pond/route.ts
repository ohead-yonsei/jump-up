import {storeFromEnv,TooManyPads,type CohortStore} from '@/lib/cohort-store';
import {sha256,bearer,json,readJson,clientAddress,rateLimiter} from '@/lib/cohort-server';
import {isSameOrigin} from '@/lib/request-origin';
import {cleanJpeg,cleanPadText,padsFor,canOpenPad,validPadId,MAX_PAD_BYTES,MAX_PADS_PER_PERSON,MAX_PAD_TEXT} from '@/lib/pond';
import {needsSupport} from '@/lib/content';
export const dynamic='force-dynamic';
export const runtime='nodejs';
// Floating is limited per person; looking is looser because every photo is its own request. Both are also limited per address,
// generously so one institution's shared network still fits, so made-up tokens cannot get around the limits.
const floatLimit=rateLimiter(6);const lookLimit=rateLimiter(300);const addressLimit=rateLimiter(600);
const closed=()=>json({error:'기수 기능을 준비 중이에요.',code:'not_configured'},503);
const unavailable=()=>json({error:'지금은 연못에 닿기 어려워요. 잠시 후 다시 시도해 주세요.'},502);
const noToken=()=>json({error:'기수 참여 정보가 없어요.'},401);
const notMember=()=>json({error:'기수 참여 정보를 찾지 못했어요.',code:'not_member'},404);
const noPad=()=>json({error:'연잎을 찾지 못했어요.'},404);
const member=(store:CohortStore,token:string)=>store.participantByToken(sha256(token));
/** The cohort's pond as this member sees it (photos and days, nobody's name), or with `?id=` one pad's photo. */
export async function GET(request:Request){
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return noToken();
 if(!lookLimit(token)||!addressLimit(clientAddress(request)))return json({error:'잠시 뒤에 다시 볼게요.'},429);
 const id=new URL(request.url).searchParams.get('id');
 try{
  const found=await member(store,token);if(!found)return notMember();
  if(id===null)return json({pads:padsFor(await store.cohortPads(found.cohort.id),found.participant.id)});
  const pad=validPadId(id)?await store.pad(id):null;
  const photo=pad&&canOpenPad(pad,found.participant)?await store.padPhoto(pad):null;
  if(!photo)return noPad();
  // A pad's photo never changes, so the device may keep it; what is shown is still decided by the list above.
  return new Response(new Blob([photo.slice()],{type:'image/jpeg'}),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=604800, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});
 }catch{return unavailable();}
}
const tooMany=()=>json({error:`연잎은 한 사람이 ${MAX_PADS_PER_PERSON}장까지 띄워둘 수 있어요. 예전 연잎을 내리면 다시 띄울 수 있어요.`,code:'too_many'},413);
/** A text pad: one short line. Words that sound like a crisis are not floated; the screen shows where to get help instead. */
async function floatText(request:Request,store:CohortStore,token:string){
 const input=await readJson(request,1200);if('error' in input)return input.error;
 const text=cleanPadText((input.value as {text?:unknown}|null)?.text);
 if(!text)return json({error:`한 줄을 ${MAX_PAD_TEXT}자 안으로 적어 주세요.`},400);
 if(needsSupport(text))return json({error:'이 글은 연못에 띄우지 않았어요. 지금 많이 힘들다면 109(자살예방 상담전화)에 24시간 연락할 수 있어요.',code:'support'},422);
 try{
  const found=await member(store,token);if(!found)return notMember();
  const pad=await store.addPad({cohortId:found.cohort.id,participantId:found.participant.id,text});
  return json({pad:padsFor([pad],found.participant.id)[0]},201);
 }catch(e){return e instanceof TooManyPads?tooMany():unavailable();}
}
/** Floats one photo or one line the member chose to share. A photo's body is the JPEG itself, already redrawn on the device; it is cleaned again here. */
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return noToken();
 const type=request.headers.get('content-type')??'';
 if(!type.startsWith('image/jpeg')&&!type.startsWith('application/json'))return json({error:'사진은 JPEG로 보내 주세요.'},415);
 if(Number(request.headers.get('content-length')||0)>MAX_PAD_BYTES)return json({error:'사진이 너무 커요.'},413);
 if(!floatLimit(token)||!addressLimit(clientAddress(request)))return json({error:'잠시 쉬었다가 1분 뒤에 다시 띄워볼까요?'},429);
 if(type.startsWith('application/json'))return floatText(request,store,token);
 try{
  const found=await member(store,token);if(!found)return notMember();
  const body=new Uint8Array(await request.arrayBuffer());if(body.length>MAX_PAD_BYTES)return json({error:'사진이 너무 커요.'},413);
  const clean=cleanJpeg(body);if(!clean)return json({error:'사진을 읽지 못했어요. 다른 사진으로 해볼까요?'},400);
  const pad=await store.addPad({cohortId:found.cohort.id,participantId:found.participant.id,photo:clean.bytes});
  return json({pad:padsFor([pad],found.participant.id)[0]},201);
 }catch(e){return e instanceof TooManyPads?tooMany():unavailable();}
}
/** Takes down one of the member's own pads, photo and all. */
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();if(!store)return closed();
 const token=bearer(request);if(!token)return noToken();
 if(!lookLimit(token)||!addressLimit(clientAddress(request)))return json({error:'잠시 뒤에 다시 해볼게요.'},429);
 const id=new URL(request.url).searchParams.get('id');if(!validPadId(id))return noPad();
 try{
  const found=await member(store,token);if(!found)return notMember();
  const pad=await store.pad(id);if(!pad||pad.participantId!==found.participant.id)return noPad();
  await store.removePad(pad);return json({ok:true});
 }catch{return unavailable();}
}
