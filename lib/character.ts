export const frogColors = [
 {id:'leaf',name:'새잎 초록',light:'#d9ed9d',main:'#a0c45c',dark:'#698e40'},
 {id:'mint',name:'연못 민트',light:'#c5e9cf',main:'#83bd9b',dark:'#4e8c72'},
 {id:'peach',name:'복숭아 분홍',light:'#f7d6c0',main:'#e9af9c',dark:'#c78275'},
 {id:'sky',name:'하늘 파랑',light:'#d6e8f3',main:'#9bc7df',dark:'#638fae'},
 {id:'lilac',name:'라일락 보라',light:'#e6def3',main:'#c1acde',dark:'#8e77b5'},
 {id:'butter',name:'햇살 노랑',light:'#f7e7a6',main:'#e6ca77',dark:'#b39a4e'},
] as const;
export type FrogColor=typeof frogColors[number]['id'];
export type Character={name:string;color:FrogColor};
export type Slot='head'|'eyes'|'outfit';
export type WardrobeItem={id:string;name:string;slot:Slot;price:number;description:string;tag:string};
export const wardrobeItems:WardrobeItem[]=[
 {id:'sprout',name:'새싹 한 잎',slot:'head',price:0,description:'우리의 시작을 함께하는 작은 새싹.',tag:'첫 선물'},
 {id:'daisy',name:'봄날의 꽃',slot:'head',price:30,description:'작은 폴짝이 모여 피어난 봄꽃.',tag:'봄의 조각'},
 {id:'bucket',name:'산책 모자',slot:'head',price:60,description:'햇살 좋은 날, 나만의 산책 친구.',tag:'가벼운 외출'},
 {id:'crown',name:'나의 봄 왕관',slot:'head',price:120,description:'내 속도로 쌓아온 날들을 위한 왕관.',tag:'차곡차곡'},
 {id:'round',name:'동그란 안경',slot:'eyes',price:30,description:'익숙한 세상을 조금 새롭게 바라봐요.',tag:'새로운 시선'},
 {id:'sunglasses',name:'햇살 선글라스',slot:'eyes',price:60,description:'눈부신 날에도 여유롭게, 폴짝.',tag:'느긋한 오후'},
 {id:'scarf',name:'포근한 스카프',slot:'outfit',price:40,description:'조금 쌀쌀한 날도 포근하게 감싸줘요.',tag:'따뜻한 마음'},
 {id:'hoodie',name:'연못 후드티',slot:'outfit',price:70,description:'내 연못처럼 편안한 민트색 후드티.',tag:'나의 편안함'},
 {id:'raincoat',name:'노란 비옷',slot:'outfit',price:90,description:'비 오는 날에도 나의 봄은 자라고 있어요.',tag:'비 오는 봄'},
];
export type Reward={key:string;day:string;amount:number;kind:'welcome'|'step'|'practice'|'rest'};
export type CharacterGame={version:1;character:Character|null;owned:string[];equipped:Partial<Record<Slot,string>>;rewards:Reward[]};
export const emptyGame=():CharacterGame=>({version:1,character:null,owned:['sprout'],equipped:{head:'sprout'},rewards:[]});
export function cleanCharacter(value:unknown):Character|null{
 if(!value||typeof value!=='object')return null;const c=value as Record<string,unknown>;
 if(typeof c.name!=='string'||!frogColors.some(p=>p.id===c.color))return null;
 const name=c.name.trim().slice(0,12);return name?{name,color:c.color as FrogColor}:null;
}
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function createCharacter(game:CharacterGame,character:Character,date=new Date()):CharacterGame{
 const checked=cleanCharacter(character);if(!checked)return game;
 return {...game,character:checked,rewards:game.rewards.some(r=>r.key==='welcome')?game.rewards:[...game.rewards,{key:'welcome',day:dayKey(date),amount:30,kind:'welcome'}]};
}
export function balance(game:CharacterGame){return game.rewards.reduce((n,r)=>n+r.amount,0)-wardrobeItems.filter(i=>game.owned.includes(i.id)).reduce((n,i)=>n+i.price,0);}
export function activityDays(game:CharacterGame){return new Set(game.rewards.filter(r=>r.kind!=='welcome').map(r=>r.day)).size;}
export function earnActivity(game:CharacterGame,kind:'step'|'practice'|'rest',id:string,date=new Date()):CharacterGame{
 if(!id.trim())return game;const day=dayKey(date);const key=`${day}:${kind}:${kind==='rest'?'rest':id}`;
 const amount=kind==='practice'?15:kind==='step'?10:5;const cap=kind==='rest'?5:30;
 if(game.rewards.some(r=>r.key===key)||game.rewards.filter(r=>r.day===day&&r.kind===kind).reduce((n,r)=>n+r.amount,0)>=cap)return game;
 return {...game,rewards:[...game.rewards,{key,day,amount,kind}]};
}
export function collectItem(game:CharacterGame,id:string):CharacterGame{
 const item=wardrobeItems.find(i=>i.id===id);if(!item||!game.character)return game;
 if(game.owned.includes(id))return {...game,equipped:{...game.equipped,[item.slot]:id}};
 if(balance(game)<item.price)return game;
 return {...game,owned:[...game.owned,id],equipped:{...game.equipped,[item.slot]:id}};
}
export function removeItem(game:CharacterGame,slot:Slot):CharacterGame{const equipped={...game.equipped};delete equipped[slot];return {...game,equipped};}
export function validGame(raw:unknown):CharacterGame{
 const fresh=emptyGame();if(!raw||typeof raw!=='object')return fresh;const g=raw as Record<string,unknown>;if(g.version!==1)return fresh;
 const character=cleanCharacter(g.character);const rewards:Reward[]=[];const keys=new Set<string>();
 if(Array.isArray(g.rewards))for(const candidate of g.rewards){
  if(!candidate||typeof candidate!=='object')continue;const r=candidate as Reward;
  if(typeof r.key!=='string'||typeof r.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||keys.has(r.key))continue;
  if(r.kind==='welcome'){if(r.key!=='welcome'||r.amount!==30||!character)continue;}
  else if(['step','practice','rest'].includes(r.kind)){
   const expected=r.kind==='practice'?15:r.kind==='step'?10:5;
   if(r.amount!==expected||!r.key.startsWith(`${r.day}:${r.kind}:`)||r.key===`${r.day}:${r.kind}:`)continue;
   if(rewards.filter(x=>x.day===r.day&&x.kind===r.kind).reduce((n,x)=>n+x.amount,0)>=(r.kind==='rest'?5:30))continue;
  }else continue;
  keys.add(r.key);rewards.push({key:r.key,day:r.day,amount:r.amount,kind:r.kind});
 }
 let funds=rewards.reduce((n,r)=>n+r.amount,0);const owned=['sprout'];
 if(Array.isArray(g.owned))for(const id of g.owned){const item=wardrobeItems.find(i=>i.id===id);if(item&&!owned.includes(id)&&funds>=item.price){owned.push(id);funds-=item.price;}}
 const equipped:CharacterGame['equipped']={};if(g.equipped&&typeof g.equipped==='object')for(const slot of ['head','eyes','outfit'] as Slot[]){const id=(g.equipped as Record<string,unknown>)[slot];if(typeof id==='string'&&owned.includes(id)&&wardrobeItems.some(i=>i.id===id&&i.slot===slot))equipped[slot]=id;}
 return {version:1,character,owned,equipped,rewards};
}
export function demoGame():CharacterGame{
 let g=createCharacter(emptyGame(),{name:'새봄',color:'leaf'});
 for(let i=1;i<=8;i++){const d=new Date();d.setDate(d.getDate()-i);g=earnActivity(g,'step','demo-window',d);g=earnActivity(g,'practice','demo-cafe',d);g=earnActivity(g,'rest','rest',d);}
 return g;
}
