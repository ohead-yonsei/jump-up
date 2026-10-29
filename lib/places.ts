// Nearby places for an outing at your own pace. The search goes through the server so the person's
// location reaches Kakao only as a coarse (about 100m) point, and nothing about it is kept.
export type PlaceKind = 'cafe' | 'park' | 'library' | 'store';
export type Place = {id: string; name: string; kind: PlaceKind; detail: string; distance: number; minutes: number; address: string; url: string};
export type PlaceQuery = {kind: PlaceKind; lat?: number; lng?: number; near?: string};
export type PlaceResult = {places: Place[]; near: string | null};
export const placeKinds = [
 {id: 'cafe' as PlaceKind, label: '카페', obj: '카페를', title: '혼자 앉아 있어도 괜찮은 카페', search: '카페', code: 'CE7', radius: 1000,
  tip: '붐비지 않는 평일 낮이 비교적 편해요. 키오스크가 있는 곳이라면 말을 덜 해도 돼요.'},
 {id: 'park' as PlaceKind, label: '공원', obj: '공원을', title: '눈치 보지 않고 걷는 공원', search: '공원', code: null, radius: 2000,
  tip: '벤치 하나를 목표로 정해도 충분해요. 사람이 많으면 바로 돌아와도 괜찮아요.'},
 {id: 'library' as PlaceKind, label: '도서관', obj: '도서관을', title: '말하지 않아도 되는 도서관', search: '도서관', code: null, radius: 3000,
  tip: '책을 빌리지 않아도 들어가 머물 수 있는 곳이 많아요. 쉬는 날은 도서관마다 달라요.'},
 {id: 'store' as PlaceKind, label: '편의점', obj: '편의점을', title: '가장 짧은 외출, 편의점', search: '편의점', code: 'CS2', radius: 700,
  tip: '살 것 하나를 미리 정해 두면 마음이 편해요. 계산할 때 말없이 카드만 내밀어도 괜찮아요.'},
] as const;
// Missions whose next step is finding a real place nearby.
export const missionPlaces: Record<string, PlaceKind> = {'outside-store': 'store', 'outside-takeout': 'cafe', 'connect-order': 'cafe', 'outside-library': 'library', 'outside-park': 'park', 'outside-bench': 'park'};
export const MAX_PLACES = 8;
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
function fits(kind: PlaceKind, path: string[]) {
 if (path.some(s => s.includes('주차장'))) return false;
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
  if (!name || !fits(kind, path) || doc.distance === '' || !Number.isFinite(distance) || distance < 0) continue;
  const road = typeof doc.road_address_name === 'string' ? doc.road_address_name : '';
  const address = road || (typeof doc.address_name === 'string' ? doc.address_name : '');
  out.push({id, name, kind, detail: (path.at(-1) ?? '').slice(0, 30), distance, minutes: walkMinutes(distance), address: address.replace(PROVINCE, '').slice(0, 80), url: `https://place.map.kakao.com/${id}`});
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
 const docs = kind.code ? await kakao('/search/category.json', {...around, category_group_code: kind.code}, key, fetchImpl) : await kakao('/search/keyword.json', {...around, query: kind.search}, key, fetchImpl);
 return {places: toPlaces(docs, query.kind), near};
}
