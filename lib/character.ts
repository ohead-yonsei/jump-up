export const frogColors = [
 {id:'leaf',name:'새잎 초록',light:'#dbe88f',main:'#b3cb48',dark:'#7f9b2c',face:'#faecb4'},
 {id:'butter',name:'햇살 노랑',light:'#fbe9a4',main:'#f1d265',dark:'#c3a33b',face:'#fdf0c8'},
 {id:'peach',name:'복숭아 분홍',light:'#fdd3d0',main:'#f6adae',dark:'#cf7f82',face:'#fde6d5'},
 {id:'sky',name:'하늘 파랑',light:'#cfe0ee',main:'#a3c2de',dark:'#6f93b6',face:'#f6efe6'},
 {id:'lilac',name:'라일락 보라',light:'#e2d4f1',main:'#bea6dc',dark:'#8d73b2',face:'#efe2dc'},
 {id:'mint',name:'연못 민트',light:'#d3ebc7',main:'#a5cf96',dark:'#6f9d61',face:'#eee6c6'},
 {id:'cream',name:'우유 크림',light:'#fbf2e1',main:'#f2e1c2',dark:'#c9b18a',face:'#fbf1dd'},
 {id:'lavender',name:'라벤더 핑크',light:'#ecdcf3',main:'#d0b5e4',dark:'#9f83b9',face:'#f8dbe3'},
] as const;
export type FrogColor=typeof frogColors[number]['id'];
export type Character={name:string;color:FrogColor};
export type Slot='head'|'eyes'|'outfit'|'hand'|'face';
export const slots:Slot[]=['head','eyes','outfit','hand','face'];
export type WardrobeItem={id:string;name:string;slot:Slot;price:number;description:string;tag:string};
export const wardrobeItems:WardrobeItem[]=[
 {id:'sprout',name:'새싹 한 잎',slot:'head',price:0,description:'우리의 시작을 함께하는 작은 새싹.',tag:'첫 선물'},
 {id:'daisy',name:'봄날의 꽃',slot:'head',price:30,description:'작은 폴짝이 모여 피어난 봄꽃.',tag:'봄의 조각'},
 {id:'ribbon',name:'말랑 리본 밴드',slot:'head',price:40,description:'나를 돌보는 시간엔 리본을 묶어요.',tag:'셀프 케어'},
 {id:'headphones',name:'포근 헤드폰',slot:'head',price:50,description:'좋아하는 노래 한 곡이면 충분해요.',tag:'나만의 음악'},
 {id:'bucket',name:'산책 모자',slot:'head',price:60,description:'햇살 좋은 날, 나만의 산책 친구.',tag:'가벼운 외출'},
 {id:'nightcap',name:'체크 수면 모자',slot:'head',price:60,description:'오늘은 일찍 포근하게 잠들어요.',tag:'꿀잠 준비'},
 {id:'fleece',name:'뽀송 후드',slot:'head',price:80,description:'폭 감싸면 어디든 내 방처럼 편해요.',tag:'나의 동굴'},
 {id:'dino',name:'공룡 후드',slot:'head',price:110,description:'오늘은 용감한 공룡이 되어볼까요?',tag:'변신 놀이'},
 {id:'crown',name:'나의 봄 왕관',slot:'head',price:120,description:'내 속도로 쌓아온 날들을 위한 왕관.',tag:'차곡차곡'},
 {id:'round',name:'동그란 안경',slot:'eyes',price:30,description:'익숙한 세상을 조금 새롭게 바라봐요.',tag:'새로운 시선'},
 {id:'cucumber',name:'오이 팩',slot:'eyes',price:20,description:'시원하게 쉬어가는 나만의 휴식.',tag:'셀프 케어'},
 {id:'sunglasses',name:'햇살 선글라스',slot:'eyes',price:60,description:'눈부신 날에도 여유롭게, 폴짝.',tag:'느긋한 오후'},
 {id:'scarf',name:'포근한 스카프',slot:'outfit',price:40,description:'조금 쌀쌀한 날도 포근하게 감싸줘요.',tag:'따뜻한 마음'},
 {id:'hoodie',name:'연못 후드티',slot:'outfit',price:70,description:'내 연못처럼 편안한 민트색 후드티.',tag:'나의 편안함'},
 {id:'blanket',name:'구름 담요',slot:'outfit',price:70,description:'몽글몽글 담요 속에서 숨 고르기.',tag:'포근한 오후'},
 {id:'raincoat',name:'노란 비옷',slot:'outfit',price:90,description:'비 오는 날에도 나의 봄은 자라고 있어요.',tag:'비 오는 봄'},
 {id:'cookie',name:'초코칩 쿠키',slot:'hand',price:15,description:'달콤한 한 입으로 나를 챙겨요.',tag:'작은 간식'},
 {id:'mug',name:'따뜻한 머그',slot:'hand',price:20,description:'코코아 한 잔의 온기를 손에 쥐어요.',tag:'따뜻한 한 잔'},
 {id:'coffee',name:'테이크아웃 커피',slot:'hand',price:25,description:'주문 연습을 마친 날의 작은 기념.',tag:'한마디 성공'},
 {id:'phone',name:'나의 폰',slot:'hand',price:30,description:'보내지 않아도 괜찮은 안부 한 줄.',tag:'느린 연결'},
 {id:'book',name:'좋아하는 책',slot:'hand',price:40,description:'한 페이지만 읽어도 충분해요.',tag:'조용한 취향'},
 {id:'tablet',name:'그림 태블릿',slot:'hand',price:50,description:'끄적끄적, 마음 가는 대로 그려요.',tag:'나의 취향'},
 {id:'laptop',name:'작은 노트북',slot:'hand',price:80,description:'궁금한 것을 천천히 찾아보는 시간.',tag:'집중 모드'},
 {id:'teddy',name:'곰돌이 친구',slot:'hand',price:90,description:'꼭 안으면 마음이 말랑해지는 친구.',tag:'든든한 품'},
 {id:'happy',name:'활짝 웃음',slot:'face',price:0,description:'기분 좋은 날의 눈웃음.',tag:'오늘의 표정'},
 {id:'wink',name:'찡긋 윙크',slot:'face',price:0,description:'나에게 보내는 작은 응원.',tag:'오늘의 표정'},
 {id:'sleepy',name:'꾸벅꾸벅',slot:'face',price:0,description:'졸린 날엔 졸린 대로 괜찮아요.',tag:'오늘의 표정'},
 {id:'surprise',name:'깜짝!',slot:'face',price:0,description:'새로운 걸 만난 동그란 눈.',tag:'오늘의 표정'},
];
export type Look={id:string;title:string;note:string;image:string;equipped:Partial<Record<Slot,string>>};
// Example outfits from the character sheet. Applying one keeps the friend's own colour.
export const looks:Look[]=[
 {id:'cozy',title:'있는 그대로',note:'아무것도 걸치지 않은 나',image:'/looks/cozy.webp',equipped:{}},
 {id:'blanket',title:'담요 속 코코아',note:'구름 담요 · 머그',image:'/looks/blanket.webp',equipped:{outfit:'blanket',hand:'mug'}},
 {id:'music',title:'음악 한 곡',note:'헤드폰 · 태블릿',image:'/looks/music.webp',equipped:{head:'headphones',hand:'tablet'}},
 {id:'reading',title:'책 한 페이지',note:'좋아하는 책',image:'/looks/reading.webp',equipped:{hand:'book'}},
 {id:'study',title:'끄적끄적 공부',note:'동그란 안경 · 책',image:'/looks/study.webp',equipped:{eyes:'round',hand:'book'}},
 {id:'laptop',title:'집중 모드',note:'작은 노트북',image:'/looks/laptop.webp',equipped:{hand:'laptop'}},
 {id:'nap',title:'포근한 낮잠',note:'꾸벅꾸벅 · 구름 담요',image:'/looks/nap.webp',equipped:{face:'sleepy',outfit:'blanket'}},
 {id:'fleece',title:'뽀송 후드',note:'뽀송 후드 · 나의 폰',image:'/looks/fleece.webp',equipped:{head:'fleece',hand:'phone'}},
 {id:'cookie',title:'쿠키 타임',note:'초코칩 쿠키 · 활짝 웃음',image:'/looks/cookie.webp',equipped:{hand:'cookie',face:'happy'}},
 {id:'tea',title:'따뜻한 차 한 잔',note:'스카프 · 머그',image:'/looks/tea.webp',equipped:{outfit:'scarf',hand:'mug'}},
 {id:'spa',title:'나를 돌보는 시간',note:'리본 밴드 · 오이 팩 · 윙크',image:'/looks/spa.webp',equipped:{head:'ribbon',eyes:'cucumber',face:'wink'}},
 {id:'cafe',title:'카페 작업',note:'후드티 · 노트북',image:'/looks/cafe.webp',equipped:{outfit:'hoodie',hand:'laptop'}},
 {id:'dino',title:'공룡 변신',note:'공룡 후드',image:'/looks/dino.webp',equipped:{head:'dino'}},
 {id:'scroll',title:'뒹굴뒹굴',note:'나의 폰 · 활짝 웃음',image:'/looks/scroll.webp',equipped:{hand:'phone',face:'happy'}},
 {id:'bedtime',title:'곰돌이와 잘 자',note:'수면 모자 · 곰돌이 · 활짝 웃음',image:'/looks/bedtime.webp',equipped:{head:'nightcap',hand:'teddy',face:'happy'}},
];
export type Reward={key:string;day:string;amount:number;kind:'welcome'|'step'|'practice'|'rest'|'return'};
export type CharacterGame={version:1;character:Character|null;owned:string[];equipped:Partial<Record<Slot,string>>;rewards:Reward[]};
export const emptyGame=():CharacterGame=>({version:1,character:null,owned:['sprout'],equipped:{head:'sprout'},rewards:[]});
const nameMoods=['든든한','포근한','느긋한','말랑한','다정한','반짝이는','차분한','씩씩한','동글동글','살랑살랑','따스한','보송보송','꾸준한','산뜻한','수줍은','한가로운'];
const nameFriends=['폴짝이','개굴이','연잎이','새싹이','봄비','이슬이','물방울','콩콩이','퐁당이','꼬물이','풀잎이','달빛이'];
/** A nickname suggestion such as '든든한 폴짝이', different from the one shown now. */
export function suggestName(current='',random=Math.random){
 const pick=<T,>(list:T[])=>list[Math.floor(random()*list.length)%list.length];
 let name=current;for(let i=0;i<8&&name===current;i++)name=`${pick(nameMoods)} ${pick(nameFriends)}`;
 return name;
}
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
const daysBetween=(a:string,b:string)=>Math.round((Date.parse(b+'T12:00:00')-Date.parse(a+'T12:00:00'))/864e5);
export const RETURN_GAP=3,RETURN_GIFT=10;
/** Coming back after a quiet stretch is celebrated, never penalised. Returns how long the friend waited. */
export function returnGift(game:CharacterGame,date=new Date()){
 const today=dayKey(date);if(!game.character||!game.rewards.length||game.rewards.some(r=>r.day===today))return null;
 const last=game.rewards.reduce((m,r)=>r.day>m?r.day:m,'');const away=daysBetween(last,today);return away>=RETURN_GAP?{away}:null;
}
export function claimReturn(game:CharacterGame,date=new Date()):CharacterGame{
 if(!returnGift(game,date))return game;const day=dayKey(date);return {...game,rewards:[...game.rewards,{key:`${day}:return`,day,amount:RETURN_GIFT,kind:'return'}]};
}
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
export function lookCost(game:CharacterGame,look:Look){return Object.values(look.equipped).filter(id=>!game.owned.includes(id!)).reduce((n,id)=>n+(wardrobeItems.find(i=>i.id===id)?.price??0),0);}
export function wearLook(game:CharacterGame,look:Look):CharacterGame{
 if(!game.character||balance(game)<lookCost(game,look))return game;
 let next:CharacterGame={...game,equipped:{}};for(const id of Object.values(look.equipped))next=collectItem(next,id!);return next;
}
export function removeItem(game:CharacterGame,slot:Slot):CharacterGame{const equipped={...game.equipped};delete equipped[slot];return {...game,equipped};}
export function validGame(raw:unknown):CharacterGame{
 const fresh=emptyGame();if(!raw||typeof raw!=='object')return fresh;const g=raw as Record<string,unknown>;if(g.version!==1)return fresh;
 const character=cleanCharacter(g.character);const rewards:Reward[]=[];const keys=new Set<string>();
 if(Array.isArray(g.rewards))for(const candidate of g.rewards){
  if(!candidate||typeof candidate!=='object')continue;const r=candidate as Reward;
  if(typeof r.key!=='string'||typeof r.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||keys.has(r.key))continue;
  if(r.kind==='welcome'){if(r.key!=='welcome'||r.amount!==30||!character)continue;}
  else if(r.kind==='return'){const last=rewards.reduce((m,x)=>x.day>m?x.day:m,'');if(r.amount!==RETURN_GIFT||r.key!==`${r.day}:return`||!last||daysBetween(last,r.day)<RETURN_GAP)continue;}
  else if(['step','practice','rest'].includes(r.kind)){
   const expected=r.kind==='practice'?15:r.kind==='step'?10:5;
   if(r.amount!==expected||!r.key.startsWith(`${r.day}:${r.kind}:`)||r.key===`${r.day}:${r.kind}:`)continue;
   if(rewards.filter(x=>x.day===r.day&&x.kind===r.kind).reduce((n,x)=>n+x.amount,0)>=(r.kind==='rest'?5:30))continue;
  }else continue;
  keys.add(r.key);rewards.push({key:r.key,day:r.day,amount:r.amount,kind:r.kind});
 }
 let funds=rewards.reduce((n,r)=>n+r.amount,0);const owned=['sprout'];
 if(Array.isArray(g.owned))for(const id of g.owned){const item=wardrobeItems.find(i=>i.id===id);if(item&&!owned.includes(id)&&funds>=item.price){owned.push(id);funds-=item.price;}}
 const equipped:CharacterGame['equipped']={};if(g.equipped&&typeof g.equipped==='object')for(const slot of slots){const id=(g.equipped as Record<string,unknown>)[slot];if(typeof id==='string'&&owned.includes(id)&&wardrobeItems.some(i=>i.id===id&&i.slot===slot))equipped[slot]=id;}
 return {version:1,character,owned,equipped,rewards};
}
export function demoGame():CharacterGame{
 let g=createCharacter(emptyGame(),{name:'새봄',color:'leaf'});
 for(let i=1;i<=8;i++){const d=new Date();d.setDate(d.getDate()-i);g=earnActivity(g,'step','demo-window',d);g=earnActivity(g,'practice','demo-cafe',d);g=earnActivity(g,'rest','rest',d);}
 return g;
}
