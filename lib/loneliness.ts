/**
 * 외로움과 사회적 고립 척도 (Loneliness and Social Isolation Scale), 여섯 문항.
 * text and options keep the wording printed on the scale. In the start talk the keeper does not read them out like a survey:
 * ask is how the keeper puts the item, chat are the same four options in spoken words (same order, same scores), echo is what the keeper says back.
 * Rewording a validated scale can shift answers a little; the printed wording stays here so the two can be compared.
 * Every option carries its printed score, so reversed items (3–6) need no extra rule.
 * Total 0–18, higher = lonelier / more isolated.
 */
export type ScaleOption={label:string;score:0|1|2|3};
export type ScaleItem={id:string;text:string;options:ScaleOption[];ask:string;chat:string[];echo:string[]};
const agree=(reversed:boolean):ScaleOption[]=>['거의 그렇지 않다','다소 그렇지 않다','다소 그렇다','매우 그렇다'].map((label,i)=>({label,score:(reversed?3-i:i) as 0|1|2|3}));
const counted=(labels:string[]):ScaleOption[]=>labels.map((label,i)=>({label,score:(3-i) as 0|1|2|3}));
export const scaleItems:ScaleItem[]=[
 {id:'lonely',text:'나는 외롭다고 느낀다',options:agree(false),ask:'요즘 외롭다고 느낄 때가 있어요?',chat:['거의 없어요','별로 없어요','가끔 있어요','자주 있어요'],echo:['외롭다고 느낄 때는 거의 없군요.','외로울 때가 별로 없군요.','가끔 외로울 때가 있군요.','자주 외롭군요. 말해줘서 고마워요.']},
 {id:'left-out',text:'나는 소외되어 있다고 느낀다',options:agree(false),ask:'나만 동떨어진 것 같은, 소외된 느낌이 들 때도 있어요?',chat:['거의 없어요','별로 없어요','가끔 있어요','자주 있어요'],echo:['그런 느낌은 거의 없군요.','그런 느낌은 별로 없군요.','가끔 그런 느낌이 드는군요.','자주 그렇게 느끼는군요. 그럴 수 있어요.']},
 {id:'lean',text:'나는 가족이나 친구들에게 편하게 의지할 수 있다',options:agree(true),ask:'힘들 때 가족이나 친구에게 편하게 기댈 수 있어요?',chat:['거의 못 해요','잘 안 돼요','어느 정도는요','편하게 기대요'],echo:['지금은 기대기가 어렵군요.','기대는 게 쉽지는 않군요.','어느 정도는 기댈 수 있군요.','편하게 기댈 사람이 있군요.']},
 {id:'help',text:'나의 일상적인 일에 도움을 줄 수 있는 사람이 있다',options:agree(true),ask:'평소에 도움이 필요할 때, 도와줄 사람이 곁에 있어요?',chat:['거의 없어요','별로 없어요','조금 있어요','든든하게 있어요'],echo:['지금은 도와줄 사람이 거의 없군요.','도와줄 사람이 별로 없군요.','도와줄 사람이 조금은 있군요.','든든한 사람이 곁에 있군요.']},
 {id:'close',text:'월 1회 이상 사적으로 만나거나 주 1회 이상 연락을 할 정도로 친한 사람은 몇 명입니까? (가족, 친척, 친구 포함)',options:counted(['0명','1-2명','3-6명','7명 이상']),ask:'한 달에 한 번은 만나거나 일주일에 한 번은 연락하는, 가까운 사람은 몇 명쯤 돼요? 가족도 포함해서요.',chat:['없어요','한두 명','3~6명','7명 넘어요'],echo:['지금은 그런 사람이 없군요.','한두 명 있군요.','몇 명 있군요.','가까운 사람이 여럿 있군요.']},
 {id:'contact',text:'친구나 가족과 사적인 연락을 하는데 하루 중 평균 몇 분 정도를 사용하십니까? (전화, 문자, 카카오톡 등 메신저)',options:counted(['전혀 안 함','15분 이하','15분-1시간','1시간 이상']),ask:'가족이나 친구랑 전화나 카톡은 하루에 얼마나 하는 편이에요?',chat:['거의 안 해요','15분 안쪽','15분~1시간','1시간 넘게'],echo:['연락은 거의 안 하는 편이군요.','짧게 연락하는 편이군요.','어느 정도 연락하며 지내는군요.','연락을 꽤 자주 하는군요.']},
];
export type ScaleLevel=1|2|3|4|5;
/** What the device keeps: the picked option index (0–3, left to right as printed) per item, and when. */
export type ScaleResult={answers:number[];total:number;level:ScaleLevel;at:string};
export const SCALE_MAX=18;
export function scaleTotal(answers:number[]):number|null {
 if(answers.length!==scaleItems.length)return null;let total=0;
 for(let i=0;i<scaleItems.length;i++){const option=scaleItems[i].options[answers[i]];if(!option)return null;total+=option.score;}
 return total;
}
/**
 * Five bands over 0–18. These bands are ours (even split: 0–3, 4–7, 8–11, 12–15, 16–18), not cut-offs published with the scale.
 * They only pick a gentle starting point; they are not a diagnosis.
 */
export const scaleLevel=(total:number):ScaleLevel=>total<=3?1:total<=7?2:total<=11?3:total<=15?4:5;
/** Never shown as a number or a rank: one plain line per level for the review screen. */
export const levelLines:Record<ScaleLevel,string>={1:'사람들과 자주 닿아 있어요',2:'대체로 닿아 있어요',3:'닿을 때도, 멀 때도 있어요',4:'요즘은 조금 멀게 느껴져요',5:'요즘은 혼자인 시간이 많아요'};
/** The connection step (0 혼자 있는 시간 … 3 새로운 대화) that missions start from. */
export const connectionFromLevel=(level:ScaleLevel):0|1|2|3=>([3,3,2,1,0] as const)[level-1];
export function scaleResult(answers:number[],at=new Date()):ScaleResult|null {
 const total=scaleTotal(answers);if(total===null)return null;
 return {answers:[...answers],total,level:scaleLevel(total),at:at.toISOString().slice(0,10)};
}
export function validScale(value:unknown):ScaleResult|null {
 if(!value||typeof value!=='object')return null;const v=value as ScaleResult;
 if(!Array.isArray(v.answers)||typeof v.at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.at))return null;
 const total=scaleTotal(v.answers);if(total===null)return null;
 return {answers:[...v.answers],total,level:scaleLevel(total),at:v.at};
}
