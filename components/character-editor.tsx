'use client';
/* eslint-disable @next/next/no-img-element */
import {Check} from 'lucide-react';
import {frogColors,type Character,type CharacterGame} from '@/lib/character';
import {Frog3D} from './frog-3d';
export function CharacterEditor({value,onChange,equipped={head:'sprout'},preview=true}:{value:Character;onChange:(c:Character)=>void;equipped?:CharacterGame['equipped'];preview?:boolean}){
 return <div className="character-editor">{preview&&<div className="character-creation-preview"><Frog3D character={value} equipped={equipped} lines={[`안녕, 나는 ${value.name.trim()||'너의 친구'}!`,'만나서 반가워','폴짝!']}/></div>}
 <label className="character-name-label" htmlFor="frog-name">친구를 뭐라고 부를까요? <small>실명 대신 별명</small></label><div className="character-name-input"><input id="frog-name" value={value.name} maxLength={12} placeholder="예: 새봄" autoComplete="off" onChange={e=>onChange({...value,name:e.target.value})}/><span>{value.name.length}/12</span></div>
 <fieldset className="character-colors"><legend>마음에 드는 색을 골라요</legend><div>{frogColors.map(c=><button key={c.id} type="button" title={c.name} aria-label={c.name} aria-pressed={value.color===c.id} style={{'--swatch':c.main} as React.CSSProperties} onClick={()=>onChange({...value,color:c.id})}><img src={`/art/face-${c.id}.png`} alt="" draggable={false}/>{value.color===c.id&&<Check size={13}/>}<span>{c.name}</span></button>)}</div></fieldset></div>
}
