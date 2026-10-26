'use client';
import {Check} from 'lucide-react';
import {frogColors,type Character,type CharacterGame} from '@/lib/character';
import {FrogAvatar} from './frog-avatar';
export function CharacterEditor({value,onChange,equipped={head:'sprout'}}:{value:Character;onChange:(c:Character)=>void;equipped?:CharacterGame['equipped']}){
 return <div className="character-editor"><div className="character-creation-preview"><span className="avatar-spark spark-one">✦</span><FrogAvatar character={value} equipped={equipped}/><span className="avatar-spark spark-two">✧</span><span className="avatar-plinth"/></div><label className="character-name-label" htmlFor="frog-name">친구를 뭐라고 부를까요? <small>실명 대신 별명</small></label><div className="character-name-input"><input id="frog-name" value={value.name} maxLength={12} placeholder="예: 새봄" autoComplete="off" onChange={e=>onChange({...value,name:e.target.value})}/><span>{value.name.length}/12</span></div><fieldset className="character-colors"><legend>마음에 드는 색을 골라요</legend><div>{frogColors.map(c=><button key={c.id} type="button" title={c.name} aria-label={c.name} aria-pressed={value.color===c.id} style={{background:c.main}} onClick={()=>onChange({...value,color:c.id})}>{value.color===c.id&&<Check size={19}/>}</button>)}</div></fieldset></div>
}
