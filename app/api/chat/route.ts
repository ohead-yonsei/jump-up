import {validateChat,generateReply} from '@/lib/chat-service';
import {isSameOrigin} from '@/lib/request-origin';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const config=()=>({OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL});
const limits=new Map<string,{count:number;start:number}>();
export async function GET(){return json({configured:!!config().OPENAI_API_KEY,mode:config().OPENAI_API_KEY?'live':'example'});}
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON 요청이 필요해요.'},415);
 const body=await request.text();if(body.length>14000)return json({error:'대화가 너무 길어요. 새 연습을 시작해 주세요.'},413);
 let input;try{input=validateChat(JSON.parse(body));}catch{return json({error:'입력을 확인해 주세요.'},400);}
 if(!input)return json({error:'입력을 확인해 주세요.'},400);
 const {OPENAI_API_KEY:key,OPENAI_MODEL:model}=config();if(!key)return json({error:'AI 연결을 준비 중이에요. 예시 대화로 연습할 수 있어요.',code:'not_configured'},503);
 // Best-effort per-instance protection. Shared rate limiting is needed for public AI traffic.
 const who=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'instance';const now=Date.now();
 for(const [k,v] of limits)if(now-v.start>60000)limits.delete(k);
 const limit=limits.get(who)??{count:0,start:now};if(limit.count>=12)return json({error:'잠시 쉬었다가 1분 뒤에 다시 해볼까요?'},429);limit.count++;limits.set(who,limit);
 try{return json({...await generateReply(input,key,model??'gpt-4o-mini'),mode:'live'});}catch{return json({error:'지금은 AI 답변을 받기 어려워요. 다시 시도하거나 예시 대화로 시작할 수 있어요.',code:'unavailable'},502);}
}
