import {parsePlaceQuery,searchPlaces,PlaceError} from '@/lib/places';
import {isSameOrigin} from '@/lib/request-origin';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const limits=new Map<string,{count:number;start:number}>();
// Best-effort per-instance protection, like the chat route. Locations are never logged or stored.
function allow(who:string,max=20){const now=Date.now();for(const [k,v] of limits)if(now-v.start>60000)limits.delete(k);const l=limits.get(who)??{count:0,start:now};if(l.count>=max)return false;l.count++;limits.set(who,l);return true;}
export async function GET(){return json({configured:!!process.env.KAKAO_REST_API_KEY});}
// POST keeps the coarse location out of URLs and request logs.
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON 요청이 필요해요.'},415);
 const body=await request.text();if(body.length>400)return json({error:'요청이 너무 길어요.'},413);
 let query;try{query=parsePlaceQuery(JSON.parse(body));}catch{query=null;}
 if(query==='outside')return json({error:'지금은 한국 안의 장소만 찾을 수 있어요.',code:'outside'},400);
 if(!query)return json({error:'찾을 곳을 다시 골라 주세요.',code:'invalid'},400);
 const key=process.env.KAKAO_REST_API_KEY;if(!key)return json({error:'장소 검색을 준비하고 있어요. 지도 앱에서 찾아볼 수 있어요.',code:'not_configured'},503);
 const who=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'instance';
 if(!allow(who))return json({error:'잠시 쉬었다가 1분 뒤에 다시 찾아봐요.',code:'limited'},429);
 try{return json(await searchPlaces(query,key));}
 catch(e){const notFound=e instanceof PlaceError&&e.code==='not_found';return json({error:notFound?'그 이름으로는 동네를 찾지 못했어요. 역이나 동 이름으로 적어볼까요?':'지금은 장소를 찾기 어려워요. 지도 앱에서 찾아볼 수 있어요.',code:notFound?'not_found':'unavailable'},notFound?404:502);}
}
