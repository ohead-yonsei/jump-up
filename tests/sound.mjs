import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['sound','croak','music']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"))}
const s=await import(new URL('sound.js',out));const mu=await import(new URL('music.js',out));const list=JSON.parse(await fs.readFile(new URL('../scripts/sounds.json',import.meta.url),'utf8')).sounds;const have=new Set((await fs.readdir(new URL('../public/audio/',import.meta.url))).filter(f=>f.endsWith('.mp3')).map(f=>f.slice(0,-4)));let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
test('every sound has a recipe, and without a device to play on they are silently dropped',()=>{
 assert(s.sfxKinds.length>=14);assert.equal(new Set(s.sfxKinds).size,s.sfxKinds.length);for(const kind of s.sfxKinds)assert.doesNotThrow(()=>s.sfx(kind,{vol:.5,pan:-.3}),kind);
 const water=s.pondAmbience();assert.doesNotThrow(()=>{water.set(1);water.set(0);water.set(null);water.stop();});
});
test('a frog beside you is clear and one across the pond is faint; nothing is heard past the far edge',()=>{
 assert.equal(s.nearness(0),1);assert.equal(s.nearness(520),0);assert.equal(s.nearness(9999),0);assert.equal(s.nearness(-5),1);
 let last=1;for(let d=40;d<=520;d+=40){const v=s.nearness(d);assert(v<last&&v>=0,'falls with distance: '+d);last=v;}
 assert(s.nearness(100)>.6&&s.nearness(400)<.1,'near is much louder than far');assert(s.nearness(300,600)>s.nearness(300,400));
});
test('a call comes from its side of the view, and turning the camera moves it across',()=>{
 assert.equal(s.sideOf(0,0,0),0);assert.equal(s.sideOf(100,0,0),1);assert.equal(s.sideOf(-100,0,0),-1);assert(Math.abs(s.sideOf(0,-100,0))<1e-9,'straight ahead is in the middle');
 // The joystick's "right" is (cos yaw, −sin yaw) in the pond (components/pond-map.tsx); a frog there is fully to the right however the camera is turned.
 for(const yaw of [0,.7,1.57,3.1,-2]){assert(Math.abs(s.sideOf(Math.cos(yaw)*80,-Math.sin(yaw)*80,yaw)-1)<1e-9,'right at yaw '+yaw);assert(Math.abs(s.sideOf(-Math.cos(yaw)*80,Math.sin(yaw)*80,yaw)+1)<1e-9,'left at yaw '+yaw);}
 for(let i=0;i<50;i++){const v=s.sideOf(Math.sin(i)*300,Math.cos(i*1.7)*300,i*.37);assert(v>=-1&&v<=1);}
});
test('a recording is played from its first sound, and turned up or down to the level it was given — but never boosted without limit',()=>{
 const sr=1000;const quiet=new Float32Array(1000);for(let i=300;i<600;i++)quiet[i]=.05*Math.sin(i/3);
 const m=s.measure([quiet],sr,.2);assert(m.from>.28&&m.from<=.3,'starts just before the first sound: '+m.from);assert(m.to>.59&&m.to<=.86,'the tail is left to ring: '+m.to);assert(Math.abs(m.peak-.05)<.002);assert(Math.abs(m.gain-.2/m.peak)<1e-6);
 const loud=new Float32Array(1000).fill(.9);assert(Math.abs(s.measure([loud],sr,.18).gain-.2)<1e-6,'a loud take is turned down');assert.equal(s.measure([loud],sr,.18).from,0);
 const faint=new Float32Array(1000);faint[500]=.004;assert.equal(s.measure([faint],sr,.2).gain,s.MAX_BOOST,'a take that came out too faint is not blown up');
 const silent=s.measure([new Float32Array(1000)],sr,.2);assert.equal(silent.gain,0,'a silent file is not used at all');assert.equal(s.measure([],sr,.2).gain,0);
 const left=new Float32Array(1000),right=new Float32Array(1000);right[200]=.5;assert(s.measure([left,right],sr,.2).from<.2,'either channel counts');
});
test('every sound file the app plays exists and has its words written down; the recipes stay as the fallback',()=>{
 const ids=list.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const x of list){assert(['sfx','music'].includes(x.kind),x.id);assert(x.text.length>20&&!/[가-힣]/.test(x.text),'the words are plain English: '+x.id);assert(x.kind==='music'?x.seconds>=3&&x.seconds<=600:x.seconds>=.5&&x.seconds<=30,x.id);assert(have.has(x.id),'made: '+x.id);}
 const used=[];for(const [kind,entry] of Object.entries(s.sampleFiles)){assert(s.sfxKinds.includes(kind),kind);assert(entry.files.length>=1);assert(entry.level>0&&entry.level<=.3,'small sounds stay small: '+kind);used.push(...entry.files);}
 used.push(s.AMBIENCE_FILE,...Object.values(mu.tracks).map(t=>t.file));
 for(const file of used){assert(ids.includes(file),'in sounds.json: '+file);assert(have.has(file),'in public/audio: '+file);}
 for(const kind of ['tap','pick','spin'])assert(!(kind in s.sampleFiles),'the tiny touch sounds are made on the device: '+kind);
 for(const kind of s.sfxKinds)assert.doesNotThrow(()=>s.sfx(kind,{recipe:true}));assert.equal(s.soundUrl('done'),'/audio/done.mp3');assert.equal(s.samplesReady(),0,'nothing is fetched without a device to play on');
});
test('music is quieter than the small sounds, has its own switch, and loops by overlapping its end with its beginning',()=>{
 assert.deepEqual(Object.keys(mu.tracks).sort(),['pond','village']);for(const t of Object.values(mu.tracks)){assert(t.level>0&&t.level<=.12,t.file);assert(t.name.length>2);}
 assert(Math.max(...Object.values(mu.tracks).map(t=>t.level))<Math.min(...Object.values(s.sampleFiles).map(e=>e.level)),'a tune never covers a sound');
 assert.equal(mu.musicOn(),true);assert.doesNotThrow(()=>{mu.playMusic('pond');mu.playMusic('village');mu.playMusic(null);});assert.equal(mu.musicPlaying(),null,'nothing plays without a device');
 assert.equal(mu.nextPassAt(10,90),10+90-mu.FADE);assert.equal(mu.nextPassAt(0,1),mu.FADE,'a file too short to overlap still moves forward');assert(mu.FADE>=1.5&&mu.FADE<=4);
});
console.log(`${n} sound checks passed. What it actually sounds like is checked by ear on a device.`);
