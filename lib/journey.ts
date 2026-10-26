import type {Energy, Mission} from './content';
export type Goal = 'rhythm' | 'outside' | 'connect';
export type SpringStage = 0 | 1 | 2 | 3;
export type JourneyProfile = {version:1; outside:SpringStage; connection:SpringStage; goal:Goal; stage:SpringStage; completed:string[]};
export type SpringMission = Mission & {goal:Goal; springStage:SpringStage};
export const goals = [
 {id:'rhythm' as Goal,title:'내 일상 돌보기',description:'작은 생활 리듬을 만들고 싶어요.',icon:'sun'},
 {id:'outside' as Goal,title:'바깥과 가까워지기',description:'편한 만큼 밖으로 나가보고 싶어요.',icon:'walk'},
 {id:'connect' as Goal,title:'사람과 연결되기',description:'한마디를 나누는 연습을 하고 싶어요.',icon:'chat'},
];
export const outsideOptions=['지금은 방 안이 가장 편해요','집 안이나 문 앞까지는 괜찮아요','익숙한 집 근처는 다닐 수 있어요','익숙한 가게나 공간에 갈 수 있어요'];
export const connectionOptions=['아직은 혼자 있는 시간이 필요해요','보내지 않을 말을 적어볼 수 있어요','편한 사람과 짧은 안부는 괜찮아요','새로운 대화도 조금 연습하고 싶어요'];
export const springStages=[
 {title:'포근한 둥지',short:'둥지',description:'지금 있는 곳에서 나를 돌봐요.'},
 {title:'작은 기지개',short:'기지개',description:'익숙한 곳에서 조금 움직여봐요.'},
 {title:'첫 징검다리',short:'징검다리',description:'편한 바깥과 연결을 시도해요.'},
 {title:'넓어지는 연못',short:'연못',description:'궁금한 일상을 내 속도로 만나봐요.'},
] as const;
export function createProfile(outside:SpringStage,connection:SpringStage,goal:Goal):JourneyProfile {
 return {version:1,outside,connection,goal,stage:goal==='outside'?outside:goal==='connect'?connection:0,completed:[]};
}
export function profileFromChoices(previous:JourneyProfile|null,outside:SpringStage,connection:SpringStage,goal:Goal):JourneyProfile {
 if(previous&&previous.outside===outside&&previous.connection===connection&&previous.goal===goal)return {...previous,completed:[...previous.completed]};
 return createProfile(outside,connection,goal);
}
export function validProfile(value:unknown):JourneyProfile|null {
 if(!value||typeof value!=='object')return null;
 const p=value as JourneyProfile;const level=(v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=3;
 if(p.version!==1||!level(p.outside)||!level(p.connection)||!level(p.stage)||!goals.some(g=>g.id===p.goal)||!Array.isArray(p.completed))return null;
 return {...p,completed:p.completed.filter(v=>typeof v==='string'&&springMissions.some(m=>m.id===v)).slice(-100)};
}
type Seed=[string,string,string,string,string[]];
const sets:Record<Goal,Seed[][]>={
 rhythm:[
  [['water','물 한 모금 마시기','손이 닿는 곳에서 시작해요.','1분',['가까이 물이 있다면 편한 자리에 놓아요.','편한 만큼 한 모금 마셔요.','여기까지 해도 충분해요.']],['color','주변의 색 하나 찾기','눈에 들어오는 색을 가만히 골라요.','1분',['편한 자세로 주변을 봐요.','눈에 들어오는 색 하나를 마음속으로 불러요.','다시 편하게 쉬어요.']]],
  [['curtain','커튼을 조금 열어보기','오늘의 빛을 편한 만큼 들여요.','1분',['커튼 가까이 가요.','원하는 만큼 조금 열어요.','달라진 빛을 잠깐 바라봐요.']],['tidy','물건 하나 제자리로','딱 하나만 옮겨도 충분해요.','2분',['옮기기 쉬운 물건을 골라요.','있으면 좋을 곳에 놓아요.','나머지는 그대로 두어도 괜찮아요.']]],
  [['stretch','내가 정한 시간에 기지개','작은 리듬 하나를 골라봐요.','2분',['오늘 편한 시간을 정해요.','그때 몸이 편한 범위에서 기지개를 켜요.','불편하면 멈추고 쉬어요.']],['snack','간단한 먹거리 챙기기','익숙한 음식으로 나를 챙겨요.','5분',['먹을 수 있는 익숙한 음식을 골라요.','편한 곳에 두어요.','먹을지, 얼마나 먹을지는 내가 정해요.']]],
  [['routine','내일의 작은 루틴 고르기','내일도 하고 싶은 작은 일 하나.','3분',['최근 해본 일 중 편했던 것을 떠올려요.','내일 해보고 싶은 시간대를 골라요.','계획이 달라져도 괜찮아요.']],['hobby','좋아하는 일 5분','취향이 머무는 시간을 만들어요.','5분',['음악, 그림 등 좋아하는 것을 하나 골라요.','편한 만큼 잠깐 해봐요.','끝까지 완성하지 않아도 괜찮아요.']]],
 ],
 outside:[
  [['window','창밖을 10초 바라보기','밖으로 나가지 않아도 시작이에요.','1분',['창문이 편하지 않다면 주변을 바라봐요.','빛이나 색 하나를 찾아요.','원할 때 시선을 돌려요.']],['weather','오늘의 날씨 살펴보기','바깥 소식을 가볍게 만나봐요.','1분',['창밖이나 날씨 화면을 봐요.','지금 날씨를 한 단어로 떠올려요.','나갈 준비는 하지 않아도 괜찮아요.']]],
  [['door','문 앞까지 가보기','문을 열지 않아도 괜찮아요.','2분',['집 안에서 편한 문 하나를 골라요.','그 앞까지 가봐요.','원할 때 돌아와요.']],['shoes','편한 신발 꺼내보기','준비만 해보는 것도 작은 시도예요.','2분',['신었을 때 편한 신발을 골라요.','손에 들거나 잠깐 신어봐요.','밖에 나갈지는 나중에 정해요.']]],
  [['walk','익숙한 길 3분 걷기','멀리보다, 편한 만큼만.','3분',['날씨와 주변이 안전한지 살펴요.','익숙한 길을 짧게 걸어요.','언제든 돌아와도 괜찮아요.']],['air','가까운 바깥 공기 만나기','익숙한 장소에 잠깐 머물러요.','2분',['안전한 집 근처 공간을 골라요.','잠깐 머무르며 주변을 봐요.','짧게 다녀와도 충분해요.']]],
  [['shop','익숙한 가게 둘러보기','물건을 사지 않아도 좋아요.','5분',['가본 적 있는 가까운 가게를 골라요.','편한 만큼 둘러봐요.','원하면 언제든 돌아와요.']],['place','관심 있는 공간 살펴보기','방문 전에 정보부터 만나봐요.','5분',['도움 찾기에서 가까운 공간을 골라요.','운영 시간과 위치를 살펴요.','방문이나 신청은 나중에 결정해요.']]],
 ],
 connect:[
  [['word','지금 마음을 한 단어로','누구에게도 보여주지 않아도 돼요.','1분',['편한 자세로 잠깐 머물러요.','지금 떠오르는 단어 하나를 생각해요.','정확한 표현이 아니어도 괜찮아요.']],['person','편했던 사람 떠올리기','연락하지 않고 기억만 해봐요.','1분',['조금 편했던 사람이나 장면을 떠올려요.','떠오르지 않으면 좋아하는 캐릭터도 괜찮아요.','오늘 연락할 필요는 없어요.']]],
  [['draft','보내지 않을 안부 한 줄','연결의 시작을 나 혼자 연습해요.','2분',['메모장이나 종이를 준비해요.','“잘 지내?”처럼 짧게 적어요.','보내지 않고 닫아도 괜찮아요.']],['voice','인사 한마디 작게 해보기','내 공간에서 말문을 열어요.','1분',['편한 곳에 있어요.','“안녕”을 마음속이나 작은 소리로 말해요.','더 말하고 싶지 않으면 여기서 멈춰요.']]],
  [['hello','편한 사람에게 짧은 안부','전송은 끝까지 나의 선택이에요.','3분',['연락해도 괜찮은 사람을 떠올려요.','짧은 안부를 적어요.','보내거나 저장해요. 답장을 기다리지 않아도 돼요.']],['practice','카페 주문 미리 연습하기','실제 대화 전, 안전한 연습부터.','3분',['대화 연습에서 카페 주문을 골라요.','편한 만큼 예시 문장을 연습해요.','연습 후 이 미션으로 돌아와 기록해요.']]],
  [['thanks','작은 감사 한마디','일상의 짧은 대화를 만나봐요.','3분',['편한 상황이 생겼을 때만 시도해요.','“감사합니다”를 작게 전해봐요.','기회가 없으면 혼자 연습해도 괜찮아요.']],['community','관심 모임 소개 읽어보기','참여를 정하기 전에 알아가요.','5분',['도움 찾기나 알고 있는 공식 공간을 살펴요.','관심 가는 활동의 소개를 읽어요.','신청하지 않고 닫아도 괜찮아요.']]],
 ],
};
export const springMissions:SpringMission[]=goals.flatMap(g=>sets[g.id].flatMap((group,index)=>group.map(([id,title,description,minutes,steps])=>({id:`${g.id}-${id}`,title,description,minutes,steps,goal:g.id,springStage:index as SpringStage,category:g.title,min:1,max:5,icon:g.icon}))));
export function energyCeiling(energy:Energy):SpringStage{return Math.min(3,energy-1) as SpringStage;}
export function recommendSpring(profile:JourneyProfile,energy:Energy,offset=0):SpringMission[]{
 const ceiling=Math.min(profile.stage,energyCeiling(energy));
 const pool=springMissions.filter(m=>m.goal===profile.goal&&m.springStage<=ceiling).sort((a,b)=>b.springStage-a.springStage);
 const i=((offset%pool.length)+pool.length)%pool.length;
 return Array.from({length:Math.min(3,pool.length)},(_,n)=>pool[(i+n)%pool.length]);
}
export function markSpringComplete(profile:JourneyProfile,missionId:string):JourneyProfile {
 const m=springMissions.find(m=>m.id===missionId);
 if(!m||m.goal!==profile.goal||m.springStage>profile.stage)return profile;
 return {...profile,completed:[...new Set([...profile.completed,missionId])]};
}
export function canJump(profile:JourneyProfile){return profile.stage<3&&springMissions.some(m=>m.goal===profile.goal&&m.springStage===profile.stage&&profile.completed.includes(m.id));}
export function jump(profile:JourneyProfile):JourneyProfile{return canJump(profile)?{...profile,stage:(profile.stage+1) as SpringStage}:profile;}
export const demoProfile=()=>createProfile(0,0,'outside');
