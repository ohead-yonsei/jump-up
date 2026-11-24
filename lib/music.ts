// 배경음악(0.53.0): one quiet tune under the app, another in the pond village. The files are in public/audio (made with ElevenLabs
// from scripts/sounds.json) and are fetched only after the first touch, and only while music is on.
// It plays through the same audio context as the small sounds, so on an iPhone the silent switch mutes it too.
// A tune loops by overlapping its end with its beginning for a few seconds, which needs no perfect loop point in the file.
import {audio,soundOn,soundChanged} from './croak';
import {soundUrl} from './sound';
import {measure} from './measure';
export type Track='pond'|'village';
export const tracks:Record<Track,{file:string;level:number;name:string}>={
 pond:{file:'bgm-pond',level:.1,name:'연못의 음악'},
 village:{file:'bgm-village',level:.09,name:'연못 마을의 음악'},
};
const KEY='poljjak-music';
/** Music has its own switch under the sound switch; it is on until the person turns it off. */
export function musicOn():boolean{if(typeof window==='undefined')return true;try{return localStorage.getItem(KEY)!=='off';}catch{return true;}}
export function setMusic(on:boolean){try{localStorage.setItem(KEY,on?'on':'off');}catch{}soundChanged();}
/** Seconds a tune takes to come in, to leave, and that its end overlaps its beginning. */
export const FADE=2.5;
/** When the next pass of a tune starts so that it overlaps the end of this one: `length` seconds of music that began at `at`. */
export const nextPassAt=(at:number,length:number)=>at+Math.max(FADE*2,length)-FADE;
type Tune={buffer:AudioBuffer;from:number;length:number;gain:number};
const tunes=new Map<Track,Tune>();const asking=new Set<Track>();
type Playing={track:Track;out:GainNode;sources:AudioBufferSourceNode[];timer:ReturnType<typeof setTimeout>|null;over:boolean};
let now:Playing|null=null;let want:Track|null=null;
async function load(c:AudioContext,track:Track){
 if(tunes.has(track)||asking.has(track))return;asking.add(track);
 try{const r=await fetch(soundUrl(tracks[track].file));if(!r.ok)return;const buffer=await c.decodeAudioData(await r.arrayBuffer());
  const m=measure(Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),buffer.sampleRate,tracks[track].level);
  if(m.gain>0)tunes.set(track,{buffer,from:m.from,length:Math.max(FADE*2,m.to-m.from),gain:Math.min(1,m.gain)});}
 catch{}finally{asking.delete(track);}
 if(want===track)playMusic(want);
}
function pass(c:AudioContext,p:Playing,tune:Tune,at:number){
 if(p.over)return;const src=c.createBufferSource(),g=c.createGain();src.buffer=tune.buffer;
 g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(1,at+FADE);g.gain.setValueAtTime(1,at+tune.length-FADE);g.gain.linearRampToValueAtTime(0,at+tune.length);
 src.connect(g).connect(p.out);src.start(at,tune.from,tune.length);p.sources.push(src);if(p.sources.length>3)p.sources.shift();
 const next=nextPassAt(at,tune.length);
 // the next pass is set on the audio clock a little ahead of time, so the overlap is exact even if this timer is late
 p.timer=setTimeout(()=>{const live=audio();if(live&&!p.over)pass(live,p,tune,Math.max(live.currentTime,next));},Math.max(0,(next-c.currentTime-1.5)*1000));
}
function leave(p:Playing,seconds=1.2){
 p.over=true;if(p.timer)clearTimeout(p.timer);const c=audio();
 try{if(c){p.out.gain.cancelScheduledValues(c.currentTime);p.out.gain.setTargetAtTime(0,c.currentTime,seconds/3);}}catch{}
 setTimeout(()=>{for(const s of p.sources){try{s.stop();}catch{}}try{p.out.disconnect();}catch{}},seconds*1000+200);
}
/** Asks for a tune (or none). Safe to call often: it does nothing when that tune is already playing, and waits quietly
 * until a touch has allowed sound or the file has arrived. Sound off or music off always means none. */
export function playMusic(track:Track|null){
 want=track;const wanted=track&&soundOn()&&musicOn()?track:null;
 if(now&&now.track!==wanted){leave(now);now=null;}
 if(!wanted||now)return;const c=audio();if(!c)return;
 const tune=tunes.get(wanted);if(!tune){void load(c,wanted);return;}
 try{const out=c.createGain();out.gain.value=tune.gain;out.connect(c.destination);now={track:wanted,out,sources:[],timer:null,over:false};pass(c,now,tune,c.currentTime+.05);}catch{now=null;}
}
/** Which tune is playing right now, for the switch and the listening page. */
export const musicPlaying=():Track|null=>now?.track??null;
