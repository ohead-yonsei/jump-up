import {storeFromEnv} from '@/lib/cohort-store';
import {json,sameSecret,clientAddress,rateLimiter} from '@/lib/cohort-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const limit=rateLimiter(6);
/** Vercel Cron calls this once a day (vercel.json) so a quiet Supabase Free project is not paused. With CRON_SECRET set, only Vercel's call gets through. */
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim();
 if(secret&&!sameSecret(request.headers.get('authorization')??'','Bearer '+secret))return json({error:'허용되지 않은 요청이에요.'},401);
 if(!secret&&!limit(clientAddress(request)))return json({error:'잠시 후 다시 시도해 주세요.'},429);
 const store=await storeFromEnv();if(!store)return json({ok:true,store:'none'});
 try{await store.ping();return json({ok:true,store:store.kind});}
 catch{return json({ok:false,store:store.kind},502);}
}
