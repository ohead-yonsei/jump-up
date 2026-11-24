'use client';
// 머문 시간 보기(0.48.0): the numbers lib/usage.ts keeps, shown as they stand — where the time went, how often each place was opened, what was pressed.
// It is for checking the counter during a test and for letting the person see exactly what is recorded about them: counts only, on this device.
// The tone stays plain: no targets, no ‘too long’, no comparison with other days or people.
import {useState} from 'react';
import {Timer,Copy,Check,Trash2} from 'lucide-react';
import {type Usage,usageTotals,usageRanked,usageOn,usageText,clockLabel,screenLabel,actionLabel} from '@/lib/usage';
/** `shared`: the person is in a cohort that receives these numbers, so the panel says so and they cannot be cleared here (leaving the cohort removes them). */
export function UsagePanel({usage,today,saved,shared=false,onReset}:{usage:Usage;today:string;saved:boolean;shared?:boolean;onReset:()=>void}){
 const [range,setRange]=useState<'today'|'all'>('today');const [copied,setCopied]=useState<'no'|'yes'|'manual'>('no');const [sure,setSure]=useState(false);
 const shown=range==='today'?usageOn(usage,today):usage;const totals=usageTotals(shown);const rows=usageRanked(shown);const longest=Math.max(1,...rows.map(r=>r.seconds));
 const acts=totals.actions.filter(a=>a.count>0);const days=Object.keys(usage).length;const summary=usageText(shown);
 const copy=async()=>{try{await navigator.clipboard.writeText(summary);setCopied('yes');setTimeout(()=>setCopied(c=>c==='yes'?'no':c),2500);}catch{setCopied('manual');}};
 return <div className="usage-panel"><span className="dialog-symbol"><Timer/></span><h2>머문 시간</h2>
  <p>어느 화면에 얼마나 머물렀는지 숫자로만 남겨요. {shared?'함께하는 기수의 운영진에게도 이 숫자가 전달돼요.':'이 기기에만 있고, 운영진에게 보내지 않아요.'}</p>
  <div className="usage-range" role="group" aria-label="볼 기간"><button aria-pressed={range==='today'} onClick={()=>setRange('today')}>오늘</button><button aria-pressed={range==='all'} onClick={()=>setRange('all')}>전체{days>0?` · ${days}일`:''}</button></div>
  {rows.length||acts.length?<>
   <p className="usage-total"><strong>{clockLabel(totals.seconds)}</strong><span>화면을 연 횟수 {totals.opens}번</span></p>
   {rows.length>0&&<ol className="usage-rows" aria-label="머문 곳, 오래 머문 순서">{rows.map(r=><li key={r.screen}><span className="usage-name">{screenLabel[r.screen]}</span><span className="usage-time">{clockLabel(r.seconds)}</span><span className="usage-bar" aria-hidden="true"><i style={{width:`${Math.round(r.seconds/longest*100)}%`}}/></span><small>{r.opens}번 열었어요</small></li>)}</ol>}
   {acts.length>0&&<><h3>누른 것</h3><ul className="usage-acts">{acts.map(a=><li key={a.action}>{actionLabel[a.action]}<b>{a.count}번</b></li>)}</ul></>}
  </>:<p className="usage-empty">{range==='today'&&days>0?'오늘은 아직 남은 숫자가 없어요.':'아직 남은 숫자가 없어요.'} 화면을 옮겨 다니면 여기에 쌓여요.</p>}
  {!saved&&<p className="usage-note">기록 저장이 꺼져 있어서 이번 방문 동안만 세요. 폴짝을 닫으면 숫자도 사라져요.</p>}
  <details className="usage-how"><summary>어떻게 세나요?</summary><ul><li>화면이 보이고, 마지막으로 누른 지 2분이 지나지 않았을 때만 세요.</li><li>다른 곳으로 옮기면 바로 더하고, 한 곳에 계속 있으면 30초마다 더해요.</li><li>이 창을 보고 있는 시간은 세지 않아요.</li><li>무엇을 적었는지, 몇 시였는지는 남기지 않아요.</li></ul></details>
  {sure?<><p className="usage-note">머문 시간과 누른 횟수만 지워요. 남긴 기록과 캐릭터는 그대로예요. 되돌릴 수 없어요.</p>
   {/* The confirm sits on the other side from the button that opened it, so a double tap lands on ‘그만두기’. */}
   <div className="button-row usage-buttons"><button className="secondary danger" onClick={()=>{setSure(false);onReset();}}><Trash2 size={16}/>정말 지울게요</button><button className="secondary" onClick={()=>setSure(false)}>그만두기</button></div></>
  :<div className="button-row usage-buttons"><button className="secondary" disabled={!rows.length&&!acts.length} onClick={copy}>{copied==='yes'?<><Check size={16}/>복사했어요</>:<><Copy size={16}/>숫자 복사</>}</button><button className="secondary" disabled={!days||shared} onClick={()=>setSure(true)}><Trash2 size={16}/>숫자 지우기</button></div>}
  {shared&&<p className="usage-note">기수에 함께하는 동안에는 숫자를 지울 수 없어요. 기수에서 나가면 운영진에게 보낸 숫자도 지워져요.</p>}
  {copied==='manual'&&<><label className="sr-only" htmlFor="usage-copy">복사할 숫자</label><textarea id="usage-copy" className="usage-copy" readOnly value={summary} onFocus={e=>e.currentTarget.select()}/><p className="usage-note">자동으로 복사하지 못했어요. 위 내용을 선택해 복사해 주세요.</p></>}
 </div>;
}
