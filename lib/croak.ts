// The keeper's voice: a short sound for each syllable it says, like the chatter in a village game.
// 0.54.0: the sound is a sliver of a real voice (six syllables spoken by an ElevenLabs voice, public/audio/keeper), picked by the
// vowel of the letter being said and raised a little, so the keeper mumbles along with its own words instead of beeping.
// The old croak made on the device stays as the fallback. Browsers only let sound start after a tap,
// so nothing is heard until the first touch; before that the calls are silently dropped.
import {measure} from './measure';
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
/** The voices the keeper's talking sound can be cut from (scripts/sounds.json `voices`), and the one in use. `null` is the old croak. */
export const keeperVoices=[
 {key:'rumi',name:'루미',about:'차분하고 맑은 여성 목소리'},
 {key:'hyunmin',name:'현민',about:'부드럽고 느긋한 남성 목소리'},
 {key:'han',name:'한',about:'깊고 따뜻한 남성 내레이터'},
 {key:'harry',name:'해리 킴',about:'어린이 이야기를 읽어 주는 목소리'},
 {key:'namchun',name:'할아버지 남천',about:'이야기를 들려주는 할아버지'},
] as const;
export type KeeperVoice=typeof keeperVoices[number]['key'];
export const KEEPER_VOICE:KeeperVoice|null='rumi';
export const syllables=['a','e','i','o','u','eo'] as const;
export type Syllable=typeof syllables[number];
export const keeperFile=(voice:KeeperVoice,part:Syllable|'line')=>`/audio/keeper/${voice}-${part}.mp3`;
// the 21 Korean vowels in the order they sit in a Hangul syllable, each sent to the nearest of the six recorded ones
const VOWEL:Syllable[]=['a','e','a','e','eo','e','eo','e','o','a','e','e','o','u','eo','e','i','u','u','i','i'];
/** Which recorded syllable stands for a letter: its vowel for Hangul, a steady pick for anything else. */
export function syllableOf(ch:string):Syllable{const code=ch.charCodeAt(0);return code>=0xAC00&&code<=0xD7A3?VOWEL[Math.floor(((code-0xAC00)%588)/28)]:syllables[code%syllables.length];}
/** How much a sliver is raised: a third up to sound small and friendly, then a touch higher or lower by the letter so a sentence has a little melody. */
// Seven steps of pitch from the letter itself. For Hangul the consonants and the vowel all take part; the plain code would give
// most letters of a sentence the same step.
const stepOf=(ch:string)=>{const code=ch.charCodeAt(0);if(code<0xAC00||code>0xD7A3)return code%7;const k=code-0xAC00;return (k%28+Math.floor(k/588)*3+Math.floor((k%588)/28)*5)%7;};
export const blipRate=(ch:string)=>1.3*Math.pow(2,(stepOf(ch)-3)/24);
/** Seconds of sound for one letter. Letters come every 64 ms, so the slivers just overlap into a mumble. */
export const BLIP=.085;
type Sliver={buffer:AudioBuffer;from:number;gain:number};
const sets=new Map<KeeperVoice,Map<Syllable,Sliver>>();const state=new Map<KeeperVoice,'loading'|'failed'>();
let voice:KeeperVoice|null=KEEPER_VOICE;
/** Fetches one voice's six syllables. It needs no touch (decoding works off-line), so the start screen can have them ready before the keeper is heard. */
export async function loadKeeperVoice(key:KeeperVoice|null=voice){
 if(!key||typeof window==='undefined'||sets.has(key)||state.get(key)==='loading')return;state.set(key,'loading');
 try{const O=window.OfflineAudioContext||(window as unknown as {webkitOfflineAudioContext?:typeof OfflineAudioContext}).webkitOfflineAudioContext;if(!O)throw new Error('no decoder');
  const dec=new O(1,1,44100);const decode=(bytes:ArrayBuffer)=>new Promise<AudioBuffer>((ok,no)=>{const p=dec.decodeAudioData(bytes,ok,no);if(p&&typeof p.then==='function')p.then(ok,no);});
  const set=new Map<Syllable,Sliver>();
  await Promise.all(syllables.map(async s=>{const r=await fetch(keeperFile(key,s));if(!r.ok)throw new Error('missing');const buffer=await decode(await r.arrayBuffer());
   const m=measure(Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),buffer.sampleRate,.13);if(!(m.gain>0))throw new Error('silent');
   // start a little into the vowel, where the voice is steady, and never so late that the sliver runs off the end
   set.set(s,{buffer,from:Math.max(0,Math.min(m.from+.03,buffer.duration-BLIP*1.6)),gain:m.gain});}));
  sets.set(key,set);state.delete(key);}
 catch{state.set(key,'failed');}
}
/** Chooses the voice (the listening page tries them out); `null` goes back to the old croak. */
export function setKeeperVoice(key:KeeperVoice|null){voice=key;void loadKeeperVoice(key);}
export const keeperVoice=()=>voice;
export const keeperVoiceReady=(key:KeeperVoice|null=voice)=>!!key&&sets.has(key);
// One syllable. With a voice chosen it is a sliver of that voice; while the voice is still arriving it stays quiet rather than mix two voices;
// with no voice, or if the files could not be had, it is the old croak whose pitch follows the letter.
export function croak(ch:string,at=0){
 if(!soundOn()||!ch||/[\s.,!?~…·‘’“”'"()]/.test(ch))return;
 const c=audio();if(!c)return;
 const t=c.currentTime+at;
 if(voice){const set=sets.get(voice);
  if(set){const s=set.get(syllableOf(ch))!;try{const src=c.createBufferSource(),g=c.createGain();src.buffer=s.buffer;src.playbackRate.value=blipRate(ch);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(s.gain,t+.008);g.gain.setValueAtTime(s.gain,t+BLIP-.03);g.gain.linearRampToValueAtTime(0,t+BLIP);
    src.connect(g).connect(c.destination);src.start(t,s.from);src.stop(t+BLIP+.01);}catch{}return;}
  if(state.get(voice)!=='failed'){void loadKeeperVoice(voice);return;}
 }
 const f=250+(ch.charCodeAt(0)%9)*24;
 const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),trem=c.createOscillator(),tg=c.createGain();
 o.type='square';o.frequency.setValueAtTime(f*1.3,t);o.frequency.exponentialRampToValueAtTime(f,t+.05);
 lp.type='lowpass';lp.frequency.value=1100;lp.Q.value=2;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+.075);
 trem.frequency.value=55;tg.gain.value=.025;trem.connect(tg).connect(g.gain); // the rattle that makes it a frog
 o.connect(lp).connect(g).connect(c.destination);
 o.start(t);trem.start(t);o.stop(t+.085);trem.stop(t+.085);
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
