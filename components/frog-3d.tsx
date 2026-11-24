'use client';
import {useEffect,useImperativeHandle,useRef,useState,type Ref} from 'react';
import type {Character,CharacterGame,Growth} from '@/lib/character';
import type {FrogStage,Framing,Reaction} from '@/lib/frog-scene';
import {FrogAvatar} from './frog-avatar';
import {sfx} from '@/lib/sound';
import {frogSays,touchPool} from '@/lib/frog-lore';
export type Frog3DHandle={react:(kind:Reaction,line?:string)=>void};
type Props={character:Character;equipped?:CharacterGame['equipped'];growth?:Growth;framing?:Framing;interactive?:boolean;lines?:string[];className?:string;ref?:Ref<Frog3DHandle>;onReact?:(kind:Reaction,touched:boolean)=>void;nudge?:boolean};
/** Set once the friend has been touched on this device, so the ‘눌러보세요’ hint is shown only until then. */
const TOUCHED_KEY='poljjak-frog-touched';
type Burst={id:number;x:number;y:number;kind:Reaction};
/** What the friend says when touched lives in lib/frog-lore.ts (`touchLines`), so the words can be read and tested apart from the 3D. A line stays up this long. */
const BUBBLE_MS=2600;
/** Light vibration on Android; skipped until the person has touched the page, as browsers require. */
export function haptic(pattern:number|number[]=8){try{if((navigator as Navigator&{userActivation?:{isActive:boolean}}).userActivation?.isActive===false)return;navigator.vibrate?.(pattern)}catch{}}
/** Interactive 3D frog. Tap to jump, tap the head to pat, hold to hug, drag sideways to turn. */
export function Frog3D({character,equipped={},growth='frog',framing='full',interactive=true,lines,className='',ref,onReact,nudge=false}:Props){
 const [hint,setHint]=useState(false);
 useEffect(()=>{if(!nudge)return;try{setHint(localStorage.getItem(TOUCHED_KEY)!=='1');}catch{setHint(true);}},[nudge]);
 const canvas=useRef<HTMLCanvasElement>(null);const box=useRef<HTMLDivElement>(null);const stage=useRef<FrogStage|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'fallback'>('loading');const [bursts,setBursts]=useState<Burst[]>([]);const [bubble,setBubble]=useState<{text:string;id:number}|null>(null);
 const look={color:character.color,equipped,growth};const lookKey=JSON.stringify(look);const latest=useRef({lines,onReact,look});latest.current={lines,onReact,look};
 function celebrate(kind:Reaction,x?:number,y?:number,line?:string,touched=false){
  const r=box.current?.getBoundingClientRect();if(!r)return;const id=Date.now()+Math.random();
  setBursts(b=>[...b.slice(-4),{id,kind,x:x===undefined?r.width/2:x-r.left,y:y===undefined?r.height*.35:y-r.top}]);setTimeout(()=>setBursts(b=>b.filter(i=>i.id!==id)),1300);
  // A pat on the head sometimes gets a line about the friend's own frog life (lib/frog-lore.ts).
  const own=touched&&kind==='pat'&&!latest.current.lines&&Math.random()<.4?frogSays[latest.current.look.growth??'frog']:null;
  const pool=own??latest.current.lines??touchPool(latest.current.look.growth??'frog',kind);setBubble({text:line??pool[Math.floor(Math.random()*pool.length)],id});setTimeout(()=>setBubble(v=>v?.id===id?null:v),BUBBLE_MS);
  // Only a touch makes a sound: the friend greeting on its own stays quiet, so nothing startles.
  if(touched){haptic(kind==='hug'?[10,40,10]:8);sfx(kind);setHint(false);try{localStorage.setItem(TOUCHED_KEY,'1');}catch{}}latest.current.onReact?.(kind,touched);
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
  {hint&&interactive&&state!=='loading'&&!bubble&&<span className="frog3d-nudge" aria-hidden="true"><i/>톡, 눌러보세요</span>}
 </div>
}
/** Still 3D render for lists and thumbnails; all thumbnails share one offscreen renderer. */
export function FrogStill({character,equipped={},growth='frog',framing='full',angle,className='',alt=''}:{character:Character;equipped?:CharacterGame['equipped'];growth?:Growth;framing?:Framing;angle?:number;className?:string;alt?:string}){
 const [src,setSrc]=useState('');const key=JSON.stringify([character.color,equipped,growth,framing,angle]);
 useEffect(()=>{let alive=true;import('@/lib/frog-scene').then(({requestStill})=>requestStill({color:character.color,equipped,growth},{framing,angle,size:framing==='face'?220:280})).then(url=>alive&&setSrc(url),()=>alive&&setSrc('fallback'));return ()=>{alive=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 if(src==='fallback')return <span className={'frog-still '+className}><FrogAvatar character={character} equipped={equipped}/></span>;
 return <span className={'frog-still '+className+(src?' is-ready':'')}>{src&&<img src={src} alt={alt} draggable={false}/>}</span>;
}
