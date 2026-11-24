// 개구리 수첩: what real frogs do, and what the same thing means in 폴짝.
// Second-round feedback asked to start from how frogs actually live and grow and to connect it to what the person does.
// Every `fact` is something zoos, museums or park services say about real frogs (`source`); nothing is invented to fit the app.
// `stage` is when the story opens: two or three for each time the friend grows, the rest waiting as ‘???’.
import type {Growth} from './character';
export type FrogStory={id:string;stage:Growth;title:string;fact:string;link:string;source:string};
export const frogStories:FrogStory[]=[
 {id:'jelly',stage:'egg',title:'말랑한 알',fact:'개구리 알은 딱딱한 껍데기 대신 말랑한 젤리에 싸여 있어요. 젤리는 물을 머금고 부풀어서, 알이 마르거나 부딪히지 않게 지켜줘요.',link:'아직 아무것도 하지 않은 것 같은 날에도, 알 속에서는 자라고 있어요.',source:'헤퍼 · 우드랜드 트러스트'},
 {id:'gyeongchip',stage:'egg',title:'경칩에 깨어나요',fact:'우리나라 개구리는 날이 풀리는 경칩 무렵 겨울잠에서 깨어 물가에 모여요. 봄이 더디게 오는 해에는 더 늦게 깨어나요.',link:'깨어나는 날은 해마다, 개구리마다 달라요. 폴짝의 봄도 저마다 달라서, 서로 비교하지 않아요.',source:'서울대공원 · 국립수목원'},
 {id:'gills',stage:'tadpole',title:'숨 쉬는 법도 바뀌어요',fact:'올챙이는 물고기처럼 아가미로 숨을 쉬어요. 자라면서 허파가 생기고, 그제야 물 밖의 공기를 마실 수 있어요.',link:'숨 쉬는 법까지 바꾸는 데에는 시간이 걸려요. 바깥이 아직 어색한 건 당연해요.',source:'호주박물관 · 브리태니커'},
 {id:'legs',stage:'tadpole',title:'뒷다리 먼저',fact:'다리는 한꺼번에 나오지 않아요. 뒷다리가 먼저 보이고, 앞다리는 한참 뒤에 나와요.',link:'한 번에 하나면 충분해요. 그래서 폴짝의 미션은 한 장씩만 보여요.',source:'호주박물관'},
 {id:'tail',stage:'froglet',title:'꼬리는 힘이 돼요',fact:'올챙이의 꼬리는 떨어져 나가지 않아요. 몸속으로 천천히 스며들어, 다리가 자라는 동안 쓰는 양분이 돼요.',link:'지나온 시간도 그래요. 없어지는 게 아니라 지금의 내가 돼요. 폴짝에서 모은 것은 줄어들지 않아요.',source:'호주박물관 · 세인트앤드루스대'},
 {id:'skin',stage:'froglet',title:'물은 피부로 마셔요',fact:'많은 개구리는 입으로 물을 마시는 대신 배 쪽의 얇은 피부로 물을 빨아들여요. 촉촉한 곳에 가만히 앉아 있는 것만으로 목을 축여요.',link:'가만히 있는 시간에도 몸은 필요한 것을 채우고 있어요. 물 한 모금도 그런 일이에요.',source:'라이브사이언스 · 미국생리학회'},
 {id:'winter',stage:'frog',title:'연못 바닥의 겨울',fact:'추운 겨울, 물에 사는 개구리는 연못 바닥에 가만히 앉아 피부로 숨을 쉬며 봄을 기다려요. 땅에 사는 개구리는 낙엽 밑이나 흙 속으로 들어가요.',link:'쉬어가기는 멈춘 게 아니라 봄을 기다리는 방법이에요. 그래서 쉬어간 날도 함께한 날로 세요.',source:'온타리오 주립공원 · 사이언티픽 아메리칸'},
 {id:'thaw',stage:'frog',title:'얼었다가 다시 뛰는 심장',fact:'북아메리카의 숲개구리는 겨울에 몸의 3분의 2쯤이 얼고 심장도 멈춰요. 봄이 오면 안쪽부터 녹고, 심장이 가장 먼저 다시 뛰어요.',link:'오래 멈춰 있었어도 다시 시작할 수 있어요. 며칠 쉬다 와도 연못은 그대로예요.',source:'미국 국립공원관리청'},
 {id:'chorus',stage:'frog',title:'함께 우는 봄밤',fact:'봄밤의 개굴개굴은 주로 수컷이 턱 밑의 울음주머니를 부풀려 내는 소리예요. 겨울잠을 끝낸 개구리들이 물가에 모여 함께 울어요.',link:'연못 마을의 응원도 그래요. 한 마디가 모여 연못의 소리가 돼요.',source:'국립수목원 · 국립생물자원관'},
 {id:'molt',stage:'grown',title:'허물을 벗어요',fact:'개구리는 일주일에 한 번쯤 허물을 벗어요. 스웨터를 벗듯 머리 위로 당겨 벗고, 대개 먹어서 다시 양분으로 써요.',link:'갈아입는 건 개구리에게도 자라는 일이에요. 옷장도 그래서 있어요.',source:'익스플로라토리움'},
 {id:'leap',stage:'grown',title:'웅크렸다가 폴짝',fact:'많은 개구리는 긴 뒷다리를 접었다 펴면서 제 몸길이의 스무 배가 넘게 뛰어요. 뛰기 전에는 몸을 낮게 웅크려요.',link:'웅크린 시간은 뛰기 위한 준비예요. 폴짝이라는 이름이 여기서 왔어요.',source:'샌디에이고 동물원 · 미국자연사박물관'},
 {id:'tempo',stage:'grown',title:'날씨를 타는 노래',fact:'개구리의 울음은 날씨를 타요. 미국의 한 청개구리는 기온이 오르면 더 빠르게 울고, 서늘하면 느려져요.',link:'날마다 박자가 다른 건 자연스러운 일이에요. 그래서 오늘의 에너지는 날마다 새로 골라요.',source:'내셔널지오그래픽'},
];
const order:Growth[]=['egg','tadpole','froglet','frog','grown'];
const at=(g:Growth)=>order.indexOf(g);
/** The stories the friend's stage has opened, oldest first. */
export const storiesOpen=(growth:Growth)=>frogStories.filter(s=>at(s.stage)<=at(growth));
/** How many stories are still waiting, and the stage that opens the next ones (null once all are open). */
export function storiesAhead(growth:Growth){const waiting=frogStories.filter(s=>at(s.stage)>at(growth));return {count:waiting.length,next:waiting.length?waiting[0].stage:null};}
/** The stories that opened with this stage: shown when the friend grows into it. */
export const storiesOf=(growth:Growth)=>frogStories.filter(s=>s.stage===growth);
/** Four promises of the pond, each taken from something frogs really do. They are the app's own rules said in the frog's words. */
export const pondPromises=[
 {rule:'깨어나는 날은 저마다 달라요',from:'경칩',means:'순위도, 비교도 없어요.'},
 {rule:'쉬는 것도 사는 방법이에요',from:'겨울잠',means:'쉬어간 날도 함께한 날이에요.'},
 {rule:'한 번에 하나씩 자라요',from:'뒷다리 먼저',means:'미션은 한 장씩만 보여요.'},
 {rule:'지나온 것은 힘이 돼요',from:'꼬리',means:'모은 것은 줄어들지 않아요.'},
] as const;
/** Things the friend says about itself when touched, by stage — a real frog habit turned toward the person (0.52.0):
 * not ‘my hind legs tickle’ but what that habit says to someone taking their time. Each line leans on a story in the notebook above. */
export const frogSays:Record<Growth,string[]>={
 egg:['젤리 속에서도 자라는 중이야','깨어나는 날은 저마다 달라'],
 tadpole:['뒷다리부터, 한 번에 하나씩','숨 쉬는 법도 천천히 배워'],
 froglet:['지나온 꼬리가 힘이 돼','가만히 있어도 채워져'],
 frog:['겨울엔 나도 가만히 쉬어','멈췄다가도 다시 뛸 수 있어'],
 grown:['웅크린 건 뛰려는 준비야','날마다 박자가 달라도 돼'],
};
/** What the friend says when it is touched: a tap (jump), a stroke on the head (pat), a long press (hug), a turn (spin), and after something done (cheer).
 * 0.52.0, from feedback that ‘간질간질’ and ‘헤헤, 좋아’ read oddly: no baby talk and no sound words. Short words of comfort for someone who has
 * kept to themselves — glad you came, your pace is enough, resting is fine, I am here. Never a push (‘힘내’, ‘할 수 있어’) and never a comparison. */
export type Touch='jump'|'pat'|'hug'|'spin'|'cheer';
export const touchLines:Record<Touch,string[]>={
 jump:['와줘서 반가워','네 속도면 충분해','오늘도 만났네'],
 pat:['곁에 있어줘서 고마워','오늘 하루도 애썼어','그냥 와도 좋아'],
 hug:['여기 있어줘서 고마워','내가 옆에 있을게','천천히 숨 쉬자'],
 spin:['돌아가도 괜찮아','천천히 봐도 돼'],
 cheer:['해본 것만으로 충분해','작은 폴짝도 대단해','오늘의 너, 고마워'],
};
/** The egg and the tadpole cannot hop or hug yet, so they answer in their own way: growing unseen, a little at a time. */
export const youngTouchLines:Partial<Record<Growth,Record<Touch,string[]>>>={
 egg:{jump:['천천히 자라는 중이야','서두르지 않을게'],pat:['네 손이 따뜻해','와줘서 고마워'],hug:['같이 있으니 포근해','여기서 기다릴게'],spin:['안에 있어도 자라고 있어'],cheer:['네 덕분에 자라고 있어','천천히, 곧 만나']},
 tadpole:{jump:['조금씩이면 충분해','오늘도 와줬구나'],pat:['네가 와서 반가워','곁에 있어줘서 좋아'],hug:['같이 있자, 천천히','고마워, 든든해'],spin:['돌아가도 괜찮아'],cheer:['한 번이면 충분해','오늘의 너, 고마워']},
};
/** The line for a touch at this stage. */
export const touchPool=(growth:Growth,kind:Touch)=>(youngTouchLines[growth]??touchLines)[kind];
/** What the friend says while it is being made: its name first, then a welcome. */
export const introLines=(name:string,growth:Growth)=>growth==='egg'?[`안녕, 나는 ${name}`,'천천히 만나자','와줘서 고마워']:[`안녕, 나는 ${name}`,'만나서 반가워','네 속도로 가자'];
