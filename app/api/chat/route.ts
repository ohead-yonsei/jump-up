import {validateChat,validateHints,generateReply,generateTeamReply,generateTeamHints,teamServerFromEnv,warmTeamServer} from '@/lib/chat-service';
import {isSameOrigin} from '@/lib/request-origin';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// The team's own model server wins when configured; OpenAI stays as an optional fallback.
const config=()=>({team:teamServerFromEnv(process.env),OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL});
const provider=()=>{const c=config();return c.team?'team':c.OPENAI_API_KEY?'openai':null;};
const limits=new Map<string,{count:number;start:number}>();const hintLimits=new Map<string,{count:number;start:number}>();
// Best-effort per-instance protection. Shared rate limiting is needed for public AI traffic.
function allow(map:typeof limits,who:string,max:number){const now=Date.now();for(const [k,v] of map)if(now-v.start>60000)map.delete(k);const l=map.get(who)??{count:0,start:now};if(l.count>=max)return false;l.count++;map.set(who,l);return true;}
export async function GET(request:Request){
 const kind=provider();const team=config().team;
 if(kind==='team'&&team&&new URL(request.url).searchParams.get('warm')==='1'){let ready=false;try{ready=await warmTeamServer(team);}catch{}return json({configured:true,provider:kind,ready});}
 return json({configured:!!kind,provider:kind,mode:kind?'live':'example'});
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return json({error:'허용되지 않은 요청이에요.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON 요청이 필요해요.'},415);
 const body=await request.text();if(body.length>14000)return json({error:'대화가 너무 길어요. 새 연습을 시작해 주세요.'},413);
 const who=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'instance';
 if(new URL(request.url).searchParams.get('hints')==='1'){
  let input;try{input=validateHints(JSON.parse(body));}catch{return json({hints:[]},400);}
  const team=config().team;if(!input)return json({hints:[]},400);if(!team)return json({hints:[]});
  if(!allow(hintLimits,who,20))return json({hints:[]},429);
  try{return json({hints:await generateTeamHints(input,team)});}catch{return json({hints:[],code:'unavailable'},502);}
 }
 let input;try{input=validateChat(JSON.parse(body));}catch{return json({error:'입력을 확인해 주세요.'},400);}
 if(!input)return json({error:'입력을 확인해 주세요.'},400);
 const {team,OPENAI_API_KEY:key,OPENAI_MODEL:model}=config();if(!team&&!key)return json({error:'AI 연결을 준비 중이에요. 예시 대화로 연습할 수 있어요.',code:'not_configured'},503);
 if(!allow(limits,who,12))return json({error:'잠시 쉬었다가 1분 뒤에 다시 해볼까요?'},429);
 try{return json({...(team?await generateTeamReply(input,team):await generateReply(input,key!,model??'gpt-4o-mini')),mode:'live'});}catch{return json({error:'지금은 AI 답변을 받기 어려워요. 예시 대화로 이어갈게요.',code:'unavailable'},502);}
}
