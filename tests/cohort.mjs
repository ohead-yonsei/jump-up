import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['records','request-origin','cohort','cohort-server','pond','cohort-store']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"));}
const j=await import(new URL('records.js',out));const c=await import(new URL('cohort.js',out));const srv=await import(new URL('cohort-server.js',out));const st=await import(new URL('cohort-store.js',out));
let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS '+name)};
const token='A'.repeat(43);const step=(id,at,extra={})=>({id,at,type:'step',title:'창밖 보기',energy:2,...extra});
await test('codes avoid look-alike characters and survive spaces, dashes and lower case',()=>{
 for(let i=0;i<200;i++){const j=srv.newJoinCode(),o=srv.newOperatorCode();assert(c.validJoinCode(j),j);assert(c.validOperatorCode(o),o);assert(!/[01OIL]/.test(j+o));}
 assert.equal(c.normalizeCode(' 7k3q-pw2m '),'7K3QPW2M');assert(c.validJoinCode('7K3QPW2M'));assert(!c.validJoinCode('7K3QPW2'));assert(!c.validJoinCode('OO0OIIII'));
 assert.equal(c.formatCode('7K3QPW2M'),'7K3Q-PW2M');assert.equal(c.formatCode('ABCDEFGHJKMN'),'ABCD-EFGH-JKMN');assert.match(srv.newToken(),/^[A-Za-z0-9_-]{43}$/);
});
await test('operator sessions are signed, expire, cannot be widened to admin and end when the code is replaced',async()=>{
 const key='a-long-admin-key-123';const now=Date.parse('2026-11-02T00:00:00Z');const hash=srv.sha256('ABCDEFGHJKMN');const op=srv.signSession({role:'operator',cohortId:'c1',op:hash},key,now);
 assert.deepEqual(srv.readSession(op,key,now+1000),{role:'operator',cohortId:'c1',op:hash});assert.equal(srv.readSession(srv.signSession({role:'operator',cohortId:'c1'},key,now),key,now),null);assert.equal(srv.readSession(op,'another-long-key-456',now),null);
 assert.equal(srv.readSession(op,key,now+srv.OPS_SESSION_SECONDS*1000+1),null);
 const forged=Buffer.from(JSON.stringify({role:'admin',exp:now+9e9})).toString('base64url');assert.equal(srv.readSession(forged+'.'+op.split('.')[1],key,now),null);
 for(const bad of [undefined,'','x.y.z','nodot'])assert.equal(srv.readSession(bad,key,now),null);
 assert(srv.canSee({role:'admin'},'any'));assert(srv.canSee({role:'operator',cohortId:'c1',op:hash},'c1'));assert(!srv.canSee({role:'operator',cohortId:'c1',op:hash},'c2'));
 const store=st.memoryStore();const cohort=await store.createCohort({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:hash});const session={role:'operator',cohortId:cohort.id,op:hash};
 assert(await srv.stillValid(store,session));assert(await srv.stillValid(store,{role:'admin'}));await store.setOperatorHash(cohort.id,srv.sha256('NEWCODENEWCD'));assert(!await srv.stillValid(store,session));
 assert(!await srv.stillValid(store,{...session,cohortId:'another'}));
 assert.equal(srv.clientAddress(new Request('http://x',{headers:{'x-forwarded-for':'10.0.0.1, 10.0.0.2'}})),'10.0.0.1');assert.equal(srv.clientAddress(new Request('http://x')),'instance');
 assert.equal(srv.opsKey({OPS_ADMIN_KEY:'short'}),null);assert.equal(srv.opsKey({OPS_ADMIN_KEY:' a-long-admin-key-123 '}),key);assert.equal(srv.opsKey({}),null);
 assert(srv.sameSecret(key,key));assert(!srv.sameSecret(key,key+'x'));
 assert.equal(srv.bearer(new Request('http://x',{headers:{authorization:'Bearer '+token}})),token);assert.equal(srv.bearer(new Request('http://x',{headers:{authorization:'Bearer short'}})),null);
});
await test('a cohort needs a name and a period, and its stage follows the Korean calendar',()=>{
 assert.deepEqual(c.validCohortInput({name:' 1기 ',org:'니트컴퍼니',startsOn:'2026-11-03',endsOn:'2026-12-02',extra:1}),{name:'1기',org:'니트컴퍼니',startsOn:'2026-11-03',endsOn:'2026-12-02'});
 for(const bad of [{name:'',startsOn:'2026-11-03',endsOn:'2026-12-02'},{name:'1기',startsOn:'2026-12-03',endsOn:'2026-12-02'},{name:'1기',startsOn:'11/3',endsOn:'2026-12-02'},{name:'가'.repeat(41),startsOn:'2026-11-03',endsOn:'2026-12-02'},{name:'1기',startsOn:'2026-02-28',endsOn:'2026-02-30'},null])assert.equal(c.validCohortInput(bad),null);
 const cohort={name:'1기',org:'',startsOn:'2026-11-03',endsOn:'2026-12-02'};
 assert.equal(c.cohortStage(cohort,'2026-11-02'),'시작 전');assert.equal(c.cohortStage(cohort,'2026-12-02'),'진행 중');assert.equal(c.cohortStage(cohort,'2026-12-03'),'마침');assert(c.cohortEnded(cohort,'2026-12-03'));
 assert.equal(c.seoulDay(new Date('2026-11-02T16:30:00Z')),'2026-11-03');
});
await test('a device sends only what it recorded after joining, each record once, whatever its clock says',()=>{
 const info={name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01'};const now=new Date(2026,10,2,12);const today=j.localDay(now);
 const before=[step('before','2026-11-01T10:00:00.000Z')];const m=c.startMembership(info,token,'P07',before,['2026-10-30',today],now);assert.deepEqual(c.validMembership(JSON.parse(JSON.stringify(m))),m);
 // A record made after joining on a device whose clock went backwards still counts as new.
 const entries=[...before,step('n1','2020-01-01T00:00:00.000Z'),step('n2','2026-11-02T05:00:00.000Z')];const visits=['2026-10-30',today,'2026-12-25'];
 let p=c.pendingSync(entries,visits,m);assert.deepEqual(p.entries.map(e=>e.id),['n1','n2']);assert.deepEqual(p.visits,[today,'2026-12-25']);
 const after=c.afterSync(m,entries,visits,p.entries.slice(0,1),p.visits,'P08',now);p=c.pendingSync(entries,visits,after);assert.deepEqual(p.entries.map(e=>e.id),['n2']);assert.equal(p.visits.length,0);assert.equal(after.code,'P08');assert(after.lastSync);
 assert.deepEqual(c.afterSync(after,entries.slice(1),visits,[],[],'P08',now).sent,['n1'],'ids of records no longer on the device are dropped');
 for(const bad of [{...m,token:'short'},{...m,joinedAt:'yesterday'},{...m,name:''},{...m,sent:undefined},{...m,sentVisits:['2026-02-30']},null])assert.equal(c.validMembership(bad),null);
 const loose=c.validMembership({...m,code:'has space',lastSync:'never'});assert.equal(loose.code,'');assert.equal(loose.lastSync,'');
});
await test('what a device sends is capped, rebuilt from known fields, and invalid records are dropped',()=>{
 const ok=c.validSync({participant:'P07',entries:[step('a','2026-11-02T04:00:00.000Z',{extra:'x'.repeat(5000),nested:{a:1}}),step('b','not a date'),step('x'.repeat(65),'2026-11-02T04:00:00.000Z'),step('odd','1')],visits:['2026-11-02','bad','2026-02-30']});
 assert.equal(ok.participant,'P07');assert.deepEqual(ok.entries.map(e=>e.id),['a','odd']);assert.deepEqual(ok.visits,['2026-11-02']);
 assert.deepEqual(Object.keys(ok.entries[0]).sort(),['at','energy','id','title','type']);
 const levels=c.validSync({participant:'P07',entries:[step('n1','2026-11-10T04:00:00.000Z',{energy:null,energyLevel:3}),step('n2','2026-11-10T04:00:00.000Z',{energy:null,energyLevel:5}),step('o1','2026-11-01T04:00:00.000Z',{energy:5})],visits:[]});
 assert.deepEqual(levels.entries.map(e=>[e.id,e.energy,e.energyLevel]),[['n1',null,3],['o1',5,undefined]]);assert.match(ok.entries[1].at,/^\d{4}-\d{2}-\d{2}T.*Z$/);
 // A mission's answer (answers.ts) stays on the device: it is cut before sending and the server would not store it either.
 const priv=step('a1','2026-11-10T04:00:00.000Z',{energy:null,energyLevel:2,answer:'잔잔함'});assert.equal('answer' in c.storedEntry(priv),false);assert.equal('answer' in c.validSync({participant:'P07',entries:[priv],visits:[]}).entries[0],false);
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
 await assert.rejects(()=>store.addParticipant({cohortId:cohort.id,code:'P01',tokenHash:srv.sha256('C'.repeat(43))}),st.DuplicateCode);
 const entries=[step('e1','2026-11-02T16:30:00.000Z'),{id:'e2',at:'2026-11-03T01:00:00.000Z',type:'checkin',title:'마음 살펴보기',energy:null,calm:2,talk:1,outside:1},{id:'e3',at:'2026-11-03T02:00:00.000Z',type:'feedback',title:'폴짝에게 한마디',energy:null,note:'=좋아요'}];
 await store.saveRecords(a.id,'P01',entries,['2026-11-03']);await store.saveRecords(a.id,'P02',[{...entries[0],title:'바뀐 제목'}],['2026-11-03']);
 const [first,second]=await store.cohortRecords(cohort.id);
 assert.equal(first.entries.length,3);assert.equal(first.entries[0].title,'창밖 보기');assert.deepEqual(first.visits,['2026-11-03']);assert.equal(first.code,'P01');assert(first.lastSyncAt);assert.equal(second.entries.length,0);
 const s=c.participantSummary(first,new Date('2026-11-04T00:00:00Z'));
 assert.equal(s.firstDay,'2026-11-03');assert.equal(s.visitDays,1);assert.equal(s.activeDays,1);assert.equal(s.recentActiveDays,1);assert.equal(s.firstCheckin.calm,2);assert.equal(s.lastCheckin,null);assert.equal(s.notes,1);
 const csv=c.cohortCsv([first,second]);const lines=csv.split('\r\n');
 assert.equal(lines.filter(l=>l.includes('participant_code')).length,1);assert(lines.some(l=>l.startsWith('"P02","summary"')));assert(csv.includes(`"'=좋아요"`));
 assert.equal((await store.listCohorts())[0].participants,2);assert.equal(await store.memberCount(cohort.id),2);
 await store.setEndsOn(cohort.id,'2026-12-31');assert.equal((await store.cohort(cohort.id)).endsOn,'2026-12-31');
 await assert.rejects(()=>store.saveRecords(a.id,'P01',Array.from({length:st.MAX_STORED_ENTRIES},(_,i)=>step('bulk'+i,'2026-11-03T03:00:00.000Z')),[]),st.TooManyRecords);
 await store.removeParticipant(a.id);assert.equal(await store.participantByToken(srv.sha256(token)),null);assert.equal((await store.cohortRecords(cohort.id)).length,1);
});
await test('the local file store applies requests one at a time, so none overwrites another',async()=>{
 const file=new URL('cohorts-test.json',out).pathname;await fs.rm(file,{force:true});const store=st.fileStore(file);
 const cohort=await store.createCohort({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:'h'});
 const [a,b]=await Promise.all([store.addParticipant({cohortId:cohort.id,code:'A',tokenHash:'ta'}),store.addParticipant({cohortId:cohort.id,code:'B',tokenHash:'tb'})]);
 await Promise.all(Array.from({length:20},(_,i)=>store.saveRecords(i%2?a.id:b.id,'',[step('r'+i,'2026-11-03T03:00:00.000Z')],[])));
 const people=await store.cohortRecords(cohort.id);assert.deepEqual(people.map(p=>p.entries.length),[10,10]);
 await Promise.all([store.saveRecords(a.id,'',[step('late','2026-11-03T04:00:00.000Z')],[]),store.removeParticipant(a.id)]);assert.deepEqual((await store.cohortRecords(cohort.id)).map(p=>p.code),['B']);await fs.rm(file,{force:true});
});
await test('Supabase calls use the server key, never read hashes back, cap and add without overwriting, and page by a unique order',async()=>{
 const pid='22222222-2222-4222-8222-222222222222',cid='11111111-1111-4111-8111-111111111111';const calls=[];let stored=3;
 const fake=async(url,init)=>{calls.push({url,init});const u=new URL(url);const path=u.pathname.split('/').at(-1);const offset=u.searchParams.get('offset');const method=init.method??'GET';
  if(method==='GET'&&path==='entries'&&init.headers.Prefer==='count=exact')return new Response('[]',{headers:{'content-range':`0-0/${stored}`}});
  if(method==='GET'&&path==='participants')return Response.json(offset==='0'?[{id:pid,cohort_id:cid,code:'P01',joined_at:'2026-11-02T00:00:00Z',last_sync_at:null}]:[]);
  if(method==='GET'&&path==='entries')return Response.json(offset==='0'?Array.from({length:1000},(_,i)=>({participant_id:pid,data:step('e'+i,'2026-11-02T04:00:00.000Z')})):offset==='1000'?[{participant_id:pid,data:step('last','2026-11-03T04:00:00.000Z')}]:[]);
  if(method==='GET'&&path==='visits')return Response.json(offset==='0'?[{participant_id:pid,day:'2026-11-02'}]:[]);
  if(method==='GET')return Response.json([]);
  if(method==='POST'&&path==='cohorts')return Response.json({code:'23505'},{status:409});
  if(method==='PATCH'&&init.body?.includes('"code"'))return Response.json({code:'23505'},{status:409});
  return new Response(null,{status:method==='POST'?201:204});};
 const store=st.supabaseStore('https://example.supabase.co/','sb_secret_test',fake);
 await store.saveRecords(pid,'P01',[step('e1','2026-11-02T04:00:00.000Z')],['2026-11-02']);
 const [count,entries,visits,patch,codePatch]=calls;const entriesUrl=new URL(entries.url);
 assert.equal(count.init.headers.Prefer,'count=exact');assert.equal(entriesUrl.pathname,'/rest/v1/entries');assert.equal(entriesUrl.searchParams.get('on_conflict'),'participant_id,id');assert.match(entries.init.headers.Prefer,/resolution=ignore-duplicates/);
 assert.equal(entries.init.headers.apikey,'sb_secret_test');assert.equal(entries.init.headers.Authorization,undefined);
 assert.deepEqual(JSON.parse(entries.init.body)[0],{participant_id:pid,id:'e1',at:'2026-11-02T04:00:00.000Z',type:'step',data:step('e1','2026-11-02T04:00:00.000Z')});
 assert.equal(visits.init.method,'POST');assert.equal(patch.init.method,'PATCH');assert.equal(JSON.parse(codePatch.init.body).code,'P01','a code taken by someone else is skipped, the send still succeeds');
 stored=st.MAX_STORED_ENTRIES;await assert.rejects(()=>store.saveRecords(pid,'',[step('over','2026-11-02T04:00:00.000Z')],[]),st.TooManyRecords);
 calls.length=0;const people=await store.cohortRecords(cid);assert.equal(people[0].entries.length,1001);assert.equal(people[0].entries.at(-1).id,'last');assert.deepEqual(people[0].visits,['2026-11-02']);
 const entryPages=calls.filter(c=>new URL(c.url).pathname.endsWith('/entries')).map(c=>decodeURIComponent(c.url));assert.equal(entryPages.length,3,'reads until an empty page');
 assert(entryPages.every(u=>u.includes('participants!inner(cohort_id)')&&u.includes(`participants.cohort_id=eq.${cid}`)&&u.includes('order=participant_id.asc,at.asc,id.asc')&&!u.includes('participant_id=in.')));
 assert(calls.some(c=>decodeURIComponent(c.url).includes('visits?')&&decodeURIComponent(c.url).includes('order=participant_id.asc,day.asc')));
 await assert.rejects(()=>store.createCohort({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:'h'}),st.DuplicateCode);
 assert.equal(await store.cohort('not-a-uuid'),null);assert.deepEqual(await store.cohortRecords('not-a-uuid'),[]);assert.equal(await store.memberCount('not-a-uuid'),0);
 await store.setEndsOn(cid,'2026-12-31');const period=calls.at(-1);assert.equal(period.init.method,'PATCH');assert.deepEqual(JSON.parse(period.init.body),{ends_on:'2026-12-31'});
 await store.memberCount(cid);assert.match(decodeURIComponent(calls.at(-1).url),/cohorts\?select=participants\(count\)&id=eq\./);
 await store.ping();assert.equal(calls.at(-1).url,'https://example.supabase.co/rest/v1/cohorts?select=id&limit=1','the keep-alive is one small read');assert.equal(calls.at(-1).init.method,'GET');await st.memoryStore().ping();
 assert(calls.every(c=>!/select=[^&]*(operator_hash|token_hash)/.test(decodeURIComponent(c.url))));
 const legacy=[];await st.supabaseStore('https://example.supabase.co','eyJhbGciOi.legacy',async(url,init)=>{legacy.push(init);return Response.json([])}).cohortByJoinCode('7K3QPW2M');assert.equal(legacy[0].headers.Authorization,'Bearer eyJhbGciOi.legacy');
 assert.equal(await st.storeFromEnv({NODE_ENV:'production'}),null);assert.equal(await st.storeFromEnv({NODE_ENV:'production',SUPABASE_URL:'http://insecure.example',SUPABASE_SECRET_KEY:'k'}),null);
 assert.equal((await st.storeFromEnv({NODE_ENV:'production',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'k'})).kind,'supabase');
});
console.log(`${passed} cohort checks passed. Live Supabase and the operator pages are checked by hand (README).`);
