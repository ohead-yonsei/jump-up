'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Check,Coffee,Trees,Library,Store,LocateFixed,Search,LoaderCircle,MapPin,Footprints,MessageCircle,ShieldCheck} from 'lucide-react';
import {placeKinds,placeKind,mapLinks,formatDistance,coarse,type Place,type PlaceKind} from '@/lib/places';
const kindIcons:Record<PlaceKind,typeof Coffee>={cafe:Coffee,park:Trees,library:Library,store:Store};
type Origin={lat:number;lng:number}|{near:string};
function MapLinks({kind,near,lead}:{kind:PlaceKind;near?:string|null;lead:string}){
 const links=mapLinks(kind,near);
 return <div className="place-maps"><span>{lead}</span><div><a href={links.kakao} target="_blank" rel="noopener noreferrer">카카오맵<ArrowUpRight size={14}/></a><a href={links.naver} target="_blank" rel="noopener noreferrer">네이버 지도<ArrowUpRight size={14}/></a></div></div>
}
/** Cafes, parks, libraries and convenience stores near the person, nearest first. The search point lives only in this screen. */
export function NearbyPlaces({kind,onKind,onPractice,onVisit}:{kind:PlaceKind;onKind:(k:PlaceKind)=>void;onPractice:()=>void;onVisit:(k:PlaceKind,arrived:boolean)=>void}){
 const [configured,setConfigured]=useState<boolean|null>(null);
 const [status,setStatus]=useState<'idle'|'locating'|'loading'|'done'|'error'>('idle');
 const [places,setPlaces]=useState<Place[]>([]);const [near,setNear]=useState<string|null>(null);const [message,setMessage]=useState('');
 const [typing,setTyping]=useState(false);const [area,setArea]=useState('');const [visited,setVisited]=useState<PlaceKind[]>([]);
 const origin=useRef<Origin|null>(null);const request=useRef<AbortController|null>(null);const located=useRef(0);const kindRef=useRef(kind);kindRef.current=kind;
 const current=placeKind(kind);const busy=status==='locating'||status==='loading';
 useEffect(()=>{const c=new AbortController();fetch('/api/places',{signal:c.signal}).then(r=>r.json()).then((r:{configured?:boolean})=>setConfigured(r.configured===true)).catch(()=>setConfigured(false));return ()=>{c.abort();request.current?.abort();located.current++;};},[]);
 async function search(from:Origin,nextKind=kindRef.current){
  request.current?.abort();const c=new AbortController();request.current=c;origin.current=from;setStatus('loading');setMessage('');
  try{const r=await fetch('/api/places',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:nextKind,...from}),signal:c.signal});const data=await r.json() as {places?:Place[];near?:string|null;error?:string;code?:string};
   if(request.current!==c)return;
   if(!r.ok){if(data.code==='not_configured')setConfigured(false);if(data.code==='not_found')setTyping(true);setPlaces([]);setStatus('error');setMessage(data.error??'지금은 장소를 찾기 어려워요.');return;}
   setPlaces(Array.isArray(data.places)?data.places:[]);setNear(data.near??null);setStatus('done');
  }catch(e){if((e as Error).name!=='AbortError'&&request.current===c){setStatus('error');setMessage('인터넷 연결을 확인해 주세요. 지도 앱에서 찾아볼 수도 있어요.');}}
 }
 function fail(text:string){setStatus('error');setTyping(true);setMessage(text);}
 // A browser or app shell without location permission may never answer, so a timer offers the area search.
 // The iOS app asks twice (the app, then the site), so a position that arrives after the timer still searches
 // unless the person has started another search meanwhile.
 function locate(){
  if(!navigator.geolocation){fail('이 기기에서는 위치를 쓸 수 없어요. 동네 이름으로 찾아볼까요?');return;}
  request.current?.abort();setStatus('locating');setMessage('');const ticket=++located.current;
  const guard=setTimeout(()=>{if(located.current===ticket)fail('위치를 확인하는 데 시간이 걸리고 있어요. 동네 이름으로 찾아볼 수도 있어요.');},20000);
  navigator.geolocation.getCurrentPosition(p=>{clearTimeout(guard);if(located.current!==ticket)return;located.current++;void search({lat:coarse(p.coords.latitude),lng:coarse(p.coords.longitude)});},
   e=>{clearTimeout(guard);if(located.current!==ticket)return;located.current++;fail(e.code===1?'위치 사용이 꺼져 있어요. 동네 이름으로 찾거나 지도 앱에서 찾아볼 수 있어요.':'위치를 확인하지 못했어요. 동네 이름으로 찾아볼까요?');},
   {enableHighAccuracy:false,timeout:15000,maximumAge:300000});
 }
 function pick(next:PlaceKind){if(next===kind)return;onKind(next);if(origin.current&&status==='done')void search(origin.current,next);else if(!busy){setPlaces([]);setStatus('idle');setMessage('');}}
 const typedNear=origin.current&&'near' in origin.current?origin.current.near:null;
 return <div className="place-finder">
  <section className="finder-card place-search" aria-label="가까운 곳 찾기">
   <img className="place-nest" src="/art/frog-nest.webp" alt="" width={120} height={88}/>
   <span className="step-label"><MapPin size={12}/>가까운 곳 찾기</span>
   <h2>나가기 전에,<br/>둥지에서 먼저 살펴봐요.</h2>
   <div className="place-kinds" role="group" aria-label="찾을 곳">{placeKinds.map(k=>{const KindIcon=kindIcons[k.id];return <button key={k.id} type="button" aria-pressed={kind===k.id} className={kind===k.id?'selected':''} onClick={()=>pick(k.id)}><KindIcon size={21}/>{k.label}</button>})}</div>
   <div className="place-kind-note"><strong>{current.title}</strong><p>{current.tip}</p></div>
   {configured===false?<MapLinks kind={kind} lead={`지도 앱이 지금 있는 곳 근처의 ${current.obj} 보여줘요.`}/>:<>
    <div className="place-origin"><button className="primary" onClick={locate} disabled={busy||configured===null}><LocateFixed size={17}/>지금 위치로 찾기</button><button className="secondary" aria-expanded={typing} onClick={()=>setTyping(!typing)}><Search size={16}/>동네 이름으로</button></div>
    {typing&&<form className="place-area" onSubmit={e=>{e.preventDefault();const v=area.replace(/\s+/g,' ').trim();if(v.length>=2){located.current++;void search({near:v});}}}><label className="sr-only" htmlFor="place-area">찾을 동네 이름</label><input id="place-area" value={area} maxLength={30} onChange={e=>setArea(e.target.value)} placeholder="예: 모란역, 성남시청" autoComplete="off" enterKeyHint="search"/><button className="primary" disabled={busy||area.trim().length<2}>찾기</button></form>}
    <p className="place-privacy"><ShieldCheck size={13}/>위치는 이번 검색에만 써요. 약 100m 단위로 줄여 카카오 장소 검색에 보내고, 폴짝에는 남기지 않아요.</p>
   </>}
  </section>
  {busy&&<p className="place-status" role="status"><LoaderCircle size={17} className="spin"/>{status==='locating'?'지금 위치를 확인하고 있어요.':`가까운 ${current.obj} 찾고 있어요.`}</p>}
  {status==='error'&&message&&<p className="place-status is-error" role="alert">{message}</p>}
  {status==='done'&&<section className="place-results" aria-live="polite"><div className="section-top"><h2>{near?`${near} 근처`:'지금 있는 곳 근처'} {current.label} {places.length}곳</h2><span className="subtle">가까운 순</span></div>
   {places.length?<div className="place-list">{places.map(p=>{const Icon=kindIcons[p.kind];return <article key={p.id} className="place-card"><span className={'place-art kind-'+p.kind}><Icon size={22}/></span><div className="place-info"><h3>{p.name}</h3>{p.detail&&<p className="place-detail">{p.detail}</p>}<p className="place-walk"><Footprints size={13}/>걸어서 약 {p.minutes}분 · {formatDistance(p.distance)}</p>{p.address&&<p className="place-address">{p.address}</p>}</div><a className="place-map" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name}, 카카오맵에서 보기`}><MapPin size={15}/>지도</a></article>})}</div>:<p className="small-note">이 근처에서는 찾지 못했어요. 지도 앱에서 더 넓게 찾아볼 수 있어요.</p>}
   <p className="place-credit">장소 정보 카카오 · 문을 열었는지와 쉬는 날은 지도에서 한 번 더 확인해 주세요.</p>
  </section>}
  {configured&&(status==='done'||status==='error')&&<MapLinks kind={kind} near={typedNear} lead="지도 앱에서 더 찾아보기"/>}
  {kind==='cafe'&&<button className="teaser place-practice" onClick={onPractice}><span className="round-icon"><MessageCircle size={23}/></span><div><span className="step-label">가기 전에 한 번</span><h3>주문, 미리 연습해볼까요?</h3><p>“아메리카노 한 잔 주세요”부터 천천히.</p></div><ArrowRight size={19}/></button>}
  <section className="place-visit"><h3>다녀왔다면, 남겨둘까요?</h3><p>문 앞까지만 가봤어도 충분한 한 걸음이에요. 어느 곳에 갔는지는 남기지 않아요.</p>{visited.includes(kind)?<p className="place-visited"><Check size={16}/>오늘의 외출을 남겼어요.</p>:<div className="button-row"><button className="primary" onClick={()=>{onVisit(kind,true);setVisited(v=>[...v,kind])}}>{current.label}에 다녀왔어요<Check size={16}/></button><button className="secondary" onClick={()=>{onVisit(kind,false);setVisited(v=>[...v,kind])}}>앞까지 가봤어요</button></div>}</section>
 </div>
}
