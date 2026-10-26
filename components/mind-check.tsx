'use client';
import {useState} from 'react';
import {Leaf,Check,ArrowRight,Phone,MessageCircleHeart} from 'lucide-react';
import {checkinQuestions,checkinDue,lastCheckin,validParticipant,type Entry} from '@/lib/records';
import {needsSupport,supportiveText} from '@/lib/content';
type Values={calm:number;talk:number;outside:number};
const day=(at:string)=>new Date(at).toLocaleDateString('ko-KR',{month:'long',day:'numeric'});
function Dots({value,label}:{value?:number;label:string}){return <span className="mind-dots" aria-label={`${label} ${value??'-'} / 5`}>{[1,2,3,4,5].map(i=><i key={i} className={value&&i<=value?'on':''}/>)}</span>}
/** Optional weekly self check-in. Shows how the person's own answers moved, never a score. */
export function MindCheck({entries,onSave}:{entries:Entry[];onSave:(v:Values)=>void}){
 const [open,setOpen]=useState(false);const [draft,setDraft]=useState<Partial<Values>>({});
 const checks=entries.filter(e=>e.type==='checkin');const first=checks[0];const last=lastCheckin(entries);const due=checkinDue(entries);
 const ready=checkinQuestions.every(q=>draft[q.key]);
 return <section className="mind-check" aria-label="나의 마음 변화">
  <div className="mind-head"><div><span className="step-label">선택 · 일주일에 한 번</span><h2>나의 마음 변화</h2></div>{!open&&<button className={due?'primary':'secondary'} onClick={()=>{setDraft({});setOpen(true)}}>{checks.length?'지금 살펴보기':'처음 마음 남기기'}</button>}</div>
  {open?<div className="mind-form">{checkinQuestions.map(q=><fieldset key={q.key}><legend>{q.label}</legend><div className="mind-scale">{[1,2,3,4,5].map(v=><button key={v} type="button" aria-pressed={draft[q.key]===v} aria-label={`${v}점`} className={draft[q.key]===v?'selected':''} onClick={()=>setDraft(d=>({...d,[q.key]:v}))}><Leaf size={14+v*2}/></button>)}</div><div className="scale-labels"><span>{q.low}</span><span>{q.high}</span></div></fieldset>)}
   <div className="button-row"><button className="primary" disabled={!ready} onClick={()=>{onSave(draft as Values);setOpen(false)}}>마음 남기기<Check size={16}/></button><button className="secondary" onClick={()=>setOpen(false)}>다음에 할래요</button></div><small>정답도 점수도 없어요. 지금 느낌 그대로 골라요.</small></div>
  :checks.length?<><div className="mind-rows">{checkinQuestions.map(q=><div key={q.key}><span>{q.short}</span><Dots value={first?.[q.key]} label="처음"/>{checks.length>1&&<><ArrowRight size={13}/><Dots value={last?.[q.key]} label="최근"/></>}</div>)}</div>
   <p className="mind-note">처음 {day(first!.at)}{checks.length>1&&` · 최근 ${day(last!.at)}`} · {checks.length}번 살펴봤어요. 달라지지 않아도 괜찮아요. 살펴본 시간 자체가 나를 돌본 시간이에요.</p></>
  :<p className="mind-note">지금 마음을 남겨두면, 나중에 스스로 달라진 점을 살펴볼 수 있어요. 기록은 이 기기에만 남아요.</p>}
 </section>
}
/** A short note to the team; crisis language gets support instead of being filed away. */
export function AppNote({onSave,onHelp}:{onSave:(note:string)=>void;onHelp:()=>void}){
 const [text,setText]=useState('');const [support,setSupport]=useState(false);const [sent,setSent]=useState(false);
 function submit(){const note=text.trim();if(!note)return;if(needsSupport(note)){setSupport(true);return;}onSave(note);setText('');setSent(true);}
 return <section className="app-note" aria-label="폴짝에게 한마디"><h2><MessageCircleHeart size={19}/>폴짝에게 한마디</h2><p>써보니 어땠나요? 불편했던 점, 더 있었으면 하는 것도 좋아요. 이 기기에만 남고, 내보내기를 해야 팀에 전달돼요.</p>
  {support?<div className="support-response"><p>{supportiveText}</p><div className="button-row"><a className="primary" href="tel:109"><Phone size={17}/>109 상담전화</a><button className="secondary" onClick={onHelp}>긴급 도움 보기</button></div><button className="text-button" onClick={()=>{setSupport(false);setText('')}}>돌아가기</button></div>
  :<><label className="sr-only" htmlFor="app-note">폴짝에게 남길 말</label><textarea id="app-note" rows={3} maxLength={300} value={text} placeholder="예: 미션 글씨가 조금 작아요." onChange={e=>{setText(e.target.value);setSent(false)}}/><div className="app-note-foot"><span>{sent?'고마워요. 잘 남겨두었어요.':`${text.length}/300`}</span><button className="secondary" disabled={!text.trim()} onClick={submit}>남기기</button></div></>}
 </section>
}
/** Lets field-study staff set the code that appears in exported records. */
export function ParticipantCode({value,onChange}:{value:string;onChange:(code:string)=>void}){
 const [draft,setDraft]=useState(value);const ok=validParticipant(draft);
 return <div className="participant-code"><label htmlFor="participant">실증 참여 코드<small>담당자가 알려준 코드가 있다면 적어주세요. 내보낸 기록에만 들어가요.</small></label><div><input id="participant" value={draft} maxLength={16} autoComplete="off" placeholder="예: P07" onChange={e=>setDraft(e.target.value.replace(/\s/g,''))}/><button className="secondary" disabled={!ok||draft===value} onClick={()=>onChange(draft)}>저장</button></div>{draft&&!ok&&<small className="error">영문·숫자·하이픈으로 16자까지 적을 수 있어요.</small>}</div>
}
