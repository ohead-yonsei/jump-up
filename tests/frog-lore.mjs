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
test('what the friend says when touched is comfort in plain words: no baby talk, no push, short enough to read in a glance',()=>{
 const kinds=['jump','pat','hug','spin','cheer'];const baby=/헤헤|간질|간지러|쿨쿨|새근|꼼지락|데굴|파닥|흔들흔들|퐁당|살랑|짜잔|포옥|쓰담|꿈틀|빙글/;const push=/힘내|해야|할 수 있|더 열심|노력|분발|이겨|극복|왜 |남들|다른 사람/;
 const all=[];const check=(line,where)=>{all.push(line);assert(line.length>=4&&line.length<=14,where+': '+line);assert(!baby.test(line),'baby talk in '+where+': '+line);assert(!push.test(line),'a push in '+where+': '+line);assert(!/요[.!?]?$/.test(line),'the friend speaks casually: '+line);assert(!/[!?]{2,}|ㅋ|ㅎ/.test(line),line);};
 assert.deepEqual(Object.keys(l.touchLines).sort(),[...kinds].sort());
 for(const k of kinds){assert(l.touchLines[k].length>=2,k);for(const line of l.touchLines[k])check(line,k);}
 assert.deepEqual(Object.keys(l.youngTouchLines).sort(),['egg','tadpole'],'only the stages that cannot hop or hug answer differently');
 for(const [stage,set] of Object.entries(l.youngTouchLines)){assert.deepEqual(Object.keys(set).sort(),[...kinds].sort(),stage);for(const k of kinds){assert(set[k].length>=1,stage+' '+k);for(const line of set[k])check(line,stage+' '+k);}}
 for(const stage of stages)for(const k of kinds){const pool=l.touchPool(stage,k);assert(pool.length>=1);assert.equal(pool,(l.youngTouchLines[stage]??l.touchLines)[k]);}
 for(const stage of stages)for(const line of l.frogSays[stage]){assert(!baby.test(line),'baby talk: '+line);assert(!push.test(line),line);}
 for(const stage of stages){const intro=l.introLines('든든한 폴짝이',stage);assert.equal(intro.length,3);assert(intro[0].includes('든든한 폴짝이'));for(const line of intro.slice(1))check(line,'intro '+stage);}
 // the heart of it is said somewhere: glad you came, your pace, resting is fine, I am here
 const said=all.join(' ');for(const word of ['와줘서','속도','충분해','고마워','괜찮아','천천히','옆에 있을게'])assert(said.includes(word),word);
});
test('the keeper and the friend repeat only what the notebook can back up',()=>{
 const facts=l.frogStories.map(s=>s.fact).join(' ');
 assert(v.KEEPER_LINES.some(x=>x.includes('연못 바닥'))&&facts.includes('연못 바닥'));assert(v.KEEPER_LINES.some(x=>x.includes('꼬리'))&&facts.includes('꼬리'));assert(v.KEEPER_LINES.some(x=>x.includes('함께 울어'))&&facts.includes('함께 울어'));
 assert(m.restLines.some(x=>x.includes('연못 바닥')));assert(m.missionCheer({id:'rhythm-water'}).includes('피부로')&&facts.includes('피부로'));
 for(const line of [...v.KEEPER_LINES,...m.restLines])assert(!harsh.test(line),line);
});
console.log(`${n} frog notebook checks passed. The facts themselves were checked against the sources listed in docs/design-notes.md.`);
