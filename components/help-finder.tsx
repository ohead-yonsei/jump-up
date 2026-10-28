'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Check,ChevronDown,ChevronRight,Copy,Globe,MapPin,MessageCircle,MessagesSquare,Phone,ShieldCheck,Sparkles} from 'lucide-react';
import {supportItems,needs,contactWays,ageBands,regions,matchSupport,firstWords,channelLabel,type SupportItem,type Need,type ContactWay,type AgeBand,type Region} from '@/lib/support';
const tierLabel:Record<SupportItem['tier'],string>={talk:'이야기·상담',space:'공간·모임',program:'신청형 지원',info:'정보 찾기',crisis:'긴급'};
function Chips<T extends string>({label,options,value,onChange}:{label:string;options:readonly {id:T;label:string}[];value:T|null;onChange:(v:T|null)=>void}){
 return <fieldset className="finder-q"><legend>{label}</legend><div>{options.map(o=><button key={o.id} type="button" aria-pressed={value===o.id} className={value===o.id?'selected':''} onClick={()=>onChange(value===o.id?null:o.id)}>{value===o.id&&<Check size={13}/>}{o.label}</button>)}</div></fieldset>
}
/** One service, answered in the order people asked: what help, can I use it, how to start, what to say. */
type OnContact=(item:SupportItem,channel:'phone'|'text'|'web')=>void;
const digits=(v:string)=>v.replace(/[^0-9]/g,'');
/** Every way to reach one service in a bottom sheet, with practicing first as a way too. */
function ContactSheet({item,onClose,onPractice,onContact}:{item:SupportItem;onClose:()=>void;onPractice:()=>void;onContact?:OnContact}){
 const ref=useRef<HTMLDialogElement>(null);const [copied,setCopied]=useState('');
 useEffect(()=>{const d=ref.current;d?.showModal();return ()=>d?.close();},[]);
 const copy=(v:string)=>{navigator.clipboard?.writeText(v).then(()=>setCopied(v)).catch(()=>{});};
 const visit=(v:string)=>`https://map.kakao.com/link/search/${encodeURIComponent((item.region==='전국'?'':item.region+' ')+v)}`;
 const row=(icon:React.ReactNode,tone:string,title:string,sub:React.ReactNode,end:React.ReactNode=<ChevronRight size={18}/>)=><><span className={'contact-ic '+tone}>{icon}</span><span className="contact-text"><strong>{title}</strong><small>{sub}</small></span>{end}</>;
 return <dialog ref={ref} className="contact-sheet" aria-label={`${item.short} 문의 방법`} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===ref.current)onClose()}}><div className="dialog-content">
  <h2>어떤 방법으로 문의할까요?</h2><p>편한 방법을 골라보세요. 폴짝이와 먼저 연습해도 좋아요.</p>
  <div className="contact-options">
   {item.channels.map(c=>{const key=c.type+c.value;const hours=c.hours?` · ${c.hours}`:'';
    if(c.type==='phone')return <a key={key} className="contact-option" href={'tel:'+digits(c.value)} onClick={()=>onContact?.(item,'phone')}>{row(<Phone size={19}/>,'phone','전화로 문의하기',c.value+hours)}</a>;
    if(c.type==='text')return <a key={key} className="contact-option" href={'sms:'+digits(c.value)} onClick={()=>onContact?.(item,'text')}>{row(<MessageCircle size={19}/>,'text','문자로 문의하기',c.value+hours)}</a>;
    if(c.type==='kakao')return <button key={key} type="button" className="contact-option" onClick={()=>copy(c.value)}>{row(<span className="talk">TALK</span>,'kakao','카카오톡으로 문의하기',copied===c.value?'채널 이름을 복사했어요. 카카오톡 검색에 붙여 넣어요.':`카카오톡에서 ‘${c.value}’ 채널을 찾아요${hours}`,<Copy size={17}/>)}</button>;
    if(c.type==='visit')return <a key={key} className="contact-option" href={visit(c.value)} target="_blank" rel="noopener noreferrer">{row(<MapPin size={19}/>,'visit','직접 찾아가기',c.value+hours,<ArrowUpRight size={17}/>)}</a>;
    if(/^https?:/.test(c.value))return <a key={key} className="contact-option" href={c.value} target="_blank" rel="noopener noreferrer" onClick={()=>onContact?.(item,'web')}>{row(c.type==='chat'?<MessagesSquare size={19}/>:<Globe size={19}/>,'web',c.type==='chat'?'채팅으로 상담하기':'온라인으로 신청·문의하기',c.hours??'누리집에서 이어서 해요',<ArrowUpRight size={17}/>)}</a>;
    return <div key={key} className="contact-option is-plain">{row(<Globe size={19}/>,'web',channelLabel[c.type],c.value+hours,null)}</div>;})}
   <a className="contact-option" href={item.url} target="_blank" rel="noopener noreferrer">{row(<ShieldCheck size={19}/>,'home','공식 안내 살펴보기',`프로그램과 일정 · 정보 확인 ${item.checkedAt}`,<ArrowUpRight size={17}/>)}</a>
   <button type="button" className="contact-option practice" onClick={onPractice}>{row(<img src="/icons/tab/practice.webp" alt="" width={26} height={26}/>,'frog','폴짝이와 먼저 연습하기','처음이라 걱정된다면, 함께 연습해요.')}</button>
  </div>
  <button className="secondary full" onClick={onClose}>닫기</button>
 </div></dialog>
}
export function SupportCard({item,onPractice,onContact,open:initial=false}:{item:SupportItem;onPractice:()=>void;onContact?:OnContact;open?:boolean}){
 const [open,setOpen]=useState(initial);const [copied,setCopied]=useState(false);const [sheet,setSheet]=useState(false);const words=firstWords(item);
 return <article className={'support-card tier-'+item.tier}>
  <button className="support-head" aria-expanded={open} onClick={()=>setOpen(!open)}><span className="support-chips"><span className="pill"><MapPin size={12}/>{item.region}</span><span className="pill tier">{tierLabel[item.tier]}</span>{item.cost&&<span className="pill">{item.cost}</span>}</span><h3>{item.title}</h3><p>{item.summary}</p><ChevronDown size={18} className="support-caret"/></button>
  {open&&<div className="support-body">
   {item.help.length>0&&<section><h4>이런 도움을 받을 수 있어요</h4><ul>{item.help.map(h=><li key={h}>{h}</li>)}</ul></section>}
   <section><h4>나도 이용할 수 있을까요?</h4><p>{item.who??'대상 조건은 기관에 확인이 필요해요. 문의만 해도 괜찮아요.'}</p>{item.notRequired.length>0&&<div className="support-free">{item.notRequired.map(n=><span key={n}><Check size={12}/>{n}</span>)}</div>}</section>
   {item.how.length>0&&<section><h4>이렇게 시작해요</h4><ol>{item.how.map(h=><li key={h}>{h}</li>)}</ol></section>}
   {words&&<section className="support-words"><h4>처음 연락할 때 이렇게 말해보세요</h4><blockquote>{words}</blockquote><div className="button-row"><button className="secondary" onClick={()=>{navigator.clipboard?.writeText(words).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1600)}).catch(()=>{})}}><Copy size={15}/>{copied?'복사했어요':'문장 복사'}</button></div></section>}
   <div className="support-actions"><button className="secondary" onClick={onPractice}><img src="/icons/tab/practice.webp" alt="" width={22} height={22}/>폴짝이와 연습하기</button><button className="primary" onClick={()=>setSheet(true)}><Phone size={16}/>문의 방법 보기</button></div>
   <p className="checked-date"><ShieldCheck size={12}/>정보 확인 {item.checkedAt} · 실제 조건과 일정은 기관에서 한 번 더 확인해 주세요.{item.note?` ${item.note}`:''}</p>
  </div>}
  {sheet&&<ContactSheet item={item} onContact={onContact} onClose={()=>setSheet(false)} onPractice={()=>{setSheet(false);onPractice();}}/>}
 </article>
}
/** Three light questions, then services that fit. The answers are not saved or sent; a tapped contact button joins the person's own records. */
export function HelpFinder({onPractice,onContact}:{onPractice:()=>void;onContact?:OnContact}){
 const [need,setNeed]=useState<Need|null>(null);const [contact,setContact]=useState<ContactWay|null>(null);const [age,setAge]=useState<AgeBand|null>(null);const [region,setRegion]=useState<Region|null>(null);
 const isMiddle=(i:SupportItem)=>i.tier==='talk';
 const results=useMemo(()=>matchSupport(supportItems,{need,contact,age,region}).filter(i=>!isMiddle(i)),[need,contact,age,region]);
 const middle=matchSupport(supportItems.filter(isMiddle),{need:null,contact,age,region});// eslint-disable-line react-hooks/exhaustive-deps
 const middleBlock=middle.length>0&&<section className="middle-tier" aria-label="긴급은 아니지만 이야기가 필요할 때"><h2>긴급은 아니지만, 지금 이야기가 필요할 때</h2><p>119·112처럼 급한 상황이 아니어도 전화하거나 글로 이야기할 수 있는 곳이에요.</p><div className="support-list">{middle.map(item=><SupportCard key={item.id} item={item} onPractice={onPractice} onContact={onContact}/>)}</div></section>;
 return <div className="help-finder">
  <section className="finder-card" aria-label="나에게 맞는 도움 찾기"><span className="step-label"><Sparkles size={12}/>나에게 맞는 도움 찾기 · 1분</span><h2>어떤 도움이 있는지,<br/>나도 받을 수 있는지 먼저 알아봐요.</h2><p>고르는 내용은 저장하거나 보내지 않아요. 모르는 건 건너뛰어도 돼요.</p>
   <Chips label="지금 가장 가까운 마음은?" options={needs} value={need} onChange={setNeed}/>
   <Chips label="연락은 어떤 방법이 편해요?" options={contactWays} value={contact} onChange={setContact}/>
   <Chips label="나이(만)" options={ageBands} value={age} onChange={setAge}/>
   <Chips label="사는 곳" options={regions} value={region} onChange={setRegion}/>
  </section>
  {need==='talk'&&middleBlock}
  {(results.length>0||!middle.length)&&<><div className="section-top"><h2>{need||contact||age||region?(need==='talk'?`함께 볼 만한 곳 ${results.length}곳`:`나에게 맞을 수 있는 곳 ${results.length}곳`):'모든 도움 둘러보기'}</h2></div>
  <div className="support-list">{results.map((item,i)=><SupportCard key={item.id} item={item} onPractice={onPractice} onContact={onContact} open={i===0&&!!(need||contact)&&need!=='talk'}/>)}{!results.length&&<p className="small-note">조건에 꼭 맞는 곳을 찾지 못했어요. 129나 온통청년(1670-1839)에 전화하면 나에게 맞는 곳을 함께 찾아줘요.</p>}</div></>}
  {need!=='talk'&&middleBlock}
 </div>
}
