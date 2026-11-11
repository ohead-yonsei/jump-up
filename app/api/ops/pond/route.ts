import {cookies} from 'next/headers';
import {storeFromEnv} from '@/lib/cohort-store';
import {opsKey,readSession,canSee,stillValid,json,readJson,OPS_COOKIE} from '@/lib/cohort-server';
import {validPadId} from '@/lib/pond';
export const dynamic='force-dynamic';
export const runtime='nodejs';
async function session(){const key=opsKey(process.env);return key?readSession((await cookies()).get(OPS_COOKIE)?.value,key):null;}
const unavailable=()=>json({error:'지금은 연잎을 불러오기 어려워요. 잠시 후 다시 시도해 주세요.'},502);
/** One pad's photo, hidden or not, for the team or that cohort's operator. */
export async function GET(request:Request){
 const s=await session();if(!s)return json({error:'다시 로그인해 주세요.'},401);
 const store=await storeFromEnv();if(!store)return json({error:'기수 기능을 준비 중이에요.'},503);
 const id=new URL(request.url).searchParams.get('id');if(!validPadId(id))return json({error:'연잎을 찾지 못했어요.'},404);
 try{
  if(!await stillValid(store,s))return json({error:'운영자 코드가 바뀌었어요. 새 코드로 다시 로그인해 주세요.'},401);
  const pad=await store.pad(id);if(!pad||!canSee(s,pad.cohortId))return json({error:'연잎을 찾지 못했어요.'},404);
  const photo=await store.padPhoto(pad);if(!photo)return json({error:'연잎을 찾지 못했어요.'},404);
  return new Response(new Blob([photo.slice()],{type:'image/jpeg'}),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});
 }catch{return unavailable();}
}
/** Takes a pad down from the cohort's pond, or puts it back. The person who floated it still sees it either way. */
export async function POST(request:Request){
 const s=await session();if(!s)return json({error:'다시 로그인해 주세요.'},401);
 const input=await readJson(request,300);if('error' in input)return input.error;
 const store=await storeFromEnv();if(!store)return json({error:'기수 기능을 준비 중이에요.'},503);
 const v=input.value as {id?:unknown;frog?:unknown;cohort?:unknown;hidden?:unknown};
 if(!(validPadId(v.id)||validPadId(v.frog))||typeof v.hidden!=='boolean')return json({error:'입력을 확인해 주세요.'},400);
 try{
  if(!await stillValid(store,s))return json({error:'운영자 코드가 바뀌었어요. 새 코드로 다시 로그인해 주세요.'},401);
  // A frog is named by its participant id and has to be in a cohort this session may see.
  if(validPadId(v.frog)){
   if(!validPadId(v.cohort)||!canSee(s,v.cohort)||!(await store.cohortFrogs(v.cohort)).some(f=>f.participantId===v.frog))return json({error:'개구리를 찾지 못했어요.'},404);
   await store.setFrogHidden(v.frog,v.hidden);return json({hidden:v.hidden});
  }
  if(!validPadId(v.id))return json({error:'입력을 확인해 주세요.'},400);
  const pad=await store.pad(v.id);if(!pad||!canSee(s,pad.cohortId))return json({error:'연잎을 찾지 못했어요.'},404);
  await store.setPadHidden(pad.id,v.hidden);return json({hidden:v.hidden});
 }catch{return unavailable();}
}
