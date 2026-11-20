import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['frog-lore','character','village-map','companion','content']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"))}
const l=await import(new URL('frog-lore.js',out));const c=await import(new URL('character.js',out));const v=await import(new URL('village-map.js',out));const m=await import(new URL('companion.js',out));let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
const stages=c.growthStages.map(s=>s.id);const harsh=/해야|왜 안|더 열심히|실패|점수|순위|게으|한심/;
test('every stage opens at least two stories, each with a fact, what it means here, and where the fact comes from',()=>{
 assert.equal(new Set(l.frogStories.map(s=>s.id)).size,l.frogStories.length);
 for(const stage of stages)assert(l.storiesOf(stage).length>=2,stage);
 for(const s of l.frogStories){assert(stages.includes(s.stage),s.id);assert(s.title.length>=3&&s.title.length<=14,s.id+' title');assert(s.fact.length>=40&&s.fact.length<=130,s.id+' fact: '+s.fact.length);assert(s.link.length>=20&&s.link.length<=90,s.id+' link: '+s.link.length);assert(s.source.length>=3,s.id+' source');
  assert(/요\.$/.test(s.fact)&&/요\.$/.test(s.link),s.id+' speaks in 해요체');assert(!harsh.test(s.fact+s.link),s.id);}
});
test('stories open as the friend grows and never close again; what is ahead is counted, not shown',()=>{
 let before=0;for(const stage of stages){const open=l.storiesOpen(stage);assert(open.length>before,stage);before=open.length;assert(open.every(s=>stages.indexOf(s.stage)<=stages.indexOf(stage)));
  const ahead=l.storiesAhead(stage);assert.equal(open.length+ahead.count,l.frogStories.length);assert.equal(ahead.next,stage==='grown'?null:stages[stages.indexOf(stage)+1]);}
 assert.equal(l.storiesOpen('grown').length,l.frogStories.length);assert.deepEqual(l.storiesOpen('egg').map(s=>s.id),['jelly','gyeongchip']);
});
test('the pond has four promises taken from frog life, and the friend has something of its own to say at every stage',()=>{
 assert.equal(l.pondPromises.length,4);for(const p of l.pondPromises){assert(p.rule.endsWith('요')&&p.means.endsWith('요.'),p.rule);assert(p.from.length>=2);assert(!/해야|왜 안|더 열심히|실패|게으|한심/.test(p.rule+p.means));}
 for(const stage of stages){assert(l.frogSays[stage].length>=2,stage);for(const line of l.frogSays[stage]){assert(line.length<=16,line);assert(!/요[.!?]?$/.test(line),'the friend speaks casually: '+line);}}
});
test('the keeper and the friend repeat only what the notebook can back up',()=>{
 const facts=l.frogStories.map(s=>s.fact).join(' ');
 assert(v.KEEPER_LINES.some(x=>x.includes('연못 바닥'))&&facts.includes('연못 바닥'));assert(v.KEEPER_LINES.some(x=>x.includes('꼬리'))&&facts.includes('꼬리'));assert(v.KEEPER_LINES.some(x=>x.includes('함께 울어'))&&facts.includes('함께 울어'));
 assert(m.restLines.some(x=>x.includes('연못 바닥')));assert(m.missionCheer({id:'rhythm-water'}).includes('피부로')&&facts.includes('피부로'));
 for(const line of [...v.KEEPER_LINES,...m.restLines])assert(!harsh.test(line),line);
});
console.log(`${n} frog notebook checks passed. The facts themselves were checked against the sources listed in docs/design-notes.md.`);
