'use client';
import {useCallback,useEffect,useState} from 'react';
import {setSound,soundOn,wakeSound} from '@/lib/croak';
import {sfx} from '@/lib/sound';
// What counts as something to press. Text fields and plain labels are left alone.
const TAPPABLE='button,a[href],[role="button"],[role="tab"],[role="switch"],summary,label.consent,input[type="checkbox"]';
/**
 * The screen answers the finger: wherever something that can be pressed is touched, a drop of water — a soft sound and a ripple.
 * It also tells apart what can be pressed from what cannot. With reduced motion there is no ripple; with sound off, no sound.
 * Anything inside `data-quiet` (the joystick, sliders) stays silent.
 */
export function useTouchFeedback(){
 useEffect(()=>{
  const still=window.matchMedia('(prefers-reduced-motion: reduce)');
  const down=(e:PointerEvent)=>{
   wakeSound();
   const el=(e.target as Element|null)?.closest?.(TAPPABLE) as HTMLElement|null;
   if(!el||(el as HTMLButtonElement).disabled||el.getAttribute('aria-disabled')==='true'||el.closest('[data-quiet]'))return;
   sfx('tap');
   if(still.matches)return;
   // A dialog opened with showModal sits above the page, so its ripple has to live inside it.
   const host=el.closest('dialog[open]') as HTMLElement|null;const r=document.createElement('span');r.className='tap-ripple';r.setAttribute('aria-hidden','true');
   if(host){const box=host.getBoundingClientRect();r.style.position='absolute';r.style.left=e.clientX-box.left+host.scrollLeft+'px';r.style.top=e.clientY-box.top+host.scrollTop+'px';}
   else{r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';}
   (host??document.body).appendChild(r);setTimeout(()=>r.remove(),650);
  };
  // Touch screens only allow sound once a finger has lifted, so the end of the first touch wakes it too.
  document.addEventListener('pointerdown',down,{capture:true,passive:true});document.addEventListener('pointerup',wakeSound,{capture:true,passive:true});
  return()=>{document.removeEventListener('pointerdown',down,{capture:true});document.removeEventListener('pointerup',wakeSound,{capture:true});};
 },[]);
}
/** The one sound switch (the keeper's voice, touches, the pond). Remembered on the device. */
export function useSoundSwitch():[boolean,()=>void]{
 const [on,setOn]=useState(true);
 useEffect(()=>{setOn(soundOn());},[]);
 const toggle=useCallback(()=>{const next=!soundOn();setSound(next);setOn(next);if(next){wakeSound();setTimeout(()=>sfx('pick'),60);}},[]);
 return [on,toggle];
}
