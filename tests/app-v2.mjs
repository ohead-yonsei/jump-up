import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
const src=await fs.readFile(new URL('../lib/records.ts',import.meta.url),'utf8');
await fs.writeFile(new URL('records.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);
const r=await import(new URL('records.js',out));let count=0;
async function test(name,fn){await fn();count++;console.log('PASS '+name)}
const entry={id:'test',at:'2026-10-24T12:00:00.000Z',type:'step',title:'작은 한 걸음',energy:2};
await test('persisted record validation rejects broken dates, scores and modes',()=>{
 assert.equal(r.validEntries([entry,{...entry,at:'invalid'},{...entry,energy:8},{...entry,after:'5'},{...entry,mode:'fake'}]).length,1);
 assert.equal(r.validEntries([{...entry,energy:null}]).length,1);
});
await test('CSV preserves Korean, quotes, newlines and missing energy',()=>{
 const csv=r.recordsCsv([{...entry,title:'말 "한 줄"\n연습',energy:null}]);
 assert(csv.startsWith('\uFEFF'));assert(csv.includes('"말 ""한 줄""\n연습"'));assert(csv.includes('"session-only"'));assert(!csv.includes('undefined'));
});
await test('self check-ins and notes are validated, exported and kept out of the activity garden',()=>{
 const check={...entry,id:'c1',type:'checkin',title:'마음 살펴보기',calm:2,talk:3,outside:1};
 assert.equal(r.validEntries([check,{...check,id:'c2',calm:9},{...check,id:'c3',note:'x'.repeat(301)}]).length,1);
 const csv=r.recordsCsv([check,{...entry,id:'n1',type:'feedback',title:'폴짝에게 한마디',note:'글씨가 작아요'}],'P07');
 assert(csv.includes('"calm","talk_comfort","outside_comfort","note"'));assert(csv.includes('"글씨가 작아요"'));assert(csv.includes('"P07"'));
 const now=new Date('2026-10-24T15:00:00+09:00');assert.equal(r.weekMoments([{...check,at:now.toISOString()}],now)[6].count,0);
 assert.equal(r.checkinDue([],now),true);assert.equal(r.checkinDue([{...check,at:'2026-10-20T12:00:00.000Z'}],now),false);assert.equal(r.checkinDue([{...check,at:'2026-10-10T12:00:00.000Z'}],now),true);
 assert(r.validParticipant('P07'));assert(!r.validParticipant('홍길동'));assert(!r.validParticipant('a b'));
});
await test('CSV neutralizes spreadsheet formula cells',()=>{
 const csv=r.recordsCsv([{...entry,title:'=SUM(A1:A3)'}],'@untrusted');
 assert(csv.includes('"\'=SUM(A1:A3)"'));assert(csv.includes('"\'@untrusted"'));
});
await test('demo fixtures are separate fresh records and visibly export as demo',()=>{
 const first=r.demoEntries(new Date('2026-10-24T15:00:00+09:00'));
 const second=r.demoEntries(new Date('2026-10-24T15:00:00+09:00'));
 first[0].title='changed';assert.notEqual(first[0].title,second[0].title);
 assert(second.every(e=>e.id.startsWith('demo-')));assert(r.recordsCsv(second,'demo-only').includes('demo-only'));
});
await test('week garden uses calendar days and excludes feedback',()=>{
 const now=new Date('2026-10-24T15:00:00+09:00');const days=r.weekMoments([{...entry,at:now.toISOString()},{...entry,type:'feedback',at:now.toISOString()}],now);
 assert.equal(days.length,7);assert.equal(days[6].today,true);assert.equal(days[6].count,1);assert.equal(days[0].count,0);
});
await test('app manifest provides standalone install assets and internal shortcuts',async()=>{
 const m=JSON.parse(await fs.readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(m.display,'standalone');assert.equal(m.scope,'/');assert(m.icons.some(i=>i.sizes==='512x512'));
 for(const icon of m.icons)await fs.access(new URL('../public'+icon.src,import.meta.url));
 for(const shortcut of m.shortcuts)assert(shortcut.url.startsWith('/'));
});
const handlers={};const puts=[];const deleted=[];let offline=false;let redirect=false;
const context={URL,Response,self:{location:{origin:'https://example.test'},addEventListener:(name,handler)=>{handlers[name]=handler},skipWaiting:async()=>{},clients:{claim:async()=>{}}},
 caches:{open:async()=>({put:async(path)=>puts.push(path)}),keys:async()=>['one-step-shell-old','another-app-data'],delete:async(key)=>deleted.push(key),match:async()=>new Response('offline-help')},
 fetch:async()=>{if(offline)throw Error('offline');return {ok:true,redirected:redirect,headers:{get:()=> 'text/html image/png'},clone:()=>({text:async()=> '<meta name="one-step-offline" content="v2">'})};}};
vm.runInNewContext(await fs.readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
await test('service worker never caches redirects or API/auth responses',async()=>{
 redirect=true;let pending;handlers.install({waitUntil:p=>pending=p});await pending;assert.equal(puts.length,0);
 redirect=false;handlers.install({waitUntil:p=>pending=p});await pending;assert(puts.length>=3);assert(puts.every(path=>path.startsWith('/icons/')||path==='/offline.html'));
 for(const pathname of ['/api/chat','/auth/callback']){let intercepted=false;handlers.fetch({request:{url:'https://example.test'+pathname,method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
});
await test('service worker falls back on offline navigation and only clears its own cache',async()=>{
 offline=true;let response;handlers.fetch({request:{url:'https://example.test/demo',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(await (await response).text(),'offline-help');
 let pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['one-step-shell-old']);
});
console.log(`${count} app checks passed. Device installation and live model calls are not simulated by these tests.`);
