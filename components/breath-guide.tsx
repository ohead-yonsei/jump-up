'use client';
import {useEffect,useRef,useState} from 'react';
import {FrogMark} from './frog-mark';
// Three slow breaths (4s in, 4s out) before a practice conversation.
const BREATHS=3,HALF=4000;
export function BreathGuide({onDone}:{onDone:()=>void}){
 const [step,setStep]=useState(-1);const done$=useRef(onDone);done$.current=onDone;
 useEffect(()=>{if(step>=BREATHS*2){const t=setTimeout(()=>done$.current(),900);return ()=>clearTimeout(t);}const t=setTimeout(()=>setStep(s=>s+1),step<0?60:HALF);return ()=>clearTimeout(t);},[step]);
 const done=step>=BREATHS*2;const inhale=step<=0||step%2===0;
 return <div className="breath-guide" role="status" aria-live="polite">
  <span className={'breath-circle'+(done||step<0?'':inhale?' in':' out')}><FrogMark size={44}/></span>
  <strong>{done?'잘했어요. 이제 천천히 시작해요.':inhale?'코로 천천히 들이쉬고':'입으로 길게 내쉬어요'}</strong>
  <small>{done?'':`${Math.floor(Math.max(0,step)/2)+1} / ${BREATHS}`}</small>
  {!done&&<button className="text-button" onClick={onDone}>그만할래요</button>}
 </div>
}
