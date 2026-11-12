/**
 * Reads a typed reply in the start talk and finds the closest printed option. Runs on the device only: nothing typed is sent or kept.
 * It is a small set of word rules, not a language model. When a reply is unclear it says so (null) or narrows it to a few options (near),
 * and the keeper asks again with the option bubbles, so a guess never becomes a scale answer on its own.
 * No runtime imports: tests build this file alone.
 */
export type ReadKind='outside'|'agree'|'count'|'minutes'|'goal'|'energy';
export type Heard={pick:number}|{near:number[]}|null;
const flat=(s:string)=>s.toLowerCase().replace(/[\s.,!?~…·'"‘’“”()\-–]/g,'');
const NEG=/지\s*않|않아|않은|않는|않다|않고|아니|아뇨|없어|없는|없다|없음|없네|없죠|없지|없고|못\s*[가-힣]|(^|\s)안\s?(?!녕|정|심|쪽|에|이|은|과|까지)[가-힣]/;
const pick=(n:number):Heard=>({pick:n});
const near=(list:number[]):Heard=>{const u=[...new Set(list)].sort((a,b)=>a-b);return u.length===1?{pick:u[0]}:{near:u};};
/** 거의 그렇지 않다(0) · 다소 그렇지 않다(1) · 다소 그렇다(2) · 매우 그렇다(3) */
function agree(t:string):Heard {
 if(/전혀|절대|하나도|조금도|결코/.test(t))return pick(0);
 const neg=NEG.test(t);
 if(neg&&/거의/.test(t))return pick(0);
 if(/별로|그다지|그닥|딱히|드물|잘\s*(안|못)/.test(t))return pick(1);
 const strong=/매우|많이|자주|항상|언제나|엄청|너무|정말|진짜|완전|맨날|매일|매번|아주|되게|무척|심하|확실|물론|당연|든든|편하게/.test(t);
 if(neg)return strong?pick(1):near([0,1]);
 if(strong)return pick(3);
 if(/가끔|조금|약간|다소|좀|종종|때때로|이따금|어느\s*정도|편이|편인|살짝|때가\s*있|때도\s*있|그럭저럭/.test(t))return pick(2);
 if(/^(네|넵|예|응|웅)([.!~\s요]|$)|맞아|맞는|맞죠|그래요|그렇죠|그렇다|그래$|그런\s*것|그런\s*거|그러네|있어|있죠|있는|있다|느껴|외로|외롭|소외|기대요|기댈|의지|돼요|그럼/.test(t))return near([2,3]);
 return null;
}
const WORDS:[string,number[]][]=[['한두',[1,2]],['두세',[2,3]],['두어',[2,3]],['서너',[3,4]],['너댓',[4,5]],['네다섯',[4,5]],['대여섯',[5,6]],['예닐곱',[6,7]],['하나',[1]],['다섯',[5]],['여섯',[6]],['일곱',[7]],['여덟',[8]],['아홉',[9]],['한',[1]],['둘',[2]],['두',[2]],['셋',[3]],['세',[3]],['넷',[4]],['네',[4]],['열',[10]]];
/** Numbers said before a unit ("세 명", "3~4명", "두세 사람"). A numeral glued to the end of another word ("친한 사람") is not counted. */
function numbers(t:string,unit:string):number[] {
 const digits=[...t.matchAll(new RegExp('(\\d+)\\s*(?:[~\\-–에서]+\\s*(\\d+)\\s*)?'+unit,'g'))].flatMap(m=>[m[1],m[2]].filter(Boolean).map(Number));
 if(digits.length)return digits;
 for(const [word,value] of WORDS)if(new RegExp('(?<![가-힣])'+word+'\\s*'+unit).test(t))return value;
 return [];
}
/** 0명(0) · 1-2명(1) · 3-6명(2) · 7명 이상(3) */
function count(t:string):Heard {
 const band=(n:number)=>n<=0?0:n<=2?1:n<=6?2:3;
 const said=numbers(t,'(?:명|사람|분|정도|쯤|이|$)');
 if(said.length)return near(said.map(band));
 if(/없|아무도|혼자/.test(t))return pick(0);
 const bare=t.match(/^\D*(\d+)\D*$/);if(bare)return pick(band(Number(bare[1])));
 if(/많|여러/.test(t))return near([2,3]);
 if(/몇|조금|적/.test(t))return near([1,2]);
 return null;
}
const MINUTES:[RegExp,number][]=[[/십오\s*분/,15],[/이십\s*분/,20],[/삼십\s*분|반\s*시간/,30],[/사십\s*분/,40],[/오십\s*분/,50],[/십\s*분/,10],[/오\s*분/,5]];
/** 전혀 안 함(0) · 15분 이하(1) · 15분-1시간(2) · 1시간 이상(3) */
function minutes(t:string):Heard {
 const band=(n:number)=>n<=0?0:n<=15?1:n<60?2:3;
 const neg=NEG.test(t)||/미만|이하|안\s*(돼|되)/.test(t);
 if(/반\s*시간/.test(t))return pick(2);
 if(/(\d+|한|두|세|네|몇|여러)\s*시간/.test(t))return neg?near([1,2]):pick(3);
 const m=[...t.matchAll(/(\d+)\s*(?:[~\-–에서]+\s*(\d+)\s*)?분/g)].flatMap(x=>[x[1],x[2]].filter(Boolean).map(Number));
 if(m.length)return near(m.map(band));
 for(const [re,n] of MINUTES)if(re.test(t))return pick(band(n));
 if(/거의/.test(t)&&neg)return near([0,1]);
 if(/전혀|안\s*해|안\s*함|안\s*써|없/.test(t))return pick(0);
 if(/한참|오래|종일|계속|많이|자주/.test(t))return pick(3);
 if(/잠깐|조금|몇\s*분|가끔|짧|금방/.test(t))return pick(1);
 return null;
}
/** 방 안(0) · 집 안이나 문 앞(1) · 집 근처(2) · 익숙한 가게나 공간(3) · 일상은 지내지만 가끔 혼자 있고 싶음(4) */
function outside(t:string):Heard {
 if(NEG.test(t))return /방|침대|이불/.test(t)&&/밖|나가|나와/.test(t)?pick(0):null;
 if(/회사|직장|학교|출근|등교|일상|알바|어디든|다\s*다녀/.test(t))return pick(4);
 if(/가게|카페|편의점|마트|도서관|식당|피시방|pc방|헬스/.test(t))return pick(3);
 if(/근처|동네|산책|공원|집\s*앞|골목/.test(t))return pick(2);
 if(/문\s*앞|현관|집\s*안|거실|복도|집/.test(t))return pick(1);
 if(/방|침대|이불/.test(t))return pick(0);
 return null;
}
/** 내 일상 돌보기(0) · 바깥과 가까워지기(1) · 사람과 연결되기(2) */
function goal(t:string):Heard {
 const hits=[/일상|리듬|생활|규칙|루틴|잠|일찍|청소|밥|돌보/,/밖|바깥|나가|외출|산책|걷/,/사람|친구|대화|연결|연락|만나|한마디|말을|말하/].map((re,i)=>re.test(t)?i:-1).filter(i=>i>=0);
 return hits.length?near(hits):null;
}
/** 쉬어갈래요(0) · 작은 것 하나(1) · 조금 더 해볼래요(2) */
function energy(t:string):Heard {
 if(/쉬|쉴|힘들|피곤|지쳤|지쳐|못\s*하|아무것도|귀찮/.test(t))return pick(0);
 if(/조금\s*더|더\s*해|많이|할\s*수\s*있|괜찮|좋아|해볼래/.test(t))return pick(2);
 if(/작은|하나|조금|살짝|가볍|약간/.test(t))return pick(1);
 return null;
}
const readers:Record<ReadKind,(t:string)=>Heard>={outside,agree,count,minutes,goal,energy};
/** labels are the printed options, in order. A reply that contains one of them word for word is that option. */
export function readAnswer(kind:ReadKind,text:string,labels:string[]):Heard {
 const t=text.trim().slice(0,200);if(!t)return null;const f=flat(t);
 let exact=-1;labels.forEach((label,i)=>{const at=f.indexOf(flat(label));if(at>=0&&!(at>0&&/\d/.test(f[at-1])&&/^\d/.test(label))&&(exact<0||label.length>labels[exact].length))exact=i;});
 if(exact>=0)return pick(exact);
 const heard=readers[kind](t);
 if(heard&&'near' in heard)return {near:heard.near.filter(i=>i<labels.length)};
 return heard&&heard.pick<labels.length?heard:null;
}
