'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Copy,Check,LoaderCircle,LogOut} from 'lucide-react';
import {formatCode} from '@/lib/cohort';
async function send(url:string,body:unknown){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({})) as {error?:string};if(!r.ok)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');return d;}
const failed=(e:unknown)=>e instanceof TypeError?'인터넷 연결을 확인해 주세요.':(e as Error).message;
const addDays=(day:string,n:number)=>{const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export function OpsLogin({notice}:{notice?:string}){
 const router=useRouter();const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await send('/api/ops/session',{code});router.refresh();setBusy(false);}catch(e){setError(failed(e));setBusy(false);}}
 return <form className="ops-login" onSubmit={submit}><h1>폴짝 운영</h1>{notice&&<p className="ops-error" role="status">{notice}</p>}<p>기관 담당자는 받은 운영자 코드를, 폴짝 팀은 관리자 키를 적어주세요.</p>
  <label htmlFor="ops-code">운영자 코드 또는 관리자 키</label><input id="ops-code" type="password" autoComplete="off" value={code} onChange={e=>{setCode(e.target.value);setError('')}}/>
  <button className="primary" disabled={!code.trim()||busy}>{busy&&<LoaderCircle className="spin" size={16}/>}들어가기</button>{error&&<p className="ops-error" role="alert">{error}</p>}</form>;
}
export function LogoutButton(){const router=useRouter();return <button className="text-button ops-logout" onClick={async()=>{await fetch('/api/ops/session',{method:'DELETE'}).catch(()=>{});router.refresh();}}><LogOut size={15}/>나가기</button>;}
export function CopyButton({text,label='복사'}:{text:string;label?:string}){
 const [done,setDone]=useState(false);
 return <button type="button" className="ops-copy" aria-label={`${label}: ${text}`} onClick={async()=>{try{await navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),1500);}catch{}}}>{done?<Check size={14}/>:<Copy size={14}/>}{done?'복사했어요':label}</button>;
}
/** Team only. The operator code is shown once, here; the server keeps only its hash. */
export function CreateCohort({today}:{today:string}){
 const router=useRouter();const [name,setName]=useState('');const [org,setOrg]=useState('');const [startsOn,setStartsOn]=useState(today);const [endsOn,setEndsOn]=useState(addDays(today,29));
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [created,setCreated]=useState<{name:string;joinCode:string;operatorCode:string}|null>(null);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');
  try{const d=await send('/api/ops/cohorts',{action:'create',name,org,startsOn,endsOn}) as {joinCode:string;operatorCode:string};setCreated({name:name.trim(),...d});setName('');setOrg('');router.refresh();}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 if(created)return <div className="ops-created" role="status"><h3>‘{created.name}’ 기수를 열었어요</h3>
  <dl><dt>기수 코드 · 참여자에게</dt><dd><strong>{formatCode(created.joinCode)}</strong><CopyButton text={formatCode(created.joinCode)}/></dd><dt>운영자 코드 · 기관 담당자에게</dt><dd><strong>{formatCode(created.operatorCode)}</strong><CopyButton text={formatCode(created.operatorCode)}/></dd></dl>
  <p>운영자 코드는 지금 한 번만 보여요. 기관 담당자에게 안전하게 전해 주세요. 잃어버리면 기수 화면에서 새로 만들 수 있어요.</p><button className="secondary" onClick={()=>setCreated(null)}>확인했어요</button></div>;
 return <form className="ops-create" onSubmit={submit}><h2>새 기수 열기</h2>
  <div className="ops-fields"><label>기수 이름<input value={name} maxLength={40} required placeholder="예: 2026 겨울 1기" onChange={e=>setName(e.target.value)}/></label><label>기관<input value={org} maxLength={40} placeholder="예: 니트컴퍼니" onChange={e=>setOrg(e.target.value)}/></label>
   <label>시작하는 날<input type="date" value={startsOn} required onChange={e=>setStartsOn(e.target.value)}/></label><label>마치는 날<input type="date" value={endsOn} min={startsOn} required onChange={e=>setEndsOn(e.target.value)}/></label></div>
  <p className="ops-hint">기본 기간은 시작일부터 30일이에요. 연장은 기수 화면에서 할 수 있어요.</p>
  <button className="primary" disabled={!name.trim()||busy}>{busy&&<LoaderCircle className="spin" size={16}/>}기수 열기</button>{error&&<p className="ops-error" role="alert">{error}</p>}</form>;
}
/** Extending a cohort ("한 달 해보고, 더 하고 싶으면 연장") or ending it early. People already in it keep sending either way; only new joins stop after the last day. */
export function ChangeEndDate({id,startsOn,endsOn}:{id:string;startsOn:string;endsOn:string}){
 const router=useRouter();const [value,setValue]=useState(endsOn);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);
 async function save(next=value){setBusy(true);setError('');setSaved(false);try{await send('/api/ops/cohorts',{action:'period',id,endsOn:next});setValue(next);setSaved(true);router.refresh();}catch(e){setError(failed(e));}finally{setBusy(false);}}
 return <div className="ops-period"><label>마치는 날<input type="date" value={value} min={startsOn} onChange={e=>{setValue(e.target.value);setSaved(false)}}/></label>
  <div className="button-row"><button className="secondary" disabled={busy} onClick={()=>save(addDays(endsOn,7))}>1주 연장</button><button className="secondary" disabled={busy} onClick={()=>save(addDays(endsOn,30))}>30일 연장</button><button className="primary" disabled={busy||!value||value===endsOn} onClick={()=>save()}>{busy&&<LoaderCircle className="spin" size={16}/>}이 날로 바꾸기</button></div>
  {saved&&<p className="ops-hint" role="status">바꿨어요. 이미 함께하는 사람은 계속 기록을 보내고, 마치는 날이 지나면 새로 들어올 수 없어요.</p>}{error&&<p className="ops-error" role="alert">{error}</p>}</div>;
}
export function RotateOperatorCode({id}:{id:string}){
 const [asking,setAsking]=useState(false);const [busy,setBusy]=useState(false);const [code,setCode]=useState('');const [error,setError]=useState('');
 async function rotate(){setBusy(true);setError('');try{const d=await send('/api/ops/cohorts',{action:'rotate',id}) as {operatorCode:string};setCode(d.operatorCode);setAsking(false);}catch(e){setError(failed(e));}finally{setBusy(false);}}
 if(code)return <div className="ops-created" role="status"><dl><dt>새 운영자 코드</dt><dd><strong>{formatCode(code)}</strong><CopyButton text={formatCode(code)}/></dd></dl><p>지금 한 번만 보여요. 이전 코드로는 더 이상 들어올 수 없어요.</p></div>;
 return <div className="button-row">{asking?<><button className="secondary" disabled={busy} onClick={()=>setAsking(false)}>취소</button><button className="primary" disabled={busy} onClick={rotate}>{busy&&<LoaderCircle className="spin" size={16}/>}새로 만들고 이전 코드 막기</button></>:<button className="secondary" onClick={()=>setAsking(true)}>운영자 코드 새로 만들기</button>}{error&&<p className="ops-error" role="alert">{error}</p>}</div>;
}
/** Takes one lily pad down from the cohort's pond, or floats it again. Nothing is deleted; the person who floated it still sees it. */
export function PadToggle({id,hidden}:{id:string;hidden:boolean}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function toggle(){setBusy(true);setError('');try{await send('/api/ops/pond',{id,hidden:!hidden});router.refresh();}catch(e){setError(failed(e));}finally{setBusy(false);}}
 return <><button className="secondary" disabled={busy} onClick={toggle}>{busy&&<LoaderCircle className="spin" size={14}/>}{hidden?'다시 띄우기':'내려두기'}</button>{error&&<p className="ops-error" role="alert">{error}</p>}</>;
}
