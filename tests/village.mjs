import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['village-map']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
const m=await import(new URL('village-map.js',out));
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name)};
const inside=p=>m.inVillage(p);
const ids=Array.from({length:60},(_,i)=>`0000${i}-aaaa-bbbb-cccc-${i*7919}`);

test('steering keeps the frog in the village and diagonals are no faster than straight lines',()=>{
 let p={x:360,y:430};for(let i=0;i<2000;i++)p=m.step(p,{x:1,y:1},.05);assert.ok(inside(p));const edge=m.step(p,{x:1,y:1},.05);assert.ok(inside(edge)&&Math.hypot(edge.x-p.x,edge.y-p.y)<1,'it stops at the edge of the village');
 const a=m.step({x:300,y:300},{x:1,y:0},1),b=m.step({x:300,y:300},{x:1,y:1},1);
 assert.ok(Math.abs(Math.hypot(a.x-300,a.y-300)-m.SPEED)<1e-6);assert.ok(Math.abs(Math.hypot(b.x-300,b.y-300)-m.SPEED)<1e-6);
 assert.deepEqual(m.step({x:300,y:300},{x:0,y:0},1),{x:300,y:300});
 const half=m.step({x:300,y:300},{x:.5,y:0},1);assert.ok(Math.abs(half.x-300-m.SPEED/2)<1e-6,'a gentle push walks slower');
});
test('walking to a tapped place arrives and stops exactly there',()=>{
 let p={x:100,y:100};const to={x:400,y:500};let n=0;while((p.x!==to.x||p.y!==to.y)&&n++<1000)p=m.approach(p,to,.05);
 assert.deepEqual(p,to);assert.ok(n<200);
});
test('the village is a pond with grass around it, and anything outside is brought back in',()=>{
 assert.ok(m.inPond({x:m.POND.cx,y:m.POND.cy}));assert.ok(!m.inPond({x:m.POND.cx+m.POND.rx+20,y:m.POND.cy}),'past the shore is grass');assert.ok(m.inVillage({x:m.POND.cx+m.POND.rx+20,y:m.POND.cy}));
 assert.ok(!m.inVillage({x:0,y:-300}));assert.ok(m.inVillage(m.KEEPER.spot)&&!m.inPond(m.KEEPER.spot),'the keeper sits on the grass by the water');
 for(const p of [{x:-900,y:0},{x:9999,y:440},{x:360,y:-900},{x:-400,y:1900}])assert.ok(m.inVillage(m.clampToVillage(p)));
 assert.deepEqual(m.clampToVillage({x:300,y:400}),{x:300,y:400});
});
test('a strolling frog is in the same place for everyone, stays on the map and never jumps',()=>{
 const t0=1_800_000_000_000;
 for(const id of ids.slice(0,20)){
  assert.deepEqual(m.strollAt(id,t0+1234),m.strollAt(id,t0+1234));
  let prev=m.strollAt(id,t0);
  for(let t=t0+100;t<t0+80_000;t+=100){const p=m.strollAt(id,t);assert.ok(inside(p),'on the map');assert.ok(Math.hypot(p.x-prev.x,p.y-prev.y)<m.SPEED*.1*1.25,'slower than a steered frog can catch up with');prev=p;}
 }
 const a=m.strollAt(ids[0],t0),b=m.strollAt(ids[1],t0);assert.ok(a.x!==b.x||a.y!==b.y,'different frogs keep to different corners');
 let rests=0;for(let t=t0;t<t0+64_000;t+=500)if(!m.strollAt(ids[3],t).moving)rests++;assert.ok(rests>40,'most of the time it rests');
 const still=m.strollAt(ids[3],t0,true);assert.equal(still.moving,false);
});
test('pads float on the water, spread out, in the same spots every time',()=>{
 const spots=ids.slice(0,24).map((id,i)=>m.padSpot(id,i));
 for(const s of spots)assert.ok(m.inPond(s),'pads float on the water');
 assert.deepEqual(m.padSpot(ids[5],5),spots[5]);
 let close=0;for(let i=0;i<spots.length;i++)for(let j=i+1;j<spots.length;j++)if(Math.hypot(spots[i].x-spots[j].x,spots[i].y-spots[j].y)<30)close++;
 assert.ok(close<=2,'few pads sit on top of each other: '+close);
});
test('when the pond is crowded, frogs moving right now come first, nearest first, and the rest fill in a steady order',()=>{
 const me={x:100,y:100};const live=[{id:'far',x:600,y:800},{id:'near',x:120,y:110},{id:'mid',x:300,y:300}];
 const shown=m.pickShown(me,live,[...ids.slice(0,30),'near','far','mid'],12);
 assert.equal(shown.length,12);assert.deepEqual(shown.slice(0,3),['near','mid','far']);assert.equal(new Set(shown).size,12);
 assert.deepEqual(m.pickShown({x:700,y:800},[],ids.slice(0,30),12),m.pickShown(me,[],[...ids.slice(0,30)].reverse(),12),'the fill does not depend on where I stand or the list order');
 assert.deepEqual(m.pickShown(me,[],['a','b'],12).sort(),['a','b']);
 const crowd=Array.from({length:20},(_,i)=>({id:'L'+i,x:100+i*20,y:100}));assert.deepEqual(m.pickShown(me,crowd,ids,12),crowd.slice(0,12).map(c=>c.id),'more movers than fit: only the nearest');
});
test('a move from another device is checked: an id and a place on the map, nothing else',()=>{
 assert.deepEqual(m.cleanMove({id:'b9bd4a20-6ae9-4989-88f9-48047902ba8b',x:300,y:400,name:'x'}),{id:'b9bd4a20-6ae9-4989-88f9-48047902ba8b',x:300,y:400});
 const far=m.cleanMove({id:'a',x:99999,y:-5});assert.ok(inside(far));
 for(const bad of [null,{},{id:'a'},{id:'a',x:'1',y:2},{id:'a',x:NaN,y:2},{id:'a',x:Infinity,y:2},{id:'<b>',x:1,y:2},{id:'a'.repeat(65),x:1,y:2},{id:5,x:1,y:2}])assert.equal(m.cleanMove(bad),null);
});
test('the keeper says one line a day, the same for everyone, and the lines keep to the tone rules',()=>{
 assert.equal(m.keeperLine('2026-11-11'),m.keeperLine('2026-11-11'));assert.ok(m.KEEPER_LINES.includes(m.keeperLine('2026-11-12')));
 const seen=new Set();for(let d=1;d<=28;d++)seen.add(m.keeperLine('2026-11-'+String(d).padStart(2,'0')));assert.ok(seen.size>=4);
 for(const line of m.KEEPER_LINES)assert.ok(!/해야|왜 안|더 열심히|실패|점수|순위|연속/.test(line),line);
});
console.log(passed+' village map checks passed.');
