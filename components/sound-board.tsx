'use client';
// 소리 듣기(0.53.0): every sound of the app in one place, for the team to listen and decide. Each kind can be played as it sounds
// in the app (the file where there is one) and as the on-device recipe, so the two can be compared; the tunes and the pond can be started and stopped.
// The page is not linked from the app. It joins no cohort and records nothing.
import {useEffect,useRef,useState} from 'react';
import {Play,Square,Volume2} from 'lucide-react';
import {wakeSound,sayLine,setCroakStyle,CROAK_STYLE,type CroakStyle} from '@/lib/croak';
const KEEPER_LINE='안녕, 반가워요. 나는 이 연못에 사는 연못지기예요.';
import {sfx,sfxKinds,sampleFiles,pondAmbience,soundUrl,AMBIENCE_FILE,type Sfx,type Ambience} from '@/lib/sound';
import {playMusic,tracks,type Track} from '@/lib/music';
const where:Record<Sfx,string>={tap:'누를 수 있는 곳을 누를 때',pick:'소리를 켤 때, 옷을 고를 때',jump:'친구를 톡 누를 때, 다음 단계로 폴짝',pat:'친구 머리를 쓰다듬을 때, 응원을 보낼 때',hug:'친구를 길게 누를 때',spin:'친구를 옆으로 밀 때',cheer:'코디를 살 때',leaf:'작은 연습을 기록할 때, 환영 선물',done:'미션을 마쳤을 때',rest:'쉬어가기를 골랐을 때',splash:'연못 마을에서 물에 들어가고 나올 때',hop:'연못 마을에서 땅 위를 뛸 때',paddle:'연못 마을에서 헤엄칠 때',open:'연잎을 열어 볼 때',float:'연잎을 띄울 때',ribbit:'연못 마을의 다른 개구리, 개구리를 눌러 볼 때'};
export function SoundBoard(){
 const [tune,setTune]=useState<Track|null>(null);const [pond,setPond]=useState(false);const water=useRef<Ambience|null>(null);
 // The keeper says its first line in one of the two croaks, the way the start screen does.
 const speak=(style:CroakStyle)=>{wakeSound();setCroakStyle(style);sayLine(KEEPER_LINE);};
 useEffect(()=>()=>{playMusic(null);water.current?.stop();setCroakStyle(CROAK_STYLE);},[]);
 const music=(t:Track)=>{wakeSound();const next=tune===t?null:t;setTune(next);playMusic(next);};
 const ambience=()=>{wakeSound();if(pond){water.current?.stop();water.current=null;setPond(false);}else{water.current=pondAmbience();water.current.set(1);setTimeout(()=>water.current?.set(1),1500);setPond(true);}};
 return <main className="sound-board"><a className="back-button" href="/">폴짝으로</a><h1>소리 듣기</h1>
  <p>폴짝의 소리를 한곳에서 들어 보는 화면이에요. 앱 메뉴의 ‘소리’가 꺼져 있으면 아무것도 들리지 않아요. 처음 누를 때는 파일을 받아오느라 기기에서 만든 소리가 날 수 있으니 한 번 더 눌러 주세요.</p>
  <h2>배경음악</h2>
  <ul>{(Object.keys(tracks) as Track[]).map(t=><li key={t}><div><strong>{tracks[t].name}</strong><small>{t==='pond'?'연못(홈)과 대부분의 화면':'연못 마을'} · {tracks[t].file}.mp3</small></div><button onClick={()=>music(t)} aria-pressed={tune===t}>{tune===t?<><Square size={15}/>멈추기</>:<><Play size={15}/>듣기</>}</button><a href={soundUrl(tracks[t].file)} target="_blank" rel="noopener noreferrer">파일</a></li>)}
   <li><div><strong>연못 마을의 물과 개구리 소리</strong><small>연못 마을에 있는 동안, 물에 가까울수록 크게 · {AMBIENCE_FILE}.mp3</small></div><button onClick={ambience} aria-pressed={pond}>{pond?<><Square size={15}/>멈추기</>:<><Play size={15}/>듣기</>}</button><a href={soundUrl(AMBIENCE_FILE)} target="_blank" rel="noopener noreferrer">파일</a></li></ul>
  <h2>연못지기의 말소리</h2>
  <p>연못지기는 글자가 나올 때마다 짧은 ‘개굴’ 소리를 내요. 예전 소리의 느낌은 그대로 두고 조금만 다듬었어요. 둘을 번갈아 눌러 비교해 보세요.</p>
  <ul><li><div><strong>다듬은 소리 · 지금 앱에서 쓰는 소리</strong><small>같은 개굴 소리에 둥근 울림을 더하고, 날카로운 부분을 줄이고, 글자의 모음에 따라 색이 조금 달라져요</small></div><button onClick={()=>speak('soft')}><Volume2 size={15}/>말소리</button></li>
   <li><div><strong>예전 소리</strong><small>0.53.0까지의 소리 그대로</small></div><button className="quiet" onClick={()=>speak('classic')}><Volume2 size={15}/>말소리</button></li></ul>
  <h2>효과음</h2>
  <ul>{sfxKinds.map(kind=>{const files=sampleFiles[kind]?.files;return <li key={kind}><div><strong>{kind}</strong><small>{where[kind]} · {files?`만든 파일 ${files.length}개`:'기기에서 만드는 소리'}</small></div>
   <button onClick={()=>{wakeSound();sfx(kind);}}><Volume2 size={15}/>앱에서 나는 소리</button>{files&&<button className="quiet" onClick={()=>{wakeSound();sfx(kind,{recipe:true});}}>예전 소리</button>}</li>;})}</ul>
  <p className="sound-board-note">만든 파일은 <code>scripts/sounds.json</code>의 글로 ElevenLabs에서 만들었어요. 마음에 들지 않는 소리는 글을 고쳐 <code>node scripts/make-sounds.mjs --force 이름</code>으로 다시 만들 수 있어요.</p>
 </main>;
}
