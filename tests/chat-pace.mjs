import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const out=new URL('../.test-build/',import.meta.url);await fs.mkdir(out,{recursive:true});
for(const name of ['chat-pace','chat-service','content']){const src=await fs.readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');await fs.writeFile(new URL(name+'.js',out),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '\.\/([\w-]+)'/g,"from './$1.js'"))}
const p=await import(new URL('chat-pace.js',out));const api=await import(new URL('chat-service.js',out));const c=await import(new URL('content.js',out));let n=0;const test=async(name,fn)=>{await fn();n++;console.log('PASS '+name)};
await test('a reply is sent as one or two messages: the reaction first, the question last; short ones stay whole',()=>{
 assert.deepEqual(p.bubbles('네, 따뜻하게 준비할게요. 매장에서 드시나요, 가져가시나요?'),['네, 따뜻하게 준비할게요.','매장에서 드시나요, 가져가시나요?']);
 assert.deepEqual(p.bubbles('그랬구나, 집에서 푹 쉬는 것도 좋지. 나는 요즘 산책해. 요즘 재밌게 보는 거 있어?'),['그랬구나, 집에서 푹 쉬는 것도 좋지.','나는 요즘 산책해. 요즘 재밌게 보는 거 있어?']);
 assert.deepEqual(p.bubbles('응, 반가워! 잘 지냈어?'),['응, 반가워! 잘 지냈어?']);assert.deepEqual(p.bubbles('네, 천천히 보세요.'),['네, 천천히 보세요.']);
 assert.deepEqual(p.bubbles('네, 따뜻하게 준비할게요. 매장에서 드시나요, 가져가시나요?',1),['네, 따뜻하게 준비할게요. 매장에서 드시나요, 가져가시나요?']);assert.deepEqual(p.bubbles('  '),[]);
 for(const s of c.scenarios)for(const line of [s.opening,...s.prompts]){const parts=p.bubbles(line);assert(parts.length>=1&&parts.length<=2,line);assert.equal(parts.join(' '),line.trim(),line);}
});
await test('reading and typing take a human moment, and never keep anyone waiting long',()=>{
 assert(p.readMs('')>=300&&p.readMs('가'.repeat(600))<=1100);assert(p.typeMs('네.')>=650&&p.typeMs('가'.repeat(400))<=2200);assert(p.typeMs('따뜻하게 준비할게요. 매장에서 드시나요?')>p.typeMs('네, 좋아요.'));
 const worst=p.readMs('가'.repeat(600))+p.typeMs('가'.repeat(90))+p.BETWEEN_MS+p.typeMs('가'.repeat(90));assert(worst<=6000,'two full messages: '+worst);
});
await test('messages sent in a row are one turn for the model, so the history still alternates and ends where it should',()=>{
 const shown=[{role:'assistant',content:'어서 오세요.'},{role:'assistant',content:'어떤 음료로 드릴까요?'},{role:'user',content:'아메리카노 주세요.'},{role:'assistant',content:'네, 아메리카노요.'},{role:'assistant',content:'따뜻하게 드릴까요?'}];
 const turns=p.asTurns(shown);assert.deepEqual(turns.map(t=>t.role),['assistant','user','assistant']);assert.equal(turns[0].content,'어서 오세요. 어떤 음료로 드릴까요?');assert.equal(shown[0].content,'어서 오세요.','the screen keeps its own messages');
 assert(api.validateHints({scenario:'cafe',consent:true,messages:turns}));assert(api.validateChat({scenario:'cafe',consent:true,messages:p.asTurns([...shown,{role:'user',content:'따뜻하게요.'}])}));
});
await test('asked whether it is an AI, the partner says so; lines about oneself are left to the conversation',async()=>{
 for(const q of ['혹시 AI예요?','너 AI야?','AI세요?','인공지능이에요?','챗봇이죠?','로봇 같아','진짜 사람이에요?','너 사람이야?','사람 맞아?'])assert(p.asksIfAi(q),q);
 for(const q of ['저는 낯가리는 사람이에요.','제 전공은 AI예요.','아메리카노 주세요.','사람이 많은 곳은 조금 어려워요.','요즘 AI 관련 영상을 가끔 봐요.','나는 그냥 집에서 지냈어.',''])assert(!p.asksIfAi(q),q);
 assert.match(p.honestLine('cafe',true),/AI예요/);assert.match(p.honestLine('hello',true),/AI야/);assert.doesNotMatch(p.honestLine('cafe',false),/AI/);assert.match(p.honestLine('hello',false),/준비된 문장/);
 for(const id of c.scenarios.map(s=>s.id))for(const live of [true,false])assert(api.keepsSpeech(id,p.honestLine(id,live)),id+' keeps its speech level');
 const noCall=()=>{throw new Error('must not call the model');};
 const team=await api.generateTeamReply({scenario:'hello',consent:true,messages:[{role:'user',content:'너 AI야?'}]},{base:'https://example.test',model:'m'},noCall);assert.match(team.reply,/AI야/);assert.equal(team.done,false);assert.equal(team.support,false);
 const open=await api.generateReply({scenario:'cafe',consent:true,messages:[{role:'user',content:'혹시 AI예요?'}]},'k','m',noCall);assert.match(open.reply,/AI예요/);
});
await test('the role-play prompt asks for a natural spoken voice and keeps its guardrails',()=>{
 for(const id of c.scenarios.map(s=>s.id)){const text=api.systemPrompt(id);assert.match(text,/자연스러운 입말/);assert.match(text,/이유나 사정은 묻지 마/);assert.match(text,/개인정보는 묻지 마/);}
});
console.log(`${n} chat pace checks passed.`);
