'use client';
/* eslint-disable @next/next/no-img-element */
import {useRef,useState} from 'react';
import {Leaf,ArrowRight,Check,Gift,Shirt,Glasses,Crown,X,Sparkles,Coffee,Smile,Palette} from 'lucide-react';
import {activityDays,balance,lookCost,looks,suggestName,wardrobeItems,type Character,type CharacterGame,type Slot} from '@/lib/character';
import {Frog3D,FrogStill,haptic,type Frog3DHandle} from './frog-3d';
import {CharacterEditor} from './character-editor';
type Tab='looks'|Slot|'color';
const tabs:{id:Tab;label:string;Icon:typeof Crown}[]=[{id:'looks',label:'코디 예시',Icon:Sparkles},{id:'head',label:'모자',Icon:Crown},{id:'eyes',label:'안경',Icon:Glasses},{id:'outfit',label:'옷',Icon:Shirt},{id:'hand',label:'소품',Icon:Coffee},{id:'face',label:'표정',Icon:Smile},{id:'color',label:'색 · 이름',Icon:Palette}];
const slotLabel:Record<Slot,string>={head:'모자',eyes:'안경',outfit:'옷',hand:'소품',face:'표정'};
type Props={game:CharacterGame;save:boolean;demo:boolean;onCharacter:(c:Character)=>void;onCollect:(id:string)=>void;onLook:(id:string)=>void;onRemove:(slot:Slot)=>void;onEarn:()=>void;onSave:()=>void};
export function CharacterCloset({game,save,demo,onCharacter,onCollect,onLook,onRemove,onEarn,onSave}:Props){
 const [tab,setTab]=useState<Tab>('looks');const [selected,setSelected]=useState<string|null>(null);const [lookId,setLookId]=useState<string|null>(null);const [draft,setDraft]=useState<Character>(()=>game.character??{name:suggestName(),color:'leaf'});
 const frog=useRef<Frog3DHandle>(null);
 const coins=balance(game);const item=wardrobeItems.find(i=>i.id===selected);const look=looks.find(l=>l.id===lookId);
 const owned=!!item&&game.owned.includes(item.id);const wearing=!!item&&game.equipped[item.slot]===item.id;const cost=look?lookCost(game,look):0;
 const preview=look?look.equipped:item?{...game.equipped,[item.slot]:item.id}:game.equipped;
 const shown:Character=tab==='color'?draft:game.character??draft;
 function pick(next:{item?:string;look?:string}){setSelected(next.item??null);setLookId(next.look??null);haptic();frog.current?.react('spin');}
 function switchTab(next:Tab){setTab(next);setSelected(null);setLookId(null);if(next==='color'&&game.character)setDraft(game.character);}
 function finishCreate(){if(!draft.name.trim())return;onCharacter(draft);}
 if(!game.character)return <section className="closet-create"><span className="eyebrow">MY LITTLE FRIEND</span><h1>우리, 처음 만났네.</h1><p>내 속도로 봄을 만날 친구를 만들어 주세요.</p><CharacterEditor value={draft} onChange={setDraft}/><p className="welcome-gift"><Gift size={17}/>처음 만난 선물, 새싹과 30잎을 드려요.</p><button className="primary full" disabled={!draft.name.trim()} onClick={finishCreate}>나의 친구 만들기<ArrowRight size={17}/></button></section>;
 const changed=draft.name.trim()!==game.character.name||draft.color!==game.character.color;
 return <div className="closet-app">
  <section className="closet-stage" aria-label="캐릭터 꾸미기 미리보기">
   <div className="closet-stage-top"><div><strong>{game.character.name}</strong><span>함께한 날 {activityDays(game)}일 · {game.owned.length}/{wardrobeItems.length}개 소장</span></div><span className="leaf-wallet" aria-label={`보유 포인트 ${coins}잎`}><Leaf size={16}/><strong>{coins}</strong><span>잎</span></span></div>
   <div className="closet-stage-frog"><Frog3D ref={frog} character={shown} equipped={preview} lines={look||item?['어때, 잘 어울려?','이 모습도 나야!','두근두근, 새 옷!']:undefined}/></div>
   <div className="wearing-chips" aria-label="지금 입고 있는 것">{(Object.keys(slotLabel) as Slot[]).filter(s=>game.equipped[s]).map(s=>{const worn=wardrobeItems.find(i=>i.id===game.equipped[s])!;return <button key={s} onClick={()=>{onRemove(s);setSelected(null);setLookId(null)}} aria-label={`${worn.name} 벗기`}>{worn.name}<X size={12}/></button>})}{!Object.values(game.equipped).some(Boolean)&&<span>있는 그대로의 모습</span>}</div>
  </section>
  <div className="closet-tabs" role="tablist" aria-label="꾸미기 종류">{tabs.map(t=><button key={t.id} role="tab" aria-selected={tab===t.id} className={tab===t.id?'selected':''} onClick={()=>switchTab(t.id)}><t.Icon size={15}/>{t.label}</button>)}</div>
  {tab==='looks'?<><p className="closet-hint">마음에 드는 예시를 누르면 내 친구가 먼저 입어봐요. 친구의 색은 그대로예요.</p><div className="look-grid">{looks.map(l=>{const need=lookCost(game,l);const on=Object.entries(l.equipped).every(([s,id])=>game.equipped[s as Slot]===id)&&Object.values(game.equipped).filter(Boolean).length===Object.keys(l.equipped).length;return <button key={l.id} className={'look-card'+(lookId===l.id?' selected':'')} aria-pressed={lookId===l.id} onClick={()=>pick({look:l.id})}><img src={l.image} alt="" loading="lazy" draggable={false}/><strong>{l.title}</strong><small>{l.note}</small><span className={'look-cost'+(on?' on':'')}>{on?<><Check size={11}/>입는 중</>:need?<><Leaf size={11}/>{need}잎</>:'바로 입기'}</span></button>})}</div></>
  :tab==='color'?<div className="closet-color"><CharacterEditor value={draft} onChange={setDraft} preview={false}/><button className="primary full" disabled={!draft.name.trim()||!changed} onClick={()=>{onCharacter(draft);frog.current?.react('cheer','새 모습도 마음에 들어!');}}>이 모습으로 함께하기<Check size={17}/></button></div>
  :<div className="wardrobe-grid">{wardrobeItems.filter(i=>i.slot===tab).map(i=>{const has=game.owned.includes(i.id);const on=game.equipped[i.slot]===i.id;return <button className={'wardrobe-item'+(selected===i.id?' selected':'')} aria-pressed={selected===i.id} aria-label={`${i.name}, ${on?'착용 중':has?'소장 중':i.price+'잎'}, 미리 입어보기`} key={i.id} onClick={()=>pick({item:i.id})}>
    <span className={'item-badge'+(on?' on':has?' has':'')}>{on?<><Check size={10}/>착용 중</>:has?'내 옷장':i.tag}</span>
    <FrogStill character={game.character!} equipped={{[i.slot]:i.id}} framing={i.slot==='hand'||i.slot==='outfit'?'portrait':'face'}/>
    <strong>{i.name}</strong><span className="item-price">{has?'내 옷장':i.price?<><Leaf size={12}/>{i.price}잎</>:'무료'}</span></button>})}</div>}
  <details className="earning-guide"><summary><Leaf size={18}/>작은 활동은 어떻게 잎이 되나요?</summary><div><p><strong>처음 친구 만들기</strong><span>30잎 · 한 번</span></p><p><strong>미션 해보기</strong><span>10잎 · 하루 최대 3개</span></p><p><strong>대화하고 연습 기록 남기기</strong><span>15잎 · 하루 최대 2개</span></p><p><strong>쉬어가기</strong><span>5잎 · 하루 한 번</span></p><p><strong>며칠 쉬다가 다시 오기</strong><span>환영 선물 10잎</span></p><p><strong>표정 바꾸기</strong><span>언제나 무료</span></p><small>같은 미션·대화 상황은 하루 한 번 적립해요. 오래 쉬어도 모은 잎과 아이템은 줄어들지 않고, 돌아오면 반겨줘요. 다른 사람과 비교하는 순위는 없어요.</small></div></details>
  <button className="wardrobe-earn" onClick={onEarn}><span><Leaf size={21}/><span>오늘의 작은 시도 만나기<small>내 속도로, 할 수 있는 만큼만.</small></span></span><ArrowRight size={18}/></button>
  {!save&&!demo&&<div className="character-storage"><span>다음 방문에도 친구와 옷장을 만나려면<br/><strong>이 기기에 기록 저장을 켜주세요.</strong></span><button onClick={onSave}>저장 켜기<ArrowRight size={15}/></button></div>}{demo&&<p className="character-demo-note">발표용 가상 포인트와 아이템이에요. 개인 기록에는 반영되지 않아요.</p>}
  {(item||look)&&<div className="closet-action" role="region" aria-label="선택한 꾸미기" aria-live="polite">
   {item?<><div className="closet-action-text"><h3>{item.name}</h3><p className={!owned&&coins<item.price?'short':''}>{!owned&&coins<item.price?`${item.price-coins}잎 더 모으면 돼요`:`${slotLabel[item.slot]} · ${item.description}`}</p></div>
    <button className="primary" disabled={!owned&&coins<item.price} onClick={()=>{if(wearing)onRemove(item.slot);else{onCollect(item.id);frog.current?.react('cheer');}setSelected(null)}}>{owned?<Check size={15}/>:<Leaf size={15}/>}{wearing?'벗기':owned?'입기':item.price?`${item.price}잎 데려오기`:'무료로 입기'}</button></>
   :look&&<><div className="closet-action-text"><h3>{look.title}</h3><p className={coins<cost?'short':''}>{coins<cost?`${cost-coins}잎 더 모으면 돼요`:cost?`새로 데려올 아이템 ${cost}잎`:'모두 내 옷장에 있어요'}</p></div>
    <button className="primary" disabled={coins<cost} onClick={()=>{onLook(look.id);frog.current?.react('cheer');setLookId(null)}}>{cost?<Leaf size={15}/>:<Check size={15}/>}{cost?`${cost}잎 완성하기`:'이 코디 입기'}</button></>}
   <button className="closet-action-close" aria-label="선택 취소" onClick={()=>{setSelected(null);setLookId(null)}}><X size={16}/></button>
  </div>}
 </div>
}
