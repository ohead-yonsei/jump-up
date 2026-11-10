'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Camera,LoaderCircle,X,EyeOff,ShieldCheck,Users} from 'lucide-react';
import {padLook,PAD_SIDE,PAD_MISSIONS,type PadView} from '@/lib/pond';
import {springMissions} from '@/lib/journey';
import {haptic} from './frog-3d';
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
/** One lily pad. The leaf turns so each notch points its own way; the photo turns back so it stays upright. */
function LilyPad({id,photo,size,label,children,onClick}:{id:string;photo?:string;size?:number;label:string;children?:React.ReactNode;onClick?:()=>void}){
 const look=padLook(id);const style={'--notch':`${look.notch}deg`,'--size':`${size??look.size}px`} as React.CSSProperties;
 const body=<span className="pad-body" aria-hidden="true"><span className="pad-leaf"><span className="pad-photo">{photo?<img src={photo} alt="" draggable={false}/>:<span className="pad-wait"/>}</span></span></span>;
 return onClick?<button type="button" className="pad" style={style} aria-label={label} onClick={onClick}>{body}{children}</button>:<span className="pad" style={style} role="img" aria-label={label}>{body}{children}</span>;
}
const padTitles=new Set(springMissions.filter(m=>PAD_MISSIONS.includes(m.id)).map(m=>m.title));
/** On the home pond, for people in a cohort. Right after a photo mission it asks, gently, whether to float the picture. */
export function PondInvite({justDid,onOpen}:{justDid:string;onOpen:()=>void}){
 const fresh=padTitles.has(justDid);
 return <button className={'pond-invite'+(fresh?' fresh':'')} onClick={onOpen}><span className="pond-invite-art" aria-hidden="true"><span/><span/><span/></span>
  <span className="pond-invite-copy"><span className="step-label">{fresh?'방금 찍은 사진이 있다면':'우리 기수 연못'}</span><strong>{fresh?'연잎 한 장으로 띄워볼까요?':'연잎 한 장'}</strong><small>{fresh?'같은 기수 사람들만 봐요. 띄우지 않아도 괜찮아요.':'같은 기수 사람들이 띄운 사진을 구경해요.'}</small></span><ArrowRight size={18}/></button>;
}
/** The cohort's shared pond. Members see photos and the day they were floated; nobody's name, no counts, no reactions. */
export function CohortPond({token,onToast,onBack,onJoin}:{token:string|null;onToast:(text:string)=>void;onBack:()=>void;onJoin:()=>void}){
 const [pads,setPads]=useState<PadView[]|null>(null);const [photos,setPhotos]=useState<Record<string,string>>({});const owned=useRef<string[]>([]);
 const [error,setError]=useState('');const [picked,setPicked]=useState<{blob:Blob;url:string}|null>(null);const [preparing,setPreparing]=useState(false);const [busy,setBusy]=useState(false);
 const [open,setOpen]=useState<PadView|null>(null);const [removing,setRemoving]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);const sheetRef=useRef<HTMLDialogElement>(null);const confirmRef=useRef<HTMLElement>(null);
 const keep=(url:string)=>{owned.current.push(url);return url;};
 useEffect(()=>()=>{for(const url of owned.current)URL.revokeObjectURL(url);},[]);
 useEffect(()=>{if(!token)return;let stop=false;
  fetch('/api/pond',{headers:{Authorization:'Bearer '+token},cache:'no-store'}).then(async r=>{const d=await r.json().catch(()=>({})) as {pads?:PadView[];error?:string};if(stop)return;if(!r.ok||!d.pads)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');setPads(d.pads);})
   .catch(e=>{if(!stop){setError(failed(e));setPads([]);}});
  return()=>{stop=true;};},[token]);
 // Photos come a few at a time, each with the member's token, and stay on the device for as long as this screen is open.
 useEffect(()=>{if(!token||!pads)return;let stop=false;const want=pads.filter(p=>!photos[p.id]).map(p=>p.id);
  const next=async()=>{while(!stop&&want.length){const id=want.shift()!;try{const r=await fetch('/api/pond?id='+id,{headers:{Authorization:'Bearer '+token}});if(!r.ok||stop)continue;const url=keep(URL.createObjectURL(await r.blob()));setPhotos(p=>({...p,[id]:url}));}catch{}}};
  void Promise.all([next(),next(),next()]);return()=>{stop=true;};},[pads,token]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const d=sheetRef.current;if(!d)return;if(open&&!d.open)d.showModal();else if(!open&&d.open)d.close();},[open]);
 useEffect(()=>{if(picked)confirmRef.current?.scrollIntoView({behavior:'smooth',block:'center'});},[picked]);
 async function choose(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(!file)return;setError('');setPreparing(true);
  try{const blob=await padJpeg(file);if(picked)URL.revokeObjectURL(picked.url);setPicked({blob,url:URL.createObjectURL(blob)});}catch(e){setError(failed(e));}finally{setPreparing(false);}}
 function cancel(){if(picked)URL.revokeObjectURL(picked.url);setPicked(null);setError('');}
 async function float(){if(!picked||!token)return;setBusy(true);setError('');
  try{const r=await fetch('/api/pond',{method:'POST',headers:{'Content-Type':'image/jpeg',Authorization:'Bearer '+token},body:picked.blob});const d=await r.json().catch(()=>({})) as {pad?:PadView;error?:string};
   if(!r.ok||!d.pad)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   const pad=d.pad;setPhotos(p=>({...p,[pad.id]:keep(picked.url)}));setPads(list=>[pad,...(list??[])]);setPicked(null);haptic([12,60,18]);onToast('연잎 한 장을 띄웠어요. 같은 기수 사람들도 볼 수 있어요.');}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 async function remove(pad:PadView){if(!token)return;setBusy(true);setError('');
  try{const r=await fetch('/api/pond?id='+pad.id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});const d=await r.json().catch(()=>({})) as {error?:string};if(!r.ok&&r.status!==404)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   setPads(list=>(list??[]).filter(p=>p.id!==pad.id));setOpen(null);setRemoving(false);onToast('연잎을 내렸어요. 사진도 함께 지웠어요.');}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 const heading=<div className="page-heading pond-heading"><button className="text-button pond-back" onClick={onBack}><ArrowLeft size={15}/>기록으로</button><span className="eyebrow">OUR LITTLE POND</span><h1>연잎 한 장,<br/>같이 띄워요.</h1><p>사진 한 장을 연잎에 담아 우리 기수 연못에 띄워요. 같은 기수 사람들만 볼 수 있어요.</p></div>;
 if(!token)return <>{heading}<div className="pond-closed"><span className="cohort-icon"><Users size={20}/></span><h3>기수에 함께하면 열리는 연못이에요</h3><p>기관에서 받은 기수 코드로 함께하면, 같은 기수 사람들과 사진 한 장씩 나눌 수 있어요.</p><button className="primary" onClick={onJoin}>기수에 함께하기<ArrowRight size={17}/></button></div></>;
 return <>{heading}
  <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={choose}/>
  {picked&&<section ref={confirmRef} className="pond-confirm" aria-label="연잎 띄우기 확인"><LilyPad id="preview" photo={picked.url} size={168} label="띄울 사진 미리보기"/>
   <h3>이 사진을 우리 기수 연못에 띄울까요?</h3>
   <ul><li>같은 기수 사람들과 기수 운영진이 볼 수 있어요. 누가 띄웠는지는 다른 참여자에게 보이지 않아요.</li><li>사진 속 위치·기기 정보는 지우고, 가운데를 정사각형으로 잘라 올려요.</li><li>얼굴, 이름, 집 주소처럼 나를 알 수 있는 것은 빼는 걸 권해요.</li><li>언제든 내 연잎을 눌러 내릴 수 있어요.</li></ul>
   <div className="button-row"><button className="secondary" disabled={busy} onClick={cancel}>그만두기</button><button className="primary" disabled={busy} onClick={float}>{busy?<LoaderCircle className="spin" size={17}/>:null}연잎 띄우기</button></div></section>}
  {error&&<p className="error pond-error" role="alert">{error}</p>}
  <section className="pond-water" aria-label="우리 기수 연못" aria-busy={pads===null}>
   <div className="pond-pads">
    <button type="button" className="pad pad-add" style={{'--notch':'305deg','--size':'96px'} as React.CSSProperties} disabled={preparing||busy||!!picked} onClick={()=>fileRef.current?.click()}><span className="pad-body" aria-hidden="true"><span className="pad-leaf"/></span><span className="pad-add-label">{preparing?<LoaderCircle className="spin" size={22}/>:<Camera size={22}/>}<span>연잎 띄우기</span></span></button>
    {(pads??[]).map((p,i)=><div key={p.id} className={'pad-spot'+(p.hidden?' is-hidden':'')} style={{zIndex:(pads?.length??0)-i,'--rise':`${padLook(p.id).rise}px`,'--tilt':`${padLook(p.id).tilt}deg`} as React.CSSProperties}>
     <LilyPad id={p.id} photo={photos[p.id]} label={`${day(p.at)}에 띄운 연잎${p.mine?', 내 연잎':''}${p.hidden?', 운영진이 내려둠':''}`} onClick={()=>{setOpen(p);setRemoving(false);}}>{p.hidden?<span className="pad-tag quiet"><EyeOff size={11}/>내려둠</span>:p.mine?<span className="pad-tag">내 연잎</span>:null}</LilyPad></div>)}
   </div>
   {pads===null?<p className="pond-quiet" role="status"><LoaderCircle className="spin" size={15}/>연못을 살피고 있어요</p>:!pads.length?<p className="pond-quiet">아직 조용한 연못이에요. 첫 연잎을 띄워도, 구경만 해도 괜찮아요.</p>:null}
  </section>
  <div className="small-note pond-note"><ShieldCheck size={19}/><p>좋아요나 숫자는 없어요. 사진은 같은 기수 사람들과 기수 운영진만 보고, 운영진은 연못에 맞지 않는 사진을 잠시 내려둘 수 있어요. 기수에서 나가면 내가 띄운 연잎도 함께 지워져요.</p></div>
  <dialog ref={sheetRef} className="pad-sheet" aria-label="연잎 크게 보기" onClose={()=>setOpen(null)} onClick={e=>{if(e.target===sheetRef.current)setOpen(null)}}><div className="dialog-content">{open&&<>
   <button className="icon-button close" aria-label="닫기" onClick={()=>setOpen(null)}><X size={21}/></button>
   <LilyPad id={open.id} photo={photos[open.id]} size={260} label={`${day(open.at)}에 띄운 연잎`}/>
   <p className="pad-when">{open.mine?'내 연잎 · ':''}{day(open.at)}에 띄웠어요</p>
   {open.hidden&&<p className="pad-hidden-note">기수 운영진이 연못에서 잠시 내려두었어요. 지금은 나만 볼 수 있어요.</p>}
   {open.mine&&(removing?<div className="pad-remove"><p>내리면 사진도 지워지고 되돌릴 수 없어요.</p><div className="button-row"><button className="secondary" disabled={busy} onClick={()=>setRemoving(false)}>그대로 두기</button><button className="primary" disabled={busy} onClick={()=>remove(open)}>{busy?<LoaderCircle className="spin" size={16}/>:null}연잎 내리기</button></div></div>
    :<button className="text-button pad-remove-start" onClick={()=>setRemoving(true)}>이 연잎 내리기</button>)}
  </>}</div></dialog>
 </>;
}
