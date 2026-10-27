// What the frog says and how it looks, so the companion answers the person's day without judging it.
// Lines follow the team's guardrails: no evaluation or advice-giving, empathy first, one small concrete option.
import type {Energy, Mission} from './content';
import type {CharacterGame, Slot} from './character';

/** One line per mission that notices what was done, plus a gentle question that needs no answer. */
const missionLines: Record<string, string> = {
 'rhythm-water': '물 한 모금, 몸이 고마워하고 있을 거야.',
 'rhythm-color': '눈에 들어온 색, 오늘은 어떤 색이었어?',
 'rhythm-curtain': '빛이 조금 들어왔네. 방 안이 어때 보여?',
 'rhythm-tidy': '딱 하나 옮긴 것도 공간이 달라지는 시작이야.',
 'rhythm-stretch': '정해둔 시간에 기지개라니, 작은 리듬이 생겼어.',
 'rhythm-snack': '나를 챙겨 먹인 거, 그건 정말 큰 일이야.',
 'rhythm-routine': '내일의 나에게 작은 약속을 남겼구나.',
 'rhythm-hobby': '좋아하는 걸 하는 5분, 마음이 숨 쉬었을 거야.',
 'outside-window': '창밖을 본 10초, 바깥이 조금 가까워졌어.',
 'outside-weather': '오늘 날씨를 알게 됐네. 나가지 않아도 충분해.',
 'outside-door': '문 앞까지 다녀왔어! 돌아온 것도 잘한 선택이야.',
 'outside-shoes': '신발을 꺼낸 것만으로도 마음은 한 걸음 나갔어.',
 'outside-walk': '익숙한 길 3분, 발걸음이 어땠어?',
 'outside-air': '바깥 공기를 만나고 왔구나. 오늘의 공기는 어땠어?',
 'outside-shop': '가게를 둘러보고 왔네. 사지 않아도 멋진 외출이야.',
 'outside-place': '궁금한 공간을 알아봤구나. 가볼지는 천천히 정해도 돼.',
 'connect-word': '마음에 이름을 붙여준 거, 그게 대화의 시작이야.',
 'connect-person': '편했던 사람을 떠올렸구나. 그 기억도 연결이야.',
 'connect-draft': '보내지 않은 한 줄도 마음속에선 이미 전해졌어.',
 'connect-voice': '내 목소리로 한마디, 오랜만에 들어본 소리였을까?',
 'connect-hello': '안부를 적어봤구나. 답장이 없어도 네 마음은 그대로 소중해.',
 'connect-practice': '연습해본 문장은 필요할 때 꺼내 쓸 수 있어.',
 'connect-thanks': '감사 한마디, 누군가의 하루도 조금 따뜻해졌을 거야.',
 'connect-community': '모임을 알아본 것만으로도 문이 하나 생겼어.',
 'rhythm-breath': '숨 세 번, 몸이 조금 느슨해졌을 거야.',
 'rhythm-blanket': '이불이 조금 펴졌네. 내 자리가 포근해졌어.',
 'rhythm-song': '노래 한 곡, 마음이 잠깐 쉬어 갔을까?',
 'rhythm-wash': '손끝이 시원해졌지? 작게 깨어난 거야.',
 'rhythm-sunlight': '햇빛 1분, 몸이 낮을 알아차렸을 거야.',
 'rhythm-fold': '옷 하나가 가지런해졌어. 작은 정리도 정리야.',
 'rhythm-cup': '깨끗한 컵 하나, 다음의 나를 챙겼어.',
 'rhythm-brush': '개운해졌지? 나를 돌본 3분이야.',
 'rhythm-alarm': '내일을 위한 신호를 하나 켜뒀네.',
 'rhythm-meal': '정해둔 시간의 한 끼, 하루에 기둥이 하나 섰어.',
 'rhythm-trash': '한 봉지 묶어둔 것만으로 방이 숨을 쉬어.',
 'rhythm-wipe': '깨끗해진 한 칸, 거기에 무엇을 둘까?',
 'rhythm-cook': '내 손으로 만든 한 그릇, 정말 멋진 일이야.',
 'rhythm-diary': '세 줄이면 오늘이 기억에 남아.',
 'rhythm-week': '해보고 싶은 일이 생겼네. 설레는 목록이야.',
 'rhythm-learn': '새로운 걸 하나 알게 됐네. 궁금함은 힘이야.',
 'outside-sound': '바깥의 소리를 들었구나. 세상이 조금 가까워졌어.',
 'outside-photo': '가고 싶은 곳이 생겼네. 마음은 벌써 한 걸음 나갔어.',
 'outside-map': '화면 속 동네 산책, 길이 조금 익숙해졌을 거야.',
 'outside-breeze': '바람이 들어왔네. 방 안에도 바깥이 왔어.',
 'outside-porch': '경계에 서 봤어. 그건 아주 용기 있는 1분이야.',
 'outside-outfit': '나갈 옷을 골라뒀네. 준비된 마음이 생겼어.',
 'outside-bag': '가방이 준비됐어. 언제든 떠날 수 있는 신호야.',
 'outside-mailbox': '집 앞까지 다녀왔네. 돌아온 것까지 잘한 거야.',
 'outside-store': '편의점까지 다녀왔구나! 그건 정말 큰 폴짝이야.',
 'outside-bench': '바깥에 잠깐 머물렀네. 그 자리 어땠어?',
 'outside-stop': '정류장까지 갔다 왔어. 길이 하나 더 열렸어.',
 'outside-quiet': '내가 고른 시간의 산책, 나만의 속도였어.',
 'outside-takeout': '음료 한 잔을 직접 주문했어! 연습이 진짜가 됐어.',
 'outside-library': '조용한 공간에 다녀왔네. 거기 마음에 들었어?',
 'outside-park': '조금 더 먼 곳까지 걸었어. 발걸음이 넓어졌어.',
 'outside-ride': '한 정거장 여행, 정말 멋지게 다녀왔어.',
 'connect-emoji': '오늘의 이모지를 골랐네. 마음에 이름이 생겼어.',
 'connect-kindnote': '나에게 다정한 말, 그게 연결의 첫 번째야.',
 'connect-podcast': '누군가의 목소리를 들었네. 혼자가 아닌 시간이었어.',
 'connect-grateful': '고마운 기억이 떠올랐구나. 마음이 따뜻해졌을 거야.',
 'connect-readaloud': '내 목소리로 읽었네. 소리가 바깥으로 나왔어.',
 'connect-replydraft': '답장 초안이 생겼네. 준비된 말은 든든해.',
 'connect-like': '‘좋아요’ 하나, 누군가에게 작은 인사가 됐어.',
 'connect-mirror': '거울 속 나에게 인사했네. 반가웠을 거야.',
 'connect-sticker': '이모티콘 하나로 안부를 전했네. 충분히 따뜻해.',
 'connect-family': '가족에게 한마디 건넸구나. 작은 다리가 놓였어.',
 'connect-comment': '댓글 한 줄, 누군가와 생각을 나눴어.',
 'connect-callprep': '전화 연습을 해봤네. 필요할 때 꺼낼 문장이 생겼어.',
 'connect-order': '직접 주문했어! 연습이 진짜 대화가 됐어.',
 'connect-ask': '궁금한 걸 직접 물어봤구나. 정말 큰 한 걸음이야.',
 'connect-meet': '만남을 제안했네. 연결이 손에 잡히기 시작했어.',
 'connect-reachout': '도움에 손을 내밀었어. 그건 정말 용기 있는 일이야.',
 'wave-signal': '신호를 알아차린 너, 정말 섬세하게 나를 보고 있어.',
 'wave-plan': '쉬는 시간을 내가 정했어. 숨는 게 아니라 쉬는 거야.',
 'wave-thread': '가는 끈 하나 남겨둔 거, 돌아올 길이 되어줄 거야.',
 'wave-anchor': '오늘의 닻 하나를 지켰어. 나머지는 쉬어도 괜찮아.',
 'night-dim': '화면이 부드러워졌다. 눈도 마음도 조금 쉬자.',
 'night-water': '물 한 모금 마시고 누웠구나. 잠이 안 와도 괜찮아.',
 'night-one': '내일 할 일 하나면 충분해. 나머지는 내일의 나에게.',
};
const fallback = ['작은 폴짝, 정말 멋져!', '해본 것만으로 충분해.', '오늘의 너를 응원해.'];
export function missionCheer(mission: Pick<Mission, 'id'> | null, seed = Date.now()) {
 return (mission && missionLines[mission.id]) || fallback[seed % fallback.length];
}
export const restLines = ['쉬어가는 날도 나의 봄이야.', '오늘은 같이 쉬자. 연못은 그대로 있을게.', '쉬는 것도 내가 고른 소중한 선택이야.'];

/** The frog mirrors today's energy without overriding anything the person chose to wear. */
const moods: Record<Energy, {equipped: Partial<Record<Slot, string>>; line: string}> = {
 1: {equipped: {face: 'sleepy', outfit: 'blanket'}, line: '오늘은 나도 느릿느릿. 담요 덮고 같이 쉬자.'},
 2: {equipped: {hand: 'mug'}, line: '따뜻한 거 한 모금 하면서 천천히 해보자.'},
 3: {equipped: {face: 'happy'}, line: '좋아, 작은 기지개부터 같이 해볼까?'},
 4: {equipped: {face: 'happy'}, line: '바깥이 궁금한 날이구나. 나도 두근두근!'},
 5: {equipped: {face: 'surprise'}, line: '우와, 새로운 걸 해볼 기운이 있는 날이네!'},
};
export function moodFor(energy: Energy | null, worn: CharacterGame['equipped'], night = false) {
 const base: Partial<Record<Slot, string>> = {...(energy ? moods[energy].equipped : {}), ...(night ? {face: 'sleepy', head: 'nightcap'} : {})};
 const look = {...worn};
 for (const [slot, id] of Object.entries(base) as [Slot, string][]) if (!look[slot]) look[slot] = id;
 return {equipped: look, line: energy ? moods[energy].line : ''};
}

/** People whose days and nights have swapped are met where they are, not corrected. */
export const isNight = (date = new Date()) => date.getHours() >= 23 || date.getHours() < 5;
export function greeting(date = new Date()) {
 const h = date.getHours();
 if (h >= 23 || h < 5) return {title: '늦은 밤이네,', note: '잠이 안 와도 괜찮아'};
 if (h < 11) return {title: '좋은 아침이야,', note: '천천히 깨어나도 돼'};
 if (h < 17) return {title: '오늘도 반가워,', note: '내 속도로 폴짝'};
 return {title: '저녁이 됐네,', note: '오늘 하루도 수고했어'};
}
export const nightMissions: Mission[] = [
 ['night-dim', '화면 밝기 낮추기', '눈부심을 줄이면 몸이 밤을 알아차려요.', '1분', ['화면 밝기를 편한 만큼 낮춰요.', '가능하면 방 불빛도 조금 줄여요.', '잠들지 않아도 괜찮아요.']],
 ['night-water', '물 한 모금 마시고 눕기', '누워 있는 것만으로도 쉬는 거예요.', '2분', ['물을 한 모금 마셔요.', '편한 자세로 누워요.', '잠이 오지 않으면 눈만 감고 있어도 괜찮아요.']],
 ['night-one', '내일 할 일 딱 하나 정하기', '나머지는 내일의 나에게 맡겨요.', '1분', ['내일 하고 싶은 일을 하나만 떠올려요.', '메모하거나 마음속으로 정해요.', '못 해도 괜찮은 약속이에요.']],
].map(([id, title, description, minutes, steps]) => ({id: id as string, title: title as string, description: description as string, minutes: minutes as string, steps: steps as string[], category: '잠들기 전 1분', min: 1, max: 5, icon: 'leaf'}));
