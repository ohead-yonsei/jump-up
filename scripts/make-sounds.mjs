// Makes the app's sound files with ElevenLabs from the words in scripts/sounds.json.
//   node scripts/make-sounds.mjs            make the files that are missing
//   node scripts/make-sounds.mjs --force id  make one again (several ids allowed)
//   node scripts/make-sounds.mjs --only sfx  only one kind (sfx | music | voice)
//   node scripts/make-sounds.mjs --credits   show how many credits the plan has left, and make nothing
// The key is read from ELEVENLABS_API_KEY or .env.local and is never printed. Nothing about the project or its people is sent:
// only the words in sounds.json. The key stays on this machine; the app itself never calls ElevenLabs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'public','audio');
const args=process.argv.slice(2);
const flag=name=>args.includes('--'+name);
const after=name=>{const i=args.indexOf('--'+name);const list=[];for(let k=i+1;i>=0&&k<args.length&&!args[k].startsWith('--');k++)list.push(args[k]);return list;};
function readKey(){
 if(process.env.ELEVENLABS_API_KEY)return process.env.ELEVENLABS_API_KEY.trim();
 try{return (fs.readFileSync(path.join(root,'.env.local'),'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m)||[])[1]?.trim()||'';}catch{return '';}
}
const key=readKey();if(!key){console.error('ELEVENLABS_API_KEY가 없어요. .env.local에 넣어 주세요.');process.exit(1);}
const api='https://api.elevenlabs.io';const headers={'xi-api-key':key,'Content-Type':'application/json'};
async function credits(){try{const r=await fetch(api+'/v1/user/subscription',{headers});if(!r.ok)return null;const s=await r.json();return {used:s.character_count,limit:s.character_limit,tier:s.tier};}catch{return null;}}
const problem=async r=>{const t=await r.text();try{const d=JSON.parse(t).detail;return typeof d==='string'?d:d?.message||d?.status||JSON.stringify(d).slice(0,200);}catch{return t.slice(0,200);}};
async function make(s){
 const isMusic=s.kind==='music';
 if(s.kind==='voice'){
  const r=await fetch(`${api}/v1/text-to-speech/${s.voice}?output_format=mp3_44100_128`,{method:'POST',headers,body:JSON.stringify({text:s.text,model_id:s.model,voice_settings:{stability:.6,similarity_boost:.8}})});
  if(!r.ok)throw new Error(`${r.status} ${await problem(r)}`);
  return save(s,Buffer.from(await r.arrayBuffer()));
 }
 const url=isMusic?`${api}/v1/music?output_format=mp3_44100_96`:`${api}/v1/sound-generation?output_format=${s.seconds>5?'mp3_44100_96':'mp3_44100_128'}`;
 const body=isMusic?{prompt:s.text,music_length_ms:Math.round(s.seconds*1000),force_instrumental:true,...(s.model?{model_id:s.model}:{})}
  :{text:s.text,duration_seconds:s.seconds,prompt_influence:s.influence??0.5,...(s.loop?{loop:true}:{}),...(s.model?{model_id:s.model}:{})};
 const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
 if(!r.ok)throw new Error(`${r.status} ${await problem(r)}`);
 return save(s,Buffer.from(await r.arrayBuffer()));
}
function save(s,bytes){
 // an MP3 starts with an ID3 tag or a frame sync; anything else is not what was asked for
 if(bytes.length<800||!(bytes.subarray(0,3).toString('latin1')==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0)))throw new Error('소리 파일이 아닌 응답이에요');
 const file=path.join(out,s.id+'.mp3');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
 return bytes.length;
}
const {sounds,voices}=JSON.parse(fs.readFileSync(path.join(root,'scripts','sounds.json'),'utf8'));
// The keeper's candidate voices: six syllables and one line each, spoken by a voice saved in the account.
for(const v of voices?.list??[]){
 for(const [name,text] of Object.entries(voices.syllables))sounds.push({id:`keeper/${v.key}-${name}`,kind:'voice',voice:v.id,text,model:voices.model});
 sounds.push({id:`keeper/${v.key}-line`,kind:'voice',voice:v.id,text:voices.line,model:voices.model});
}
const before=await credits();if(before)console.log(`크레딧: ${before.used} / ${before.limit} 사용 (${before.tier})`);
if(flag('credits'))process.exit(0);
const force=new Set(after('force'));const only=after('only')[0];
let made=0,failed=0;
for(const s of sounds){
 if(only&&s.kind!==only)continue;
 const file=path.join(out,s.id+'.mp3');
 if(fs.existsSync(file)&&!force.has(s.id)){continue;}
 if(force.size&&!force.has(s.id)&&fs.existsSync(file))continue;
 try{const size=await make(s);made++;console.log(`만듦  ${s.id}.mp3  ${s.seconds?s.seconds+'초  ':''}${(size/1024).toFixed(0)}KB`);}
 catch(e){failed++;console.log(`실패  ${s.id}: ${e.message}`);}
}
const end=await credits();
console.log(`${made}개 만들고 ${failed}개 실패했어요.`+(before&&end?` 쓴 크레딧: ${end.used-before.used} (남은 것 ${end.limit-end.used})`:''));
