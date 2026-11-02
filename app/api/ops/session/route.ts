import {cookies} from 'next/headers';
import {storeFromEnv} from '@/lib/cohort-store';
import {normalizeCode,validOperatorCode} from '@/lib/cohort';
import {sha256,sameSecret,opsKey,signSession,json,readJson,secureRequest,clientAddress,rateLimiter,OPS_COOKIE,OPS_SESSION_SECONDS,type OpsSession} from '@/lib/cohort-server';
import {isSameOrigin} from '@/lib/request-origin';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const loginLimit=rateLimiter(10);
/** Signs in with the team's admin key (every cohort) or a cohort's operator code (that cohort only). */
export async function POST(request:Request){
 const key=opsKey(process.env);const store=await storeFromEnv();
 if(!key||!store)return json({error:'운영자 화면이 아직 설정되지 않았어요. README의 기수 운영 안내를 확인해 주세요.'},503);
 const input=await readJson(request,500);if('error' in input)return input.error;
 if(!loginLimit(clientAddress(request)))return json({error:'잠시 쉬었다가 1분 뒤에 다시 해볼까요?'},429);
 const code=typeof (input.value as {code?:unknown}).code==='string'?((input.value as {code:string}).code).trim():'';
 let session:OpsSession|null=null;
 if(code&&sameSecret(code,key))session={role:'admin'};
 else{const operator=normalizeCode(code);if(validOperatorCode(operator)){try{const cohort=await store.cohortByOperatorHash(sha256(operator));if(cohort)session={role:'operator',cohortId:cohort.id};}catch{return json({error:'지금은 확인하기 어려워요. 잠시 후 다시 시도해 주세요.'},502);}}}
 if(!session)return json({error:'코드가 맞지 않아요. 다시 확인해 주세요.'},401);
 (await cookies()).set(OPS_COOKIE,signSession(session,key),{httpOnly:true,sameSite:'strict',secure:secureRequest(request),path:'/',maxAge:OPS_SESSION_SECONDS});
 return json({ok:true,role:session.role});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 (await cookies()).delete(OPS_COOKIE);return json({ok:true});
}
