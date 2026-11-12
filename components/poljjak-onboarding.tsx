'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowLeft,Leaf,Sun,Footprints,MessageCircle,ShieldCheck,Pencil,Sparkles} from 'lucide-react';
import {FrogMark,BrandLogo} from './frog-mark';
import {CharacterEditor} from './character-editor';
import {FrogStill} from './frog-3d';
import {useTonePreview} from './tone';
import {seasons,seasonOf} from '@/lib/season';
import {suggestName,type Character,type Growth} from '@/lib/character';
import {energies,type Energy} from '@/lib/content';
import {outsideOptions,goals,springStages,profileFromChoices,pickMission,WAVE,type JourneyProfile,type OutsideLevel,type Goal} from '@/lib/journey';
import {scaleItems,scaleResult,validScale,levelLines,connectionFromLevel} from '@/lib/loneliness';
import {KEEPER} from '@/lib/village-map';
type Props={initialCharacter:Character|null;initialProfile:JourneyProfile|null;initialEnergy:Energy|null;initialSave:boolean;growth?:Growth;startAtQuestions?:boolean;demo?:boolean;onComplete:(profile:JourneyProfile,energy:Energy,save:boolean,character:Character)=>void;onBrowse:()=>void;onHelp:()=>void};
// The talk with the keeper: where I am comfortable (0), the six scale items (1–6), what I hope for (7), today's energy (8).
const SCALE_FROM=1,GOAL_AT=SCALE_FROM+scaleItems.length,ENERGY_AT=GOAL_AT+1,TURNS=ENERGY_AT+1;
type Turn={lead?:string;say:string;quoted?:boolean;options:{label:string;note?:string}[]};
const turns:Turn[]=[
 {say:'먼저 하나 물어볼게요. 요즘은 어디까지 편하게 지내고 있어요?',options:outsideOptions.map((label,i)=>({label,note:i===WAVE?'혼자만의 시간을 잘 보내는 ‘나만의 썰물’ 미션도 함께 열려요.':undefined}))},
 ...scaleItems.map((item,i)=>({lead:i===0?'이제 최근 한 달을 떠올려 볼게요. 내 상태에 가장 가까운 걸 골라줘요.':undefined,say:item.text,quoted:i<4,options:item.options.map(o=>({label:o.label}))})),
 {say:'거의 다 왔어요. 어떤 일상에 가까워지고 싶어요?',options:goals.map(g=>({label:g.title,note:g.description}))},
 {say:'마지막이에요. 오늘은 어느 정도 움직여볼 수 있을까요?',options:energies.map(e=>({label:e.label,note:e.note}))},
];
const keeperFace={name:KEEPER.card.name,color:KEEPER.card.color} as Character;
const Keeper=()=><span className="chat-keeper" aria-hidden="true"><FrogStill character={keeperFace} equipped={KEEPER.card.equipped} growth="frog" framing="face" angle={0}/></span>;
export function PoljjakOnboarding({initialCharacter,initialProfile,initialEnergy,initialSave,growth='egg',startAtQuestions=false,demo=false,onComplete,onBrowse,onHelp}:Props){
 const [step,setStep]=useState<0|1|2>(startAtQuestions&&initialCharacter?1:0);const [creating,setCreating]=useState(startAtQuestions&&!initialCharacter);const [character,setCharacter]=useState<Character>(()=>initialCharacter??{name:suggestName(),color:'leaf'});useTonePreview(creating?character.color:null);
 const [outside,setOutside]=useState<OutsideLevel|null>(initialProfile?.outside??null);const [scale,setScale]=useState<(number|null)[]>(()=>validScale(initialProfile?.scale)?.answers??scaleItems.map(()=>null));const [goal,setGoal]=useState<Goal|null>(initialProfile?.goal??null);const [energy,setEnergy]=useState<Energy|null>(initialEnergy);const [remember,setRemember]=useState(initialSave);
 const picked=(i:number):number|null=>i===0?outside:i<GOAL_AT?scale[i-SCALE_FROM]:i===GOAL_AT?(goal?goals.findIndex(g=>g.id===goal):null):energy?energies.findIndex(e=>e.value===energy):null;
 const firstOpen=(from=0)=>{for(let i=from;i<TURNS;i++)if(picked(i)===null)return i;return -1;};
 const [at,setAt]=useState(()=>Math.max(0,firstOpen()));
 const root=useRef<HTMLDivElement>(null);const heading=useRef<HTMLHeadingElement>(null);const choices=useRef<HTMLDivElement>(null);
 useEffect(()=>{const frame=root.current?.closest('.demo-device');if(frame)frame.scrollTo({top:0,behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[step,creating]);
 useEffect(()=>{if(step===1&&!creating)choices.current?.scrollIntoView({block:'end',behavior:'smooth'});},[at,step,creating]);
 const done=scale.every(v=>v!==null);const earlier=validScale(initialProfile?.scale);
 const measured=done?(earlier&&earlier.answers.every((v,i)=>v===scale[i])?earlier:scaleResult(scale as number[])):null;
 const draft=outside!==null&&measured&&goal!==null?{...profileFromChoices(initialProfile,outside,connectionFromLevel(measured.level),goal),scale:measured}:null;
 const firstMission=draft&&energy?pickMission(draft,energy):null;
 function answer(i:number,choice:number){
  if(i===0)setOutside(choice as OutsideLevel);else if(i<GOAL_AT)setScale(s=>s.map((v,k)=>k===i-SCALE_FROM?choice:v));else if(i===GOAL_AT)setGoal(goals[choice].id);else setEnergy(energies[choice].value);
  go(i);
 }
 // Where the talk goes after turn i: the next unanswered turn; when nothing is left, the rest of the scale (so all six can be redone), then the review.
 // (The answer just given is not in state yet, so turn i itself never counts as open.)
 function go(i:number){
  let next=firstOpen(i+1);if(next<0){next=firstOpen();if(next===i)next=-1;}
  if(next<0&&i>=SCALE_FROM&&i<GOAL_AT-1)next=i+1;
  if(next<0)setStep(2);else setAt(next);
 }
 const edit=(i:number)=>{setCreating(false);setAt(i);setStep(1);};
 function finish(){if(!draft||!energy||!character.name.trim())return;onComplete(draft,energy,demo?false:remember,character);}
 const turn=turns[at];
 return <div ref={root} className="onboarding-shell"><header className="onboarding-header"><span className="onboarding-brand"><BrandLogo height={28}/></span><button className="onboarding-skip" onClick={onBrowse}>{initialProfile?'돌아가기':'먼저 둘러보기'}<ArrowRight size={14}/></button></header>{demo&&<div className="onboarding-demo">발표용 가상 체험 · 선택은 개인 기록에 저장되지 않아요</div>}
 <main className={'onboarding-layout '+(step===0&&!creating?'is-welcome':step===2&&!creating?'is-review':'is-question')}>
 <aside className={'onboarding-world season-'+seasonOf()} aria-label="계절 연못의 개구리"><img className="onboarding-world-season" src={seasons[seasonOf()].image} alt={seasons[seasonOf()].alt}/><div className="onboarding-world-copy"><span>YOUR OWN SPRING</span><p>봄이 오는 시간은,<br/>모두 다르니까.</p><small>{seasons[seasonOf()].name} · {seasons[seasonOf()].line}</small></div><span className="onboarding-world-note"><FrogMark size={24} color={character.color}/>나는 여기서 기다리고 있을게.</span></aside>
 <section className="onboarding-card" aria-label={creating?'나의 친구 만나기':step===0?'폴짝 시작 안내':step===2?'나의 시작점 확인':KEEPER.name+'와 나누는 시작 대화'}>
 {creating?<><span className="onboarding-eyebrow">MY LITTLE FRIEND · 우리의 첫 만남</span><h1 ref={heading} tabIndex={-1}>나와 함께할 친구를<br/>만나볼까요?</h1><p className="onboarding-description">{growth==='egg'?<>작은 알에서 시작해, 함께한 날만큼 자라요.<br/>작은 활동이 쌓이면 새 옷과 소품도 만날 수 있어요.</>:<>이름과 색을 고르고, 조금씩 꾸며가요.<br/>작은 활동이 쌓이면 새 옷과 소품을 만날 수 있어요.</>}</p><CharacterEditor value={character} onChange={setCharacter} growth={growth}/><p className="welcome-gift"><Sparkles size={16}/>첫 선물은 새싹과 30잎. 시작을 마치면 받아요.</p><button className="primary onboarding-next" disabled={!character.name.trim()} onClick={()=>{setCreating(false);if(step===0)setStep(1)}}>이 친구와 시작할래요<ArrowRight size={18}/></button><button className="onboarding-repick" onClick={()=>setCreating(false)}>이전으로</button></>
 :step===0?<><span className="onboarding-eyebrow">반가워요, 여기는 나의 작은 연못</span><h1 ref={heading} tabIndex={-1}>지금의 나부터,<br/>천천히 이야기해 볼까요?</h1><p className="onboarding-description">어디까지 편한지, 요즘 사람들과는 어떤지.<br/>{KEEPER.name}가 묻고, 나는 가까운 답을 골라요.</p><div className="onboarding-intro-path"><span><Leaf size={17}/>나의 친구</span><i/><span><MessageCircle size={17}/>짧은 대화</span><i/><span><Footprints size={17}/>첫 미션</span></div><div className="onboarding-reassurance"><Keeper/><p>나는 이 연못에 사는 {KEEPER.name}예요.<br/>잘 고르려고 애쓰지 않아도 괜찮아요. 마음이 바뀌면 언제든 다시 고를 수 있어요.</p></div><button className="primary onboarding-next" onClick={()=>setCreating(true)}>편하게 이야기해 볼게요<ArrowRight size={18}/></button><p className="onboarding-footnote">약 2분 · 내 캐릭터와 짧은 대화 · 실명은 묻지 않아요</p></>
 :step===1?<>
 <div className="onboarding-progress-title"><span>{KEEPER.name}와 나누는 이야기</span><span>{at+1} <i>/ {TURNS}</i></span></div><div className="onboarding-progress" aria-label={`아홉 질문 중 ${at+1}번째`}>{turns.map((_,i)=><span key={i} className={i<=at?'filled':''}/>)}</div>
 <h1 ref={heading} tabIndex={-1} className="chat-title">{KEEPER.name}와 나누는 시작 대화</h1>
 <div className="chat-log" role="log" aria-live="polite">{turns.slice(0,at+1).map((t,i)=>{const mine=picked(i);return <Fragment key={i}>
  <div className="chat-row keeper">{i===at?<Keeper/>:<span className="chat-keeper is-gap" aria-hidden="true"/>}<div className="chat-said">{i===0&&<small className="chat-name">{KEEPER.name}</small>}{t.lead&&<p className="chat-bubble lead">{t.lead}</p>}<p className={'chat-bubble'+(t.quoted?' quoted':'')}>{t.say}</p></div></div>
  {i<at&&mine!==null&&<div className="chat-row me"><button className="chat-bubble" onClick={()=>setAt(i)} aria-label={`내 답 ‘${t.options[mine].label}’ 바꾸기`}>{t.options[mine].label}<Pencil size={12}/></button></div>}
 </Fragment>})}</div>
 <div ref={choices} className={'chat-choices'+(turn.options.some(o=>o.note)?'':' is-short')} role="group" aria-label="내 답 고르기">{turn.options.map((o,i)=><button key={o.label} aria-pressed={picked(at)===i} className={picked(at)===i?'selected':''} onClick={()=>answer(at,i)}><strong>{o.label}</strong>{o.note&&<small>{o.note}</small>}</button>)}</div>
 <div className="onboarding-buttons chat-buttons"><button className="onboarding-back" onClick={()=>at===0?setCreating(true):setAt(at-1)}><ArrowLeft size={17}/>이전</button>{picked(at)!==null&&<button className="onboarding-back" onClick={()=>go(at)}>그대로 둘게요<ArrowRight size={17}/></button>}</div><p className="onboarding-footnote">정답은 없어요. 답은 편안한 시작점을 고르는 데만 써요.</p>
 </>:draft&&energy&&measured?<><span className="onboarding-review-frog personal"><FrogStill character={character} equipped={{head:'sprout',face:'happy'}} growth={growth} framing="face" angle={0}/></span><span className="onboarding-eyebrow">이야기해 줘서 고마워요</span><h1 ref={heading} tabIndex={-1}>나에게 맞는<br/>작은 봄을 찾았어요.</h1><div className="onboarding-review-list"><div><span>나의 친구</span><strong>{character.name}</strong><button aria-label="캐릭터 수정" onClick={()=>setCreating(true)}><Pencil size={15}/></button></div><div><span>지금의 나</span><strong>{outsideOptions[outside!]}</strong><button aria-label="현재 상태 수정" onClick={()=>edit(0)}><Pencil size={15}/></button></div><div><span>나의 연결</span><strong>{levelLines[measured.level]}</strong><button aria-label="연결에 대한 답 다시 고르기" onClick={()=>edit(SCALE_FROM)}><Pencil size={15}/></button></div><div><span>나의 목표</span><strong>{goals.find(g=>g.id===goal)?.title}</strong><button aria-label="목표 수정" onClick={()=>edit(GOAL_AT)}><Pencil size={15}/></button></div><div><span>오늘의 마음</span><strong>{energies.find(e=>e.value===energy)?.label}</strong><button aria-label="오늘 에너지 수정" onClick={()=>edit(ENERGY_AT)}><Pencil size={15}/></button></div></div>
 {measured.level>=4&&<p className="chat-care"><Keeper/><span>혼자 버거운 날에는 이야기할 곳을 함께 찾을 수 있어요. <button onClick={onHelp}>도움받을 곳 보기</button></span></p>}
 <div className="onboarding-first-mission"><span><Sparkles size={14}/>나의 첫 미션 · {firstMission?.minutes}</span><h2>{firstMission?.title}</h2><p>{firstMission?.description}</p><small>{springStages[draft.stage].title}에서, 편한 만큼 시작해요.</small></div>
 {demo?<p className="onboarding-footnote">발표용 선택이에요. 실제 기기 기록에는 반영하지 않아요.</p>:<label className="onboarding-remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span><strong>이 기기에 캐릭터·선택·기록 기억하기</strong><small>선택 사항 · 켜면 다음 방문에도 이어서 시작해요.<br/>끄면 이번 방문에만 남고, 새로고침하면 다시 골라요.</small></span></label>}
 {initialProfile&&<p className="onboarding-footnote">새 시작점으로 변경해도 이전 행동 기록은 그대로 남아요.</p>}<button className="primary onboarding-next" disabled={!character.name.trim()} onClick={finish}>나의 연못으로 폴짝<ArrowRight size={18}/></button><button className="onboarding-repick" onClick={()=>edit(0)}>대화를 다시 살펴볼래요</button>
 </>:null}
 <div className="onboarding-bottom-note"><span><ShieldCheck size={13}/>나의 선택을 존중해요</span><button onClick={onHelp}>도움 먼저 찾기<ArrowRight size={13}/></button></div>
 </section></main><footer className="onboarding-footer">POLJJAK <span>·</span> 저마다의 봄, 나만의 속도.</footer></div>
}
