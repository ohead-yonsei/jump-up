'use client';
import {useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {frogColors,growthStages,type CharacterGame,type FrogColor} from '@/lib/character';
import {Frog3D} from './frog-3d';
const outfits:{label:string;equipped:CharacterGame['equipped']}[]=[{label:'새싹',equipped:{head:'sprout'}},{label:'그대로',equipped:{}},{label:'왕관 · 안경',equipped:{head:'crown',eyes:'round'}},{label:'후드티 · 머그',equipped:{outfit:'hoodie',hand:'mug'}}];
/** Every growth stage side by side, to compare the shapes in one palette. */
export function GrowthPreview(){
 const [color,setColor]=useState<FrogColor>('leaf');const [outfit,setOutfit]=useState(0);
 return <main className="growth-page">
  <a className="back-button" href="/"><ArrowLeft size={16}/>폴짝으로</a>
  <span className="eyebrow">GROWING UP</span><h1>알에서 다 자란 개구리까지</h1>
  <p>같은 친구가 자라는 다섯 모습이에요. 누르면 반응하고, 옆으로 밀면 돌아봐요.</p>
  <div className="growth-controls">
   <div role="radiogroup" aria-label="색">{frogColors.map(c=><button key={c.id} role="radio" aria-checked={color===c.id} aria-label={c.name} className={color===c.id?'on':''} style={{background:c.main}} onClick={()=>setColor(c.id)}/>)}</div>
   <div role="radiogroup" aria-label="꾸미기">{outfits.map((o,i)=><button key={o.label} role="radio" aria-checked={outfit===i} className={'chip'+(outfit===i?' on':'')} onClick={()=>setOutfit(i)}>{o.label}</button>)}</div>
  </div>
  <ol className="growth-row">{growthStages.map((s,i)=><li key={s.id}>
   <div className="growth-frog"><Frog3D character={{name:s.name,color}} equipped={outfits[outfit].equipped} growth={s.id}/></div>
   <strong><span>{i+1}</span>{s.name}</strong><p>{s.note}</p>
  </li>)}</ol>
 </main>
}
