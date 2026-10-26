'use client';
import {useEffect,useImperativeHandle,useRef,useState,type Ref} from 'react';
import type {Character,CharacterGame} from '@/lib/character';
import type {FrogStage,Framing,Reaction} from '@/lib/frog-scene';
import {FrogAvatar} from './frog-avatar';
export type Frog3DHandle={react:(kind:Reaction,line?:string)=>void};
type Props={character:Character;equipped?:CharacterGame['equipped'];framing?:Framing;interactive?:boolean;lines?:string[];className?:string;ref?:Ref<Frog3DHandle>;onReact?:(kind:Reaction)=>void};
type Burst={id:number;x:number;y:number;kind:Reaction};
const defaultLines:Record<Reaction,string[]>={jump:['폴짝!','하나, 둘, 폴짝!','오늘도 폴짝'],pat:['헤헤, 간지러워','쓰담쓰담 좋아','고마워!'],hug:['꼭 안아줄게','여기 있어줘서 고마워','포옥'],spin:['어때, 잘 어울려?','짜잔!'],cheer:['잘했어, 정말로!','작은 폴짝도 대단해!']};
/** Light vibration on Android; skipped until the person has touched the page, as browsers require. */
export function haptic(pattern:number|number[]=8){try{if((navigator as Navigator&{userActivation?:{isActive:boolean}}).userActivation?.isActive===false)return;navigator.vibrate?.(pattern)}catch{}}
/** Interactive 3D frog. Tap to jump, tap the head to pat, hold to hug, drag sideways to turn. */
export function Frog3D({character,equipped={},framing='full',interactive=true,lines,className='',ref,onReact}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);const box=useRef<HTMLDivElement>(null);const stage=useRef<FrogStage|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'fallback'>('loading');const [bursts,setBursts]=useState<Burst[]>([]);const [bubble,setBubble]=useState<{text:string;id:number}|null>(null);
 const look={color:character.color,equipped};const lookKey=JSON.stringify(look);const latest=useRef({lines,onReact,look});latest.current={lines,onReact,look};
 function celebrate(kind:Reaction,x?:number,y?:number,line?:string,touched=false){
  const r=box.current?.getBoundingClientRect();if(!r)return;const id=Date.now()+Math.random();
  setBursts(b=>[...b.slice(-4),{id,kind,x:x===undefined?r.width/2:x-r.left,y:y===undefined?r.height*.35:y-r.top}]);setTimeout(()=>setBursts(b=>b.filter(i=>i.id!==id)),1300);
  const pool=latest.current.lines??defaultLines[kind];setBubble({text:line??pool[Math.floor(Math.random()*pool.length)],id});setTimeout(()=>setBubble(v=>v?.id===id?null:v),1900);
  if(touched)haptic(kind==='hug'?[10,40,10]:8);latest.current.onReact?.(kind);
 }
 useImperativeHandle(ref,()=>({react(kind,line){stage.current?.react(kind);celebrate(kind,undefined,undefined,line);}}),[]);
 useEffect(()=>{
  let alive=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  import('@/lib/frog-scene').then(({createFrogStage})=>{if(!alive||!canvas.current)return;
   try{stage.current=createFrogStage(canvas.current,{look:latest.current.look,framing,interactive,reducedMotion:reduced,onReact:(kind,x,y)=>celebrate(kind,x,y,undefined,true)});setState('ready');}catch{setState('fallback');}
  }).catch(()=>alive&&setState('fallback'));
  return ()=>{alive=false;stage.current?.dispose();stage.current=null;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[framing,interactive]);
 useEffect(()=>{stage.current?.setLook(JSON.parse(lookKey));},[lookKey]);
 function key(e:React.KeyboardEvent){if(!interactive)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();stage.current?.react('jump');celebrate('jump',undefined,undefined,undefined,true);}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stage.current?.turn(e.key==='ArrowLeft'?-.5:.5);}}
 return <div ref={box} className={'frog3d '+className+' is-'+state} role={interactive?'button':'img'} tabIndex={interactive?0:undefined} onKeyDown={key}
  aria-label={interactive?`${character.name}의 3D 캐릭터. 누르면 폴짝 뛰고, 머리를 누르면 좋아해요. 길게 누르면 안아주고, 옆으로 밀면 돌아봐요.`:`${character.name}의 3D 캐릭터`}>
  <span className="frog3d-shadow" aria-hidden="true"/>
  {state==='fallback'?<FrogAvatar character={character} equipped={equipped}/>:<canvas ref={canvas} aria-hidden="true"/>}
  <div className="frog3d-fx" aria-hidden="true">{bursts.map(b=><span key={b.id} className={'burst burst-'+b.kind} style={{left:b.x,top:b.y}}>{Array.from({length:6},(_,i)=><i key={i} style={{'--a':`${i*60+(b.id%30)}deg`} as React.CSSProperties}>{b.kind==='pat'||b.kind==='hug'?'♥':i%2?'✦':'❀'}</i>)}</span>)}</div>
  {bubble&&<span key={bubble.id} className="frog3d-bubble" role="status">{bubble.text}</span>}
 </div>
}
/** Still 3D render for lists and thumbnails; all thumbnails share one offscreen renderer. */
export function FrogStill({character,equipped={},framing='full',angle,className='',alt=''}:{character:Character;equipped?:CharacterGame['equipped'];framing?:Framing;angle?:number;className?:string;alt?:string}){
 const [src,setSrc]=useState('');const key=JSON.stringify([character.color,equipped,framing,angle]);
 useEffect(()=>{let alive=true;import('@/lib/frog-scene').then(({requestStill})=>requestStill({color:character.color,equipped},{framing,angle,size:framing==='face'?220:280})).then(url=>alive&&setSrc(url),()=>alive&&setSrc('fallback'));return ()=>{alive=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 if(src==='fallback')return <span className={'frog-still '+className}><FrogAvatar character={character} equipped={equipped}/></span>;
 return <span className={'frog-still '+className+(src?' is-ready':'')}>{src&&<img src={src} alt={alt} draggable={false}/>}</span>;
}
