// The small sounds of the pond: a drop for a touch, a hop, a chime for a finished mission, water and croaks in the village.
// All of them are made on the device with Web Audio, like the keeper's voice in croak.ts — there are no sound files.
// Nothing is heard until the first touch (browsers require it) or when sound is switched off; those calls are silently dropped.
import {audio,soundOn} from './croak';
export type Sfx='tap'|'pick'|'jump'|'pat'|'hug'|'spin'|'cheer'|'leaf'|'done'|'rest'|'splash'|'hop'|'paddle'|'open'|'float'|'ribbit';
export const sfxKinds:Sfx[]=['tap','pick','jump','pat','hug','spin','cheer','leaf','done','rest','splash','hop','paddle','open','float','ribbit'];
type Out={c:AudioContext;to:AudioNode;t:number;vol:number};
let noise:AudioBuffer|null=null;
function noiseOf(c:AudioContext){if(!noise||noise.sampleRate!==c.sampleRate){noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=noise.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;last=(last+.04*w)/1.04;d[i]=w*.5+last*6;}}return noise;}
/** One pitched note: `f` gliding to `to`, loud for a moment and gone by `len`. */
function note({c,to:out,t,vol}:Out,f:number,at:number,len:number,gain:number,type:OscillatorType='sine',to?:number,attack=.012){
 const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t+at);if(to)o.frequency.exponentialRampToValueAtTime(to,t+at+len*.6);
 g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(gain*vol,t+at+attack);g.gain.exponentialRampToValueAtTime(.0006,t+at+len);
 o.connect(g).connect(out);o.start(t+at);o.stop(t+at+len+.03);
}
/** A breath of filtered noise: water, a splash, a paddle. */
function hiss({c,to:out,t,vol}:Out,at:number,len:number,gain:number,from:number,to:number,q=.8){
 const n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();n.buffer=noiseOf(c);n.loop=true;f.type='bandpass';f.Q.value=q;
 f.frequency.setValueAtTime(from,t+at);f.frequency.exponentialRampToValueAtTime(to,t+at+len);
 g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(gain*vol,t+at+.015);g.gain.exponentialRampToValueAtTime(.0006,t+at+len);
 n.connect(f).connect(g).connect(out);n.start(t+at,Math.random());n.stop(t+at+len+.03);
}
const play:Record<Sfx,(o:Out)=>void>={
 // a drop of water under the finger
 tap:o=>note(o,880,0,.07,.028,'sine',1500),
 pick:o=>{note(o,560,0,.09,.035,'sine',840);note(o,1120,.03,.08,.012);},
 // 폴짝: up, over, and a soft landing
 jump:o=>{note(o,300,0,.2,.06,'sine',860);note(o,520,.1,.14,.025,'triangle',400);note(o,170,.34,.09,.04,'sine',95);},
 pat:o=>{note(o,880,0,.1,.03);note(o,1175,.07,.14,.03);},
 hug:o=>{[262,330,392].forEach((f,i)=>note(o,f,i*.04,.75,.026,'triangle',undefined,.14));},
 spin:o=>{[523,659,784,988,1175].forEach((f,i)=>note(o,f,i*.055,.16,.028));},
 cheer:o=>{[523,659,784].forEach((f,i)=>note(o,f,i*.08,.3,.04,'triangle'));note(o,1568,.26,.5,.02);},
 // leaves landing in the wallet
 leaf:o=>{[784,988,1175,1568].forEach((f,i)=>note(o,f,i*.065,.22,.03));},
 // a finished mission: two warm notes, then the leaves
 done:o=>{note(o,659,0,.3,.05,'triangle');note(o,880,.16,.5,.05,'triangle');[1175,1568,1976].forEach((f,i)=>note(o,f,.36+i*.07,.3,.022));},
 rest:o=>{note(o,523,0,.6,.03,'sine',undefined,.08);note(o,392,.28,.9,.03,'sine',undefined,.1);},
 splash:o=>{hiss(o,0,.42,.1,2200,380);note(o,420,0,.12,.03,'sine',160);},
 hop:o=>{note(o,190,0,.09,.05,'sine',95);hiss(o,0,.06,.02,900,500);},
 paddle:o=>hiss(o,0,.22,.035,520,900,1.2),
 open:o=>{note(o,660,0,.14,.03);note(o,880,.08,.2,.03);},
 // a lily pad set on the water: a rising breath, then the drop
 float:o=>{hiss(o,0,.4,.05,400,1600);note(o,440,.3,.3,.045,'sine',880);note(o,1320,.42,.3,.018);},
 // 개굴: two rattling syllables, like the keeper's voice but a real call
 ribbit:o=>{const {c,to,t,vol}=o;const f=170+Math.random()*130;[0,.16].forEach((at,i)=>{const osc=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),trem=c.createOscillator(),tg=c.createGain();
  osc.type='square';osc.frequency.setValueAtTime(f*(i?1.18:1),t+at);osc.frequency.exponentialRampToValueAtTime(f*(i?.95:1.1),t+at+.12);lp.type='lowpass';lp.frequency.value=900;lp.Q.value=3;
  g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(.05*vol,t+at+.02);g.gain.exponentialRampToValueAtTime(.0006,t+at+.14);
  trem.frequency.value=42;tg.gain.value=.03*vol;trem.connect(tg).connect(g.gain);osc.connect(lp).connect(g).connect(to);osc.start(t+at);trem.start(t+at);osc.stop(t+at+.17);trem.stop(t+at+.17);});},
};
/** Plays one sound. `vol` (0–1) and `pan` (−1 left … 1 right) place it in the pond: far frogs are quiet and off to one side. */
export function sfx(kind:Sfx,{vol=1,pan=0}:{vol?:number;pan?:number}={}){
 if(!soundOn()||vol<=.01)return;const c=audio();if(!c)return;
 try{let to:AudioNode=c.destination;if(pan&&typeof c.createStereoPanner==='function'){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));p.connect(c.destination);to=p;}
  play[kind]({c,to,t:c.currentTime,vol:Math.min(1,vol)});}catch{}
}
/** How loud something `distance` away sounds, 1 beside you and fading to nothing by `far`. */
export const nearness=(distance:number,far=520)=>{const k=1-Math.min(1,Math.max(0,distance)/far);return k*k;};
/** Left or right of where the camera looks: −1 … 1 for a point `dx,dy` away, seen with the camera turned by `yaw`. */
export const sideOf=(dx:number,dy:number,yaw:number)=>{const len=Math.hypot(dx,dy);if(len<1)return 0;return Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dy*Math.sin(yaw))/len));};
export type Ambience={set:(water:number|null)=>void;stop:()=>void};
/** The pond's own sound while the village is open: water lapping, louder the nearer you are to it. */
export function pondAmbience():Ambience{
 let src:AudioBufferSourceNode|null=null,gain:GainNode|null=null,lfo:OscillatorNode|null=null,level=0,stopped=false;
 const start=()=>{if(src||stopped||!soundOn())return;const c=audio();if(!c)return;
  try{src=c.createBufferSource();src.buffer=noiseOf(c);src.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=620;f.Q.value=.5;const swell=c.createGain();swell.gain.value=.7;
   lfo=c.createOscillator();lfo.frequency.value=.23;const depth=c.createGain();depth.gain.value=.3;lfo.connect(depth).connect(swell.gain);
   gain=c.createGain();gain.gain.value=0;src.connect(f).connect(swell).connect(gain).connect(c.destination);src.start();lfo.start();}catch{src=null;}};
 return {
  // `null` is silence (the page went to the background); a number is how close the water is, 0 far … 1 in it.
  set(water){if(water===null){const c=audio();if(gain&&c)gain.gain.setTargetAtTime(0,c.currentTime,.1);return;}
   level=Math.max(0,Math.min(1,water));start();const c=audio();if(!gain||!c)return;gain.gain.setTargetAtTime(soundOn()?.006+level*.03:0,c.currentTime,.4);},
  stop(){stopped=true;try{src?.stop();lfo?.stop();}catch{}src=null;gain=null;lfo=null;},
 };
}
