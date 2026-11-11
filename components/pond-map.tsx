'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {POND,SPEED,MAX_SHOWN,LIVE_STALE_MS,KEEPER,step,approach,strollAt,padSpot,pickShown,clampToVillage,inPond,type Point,type Move} from '@/lib/village-map';
import type {PondScene} from '@/lib/pond-scene';
import type {FrogView,PadView,FrogCard} from '@/lib/pond';
import {joinLive,type Live,type LiveLink} from './pond-live';
type Near={kind:'frog';frog:FrogView}|{kind:'pad';pad:PadView}|{kind:'keeper'};
const REACH=84;const PANORAMA='/art/pond-village-pano.webp';
/** The village as a small 3D world: a pond with grass around it. The member steers their own frog (joystick, a tap on the ground,
 * or the arrow keys) and turns the view by dragging across the screen,
 * among the frogs that came by today, the floating pads and the village keeper. Frogs whose owners are here right now move as they
 * steer; the others drift on their own. Both look the same, so the pond does not say who is online.
 * lib/pond-scene.ts draws it; this component decides who is where each frame and keeps the name labels (real buttons) over the canvas. */
export function PondMap({frogs,pads,mine,showFrog,live,token,busy,picture,onOpen,onUnknown,onMoved}:{frogs:FrogView[];pads:PadView[];mine:FrogCard|null;showFrog:boolean;live:Live|null;token:string;busy:boolean;
 picture:(card:FrogCard,angle:number)=>Promise<string>;onOpen:(near:Near)=>void;onUnknown:()=>void;onMoved?:()=>void}){
 const viewRef=useRef<HTMLDivElement>(null);const canvasRef=useRef<HTMLCanvasElement>(null);const stickRef=useRef<HTMLDivElement>(null);const knobRef=useRef<HTMLSpanElement>(null);
 const sceneRef=useRef<PondScene|null>(null);const [ready,setReady]=useState(false);const [failed,setFailed]=useState(false);
 const labels=useRef(new Map<string,HTMLElement>());const spots=useRef(new Map<string,Point>());const liveAt=useRef(new Map<string,Move&{at:number}>());
 const myFrog=frogs.find(f=>f.mine);const myId=showFrog&&myFrog&&!myFrog.hidden?myFrog.id:null;
 const others=useMemo(()=>frogs.filter(f=>!f.mine),[frogs]);const othersRef=useRef(others);othersRef.current=others;
 const padSpots=useMemo(()=>pads.map((p,i)=>({pad:p,...padSpot(p.id,i)})),[pads]);const padSpotsRef=useRef(padSpots);padSpotsRef.current=padSpots;
 const me=useRef<Point|null>(null);const dir=useRef<Point>({x:0,y:0});const keys=useRef(new Set<string>());const goal=useRef<Point|null>(null);const movedRef=useRef(false);
 const [shown,setShown]=useState<string[]>([]);const [near,setNear]=useState<Near|null>(null);
 const unknownAt=useRef(0);const onUnknownRef=useRef(onUnknown);onUnknownRef.current=onUnknown;const onMovedRef=useRef(onMoved);onMovedRef.current=onMoved;const onOpenRef=useRef(onOpen);onOpenRef.current=onOpen;
 const setLabel=(id:string)=>(el:HTMLElement|null)=>{if(el)labels.current.set(id,el);else labels.current.delete(id);};
 // Live channel: hear where the others are, and say where this frog is (only when its owner chose to show it).
 const link=useRef<LiveLink|null>(null);
 useEffect(()=>{if(!live)return;const l=joinLive(live,token,myId,m=>{liveAt.current.set(m.id,{...m,at:Date.now()});
   if(!othersRef.current.some(f=>f.id===m.id)&&Date.now()-unknownAt.current>20000){unknownAt.current=Date.now();onUnknownRef.current();}});
  link.current=l;return()=>{l.leave();link.current=null;};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[live?.kind,live&&'topic' in live?live.topic:'',token,myId]);
 // The 3D scene loads on its own so the rest of the app does not wait for it.
 useEffect(()=>{const canvas=canvasRef.current,view=viewRef.current;if(!canvas||!view)return;let gone=false;let scene:PondScene|null=null;let ro:ResizeObserver|null=null;
  import('@/lib/pond-scene').then(({createPondScene})=>{if(gone)return;
   try{scene=createPondScene(canvas,{panorama:PANORAMA,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches});}catch{setFailed(true);return;}
   sceneRef.current=scene;ro=new ResizeObserver(()=>scene?.resize());ro.observe(view);setReady(true);}).catch(()=>setFailed(true));
  return()=>{gone=true;ro?.disconnect();sceneRef.current=null;scene?.dispose();};},[]);
 // Which frogs and pads the scene holds.
 const shownSet=useMemo(()=>new Set(shown),[shown]);const drawn=useMemo(()=>others.filter(f=>shownSet.has(f.id)),[others,shownSet]);
 const pictureRef=useRef(picture);pictureRef.current=picture;const jobs=useRef<{id:string;key:string;card:FrogCard;face:number}[]>([]);const drawing=useRef(false);const had=useRef(new Map<string,string>());
 useEffect(()=>{const scene=sceneRef.current;if(!ready||!scene)return;
  const want=new Map<string,FrogCard|null>([['me',mine],[KEEPER.id,KEEPER.card],...drawn.map(f=>[f.id,f] as [string,FrogCard])]);
  for(const id of [...had.current.keys()])if(!want.has(id)){scene.removeFrog(id);had.current.delete(id);spots.current.delete(id);}
  for(const [id,card] of want){const key=card?JSON.stringify([card.color,card.growth,card.equipped]):'-';if(had.current.get(id)===key)continue;had.current.set(id,key);
   scene.removeFrog(id);scene.addFrog(id,!card);
   if(card)for(let i=0;i<8;i++)jobs.current.push({id,key,card,face:i});}
  // Pictures are drawn one at a time: every frog's front first so all of them show up quickly, then the other seven directions
  // frog by frog (drawing the same frog in a row is much cheaper than switching between frogs).
  if(!drawing.current){drawing.current=true;(async()=>{
   for(;;){const list=jobs.current;if(!list.length||sceneRef.current!==scene)break;const at=Math.max(0,list.findIndex(j=>j.face===0));const [job]=list.splice(at,1);
    if(had.current.get(job.id)!==job.key)continue;
    try{const url=await pictureRef.current(job.card,job.face*Math.PI/4);if(sceneRef.current===scene&&had.current.get(job.id)===job.key)scene.setFace(job.id,job.face,url);}catch{}}
   drawing.current=false;})();}
  scene.place(KEEPER.id,KEEPER.spot,false,inPond(KEEPER.spot));
 },[ready,drawn,mine]);
 useEffect(()=>{if(ready)sceneRef.current?.setPads(padSpots.map(s=>({id:s.pad.id,x:s.x,y:s.y,faded:s.pad.hidden})));},[ready,padSpots]);
 useEffect(()=>{if(ready)sceneRef.current?.highlight(near?.kind==='pad'?'pad:'+near.pad.id:'');},[ready,near]);
 useEffect(()=>{
  if(!ready)return;const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // I start where the others already see my frog drifting, so it does not jump for them when I arrive.
  if(!me.current||(myId&&!movedRef.current))me.current=myId?(({x,y})=>({x,y}))(strollAt(myId,Date.now(),still)):{x:POND.cx,y:POND.cy+190};
  let raf=0,last=performance.now(),sentAt=0,sentPos:Point={x:-1,y:-1},pickAt=0,nearKey='';
  const frame=(now:number)=>{
   raf=requestAnimationFrame(frame);const scene=sceneRef.current;if(!scene||document.hidden)return;
   const dt=Math.min(.05,(now-last)/1000);last=now;const clock=Date.now();
   // My frog: joystick or keys first, otherwise swim to the place that was tapped.
   const k=keys.current,kd={x:(k.has('right')?1:0)-(k.has('left')?1:0),y:(k.has('down')?1:0)-(k.has('up')?1:0)};
   if(k.has('turn-left'))scene.turn(-1.6*dt);if(k.has('turn-right'))scene.turn(1.6*dt);
   // The joystick is read from where the camera stands: up is always away from the viewer.
   const raw=dir.current.x||dir.current.y?dir.current:kd,yaw=scene.yaw(),cs=Math.cos(yaw),sn=Math.sin(yaw);const d={x:raw.x*cs+raw.y*sn,y:-raw.x*sn+raw.y*cs};let p=me.current!;let moving=false;
   if(d.x||d.y){goal.current=null;const n=step(p,d,dt);moving=n.x!==p.x||n.y!==p.y;p=n;}
   else if(goal.current){const n=approach(p,goal.current,dt);moving=n.x!==p.x||n.y!==p.y;p=n;if(!moving)goal.current=null;}
   me.current=p;scene.place('me',p,moving,inPond(p));scene.follow(p);if(moving&&!movedRef.current){movedRef.current=true;onMovedRef.current?.();}
   // Say where I am: a few times a second while moving, and every few seconds while resting so the others keep seeing me here.
   const changed=sentPos.x!==p.x||sentPos.y!==p.y;
   if(link.current&&myId&&((changed&&clock-sentAt>(moving?330:120))||clock-sentAt>3000)){sentAt=clock;sentPos={...p};link.current.send(p);}
   // The others: where their owner last steered them if that was moments ago, otherwise their own drift.
   for(const f of othersRef.current){if(!had.current.has(f.id))continue;
    const heard=liveAt.current.get(f.id);const fresh=heard&&clock-heard.at<LIVE_STALE_MS;const want=fresh?heard:strollAt(f.id,clock,still);
    const at=spots.current.get(f.id);const n=at?approach(at,want,dt,SPEED*1.25):{x:want.x,y:want.y};const mv=!!at&&(Math.abs(n.x-at.x)+Math.abs(n.y-at.y))>.02;
    spots.current.set(f.id,n);scene.place(f.id,n,mv,inPond(n));}
   scene.render(now/1000);
   // Name labels sit over the canvas, above each head.
   for(const [id,el] of labels.current){const at=scene.labelAt(id);
    if(!at){el.style.visibility='hidden';continue;}el.style.visibility='visible';el.style.transform=`translate3d(${at.x.toFixed(1)}px,${at.y.toFixed(1)}px,0) translate(-50%,-100%) scale(${at.scale.toFixed(3)})`;el.style.zIndex=String(Math.round(at.scale*100));}
   if(clock-pickAt>500){pickAt=clock;
    const liveNow=othersRef.current.filter(f=>{const h=liveAt.current.get(f.id);return h&&clock-h.at<LIVE_STALE_MS;}).map(f=>({id:f.id,...(spots.current.get(f.id)??liveAt.current.get(f.id)!)}));
    const next=pickShown(p,liveNow,othersRef.current.map(f=>f.id),MAX_SHOWN);setShown(s=>s.length===next.length&&s.every((id,i)=>id===next[i])?s:next);
    // What is close enough to greet or open.
    let best:Near|null=null,bestD=REACH;const dist=(q:Point)=>Math.hypot(q.x-p.x,q.y-p.y);
    for(const f of othersRef.current){const s=spots.current.get(f.id);if(!s||!had.current.has(f.id))continue;const dd=dist(s);if(dd<bestD){bestD=dd;best={kind:'frog',frog:f};}}
    for(const s of padSpotsRef.current){const dd=dist(s);if(dd<bestD){bestD=dd;best={kind:'pad',pad:s.pad};}}
    if(dist(KEEPER.spot)<bestD)best={kind:'keeper'};
    const key=!best?'':best.kind==='frog'?'f'+best.frog.id:best.kind==='pad'?'p'+best.pad.id:'k';if(key!==nearKey){nearKey=key;setNear(best);}
   }
  };
  raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
 },[ready,myId]);
 // Joystick: drag from the pad; the knob follows the finger and the frog goes that way.
 function stick(e:React.PointerEvent){const pad=stickRef.current;if(!pad)return;
  if(e.type==='pointerdown'){pad.setPointerCapture(e.pointerId);}else if(!pad.hasPointerCapture(e.pointerId))return;
  if(e.type==='pointerup'||e.type==='pointercancel'){dir.current={x:0,y:0};if(knobRef.current)knobRef.current.style.transform='';return;}
  const r=pad.getBoundingClientRect(),max=r.width/2-14;let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);const len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max;}
  dir.current=len<6?{x:0,y:0}:{x:x/max,y:y/max};if(knobRef.current)knobRef.current.style.transform=`translate(${x}px,${y}px)`;e.preventDefault();}
 // A tap on a frog or a pad opens it; a tap on the ground goes there; a drag across the screen turns the view.
 const down=useRef<{x:number;y:number;last:number;dragged:boolean}|null>(null);
 function tap(e:React.PointerEvent){
  if(e.type==='pointerdown'){down.current={x:e.clientX,y:e.clientY,last:e.clientX,dragged:false};(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);return;}
  const from=down.current;const scene=sceneRef.current;if(!from||!scene)return;
  if(e.type==='pointermove'){if(!from.dragged&&Math.abs(e.clientX-from.x)>10)from.dragged=true;if(from.dragged){scene.turn(-(e.clientX-from.last)*.008);from.last=e.clientX;if(!movedRef.current){movedRef.current=true;onMovedRef.current?.();}}return;}
  down.current=null;if(e.type==='pointercancel'||from.dragged||Math.hypot(e.clientX-from.x,e.clientY-from.y)>10)return;
  const hit=scene.pick(e.clientX,e.clientY);if(!hit)return;
  if(hit.kind==='ground'){goal.current=clampToVillage(hit.point);return;}
  if(hit.kind==='pad'){const s=padSpotsRef.current.find(s=>s.pad.id===hit.id);if(s)onOpenRef.current({kind:'pad',pad:s.pad});return;}
  if(hit.id===KEEPER.id)onOpenRef.current({kind:'keeper'});else if(hit.id==='me'){if(myFrog)onOpenRef.current({kind:'frog',frog:myFrog});}
  else{const f=othersRef.current.find(f=>f.id===hit.id);if(f)onOpenRef.current({kind:'frog',frog:f});}}
 const keyName=(k:string)=>({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',q:'turn-left',e:'turn-right'} as Record<string,string>)[k];
 const onKey=(e:React.KeyboardEvent,on:boolean)=>{if(e.target!==e.currentTarget)return;const n=keyName(e.key);if(!n)return;e.preventDefault();if(on)keys.current.add(n);else keys.current.delete(n);};
 const nearLabel=!near?'':near.kind==='frog'?`${near.frog.name}에게 인사하기`:near.kind==='pad'?(near.pad.kind==='text'?'글 연잎 읽기':'사진 연잎 보기'):`${KEEPER.name}에게 말 걸기`;
 const padName=(p:PadView)=>p.kind==='text'?`글 연잎: ${p.text}`:'사진 연잎';
 return <div ref={viewRef} className="pond-map" tabIndex={0} role="application" aria-label="연못 마을. 방향키나 조이스틱으로 내 개구리를 움직이고, Q와 E로 시야를 돌려요. 탭 키로 개구리와 연잎을 하나씩 살펴볼 수 있어요."
  onKeyDown={e=>onKey(e,true)} onKeyUp={e=>onKey(e,false)} onBlur={()=>keys.current.clear()}>
  <canvas ref={canvasRef} className="pond-canvas" aria-hidden="true" onPointerDown={tap} onPointerMove={tap} onPointerUp={tap} onPointerCancel={tap}/>
  {failed&&<p className="pond-quiet map-failed">이 기기에서는 연못 그림을 그리지 못했어요. 아래 목록에서 개구리와 연잎을 열어볼 수 있어요.</p>}
  <div className={'map-labels'+(failed?' as-list':'')}>
   <button ref={setLabel(KEEPER.id)} type="button" className="village-name keeper-name world-label" aria-label={`${KEEPER.name}, 마을에 사는 개구리`} onClick={()=>onOpen({kind:'keeper'})}>{KEEPER.name}</button>
   {drawn.map(f=><button key={f.id} ref={setLabel(f.id)} type="button" className="village-name world-label" aria-label={`${f.name}, 오늘 다녀간 개구리`} onClick={()=>onOpen({kind:'frog',frog:f})}>{f.name}</button>)}
   {mine&&<button ref={setLabel('me')} type="button" className="village-name world-label is-me" aria-label={`${mine.name}, 내 개구리${showFrog?'':'. 다른 사람에게는 보이지 않아요'}`} onClick={()=>myFrog&&onOpen({kind:'frog',frog:myFrog})}>{mine.name}</button>}
  </div>
  {/* The pads are drawn in 3D; this list gives each one a real button for screen readers and keyboards. */}
  <ul className={failed?'map-pad-list':'sr-only'} aria-label="연못에 떠 있는 연잎">{pads.map(p=><li key={p.id}><button type="button" onClick={()=>onOpen({kind:'pad',pad:p})}>{padName(p)}{p.mine?', 내 연잎':''}</button></li>)}</ul>
  {near&&<button type="button" className="map-near" disabled={busy} onClick={()=>onOpen(near)}>{nearLabel}<ArrowRight size={15}/></button>}
  <div ref={stickRef} className="map-stick" aria-hidden="true" onPointerDown={stick} onPointerMove={stick} onPointerUp={stick} onPointerCancel={stick}><span ref={knobRef}/></div>
 </div>;
}
export type {Near};
