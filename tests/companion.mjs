import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['companion','journey','content']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/(\w+)'/g,"from './$1.js'"))}
const m=await import(new URL('companion.js',out));const j=await import(new URL('journey.js',out));let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
test('every mission, rest-rhythm and bedtime mission has its own warm line',()=>{for(const mission of [...j.springMissions,...j.waveMissions,...m.nightMissions]){const line=m.missionCheer(mission);assert(line.length>8,mission.id);assert(!/해야|왜 안|더 열심히|실패/.test(line),mission.id)}assert(m.missionCheer(null,0).length>0)});
test('mood overlay only fills empty slots and adds bedtime things at night',()=>{const worn={head:'crown',face:'wink'};const low=m.moodFor(1,worn);assert.equal(low.equipped.head,'crown');assert.equal(low.equipped.face,'wink');assert.equal(low.equipped.outfit,'blanket');assert(low.line.includes('쉬자'));const night=m.moodFor(1,{},true);assert.equal(night.equipped.head,'nightcap');assert.equal(night.equipped.face,'sleepy');assert.equal(night.equipped.outfit,'blanket');assert.deepEqual(m.moodFor(null,{}).equipped,{})});
test('greetings and bedtime care follow the clock without judging late nights',()=>{const at=h=>new Date(2026,9,27,h,10);assert(m.isNight(at(23)));assert(m.isNight(at(3)));assert(!m.isNight(at(9)));assert.equal(m.greeting(at(2)).title,'늦은 밤이네,');assert.equal(m.greeting(at(8)).title,'좋은 아침이야,');assert.equal(m.nightMissions.length,3)});
console.log(`${n} companion checks passed.`);
