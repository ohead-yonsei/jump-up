'use client';
/* eslint-disable @next/next/no-img-element */
import {useEffect,useRef,useState} from 'react';
import {Leaf,ArrowLeft,ArrowRight,Check,Gift,Shirt,Glasses,Crown,X,Sparkles,Coffee,Smile,Palette} from 'lucide-react';
import {activityDays,balance,canWear,growthOf,lookCost,looks,nextGrowth,suggestName,wardrobeItems,wearsFrom,type Character,type CharacterGame,type Slot} from '@/lib/character';
import {Frog3D,FrogStill,haptic,type Frog3DHandle} from './frog-3d';
import {CharacterEditor} from './character-editor';
import {useTonePreview} from './tone';
type Tab='looks'|Slot|'color';
const tabs:{id:Tab;label:string;Icon:typeof Crown}[]=[{id:'looks',label:'코디 예시',Icon:Sparkles},{id:'head',label:'모자',Icon:Crown},{id:'eyes',label:'안경',Icon:Glasses},{id:'outfit',label:'옷',Icon:Shirt},{id:'hand',label:'소품',Icon:Coffee},{id:'face',label:'표정',Icon:Smile},{id:'color',label:'색 · 이름',Icon:Palette}];
const slotLabel:Record<Slot,string>={head:'모자',eyes:'안경',outfit:'옷',hand:'소품',face:'표정'};
/** A bottom sheet for how leaves are earned, so the closet itself stays on one screen. */
function Sheet({label,onClose,children}:{label:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();return ()=>{if(d?.open)d.close();};},[]);
 return <dialog ref={ref} className="home-sheet" aria-label={label} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===ref.current)onClose()}}><div className="dialog-content"><button className="icon-button close" aria-label="닫기" onClick={onClose}><X size={21}/></button>{children}</div></dialog>;
}
type Props={game:CharacterGame;save:boolean;demo:boolean;onCharacter:(c:Character)=>void;onCollect:(id:string)=>void;onLook:(id:string)=>void;onRemove:(slot:Slot)=>void;onEarn:()=>void;onSave:()=>void;onBack:()=>void};
export function CharacterCloset({game,save,demo,onCharacter,onCollect,onLook,onRemove,onEarn,onSave,onBack}:Props){
 const [tab,setTab]=useState<Tab>('looks');const [guide,setGuide]=useState(false);const [selected,setSelected]=useState<string|null>(null);const [lookId,setLookId]=useState<string|null>(null);const [draft,setDraft]=useState<Character>(()=>game.character??{name:suggestName(),color:'leaf'});useTonePreview(!game.character||tab==='color'?draft.color:null);
 const frog=useRef<Frog3DHandle>(null);
 const coins=balance(game);const item=wardrobeItems.find(i=>i.id===selected);const look=looks.find(l=>l.id===lookId);
 const owned=!!item&&game.owned.includes(item.id);const wearing=!!item&&game.equipped[item.slot]===item.id;const cost=look?lookCost(game,look):0;
 const preview=look?look.equipped:item?{...game.equipped,[item.slot]:item.id}:game.equipped;
 // What the friend cannot wear yet is tried on the stage where it first fits, marked as a preview; it can be brought home early and kept until then.
 const growth=growthOf(game),next=nextGrowth(game);const trying=(look?Object.keys(look.equipped):item?[item.slot]:[]) as Slot[];const fits=trying.every(s=>canWear(growth.id,s));const later=fits?null:wearsFrom(...trying);
 const shown:Character=tab==='color'?draft:game.character??draft;
 function pick(next:{item?:string;look?:string}){setSelected(next.item??null);setLookId(next.look??null);haptic();frog.current?.react('spin');}
 function switchTab(next:Tab){setTab(next);setSelected(null);setLookId(null);if(next==='color'&&game.character)setDraft(game.character);}
 function finishCreate(){if(!draft.name.trim())return;onCharacter(draft);}
 if(!game.character)return <section className="closet-create"><span className="eyebrow">MY LITTLE FRIEND</span><h1>우리, 처음 만났네.</h1><p>내 속도로 봄을 만날 친구를 만들어 주세요.</p><CharacterEditor value={draft} onChange={setDraft} growth="egg"/><p className="welcome-gift"><Gift size={17}/>처음 만난 선물, 새싹과 30잎을 드려요.</p><button className="primary full" disabled={!draft.name.trim()} onClick={finishCreate}>나의 친구 만들기<ArrowRight size={17}/></button></section>;
 const changed=draft.name.trim()!==game.character.name||draft.color!==game.character.color;
 const kept=(slot:Slot)=>!canWear(growth.id,slot);
 return <div className="closet-app">
  <section className="closet-stage" aria-label="캐릭터 꾸미기 미리보기">
   <div className="closet-stage-top"><button className="closet-home" onClick={onBack} aria-label="연못으로 돌아가기"><ArrowLeft size={17}/></button><div><strong>{game.character.name}</strong>{later?<span className="preview-tag"><Sparkles size={11}/>미리보기 · {later.name}</span>:<span>{growth.name}</span>}</div><button className="leaf-wallet" onClick={()=>setGuide(true)} aria-label={`모은 잎 ${coins}잎, 잎 모으는 방법 보기`}><Leaf size={15}/><strong>{coins}</strong><span>잎</span></button></div>
   <div className="closet-stage-frog"><Frog3D ref={frog} character={shown} equipped={preview} growth={later?later.id:growth.id} lines={!fits?['자라면 이렇게 입을래!','미리 입어봤어!']:look||item?['어때, 잘 어울려?','이 모습도 나야!','두근두근, 새 옷!']:undefined}/></div>
   {item||look?<div className="closet-action" role="region" aria-label="선택한 꾸미기" aria-live="polite">
    {item?<><div className="closet-action-text"><h3>{item.name}</h3><p className={!owned&&coins<item.price?'short':''}>{!owned&&coins<item.price?`${item.price-coins}잎 더 모으면 돼요`:later?'자라면 입어요':item.description}</p></div>
     <button className="primary" disabled={!owned&&coins<item.price} onClick={()=>{if(wearing)onRemove(item.slot);else{onCollect(item.id);frog.current?.react('cheer');}setSelected(null)}}>{owned?<Check size={15}/>:<Leaf size={15}/>}{wearing?(later?'내려놓기':'벗기'):owned?(later?'자라면 입기':'입기'):coins<item.price?`${item.price}잎`:item.price?`${item.price}잎${later?' 미리':''} 데려오기`:later?'미리 받아두기':'무료로 입기'}</button></>
    :look&&<><div className="closet-action-text"><h3>{look.title}</h3><p className={coins<cost?'short':''}>{coins<cost?`${cost-coins}잎 더 모으면 돼요`:later?'자라면 입어요':cost?'미리 입어보는 중':'모두 내 옷장에 있어요'}</p></div>
     <button className="primary" disabled={coins<cost} onClick={()=>{onLook(look.id);frog.current?.react('cheer');setLookId(null)}}>{cost?<Leaf size={15}/>:<Check size={15}/>}{coins<cost?`${cost}잎`:cost?`${cost}잎${later?' 미리':''} 데려오기`:later?'자라면 입기':'이 코디 입기'}</button></>}
    <button className="closet-action-close" aria-label="선택 취소" onClick={()=>{setSelected(null);setLookId(null)}}><X size={16}/></button>
   </div>
   :<div className="wearing-chips" aria-label="지금 입고 있는 것">{(Object.keys(slotLabel) as Slot[]).filter(s=>game.equipped[s]).map(s=>{const worn=wardrobeItems.find(i=>i.id===game.equipped[s])!;return <button key={s} className={kept(s)?'kept':''} onClick={()=>{onRemove(s);setSelected(null);setLookId(null)}} aria-label={kept(s)?`${worn.name}, 자라면 입어요. 내려놓기`:`${worn.name} 벗기`}>{worn.name}{kept(s)&&<small>보관 중</small>}<X size={12}/></button>})}{!Object.values(game.equipped).some(Boolean)&&<span>있는 그대로의 모습</span>}</div>}
  </section>
  <div className="closet-tabs" role="tablist" aria-label="꾸미기 종류">{tabs.map(t=><button key={t.id} role="tab" aria-selected={tab===t.id} className={tab===t.id?'selected':''} onClick={()=>switchTab(t.id)}><t.Icon size={15}/>{t.label}</button>)}</div>
  <div className="closet-shelf">
  {tab==='looks'?<div className="look-grid">{looks.map(l=>{const need=lookCost(game,l);const on=Object.entries(l.equipped).every(([s,id])=>game.equipped[s as Slot]===id)&&Object.values(game.equipped).filter(Boolean).length===Object.keys(l.equipped).length;const wait=on&&(Object.keys(l.equipped) as Slot[]).some(kept);return <button key={l.id} className={'look-card'+(lookId===l.id?' selected':'')} aria-pressed={lookId===l.id} onClick={()=>pick({look:l.id})}><img src={l.image} alt="" loading="lazy" draggable={false}/><strong>{l.title}</strong><span className={'look-cost'+(on?' on':'')}>{on?<><Check size={11}/>{wait?'보관 중':'입는 중'}</>:need?<><Leaf size={11}/>{need}잎</>:'바로 입기'}</span></button>})}</div>
  :tab==='color'?<div className="closet-color"><CharacterEditor value={draft} onChange={setDraft} preview={false}/><button className="primary full" disabled={!draft.name.trim()||!changed} onClick={()=>{onCharacter(draft);frog.current?.react('cheer','새 모습도 마음에 들어!');}}>이 모습으로 함께하기<Check size={17}/></button></div>
  :<div className="wardrobe-grid">{wardrobeItems.filter(i=>i.slot===tab).map(i=>{const has=game.owned.includes(i.id);const on=game.equipped[i.slot]===i.id;const wait=on&&kept(i.slot);return <button className={'wardrobe-item'+(selected===i.id?' selected':'')} aria-pressed={selected===i.id} aria-label={`${i.name}, ${wait?'보관 중':on?'착용 중':has?'소장 중':i.price+'잎'}, 미리 보기`} key={i.id} onClick={()=>pick({item:i.id})}>
    <span className={'item-badge'+(on?' on':has?' has':'')}>{on?<><Check size={10}/>{wait?'보관 중':'착용 중'}</>:has?'내 옷장':i.tag}</span>
    <FrogStill character={game.character!} equipped={{[i.slot]:i.id}} framing={i.slot==='hand'||i.slot==='outfit'?'portrait':'face'}/>
    <strong>{i.name}</strong><span className="item-price">{has?'내 옷장':i.price?<><Leaf size={12}/>{i.price}잎</>:'무료'}</span></button>})}</div>}
  </div>
  {guide&&<Sheet label="잎 모으는 방법" onClose={()=>setGuide(false)}><div className="leaf-guide"><h2><Leaf size={19}/>잎은 이렇게 모여요</h2><p className="leaf-guide-now">{growth.name} · 함께한 날 {activityDays(game)}일 · {next?`${next.days}일 더 함께하면 ${next.stage.name}`:'다 자란 모습이에요'}</p>
   <p><strong>처음 친구 만들기</strong><span>30잎 · 한 번</span></p><p><strong>미션 해보기</strong><span>10잎 · 하루 최대 3개</span></p><p><strong>대화하고 연습 기록 남기기</strong><span>15잎 · 하루 최대 2개</span></p><p><strong>쉬어가기</strong><span>5잎 · 하루 한 번</span></p><p><strong>며칠 쉬다가 다시 오기</strong><span>환영 선물 10잎</span></p><p><strong>표정 바꾸기</strong><span>언제나 무료</span></p>
   <small>오래 쉬어도 모은 잎과 아이템은 줄어들지 않아요. 다른 사람과 비교하는 순위는 없어요.</small>
   <button className="wardrobe-earn" onClick={()=>{setGuide(false);onEarn();}}><span><Leaf size={21}/><span>오늘의 작은 시도 만나기<small>내 속도로, 할 수 있는 만큼만.</small></span></span><ArrowRight size={18}/></button>
   {!save&&!demo&&<div className="character-storage"><span>다음 방문에도 친구와 옷장을 만나려면<br/><strong>이 기기에 기록 저장을 켜주세요.</strong></span><button onClick={onSave}>저장 켜기<ArrowRight size={15}/></button></div>}{demo&&<p className="character-demo-note">발표용 가상 포인트와 아이템이에요. 개인 기록에는 반영되지 않아요.</p>}
  </div></Sheet>}
 </div>
}
