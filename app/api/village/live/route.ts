import {storeFromEnv} from '@/lib/cohort-store';
import {sha256,bearer,json,readJson,rateLimiter,liveFor} from '@/lib/cohort-server';
import {isSameOrigin} from '@/lib/request-origin';
import {cleanMove,LIVE_STALE_MS,type Move} from '@/lib/village-map';
export const dynamic='force-dynamic';
export const runtime='nodejs';
// Local development only: where each member's frog is right now, kept in this process's memory and never written anywhere.
// A deployment uses Supabase Realtime instead (see liveFor), because serverless instances do not share memory.
const rooms=new Map<string,Map<string,Move&{at:number}>>();
const limit=rateLimiter(240);
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 const store=await storeFromEnv();const token=bearer(request);if(!store||!token)return json({error:'기수 참여 정보가 없어요.'},401);
 if(!limit(token))return json({moves:[]},429);
 const input=await readJson(request,200);if('error' in input)return input.error;
 try{
  const found=await store.participantByToken(sha256(token));if(!found)return json({error:'기수 참여 정보를 찾지 못했어요.'},404);
  if(liveFor(found.cohort.id)?.kind!=='poll')return json({error:'여기서는 쓰지 않는 길이에요.'},404);
  const me=found.participant.id,now=Date.now();const room=rooms.get(found.cohort.id)??new Map<string,Move&{at:number}>();rooms.set(found.cohort.id,room);
  const move=cleanMove({...(input.value as object|null),id:me});if(move)room.set(me,{...move,at:now});
  for(const [id,m] of room)if(now-m.at>LIVE_STALE_MS)room.delete(id);
  return json({moves:[...room.values()].filter(m=>m.id!==me).map(({id,x,y})=>({id,x,y}))});
 }catch{return json({moves:[]},502);}
}
