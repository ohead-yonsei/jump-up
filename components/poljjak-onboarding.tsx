'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowLeft,ArrowUp,Leaf,Footprints,MessageCircle,ShieldCheck,Pencil,Sparkles,Volume2,VolumeX} from 'lucide-react';
import {FrogMark,BrandLogo} from './frog-mark';
import {CharacterEditor} from './character-editor';
import {FrogStill} from './frog-3d';
import {useTonePreview} from './tone';
import {seasons,seasonOf} from '@/lib/season';
import {suggestName,type Character,type Growth} from '@/lib/character';
import {energies,type Energy} from '@/lib/content';
import {outsideOptions,goals,springStages,profileFromChoices,pickMission,WAVE,type JourneyProfile,type OutsideLevel,type Goal} from '@/lib/journey';
import {scaleItems,scaleResult,validScale,levelLines,connectionFromLevel} from '@/lib/loneliness';
import {readAnswer,type ReadKind} from '@/lib/chat-read';
import {KEEPER} from '@/lib/village-map';
import {croak,setSound,soundOn,wakeSound} from '@/lib/croak';
type Props={initialCharacter:Character|null;initialProfile:JourneyProfile|null;initialEnergy:Energy|null;initialSave:boolean;growth?:Growth;startAtQuestions?:boolean;demo?:boolean;onComplete:(profile:JourneyProfile,energy:Energy,save:boolean,character:Character)=>void;onBrowse:()=>void;onHelp:()=>void};
// The talk with the keeper: where I am comfortable (0), the six scale items (1–6), what I hope for (7), today's energy (8).
const SCALE_FROM=1,GOAL_AT=SCALE_FROM+scaleItems.length,ENERGY_AT=GOAL_AT+1,TURNS=ENERGY_AT+1;
// I answer by typing, as in a chat; the options sit under the talk as small bubbles to tap instead. echo = what the keeper says back, which is also how I see what was understood.
type Turn={kind:ReadKind;lead?:string;say:string;hint:string;options:{label:string;echo?:string}[]};
const outsideEcho=['방 안이 제일 편하군요.','집 안이나 문 앞까지는 괜찮군요.','익숙한 집 근처는 다닐 수 있군요.','익숙한 가게나 공간까지는 갈 수 있군요.','일상은 잘 지내지만 가끔은 혼자 있고 싶군요. 혼자만의 시간을 잘 보내는 ‘나만의 썰물’ 미션도 함께 열려요.'];
const goalEcho:Record<Goal,string>={rhythm:'내 일상을 돌보고 싶군요.',outside:'바깥과 가까워지고 싶군요.',connect:'사람과 이어지고 싶군요.'};
const scaleHints=['예: 가끔 그래요','예: 별로 없어요','예: 엄마한테는 기대요','예: 한 명 있어요','예: 두 명쯤','예: 하루 30분쯤'];
const turns:Turn[]=[
 {kind:'outside',say:'먼저 하나 물어볼게요. 요즘은 어디까지 편하게 지내고 있어요?',hint:'예: 집 근처는 다녀요',options:outsideOptions.map((label,i)=>({label,echo:outsideEcho[i]}))},
 ...scaleItems.map((item,i):Turn=>({kind:i<4?'agree':i===4?'count':'minutes',lead:i===0?'이번엔 요즘 한 달, 사람들과 지낸 얘기를 해볼까요?':undefined,say:item.ask,hint:scaleHints[i],options:item.chat.map((label,k)=>({label,echo:item.echo[k]}))})),
 {kind:'goal',say:'거의 다 왔어요. 어떤 일상에 가까워지고 싶어요?',hint:'예: 밖에 나가보고 싶어요',options:goals.map(g=>({label:g.title,echo:goalEcho[g.id]}))},
 {kind:'energy',say:'마지막이에요. 오늘은 어느 정도 움직여볼 수 있을까요?',hint:'예: 작은 거 하나만',options:energies.map(e=>({label:e.label}))},
];
// The keeper's greeting: one line at a time, as in a game. The last line opens the talk.
const greeting=[
 `안녕, 반가워요. 나는 이 연못에 사는 ${KEEPER.name}예요.`,
 '여기는 저마다의 속도로 작은 봄을 찾아가는 연못이에요. 서두르지 않아도 돼요.',
 '먼저 나랑 잠깐 이야기해요. 요즘 어떻게 지내는지 편하게 말해주면, 지금에 맞는 작은 미션을 찾아줄게요.',
 '이야기가 끝나면 함께할 나만의 친구를 만나요. 준비됐어요?',
];
type Row={who:'keeper'|'me'|'typing';text?:string;soft?:boolean;edit?:number};
const keeperFace={name:KEEPER.card.name,color:KEEPER.card.color} as Character;
const Keeper=()=><span className="chat-keeper" aria-hidden="true"><FrogStill character={keeperFace} equipped={KEEPER.card.equipped} growth="frog" framing="face" angle={0}/></span>;
export function PoljjakOnboarding({initialCharacter,initialProfile,initialEnergy,initialSave,growth='egg',startAtQuestions=false,demo=false,onComplete,onBrowse,onHelp}:Props){
 const [step,setStep]=useState<0|1|2>(startAtQuestions?1:0);const [creating,setCreating]=useState(false);const [met,setMet]=useState(!!initialCharacter);const [character,setCharacter]=useState<Character>(()=>initialCharacter??{name:suggestName(),color:'leaf'});useTonePreview(creating?character.color:null);
 const [outside,setOutside]=useState<OutsideLevel|null>(initialProfile?.outside??null);const [scale,setScale]=useState<(number|null)[]>(()=>validScale(initialProfile?.scale)?.answers??scaleItems.map(()=>null));const [goal,setGoal]=useState<Goal|null>(initialProfile?.goal??null);const [energy,setEnergy]=useState<Energy|null>(initialEnergy);const [remember,setRemember]=useState(initialSave);
 const picked=(i:number):number|null=>i===0?outside:i<GOAL_AT?scale[i-SCALE_FROM]:i===GOAL_AT?(goal?goals.findIndex(g=>g.id===goal):null):energy?energies.findIndex(e=>e.value===energy):null;
 const firstOpen=(from=0)=>{for(let i=from;i<TURNS;i++)if(picked(i)===null)return i;return -1;};
 const [at,setAt]=useState(()=>Math.max(0,firstOpen()));
 // What I typed, shown as my bubble for this visit only (never saved); replies the keeper could not place yet; the short pause before the keeper goes on.
 const [said,setSaid]=useState<Record<number,string>>({});const [tries,setTries]=useState<{text:string;near?:number[]}[]>([]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const composing=useRef(false);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 // The greeting types itself out; a tap while it is typing shows the whole line, the next tap moves on.
 const [line,setLine]=useState(0);const [shown,setShown]=useState(0);const whole=greeting[line].length;
 useEffect(()=>{if(step!==0||creating)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(whole);return;}setShown(0);const id=setInterval(()=>setShown(n=>{if(n>=whole){clearInterval(id);return n;}return n+1;}),32);return ()=>clearInterval(id);},[line,step,creating,whole]);
 // The keeper croaks as it talks: every other letter while the greeting types, a short run when a chat line appears.
 const [sound,setSoundState]=useState(true);useEffect(()=>{setSoundState(soundOn());},[]);
 useEffect(()=>{if(sound&&step===0&&!creating&&shown>0&&shown<whole&&shown%2===1)croak(greeting[line][shown-1]);},[shown,line,step,creating,whole,sound]);
 const nextLine=()=>{if(shown<whole)setShown(whole);else if(line<greeting.length-1)setLine(line+1);else setStep(1);};
 const root=useRef<HTMLDivElement>(null);const heading=useRef<HTMLHeadingElement>(null);const choices=useRef<HTMLDivElement>(null);const log=useRef<HTMLDivElement>(null);
 useEffect(()=>{const frame=root.current?.closest('.demo-device');if(frame)frame.scrollTo({top:0,behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[step,creating]);
 useEffect(()=>{if(step===1&&!creating){log.current?.scrollTo({top:log.current.scrollHeight,behavior:'smooth'});choices.current?.scrollIntoView({block:'nearest'});}},[at,step,creating,tries.length,busy]);
 const done=scale.every(v=>v!==null);const earlier=validScale(initialProfile?.scale);
 const measured=done?(earlier&&earlier.answers.every((v,i)=>v===scale[i])?earlier:scaleResult(scale as number[])):null;
 const draft=outside!==null&&measured&&goal!==null?{...profileFromChoices(initialProfile,outside,connectionFromLevel(measured.level),goal),scale:measured}:null;
 const firstMission=draft&&energy?pickMission(draft,energy):null;
 const open=(i:number)=>{setTries([]);setText('');setAt(i);};
 function answer(i:number,choice:number,typed?:string){
  if(busy)return;
  if(i===0)setOutside(choice as OutsideLevel);else if(i<GOAL_AT)setScale(s=>s.map((v,k)=>k===i-SCALE_FROM?choice:v));else if(i===GOAL_AT)setGoal(goals[choice].id);else setEnergy(energies[choice].value);
  setSaid(s=>{const next={...s};if(typed)next[i]=typed;else delete next[i];return next;});setText('');
  setBusy(true);timer.current=setTimeout(()=>{setBusy(false);go(i);},450);
 }
 // A typed reply: placed when it is clear, otherwise the keeper asks again and the bubbles stay.
 function send(){
  const mine=text.trim();if(!mine||busy)return;const heard=readAnswer(turns[at].kind,mine,turns[at].options.map(o=>o.label));
  if(heard&&'pick' in heard)answer(at,heard.pick,mine);else{setTries(t=>[...t,{text:mine,near:heard?.near}]);setText('');}
 }
 // Where the talk goes after turn i: the next unanswered turn; when nothing is left, the rest of the scale (so all six can be redone), then the review.
 // (Called from the closure of the render before the answer, so turn i itself never counts as open.)
 function go(i:number){
  let next=firstOpen(i+1);if(next<0){next=firstOpen();if(next===i)next=-1;}
  if(next<0&&i>=SCALE_FROM&&i<GOAL_AT-1)next=i+1;
  setTries([]);if(next<0){setStep(2);if(!met)setCreating(true);}else open(next);
 }
 const edit=(i:number)=>{setCreating(false);open(i);setStep(1);};
 function finish(){if(!draft||!energy||!character.name.trim())return;onComplete(draft,energy,demo?false:remember,character);}
 // The last screen is only a short hop to the pond: it waits a moment, then goes in by itself.
 const leave=useRef(finish);leave.current=finish;const careful=!!measured&&measured.level>=4;
 useEffect(()=>{if(step!==2||creating)return;const calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const id=setTimeout(()=>leave.current(),careful?4200:calm?1200:2400);return ()=>clearTimeout(id);},[step,creating,careful]);
 const turn=turns[at];const hinted=tries.length?tries[tries.length-1].near:undefined;
 const rows:Row[]=[];
 for(let i=0;i<=at;i++){const t=turns[i];const mine=picked(i);
  if(t.lead)rows.push({who:'keeper',text:t.lead,soft:true});rows.push({who:'keeper',text:t.say});
  if(i===at)for(const tried of tries){rows.push({who:'me',text:tried.text});rows.push({who:'keeper',text:tried.near?tried.near.map(k=>`‘${t.options[k].label}’`).join(', 아니면 ')+' 쪽에 가까워요?':'음, 조금만 더 얘기해 줄래요? 아래에서 가까운 걸 눌러도 돼요.'});}
  if((i<at||busy)&&mine!==null){const label=t.options[mine].label;rows.push({who:'me',text:said[i]??label,edit:i});
   if(i<at&&t.options[mine].echo)rows.push({who:'keeper',text:t.options[mine].echo,soft:true});}
 }
 if(busy)rows.push({who:'typing'});
 // What the keeper says after my last words types itself out, croaking as it goes; a tap on the talk shows it all.
 const freshFrom=rows.reduce((last,r,i)=>r.who==='me'?i+1:last,0);const fresh=busy?[]:rows.slice(freshFrom).map(r=>r.text??'');const freshKey=fresh.join('\n');const freshAll=fresh.join('');
 const [typed,setTyped]=useState({key:'',n:0});const typedN=typed.key===freshKey?typed.n:0;
 useEffect(()=>{if(step!==1||creating||!freshAll)return;const total=freshAll.length;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setTyped({key:freshKey,n:total});return;}setTyped({key:freshKey,n:0});const id=setInterval(()=>setTyped(t=>{if(t.key!==freshKey||t.n>=total){clearInterval(id);return t;}return {key:freshKey,n:t.n+1};}),30);return ()=>clearInterval(id);},[freshKey,freshAll,step,creating]);
 useEffect(()=>{if(sound&&step===1&&!creating&&typedN>0&&typedN<freshAll.length&&typedN%2===1)croak(freshAll[typedN-1]);},[typedN,freshAll,step,creating,sound]);
 // how many letters of row i are out yet (older rows are whole)
 const out=(i:number)=>{const len=(rows[i].text??'').length;if(busy||i<freshFrom)return len;let start=0;for(let k=freshFrom;k<i;k++)start+=(rows[k].text??'').length;return Math.max(0,Math.min(len,typedN-start));};
 const seen=rows.map((r,i)=>r.who!=='keeper'||i<=freshFrom||out(i)>0);const seenCount=seen.filter(Boolean).length;
 const lastKeeper=rows.reduce((last,r,i)=>r.who==='me'||!seen[i]?last:i,-1);
 useEffect(()=>{if(step===1&&!creating)log.current?.scrollTo({top:log.current.scrollHeight,behavior:'smooth'});},[seenCount,step,creating]);
 return <div ref={root} onPointerDown={wakeSound} className={'onboarding-shell'+(creating?' compact':' fit')}><header className="onboarding-header"><span className="onboarding-brand"><BrandLogo height={28}/></span><span className="onboarding-header-end">{step<2&&!creating&&<button className="onboarding-sound" aria-pressed={sound} aria-label={sound?KEEPER.name+' 목소리 끄기':KEEPER.name+' 목소리 켜기'} onClick={()=>{setSound(!sound);setSoundState(!sound);}}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>}<button className="onboarding-skip" onClick={onBrowse}>{initialProfile?'돌아가기':'먼저 둘러보기'}<ArrowRight size={14}/></button></span></header>{demo&&<div className="onboarding-demo">발표용 가상 체험 · 선택은 개인 기록에 저장되지 않아요</div>}
 <main className={'onboarding-layout '+(step===0&&!creating?'is-welcome':step===2&&!creating?'is-review':'is-question')}>
 <aside className={'onboarding-world season-'+seasonOf()} aria-label="계절 연못의 개구리"><img className="onboarding-world-season" src={seasons[seasonOf()].image} alt={seasons[seasonOf()].alt}/><div className="onboarding-world-copy"><span>YOUR OWN SPRING</span><p>봄이 오는 시간은,<br/>모두 다르니까.</p><small>{seasons[seasonOf()].name} · {seasons[seasonOf()].line}</small></div><span className="onboarding-world-note"><FrogMark size={24} color={character.color}/>나는 여기서 기다리고 있을게.</span></aside>
 <section className="onboarding-card" aria-label={creating?'나의 친구 만나기':step===0?'폴짝 시작 안내':step===2?'나의 시작점 확인':KEEPER.name+'와 나누는 시작 대화'}>
 {creating?<><h1 ref={heading} tabIndex={-1}>{met?<>나와 함께하는<br/>친구예요.</>:<>이제 함께할 친구를<br/>만나볼까요?</>}</h1><p className="onboarding-description">{growth==='egg'?<>작은 알에서 시작해, 함께한 날만큼 자라요.<br/>작은 활동이 쌓이면 새 옷과 소품도 만날 수 있어요.</>:<>이름과 색을 고르고, 조금씩 꾸며가요.<br/>작은 활동이 쌓이면 새 옷과 소품을 만날 수 있어요.</>}</p><CharacterEditor value={character} onChange={setCharacter} growth={growth}/><p className="welcome-gift"><Sparkles size={16}/>첫 선물은 새싹과 30잎. 시작을 마치면 받아요.</p>{!demo&&!met&&<label className="onboarding-remember one"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span><strong>이 기기에 기억하기</strong><small>끄면 이번 방문에만 남아요.</small></span></label>}<button className="primary onboarding-next" disabled={!character.name.trim()} onClick={()=>{setMet(true);setCreating(false);}}>이 친구와 시작할래요<ArrowRight size={18}/></button><button className="onboarding-repick" onClick={()=>{setCreating(false);if(!met)setStep(1);}}>{met?'이전으로':'대화로 돌아가기'}</button></>
 :step===0?<>
 <h1 ref={heading} tabIndex={-1} className="chat-title">{KEEPER.name}의 인사</h1>
 <div className="greet"><div className="greet-stage" aria-hidden="true"><i className="hill a"/><i className="hill b"/><i className="water"/><i className="pad a"/><i className="pad b"/><i className="pad seat"/><span className="greet-frog"><FrogStill character={keeperFace} equipped={KEEPER.card.equipped} growth="frog" framing="full" angle={0}/></span></div>
  <button className="greet-box" onClick={nextLine} aria-label={shown<whole?'말 끝까지 보기':line<greeting.length-1?'다음 말 듣기':'이야기 시작하기'}><small>{KEEPER.name}</small><p aria-hidden="true">{greeting[line].slice(0,shown)}<span>{greeting[line].slice(shown)}</span></p><span className="greet-dots" aria-hidden="true">{greeting.map((_,i)=><i key={i} className={i===line?'on':''}/>)}</span>{shown>=whole&&line<greeting.length-1&&<em aria-hidden="true">▼</em>}</button>
  <p className="chat-title" aria-live="polite">{greeting[line]}</p>
 </div>
 {line===greeting.length-1&&shown>=whole?<button className="primary onboarding-next" onClick={()=>setStep(1)}>이야기 시작할게요<ArrowRight size={18}/></button>:<button className="primary onboarding-next" onClick={nextLine}>다음<ArrowRight size={18}/></button>}</>
 :step===1?<>
 <div className="onboarding-progress-title chat-top"><button disabled={busy} onClick={()=>at===0?setStep(0):open(at-1)} aria-label="이전 질문으로"><ArrowLeft size={15}/>이전</button><span>{KEEPER.name}와 나누는 이야기</span><span>{at+1} <i>/ {TURNS}</i></span></div><div className="onboarding-progress" aria-label={`아홉 질문 중 ${at+1}번째`}>{turns.map((_,i)=><span key={i} className={i<=at?'filled':''}/>)}</div>
 <h1 ref={heading} tabIndex={-1} className="chat-title">{KEEPER.name}와 나누는 시작 대화</h1>
 <div ref={log} className="chat-log" role="log" aria-live="polite" onClick={()=>{if(typedN<freshAll.length)setTyped({key:freshKey,n:freshAll.length});}}>{rows.map((r,i)=>!seen[i]?null:r.who==='me'
  ?<div key={i} className="chat-row me">{r.edit!==undefined&&!busy?<button className="chat-bubble" onClick={()=>open(r.edit!)} aria-label={`내 답 ‘${r.text}’ 바꾸기`}>{r.text}<Pencil size={12}/></button>:<p className="chat-bubble">{r.text}</p>}</div>
  :<div key={i} className="chat-row keeper">{i===lastKeeper?<Keeper/>:<span className="chat-keeper is-gap" aria-hidden="true"/>}<div className="chat-said">{i===0&&<small className="chat-name">{KEEPER.name}</small>}{r.who==='typing'?<p className="chat-bubble chat-typing" aria-label={KEEPER.name+'가 듣고 있어요'}><i/><i/><i/></p>:<p className={'chat-bubble'+(r.soft?' lead':'')} aria-label={r.text}><span aria-hidden="true">{(r.text??'').slice(0,out(i))}<span className="chat-rest">{(r.text??'').slice(out(i))}</span></span></p>}</div></div>)}</div>
 <div ref={choices} className="chat-answer">
  <div className="chat-chips" role="group" aria-label="눌러서 답하기">{turn.options.map((o,i)=><button key={o.label} disabled={busy} aria-pressed={picked(at)===i} className={(picked(at)===i?'selected':'')+(hinted?.includes(i)?' near':'')} onClick={()=>answer(at,i)}>{o.label}</button>)}{picked(at)!==null&&!busy&&<button className="keep" onClick={()=>go(at)}>그대로 둘게요<ArrowRight size={13}/></button>}</div>
  <form className="chat-compose" onSubmit={e=>{e.preventDefault();if(!composing.current)send();}}><input value={text} onChange={e=>setText(e.target.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} maxLength={200} placeholder={turn.hint} aria-label={KEEPER.name+'에게 답 적기'} enterKeyHint="send" autoComplete="off"/><button type="submit" disabled={!text.trim()||busy} aria-label="보내기"><ArrowUp size={18}/></button></form>
 </div>
 <p className="chat-note">적은 말은 저장하지 않아요 · 내 말을 누르면 고칠 수 있어요</p>
 </>:draft&&energy&&measured?<>
 <h1 ref={heading} tabIndex={-1} className="chat-title">연못으로 가고 있어요</h1>
 <div className="greet leaving" role="status"><div className="greet-stage" aria-hidden="true"><i className="hill a"/><i className="hill b"/><i className="water"/><i className="pad a"/><i className="pad b"/><i className="pad seat"/><span className="greet-frog"><FrogStill character={character} equipped={{head:'sprout',face:'happy'}} growth={growth} framing="full" angle={0}/></span></div>
  <p className="leaving-line"><strong>{character.name}</strong>와 연못으로 폴짝 뛰어가고 있어요<span className="chat-typing" aria-hidden="true"><i/><i/><i/></span></p>
  {careful&&<p className="chat-care"><Keeper/><span>혼자 버거운 날에는 이야기할 곳을 함께 찾을 수 있어요. <button onClick={onHelp}>도움받을 곳 보기</button></span></p>}
 </div>
 </>:null}
 <div className="onboarding-bottom-note"><span><ShieldCheck size={13}/>나의 선택을 존중해요</span><button onClick={onHelp}>도움 먼저 찾기<ArrowRight size={13}/></button></div>
 </section></main><footer className="onboarding-footer">POLJJAK <span>·</span> 저마다의 봄, 나만의 속도.</footer></div>
}
