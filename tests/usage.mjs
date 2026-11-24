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
test('a cohort gets the numbers from every membership, from the joining day on, and a day goes again only when it grew',()=>{
 const info={name:'테스트 기수',org:'폴짝 팀',startsOn:'2026-11-01',endsOn:'2026-12-31'};const token='A'.repeat(43);const joined=new Date(2026,10,22,15,0,0);
 let g=u.addTime(u.addTime({},'today',95,D),'onboarding',40,E);g=u.addAct(u.addOpen(g,'today',E),'frog',E);
 const m=c.startMembership(info,token,'P07',[],[],joined);assert.deepEqual(m.usageSent,{});assert.equal('usage' in m,false,'sending the numbers is not a separate switch');
 assert.deepEqual(c.pendingUsageSync(g,m),{[E]:g[E]},'the day before joining stays on the device; the whole joining day goes');
 const after=c.afterUsageSync(m,{[E]:g[E]},g);assert.deepEqual(after.usageSent,{[E]:u.usageMark(g[E])});assert.deepEqual(c.pendingUsageSync(g,after),{});assert(after.lastSync);
 const grown=u.addTime(g,'chat',30,E);assert.deepEqual(Object.keys(c.pendingUsageSync(grown,after)),[E]);assert.equal(c.pendingUsageSync(grown,after)[E].sec.chat,30);
 const next=u.addOpen(grown,'journal','2026-11-23');assert.deepEqual(Object.keys(c.pendingUsageSync(next,c.afterUsageSync(after,{[E]:grown[E]},grown))),['2026-11-23']);
 assert.deepEqual(c.validMembership(JSON.parse(JSON.stringify(after))),after);assert.deepEqual(c.validMembership({...after,usageSent:{[E]:5,'bad-day':3,'2026-11-23':-1,'2026-11-24':1.5}}).usageSent,{[E]:5});
 // a membership saved by an earlier version has no marks yet: it reads back with none, and then sends like any other
 const {usageSent:_,...older}=m;const read=c.validMembership({...older,usage:true});assert.deepEqual(read.usageSent,{});assert.equal('usage' in read,false);assert.deepEqual(c.pendingUsageSync(g,read),{[E]:g[E]});
 assert.equal(u.usageMark({sec:{today:10,chat:5},open:{today:2},act:{frog:1}}),18);assert.deepEqual(u.pendingUsage({[D]:{sec:{},open:{},act:{}}},{}),{},'an empty day is not sent');
 assert.deepEqual(u.sentUsage({[D]:7,'2026-01-01':3},{[E]:g[E]},g),{[D]:7,[E]:u.usageMark(g[E])},'marks of days no longer on the device are dropped');
});
test('what is sent is read strictly on the server: known days, places and numbers, and no record may take a usage id',()=>{
 const sync=c.validSync({participant:'P07',entries:[{id:'e1',at:'2026-11-21T03:00:00.000Z',type:'step',title:'물 한 모금 마시기',energy:null},{id:'usage-2026-11-21',at:'2026-11-21T03:00:00.000Z',type:'step',title:'가짜',energy:null}],visits:[D],usage:{[D]:{sec:{today:95,moon:9,chat:-1},open:{today:2},act:{frog:1,hack:3},note:'글'},'not-a-day':{sec:{today:5}}}});
 assert.deepEqual(Object.keys(sync).sort(),['entries','participant','usage','visits']);assert.deepEqual(sync.usage,{[D]:{sec:{today:95},open:{today:2},act:{frog:1}}});assert.deepEqual(sync.entries.map(e=>e.id),['e1']);assert(!JSON.stringify(sync).includes('글'));
 assert.deepEqual(c.validSync({participant:'P07',entries:[],visits:[]}).usage,{},'a send without numbers is still a send');assert.deepEqual(c.validSync({participant:'P07',entries:[],visits:[],usage:'x'}).usage,{});
});
test('the operator page adds a cohort up by place: longest first, share of all the time, how many people, and the average for those who were there',()=>{
 const a={usage:u.addOpen(u.addTime(u.addTime({},'today',300,D),'chat',100,E),'today',D)};const b={usage:u.addAct(u.addOpen(u.addTime({},'today',100,D),'notes',D),'frog',D)};const none={usage:{}};const legacy={};
 const d=u.cohortDwell([a,b,none,legacy]);assert.equal(d.seconds,500);assert.equal(d.members,2,'people without numbers are not counted');
 assert.deepEqual(d.rows.map(r=>[r.screen,r.seconds,r.opens,r.members,r.perMember,Math.round(r.share*100)]),[['today',400,1,2,200,80],['chat',100,0,1,100,20],['notes',0,1,1,0,0]]);
 assert.deepEqual(d.actions,[{action:'frog',count:1,members:1}]);
 const empty=u.cohortDwell([none,legacy]);assert.equal(empty.seconds,0);assert.equal(empty.members,0);assert.deepEqual(empty.rows,[]);assert.deepEqual(u.cohortDwell([]).rows,[]);
 const s=c.participantSummary({id:'p',code:'P07',joinedAt:'2026-11-21T00:00:00.000Z',lastSyncAt:null,entries:[],visits:[],usage:a.usage});assert.deepEqual(s.dwell,{seconds:400,most:'today'});
 assert.deepEqual(c.participantSummary({id:'p',code:'P07',joinedAt:'2026-11-21T00:00:00.000Z',lastSyncAt:null,entries:[],visits:[]}).dwell,{seconds:0,most:null});
 const csv=c.cohortCsv([{id:'p',code:'P07',joinedAt:'2026-11-21T00:00:00.000Z',lastSyncAt:null,entries:[],visits:[D],usage:a.usage}]);assert(csv.includes(`"usage-${D}-today"`)&&csv.includes('"대화 연습 중"'),'the cohort CSV carries the rows by day and place');
});
test('a place is the tab, or what is open over it: the first talk, a chat under way, a mission card, the notebook, the help window',()=>{
 assert.equal(u.placeOf({tab:'today'}),'today');assert.equal(u.placeOf({tab:'today',home:'mission'}),'mission');assert.equal(u.placeOf({tab:'today',home:'notes'}),'notes');
 assert.equal(u.placeOf({tab:'journal',home:'mission'}),'journal','what was open on the home does not follow to another tab');
 assert.equal(u.placeOf({tab:'practice',chatting:false}),'practice');assert.equal(u.placeOf({tab:'practice',chatting:true}),'chat');assert.equal(u.placeOf({tab:'places',chatting:true}),'places','a chat left half way is not counted on other tabs');
 assert.equal(u.placeOf({tab:'practice',chatting:true,help:true}),'help');assert.equal(u.placeOf({tab:'today',home:'notes',help:true,onboarding:true}),'onboarding');
 for(const tab of u.tabScreens)assert.equal(u.placeOf({tab}),tab);
 for(const s of u.screens){assert(u.screenLabel[s].length>=2);assert.equal(u.addTime({},s,10,D)[D].sec[s],10);}
 assert.equal(new Set(Object.values(u.screenLabel)).size,u.screens.length,'no two places share a name');
 const g=u.addOpen(u.addTime({},'onboarding',75,D),'chat',D);assert.deepEqual(u.validUsage(JSON.parse(JSON.stringify(g))),g,'the new places survive a save');
 const rows=u.usageRows(g);assert.deepEqual(rows.map(r=>[r[2],r[3],r[4],r[5]]),[['onboarding','연못지기와의 대화',75,0],['chat','대화 연습 중',0,1]]);
});
test('a stretch counts only while it was in view and touched in the last two minutes',()=>{
 const t=1_800_000_000_000;assert.equal(u.stretchSeconds(t,t+30000,t+5000),30);assert.equal(u.stretchSeconds(t,t+1500,t),1.5);
 assert.equal(u.stretchSeconds(0,t,t),0,'not in view');assert.equal(u.stretchSeconds(t,t,t),0);assert.equal(u.stretchSeconds(t,t-10,t),0,'a clock that went back counts nothing');
 assert.equal(u.stretchSeconds(t,t+30000,t+30000-u.IDLE_MS),0,'left untouched for two minutes');assert.equal(u.stretchSeconds(t,t+30000,t+30001-u.IDLE_MS),30);
 // a phone left open: touched once, then half-minute ticks — the first minutes count and the rest do not
 let since=t,counted=0;for(let now=t+30000;now<=t+600000;now+=30000){counted+=u.stretchSeconds(since,now,t);since=now;}assert.equal(counted,90);
});
test('the view reads the same numbers: one day or all, longest first, to the second, and as text to copy',()=>{
 let g=u.addTime(u.addTime(u.addTime({},'today',95,D),'chat',200,D),'today',30,E);g=u.addOpen(u.addOpen(u.addOpen(g,'today',D),'chat',D),'help',E);g=u.addAct(g,'frog',D);
 assert.deepEqual(u.usageOn(g,D),{[D]:g[D]});assert.deepEqual(u.usageOn(g,'2026-01-01'),{});
 assert.deepEqual(u.usageRanked(g).map(r=>[r.screen,r.seconds,r.opens]),[['chat',200,1],['today',125,1],['help',0,1]]);assert.deepEqual(u.usageRanked(u.usageOn(g,E)).map(r=>r.screen),['today','help']);assert.deepEqual(u.usageRanked({}),[]);
 assert.equal(u.clockLabel(0),'0초');assert.equal(u.clockLabel(45.9),'45초');assert.equal(u.clockLabel(60),'1분');assert.equal(u.clockLabel(134),'2분 14초');assert.equal(u.clockLabel(3600),'1시간');assert.equal(u.clockLabel(3905),'1시간 5분');assert.equal(u.clockLabel(-3),'0초');assert.equal(u.clockLabel(NaN),'0초');
 const text=u.usageText(g).split('\n');assert.equal(text[0],`폴짝 머문 시간 · 2일 (${D} ~ ${E})`);assert.equal(text[1],'모두 5분 25초 · 화면을 연 횟수 3번');assert.equal(text[2],'- 대화 연습 중: 3분 20초 · 1번');assert.equal(text[3],'- 연못(홈): 2분 5초 · 1번');assert.equal(text[5],'누른 것: 친구 만지기 1번');
 assert.equal(u.usageText(u.usageOn(g,E)).split('\n')[0],`폴짝 머문 시간 · 1일 (${E})`);assert(u.usageText({}).includes('아직'));
 assert(!/\d{2}:\d{2}/.test(u.usageText(g)),'no time of day in what is copied');
});
console.log(`${n} usage checks passed. The timer itself (screens, background, sleep) is checked in the browser.`);
