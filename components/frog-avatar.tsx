'use client';
import {useId} from 'react';
import {frogColors,type Character,type CharacterGame} from '@/lib/character';
export function FrogAvatar({character,equipped={},className=''}:{character:Character;equipped?:CharacterGame['equipped'];className?:string}){
 const uid=useId().replace(/:/g,'');const p=frogColors.find(c=>c.id===character.color)??frogColors[0];
 return <svg className={'frog-avatar '+className} viewBox="0 0 320 320" role="img" aria-label={`${character.name}의 개구리 캐릭터`}>
 <defs><linearGradient id={uid+'skin'} x1="0" y1="0" x2=".6" y2="1"><stop stopColor={p.light}/><stop offset="1" stopColor={p.main}/></linearGradient><radialGradient id={uid+'belly'}><stop stopColor="#fff7d9"/><stop offset="1" stopColor="#f0e9b9"/></radialGradient><linearGradient id={uid+'gold'} x2="0" y2="1"><stop stopColor="#ffdf7e"/><stop offset="1" stopColor="#d7a742"/></linearGradient></defs>
 <ellipse cx="160" cy="281" rx="87" ry="13" fill="#427b5020"/>
 <g stroke={p.dark} strokeWidth="1.4" strokeOpacity=".35" strokeLinejoin="round">
 <ellipse cx="160" cy="222" rx="62" ry="62" fill={`url(#${uid}skin)`}/><ellipse cx="160" cy="230" rx="42" ry="43" fill={`url(#${uid}belly)`} stroke="none"/>
 <ellipse cx="103" cy="249" rx="29" ry="30" transform="rotate(25 103 249)" fill={p.main}/><ellipse cx="217" cy="249" rx="29" ry="30" transform="rotate(-25 217 249)" fill={p.main}/>
 {equipped.outfit==='hoodie'&&<g stroke="#5c9f94" fill="#92c8ba"><path d="M111 188Q160 172 209 188L219 249Q161 273 101 249Z"/><path d="M120 188Q160 218 200 188" fill="none" strokeWidth="7"/><path d="M136 239q24-17 48 0v15h-48Z" fill="#b1ddcd"/><path d="M150 207v17m20-17v17" stroke="#fff5d7" strokeWidth="3"/></g>}
 {equipped.outfit==='raincoat'&&<g fill="#edce70" stroke="#bb9e40"><path d="M111 185Q160 165 209 185L224 263Q160 277 96 263Z"/><path d="m128 185 32 29 32-29" fill="#fff0ab"/><path d="M160 215v55"/><circle cx="168" cy="228" r="2" fill="#9b883c"/><circle cx="168" cy="244" r="2" fill="#9b883c"/></g>}
 <ellipse cx="119" cy="229" rx="15" ry="29" transform="rotate(-15 119 229)" fill={`url(#${uid}skin)`}/><ellipse cx="201" cy="229" rx="15" ry="29" transform="rotate(15 201 229)" fill={`url(#${uid}skin)`}/>
 <path d="M67 145Q60 116 89 102Q83 61 113 55Q143 50 154 78Q165 81 174 78Q188 48 217 57Q242 65 231 103Q259 117 253 147Q251 204 160 207Q71 207 67 145Z" fill={`url(#${uid}skin)`}/>
 <path d="M81 156Q82 129 113 131Q142 135 160 143Q180 135 209 131Q239 129 240 157Q238 195 160 197Q84 195 81 156Z" fill={`url(#${uid}belly)`} stroke="none"/>
 </g>
 <ellipse cx="112" cy="119" rx="9" ry="12" fill="#35392d"/><ellipse cx="208" cy="119" rx="9" ry="12" fill="#35392d"/><circle cx="115" cy="115" r="3" fill="white"/><circle cx="211" cy="115" r="3" fill="white"/>
 <ellipse cx="94" cy="157" rx="14" ry="10" fill="#e8a094" opacity=".65"/><ellipse cx="226" cy="157" rx="14" ry="10" fill="#e8a094" opacity=".65"/>
 <circle cx="153" cy="147" r="2" fill="#56533c"/><circle cx="167" cy="147" r="2" fill="#56533c"/><path d="M145 158Q160 173 175 158" fill="none" stroke="#56533c" strokeWidth="3.5" strokeLinecap="round"/>
 <g fill={p.main} stroke={p.dark} strokeOpacity=".3"><ellipse cx="112" cy="273" rx="27" ry="9"/><ellipse cx="208" cy="273" rx="27" ry="9"/></g>
 {equipped.outfit==='scarf'&&<g fill="#e9b0a5" stroke="#c78e83" strokeWidth="1.3"><path d="M112 195q48 17 96 0v16q-48 17-96 0Z"/><path d="m183 210 17 3 7 39-23 5Z"/><path d="m188 244 17-3" stroke="#f7d7c5" strokeWidth="4"/></g>}
 {equipped.eyes==='round'&&<g fill="#ffffff20" stroke="#887359" strokeWidth="3.5"><circle cx="111" cy="123" r="23"/><circle cx="209" cy="123" r="23"/><path d="M134 123q26-12 52 0M88 119l-14-6M232 119l14-6" fill="none"/></g>}
 {equipped.eyes==='sunglasses'&&<g stroke="#48534b" strokeWidth="4"><path d="M84 110h54l-3 24q-23 24-47 0Z" fill="#536c69"/><path d="M182 110h54l-4 24q-23 24-47 0Z" fill="#536c69"/><path d="M138 116q22-9 44 0M84 113l-10-3M236 113l10-3" fill="none"/><path d="m95 116 15 17m83-17 15 17" stroke="#b9ded3" strokeWidth="3" opacity=".5"/></g>}
 {equipped.head==='sprout'&&<g><path d="M160 77V50" stroke="#78974e" strokeWidth="4" strokeLinecap="round"/><path d="M159 58q-32 0-32-24 32-2 32 24" fill="#91b95e"/><path d="M160 51q0-26 31-25-2 25-31 25" fill="#b5d47b"/></g>}
 {equipped.head==='daisy'&&<g transform="translate(208 61)"><g fill="#fffaf0" stroke="#e9dcb8" strokeWidth=".6">{[0,60,120,180,240,300].map(a=><ellipse key={a} cy="-13" rx="7" ry="12" transform={`rotate(${a})`}/>)}</g><circle r="9" fill="#e8bd5e"/></g>}
 {equipped.head==='bucket'&&<g stroke="#b59764" strokeWidth="1.4"><path d="M104 65 116 23Q160 11 204 23L216 65Z" fill="#e9d7ac"/><path d="M100 57Q160 72 220 57l16 21Q161 100 84 78Z" fill="#f3e3c1"/><path d="M111 44q49 13 98 0" fill="none" strokeWidth="5" stroke="#c5b383"/></g>}
 {equipped.head==='crown'&&<g fill={`url(#${uid}gold)`} stroke="#c49c44" strokeWidth="1.5"><path d="m116 66-9-39 29 17 24-31 24 31 29-17-9 39Z"/><path d="M117 67q43 12 86 0v10q-43 12-86 0Z"/><circle cx="160" cy="53" r="5" fill="#a9c88c"/><circle cx="107" cy="25" r="4"/><circle cx="160" cy="12" r="4"/><circle cx="213" cy="25" r="4"/></g>}
 </svg>
}
