import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['answers','journey','records']){
 const src=await fs.readFile(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');
 await fs.writeFile(new URL(`${name}.js`,out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);
}
const a=await import(new URL('answers.js',out));const j=await import(new URL('journey.js',out));const r=await import(new URL('records.js',out));let n=0;
const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
test('every answer field belongs to a real mission, and the two missions that started this have one',()=>{
 const ids=new Set(j.springMissions.map(m=>m.id));for(const id of Object.keys(a.answerFields))assert(ids.has(id),id);
 assert.equal(a.answerField('connect-word').kind,'word');assert.equal(a.answerField('connect-emoji').kind,'emoji');assert.equal(a.answerField('rhythm-water'),null);
});
test('an empty or blank answer is no answer, so finishing without one records nothing extra',()=>{
 for(const kind of ['word','line'])for(const text of ['','   ','\n\t'])assert.equal(a.cleanAnswer(kind,text),undefined);
 assert.equal(a.cleanAnswer('emoji',''),undefined);
});
test('answers are tidied and cut to length by whole characters',()=>{
 assert.equal(a.cleanAnswer('word','  잔잔한\n 마음 '),'잔잔한 마음');
 assert.equal([...a.cleanAnswer('word','가'.repeat(40))].length,a.ANSWER_MAX.word);
 assert.equal([...a.cleanAnswer('line','🌱'.repeat(300))].length,a.ANSWER_MAX.line);
 assert.equal(a.cleanAnswer('word','가나다라마바사아자차카 타'),'가나다라마바사아자차카');
});
test('an emoji answer must be one from the list, and each has a name for screen readers',()=>{
 assert.equal(a.cleanAnswer('emoji','😊'),'😊');assert.equal(a.cleanAnswer('emoji','💩'),undefined);assert.equal(a.cleanAnswer('emoji','😊😊'),undefined);
 assert.equal(new Set(a.answerEmojis.map(e=>e.emoji)).size,a.answerEmojis.length);assert(a.answerEmojis.every(e=>e.name.length>1));
});
test('whatever cleanAnswer keeps, the saved records accept',()=>{
 assert.equal(a.ANSWER_MAX.line,r.MAX_ANSWER);
 const entry={id:'t',at:'2026-11-10T12:00:00.000Z',type:'step',title:'지금 마음을 한 단어로',energy:null,energyLevel:2};
 for(const answer of [a.cleanAnswer('line','🌱'.repeat(300)),a.cleanAnswer('word','잔잔함'),a.cleanAnswer('emoji','🌱')])assert.equal(r.validEntries([{...entry,answer}]).length,1);
});
console.log(`${n} mission answer checks passed.`);
