import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['usage','records','cohort']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"))}
const u=await import(new URL('usage.js',out));const r=await import(new URL('records.js',out));const c=await import(new URL('cohort.js',out));let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name)};
const D='2026-11-21',E='2026-11-22';
test('time on a screen adds up by day in whole seconds, and one stretch never counts more than ten minutes',()=>{
 let g=u.addTime({},'today',42.9,D);g=u.addTime(g,'today',18,D);g=u.addTime(g,'practice',90,D);g=u.addTime(g,'today',5,E);
 assert.deepEqual(g[D].sec,{today:60,practice:90});assert.deepEqual(g[E].sec,{today:5});
 assert.equal(u.addTime({},'today',99999,D)[D].sec.today,u.MAX_STRETCH_SEC);assert.deepEqual(u.addTime({},'today',0,D),{});assert.deepEqual(u.addTime({},'today',-5,D),{});assert.deepEqual(u.addTime({},'today',NaN,D),{});assert.deepEqual(u.addTime({},'today',30,'yesterday'),{});
 const same={};assert.equal(u.addTime(same,'today',.4,D),same,'less than a second changes nothing');
});
test('opens and presses are counted, and adding never changes what was passed in',()=>{
 const a=u.addOpen({},'closet',D);const b=u.addOpen(a,'closet',D);const d=u.addAct(u.addAct(b,'frog',D),'frog',D);
 assert.deepEqual(a[D].open,{closet:1});assert.deepEqual(b[D].open,{closet:2});assert.deepEqual(d[D].act,{frog:2});assert.deepEqual(a[D].act,{});
 let many={};for(let i=0;i<200;i++){const day=new Date(2026,0,1+i);many=u.addOpen(many,'today',`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`);}
 assert.equal(Object.keys(many).length,u.MAX_USE_DAYS);assert(!('2026-01-01' in many),'the oldest days roll off');
});
test('saved usage is read back strictly: known days, screens and actions, whole positive numbers',()=>{
 const g=u.addAct(u.addOpen(u.addTime({},'pond',120,D),'pond',D),'notes',D);assert.deepEqual(u.validUsage(JSON.parse(JSON.stringify(g))),g);
 assert.deepEqual(u.validUsage(null),{});assert.deepEqual(u.validUsage([1,2]),{});assert.deepEqual(u.validUsage('x'),{});
 const dirty={[D]:{sec:{today:30,moon:99,practice:-4,closet:1.5,journal:'9',pond:999999},open:{today:2,hacker:1},act:{frog:3,delete:1},note:'text'},'not-a-day':{sec:{today:5}},'2026-13-45':{sec:{today:5}},[E]:{sec:{},open:{},act:{}},'2026-11-23':'oops'};
 assert.deepEqual(u.validUsage(dirty),{[D]:{sec:{today:30},open:{today:2},act:{frog:3}}});
 assert(!JSON.stringify(u.validUsage(dirty)).includes('text'),'no free text survives');
});
test('totals say how long, how often and where most of the time went',()=>{
 let g=u.addTime(u.addTime({},'today',300,D),'practice',420,D);g=u.addTime(g,'today',200,E);g=u.addOpen(u.addOpen(g,'today',D),'practice',E);g=u.addAct(g,'mission',E);
 const t=u.usageTotals(g);assert.equal(t.seconds,920);assert.equal(t.opens,2);assert.equal(t.days,2);assert.equal(t.most,'today');assert.equal(t.screens.find(s=>s.screen==='practice').seconds,420);assert.equal(t.actions.find(a=>a.action==='mission').count,1);
 assert.equal(u.usageTotals({}).most,null);assert.equal(u.usageTotals({}).seconds,0);
 assert.equal(u.spentLabel(0),'0분');assert.equal(u.spentLabel(40),'1분 미만');assert.equal(u.spentLabel(920),'15분');assert.equal(u.spentLabel(3600),'1시간');assert.equal(u.spentLabel(3900),'1시간 5분');
 for(const s of u.screens)assert(u.screenLabel[s].length>=2);for(const a of u.actions)assert(u.actionLabel[a].length>=4);
});
test('the export gets a row per day and screen or action at the end, totals on the summary row, and the same columns in every row',()=>{
 const entry={id:'e1',at:'2026-11-21T03:00:00.000Z',type:'step',title:'물 한 모금 마시기',energy:null,energyLevel:2};
 let g=u.addTime(u.addOpen({},'today',D),'today',95,D);g=u.addAct(g,'frog',D);
 const rows=r.recordRows([entry],'P07',[D],r.localDay,g);const head=r.recordsHeader;assert(rows.every(row=>row.length===head.length));
 const col=name=>head.indexOf(name);const summary=rows[0];assert.equal(summary[col('screen')],'today');assert.equal(summary[col('seconds')],95);assert.equal(summary[col('opens')],1);
 const use=rows.find(row=>row[3]==='usage');assert.deepEqual([use[0],use[1],use[2],use[4],use[col('screen')],use[col('seconds')],use[col('opens')]],['P07',`usage-${D}-today`,D,'연못(홈)','today',95,1]);
 const act=rows.find(row=>row[3]==='action');assert.deepEqual([act[1],act[4],act[col('screen')],act[col('seconds')],act[col('opens')]],[`action-${D}-frog`,'친구 만지기','frog','',1]);
 const none=r.recordRows([entry],'P07',[D]);assert.equal(none.length,3);assert.deepEqual(none[0].slice(-3),['','','']);
 const csv=r.recordsCsv([entry],'P07',[D],g);assert(csv.includes('"usage"')&&csv.includes('"친구 만지기"'));
});
test('usage is not part of what a cohort is sent: a sync carries records and visit days only',()=>{
 const sync=c.validSync({participant:'P07',entries:[{id:'e1',at:'2026-11-21T03:00:00.000Z',type:'step',title:'물 한 모금 마시기',energy:null}],visits:[D],usage:{[D]:{sec:{today:95}}}});
 assert.deepEqual(Object.keys(sync).sort(),['entries','participant','visits']);assert(!JSON.stringify(sync).includes('sec'));
});
console.log(`${n} usage checks passed. The timer itself (screens, background, sleep) is checked in the browser.`);
