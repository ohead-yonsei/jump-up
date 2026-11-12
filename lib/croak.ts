// The keeper's voice: a short croak for each syllable it says, like the chatter in a village game.
// Made with Web Audio on the device — no sound files. Browsers only let sound start after a tap,
// so nothing is heard until the first touch; before that the calls are silently dropped.
const KEY='poljjak-sound';
let ctx:AudioContext|null=null;
export function soundOn():boolean{try{return localStorage.getItem(KEY)!=='off';}catch{return true;}}
export function setSound(on:boolean){try{localStorage.setItem(KEY,on?'on':'off');}catch{}}
function audio():AudioContext|null{
 if(typeof window==='undefined')return null;
 try{
  if(!ctx){const A=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!A)return null;ctx=new A();}
  if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
  return ctx.state==='running'?ctx:null;
 }catch{return null;}
}
// Call from a tap so the next croaks can be heard.
export function wakeSound(){if(soundOn())audio();}
// One syllable. The pitch follows the letter, so a sentence has a little melody of its own.
export function croak(ch:string,at=0){
 if(!soundOn()||!ch||/[\s.,!?~…·‘’“”'"()]/.test(ch))return;
 const c=audio();if(!c)return;
 const t=c.currentTime+at;
 const f=250+(ch.charCodeAt(0)%9)*24;
 const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),trem=c.createOscillator(),tg=c.createGain();
 o.type='square';o.frequency.setValueAtTime(f*1.3,t);o.frequency.exponentialRampToValueAtTime(f,t+.05);
 lp.type='lowpass';lp.frequency.value=1100;lp.Q.value=2;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+.075);
 trem.frequency.value=55;tg.gain.value=.025;trem.connect(tg).connect(g.gain); // the rattle that makes it a frog
 o.connect(lp).connect(g).connect(c.destination);
 o.start(t);trem.start(t);o.stop(t+.085);trem.stop(t+.085);
}
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
