'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Camera,LoaderCircle,X,EyeOff,ShieldCheck,Users,PenLine,Lock} from 'lucide-react';
import {padLook,PAD_SIDE,PAD_MISSIONS,MAX_PAD_TEXT,CHEERS,type PadView,type FrogView,type FrogCard,type CheerView,type CheerKind} from '@/lib/pond';
import {frogColors,isGrowth,growthOf,wardrobeItems,type Character,type CharacterGame} from '@/lib/character';
import {needsSupport} from '@/lib/content';
import {springMissions} from '@/lib/journey';
import {haptic,FrogStill} from './frog-3d';
import './cohort-pond.css';
const day=(at:string)=>new Date(at).toLocaleDateString('ko-KR',{month:'long',day:'numeric'});
const failed=(e:unknown)=>e instanceof TypeError?'인터넷 연결을 확인해 주세요.':(e as Error).message;
const unreadable='이 사진은 열 수 없어요. 다른 사진으로 해볼까요?';
async function decode(file:File):Promise<{source:CanvasImageSource;w:number;h:number;done:()=>void}>{
 try{const b=await createImageBitmap(file,{imageOrientation:'from-image'});return {source:b,w:b.width,h:b.height,done:()=>b.close()};}catch{}
 const url=URL.createObjectURL(file);const img=new Image();img.src=url;
 try{await img.decode();}catch{URL.revokeObjectURL(url);throw new Error(unreadable);}
 return {source:img,w:img.naturalWidth,h:img.naturalHeight,done:()=>URL.revokeObjectURL(url)};
}
/** Redraws the middle of the photo as a square JPEG on the device. Only pixels are drawn, so EXIF, GPS and the rest stay behind,
 * and what the person sees in the preview is exactly what the cohort sees. */
async function padJpeg(file:File){
 const {source,w,h,done}=await decode(file);
 try{
  const side=Math.min(w,h),out=Math.min(PAD_SIDE,side);if(!side)throw new Error(unreadable);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=out;const ctx=canvas.getContext('2d');if(!ctx)throw new Error(unreadable);
  ctx.drawImage(source,(w-side)/2,(h-side)/2,side,side,0,0,out,out);
  const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',.82));if(!blob)throw new Error(unreadable);
  return blob;
 }finally{done();}
}
/** One lily pad. The leaf turns so each notch points its own way; the photo or the line of text turns back so it stays upright. */
function LilyPad({id,photo,text,size,label,children,onClick}:{id:string;photo?:string;text?:string;size?:number;label:string;children?:React.ReactNode;onClick?:()=>void}){
 const look=padLook(id);const style={'--notch':`${look.notch}deg`,'--size':`${size??look.size}px`} as React.CSSProperties;
 const body=<span className="pad-body" aria-hidden="true"><span className="pad-leaf">{text===undefined&&<span className="pad-photo">{photo?<img src={photo} alt="" draggable={false}/>:<span className="pad-wait"/>}</span>}</span>{text!==undefined&&<span className="pad-words"><span>{text}</span></span>}</span>;
 return onClick?<button type="button" className="pad" style={style} aria-label={label} onClick={onClick}>{body}{children}</button>:<span className="pad" style={style} role="img" aria-label={label}>{body}{children}</span>;
}
const padTitles=new Set(springMissions.filter(m=>PAD_MISSIONS.includes(m.id)).map(m=>m.title));
/** On the home pond, for people in a cohort. Right after a photo mission it asks, gently, whether to float the picture. */
export function PondInvite({justDid,onOpen}:{justDid:string;onOpen:()=>void}){
 const fresh=padTitles.has(justDid);
 return <button className={'pond-invite'+(fresh?' fresh':'')} onClick={onOpen}><span className="pond-invite-art" aria-hidden="true"><span/><span/><span/></span>
  <span className="pond-invite-copy"><span className="step-label">{fresh?'방금 찍은 사진이 있다면':'우리 기수 연못'}</span><strong>{fresh?'연잎 한 장으로 띄워볼까요?':'연못 마을'}</strong><small>{fresh?'같은 기수 사람들만 봐요. 띄우지 않아도 괜찮아요.':'오늘 다녀간 개구리들과 연잎을 구경해요.'}</small></span><ArrowRight size={18}/></button>;
}
/** How this device's frog looks to the cohort, or null before a frog exists. */
export function frogCard(game:CharacterGame):FrogCard|null{
 return game.character?{name:game.character.name,color:game.character.color,growth:growthOf(game).id,equipped:{...game.equipped} as Record<string,string>}:null;
}
/** Another member's frog, drawn only from what this version knows: an unknown colour, stage or item falls back instead of breaking. */
function VillageFrog({card,className}:{card:FrogCard;className?:string}){
 const character:Character={name:card.name,color:frogColors.some(c=>c.id===card.color)?card.color as Character['color']:'leaf'};
 const equipped:CharacterGame['equipped']={};for(const w of wardrobeItems)if(card.equipped[w.slot]===w.id)equipped[w.slot]=w.id;
 return <FrogStill character={character} equipped={equipped} growth={isGrowth(card.growth)?card.growth:'frog'} className={className}/>;
}
const cheerOf=(kind:CheerKind)=>CHEERS.find(c=>c.id===kind)??CHEERS[0];
const SCENE_PADS=24;
type Village={frogs:FrogView[];pads:PadView[];cheers:CheerView[];sent:string[]};
type Open={pad:PadView;frog?:undefined}|{frog:FrogView;pad?:undefined};
/** 연못 마을: the cohort's shared pond. A wide pond to swipe across, with the frogs that came by today and the pads people floated.
 * Pads never say who floated them; a frog shows only when its owner chose to. No counts, no live presence; cheers are set phrases
 * that only the receiver sees. */
export function CohortPond({token,game,showFrog,onShowFrog,draft,onDraftUsed,onToast,onBack,onJoin}:{token:string|null;game:CharacterGame;showFrog:boolean|undefined;onShowFrog:(show:boolean)=>void;draft?:string;onDraftUsed?:()=>void;onToast:(text:string)=>void;onBack:()=>void;onJoin:()=>void}){
 const [village,setVillage]=useState<Village|null>(null);const [photos,setPhotos]=useState<Record<string,string>>({});const owned=useRef<string[]>([]);
 const [error,setError]=useState('');const [picked,setPicked]=useState<{blob:Blob;url:string}|null>(null);const [preparing,setPreparing]=useState(false);const [busy,setBusy]=useState(false);
 const [writing,setWriting]=useState(false);const [text,setText]=useState('');const [more,setMore]=useState(false);
 const [open,setOpen]=useState<Open|null>(null);const [removing,setRemoving]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);const sheetRef=useRef<HTMLDialogElement>(null);const confirmRef=useRef<HTMLElement>(null);
 const mine=frogCard(game);const cardKey=showFrog&&mine?JSON.stringify(mine):'';
 const pads=village?.pads??null;const setPads=(change:(list:PadView[])=>PadView[])=>setVillage(v=>v&&{...v,pads:change(v.pads)});
 const keep=(url:string)=>{owned.current.push(url);return url;};
 useEffect(()=>()=>{for(const url of owned.current)URL.revokeObjectURL(url);},[]);
 // Arriving tells the cohort this frog came by today, and only if its owner said yes; otherwise the visit leaves no frog behind.
 useEffect(()=>{if(!token)return;let stop=false;
  fetch('/api/village',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},cache:'no-store',body:JSON.stringify({card:cardKey?JSON.parse(cardKey):null})}).then(async r=>{const d=await r.json().catch(()=>({})) as Partial<Village>&{error?:string};if(stop)return;if(!r.ok||!d.pads||!d.frogs)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');setVillage({frogs:d.frogs,pads:d.pads,cheers:d.cheers??[],sent:d.sent??[]});setError('');})
   .catch(e=>{if(!stop){setError(failed(e));setVillage(v=>v??{frogs:[],pads:[],cheers:[],sent:[]});}});
  return()=>{stop=true;};},[token,cardKey]);
 // Photos come a few at a time, each with the member's token, and stay on the device for as long as this screen is open.
 useEffect(()=>{if(!token||!pads)return;let stop=false;const want=pads.filter(p=>p.kind==='photo'&&!photos[p.id]).map(p=>p.id);
  const next=async()=>{while(!stop&&want.length){const id=want.shift()!;try{const r=await fetch('/api/pond?id='+id,{headers:{Authorization:'Bearer '+token}});if(!r.ok||stop)continue;const url=keep(URL.createObjectURL(await r.blob()));setPhotos(p=>({...p,[id]:url}));}catch{}}};
  void Promise.all([next(),next(),next()]);return()=>{stop=true;};},[pads,token]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const d=sheetRef.current;if(!d)return;if(open&&!d.open)d.showModal();else if(!open&&d.open)d.close();},[open]);
 useEffect(()=>{if(picked||writing)confirmRef.current?.scrollIntoView({behavior:'smooth',block:'center'});},[picked,writing]);
 // A mission answer the person asked to float arrives as a draft: it is only filled in, and still waits for their yes.
 useEffect(()=>{if(!draft||!token)return;setText([...draft].slice(0,MAX_PAD_TEXT).join(''));setWriting(true);onDraftUsed?.();},[draft,token]);// eslint-disable-line react-hooks/exhaustive-deps
 async function choose(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(!file)return;setError('');setPreparing(true);
  try{const blob=await padJpeg(file);if(picked)URL.revokeObjectURL(picked.url);setWriting(false);setPicked({blob,url:URL.createObjectURL(blob)});}catch(e){setError(failed(e));}finally{setPreparing(false);}}
 function cancel(){if(picked)URL.revokeObjectURL(picked.url);setPicked(null);setWriting(false);setError('');}
 const line=text.replace(/\s+/g,' ').trim();const worried=needsSupport(line);
 async function float(){if(!token||(!picked&&!line)||(!picked&&worried))return;setBusy(true);setError('');
  try{const r=await fetch('/api/pond',picked?{method:'POST',headers:{'Content-Type':'image/jpeg',Authorization:'Bearer '+token},body:picked.blob}:{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text:line})});const d=await r.json().catch(()=>({})) as {pad?:PadView;error?:string};
   if(!r.ok||!d.pad)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   const pad=d.pad;if(picked)setPhotos(p=>({...p,[pad.id]:keep(picked.url)}));setPads(list=>[pad,...list]);setPicked(null);setWriting(false);setText('');haptic([12,60,18]);onToast('연잎 한 장을 띄웠어요. 같은 기수 사람들도 볼 수 있어요.');}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 async function remove(pad:PadView){if(!token)return;setBusy(true);setError('');
  try{const r=await fetch('/api/pond?id='+pad.id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});const d=await r.json().catch(()=>({})) as {error?:string};if(!r.ok&&r.status!==404)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   setPads(list=>list.filter(p=>p.id!==pad.id));setOpen(null);setRemoving(false);onToast(pad.kind==='photo'?'연잎을 내렸어요. 사진도 함께 지웠어요.':'연잎을 내렸어요. 글도 함께 지웠어요.');}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 async function cheer(target:string,kind:CheerKind){if(!token||busy)return;setBusy(true);setError('');
  try{const r=await fetch('/api/village',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({target,kind})});const d=await r.json().catch(()=>({})) as {error?:string};if(!r.ok)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   setVillage(v=>v&&{...v,sent:[...v.sent,target]});haptic(10);onToast(`‘${cheerOf(kind).text}’ 응원을 보냈어요. 받은 사람만 볼 수 있어요.`);}
  catch(e){onToast(failed(e));}finally{setBusy(false);}}
 const heading=<div className="page-heading pond-heading"><button className="text-button pond-back" onClick={onBack}><ArrowLeft size={15}/>기록으로</button><span className="eyebrow">OUR POND VILLAGE</span><h1>연못 마을,<br/>같이 머물러요.</h1><p>오늘 다녀간 개구리들과 연잎을 구경해요. 같은 기수 사람들만 볼 수 있어요.</p></div>;
 if(!token)return <>{heading}<div className="pond-closed"><span className="cohort-icon"><Users size={20}/></span><h3>기수에 함께하면 열리는 연못이에요</h3><p>기관에서 받은 기수 코드로 함께하면, 같은 기수 사람들의 개구리를 만나고 연잎을 나눌 수 있어요.</p><button className="primary" onClick={onJoin}>기수에 함께하기<ArrowRight size={17}/></button></div></>;
 const frogs=village?.frogs??[];const scenePads=(pads??[]).slice(0,SCENE_PADS);const rest=(pads??[]).slice(SCENE_PADS);
 // Frogs and pads take turns along the pond, two rows deep, each nudged by its own id so the pond never reshuffles.
 const spots:({frog:FrogView;pad?:undefined}|{pad:PadView;frog?:undefined})[]=[];for(let i=0;i<Math.max(frogs.length,scenePads.length);i++){if(frogs[i])spots.push({frog:frogs[i]});if(scenePads[i])spots.push({pad:scenePads[i]});}
 const width=Math.max(340,70+Math.ceil(spots.length/2)*124+70);
 const place=(id:string,i:number)=>{const look=padLook(id),row=i%2;return {left:56+Math.floor(i/2)*124+(row?62:0)+look.rise,top:(row?196:66)+look.tilt*2};};
 const padLabel=(p:PadView)=>`${day(p.at)}에 띄운 ${p.kind==='text'?`글 연잎: ${p.text}`:'사진 연잎'}${p.mine?', 내 연잎':''}${p.hidden?', 운영진이 내려둠':''}`;
 const padButton=(p:PadView,size?:number)=><LilyPad id={p.id} photo={photos[p.id]} text={p.kind==='text'?p.text:undefined} size={size} label={padLabel(p)} onClick={()=>{setOpen({pad:p});setRemoving(false);}}>{p.hidden?<span className="pad-tag quiet"><EyeOff size={11}/>내려둠</span>:p.mine?<span className="pad-tag">내 연잎</span>:null}</LilyPad>;
 const target=open?(open.pad?'pad:'+open.pad.id:'frog:'+open.frog.id):'';const isMine=open?(open.pad??open.frog).mine:false;const cheered=!!target&&!!village?.sent.includes(target);
 const composing=!!picked||writing;
 return <>{heading}
  <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={choose}/>
  {showFrog===undefined&&mine&&<section className="village-ask" aria-label="내 개구리 보여주기"><span className="village-ask-frog"><VillageFrog card={mine}/></span>
   <h3>{mine.name}도 마을에 보여줄까요?</h3>
   <ul><li>개구리 이름과 모습이 같은 기수 사람들에게 ‘오늘 다녀간 개구리’로 보여요.</li><li>참여 코드, 기록, 내가 띄운 연잎이 누구 것인지는 보이지 않아요.</li><li>구경만 해도 괜찮고, 아래에서 언제든 바꿀 수 있어요.</li></ul>
   <div className="button-row"><button className="secondary" onClick={()=>onShowFrog(false)}>구경만 할게요</button><button className="primary" onClick={()=>{onShowFrog(true);haptic(10);}}>보여줄게요</button></div></section>}
  <section className="village" aria-label="우리 기수 연못 마을" aria-busy={village===null}>
   <div className="village-scroll" tabIndex={0} role="group" aria-label="연못. 옆으로 밀거나 방향키로 둘러봐요.">
    <ul className="village-water" style={{width}}>
     {spots.map((s,i)=>s.frog?<li key={'f'+s.frog.id} className={'village-spot'+(s.frog.hidden?' is-hidden':'')} style={place(s.frog.id,i)}>
       <button type="button" className={'village-frog'+(s.frog.mine?' mine':'')} aria-label={`${s.frog.name}${s.frog.mine?', 내 개구리':''}${s.frog.hidden?', 운영진이 내려둠':''}`} onClick={()=>setOpen({frog:s.frog})}><span className="village-seat" aria-hidden="true"/><VillageFrog card={s.frog}/><span className="village-name">{s.frog.hidden&&<EyeOff size={10}/>}{s.frog.name}</span></button></li>
      :<li key={'p'+s.pad.id} className={'village-spot pad-spot'+(s.pad.hidden?' is-hidden':'')} style={{...place(s.pad.id,i),'--tilt':`${padLook(s.pad.id).tilt}deg`} as React.CSSProperties}>{padButton(s.pad,84)}</li>)}
    </ul>
   </div>
   {village===null?<p className="pond-quiet" role="status"><LoaderCircle className="spin" size={15}/>연못을 살피고 있어요</p>:!spots.length?<p className="pond-quiet">아직 조용한 연못이에요. 먼저 머물러도, 구경만 해도 괜찮아요.</p>:spots.length>4?<p className="village-hint" aria-hidden="true">옆으로 밀어서 둘러봐요</p>:null}
  </section>
  {!composing&&<div className="village-float"><button className="secondary" disabled={preparing||busy} onClick={()=>fileRef.current?.click()}>{preparing?<LoaderCircle className="spin" size={17}/>:<Camera size={17}/>}사진 연잎</button><button className="secondary" disabled={preparing||busy} onClick={()=>{setError('');setWriting(true);}}><PenLine size={17}/>글 연잎</button></div>}
  {picked&&<section ref={confirmRef} className="pond-confirm" aria-label="연잎 띄우기 확인"><LilyPad id="preview" photo={picked.url} size={168} label="띄울 사진 미리보기"/>
   <h3>이 사진을 우리 기수 연못에 띄울까요?</h3>
   <ul><li>같은 기수 사람들과 기수 운영진이 볼 수 있어요. 누가 띄웠는지는 다른 참여자에게 보이지 않아요.</li><li>사진 속 위치·기기 정보는 지우고, 가운데를 정사각형으로 잘라 올려요.</li><li>얼굴, 이름, 집 주소처럼 나를 알 수 있는 것은 빼는 걸 권해요.</li><li>언제든 내 연잎을 눌러 내릴 수 있어요.</li></ul>
   <div className="button-row"><button className="secondary" disabled={busy} onClick={cancel}>그만두기</button><button className="primary" disabled={busy} onClick={float}>{busy?<LoaderCircle className="spin" size={17}/>:null}연잎 띄우기</button></div></section>}
  {writing&&!picked&&<section ref={confirmRef} className="pond-confirm" aria-label="글 연잎 띄우기"><LilyPad id="preview" text={line||'한 줄'} size={168} label="띄울 글 미리보기"/>
   <h3>연잎에 한 줄을 적어 띄워요</h3>
   <label className="pond-line"><span className="sr-only">연잎에 적을 한 줄</span><input value={text} maxLength={MAX_PAD_TEXT} placeholder="오늘 본 것, 좋았던 것, 한 단어도 좋아요" enterKeyHint="done" onChange={e=>setText(e.target.value)}/><small aria-hidden="true">{[...line].length}/{MAX_PAD_TEXT}</small></label>
   {worried?<div className="pond-support" role="note"><p>이 글은 연못에 띄우지 않아요. 지금 많이 힘들다면 혼자 견디지 않아도 괜찮아요. 109에서는 24시간 이야기할 수 있어요.</p><a className="secondary" href="tel:109">109 상담전화</a></div>
    :<ul><li>같은 기수 사람들과 기수 운영진이 볼 수 있어요. 누가 띄웠는지는 다른 참여자에게 보이지 않아요.</li><li>이름, 연락처, 집 주소처럼 나를 알 수 있는 것은 빼는 걸 권해요.</li><li>언제든 내 연잎을 눌러 내릴 수 있어요.</li></ul>}
   <div className="button-row"><button className="secondary" disabled={busy} onClick={cancel}>그만두기</button><button className="primary" disabled={busy||!line||worried} onClick={float}>{busy?<LoaderCircle className="spin" size={17}/>:null}연잎 띄우기</button></div></section>}
  {error&&<p className="error pond-error" role="alert">{error}</p>}
  {!!village?.cheers.length&&<section className="village-cheers" aria-label="내게 온 응원"><div className="village-cheers-top"><h3>내게 온 응원</h3><span><Lock size={11}/>나만 봐요</span></div>
   <ul>{village.cheers.map((c,i)=><li key={i}><span aria-hidden="true">{cheerOf(c.kind).emoji}</span><strong>{cheerOf(c.kind).text}</strong><small>{day(c.day)} · {c.on==='pad'?'내 연잎에':'내 개구리에게'}</small></li>)}</ul>
   <p>누가 보냈는지는 보여주지 않아요. 다른 사람이 받은 응원도 보이지 않아요.</p></section>}
  {rest.length>0&&(more?<section className="pond-water" aria-label="지난 연잎"><div className="pond-pads">{rest.map((p,i)=><div key={p.id} className={'pad-spot'+(p.hidden?' is-hidden':'')} style={{zIndex:rest.length-i,'--rise':`${padLook(p.id).rise}px`,'--tilt':`${padLook(p.id).tilt}deg`} as React.CSSProperties}>{padButton(p)}</div>)}</div></section>
   :<button className="text-button village-more" onClick={()=>setMore(true)}>지난 연잎도 보기<ArrowRight size={15}/></button>)}
  {mine&&showFrog!==undefined&&<div className="village-show"><span><strong>내 개구리 보여주기</strong><small>{showFrog?`마을에 온 날, ${mine.name}의 이름과 모습이 같은 기수 사람들에게 보여요.`:'지금은 구경만 해요. 다른 사람에게 내 개구리가 보이지 않아요.'}</small></span><button type="button" role="switch" aria-checked={showFrog} aria-label="내 개구리 보여주기" className={'switch'+(showFrog?' on':'')} onClick={()=>onShowFrog(!showFrog)}><span/></button></div>}
  <div className="small-note pond-note"><ShieldCheck size={19}/><p>좋아요 숫자나 순위는 없어요. 응원은 정해진 말로만 보내고, 받은 사람만 봐요. 지금 누가 접속해 있는지도 보여주지 않아요. 연잎과 개구리는 같은 기수 사람들과 기수 운영진만 보고, 운영진은 마을에 맞지 않는 것을 잠시 내려둘 수 있어요. 기수에서 나가면 내 연잎과 개구리, 주고받은 응원도 함께 지워져요.</p></div>
  <dialog ref={sheetRef} className="pad-sheet" aria-label={open?.frog?'개구리 만나기':'연잎 크게 보기'} onClose={()=>setOpen(null)} onClick={e=>{if(e.target===sheetRef.current)setOpen(null)}}><div className="dialog-content">{open&&<>
   <button className="icon-button close" aria-label="닫기" onClick={()=>setOpen(null)}><X size={21}/></button>
   {open.pad?<><LilyPad id={open.pad.id} photo={photos[open.pad.id]} text={open.pad.kind==='text'?open.pad.text:undefined} size={260} label={padLabel(open.pad)}/>
    {open.pad.kind==='text'&&<p className="pad-line">{open.pad.text}</p>}
    <p className="pad-when">{open.pad.mine?'내 연잎 · ':''}{day(open.pad.at)}에 띄웠어요</p>
    {open.pad.hidden&&<p className="pad-hidden-note">기수 운영진이 연못에서 잠시 내려두었어요. 지금은 나만 볼 수 있어요.</p>}</>
   :<><span className="village-meet"><VillageFrog card={open.frog}/></span><h3 className="village-meet-name">{open.frog.name}</h3>
    <p className="pad-when">{open.frog.mine?'내 개구리예요. 다른 사람에게도 이렇게 보여요.':'오늘 연못 마을에 다녀갔어요'}</p>
    {open.frog.hidden&&<p className="pad-hidden-note">기수 운영진이 마을에서 잠시 내려두었어요. 지금은 나만 볼 수 있어요.</p>}</>}
   {!isMine&&(cheered?<p className="cheer-sent">오늘 응원을 보냈어요. 받은 사람만 볼 수 있어요.</p>
    :<div className="cheer-row" role="group" aria-label="응원 보내기"><p>응원 한마디를 골라 보내요. 누가 보냈는지는 보이지 않아요.</p>{CHEERS.map(c=><button key={c.id} type="button" disabled={busy} onClick={()=>cheer(target,c.id)}><span aria-hidden="true">{c.emoji}</span>{c.text}</button>)}</div>)}
   {open.pad?.mine&&(removing?<div className="pad-remove"><p>내리면 {open.pad.kind==='photo'?'사진':'글'}도 지워지고 되돌릴 수 없어요.</p><div className="button-row"><button className="secondary" disabled={busy} onClick={()=>setRemoving(false)}>그대로 두기</button><button className="primary" disabled={busy} onClick={()=>remove(open.pad)}>{busy?<LoaderCircle className="spin" size={16}/>:null}연잎 내리기</button></div></div>
    :<button className="text-button pad-remove-start" onClick={()=>setRemoving(true)}>이 연잎 내리기</button>)}
  </>}</div></dialog>
 </>;
}
