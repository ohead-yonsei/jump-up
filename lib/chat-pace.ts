// How the practice partner's reply reaches the screen: like a person texting, not a machine answering at once.
// A line is read for a moment, typed for a while, and sent as one or two short messages.
// The partner never pretends to be a person: asked whether it is an AI, it says so plainly (see `asksIfAi`).
import type {ScenarioId} from './content';
export type Turn={role:'user'|'assistant';content:string};
const sentences=(t:string)=>t.split(/(?<=[.!?…~])\s+|\n+/u).map(x=>x.trim()).filter(Boolean);
/** One or two messages: the reaction first, the rest (with its closing question) after. Short replies stay whole. */
export function bubbles(reply:string,max=2):string[]{
 const text=reply.trim();if(!text)return [];const parts=sentences(text);
 if(max<2||parts.length<2||text.length<=26)return [text];
 return [parts[0],parts.slice(1).join(' ')];
}
/** A moment to read what was just said before starting to type. */
export const readMs=(said:string)=>Math.min(1100,350+[...said].length*18);
/** Typing time for one message. Long ones are capped so nobody is kept waiting. */
export const typeMs=(text:string)=>Math.min(2200,Math.max(650,[...text].length*55));
/** The pause between two messages sent in a row. */
export const BETWEEN_MS=420;
/** Messages sent in a row by one speaker are one turn for the model and for the example dialog. */
export function asTurns<T extends Turn>(messages:T[]):Turn[]{
 const out:Turn[]=[];for(const m of messages){const last=out.at(-1);if(last&&last.role===m.role)last.content+=' '+m.content;else out.push({role:m.role,content:m.content});}
 return out;
}
/**
 * True when someone asks whether they are talking to a machine or a person.
 * Lines about themselves ("저는 낯가리는 사람이에요") and long sentences are left to the conversation.
 */
export function asksIfAi(text:string){
 const t=text.trim();if(!t||[...t].length>40||/(저는|제가|제 |전 |나는|내가|내 |난 )/u.test(t))return false;
 return /(AI|에이아이|인공지능|챗봇|로봇|기계)\s*(이?(야|니|냐|지|죠|에요|세요)|예요|인가요|입니까|맞|아니|같)/iu.test(t)
  ||/(진짜|실제)\s*사람\s*(이야|이니|이냐|이에요|인가요|입니까|이세요|맞|아니)/u.test(t)
  ||/사람\s*(이야|이니|이냐|이에요|인가요|입니까|이세요|맞아|맞죠|맞나요|아니야|아니에요|아니죠)\s*\?/u.test(t);
}
const casual=(id:ScenarioId)=>id==='hello';
/** The straight answer, in the scenario's speech level. `live` is the AI conversation; otherwise the prepared lines. */
export function honestLine(id:ScenarioId,live:boolean){
 if(casual(id))return live?'응, 나는 연습을 돕는 AI야. 편하게 이어서 얘기해줘.':'나는 준비된 문장으로 답하는 연습 상대야. 편하게 이어서 얘기해줘.';
 return live?'네, 저는 연습을 돕는 AI예요. 편하게 이어서 말씀해 주세요.':'저는 준비된 문장으로 답하는 연습 상대예요. 편하게 이어서 말씀해 주세요.';
}
