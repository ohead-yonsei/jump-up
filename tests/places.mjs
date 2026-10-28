import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['places','journey']){const src=await fs.readFile(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');await fs.writeFile(new URL(`${name}.js`,out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);}
const p=await import(new URL('places.js',out));const j=await import(new URL('journey.js',out));let n=0;
async function test(name,fn){await fn();n++;console.log('PASS '+name)}
const doc=(id,distance,extra={})=>({id:String(id),place_name:'카페 '+id,category_name:'음식점 > 카페 > 커피전문점',road_address_name:'경기 성남시 중원구 성남대로 '+id,address_name:'경기 성남시 중원구 성남동 '+id,x:'127.129',y:'37.432',place_url:'http://place.map.kakao.com/'+id,distance:String(distance),...extra});
await test('queries take a known kind and either a coarse point in Korea or a short area name',()=>{
 assert.deepEqual(p.parsePlaceQuery({kind:'cafe',lat:37.432149,lng:127.129049}),{kind:'cafe',lat:37.432,lng:127.129});
 assert.equal(p.parsePlaceQuery({kind:'cafe',lat:35.6762,lng:139.6503}),'outside');
 assert.equal(p.parsePlaceQuery({kind:'bar',lat:37.4,lng:127.1}),null);
 assert.equal(p.parsePlaceQuery({kind:'park',lat:'37.4',lng:127.1}),null);
 assert.equal(p.parsePlaceQuery({kind:'park',lat:Number.NaN,lng:127.1}),null);
 assert.deepEqual(p.parsePlaceQuery({kind:'library',near:'  모란역   2번 출구 '}),{kind:'library',near:'모란역 2번 출구'});
 for(const near of ['역','가'.repeat(31),'<script>','a\u0007b'])assert.equal(p.parsePlaceQuery({kind:'cafe',near}),null);
 assert.equal(p.parsePlaceQuery(null),null);
});
await test('Kakao results become at most eight safe places, nearest first',()=>{
 const docs=[doc(3,900),doc(1,120),doc(1,130),doc(2,450,{road_address_name:'',address_name:'서울특별시 종로구 이화동 1'}),doc('x9',50),doc(4,'',{}),doc(5,300,{category_name:'음식점 > 카페 > 테마카페 > 키즈카페'}),doc(6,310,{category_name:'교통,수송 > 교통시설 > 주차장'}),...Array.from({length:10},(_,i)=>doc(100+i,1000+i)),'broken',null];
 const places=p.toPlaces(docs,'cafe');
 assert.equal(places.length,p.MAX_PLACES);assert.deepEqual(places.slice(0,3).map(x=>x.id),['1','2','3']);
 assert.equal(places[0].url,'https://place.map.kakao.com/1');assert.equal(places[0].address,'성남시 중원구 성남대로 1');assert.equal(places[1].address,'종로구 이화동 1');
 assert.equal(places[0].detail,'커피전문점');assert.equal(places[0].minutes,2);assert.equal(places[2].minutes,13);
 assert.deepEqual(p.toPlaces('nope','cafe'),[]);
});
await test('parks and libraries keep only places whose category says so',()=>{
 const park=[doc(1,100,{category_name:'여행 > 공원 > 도시근린공원'}),doc(2,90,{category_name:'교통,수송 > 교통시설 > 주차장 > 공영주차장',place_name:'공원 공영주차장'}),doc(3,80,{category_name:'음식점 > 한식',place_name:'공원식당'})];
 assert.deepEqual(p.toPlaces(park,'park').map(x=>x.id),['1']);
 const library=[doc(1,100,{category_name:'문화,예술 > 도서관 > 공공도서관'}),doc(2,90,{category_name:'교육,학습 > 독서실'}),doc(3,95,{category_name:'문화,예술 > 도서관'})];
 assert.deepEqual(p.toPlaces(library,'library').map(x=>x.id),['3','1']);
});
await test('walking time is a slow walk and short distances read in metres',()=>{
 assert.equal(p.walkMinutes(10),1);assert.equal(p.walkMinutes(670),10);assert.equal(p.formatDistance(420),'420m');assert.equal(p.formatDistance(1250),'1.3km');
});
await test('map links carry the kind and a typed area, never coordinates',()=>{
 assert.equal(p.mapLinks('cafe').kakao,'https://map.kakao.com/link/search/'+encodeURIComponent('카페'));
 assert.equal(p.mapLinks('park','모란역').naver,'https://map.naver.com/p/search/'+encodeURIComponent('모란역 공원'));
});
const fake=(routes,calls)=>async(url,init)=>{calls.push({url:new URL(url),auth:init.headers.Authorization});const hit=routes.find(([path])=>new URL(url).pathname.endsWith(path));return hit?hit[1]:{ok:false,json:async()=>({})};};
const ok=documents=>({ok:true,json:async()=>({documents})});
await test('a point searches around itself by distance, with the key only in the header',async()=>{
 const calls=[];const result=await p.searchPlaces({kind:'cafe',lat:37.432,lng:127.129},'secret-key',fake([['/search/category.json',ok([doc(1,200)])]],calls));
 assert.equal(result.near,null);assert.equal(result.places[0].id,'1');assert.equal(calls.length,1);
 const q=calls[0].url.searchParams;assert.equal(q.get('category_group_code'),'CE7');assert.equal(q.get('x'),'127.129');assert.equal(q.get('y'),'37.432');assert.equal(q.get('sort'),'distance');assert.equal(q.get('radius'),'1000');
 assert.equal(calls[0].auth,'KakaoAK secret-key');assert(!calls[0].url.href.includes('secret-key'));
 const parks=[];await p.searchPlaces({kind:'park',lat:37.432,lng:127.129},'k',fake([['/search/keyword.json',ok([])]],parks));assert.equal(parks[0].url.searchParams.get('query'),'공원');
});
await test('an area name is found by place, then by address, and reported back',async()=>{
 const calls=[];const result=await p.searchPlaces({kind:'store',near:'모란역'},'k',fake([['/search/keyword.json',ok([{place_name:'모란역 8호선',x:'127.1290',y:'37.4321'}])],['/search/category.json',ok([doc(7,60,{category_name:'가정,생활 > 편의점 > GS25'})])]],calls));
 assert.equal(result.near,'모란역 8호선');assert.equal(result.places[0].detail,'GS25');assert.equal(calls[1].url.searchParams.get('category_group_code'),'CS2');
 const byAddress=await p.searchPlaces({kind:'cafe',near:'성남대로 1200'},'k',fake([['/search/keyword.json',ok([])],['/search/address.json',ok([{address_name:'경기 성남시 중원구 성남대로 1200',x:'127.13',y:'37.43'}])],['/search/category.json',ok([])]],[]));
 assert.equal(byAddress.near,'경기 성남시 중원구 성남대로 1200');
 await assert.rejects(p.searchPlaces({kind:'cafe',near:'없는동네'},'k',fake([['/search/keyword.json',ok([])],['/search/address.json',ok([])]],[])),e=>e.code==='not_found');
 await assert.rejects(p.searchPlaces({kind:'cafe',near:'파리'},'k',fake([['/search/keyword.json',ok([{place_name:'파리',x:'2.35',y:'48.85'}])]],[])),e=>e.code==='not_found');
 await assert.rejects(p.searchPlaces({kind:'cafe',lat:37.4,lng:127.1},'k',fake([],[])),e=>e.code==='unavailable');
});
await test('every mission that points to a place exists and maps to a known kind',()=>{
 const ids=new Set(j.springMissions.map(m=>m.id));
 for(const [mission,kind] of Object.entries(p.missionPlaces)){assert(ids.has(mission),mission);assert(p.placeKinds.some(k=>k.id===kind));}
});
console.log(`${n} place checks passed. Live Kakao calls and device location are not simulated by these tests.`);
