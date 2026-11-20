import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['sound','croak']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"))}
const s=await import(new URL('sound.js',out));let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
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
console.log(`${n} sound checks passed. What it actually sounds like is checked by ear on a device.`);
