import type {Energy, Mission} from './content';
export type Goal = 'rhythm' | 'outside' | 'connect';
export type SpringStage = 0 | 1 | 2 | 3;
// 4 = 일상은 잘 지내지만 가끔 다시 혼자 있고 싶은, 고립과 일상을 오가는 리듬.
export type OutsideLevel = SpringStage | 4;
export type JourneyProfile = {version:1; outside:OutsideLevel; connection:SpringStage; goal:Goal; stage:SpringStage; completed:string[]};
export type SpringMission = Mission & {goal:Goal; springStage:SpringStage};
export const goals = [
 {id:'rhythm' as Goal,title:'내 일상 돌보기',description:'작은 생활 리듬을 만들고 싶어요.',icon:'sun'},
 {id:'outside' as Goal,title:'바깥과 가까워지기',description:'편한 만큼 밖으로 나가보고 싶어요.',icon:'walk'},
 {id:'connect' as Goal,title:'사람과 연결되기',description:'한마디를 나누는 연습을 하고 싶어요.',icon:'chat'},
];
export const outsideOptions=['지금은 방 안이 가장 편해요','집 안이나 문 앞까지는 괜찮아요','익숙한 집 근처는 다닐 수 있어요','익숙한 가게나 공간에 갈 수 있어요','일상 생활을 잘 지내고 있지만 가끔 다시 혼자 있고 싶어요'];
export const WAVE:OutsideLevel=4;
export const isWave=(profile:Pick<JourneyProfile,'outside'>|null)=>profile?.outside===WAVE;
export const connectionOptions=['아직은 혼자 있는 시간이 필요해요','보내지 않을 말을 적어볼 수 있어요','편한 사람과 짧은 안부는 괜찮아요','새로운 대화도 조금 연습하고 싶어요'];
export const springStages=[
 {title:'포근한 둥지',short:'둥지',description:'지금 있는 곳에서 나를 돌봐요.'},
 {title:'작은 기지개',short:'기지개',description:'익숙한 곳에서 조금 움직여봐요.'},
 {title:'첫 징검다리',short:'징검다리',description:'편한 바깥과 연결을 시도해요.'},
 {title:'넓어지는 연못',short:'연못',description:'궁금한 일상을 내 속도로 만나봐요.'},
] as const;
export function createProfile(outside:OutsideLevel,connection:SpringStage,goal:Goal):JourneyProfile {
 return {version:1,outside,connection,goal,stage:goal==='outside'?Math.min(outside,3) as SpringStage:goal==='connect'?connection:0,completed:[]};
}
export function profileFromChoices(previous:JourneyProfile|null,outside:OutsideLevel,connection:SpringStage,goal:Goal):JourneyProfile {
 if(previous&&previous.outside===outside&&previous.connection===connection&&previous.goal===goal)return {...previous,completed:[...previous.completed]};
 return createProfile(outside,connection,goal);
}
export function validProfile(value:unknown):JourneyProfile|null {
 if(!value||typeof value!=='object')return null;
 const p=value as JourneyProfile;const level=(v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=3;
 if(p.version!==1||!(level(p.outside)||p.outside===WAVE)||!level(p.connection)||!level(p.stage)||!goals.some(g=>g.id===p.goal)||!Array.isArray(p.completed))return null;
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
// 피드백(미션이 반복돼 보여요)을 반영해 목표·단계마다 4개씩 더했어요.
const more:Record<Goal,Seed[][]>={
 rhythm:[
  [['breath','숨 세 번 천천히 쉬기','몸이 먼저 편해지는 시간이에요.','1분',['편한 자세로 앉거나 누워요.', '코로 천천히 들이쉬고 입으로 길게 내쉬어요.', '세 번이면 충분해요.']],['blanket','이불 한 번 쓸어 펴기','구겨진 이불을 한 번만 쓸어줘요.','1분',['누운 채로 해도 괜찮아요.', '손으로 이불을 한 번 쓸어 펴요.', '반듯하지 않아도 충분해요.']],['song','좋아하는 노래 한 곡 듣기','귀로 먼저 기분을 데워요.','3분',['떠오르는 노래 하나를 골라요.', '편한 소리 크기로 들어요.', '끝까지 듣지 않아도 괜찮아요.']],['wash','시원한 물로 손 씻기','손끝부터 하루를 깨워요.','1분',['가까운 세면대로 가요.', '시원한 물에 손을 적셔요.', '수건으로 닦고 돌아와요.']]],
  [['sunlight','창가에서 햇빛 1분 쬐기','몸에게 낮이라는 신호를 줘요.','1분',['창가에 편하게 서거나 앉아요.', '햇빛이 닿는 곳에 잠깐 머물러요.', '눈부시면 바로 자리를 옮겨요.']],['fold','마른 옷 하나 개기','딱 한 벌이면 충분해요.','2분',['손에 닿는 옷 하나를 골라요.', '편한 방식으로 개어요.', '나머지는 그대로 두어도 괜찮아요.']],['cup','컵 하나 씻어두기','다음 한 모금을 위한 준비예요.','2분',['쓰던 컵 하나를 들고 가요.', '물로 헹구거나 씻어요.', '보이는 곳에 두면 끝이에요.']],['brush','양치하며 나를 챙기기','입안이 개운하면 기분도 조금 가벼워져요.','3분',['칫솔과 치약을 준비해요.', '편한 만큼 양치해요.', '물로 헹구면 끝이에요.']]],
  [['alarm','일어날 시간 알람 하나 맞추기','내일 아침을 위한 작은 신호예요.','1분',['내일 일어나고 싶은 시간을 떠올려요.', '알람 하나만 맞춰요.', '못 일어나도 괜찮은 약속이에요.']],['meal','정해둔 시간에 한 끼 먹기','시간을 정하면 하루에 기둥이 생겨요.','10분',['오늘 먹고 싶은 시간을 정해요.', '그 시간에 먹을 수 있는 것을 먹어요.', '양은 내가 정해요.']],['trash','쓰레기 한 봉지 묶어두기','방 안 공기가 조금 가벼워져요.','5분',['눈에 띄는 쓰레기를 한 봉지에 모아요.', '봉지를 묶어 문 가까이 둬요.', '버리러 나가는 건 나중에 해도 돼요.']],['wipe','책상 한 칸 닦기','작은 공간 한 곳만 깨끗하게.','3분',['책상이나 창틀 한 곳을 골라요.', '물티슈나 걸레로 쓱 닦아요.', '한 칸이면 충분해요.']]],
  [['cook','간단한 요리 하나 해보기','달걀 하나, 채소 한 줌이면 충분해요.','15분',['쉽게 할 수 있는 메뉴를 골라요.', '불과 칼은 조심히 써요.', '맛이 없어도 괜찮아요. 해본 게 중요해요.']],['diary','오늘 하루 세 줄 쓰기','잘한 일이 아니어도 괜찮아요.','5분',['종이나 메모 앱을 열어요.', '오늘 있었던 일 세 가지를 적어요.', '읽어보지 않고 닫아도 돼요.']],['week','이번 주 해보고 싶은 일 적기','해야 할 일 말고, 해보고 싶은 일.','5분',['작아도 좋은 일 세 가지를 떠올려요.', '적어두기만 해요.', '하나도 못 해도 괜찮아요.']],['learn','궁금했던 것 10분 배워보기','짧은 영상이나 글 하나면 충분해요.','10분',['요즘 궁금했던 것을 하나 골라요.', '짧은 영상이나 글을 찾아봐요.', '다 이해하지 않아도 괜찮아요.']]],
 ],
 outside:[
  [['sound','창밖 소리 가만히 듣기','나가지 않아도 바깥을 만날 수 있어요.','1분',['편한 자리에 앉아요.', '들려오는 소리 하나에 귀를 기울여요.', '시끄러우면 바로 멈춰요.']],['photo','가고 싶은 곳 사진 한 장 찾기','언젠가 가보고 싶은 곳을 구경해요.','2분',['검색이나 지도 앱을 열어요.', '마음이 가는 장소 사진을 하나 찾아요.', '저장만 해두어도 좋아요.']],['map','지도 앱으로 우리 동네 둘러보기','화면으로 먼저 익숙해져요.','3분',['지도 앱에서 우리 집 주변을 열어요.', '가까운 공원이나 가게를 찾아봐요.', '직접 갈 필요는 없어요.']],['breeze','창문 열고 바람 1분 느끼기','바깥 공기가 방 안으로 들어와요.','1분',['창문을 편한 만큼 열어요.', '바람이 닿는 곳에 잠깐 있어요.', '추우면 바로 닫아요.']]],
  [['porch','현관이나 베란다에 1분 서 있기','집과 바깥의 경계에서 잠깐 머물러요.','2분',['현관이나 베란다로 가요.', '1분 정도 그대로 서 있어요.', '편하지 않으면 바로 들어와요.']],['outfit','나갈 때 입을 옷 골라두기','준비만 해도 문이 가까워져요.','2분',['편하고 익숙한 옷을 골라요.', '보이는 곳에 걸어두거나 놓아요.', '오늘 입지 않아도 괜찮아요.']],['bag','작은 가방 챙겨두기','폰, 지갑, 물 하나면 충분해요.','3분',['가벼운 가방 하나를 꺼내요.', '꼭 필요한 것만 넣어요.', '문 가까이에 두어요.']],['mailbox','우편함이나 택배 확인하기','집 바로 앞까지 다녀오는 작은 외출.','3분',['편한 옷차림 그대로 나가요.', '우편함이나 문 앞을 확인해요.', '바로 돌아와도 충분해요.']]],
  [['store','편의점에서 작은 것 하나 사기','물 한 병이어도 충분해요.','10분',['가장 가까운 편의점을 떠올려요.', '살 것 하나를 미리 정해요.', '계산이 걱정되면 먼저 대화 연습을 해봐요.']],['bench','가까운 벤치에 앉았다 오기','걷지 않고 머무르기만 해도 돼요.','5분',['집 가까운 벤치를 떠올려요.', '앉아서 주변을 잠깐 봐요.', '언제든 일어나 돌아와요.']],['stop','버스 정류장까지 가보기','타지 않아도 괜찮아요.','5분',['가까운 정류장을 지도에서 찾아요.', '정류장까지 걸어가 봐요.', '버스는 보기만 하고 돌아와도 돼요.']],['quiet','사람 적은 시간에 산책하기','내가 편한 시간대를 골라요.','10분',['이른 아침이나 늦은 저녁처럼 조용한 시간을 골라요.', '밝고 안전한 길로 걸어요.', '짧게 다녀와도 충분해요.']]],
  [['takeout','카페 음료 한 잔 포장해오기','연습한 주문을 실제로 해봐요.','15분',['익숙하거나 한적한 카페를 골라요.', '대화 연습의 문장을 떠올려요.', '주문이 어려우면 메뉴만 보고 와도 괜찮아요.']],['library','도서관이나 서점 들러보기','조용한 공간은 머물기 편해요.','20분',['가까운 도서관이나 서점을 찾아요.', '좋아하는 분야 책장을 둘러봐요.', '아무것도 빌리지 않아도 돼요.']],['park','조금 먼 공원까지 걷기','평소보다 한 블록만 더.','20분',['지도에서 걸어갈 수 있는 공원을 찾아요.', '물과 휴대폰을 챙겨요.', '힘들면 중간에 돌아와도 돼요.']],['ride','버스나 지하철 한 정거장 다녀오기','짧은 이동으로 익숙해져요.','20분',['한적한 시간대를 골라요.', '한 정거장만 타고 내려요.', '돌아오는 길도 천천히 와요.']]],
 ],
 connect:[
  [['emoji','오늘 기분을 이모지 하나로 고르기','말 대신 그림으로 마음을 표현해요.','1분',['이모지 목록을 열어요.', '지금 마음과 가까운 걸 하나 골라요.', '누구에게 보내지 않아도 돼요.']],['kindnote','나에게 다정한 한 줄 써주기','친구에게 하듯 나에게 말해요.','2분',['메모장을 열어요.', '“오늘도 여기까지 왔네”처럼 적어요.', '다시 읽어도, 안 읽어도 괜찮아요.']],['podcast','누군가의 목소리 들어보기','라디오나 팟캐스트로 사람의 온기를 느껴요.','5분',['편한 라디오나 팟캐스트를 골라요.', '배경처럼 틀어두어도 돼요.', '불편하면 바로 꺼요.']],['grateful','고마웠던 순간 하나 떠올리기','아주 작은 순간이어도 좋아요.','1분',['편한 자세로 잠깐 눈을 감아요.', '누군가 친절했던 순간을 떠올려요.', '떠오르지 않으면 그냥 쉬어도 돼요.']]],
  [['readaloud','짧은 글 소리 내어 읽기','내 목소리에 익숙해지는 연습.','2분',['좋아하는 글이나 노래 가사를 골라요.', '작은 소리로 한 문단 읽어요.', '더듬어도 괜찮아요.']],['replydraft','받은 메시지에 답장 초안만 쓰기','보내는 건 나중에 정해도 돼요.','3분',['답하지 못한 메시지 하나를 골라요.', '짧은 답장을 적어만 둬요.', '보내지 않고 닫아도 괜찮아요.']],['like','좋아하는 게시물에 ‘좋아요’ 누르기','가장 작은 인사예요.','1분',['자주 보는 앱을 열어요.', '마음에 드는 게시물을 찾아요.', '‘좋아요’ 하나면 충분해요.']],['mirror','거울 보며 “안녕하세요” 해보기','나에게 먼저 인사해요.','1분',['거울 앞에 서거나 앉아요.', '작게 “안녕하세요”라고 말해요.', '웃지 않아도 괜찮아요.']]],
  [['sticker','편한 사람에게 이모티콘 보내기','말이 없어도 마음은 전해져요.','2분',['연락해도 편한 사람을 떠올려요.', '이모티콘 하나만 골라 보내요.', '답장은 기다리지 않아도 돼요.']],['family','가족에게 짧은 한마디 하기','“잘 잤어?” 정도면 충분해요.','2분',['편한 가족 한 명을 떠올려요.', '짧은 말 한마디를 건네요.', '대화가 이어지지 않아도 괜찮아요.']],['comment','관심 있는 글에 짧은 댓글 달기','익명 공간에서 가볍게 시작해요.','3분',['관심 있는 주제의 글을 찾아요.', '“좋은 글 고마워요”처럼 짧게 적어요.', '마음이 불편해지면 바로 닫아요.']],['callprep','전화 연습 한 번 해보기','실제 전화 전에 안전하게 미리.','3분',['대화 연습에서 병원 진료 예약 전화를 골라요.', '예시 문장으로 한 번 연습해요.', '연습만 해도 충분해요.']]],
  [['order','가게에서 직접 주문해보기','짧고 익숙한 주문부터.','10분',['익숙한 가게와 메뉴를 골라요.', '연습한 문장을 떠올려요.', '말이 막히면 메뉴를 가리켜도 괜찮아요.']],['ask','가게나 기관에 궁금한 것 하나 묻기','질문 하나로 대화를 열어요.','5분',['궁금한 것 하나를 미리 적어요.', '전화나 방문으로 물어봐요.', '어려우면 문자나 홈페이지 문의도 괜찮아요.']],['meet','편한 사람과 짧은 만남 정하기','30분이면 충분해요.','5분',['편한 사람 한 명을 떠올려요.', '짧은 만남을 제안해요.', '날짜는 천천히 정해도 괜찮아요.']],['reachout','지원 공간에 문의해보기','도움 찾기에서 나에게 맞는 곳을 골라요.','10분',['도움 찾기에서 마음이 가는 곳을 골라요.', '처음 연락할 문장을 미리 연습해요.', '문의만 하고 신청은 나중에 정해도 돼요.']]],
 ],
};
for(const g of goals)more[g.id].forEach((group,i)=>sets[g.id][i].push(...group));
export const springMissions:SpringMission[]=goals.flatMap(g=>sets[g.id].flatMap((group,index)=>group.map(([id,title,description,minutes,steps])=>({id:`${g.id}-${id}`,title,description,minutes,steps,goal:g.id,springStage:index as SpringStage,category:g.title,min:1,max:5,icon:g.icon}))));
// 일상과 혼자의 시간을 오가는 사람을 위한 '나만의 썰물' 미션. 단계 이동에는 쓰지 않아요.
export const waveMissions:Mission[]=[
 ['wave-signal','혼자 있고 싶은 신호 알아차리기','지금 내 마음이 보내는 신호를 이름 붙여봐요.','1분',['요즘 혼자 있고 싶어진 순간을 떠올려요.','피곤함, 북적임, 걱정 중 가까운 것을 골라요.','신호를 알아차린 것만으로도 충분해요.']],
 ['wave-plan','혼자만의 시간을 미리 정하기','숨는 대신, 쉬는 시간을 내가 정해요.','2분',['오늘이나 내일 쉬고 싶은 시간을 골라요.','그 시간엔 연락을 쉬어도 괜찮다고 정해요.','끝나는 시간도 함께 정해두면 돌아오기 쉬워요.']],
 ['wave-thread','한 사람에게 쉬는 중이라고 알리기','연결의 끈은 가늘게 남겨둬요.','2분',['편한 사람 한 명을 떠올려요.','“나 며칠 조용히 쉬고 올게” 정도로 짧게 적어요.','보낼지 말지는 내가 정해요.']],
 ['wave-anchor','하루 하나, 일상의 닻 지키기','쉬는 날에도 지킬 작은 습관 하나.','1분',['식사, 씻기, 창문 열기 중 하나를 골라요.','오늘 그 하나만 지켜봐요.','나머지는 쉬어가도 괜찮아요.']],
].map(([id,title,description,minutes,steps])=>({id:id as string,title:title as string,description:description as string,minutes:minutes as string,steps:steps as string[],category:'나만의 썰물',min:1,max:5,icon:'leaf'}));
export function energyCeiling(energy:Energy):SpringStage{return Math.min(3,energy-1) as SpringStage;}
/** Same order all day, a fresh order the next day. */
function dailyOrder<T>(items:T[],seed:string){
 let h=2166136261;for(const ch of seed)h=Math.imul(h^ch.charCodeAt(0),16777619);
 const rnd=()=>{h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);return ((h^=h>>>16)>>>0)/4294967296;};
 const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
/** Three missions per page. ‘다른 미션’ turns a whole page, so nothing repeats until the pool is used up. */
export function recommendSpring(profile:JourneyProfile,energy:Energy,offset=0,date=new Date()):SpringMission[]{
 const ceiling=Math.min(profile.stage,energyCeiling(energy));const day=`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
 const pool=[ceiling,...[0,1,2,3].filter(s=>s!==ceiling).reverse()].filter(s=>s<=ceiling).flatMap(stage=>dailyOrder(springMissions.filter(m=>m.goal===profile.goal&&m.springStage===stage),day+profile.goal+stage));
 const size=Math.min(3,pool.length);const pages=Math.ceil(pool.length/size);const start=((offset%pages)+pages)%pages*size;
 return Array.from({length:size},(_,n)=>pool[(start+n)%pool.length]);
}
export function missionPages(profile:JourneyProfile,energy:Energy){const ceiling=Math.min(profile.stage,energyCeiling(energy));return Math.ceil(springMissions.filter(m=>m.goal===profile.goal&&m.springStage<=ceiling).length/3);}
export function markSpringComplete(profile:JourneyProfile,missionId:string):JourneyProfile {
 const m=springMissions.find(m=>m.id===missionId);
 if(!m||m.goal!==profile.goal||m.springStage>profile.stage)return profile;
 return {...profile,completed:[...new Set([...profile.completed,missionId])]};
}
export function canJump(profile:JourneyProfile){return profile.stage<3&&springMissions.some(m=>m.goal===profile.goal&&m.springStage===profile.stage&&profile.completed.includes(m.id));}
export function jump(profile:JourneyProfile):JourneyProfile{return canJump(profile)?{...profile,stage:(profile.stage+1) as SpringStage}:profile;}
export const demoProfile=()=>createProfile(0,0,'outside');
