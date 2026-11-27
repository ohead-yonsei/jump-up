// Nearby places for an outing at your own pace. The search goes through the server so the person's
// location reaches Kakao only as a coarse (about 100m) point, and nothing about it is kept.
export type PlaceKind = 'cafe' | 'park' | 'library' | 'youth' | 'store';
export type Place = {id: string; name: string; kind: PlaceKind; detail: string; distance: number; minutes: number; address: string; url: string};
export type PlaceQuery = {kind: PlaceKind; lat?: number; lng?: number; near?: string};
export type PlaceResult = {places: Place[]; near: string | null};
// `pad` is the place's name in the pond (0.46.0): every real place is a lily pad a frog can hop to and rest on for a while.
// The real word (카페, 공원…) always stays beside it, so nobody has to guess what a 연잎 is.
// `free` marks kinds a person can walk into without paying (0.59.0, interview: many people in isolation have little money).
// `more` holds extra search words for kinds that go by several names; the results are merged.
export const placeKinds = [
 {id: 'cafe' as PlaceKind, label: '카페', obj: '카페를', pad: '따뜻한 연잎', title: '혼자 앉아 있어도 괜찮은 카페', search: '카페', more: [], code: 'CE7', radius: 1000, free: false,
  tip: '붐비지 않는 평일 낮이 비교적 편해요. 키오스크가 있는 곳이라면 말을 덜 해도 돼요.'},
 {id: 'park' as PlaceKind, label: '공원', obj: '공원을', pad: '풀숲 연잎', title: '눈치 보지 않고 걷는 공원', search: '공원', more: [], code: null, radius: 2000, free: true,
  tip: '벤치 하나를 목표로 정해도 충분해요. 사람이 많으면 바로 돌아와도 괜찮아요.'},
 {id: 'library' as PlaceKind, label: '도서관', obj: '도서관을', pad: '조용한 연잎', title: '말하지 않아도 되는 도서관', search: '도서관', more: [], code: null, radius: 3000, free: true,
  tip: '책을 빌리지 않아도 들어가 머물 수 있는 곳이 많아요. 쉬는 날은 도서관마다 달라요.'},
 {id: 'youth' as PlaceKind, label: '청년공간', obj: '청년공간을', pad: '열린 연잎', title: '그냥 들러도 되는 청년공간', search: '청년센터', more: ['청년공간'], code: null, radius: 5000, free: true,
  tip: '청년센터·청년공간은 대부분 돈을 내지 않고 머물 수 있어요. 처음엔 둘러보기만 해도 괜찮아요. 이용 나이와 여는 날은 곳마다 달라요.'},
 {id: 'store' as PlaceKind, label: '편의점', obj: '편의점을', pad: '가까운 연잎', title: '가장 짧은 외출, 편의점', search: '편의점', more: [], code: 'CS2', radius: 700, free: false,
  tip: '살 것 하나를 미리 정해 두면 마음이 편해요. 계산할 때 말없이 카드만 내밀어도 괜찮아요.'},
] as const;
// Missions whose next step is finding a real place nearby.
export const missionPlaces: Record<string, PlaceKind> = {'outside-store': 'store', 'outside-takeout': 'cafe', 'connect-order': 'cafe', 'outside-library': 'library', 'outside-park': 'park', 'outside-bench': 'park'};
export const MAX_PLACES = 8;
/** How many times each kind of place has been visited, read from the records (‘place-cafe’ and so on). Which place it was is never kept. */
export function padStamps(entries: readonly {missionId?: string}[]): Record<PlaceKind, number> {
 const n: Record<PlaceKind, number> = {cafe: 0, park: 0, library: 0, youth: 0, store: 0};
 for (const e of entries) { const k = e.missionId?.startsWith('place-') ? e.missionId.slice(6) : ''; if (k in n) n[k as PlaceKind]++; }
 return n;
}
/**
 * Whether places of this kind tend to be quiet at this hour. A general tendency (weekday lunch, weekend afternoons), not live data
 * about any one place, so every line says ‘보통’ or ‘~수 있어요’. Feedback: a recommended cafe should not feel crowded.
 */
export function quietHint(kind: PlaceKind, date = new Date()): {calm: boolean; text: string} {
 const h = date.getHours() + date.getMinutes() / 60, weekend = date.getDay() === 0 || date.getDay() === 6;
 if (kind === 'store') return (h >= 12 && h < 13) || (h >= 18 && h < 19.5) ? {calm: false, text: '지금은 잠깐 붐빌 수 있는 시간이에요. 조금 뒤가 더 한산할 수 있어요.'} : {calm: true, text: '편의점은 보통 오래 기다리지 않아요. 지금도 한산한 편일 거예요.'};
 if (h < 7 || h >= 21.5) return {calm: false, text: kind === 'park' ? '어두운 시간이에요. 밝은 길로만 다니거나, 낮에 가도 좋아요.' : '문을 닫은 곳이 많은 시간이에요. 지도에서 여는 시간을 먼저 확인해요.'};
 if (kind === 'cafe') {
  if (weekend) return h >= 13 && h < 18 ? {calm: false, text: '주말 오후는 붐비는 곳이 많아요. 오전이나 평일 낮이 편할 수 있어요.'} : {calm: true, text: '주말에도 보통 이 시간은 비교적 한산해요.'};
  if (h >= 11.5 && h < 13.5) return {calm: false, text: '점심 무렵은 붐비는 곳이 많아요. 2시가 지나면 한결 한산해져요.'};
  if (h >= 17.5) return {calm: false, text: '저녁 무렵은 조금 붐빌 수 있어요. 구석 자리가 있는지 먼저 봐도 좋아요.'};
  return {calm: true, text: '보통 평일 이 시간의 카페는 한산한 편이에요.'};
 }
 if (kind === 'park') return weekend && h >= 11 && h < 17 ? {calm: false, text: '주말 낮의 공원은 사람이 많을 수 있어요. 이른 아침이나 저녁이 조용해요.'} : {calm: true, text: '보통 이 시간의 공원은 한적한 편이에요.'};
 // Youth centres keep office-like hours: many rest on weekends and close in the early evening.
 if (kind === 'youth') return weekend ? {calm: false, text: '주말에는 쉬는 청년공간이 있어요. 지도에서 여는 날을 먼저 확인해요.'} : h >= 18 ? {calm: false, text: '저녁에는 일찍 닫는 곳이 있어요. 여는 시간을 먼저 확인해요.'} : {calm: true, text: '보통 평일 낮의 청년공간은 한산한 편이에요. 여는 시간만 확인해요.'};
 return weekend ? {calm: false, text: '주말의 도서관은 자리가 붐빌 수 있어요. 평일 낮이 가장 조용해요.'} : {calm: true, text: '보통 평일의 도서관은 조용한 편이에요. 쉬는 날만 확인해요.'};
}
export const placeKind = (id: PlaceKind) => placeKinds.find(k => k.id === id)!;
/** About 110m north-south and 90m east-west in Korea: close enough to find places, too coarse to pin a home. */
export const coarse = (n: number) => Math.round(n * 1000) / 1000;
export const inKorea = (lat: number, lng: number) => lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
/** A slow 4km/h walk, so the number never makes a place sound closer than it feels. */
export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 67));
export const formatDistance = (meters: number) => meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
export function mapLinks(kind: PlaceKind, near?: string | null) {
 const q = encodeURIComponent((near ? near + ' ' : '') + placeKind(kind).search);
 return {kakao: `https://map.kakao.com/link/search/${q}`, naver: `https://map.naver.com/p/search/${q}`};
}
/** A kind plus either a coarse point inside Korea or a short area name. 'outside' means a point abroad. */
export function parsePlaceQuery(value: unknown): PlaceQuery | 'outside' | null {
 if (!value || typeof value !== 'object') return null;
 const v = value as Record<string, unknown>;
 if (!placeKinds.some(k => k.id === v.kind)) return null;
 const kind = v.kind as PlaceKind;
 if (typeof v.near === 'string') {
  const near = v.near.replace(/\s+/g, ' ').trim();
  const safe = near.length >= 2 && near.length <= 30 && !/[<>{}\\]/.test(near) && [...near].every(c => c.charCodeAt(0) >= 32);
  return safe ? {kind, near} : null;
 }
 if (typeof v.lat !== 'number' || typeof v.lng !== 'number' || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return null;
 const lat = coarse(v.lat), lng = coarse(v.lng);
 return inKorea(lat, lng) ? {kind, lat, lng} : 'outside';
}
const PROVINCE = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\S*\s+/;
// Keyword search also finds parking lots and kids' cafes; keep places a young adult can simply walk into.
// Kakao's cafe group also holds board-game rooms, comic cafes and meeting rooms, and '커피랑도서관' is a paid study cafe.
// ‘청년센터’ and ‘청년공간’ also find shops, start-up offices, church youth groups and counselling clinics (checked against live results,
// 2026-11-27): keep places named for 청년 that are filed as public, cultural or educational facilities.
const YOUTH_GROUPS = ['사회,공공기관', '문화,예술', '교육,학문'];
function fits(kind: PlaceKind, path: string[], name: string) {
 if (path.some(s => s.includes('주차장'))) return false;
 if (kind === 'youth') return name.includes('청년') && !/창업|청년부/.test(name) && YOUTH_GROUPS.includes(path[0]) && !path.includes('종교');
 if (kind === 'park') return path.some(s => s.endsWith('공원'));
 if (kind === 'library') return path.includes('도서관');
 if (kind === 'cafe') return path[0] === '음식점' && path[1] === '카페' && !path.some(s => /키즈카페|룸카페|라이브카페|사주카페|^다방$/.test(s));
 return true;
}
/** Kakao Local documents → at most eight places, nearest first. Unknown shapes are skipped, not trusted. */
export function toPlaces(docs: unknown, kind: PlaceKind): Place[] {
 if (!Array.isArray(docs)) return [];
 const out: Place[] = [];
 for (const d of docs) {
  if (!d || typeof d !== 'object') continue;
  const doc = d as Record<string, unknown>;
  const id = String(doc.id ?? '');
  if (!/^\d{1,20}$/.test(id) || out.some(p => p.id === id)) continue;
  const name = typeof doc.place_name === 'string' ? doc.place_name.trim().slice(0, 60) : '';
  const path = typeof doc.category_name === 'string' ? doc.category_name.split('>').map(s => s.trim()).filter(Boolean) : [];
  const distance = Math.round(Number(doc.distance));
  if (!name || !fits(kind, path, name) || doc.distance === '' || !Number.isFinite(distance) || distance < 0) continue;
  const road = typeof doc.road_address_name === 'string' ? doc.road_address_name : '';
  const address = road || (typeof doc.address_name === 'string' ? doc.address_name : '');
  // Kakao files youth centres under words like ‘단체,협회’, which say nothing to a visitor, so that line is left out.
  out.push({id, name, kind, detail: kind === 'youth' ? '' : (path.at(-1) ?? '').slice(0, 30), distance, minutes: walkMinutes(distance), address: address.replace(PROVINCE, '').slice(0, 80), url: `https://place.map.kakao.com/${id}`});
 }
 return out.sort((a, b) => a.distance - b.distance).slice(0, MAX_PLACES);
}
export class PlaceError extends Error {
 code: 'not_found' | 'unavailable';
 constructor(code: 'not_found' | 'unavailable') { super(code); this.code = code; }
}
const KAKAO = 'https://dapi.kakao.com/v2/local';
async function kakao(path: string, params: Record<string, string | number>, key: string, fetchImpl: typeof fetch) {
 const url = new URL(KAKAO + path);
 for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
 const response = await fetchImpl(url, {headers: {Authorization: `KakaoAK ${key}`}, signal: AbortSignal.timeout(6000), cache: 'no-store'});
 if (!response.ok) throw new PlaceError('unavailable');
 const data = await response.json() as {documents?: unknown};
 return Array.isArray(data.documents) ? data.documents as Record<string, unknown>[] : [];
}
/** An area name is looked up first (a station, a building, then an address) and the search runs around it. */
export async function searchPlaces(query: PlaceQuery, key: string, fetchImpl: typeof fetch = fetch): Promise<PlaceResult> {
 let lat = query.lat, lng = query.lng, near: string | null = null;
 if (query.near) {
  let hit = (await kakao('/search/keyword.json', {query: query.near, size: 1}, key, fetchImpl))[0];
  let label = typeof hit?.place_name === 'string' ? hit.place_name : null;
  if (!hit) { hit = (await kakao('/search/address.json', {query: query.near, size: 1}, key, fetchImpl))[0]; label = typeof hit?.address_name === 'string' ? hit.address_name : null; }
  const x = Number(hit?.x), y = Number(hit?.y);
  if (!hit || !inKorea(y, x)) throw new PlaceError('not_found');
  lat = y; lng = x; near = (label ?? query.near).slice(0, 40);
 }
 if (lat === undefined || lng === undefined) throw new PlaceError('not_found');
 const kind = placeKind(query.kind);
 const around = {x: lng, y: lat, radius: kind.radius, sort: 'distance', size: 15};
 const docs = kind.code ? await kakao('/search/category.json', {...around, category_group_code: kind.code}, key, fetchImpl) : (await Promise.all([kind.search, ...kind.more].map(query => kakao('/search/keyword.json', {...around, query}, key, fetchImpl)))).flat();
 return {places: toPlaces(docs, query.kind), near};
}
