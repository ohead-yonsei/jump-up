// Help that sits between 'just a homepage link' and 119/112/109: what you can get, whether you can use it,
// how to start and what to say first. Checked against official pages on 2026-10-27; re-check before field tests.
export type Need='talk'|'counsel'|'space'|'restart'|'info';
export type ContactWay='phone'|'text'|'visit'|'online';
export type AgeBand='u19'|'19-24'|'25-34'|'35-39'|'40+';
export type Region='성남'|'경기'|'서울'|'기타';
export type Channel={type:'phone'|'text'|'kakao'|'chat'|'visit'|'online';value:string;hours?:string};
export type SupportItem={id:string;title:string;short:string;region:'성남'|'경기'|'서울'|'전국';tier:'talk'|'space'|'program'|'info'|'crisis';
 summary:string;help:string[];who:string|null;ages?:[number,number];servedIn?:Region[];notRequired:string[];how:string[];channels:Channel[];cost:string|null;url:string;checkedAt:string;note?:string;needs:Need[]};
export const needs=[{id:'talk',label:'누군가와 이야기하고 싶어요'},{id:'counsel',label:'마음 상담을 받고 싶어요'},{id:'space',label:'편하게 갈 곳·모임이 궁금해요'},{id:'restart',label:'일·생활을 다시 시작하고 싶어요'},{id:'info',label:'정보만 먼저 볼래요'}] as const;
export const contactWays=[{id:'phone',label:'전화'},{id:'text',label:'문자·채팅'},{id:'visit',label:'직접 방문'},{id:'online',label:'온라인 신청'}] as const;
export const ageBands=[{id:'u19',label:'19세 미만'},{id:'19-24',label:'19~24세'},{id:'25-34',label:'25~34세'},{id:'35-39',label:'35~39세'},{id:'40+',label:'40세 이상'}] as const;
export const regions=[{id:'성남',label:'성남'},{id:'경기',label:'경기(성남 외)'},{id:'서울',label:'서울'},{id:'기타',label:'그 외 지역'}] as const;
const C='2026-10-27';
export const supportItems:SupportItem[]=[
 {id:'seongnam-isolated-youth',title:'성남 사회적 고립 청년 지원사업',short:'사회적 고립 청년 지원사업',region:'성남',tier:'program',needs:['counsel','space','restart'],ages:[19,39],
  summary:'고립감을 느끼는 성남 청년이 원하는 활동을 골라 참여해요.',help:['AI 상담·줌 활동(온라인)','심리상담·문화예술 체험','자조모임·청년 교류'],
  who:'만 19~39세, 사회적 고립감을 느끼는 청년. 성남에 살거나 성남의 학교·기관에 다니면 돼요.',notRequired:[],how:['네이버폼으로 신청해요(상시 모집)','AI 초기상담을 받아요','하고 싶은 활동을 골라 참여해요'],
  channels:[{type:'phone',value:'031-729-9131'},{type:'online',value:'https://naver.me/x1uXXuwn'}],cost:'무료',url:'https://www.snyouth.or.kr/fmcs/883?action=read&action-value=a387088561451fe7c755f3761838af58',checkedAt:C,note:'운영: 성남시청소년상담복지센터, 2026년 4~12월 정원 30명.'},
 {id:'seongnam-youth-spring',title:'성남 청년이봄 (성남시 청년지원센터)',short:'청년이봄',region:'성남',tier:'space',needs:['talk','space','info'],
  summary:'청년 누구나 들를 수 있는 열린 공간이고, 고민 편지도 보낼 수 있어요.',help:['편하게 머무는 열린 공간','‘봄편지’ 고민 상담(일주일 안에 답장)','또래·소그룹 상담'],
  who:'청년 누구나 이용할 수 있는 열린 공간이라고 안내해요.',notRequired:[],how:['누리집에서 프로그램을 확인해요','카카오톡 채널 ‘청년이봄’에 물어봐요','센터에 들러 둘러봐요'],
  channels:[{type:'phone',value:'070-4908-2094'},{type:'kakao',value:'청년이봄',hours:'평일 확인'},{type:'visit',value:'수정구 산성대로 267 롯데시네마타워 B1층'}],cost:null,url:'https://www.snspring.or.kr/',checkedAt:C,note:'운영 시간과 나이 기준은 누리집에 적혀 있지 않아요.'},
 {id:'gyeonggi-nawa',title:'경기 고립·은둔 청년 지원 ‘나와, 볼만한 세상’',short:'‘나와, 볼만한 세상’',region:'경기',tier:'program',needs:['counsel','space','restart'],ages:[19,39],
  summary:'경기도 청년이 1:1 상담과 맞춤 프로그램으로 천천히 일상을 되찾게 도와요.',help:['1:1 전문 상담','맞춤 회복 프로그램·자조모임','성남 거점도 고를 수 있어요'],
  who:'경기도에 주민등록된 만 19~39세(1986~2007년생) 중 사람을 거의 못 만나거나 집 밖에 나오기 힘든 청년',notRequired:[],how:['경기민원24에서 신청해요','원하는 거점을 골라요','정원이 차면 예비 참여자로 기다려요'],
  channels:[{type:'phone',value:'031-703-0104',hours:'성남 거점'},{type:'phone',value:'031-247-4209',hours:'경기도일자리재단'},{type:'online',value:'https://gg24.gg.go.kr'}],cost:null,url:'https://youth.gg.go.kr/gg/intro/isol-notice.do?mode=view&articleNo=9364',checkedAt:C,note:'2026년 모집(300명)은 마감으로 표시돼 있어요. 예비 등록과 다음 모집은 전화로 물어봐요.'},
 {id:'gyeonggi-mind-counsel',title:'경기청년 마음상담소',short:'경기청년 마음상담소',region:'경기',tier:'talk',needs:['talk','counsel'],ages:[19,39],
  summary:'말하기 어려우면 글로 고민을 남겨요. 상담 전문가가 답해 줘요.',help:['다른 사람은 볼 수 없는 글 상담','전문가 답변'],
  who:'만 19~39세 청년이면 누구나',notRequired:[],how:['경기청년포털에 가입해요','간단한 문답지와 상담 글을 써요','답변을 확인해요'],
  channels:[{type:'online',value:'https://youth.gg.go.kr/gg/mindcare/mindCare.do'},{type:'phone',value:'031-247-4209'}],cost:'무료',url:'https://youth.gg.go.kr/gg/mindcare/mindCare.do',checkedAt:C,note:'경기도 거주 조건과 답변까지 걸리는 시간은 적혀 있지 않아요.'},
 {id:'seoul-gijigae',title:'서울청년기지개센터',short:'서울청년기지개센터',region:'서울',tier:'program',needs:['counsel','space','restart'],ages:[19,39],
  summary:'서울 청년이 신청하면 초기 상담 뒤 맞는 회복 프로그램으로 이어 줘요.',help:['초기 상담 후 맞춤 계획','일상 회복·관계 프로그램','센터 공간(내 방·책방·주방)'],
  who:'서울에 사는 만 19~39세(1986~2007년생) 고립·은둔 청년과 가족. 6개월 넘게 고립됐거나 거의 집에만 있는 경우예요.',notRequired:[],how:['청년몽땅정보통에서 신청해요','센터에서 초기 상담을 받아요','사는 곳 가까운 센터와 연결돼요'],
  channels:[{type:'phone',value:'02-6953-2520',hours:'평일 9~18시'},{type:'visit',value:'종로구 이화장길 70-15, 1층'}],cost:null,url:'https://youth.seoul.go.kr/youthConts.do?key=2310100062&sc_pbancSeCd=008&sc_bbsStngSn=2212200001&sc_bbsCtgrySn=2310200007&sc_qnaCtgryCd=&sc_faqCtgryCd=013',checkedAt:C,note:'주소와 시간은 2024년 서울시 자료 기준이에요.'},
 {id:'youth-future-center',title:'청년미래센터 (보건복지부)',short:'청년미래센터',region:'전국',tier:'program',needs:['counsel','restart'],ages:[19,34],servedIn:['기타'],
  summary:'고립·은둔이나 가족돌봄으로 지친 청년을 단계별로 도와요.',help:['생활 리듬 회복·자조모임','가족 상담·1:1 멘토링','일 경험·복지 연계'],
  who:'고립·은둔 청년 만 19~34세, 가족돌봄 청년 만 13~34세. 지금은 인천·울산·충북·전북에서 운영해요.',notRequired:['읍면동 복지센터 방문(온라인 신청 가능)'],how:['온라인 창구나 센터에 신청해요','상담으로 지금 상황을 함께 살펴요','단계별로 지원받아요'],
  channels:[{type:'phone',value:'129',hours:'평일 9~18시'}],cost:null,url:'https://www.mohw.go.kr/board.es?mid=a10503010100&bid=0027&act=view&list_no=1489784&tag=&nPage=1',checkedAt:C,note:'2026년 말까지 16개 시·도로 늘릴 예정이에요. 서울·경기 개소 여부는 129에 물어봐요.'},
 {id:'oneul',title:'사단법인 오늘은',short:'오늘은',region:'서울',tier:'space',needs:['space'],ages:[19,39],
  summary:'문화예술로 청년을 응원하고, 고립 청년을 위한 무료 캠프·모임을 열어요.',help:['고립 청년 캠프·예술 치유','영화 상영회 같은 모임'],
  who:'프로그램마다 달라요. 2026 선라이즈캠프는 고립을 겪었거나 겪고 있는 만 19~39세였어요.',notRequired:['고립 기간이나 정도(2026 선라이즈캠프 기준)'],how:['누리집 ‘신청’ 메뉴에서 모집을 확인해요','신청 폼을 써요','선정되면 문자로 안내받아요'],
  channels:[{type:'phone',value:'02-6958-1960'},{type:'visit',value:'마포구 독막로 331'}],cost:'확인한 2026 프로그램은 무료',url:'https://www.oneul.or.kr/',checkedAt:C,note:'지금 모집 중인 프로그램은 없어요.'},
 {id:'mental-crisis-line',title:'정신건강위기상담전화 1577-0199',short:'정신건강위기상담전화',region:'전국',tier:'talk',needs:['talk','counsel'],
  summary:'마음이 무너질 것 같을 때 밤낮없이 전문 요원과 통화할 수 있어요.',help:['정신건강·위기 상담','가까운 병원·기관 안내'],
  who:'누구나, 전국 어디서나 걸 수 있어요.',notRequired:['진단이나 치료 이력'],how:['1577-0199에 전화해요','지금 마음을 편한 만큼만 말해요','필요하면 가까운 정신건강복지센터로 연결돼요'],
  channels:[{type:'phone',value:'1577-0199',hours:'24시간'}],cost:null,url:'https://www.mohw.go.kr/menu.es?mid=a10706040100',checkedAt:C},
 {id:'youth-1388',title:'청소년상담 1388',short:'청소년상담 1388',region:'전국',tier:'talk',needs:['talk','counsel'],ages:[9,24],
  summary:'만 24세까지는 전화·문자·카톡으로 24시간 무료 상담을 받을 수 있어요.',help:['어떤 고민이든 1:1 상담','부모·보호자 상담'],
  who:'만 9~24세와 부모·보호자',notRequired:[],how:['휴대폰은 지역번호+1388로 걸어요','문자는 1388로 보내요','카카오톡 채널 ‘청소년상담1388’을 추가해요'],
  channels:[{type:'phone',value:'1388',hours:'24시간'},{type:'text',value:'1388',hours:'24시간'},{type:'kakao',value:'청소년상담1388',hours:'24시간'},{type:'chat',value:'https://www.1388.go.kr',hours:'24시간'}],cost:'무료',url:'https://www.1388.go.kr',checkedAt:C},
 {id:'seongnam-mhc',title:'성남시정신건강복지센터',short:'성남시정신건강복지센터',region:'성남',tier:'talk',needs:['talk','counsel'],
  summary:'마음이 힘들 때 상담받고 필요한 도움으로 이어 주는 동네 센터예요.',help:['정신건강 상담·위기 개입','온라인 상담·자가 검진'],
  who:'성남 지역 주민',notRequired:['진단이나 병원 기록'],how:['031-780-7000에 전화해요','누리집 온라인 상담도 돼요','처음엔 지금 상황만 이야기해도 돼요'],
  channels:[{type:'phone',value:'031-780-7000'},{type:'online',value:'https://www.smhc.or.kr/'},{type:'visit',value:'수정구 수정로 218 수정구보건소 5층'}],cost:'무료',url:'https://www.smhc.or.kr/',checkedAt:C,note:'운영 시간은 누리집에 적혀 있지 않아요.'},
 {id:'mind-voucher',title:'정신건강 심리상담 바우처',short:'심리상담 바우처',region:'전국',tier:'program',needs:['counsel'],
  summary:'전문 심리상담 8회를 바우처로 받을 수 있어요.',help:['1:1 대면 심리상담 8회','회당 7만~8만 원 지원'],
  who:'정신건강복지센터·대학 상담센터 의뢰서, 정신건강의학과 소견서, 국가건강검진 우울 점수 10점 이상 중 하나가 있으면 돼요.',notRequired:['나이·소득 기준(소득은 본인 부담에만 영향)'],how:['정신건강복지센터 등에서 의뢰서를 받아요','행정복지센터나 복지로에서 신청해요','제공기관에서 상담을 받아요'],
  channels:[{type:'phone',value:'129',hours:'평일 9~18시'},{type:'online',value:'https://www.bokjiro.go.kr'}],cost:'소득에 따라 본인 부담 0~50%',url:'https://www.mohw.go.kr/menu.es?mid=a10706040800',checkedAt:C,note:'의뢰서는 보통 3개월 안에 받은 것이어야 해요. 지역별 접수 상황은 129에 물어봐요.'},
 {id:'youth-challenge',title:'청년도전지원사업 (고용노동부)',short:'청년도전지원사업',region:'전국',tier:'program',needs:['restart'],ages:[18,34],
  summary:'한동안 일과 구직을 쉰 청년이 자신감을 되찾고 진로를 찾게 돕고, 수당도 줘요.',help:['밀착 상담·자신감 회복','진로 탐색·취업 준비','과정을 마치면 수당 50만~250만 원'],
  who:'만 18~34세, 최근 6개월 동안 일·교육·훈련을 하지 않았고 상담 문답표 기준을 넘는 청년',notRequired:[],how:['고용24에서 신청하거나 운영기관에 가요','상담하고 문답표를 써요','단기·중기·장기 과정에 참여해요'],
  channels:[{type:'online',value:'https://www.work24.go.kr/wk/g/b/1100/busiIntro.do'},{type:'phone',value:'1350',hours:'평일 9~18시'}],cost:'참여하면 수당을 받아요',url:'https://www.work24.go.kr/wk/g/b/1100/busiIntro.do',checkedAt:C,note:'고립·은둔 청년이라고 따로 적혀 있지는 않아요.'},
 {id:'welfare-129',title:'보건복지상담센터 129',short:'보건복지상담센터',region:'전국',tier:'info',needs:['info','restart'],
  summary:'나에게 맞는 복지 도움이 뭔지 무료로 물어볼 수 있어요.',help:['긴급 복지·사각지대 상담','정신건강 위기 상담','복지 제도 안내'],
  who:'누구나, 전국 어디서나',notRequired:[],how:['국번 없이 129에 걸어요','평일엔 상담사와 바로 이야기해요','밤·주말엔 음성 안내에서 0번을 눌러요'],
  channels:[{type:'phone',value:'129',hours:'평일 9~18시, 긴급복지·정신건강 위기는 24시간'},{type:'chat',value:'https://www.129.go.kr/counsel/counsel01.do',hours:'챗봇 24시간'}],cost:'무료',url:'https://www.129.go.kr/counsel/counsel01.do',checkedAt:C},
 {id:'ontong-youth',title:'온통청년',short:'온통청년',region:'전국',tier:'info',needs:['info','restart'],
  summary:'나에게 맞는 청년 정책·청년 공간을 전화나 챗봇으로 물어볼 수 있어요.',help:['청년 정책·청년 공간 찾기','진로·취업 상담','전문가 심층 상담(예약)'],
  who:'청년을 위한 상담 창구예요.',notRequired:[],how:['1670-1839에 전화해요','상담 유형을 골라요','상담사와 이야기해요'],
  channels:[{type:'phone',value:'1670-1839',hours:'평일 9~18시'},{type:'online',value:'https://www.youthcenter.go.kr/youthApply/ythApplyCounsel/ythCounselIntroMain',hours:'심층 상담 예약 평일 9:30~17:30'}],cost:null,url:'https://www.youthcenter.go.kr/',checkedAt:C},
];
const bandRange:Record<AgeBand,[number,number]>={u19:[0,18],'19-24':[19,24],'25-34':[25,34],'35-39':[35,39],'40+':[40,120]};
const regionOk=(item:SupportItem,r:Region)=>item.servedIn?item.servedIn.includes(r):item.region==='전국'||item.region===r||(r==='성남'&&item.region==='경기');
const channelOk=(item:SupportItem,c:ContactWay)=>item.channels.some(ch=>c==='text'?['text','kakao','chat'].includes(ch.type)||(ch.type==='online'&&item.tier==='talk'):ch.type===c);
/** Filters by what was chosen and puts services reachable the preferred way first. Unanswered questions filter nothing. */
export function matchSupport(items:SupportItem[],q:{need:Need|null;contact:ContactWay|null;age:AgeBand|null;region:Region|null}){
 return items.filter(i=>i.tier!=='crisis').filter(i=>!q.need||q.need==='info'||i.needs.includes(q.need)).filter(i=>!q.region||regionOk(i,q.region))
  .filter(i=>{if(!q.age||!i.ages)return true;const [a,b]=bandRange[q.age];return i.ages[0]<=b&&i.ages[1]>=a;})
  .map((i,n)=>({i,score:(q.contact&&channelOk(i,q.contact)?2:0)+(q.region&&i.region===q.region?1:0)-(i.servedIn&&!q.region?1:0)-n/100}))
  .sort((a,b)=>b.score-a.score).map(x=>x.i);
}
/** A first sentence people can read out or paste, so the first contact does not start from a blank page. */
export function firstWords(item:SupportItem){
 if(item.tier==='crisis')return null;
 if(item.tier==='talk')return '안녕하세요. 요즘 마음이 좀 힘들어서 이야기하고 싶어서 연락했어요. 정리가 잘 안 되는데 천천히 말해도 될까요?';
 if(item.tier==='space')return `안녕하세요. ${item.short}에 처음 가보고 싶은데, 그냥 둘러보러 가도 괜찮을까요?`;
 if(item.tier==='info')return '안녕하세요. 저한테 맞는 청년 지원이 있는지 알고 싶어서 연락드렸어요. 어디서부터 알아보면 좋을까요?';
 return `안녕하세요. ${item.short}에 대해 알고 싶어서 연락드렸어요. 제가 신청할 수 있는지, 어떻게 시작하면 되는지 알려주실 수 있나요?`;
}
export const channelLabel:Record<Channel['type'],string>={phone:'전화',text:'문자',kakao:'카카오톡 채널',chat:'채팅 상담',visit:'방문',online:'온라인'};
