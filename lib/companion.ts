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
