'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {growthStages,type Character,type CharacterGame,type Growth} from '@/lib/character';
import {evolveSound} from '@/lib/croak';
import {haptic} from './frog-3d';
import {josa} from '@/lib/josa';
type Phase='load'|'intro'|'change'|'flash'|'reveal';
// The silhouettes take turns faster and faster, like an evolution in a monster game.
const BEATS=[460,420,380,340,300,260,230,200,170,150,130,110,95,85,75,70,65,60,60,60,60,60];
/** Full-screen moment when the friend grows into its next stage: the old shape glows white, the two shapes take turns,
 * a flash, then the new friend in colour. A tap before the end skips to the new friend; with reduced motion it opens there. */
export function EvolveScene({character,equipped,from,to,onDone}:{character:Character;equipped:CharacterGame['equipped'];from:Growth;to:Growth;onDone:()=>void}){
 const [urls,setUrls]=useState<[string,string]|null>(null);const [phase,setPhase]=useState<Phase>('load');const [showNew,setShowNew]=useState(false);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);const done=useRef<HTMLButtonElement>(null);const onDoneRef=useRef(onDone);onDoneRef.current=onDone;
 const stage=growthStages.find(s=>s.id===to)!;const name=character.name;
 const later=(ms:number,f:()=>void)=>{timers.current.push(setTimeout(f,ms));};
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 const reveal=()=>{clear();setShowNew(true);setPhase('reveal');haptic([10,40,10,40,10]);evolveSound('ding');};
 // Both pictures first, so the two shapes can take turns without a gap. If they do not come, the new friend is shown as it is.
 useEffect(()=>{let alive=true;const look=(g:Growth)=>({color:character.color,equipped,growth:g});
  import('@/lib/frog-scene').then(({requestStill})=>Promise.all([requestStill(look(from),{framing:'full',size:360}),requestStill(look(to),{framing:'full',size:360})]))
   .then(([a,b])=>{if(alive)setUrls([a,b]);},()=>{if(alive){setUrls(['','']);}});
  return ()=>{alive=false;clear();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{if(!urls)return;
  if(!urls[0]||window.matchMedia('(prefers-reduced-motion: reduce)').matches){reveal();return;}
  setPhase('intro');later(1500,()=>{setPhase('change');evolveSound('rise');let at=0;BEATS.forEach((ms,i)=>{at+=ms;later(at,()=>{setShowNew(i%2===0);if(i%4===0)haptic(8);});});
   later(at+250,()=>{setShowNew(true);setPhase('flash');});later(at+750,reveal);});
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[urls]);
 useEffect(()=>{if(phase==='reveal')done.current?.focus();},[phase]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(phase==='reveal')onDoneRef.current();else reveal();}};window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[phase]);
 const lead=from==='egg'?'어?! 알이 흔들려요…!':`어?! ${name}의 모습이…!`;
 const line=`${name}${josa(name,'이','가')} ${stage.name}${josa(stage.name,'으로','로')} 자랐어요!`;
 return createPortal(<div className={'evolve evolve-'+phase} role="dialog" aria-modal="true" aria-label={phase==='reveal'?line:lead} onClick={()=>{if(phase!=='reveal'&&phase!=='load')reveal();}}>
  <div className="evolve-rays" aria-hidden="true"/>
  <div className="evolve-sparks" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--d':`${(i*0.29)%2.6}s`,'--s':`${4+(i*7)%7}px`} as React.CSSProperties}/>)}</div>
  <div className="evolve-frog" aria-hidden="true">
   {urls?.[0]&&<img className={'old'+(showNew?'':' on')} src={urls[0]} alt="" draggable={false}/>}
   {urls?.[1]&&<img className={'new'+(showNew?' on':'')} src={urls[1]} alt="" draggable={false}/>}
  </div>
  <div className="evolve-text" aria-live="polite">
   {phase==='reveal'?<><span>축하해요!</span><h2>{line}</h2><p>{stage.note}</p><button ref={done} className="evolve-ok" onClick={e=>{e.stopPropagation();onDoneRef.current();}}>좋아요</button></>
    :phase==='load'?null:<h2>{lead}</h2>}
  </div>
  <div className="evolve-white" aria-hidden="true"/>
 </div>,document.body);
}
