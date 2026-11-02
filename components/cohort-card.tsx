'use client';
import {useState} from 'react';
import {Users,ArrowRight,LoaderCircle} from 'lucide-react';
import {normalizeCode,validJoinCode,formatCode,type CohortInfo,type Membership} from '@/lib/cohort';
const md=(day:string)=>{const [,m,d]=day.split('-');return `${Number(m)}월 ${Number(d)}일`;};
const period=(c:CohortInfo)=>`${md(c.startsOn)} ~ ${md(c.endsOn)}`;
const when=(at:string)=>new Date(at).toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'numeric',minute:'2-digit'});
const failed=(e:unknown)=>e instanceof TypeError?'인터넷 연결을 확인해 주세요.':(e as Error).message;
/** Joining a cohort is the one place records leave the device, so what is shared sits right next to the button. */
export function CohortCard({membership,members,invite,participant,save,onJoin,onLeave}:{membership:Membership|null;members:number|null;invite:string;participant:string;save:boolean;onJoin:(joined:{cohort:CohortInfo;token:string;participant:string;members:number|null})=>void;onLeave:()=>Promise<string|null>}){
 const [code,setCode]=useState(invite?formatCode(invite):'');const [consent,setConsent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [leaving,setLeaving]=useState(false);
 const normalized=normalizeCode(code);
 async function join(){setBusy(true);setError('');
  try{const r=await fetch('/api/cohort',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:normalized,participant})});const d=await r.json() as {error?:string;token?:string;participant?:string;cohort?:CohortInfo;members?:number};
   if(!r.ok||!d.token||!d.cohort)throw new Error(d.error||'잠시 후 다시 시도해 주세요.');
   onJoin({cohort:d.cohort,token:d.token,participant:d.participant??participant,members:d.members??null});}
  catch(e){setError(failed(e));}finally{setBusy(false);}}
 async function leave(){setBusy(true);setError('');const problem=await onLeave();setBusy(false);if(problem)setError(problem);else setLeaving(false);}
 if(membership)return <section id="cohort" className="cohort-card joined" aria-label="함께하는 기수">
  <div className="cohort-head"><span className="cohort-icon"><Users size={20}/></span><div><span className="step-label">{membership.org||'함께하는 기수'}</span><h2>{membership.name}</h2></div></div>
  <p>{period(membership)} · {members&&members>1?`나를 포함해 ${members}명이 같은 시간을 지나고 있어요.`:'같은 기수의 사람들과 같은 시간을 지나고 있어요.'}</p>
  <p className="cohort-meta">참여 코드 {membership.code||participant} · {membership.lastSync?`마지막으로 보낸 때 ${when(membership.lastSync)}`:'아직 보낸 기록이 없어요'}</p>
  {leaving?<div className="cohort-leave"><p>기수에서 나가면 운영진에게 보낸 기록도 지워요. 이 기기의 기록은 그대로 남아요.</p><div className="button-row"><button className="secondary" disabled={busy} onClick={()=>{setLeaving(false);setError('')}}>계속 함께하기</button><button className="primary" disabled={busy} onClick={leave}>{busy&&<LoaderCircle className="spin" size={16}/>}기수에서 나가기</button></div></div>
  :<button className="text-button" onClick={()=>setLeaving(true)}>기수에서 나가기</button>}
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
 return <section id="cohort" className="cohort-card" aria-label="기수에 함께하기">
  <div className="cohort-head"><span className="cohort-icon"><Users size={20}/></span><div><span className="step-label">기관에서 코드를 받았다면</span><h2>기수에 함께하기</h2></div></div>
  <p>같은 기수의 사람들과 한 달쯤 같은 시간을 지나요. 기관 담당자가 함께 지켜봐요.</p>
  <label className="sr-only" htmlFor="cohort-code">기수 코드</label>
  <input id="cohort-code" value={code} maxLength={12} autoComplete="off" autoCapitalize="characters" placeholder="기수 코드 (예: 7K3Q-PW2M)" onChange={e=>{setCode(e.target.value);setError('')}}/>
  <label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>함께하는 동안 남기는 기록(작은 행동, 연습, 마음 체크, 폴짝을 연 날, 연락 버튼, 폴짝에게 한마디)이 기수 운영진(기관 담당자와 폴짝 팀)에게 전달되는 것에 동의해요. 대화 내용은 보내지 않고, 기수에서 나가면 보낸 기록도 지워요.{!save&&' 이 기기에 기록 저장도 함께 켜져요.'}</span></label>
  <button className="primary" disabled={!validJoinCode(normalized)||!consent||busy} onClick={join}>{busy?<LoaderCircle className="spin" size={17}/>:null}함께하기<ArrowRight size={17}/></button>
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
