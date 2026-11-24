// The keeper's voice: a short croak for each syllable it says, like the chatter in a village game.
// Made with Web Audio on the device — no sound files. Browsers only let sound start after a tap,
// so nothing is heard until the first touch; before that the calls are silently dropped.
// 0.54.0: slivers of a real ElevenLabs voice were tried in its place and sounded wrong, so the croak stayed and was only
// polished: the same rattle and the same little drop in pitch, with a warmer body and the colour of the vowel being said.
const KEY='poljjak-sound';
let ctx:AudioContext|null=null;
export function soundOn():boolean{if(typeof window==='undefined')return true;try{return localStorage.getItem(KEY)!=='off';}catch{return true;}}
/** Sent on the window whenever the sound or the music switch changes, wherever it was pressed, so the music and every switch on screen follow at once. */
export const SOUND_CHANGED='poljjak-sound-changed';
export const soundChanged=()=>{try{window.dispatchEvent(new Event(SOUND_CHANGED));}catch{}};
export function setSound(on:boolean){try{localStorage.setItem(KEY,on?'on':'off');}catch{}soundChanged();}
/** The one audio context every sound shares, or null until a tap has allowed sound. */
export function audio():AudioContext|null{
 if(typeof window==='undefined')return null;
 try{
  if(!ctx){const A=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!A)return null;ctx=new A();}
  if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
  return ctx.state==='running'?ctx:null;
 }catch{return null;}
}
// Call from a tap so the next croaks can be heard.
export function wakeSound(){if(soundOn())audio();}
export const syllables=['a','e','i','o','u','eo'] as const;
export type Syllable=typeof syllables[number];
// the 21 Korean vowels in the order they sit in a Hangul syllable, each sent to the nearest of six mouth shapes
const VOWEL:Syllable[]=['a','e','a','e','eo','e','eo','e','o','a','e','e','o','u','eo','e','i','u','u','i','i'];
/** The mouth shape of a letter: its vowel for Hangul, a steady pick for anything else. */
export function syllableOf(ch:string):Syllable{const code=ch.charCodeAt(0);return code>=0xAC00&&code<=0xD7A3?VOWEL[Math.floor(((code-0xAC00)%588)/28)]:syllables[code%syllables.length];}
/** Where each mouth shape rings (Hz): an open ‘아’ is bright, a closed ‘이’ or ‘우’ is dark. The croak is tinted with it, so it follows the words a little. */
export const VOWEL_RING:Record<Syllable,number>={a:820,eo:620,e:540,o:470,u:370,i:330};
// Seven steps of pitch from the letter itself. For Hangul the consonants and the vowel all take part; the plain code would give
// most letters of a sentence the same step.
const stepOf=(ch:string)=>{const code=ch.charCodeAt(0);if(code<0xAC00||code>0xD7A3)return code%7;const k=code-0xAC00;return (k%28+Math.floor(k/588)*3+Math.floor((k%588)/28)*5)%7;};
/** The note of a letter (Hz), in the range the croak always had (about 250–440). */
export const croakPitch=(ch:string)=>250+stepOf(ch)*31;
/** `classic` is the croak as it was from 0.30.0; `soft` is the same croak polished (0.54.0), which the app uses. */
export type CroakStyle='soft'|'classic';
export const CROAK_STYLE:CroakStyle='soft';
let style:CroakStyle=CROAK_STYLE;
/** For the listening page, to hear the two side by side. */
export function setCroakStyle(next:CroakStyle){style=next;}
// One syllable. The pitch follows the letter, so a sentence has a little melody of its own.
export function croak(ch:string,at=0){
 if(!soundOn()||!ch||/[\s.,!?~…·‘’“”'"()]/.test(ch))return;
 const c=audio();if(!c)return;
 const t=c.currentTime+at;
 if(style==='classic'){
  const f=250+(ch.charCodeAt(0)%9)*24;
  const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),trem=c.createOscillator(),tg=c.createGain();
  o.type='square';o.frequency.setValueAtTime(f*1.3,t);o.frequency.exponentialRampToValueAtTime(f,t+.05);
  lp.type='lowpass';lp.frequency.value=1100;lp.Q.value=2;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+.075);
  trem.frequency.value=55;tg.gain.value=.025;trem.connect(tg).connect(g.gain); // the rattle that makes it a frog
  o.connect(lp).connect(g).connect(c.destination);
  o.start(t);trem.start(t);o.stop(t+.085);trem.stop(t+.085);
  return;
 }
 // The polished croak keeps what made it a frog — the square buzz, the rattle, the pitch dropping into place — and changes four small things:
 // a round tone under the buzz so it is less thin, a gentler filter so it is less sharp, a ring at the vowel being said, and a slightly longer tail.
 const f=croakPitch(ch);const len=.09;
 const buzz=c.createOscillator(),body=c.createOscillator(),buzzGain=c.createGain(),bodyGain=c.createGain(),lp=c.createBiquadFilter(),ring=c.createBiquadFilter(),g=c.createGain(),trem=c.createOscillator(),tg=c.createGain();
 buzz.type='square';body.type='triangle';for(const o of [buzz,body]){o.frequency.setValueAtTime(f*1.25,t);o.frequency.exponentialRampToValueAtTime(f,t+.045);}
 buzzGain.gain.value=.62;bodyGain.gain.value=.5;
 lp.type='lowpass';lp.frequency.value=1500;lp.Q.value=.8;
 ring.type='peaking';ring.frequency.value=VOWEL_RING[syllableOf(ch)];ring.Q.value=3;ring.gain.value=7;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.046,t+.011);g.gain.exponentialRampToValueAtTime(.0008,t+len);
 trem.frequency.value=50;tg.gain.value=.02;trem.connect(tg).connect(g.gain); // the rattle that makes it a frog
 buzz.connect(buzzGain).connect(lp);body.connect(bodyGain).connect(lp);lp.connect(ring).connect(g).connect(c.destination);
 buzz.start(t);body.start(t);trem.start(t);buzz.stop(t+len+.01);body.stop(t+len+.01);trem.stop(t+len+.01);
}
/** Says a whole line the way the start screen does — a syllable for every other letter, 64 ms apart. For the listening page. */
export function sayLine(text:string){const c=audio();if(!c)return;for(let i=0;i<text.length;i+=2)croak(text[i],i*.032);}
// The grow-up moment: a shimmer that climbs while the two shapes take turns ('rise'), then a short bright chord ('ding').
export function evolveSound(kind:'rise'|'ding'){
 if(!soundOn())return;const c=audio();if(!c)return;const t=c.currentTime;
 const note=(f:number,at:number,len:number,vol:number,type:OscillatorType='triangle',to?:number)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;
  o.frequency.setValueAtTime(f,t+at);if(to)o.frequency.exponentialRampToValueAtTime(to,t+at+len);
  g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(vol,t+at+.02);g.gain.exponentialRampToValueAtTime(.0008,t+at+len);
  o.connect(g).connect(c.destination);o.start(t+at);o.stop(t+at+len+.02);};
 if(kind==='rise'){for(let i=0;i<14;i++)note(330*Math.pow(2,i/9),i*.32*Math.pow(.93,i),.22,.035,'sine');}
 else{[523,659,784,1047].forEach((f,i)=>note(f,i*.09,.5+i*.08,.05));note(1568,.42,.7,.025,'sine');}
}
