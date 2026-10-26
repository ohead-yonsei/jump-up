'use client';
import {useEffect,useRef,useState} from 'react';
// Voice practice from the activity plan: hear the other person's line, and optionally answer out loud.
// Speech is produced on the device. Recognition is the browser's own service (Google in Chrome, Apple in Safari).
type Result={isFinal:boolean;0:{transcript:string}};
type Recognition={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;stop:()=>void;abort:()=>void;onresult:((e:{results:ArrayLike<Result>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null};
type RecognitionCtor=new()=>Recognition;
const recognitionCtor=()=>{const w=window as unknown as {SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};return w.SpeechRecognition??w.webkitSpeechRecognition;};
export function useVoice(){
 const [canSpeak,setCanSpeak]=useState(false);const [canListen,setCanListen]=useState(false);const [listening,setListening]=useState(false);const [error,setError]=useState('');const rec=useRef<Recognition|null>(null);
 useEffect(()=>{setCanSpeak('speechSynthesis' in window);setCanListen(!!recognitionCtor());return ()=>{try{speechSynthesis.cancel()}catch{}rec.current?.abort();};},[]);
 function speak(text:string){if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.94;u.pitch=1.05;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ko'));if(voice)u.voice=voice;speechSynthesis.speak(u);}
 function stopSpeaking(){try{speechSynthesis.cancel()}catch{}}
 function listen(onText:(text:string)=>void){
  const Ctor=recognitionCtor();if(!Ctor)return;rec.current?.abort();stopSpeaking();setError('');
  const r=new Ctor();r.lang='ko-KR';r.interimResults=true;r.continuous=false;
  r.onresult=e=>{let text='';for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript;onText(text.trim());};
  r.onend=()=>setListening(false);
  r.onerror=e=>{setListening(false);setError(e.error==='not-allowed'||e.error==='service-not-allowed'?'마이크를 쓸 수 없어요. 글자로 적어도 충분해요.':e.error==='no-speech'?'소리가 들리지 않았어요. 다시 눌러 말해도 괜찮아요.':'음성 인식이 잠시 어려워요. 글자로 적어도 괜찮아요.');};
  rec.current=r;setListening(true);try{r.start();}catch{setListening(false);}
 }
 function stopListening(){rec.current?.stop();}
 return {canSpeak,canListen,listening,error,speak,stopSpeaking,listen,stopListening};
}
