/** Today's energy, chosen by the person each day. Three levels from 0.26.0 (five before); the size of a mission is relative to the person's own stage (`energyCeiling` in journey.ts). */
export type Energy = 1 | 2 | 3;
export const energies = [
  { value: 1 as Energy, label: '쉬어갈래요', note: '가장 작은 것만 보여줄게요. 그냥 쉬어도 좋아요.' },
  { value: 2 as Energy, label: '작은 것 하나', note: '지금 단계보다 한 칸 가벼운 것으로 골라볼게요.' },
  { value: 3 as Energy, label: '조금 더 해볼래요', note: '지금 내 단계만큼 해볼 수 있어요.' },
];
export type Mission = {id:string;title:string;description:string;minutes:string;category:string;icon:string;steps:string[]};
export const scenarios=[
 {id:'cafe',title:'카페에서 주문하기',description:'메뉴 고르기부터 주문 마무리까지',icon:'coffee',tag:'가벼운 시작',role:'카페 직원',opening:'어서 오세요. 어떤 음료로 드릴까요?',hints:['아메리카노 한 잔 주세요.','메뉴를 조금 더 보고 주문해도 될까요?','카페인이 없는 음료도 있나요?'],prompts:['따뜻하게 드릴까요, 차갑게 드릴까요?','매장에서 드시나요, 가지고 가시나요?','네, 주문 도와드렸어요. 편하게 기다려 주세요.']},
 {id:'appointment',title:'병원 진료 예약 전화',description:'원하는 날짜와 시간을 말하는 연습',icon:'phone',tag:'천천히 한 문장',role:'병원 접수 담당자',opening:'네, 폴짝의원입니다. 무엇을 도와드릴까요?',hints:['진료 예약을 하고 싶어서 전화드렸어요.','처음 가보는데 예약할 수 있을까요?','가능한 시간을 알려주실 수 있나요?'],prompts:['네, 예약 도와드릴게요. 어떤 진료를 보려고 하세요? 자세히 말하기 어려우면 ‘진료 상담’이라고만 하셔도 돼요.','이번 주 금요일 오후 2시와 4시가 가능해요. 어느 시간이 편하세요?','예약 연습을 마쳤어요. 실제 예약은 병원에 직접 확인해 주세요.']},
 {id:'interview',title:'아르바이트 면접',description:'짧은 자기소개와 요즘 이야기',icon:'work',tag:'한 걸음 더',role:'편의점 점장',opening:'안녕하세요, 면접 보러 오셨죠? 편하게 앉으세요. 간단히 자기소개 부탁드려요.',hints:['안녕하세요. 아르바이트에 지원했습니다. 잘 부탁드립니다.','조금 긴장되는데 천천히 말해도 될까요?','성실하게 배우면서 일하고 싶어요.'],prompts:['반가워요. 일할 수 있는 요일과 시간은 언제인가요?','좋아요. 최근에는 어떻게 지내셨어요? 편하게 말해도 돼요.','이야기 나눠줘서 고마워요. 면접 연습을 마쳤어요. 실제 면접에서도 지금처럼 천천히 말하면 충분해요.']},
 {id:'support',title:'지원기관에 처음 문의하기',description:'내가 받을 수 있는 도움을 물어보는 연습',icon:'compass',tag:'도움 요청 연습',role:'청년지원센터 상담 선생님',opening:'안녕하세요, 청년지원센터입니다. 무엇을 도와드릴까요?',hints:['고립·은둔 청년 지원에 대해 알고 싶어서 연락드렸어요.','제가 신청할 수 있는지 궁금해요.','잘 모르겠는데 물어봐도 될까요?'],prompts:['네, 편하게 물어보셔도 돼요. 지금 어떤 도움이 필요하신지 말씀해 주시겠어요? 잘 모르셔도 괜찮아요.','알겠습니다. 처음에는 담당 선생님과 편한 방식으로 이야기를 나누게 돼요. 전화, 문자, 방문 중 어떤 게 편하세요?','그 방법으로 안내해 드릴게요. 문의 연습은 여기까지예요. 실제 조건은 기관에 확인해 주세요.']},
 {id:'hello',title:'오랜만에 안부 전하기',description:'짧은 인사 한마디를 편하게',icon:'chat',tag:'익숙한 사람에게',role:'오랜만에 만난 지인',opening:'오랜만이야. 오늘 만나서 반가워!',hints:['오랜만이야. 나도 반가워.','요즘 어떻게 지내?','나 조금 긴장되는데 천천히 얘기해도 될까?'],prompts:['나는 요즘 동네를 산책하며 지내. 너는 요즘 관심 가는 게 있어?','그렇구나. 편한 만큼만 이야기해도 좋아.','오늘 이야기해 줘서 고마워. 다음에 또 편하게 안부 나누자.']},
] as const;
export type ScenarioId=typeof scenarios[number]['id'];
export function isScenarioId(value:unknown):value is ScenarioId{return scenarios.some(s=>s.id===value);}
export function needsSupport(text:string){return /자살|자해|죽고\s*싶|죽어\s*버리|목숨을?\s*(끊|버리)|살고\s*싶지|살기\s*싫|그만\s*살|사라지고\s*싶|없어지고\s*싶|스스로.{0,8}(해치|다치)|극단적\s*선택|다\s*(그만두|포기하|내려놓)고\s*싶/u.test(text);}
export const supportiveText='지금 많이 힘든 마음이 느껴져요. 혼자 견디지 않아도 괜찮아요. 지금 다칠 위험이 있거나 이미 다쳤다면 119 또는 112에 연락해 주세요. 자살예방상담전화 109에서는 24시간 도움을 받을 수 있어요. 가능하다면 믿을 수 있는 사람에게 지금 함께 있어 달라고 요청해 주세요.';

