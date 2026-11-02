import {cookies} from 'next/headers';
import {storeFromEnv,DuplicateCode} from '@/lib/cohort-store';
import {validCohortInput,cohortCsv} from '@/lib/cohort';
import {sha256,newJoinCode,newOperatorCode,opsKey,readSession,canSee,json,readJson,OPS_COOKIE} from '@/lib/cohort-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
async function session(){const key=opsKey(process.env);return key?readSession((await cookies()).get(OPS_COOKIE)?.value,key):null;}
const unavailable=()=>json({error:'지금은 기수 정보를 불러오기 어려워요. 잠시 후 다시 시도해 주세요.'},502);
/** Downloads one cohort's records as CSV, for the team or that cohort's operator. */
export async function GET(request:Request){
 const s=await session();if(!s)return json({error:'다시 로그인해 주세요.'},401);
 const id=new URL(request.url).searchParams.get('id')??'';if(!canSee(s,id))return json({error:'이 기수를 볼 수 없어요.'},403);
 const store=await storeFromEnv();if(!store)return json({error:'기수 기능을 준비 중이에요.'},503);
 try{
  const cohort=await store.cohort(id);if(!cohort)return json({error:'기수를 찾지 못했어요.'},404);
  return new Response(cohortCsv(await store.cohortRecords(id)),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="poljjak-cohort-${cohort.joinCode}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return unavailable();}
}
/** Team only: opens a cohort, or issues a new operator code when the old one is lost. Codes are shown once. */
export async function POST(request:Request){
 const s=await session();if(!s)return json({error:'다시 로그인해 주세요.'},401);if(s.role!=='admin')return json({error:'팀 관리자만 할 수 있어요.'},403);
 const input=await readJson(request,1000);if('error' in input)return input.error;
 const store=await storeFromEnv();if(!store)return json({error:'기수 기능을 준비 중이에요.'},503);
 const v=input.value as {action?:unknown;id?:unknown};
 try{
  if(v.action==='create'){
   const cohort=validCohortInput(v);if(!cohort)return json({error:'기수 이름(40자까지)과 기간을 확인해 주세요.'},400);
   for(let attempt=0;attempt<3;attempt++){const joinCode=newJoinCode(),operatorCode=newOperatorCode();
    try{const created=await store.createCohort({...cohort,joinCode,operatorHash:sha256(operatorCode)});return json({cohort:created,joinCode,operatorCode});}
    catch(e){if(!(e instanceof DuplicateCode))throw e;}}
   return unavailable();
  }
  if(v.action==='rotate'&&typeof v.id==='string'){
   if(!await store.cohort(v.id))return json({error:'기수를 찾지 못했어요.'},404);
   const operatorCode=newOperatorCode();await store.setOperatorHash(v.id,sha256(operatorCode));return json({operatorCode});
  }
  return json({error:'입력을 확인해 주세요.'},400);
 }catch{return unavailable();}
}
