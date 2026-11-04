import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['records','cohort','pond','cohort-store','journey']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"));}
const pond=await import(new URL('pond.js',out));const st=await import(new URL('cohort-store.js',out));const journey=await import(new URL('journey.js',out));
let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS '+name)};

// A small JPEG built by hand, with every kind of metadata a phone or editor writes.
const ascii=s=>[...s].map(c=>c.charCodeAt(0));
const seg=(marker,payload)=>{const n=payload.length+2;return [0xff,marker,n>>8,n&255,...payload];};
const jfif=seg(0xe0,[...ascii('JFIF\0'),1,1,0,0,1,0,1,0,0]);
const jfxx=seg(0xe0,[...ascii('JFXX\0'),0x10,1,2,3]);
const exif=seg(0xe1,[...ascii('Exif\0\0'),...ascii('GPS 37.5665N 126.9780E iPhone')]);
const xmp=seg(0xe1,[...ascii('http://ns.adobe.com/xap/1.0/\0'),...ascii('<x:xmpmeta>GPSLatitude</x:xmpmeta>')]);
const icc=seg(0xe2,[...ascii('ICC_PROFILE\0'),1,1,...ascii('sRGB')]);
const mpf=seg(0xe2,[...ascii('MPF\0'),0,0,0,8]);
const iptc=seg(0xed,[...ascii('Photoshop 3.0\0'),...ascii('8BIM city Seoul')]);
const adobe=seg(0xee,[...ascii('Adobe'),0,100,0,0,0,0,1]);
const comment=seg(0xfe,ascii('taken at home'));
const dqt=seg(0xdb,[0,...Array(64).fill(1)]);
const sof=(w,h,marker=0xc0)=>seg(marker,[8,h>>8,h&255,w>>8,w&255,1,1,0x11,0]);
const dht=seg(0xc4,[0,...Array(16).fill(0)]);
const sos=seg(0xda,[1,1,0,0,63,0]);
// Scan data with a stuffed zero (FF 00) and a restart marker (FF D0), which are picture data and stay.
const scan=[0x12,0xff,0x00,0x34,0xff,0xd0,0x56];
const eoi=[0xff,0xd9];
const jpeg=(...parts)=>Uint8Array.from([0xff,0xd8,...parts.flat()]);
const text=bytes=>Buffer.from(bytes).toString('latin1');

await test('a photo keeps its picture and loses EXIF, GPS, XMP, IPTC, comments and anything after the end',()=>{
 // Phones append a second picture with its own EXIF after the first end-of-image (multi-picture format).
 const appended=[0xff,0xd8,...exif,...sof(80,60),...sos,1,2,3,...eoi];
 const cleaned=pond.cleanJpeg(jpeg(jfif,jfxx,exif,xmp,icc,mpf,iptc,adobe,comment,dqt,sof(160,120),dht,sos,scan,eoi,appended));
 assert.deepEqual([cleaned.width,cleaned.height],[160,120]);
 assert.deepEqual([...cleaned.bytes],[0xff,0xd8,...jfif,...icc,...adobe,...dqt,...sof(160,120),...dht,...sos,...scan,...eoi]);
 for(const gone of ['Exif','GPS','iPhone','xmpmeta','MPF','8BIM','Seoul','taken at home','JFXX'])assert(!text(cleaned.bytes).includes(gone),gone);
 // Cleaning twice changes nothing more.
 assert.deepEqual([...pond.cleanJpeg(cleaned.bytes).bytes],[...cleaned.bytes]);
});
await test('a progressive photo keeps every scan, and metadata between scans or after fill bytes still goes',()=>{
 const progressive=jpeg(jfif,dqt,sof(64,64,0xc2),dht,sos,[0x11,0x22],comment,dht,sos,[0x33,0xff,0x00],[0xff,0xff],seg(0xe1,ascii('Exif\0\0GPS')),sos,[0x44],eoi);
 const cleaned=pond.cleanJpeg(progressive);
 assert.deepEqual([cleaned.width,cleaned.height],[64,64]);
 assert.deepEqual([...cleaned.bytes],[0xff,0xd8,...jfif,...dqt,...sof(64,64,0xc2),...dht,...sos,0x11,0x22,...dht,...sos,0x33,0xff,0x00,0xff,0xff,...sos,0x44,...eoi],'fill bytes before a marker may stay; the segment after them goes');
 assert(!text(cleaned.bytes).includes('GPS')&&!text(cleaned.bytes).includes('taken at home'));
});
await test('anything that is not a whole JPEG of a sensible size is refused',()=>{
 const ok=jpeg(jfif,dqt,sof(160,120),dht,sos,scan,eoi);assert(pond.cleanJpeg(ok));
 const refused={
  png:Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
  'no end':jpeg(jfif,dqt,sof(160,120),dht,sos,scan),
  'no picture':jpeg(jfif,dqt,eoi),
  'scan before frame':jpeg(jfif,dqt,sos,scan,eoi),
  'segment past the end':Uint8Array.from([0xff,0xd8,0xff,0xe1,0x40,0x00,1,2,3]),
  'stray restart':jpeg(jfif,[0xff,0xd0],dqt,sof(160,120),dht,sos,scan,eoi),
  'too wide':jpeg(jfif,dqt,sof(pond.MAX_PAD_SIDE+1,100),dht,sos,scan,eoi),
  'too heavy':jpeg(jfif,seg(0xe1,Array(65000).fill(0)),...Array(16).fill(seg(0xe1,Array(65000).fill(0))),dqt,sof(160,120),dht,sos,scan,eoi),
  empty:new Uint8Array(0),
 };
 assert(refused['too heavy'].length>pond.MAX_PAD_BYTES);
 for(const [name,bytes] of Object.entries(refused))assert.equal(pond.cleanJpeg(bytes),null,name);
});
await test('members see floating pads newest first and their own taken-down pads, never who floated the others',()=>{
 const pads=[
  {id:'a',cohortId:'c1',participantId:'me',at:'2026-11-02T01:00:00.000Z',hidden:false},
  {id:'b',cohortId:'c1',participantId:'friend',at:'2026-11-04T01:00:00.000Z',hidden:false},
  {id:'c',cohortId:'c1',participantId:'friend',at:'2026-11-03T01:00:00.000Z',hidden:true},
  {id:'d',cohortId:'c1',participantId:'me',at:'2026-11-03T05:00:00.000Z',hidden:true},
 ];
 assert.deepEqual(pond.padsFor(pads,'me'),[{id:'b',at:'2026-11-04T01:00:00.000Z',mine:false,hidden:false},{id:'d',at:'2026-11-03T05:00:00.000Z',mine:true,hidden:true},{id:'a',at:'2026-11-02T01:00:00.000Z',mine:true,hidden:false}]);
 assert.deepEqual(pond.padsFor(pads,'friend').map(p=>p.id),['b','c','a']);
 assert(pond.padsFor(pads,'someone').every(p=>Object.keys(p).join()==='id,at,mine,hidden'&&!p.mine&&!p.hidden));
 const [a,,c]=pads;
 assert(pond.canOpenPad(a,{id:'friend',cohortId:'c1'}));assert(!pond.canOpenPad(a,{id:'stranger',cohortId:'c2'}),'another cohort never sees it');
 assert(!pond.canOpenPad(c,{id:'me',cohortId:'c1'}));assert(pond.canOpenPad(c,{id:'friend',cohortId:'c1'}),'a taken-down pad stays with the person who floated it');
 assert(pond.validPadId('8c0c58a2-5f0b-4f43-9a52-3ad1a5c1b8a0'));for(const bad of ['', '../x', 'a'.repeat(36), null, 7])assert(!pond.validPadId(bad));
});
await test('each pad keeps the same gentle look, and the photo missions exist',()=>{
 const ids=Array.from({length:300},(_,i)=>`8c0c58a2-5f0b-4f43-9a52-${String(i).padStart(12,'0')}`);
 for(const id of ids){const l=pond.padLook(id);assert.deepEqual(pond.padLook(id),l);assert(l.notch>=0&&l.notch<360&&Math.abs(l.tilt)<=6&&l.size>=92&&l.size<=100&&Math.abs(l.rise)<=7,id);}
 assert(new Set(ids.map(id=>pond.padLook(id).notch)).size>100,'notches point in many directions');
 for(const id of pond.PAD_MISSIONS)assert(journey.springMissions.some(m=>m.id===id),id);
});
const photo=Uint8Array.from([0xff,0xd8,1,2,3,0xff,0xd9]);
async function cohortWithTwo(store){
 const c1=await store.createCohort({name:'1기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'7K3QPW2M',operatorHash:'h1'});
 const c2=await store.createCohort({name:'2기',org:'',startsOn:'2026-11-01',endsOn:'2026-12-01',joinCode:'ABCDEFGH',operatorHash:'h2'});
 const me=await store.addParticipant({cohortId:c1.id,code:'P01',tokenHash:'t1'});const friend=await store.addParticipant({cohortId:c1.id,code:'P02',tokenHash:'t2'});const other=await store.addParticipant({cohortId:c2.id,code:'P01',tokenHash:'t3'});
 return {c1,c2,me,friend,other};
}
await test('a cohort keeps its pads apart, takes them down and back, and forgets a person\'s pads when they leave',async()=>{
 const shelf=st.memoryShelf();const store=st.memoryStore(undefined,undefined,'memory',shelf);const {c1,c2,me,friend,other}=await cohortWithTwo(store);
 const mine=await store.addPad({cohortId:c1.id,participantId:me.id,photo});const theirs=await store.addPad({cohortId:c1.id,participantId:friend.id,photo});const elsewhere=await store.addPad({cohortId:c2.id,participantId:other.id,photo});
 assert(pond.validPadId(mine.id));assert.equal(mine.hidden,false);
 assert.deepEqual((await store.cohortPads(c1.id)).map(p=>p.id),[theirs.id,mine.id]);assert.deepEqual((await store.cohortPads(c2.id)).map(p=>p.id),[elsewhere.id]);
 assert.deepEqual([...await store.padPhoto(theirs)],[...photo]);
 await store.setPadHidden(theirs.id,true);assert.equal((await store.pad(theirs.id)).hidden,true);
 assert.deepEqual(pond.padsFor(await store.cohortPads(c1.id),me.id).map(p=>p.id),[mine.id]);
 await store.setPadHidden(theirs.id,false);assert.equal((await store.pad(theirs.id)).hidden,false);
 await store.removePad(mine);assert.equal(await store.pad(mine.id),null);assert.equal(await store.padPhoto(mine),null);
 await store.removeParticipant(friend.id);assert.deepEqual(await store.cohortPads(c1.id),[]);assert.deepEqual(shelf.keys(),[st.photoKey(elsewhere)]);
 for(let i=0;i<pond.MAX_PADS_PER_PERSON-1;i++)await store.addPad({cohortId:c2.id,participantId:other.id,photo});
 await assert.rejects(()=>store.addPad({cohortId:c2.id,participantId:other.id,photo}),st.TooManyPads);
});
await test('during development photos are files beside the data, and nothing outside that folder can be named',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'poljjak-pond-'));
 try{
  const store=st.fileStore(path.join(dir,'cohorts.json'));const {c1,me}=await cohortWithTwo(store);
  const pad=await store.addPad({cohortId:c1.id,participantId:me.id,photo});const file=path.join(dir,'lily-pads',c1.id,pad.id+'.jpg');
  assert.deepEqual([...await fs.readFile(file)],[...photo]);assert(!(await fs.readFile(path.join(dir,'cohorts.json'),'utf8')).includes('255,216'),'the photo is not inside the data file');
  assert.equal((await st.fileStore(path.join(dir,'cohorts.json')).cohortPads(c1.id))[0].id,pad.id);
  await store.removeParticipant(me.id);await assert.rejects(()=>fs.access(file));
  const shelf=st.folderShelf(dir);for(const bad of ['../outside.jpg','a/b.jpg',`${c1.id}/../../x.jpg`])await assert.rejects(()=>shelf.put(bad,photo),/bad_photo_key/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
await test('Supabase keeps photos in the private bucket with the server key, the photo before the row and out before the person',async()=>{
 const cid='11111111-1111-4111-8111-111111111111',pid='22222222-2222-4222-8222-222222222222',padId='33333333-3333-4333-8333-333333333333';
 const calls=[];let padCount=0;let rowFails=false;
 const fake=async(url,init={})=>{const u=new URL(url);const method=init.method??'GET';calls.push({path:u.pathname,url:decodeURIComponent(url),method,init});
  if(u.pathname.startsWith('/storage/'))return method==='GET'?(u.pathname.includes(padId)?new Response(photo):Response.json({statusCode:'404',error:'not_found'},{status:400})):Response.json([]);
  if(method==='GET'&&init.headers?.Prefer==='count=exact')return new Response('[]',{headers:{'content-range':`0-0/${padCount}`}});
  if(u.pathname.endsWith('/pads')&&method==='POST'){if(rowFails)return Response.json({},{status:500});const b=JSON.parse(init.body);return Response.json([{...b,created_at:'2026-11-04T01:00:00Z',hidden:false}],{status:201});}
  if(u.pathname.endsWith('/pads')&&method==='GET')return Response.json(u.searchParams.get('offset')==='0'||u.searchParams.get('limit')==='1'?[{id:padId,cohort_id:cid,participant_id:pid,created_at:'2026-11-04T01:00:00Z',hidden:false}]:[]);
  return new Response(null,{status:204});};
 const store=st.supabaseStore('https://example.supabase.co/','sb_secret_test',fake);
 const pad=await store.addPad({cohortId:cid,participantId:pid,photo});
 const [count,upload,row]=calls;
 assert.match(count.url,/\/rest\/v1\/pads\?select=id&participant_id=eq\.2222/);
 assert.equal(upload.method,'POST');assert.equal(upload.path,`/storage/v1/object/lily-pads/${cid}/${pad.id}.jpg`);assert.equal(upload.init.headers.apikey,'sb_secret_test');assert.equal(upload.init.headers['Content-Type'],'image/jpeg');assert.equal(upload.init.headers['x-upsert'],'false');
 assert.deepEqual([...new Uint8Array(await upload.init.body.arrayBuffer())],[...photo]);
 assert.equal(row.path,'/rest/v1/pads');assert.deepEqual(JSON.parse(row.init.body),{id:pad.id,cohort_id:cid,participant_id:pid});
 assert.deepEqual(pad,{id:pad.id,cohortId:cid,participantId:pid,at:'2026-11-04T01:00:00Z',hidden:false});
 // If the row cannot be written, the photo does not stay behind.
 calls.length=0;rowFails=true;await assert.rejects(()=>store.addPad({cohortId:cid,participantId:pid,photo}));rowFails=false;
 const cleanup=calls.at(-1);assert.equal(cleanup.method,'DELETE');assert.equal(cleanup.path,'/storage/v1/object/lily-pads');assert.match(JSON.parse(cleanup.init.body).prefixes[0],new RegExp(`^${cid}/.+\\.jpg$`));
 padCount=pond.MAX_PADS_PER_PERSON;await assert.rejects(()=>store.addPad({cohortId:cid,participantId:pid,photo}),st.TooManyPads);padCount=0;
 calls.length=0;const pads=await store.cohortPads(cid);assert.equal(pads.length,1);assert(calls[0].url.includes(`pads?select=id,cohort_id,participant_id,created_at,hidden&cohort_id=eq.${cid}&order=created_at.desc,id.desc`));
 assert.deepEqual([...await store.padPhoto(pads[0])],[...photo]);assert.equal(await store.padPhoto({...pads[0],id:'44444444-4444-4444-8444-444444444444'}),null,'a missing photo is simply not there');
 calls.length=0;await store.removePad(pads[0]);assert.deepEqual(calls.map(c=>[c.method,c.path]),[['DELETE','/storage/v1/object/lily-pads'],['DELETE','/rest/v1/pads']]);assert.deepEqual(JSON.parse(calls[0].init.body),{prefixes:[`${cid}/${padId}.jpg`]});
 calls.length=0;await store.setPadHidden(padId,true);assert.equal(calls[0].method,'PATCH');assert.deepEqual(JSON.parse(calls[0].init.body),{hidden:true});
 calls.length=0;await store.removeParticipant(pid);assert.deepEqual(calls.map(c=>[c.method,c.path]),[['GET','/rest/v1/pads'],['GET','/rest/v1/pads'],['DELETE','/storage/v1/object/lily-pads'],['DELETE','/rest/v1/participants']]);
 calls.length=0;assert.equal(await store.pad('../not-a-uuid'),null);assert.deepEqual(await store.cohortPads('nope'),[]);await store.setPadHidden('nope',true);assert.equal(calls.length,0,'ids that are not uuids never reach Supabase');
});
console.log(`${passed} lily pad checks passed. The pond in the app, the operator page and a real Supabase bucket are checked by hand (README).`);
