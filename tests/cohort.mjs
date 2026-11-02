import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['records','request-origin','cohort','cohort-server','cohort-store']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"));}
const c=await import(new URL('cohort.js',out));const srv=await import(new URL('cohort-server.js',out));const st=await import(new URL('cohort-store.js',out));
let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS '+name)};
const token='A'.repeat(43);const step=(id,at,extra={})=>({id,at,type:'step',title:'창밖 보기',energy:2,...extra});
await test('codes avoid look-alike characters and survive spaces, dashes and lower case',()=>{
 for(let i=0;i<200;i++){const j=srv.newJoinCode(),o=srv.newOperatorCode();assert(c.validJoinCode(j),j);assert(c.validOperatorCode(o),o);assert(!/[01OIL]/.test(j+o));}
 assert.equal(c.normalizeCode(' 7k3q-pw2m '),'7K3QPW2M');assert(c.validJoinCode('7K3QPW2M'));assert(!c.validJoinCode('7K3QPW2'));assert(!c.validJoinCode('OO0OIIII'));
 assert.equal(c.formatCode('7K3QPW2M'),'7K3Q-PW2M');assert.equal(c.formatCode('ABCDEFGHJKMN'),'ABCD-EFGH-JKMN');assert.match(srv.newToken(),/^[A-Za-z0-9_-]{43}$/);
});
await test('operator sessions are signed, expire and cannot be widened to admin',()=>{
 const key='a-long-admin-key-123';const now=Date.parse('2026-11-02T00:00:00Z');const op=srv.signSession({role:'operator',cohortId:'c1'},key,now);
 assert.deepEqual(srv.readSession(op,key,now+1000),{role:'operator',cohortId:'c1'});assert.equal(srv.readSession(op,'another-long-key-456',now),null);
 assert.equal(srv.readSession(op,key,now+srv.OPS_SESSION_SECONDS*1000+1),null);
 const forged=Buffer.from(JSON.stringify({role:'admin',exp:now+9e9})).toString('base64url');assert.equal(srv.readSession(forged+'.'+op.split('.')[1],key,now),null);
 for(const bad of [undefined,'','x.y.z','nodot'])assert.equal(srv.readSession(bad,key,now),null);
 assert(srv.canSee({role:'admin'},'any'));assert(srv.canSee({role:'operator',cohortId:'c1'},'c1'));assert(!srv.canSee({role:'operator',cohortId:'c1'},'c2'));
 assert.equal(srv.opsKey({OPS_ADMIN_KEY:'short'}),null);assert.equal(srv.opsKey({OPS_ADMIN_KEY:' a-long-admin-key-123 '}),key);assert.equal(srv.opsKey({}),null);
 assert(srv.sameSecret(key,key));assert(!srv.sameSecret(key,key+'x'));
 assert.equal(srv.bearer(new Request('http://x',{headers:{authorization:'Bearer '+token}})),token);assert.equal(srv.bearer(new Request('http://x',{headers:{authorization:'Bearer short'}})),null);
});
await test('a cohort needs a name and a period, and its stage follows the Korean calendar',()=>{
 assert.deepEqual(c.validCohortInput({name:' 1기 ',org:'니트컴퍼니',startsOn:'2026-11-03',endsOn:'2026-12-02',extra:1}),{name:'1기',org:'니트컴퍼니',startsOn:'2026-11-03',endsOn:'2026-12-02'});
 for(const bad of [{name:'',startsOn:'2026-11-03',endsOn:'2026-12-02'},{name:'1기',startsOn:'2026-12-03',endsOn:'2026-12-02'},{name:'1기',startsOn:'11/3',endsOn:'2026-12-02'},{name:'가'.repeat(41),startsOn:'2026-11-03',endsOn:'2026-12-02'},null])assert.equal(c.validCohortInput(bad),null);
 const cohort={name:'1기',org:'',startsOn:'2026-11-03',endsOn:'2026-12-02'};
 assert.equal(c.cohortStage(cohort,'2026-11-02'),'시작 전');assert.equal(c.cohortStage(cohort,'2026-12-02'),'진행 중');assert.equal(c.cohortStage(cohort,'2026-12-03'),'마침');assert(c.cohortEnded(cohort,'2026-12-03'));
 assert.equal(c.seoulDay(new Date('2026-11-02T16:30:00Z')),'2026-11-03');
});
await test('a device sends only what it recorded after joining, and each record once',()=>{
 const m=c.validMembership({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',token,joinedAt:'2026-11-02T03:00:00.000Z',syncedThrough:'2026-11-02T03:00:00.000Z',visitsThrough:'',code:'P07',lastSync:''});assert(m);
 const entries=[step('before','2026-11-01T10:00:00.000Z'),step('n1','2026-11-02T04:00:00.000Z'),step('n2','2026-11-02T05:00:00.000Z')];const visits=['2026-10-30','2026-12-25'];
 let p=c.pendingSync(entries,visits,m);assert.deepEqual(p.entries.map(e=>e.id),['n1','n2']);assert.deepEqual(p.visits,['2026-12-25']);
 p=c.pendingSync(entries,visits,{...m,syncedThrough:'2026-11-02T05:00:00.000Z',visitsThrough:'2026-12-25'});assert.equal(p.entries.length+p.visits.length,0);
 for(const bad of [{...m,token:'short'},{...m,joinedAt:'yesterday'},{...m,name:''},null])assert.equal(c.validMembership(bad),null);
 const loose=c.validMembership({...m,code:'has space',lastSync:'never',visitsThrough:'soon'});assert.equal(loose.code,'');assert.equal(loose.lastSync,'');assert.equal(loose.visitsThrough,'');
});
await test('what a device sends is capped and invalid records are dropped',()=>{
 const ok=c.validSync({participant:'P07',entries:[step('a','2026-11-02T04:00:00.000Z'),step('b','not a date')],visits:['2026-11-02','bad']});
 assert.equal(ok.participant,'P07');assert.deepEqual(ok.entries.map(e=>e.id),['a']);assert.deepEqual(ok.visits,['2026-11-02']);
 assert.equal(c.validSync({participant:'<b>',entries:[],visits:[]}).participant,'');
 for(const bad of [{entries:Array(501).fill({}),visits:[]},{entries:'x',visits:[]},{entries:[],visits:Array(731).fill('2026-11-02')},null])assert.equal(c.validSync(bad),null);
});
await test('a cohort keeps each record once, counts Korean days and forgets people who leave',async()=>{
 const store=st.memoryStore();const operatorHash=srv.sha256('ABCDEFGHJKMN');
 const cohort=await store.createCohort({name:'1기',org:'기관',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash});assert.equal('operatorHash' in cohort,false);
 await assert.rejects(()=>store.createCohort({name:'2기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:'other'}),st.DuplicateCode);
 assert.equal((await store.cohortByOperatorHash(operatorHash)).id,cohort.id);assert.equal((await store.cohortByJoinCode('7K3QPW2M')).id,cohort.id);
 const a=await store.addParticipant({cohortId:cohort.id,code:'P01',tokenHash:srv.sha256(token)});await store.addParticipant({cohortId:cohort.id,code:'P02',tokenHash:srv.sha256('B'.repeat(43))});
 assert.equal((await store.participantByToken(srv.sha256(token))).participant.id,a.id);assert.equal('tokenHash' in a,false);assert.equal(await store.participantByToken('nope'),null);
 const entries=[step('e1','2026-11-02T16:30:00.000Z'),{id:'e2',at:'2026-11-03T01:00:00.000Z',type:'checkin',title:'마음 살펴보기',energy:null,calm:2,talk:1,outside:1},{id:'e3',at:'2026-11-03T02:00:00.000Z',type:'feedback',title:'폴짝에게 한마디',energy:null,note:'=좋아요'}];
 await store.saveRecords(a.id,'P01',entries,['2026-11-03']);await store.saveRecords(a.id,'',[{...entries[0],title:'바뀐 제목'}],['2026-11-03']);
 const [first,second]=await store.cohortRecords(cohort.id);
 assert.equal(first.entries.length,3);assert.equal(first.entries[0].title,'창밖 보기');assert.deepEqual(first.visits,['2026-11-03']);assert.equal(first.code,'P01');assert(first.lastSyncAt);assert.equal(second.entries.length,0);
 const s=c.participantSummary(first,new Date('2026-11-04T00:00:00Z'));
 assert.equal(s.firstDay,'2026-11-03');assert.equal(s.visitDays,1);assert.equal(s.activeDays,1);assert.equal(s.recentActiveDays,1);assert.equal(s.firstCheckin.calm,2);assert.equal(s.lastCheckin,null);assert.equal(s.notes,1);
 const csv=c.cohortCsv([first,second]);const lines=csv.split('\r\n');
 assert.equal(lines.filter(l=>l.includes('participant_code')).length,1);assert(lines.some(l=>l.startsWith('"P02","summary"')));assert(csv.includes(`"'=좋아요"`));
 assert.equal((await store.listCohorts())[0].participants,2);
 await store.removeParticipant(a.id);assert.equal(await store.participantByToken(srv.sha256(token)),null);assert.equal((await store.cohortRecords(cohort.id)).length,1);
});
await test('Supabase calls use the server key, never read hashes back, add without overwriting and page through records',async()=>{
 const pid='22222222-2222-4222-8222-222222222222',cid='11111111-1111-4111-8111-111111111111';const calls=[];
 const fake=async(url,init)=>{calls.push({url,init});const u=new URL(url);const path=u.pathname.split('/').at(-1);
  if(init.method==='GET'&&path==='participants')return Response.json([{id:pid,cohort_id:cid,code:'P01',joined_at:'2026-11-02T00:00:00Z',last_sync_at:null}]);
  if(init.method==='GET'&&path==='entries')return Response.json(u.searchParams.get('offset')==='0'?Array.from({length:1000},(_,i)=>({participant_id:pid,data:step('e'+i,'2026-11-02T04:00:00.000Z')})):[{participant_id:pid,data:step('last','2026-11-03T04:00:00.000Z')}]);
  if(init.method==='GET'&&path==='visits')return Response.json([{participant_id:pid,day:'2026-11-02'}]);
  if(init.method==='GET')return Response.json([]);
  if(init.method==='POST'&&path==='cohorts')return Response.json({code:'23505'},{status:409});
  return new Response(null,{status:init.method==='POST'?201:204});};
 const store=st.supabaseStore('https://example.supabase.co/','sb_secret_test',fake);
 await store.saveRecords(pid,'P01',[step('e1','2026-11-02T04:00:00.000Z')],['2026-11-02']);
 const [entries,visits,patch]=calls;const entriesUrl=new URL(entries.url);
 assert.equal(entriesUrl.pathname,'/rest/v1/entries');assert.equal(entriesUrl.searchParams.get('on_conflict'),'participant_id,id');assert.match(entries.init.headers.Prefer,/resolution=ignore-duplicates/);
 assert.equal(entries.init.headers.apikey,'sb_secret_test');assert.equal(entries.init.headers.Authorization,undefined);
 assert.deepEqual(JSON.parse(entries.init.body)[0],{participant_id:pid,id:'e1',at:'2026-11-02T04:00:00.000Z',type:'step',data:step('e1','2026-11-02T04:00:00.000Z')});
 assert.equal(visits.init.method,'POST');assert.equal(patch.init.method,'PATCH');assert.equal(JSON.parse(patch.init.body).code,'P01');
 const people=await store.cohortRecords(cid);assert.equal(people[0].entries.length,1001);assert.equal(people[0].entries.at(-1).id,'last');assert.deepEqual(people[0].visits,['2026-11-02']);
 await assert.rejects(()=>store.createCohort({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:'h'}),st.DuplicateCode);
 assert.equal(await store.cohort('not-a-uuid'),null);assert.deepEqual(await store.cohortRecords('not-a-uuid'),[]);
 assert(calls.every(c=>!/select=[^&]*(operator_hash|token_hash)/.test(decodeURIComponent(c.url))));
 const legacy=[];await st.supabaseStore('https://example.supabase.co','eyJhbGciOi.legacy',async(url,init)=>{legacy.push(init);return Response.json([])}).cohortByJoinCode('7K3QPW2M');assert.equal(legacy[0].headers.Authorization,'Bearer eyJhbGciOi.legacy');
 assert.equal(await st.storeFromEnv({NODE_ENV:'production'}),null);assert.equal(await st.storeFromEnv({NODE_ENV:'production',SUPABASE_URL:'http://insecure.example',SUPABASE_SECRET_KEY:'k'}),null);
 assert.equal((await st.storeFromEnv({NODE_ENV:'production',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'k'})).kind,'supabase');
});
console.log(`${passed} cohort checks passed. Live Supabase and the operator pages are checked by hand (README).`);
