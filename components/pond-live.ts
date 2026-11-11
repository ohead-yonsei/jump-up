import {cleanMove,type Move,type Point} from '@/lib/village-map';
export type Live={kind:'realtime';url:string;key:string;topic:string}|{kind:'poll'};
export type LiveLink={send:(p:Point)=>void;leave:()=>void};
/** Joins the cohort's live channel. `id` is this member's frog as the server lists it, or null when they are only looking around:
 * then nothing is sent and they only hear where the others are. Failures are quiet; the map keeps working with strolling frogs. */
export function joinLive(live:Live,token:string,id:string|null,onMove:(m:Move)=>void):LiveLink{
 let gone=false;
 if(live.kind==='poll'){
  let latest:Point|null=null;
  const tick=async()=>{if(gone||document.hidden)return;try{const r=await fetch('/api/village/live',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},cache:'no-store',body:JSON.stringify(id&&latest?latest:{})});if(!r.ok||gone)return;const d=await r.json() as {moves?:unknown[]};for(const m of d.moves??[]){const move=cleanMove(m);if(move)onMove(move);}}catch{}};
  const timer=setInterval(tick,800);void tick();
  return {send:p=>{latest=p;},leave:()=>{gone=true;clearInterval(timer);}};
 }
 let send:(p:Point)=>void=()=>{};let leave=()=>{};
 import('@supabase/realtime-js').then(({RealtimeClient})=>{if(gone)return;
  const client=new RealtimeClient(live.url.replace(/^http/,'ws').replace(/\/$/,'')+'/realtime/v1',{params:{apikey:live.key}});
  const channel=client.channel(live.topic,{config:{broadcast:{self:false}}});
  channel.on('broadcast',{event:'move'},({payload})=>{const move=cleanMove(payload);if(move&&move.id!==id)onMove(move);});
  let ready=false;channel.subscribe(status=>{ready=status==='SUBSCRIBED';});
  send=p=>{if(ready&&id)void channel.send({type:'broadcast',event:'move',payload:{id,x:Math.round(p.x),y:Math.round(p.y)}}).catch(()=>{});};
  leave=()=>{void client.removeChannel(channel);client.disconnect();};
 }).catch(()=>{});
 return {send:p=>send(p),leave:()=>{gone=true;leave();}};
}
