export type Energy = 1 | 2 | 3 | 4 | 5;
export const energies = [
  { value: 1 as Energy, label: '잠깐 쉬고 싶어요', short: '아주 조금', note: '가만히 쉬어도 괜찮아요. 아주 작은 것부터 골라볼까요?' },
  { value: 2 as Energy, label: '작은 건 할 수 있어요', short: '조금', note: '지금 있는 곳에서, 부담 없는 한 걸음을 찾아볼게요.' },
  { value: 3 as Energy, label: '조금 움직여볼까요', short: '보통', note: '작은 움직임 하나로 오늘에 여백을 만들어봐요.' },
  { value: 4 as Energy, label: '밖이 궁금해요', short: '넉넉히', note: '익숙한 곳에서 조금만 바깥으로 나가볼까요?' },
  { value: 5 as Energy, label: '새로운 걸 해볼래요', short: '충분히', note: '지금 마음이 가는 쪽으로, 나만의 한 걸음을 골라봐요.' },
];
export type Mission = {id:string;title:string;description:string;minutes:string;category:string;min:number;max:number;icon:string;steps:string[]};
export const missions: Mission[] = [
 {id:'water',title:'물 한 모금 마시기',description:'가까이 있는 물을 한 모금. 그 정도면 충분해요.',minutes:'1분',category:'나 돌보기',min:1,max:3,icon:'water',steps:['가까이에 물이 있다면 손이 닿는 곳에 두어요.','편한 만큼 한 모금 마셔요.','조금 쉬어요. 여기까지 해도 괜찮아요.']},
 {id:'window',title:'창밖의 색 하나 찾기',description:'창밖을 잠깐 바라보고, 눈에 들어온 색 하나를 골라요.',minutes:'1분',category:'잠깐 환기',min:1,max:3,icon:'sun',steps:['편한 자세로 창밖이나 주변을 바라봐요.','눈에 들어온 색 하나를 마음속으로 불러봐요.','다시 편한 자세로 돌아와요.']},
 {id:'rest',title:'아무것도 하지 않는 1분',description:'해야 할 일은 잠깐 내려놓고, 편하게 머물러요.',minutes:'1분',category:'쉬어가기',min:1,max:5,icon:'leaf',steps:['몸이 편한 자리를 찾아요.','화면을 내려놓아도 괜찮아요.','원할 때 다시 돌아와요.']},
 {id:'curtain',title:'커튼을 조금 열어보기',description:'방 안에 오늘의 빛을 조금만 들여봐요.',minutes:'1분',category:'잠깐 환기',min:2,max:4,icon:'sun',steps:['커튼이나 블라인드 가까이 가요.','편한 만큼만 열어요.','방 안의 달라진 빛을 잠깐 바라봐요.']},
 {id:'desk',title:'물건 하나 제자리로',description:'책상 위 물건 딱 하나. 모두 정리할 필요는 없어요.',minutes:'2분',category:'내 공간',min:2,max:4,icon:'home',steps:['주변에서 옮기기 쉬운 물건 하나를 골라요.','있으면 좋을 곳에 놓아요.','나머지는 지금 그대로 두어도 괜찮아요.']},
 {id:'stretch',title:'기지개 한 번 켜기',description:'편한 자세에서, 몸이 허락하는 만큼만 움직여요.',minutes:'1분',category:'나 돌보기',min:2,max:4,icon:'leaf',steps:['앉거나 선 상태에서 편한 자세를 잡아요.','불편하지 않은 범위에서 가볍게 기지개를 켜요.','불편하면 바로 멈추고 쉬어요.']},
 {id:'door',title:'문 앞까지 다녀오기',description:'잠깐 문 앞에 서보기. 바로 돌아와도 좋아요.',minutes:'3분',category:'바깥과 연결',min:3,max:5,icon:'walk',steps:['편한 옷차림 그대로 준비해요.','안전하고 익숙한 문 앞까지 가봐요.','원할 때 돌아와요. 나가기 전 멈춰도 괜찮아요.']},
 {id:'song',title:'좋아하는 노래 한 곡',description:'예전에 좋아했던 노래를, 편한 소리로 들어봐요.',minutes:'3분',category:'나의 취향',min:3,max:5,icon:'music',steps:['생각나는 노래 한 곡을 골라요.','편한 음량으로 잠깐 들어요.','끝까지 듣지 않아도 괜찮아요.']},
 {id:'walk',title:'익숙한 길 5분 걷기',description:'집 근처 익숙한 길을 짧게, 내 속도로 걸어요.',minutes:'5분',category:'바깥과 연결',min:4,max:5,icon:'walk',steps:['날씨와 주변이 안전한지 확인해요.','익숙한 길을 편한 만큼 걸어요.','언제든 돌아와도 괜찮아요.']},
 {id:'hello',title:'짧은 안부 한 줄',description:'편한 사람에게 짧은 안부를 적어봐요. 보내기는 선택이에요.',minutes:'3분',category:'사람과 연결',min:4,max:5,icon:'chat',steps:['안부를 전하고 싶은 편한 사람을 떠올려요.','“잘 지내?”처럼 짧은 문장을 적어요.','보내거나, 적어두기만 하거나. 내가 선택해요.']},
 {id:'cafe',title:'익숙한 가게 들러보기',description:'한 번 가본 가게에 들러 구경만 하고 와도 좋아요.',minutes:'10분',category:'바깥과 연결',min:5,max:5,icon:'coffee',steps:['익숙하고 가까운 가게를 골라요.','입구까지만 가거나 잠깐 둘러봐요.','필요하면 먼저 대화 연습을 해봐요.']},
 {id:'interest',title:'관심 가는 활동 살펴보기',description:'도움 찾기에서 마음이 가는 공간 하나를 구경해요.',minutes:'5분',category:'새로운 연결',min:5,max:5,icon:'compass',steps:['도움 찾기를 열어봐요.','나와 가까운 지역의 공간 하나를 살펴봐요.','신청은 나중에 생각해도 괜찮아요.']},
];
export function recommend(energy:Energy,offset=0){const items=missions.filter(m=>energy>=m.min&&energy<=m.max);return Array.from({length:Math.min(3,items.length)},(_,i)=>items[(i+offset)%items.length]);}
export const scenarios=[
 {id:'cafe',title:'카페에서 주문하기',description:'메뉴 고르기부터 주문 마무리까지',icon:'coffee',tag:'가벼운 시작',role:'카페 직원',opening:'어서 오세요. 어떤 음료로 드릴까요?',hints:['아메리카노 한 잔 주세요.','메뉴를 조금 더 보고 주문해도 될까요?','카페인이 없는 음료도 있나요?'],prompts:['따뜻하게 드릴까요, 차갑게 드릴까요?','매장에서 드시나요, 가지고 가시나요?','네, 주문 도와드렸어요. 편하게 기다려 주세요.']},
 {id:'appointment',title:'병원 진료 예약 전화',description:'원하는 날짜와 시간을 말하는 연습',icon:'phone',tag:'천천히 한 문장',role:'병원 접수 담당자',opening:'네, 폴짝의원입니다. 무엇을 도와드릴까요?',hints:['진료 예약을 하고 싶어서 전화드렸어요.','처음 가보는데 예약할 수 있을까요?','가능한 시간을 알려주실 수 있나요?'],prompts:['네, 예약 도와드릴게요. 어떤 진료를 보려고 하세요? 자세히 말하기 어려우면 ‘진료 상담’이라고만 하셔도 돼요.','이번 주 금요일 오후 2시와 4시가 가능해요. 어느 시간이 편하세요?','예약 연습을 마쳤어요. 실제 예약은 병원에 직접 확인해 주세요.']},
 {id:'interview',title:'아르바이트 면접',description:'짧은 자기소개와 요즘 이야기',icon:'work',tag:'한 걸음 더',role:'편의점 점장',opening:'안녕하세요, 면접 보러 오셨죠? 편하게 앉으세요. 간단히 자기소개 부탁드려요.',hints:['안녕하세요. 아르바이트에 지원했습니다. 잘 부탁드립니다.','조금 긴장되는데 천천히 말해도 될까요?','성실하게 배우면서 일하고 싶어요.'],prompts:['반가워요. 일할 수 있는 요일과 시간은 언제인가요?','좋아요. 최근에는 어떻게 지내셨어요? 편하게 말해도 돼요.','이야기 나눠줘서 고마워요. 면접 연습을 마쳤어요. 실제 면접에서도 지금처럼 천천히 말하면 충분해요.']},
 {id:'hello',title:'오랜만에 안부 전하기',description:'짧은 인사 한마디를 편하게',icon:'chat',tag:'익숙한 사람에게',role:'오랜만에 만난 지인',opening:'오랜만이야. 오늘 만나서 반가워!',hints:['오랜만이야. 나도 반가워.','요즘 어떻게 지내?','나 조금 긴장되는데 천천히 얘기해도 될까?'],prompts:['나는 요즘 동네를 산책하며 지내. 너는 요즘 관심 가는 게 있어?','그렇구나. 편한 만큼만 이야기해도 좋아.','오늘 이야기해 줘서 고마워. 다음에 또 편하게 안부 나누자.']},
] as const;
export type ScenarioId=typeof scenarios[number]['id'];
export function isScenarioId(value:unknown):value is ScenarioId{return scenarios.some(s=>s.id===value);}
export function needsSupport(text:string){return /자살|자해|죽고\s*싶|죽어\s*버리|목숨을?\s*(끊|버리)|살고\s*싶지|스스로.{0,8}(해치|다치)|극단적\s*선택/u.test(text);}
export function exampleReply(id:ScenarioId,turn:number,text:string){
 const s=scenarios.find(s=>s.id===id)!;
 if(id==='cafe'&&turn===0&&/따뜻|차갑|아이스|뜨거/.test(text))return {text:'말씀하신 온도로 주문하는 연습을 해볼게요. 크기는 기본으로 괜찮으세요?',done:false};
 if(/모르|어려|긴장|무서|떨려/.test(text))return {text:'천천히 해도 괜찮아요. 아래 예시 문장을 골라 말해 보셔도 좋아요.',done:false};
 if(/다시|한번더|한 번 더/.test(text))return {text:s.opening,done:false};
 return {text:s.prompts[Math.min(turn,s.prompts.length-1)],done:turn>=s.prompts.length-1};
}
export const supportiveText='지금 많이 힘든 마음이 느껴져요. 혼자 견디지 않아도 괜찮아요. 지금 다칠 위험이 있거나 이미 다쳤다면 119 또는 112에 연락해 주세요. 자살예방상담전화 109에서는 24시간 도움을 받을 수 있어요. 가능하다면 믿을 수 있는 사람에게 지금 함께 있어 달라고 요청해 주세요.';

export function practiceHints(id: ScenarioId, turn: number, reply = ''): readonly string[] {
 if(reply.includes('크기는 기본'))return ['네, 기본 크기로 주세요.', '작은 크기도 있나요?'];
 if (turn === 0) return scenarios.find(s => s.id === id)!.hints;
 const choices: Record<ScenarioId, string[][]> = {
  cafe: [['따뜻하게 주세요.', '차갑게 주세요.'], ['가져갈게요. 감사합니다.', '여기서 마실게요.']],
  appointment: [['감기 기운이 있어서 진료 받고 싶어요.', '진료 상담을 받고 싶어요.'], ['오후 2시로 할게요.', '오후 4시가 좋아요.']],
  interview: [['평일 오후에 일할 수 있어요.', '주말 오전이 편해요.'], ['잠시 쉬면서 나를 돌보는 시간을 가졌어요.', '다시 일상을 시작하려고 준비하고 있었어요.']],
  hello: [['요즘 음악 듣는 걸 좋아해.', '나는 아직 잘 모르겠어.'], ['편하게 들어줘서 고마워.', '다음에 또 이야기하자.']],
 };
 return choices[id][Math.min(turn - 1, 1)];
}
