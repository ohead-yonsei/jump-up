'use client';
import {useMemo,useState} from 'react';
import {ArrowUpRight,Check,ChevronDown,Copy,MapPin,MessageCircle,Phone,ShieldCheck,Sparkles} from 'lucide-react';
import {supportItems,needs,contactWays,ageBands,regions,matchSupport,firstWords,channelLabel,type SupportItem,type Need,type ContactWay,type AgeBand,type Region} from '@/lib/support';
const tierLabel:Record<SupportItem['tier'],string>={talk:'이야기·상담',space:'공간·모임',program:'신청형 지원',info:'정보 찾기',crisis:'긴급'};
function Chips<T extends string>({label,options,value,onChange}:{label:string;options:readonly {id:T;label:string}[];value:T|null;onChange:(v:T|null)=>void}){
 return <fieldset className="finder-q"><legend>{label}</legend><div>{options.map(o=><button key={o.id} type="button" aria-pressed={value===o.id} className={value===o.id?'selected':''} onClick={()=>onChange(value===o.id?null:o.id)}>{value===o.id&&<Check size={13}/>}{o.label}</button>)}</div></fieldset>
}
/** One service, answered in the order people asked: what help, can I use it, how to start, what to say. */
export function SupportCard({item,onPractice,open:initial=false}:{item:SupportItem;onPractice:()=>void;open?:boolean}){
 const [open,setOpen]=useState(initial);const [copied,setCopied]=useState(false);const words=firstWords(item);
 return <article className={'support-card tier-'+item.tier}>
  <button className="support-head" aria-expanded={open} onClick={()=>setOpen(!open)}><span className="support-chips"><span className="pill"><MapPin size={12}/>{item.region}</span><span className="pill tier">{tierLabel[item.tier]}</span>{item.cost&&<span className="pill">{item.cost}</span>}</span><h3>{item.title}</h3><p>{item.summary}</p><ChevronDown size={18} className="support-caret"/></button>
  {open&&<div className="support-body">
   {item.help.length>0&&<section><h4>이런 도움을 받을 수 있어요</h4><ul>{item.help.map(h=><li key={h}>{h}</li>)}</ul></section>}
   <section><h4>나도 이용할 수 있을까요?</h4><p>{item.who??'대상 조건은 기관에 확인이 필요해요. 문의만 해도 괜찮아요.'}</p>{item.notRequired.length>0&&<div className="support-free">{item.notRequired.map(n=><span key={n}><Check size={12}/>{n}</span>)}</div>}</section>
   {item.how.length>0&&<section><h4>이렇게 시작해요</h4><ol>{item.how.map(h=><li key={h}>{h}</li>)}</ol></section>}
   {words&&<section className="support-words"><h4>처음 연락할 때 이렇게 말해보세요</h4><blockquote>{words}</blockquote><div className="button-row"><button className="secondary" onClick={()=>{navigator.clipboard?.writeText(words).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1600)}).catch(()=>{})}}><Copy size={15}/>{copied?'복사했어요':'문장 복사'}</button><button className="secondary" onClick={onPractice}><MessageCircle size={15}/>먼저 연습해보기</button></div></section>}
   <div className="support-contact">{item.channels.map(c=>c.type==='phone'?<a key={c.type+c.value} className="primary" href={'tel:'+c.value.replace(/[^0-9]/g,'')}><Phone size={16}/>{c.value}{c.hours&&<small>{c.hours}</small>}</a>:c.type==='text'?<a key={c.type+c.value} className="secondary" href={'sms:'+c.value.replace(/[^0-9]/g,'')}><MessageCircle size={16}/>문자 {c.value}{c.hours&&<small>{c.hours}</small>}</a>:/^https?:/.test(c.value)?<a key={c.type+c.value} className="secondary" href={c.value} target="_blank" rel="noopener noreferrer">{c.type==='chat'?'채팅 상담':'온라인으로 하기'}<ArrowUpRight size={15}/>{c.hours&&<small>{c.hours}</small>}</a>:<span key={c.type+c.value} className="support-channel"><strong>{channelLabel[c.type]}</strong> {c.value}{c.hours&&<small>{c.hours}</small>}</span>)}<a className="text-button" href={item.url} target="_blank" rel="noopener noreferrer">공식 안내 보기<ArrowUpRight size={15}/></a></div>
   <p className="checked-date"><ShieldCheck size={12}/>정보 확인 {item.checkedAt} · 실제 조건과 일정은 기관에서 한 번 더 확인해 주세요.{item.note?` ${item.note}`:''}</p>
  </div>}
 </article>
}
/** Three light questions, then services that fit. Nothing is saved or sent. */
export function HelpFinder({onPractice}:{onPractice:()=>void}){
 const [need,setNeed]=useState<Need|null>(null);const [contact,setContact]=useState<ContactWay|null>(null);const [age,setAge]=useState<AgeBand|null>(null);const [region,setRegion]=useState<Region|null>(null);
 const isMiddle=(i:SupportItem)=>i.tier==='talk';
 const results=useMemo(()=>matchSupport(supportItems,{need,contact,age,region}).filter(i=>!isMiddle(i)),[need,contact,age,region]);
 const middle=matchSupport(supportItems.filter(isMiddle),{need:null,contact,age,region});// eslint-disable-line react-hooks/exhaustive-deps
 const middleBlock=middle.length>0&&<section className="middle-tier" aria-label="긴급은 아니지만 이야기가 필요할 때"><h2>긴급은 아니지만, 지금 이야기가 필요할 때</h2><p>119·112처럼 급한 상황이 아니어도 전화하거나 글로 이야기할 수 있는 곳이에요.</p><div className="support-list">{middle.map(item=><SupportCard key={item.id} item={item} onPractice={onPractice}/>)}</div></section>;
 return <div className="help-finder">
  <section className="finder-card" aria-label="나에게 맞는 도움 찾기"><span className="step-label"><Sparkles size={12}/>나에게 맞는 도움 찾기 · 1분</span><h2>어떤 도움이 있는지,<br/>나도 받을 수 있는지 먼저 알아봐요.</h2><p>고르는 내용은 저장하거나 보내지 않아요. 모르는 건 건너뛰어도 돼요.</p>
   <Chips label="지금 가장 가까운 마음은?" options={needs} value={need} onChange={setNeed}/>
   <Chips label="연락은 어떤 방법이 편해요?" options={contactWays} value={contact} onChange={setContact}/>
   <Chips label="나이(만)" options={ageBands} value={age} onChange={setAge}/>
   <Chips label="사는 곳" options={regions} value={region} onChange={setRegion}/>
  </section>
  {need==='talk'&&middleBlock}
  {(results.length>0||!middle.length)&&<><div className="section-top"><h2>{need||contact||age||region?(need==='talk'?`함께 볼 만한 곳 ${results.length}곳`:`나에게 맞을 수 있는 곳 ${results.length}곳`):'모든 도움 둘러보기'}</h2></div>
  <div className="support-list">{results.map((item,i)=><SupportCard key={item.id} item={item} onPractice={onPractice} open={i===0&&!!(need||contact)&&need!=='talk'}/>)}{!results.length&&<p className="small-note">조건에 꼭 맞는 곳을 찾지 못했어요. 129나 온통청년(1670-1839)에 전화하면 나에게 맞는 곳을 함께 찾아줘요.</p>}</div></>}
  {need!=='talk'&&middleBlock}
 </div>
}
