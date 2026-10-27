'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Leaf,RotateCcw,Maximize2,Check,Play,Pause,Smartphone} from 'lucide-react';
import OneStep from './one-step';
import {FrogMark} from './frog-mark';
import './demo-studio.css';
const scenes=[
 {label:'저마다의 봄',title:<>우리의 봄은,<br/><em>저마다의 시간에.</em></>,copy:'경칩이 오면 개구리가 겨울잠에서 깨어나듯, 고립·은둔 경험 청년에게도 자신만의 봄이 찾아옵니다. 폴짝은 그 시작을 함께 기다리는 작은 연못입니다.',action:'환영 화면에서 ‘편하게 골라볼게요’를 눌러보세요.',point:'서두르거나 비교하지 않고, 스스로 고르는 작은 시도를 돕습니다.'},
 {label:'나의 시작점',title:<>같은 출발선 대신,<br/><em>지금 나의 자리.</em></>,copy:'외출과 연결이 얼마나 편한지, 어떤 일상을 바라는지 묻습니다. 사람마다 다른 현재 상태와 목표에서 미션을 시작합니다.',action:'3D 친구의 색을 고르고, 현재 상태·목표·에너지를 골라보세요.',point:'사용자 선택에 따른 시작점입니다. 임상 검사나 고립도 진단이 아닙니다.'},
 {label:'다음으로 폴짝',title:<>할 수 있는 만큼,<br/><em>다음으로 폴짝.</em></>,copy:'현재 단계·목표·오늘의 에너지로 미션의 크기를 조절합니다. 시도 후에도 더 머물거나, 준비됐을 때 다음 단계로 갈 수 있습니다.',action:'미션을 해본 뒤 ‘다음으로 폴짝’을 눌러보세요.',point:'72개 미션의 규칙 기반 추천입니다. 완료만으로 단계가 자동 상승하지 않습니다.'},
 {label:'한마디 연습',title:<>일상의 한마디도,<br/><em>미리 연습해요.</em></>,copy:'카페 주문, 전화 예약, 안부 인사. 익숙한 공간에서 한 문장씩 대화를 연습하고 전후 편안함을 기록합니다.',action:'편안함을 고르고 예시 문장으로 연습해 보세요.',point:'발표 체험은 예시 대화입니다. 실제 생성형 AI 연결은 별도 검증이 필요합니다.'},
 {label:'든든한 연결',title:<>연못 밖에서도,<br/><em>함께할 수 있게.</em></>,copy:'필요할 때 가까운 공간과 공식 지원정보를 만납니다. 신청을 서두르지 않고 가볍게 살펴보는 것도 하나의 시작입니다.',action:'성남과 전국의 지원정보를 살펴보세요.',point:'기관별 출처와 정보 확인일을 함께 표시합니다.'},
 {label:'나의 작은 폴짝',title:<>작은 시도가 모여,<br/><em>나만의 봄으로.</em></>,copy:'쉬어간 날도 나의 선택으로 남깁니다. 초기 상태·목표·진행과 기록은 기기에 저장할지 직접 선택합니다.',action:'한 주의 순간과 연습 전후의 편안함을 확인하세요.',point:'발표용 가상 기록이며, 실제 사용자 실증 결과가 아닙니다.'},
 {label:'나를 닮은 친구',title:<>차곡차곡 모은 시도,<br/><em>나를 닮은 모습.</em></>,copy:'처음 만든 3D 개구리는 작은 활동으로 모은 잎으로 꾸밀 수 있습니다. 모자·안경·옷·소품·표정 28가지와 15개의 코디 예시를 미리 입어보고 내 옷장에 모읍니다.',action:'코디 예시를 눌러 입어보고, 친구를 톡 눌러 폴짝 뛰게 해보세요.',point:'가상 포인트입니다. 쉬어간 날에 포인트를 빼거나 연속 방문을 강요하지 않습니다.'},
];
export default function DemoStudio(){
 const [step,setStep]=useState(0);const [run,setRun]=useState(0);const [seconds,setSeconds]=useState(0);const [running,setRunning]=useState(false);const device=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(t)},[running]);
 useEffect(()=>{device.current?.scrollTo({top:0,behavior:'instant'})},[step,run]);
 useEffect(()=>{function keys(e:KeyboardEvent){const tag=(e.target as HTMLElement).tagName;if(['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(tag)||document.querySelector('dialog[open]'))return;if(e.key==='ArrowRight'){e.preventDefault();setStep(s=>Math.min(scenes.length-1,s+1))}if(e.key==='ArrowLeft'){e.preventDefault();setStep(s=>Math.max(0,s-1))}}window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys)},[]);
 const scene=scenes[step];
 return <div className="demo-studio"><header className="studio-top"><a href="/" className="studio-brand"><FrogMark size={32}/>폴짝<span>3NFP · MY AI LAB</span></a><div><span className="studio-label">INTERACTIVE DEMO</span><a href="/" className="studio-exit">앱으로 돌아가기<ArrowRight size={16}/></a></div></header>
 <div className="studio-layout"><section className="studio-story"><span className="studio-kicker"><span/>2026 모두의 AI 라운지 · 마이 AI 랩</span><div className="scene-count"><span>0{step+1}</span><i/>07<span className="scene-label">{scene.label}</span></div><h1 key={step}>{scene.title}</h1><p className="scene-copy">{scene.copy}</p><div className="scene-task"><Smartphone size={21}/><div><span>직접 체험해 보세요</span><p>{scene.action}</p></div></div><p className="scene-evidence"><Check size={15}/>{scene.point}</p>
 <div className="scene-nav" aria-label="발표 장면">{scenes.map((s,i)=><button key={s.label} onClick={()=>setStep(i)} className={i===step?'selected':''} aria-current={i===step?'step':undefined}><span>0{i+1}</span>{s.label}</button>)}</div>
 <div className="studio-controls"><div className="scene-arrows"><button aria-label="이전 장면" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft size={19}/></button><button aria-label="다음 장면" disabled={step===scenes.length-1} onClick={()=>setStep(s=>s+1)}><ArrowRight size={19}/></button><span>방향키로도 이동할 수 있어요</span></div><div className="demo-timer"><button aria-label={running?'발표 타이머 멈춤':'발표 타이머 시작'} onClick={()=>setRunning(v=>!v)}>{running?<Pause size={14}/>:<Play size={14}/>}</button><span>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</span><button aria-label="시연 처음부터" title="시연 처음부터" onClick={()=>{setRun(v=>v+1);setStep(0);setSeconds(0);setRunning(false)}}><RotateCcw size={15}/></button></div></div>
 <footer className="studio-footer">폴짝 앱 v0.6 <span>·</span> 발표용 가상 체험 <span>·</span> 실제 기록과 분리</footer></section>
 <section className="device-stage" aria-label="앱 체험 화면"><div className="device-topline"><span>폴짝 · 나의 작은 연못</span><span>LIVE PREVIEW</span></div><div className="device-shell"><div className="device-status" aria-hidden="true"><span>9:41</span><span className="device-island"/><span>▂▃▅ ▰</span></div><div className="demo-device" ref={device}><OneStep key={run} demo demoStep={step}/></div><div className="device-home" aria-hidden="true"><span/></div></div><p className="device-caption">직접 눌러 체험하는 폴짝 앱입니다.</p></section></div></div>
}
