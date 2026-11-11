// 연못 마을(0.29.0): a pond with grass around it, where a member walks and swims with their own frog.
// Everything here is plain arithmetic so that every device draws the same pond without a server telling it where things are.
// Other frogs are either moving right now (their owner is in the village) or drifting on their own (they came by today);
// the two are drawn the same way on purpose, so the pond never says who is online.
// Units are the pond's own: x grows to the right, y grows towards the viewer. The 3D scene scales them down.

export const POND = { cx: 360, cy: 440, rx: 300, ry: 360 };
/** The village: the pond and the grass around it. Frogs can go anywhere inside this. */
export const LAND = { rx: 520, ry: 580 };
/** Pixels a second, for a frog its owner is steering. */
export const SPEED = 130;
/** How many other frogs one screen draws. More than this and the nearest moving ones come first. */
export const MAX_SHOWN = 12;
/** A frog whose owner has not been heard from for this long goes back to strolling. */
export const LIVE_STALE_MS = 8000;
export type Point = { x: number; y: number };

const reach = (p: Point, r: { rx: number; ry: number }) => Math.hypot((p.x - POND.cx) / r.rx, (p.y - POND.cy) / r.ry);
/** True on the water, false on the grass. */
export const inPond = (p: Point) => reach(p, POND) <= 1;
export const inVillage = (p: Point) => reach(p, LAND) <= 1 + 1e-9;
/** Brings a point back inside the village along the line to the middle of the pond. */
export function clampToVillage(p: Point): Point {
  const d = reach(p, LAND); if (d <= 1) return p;
  return { x: POND.cx + (p.x - POND.cx) / d, y: POND.cy + (p.y - POND.cy) / d };
}

/** A steady number in [0, 1) from a string. The same id gives the same spot on every device. */
export function hash01(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** One step of steering: `dir` is the joystick, each axis in [-1, 1]. Diagonals are not faster than straight lines. */
export function step(p: Point, dir: Point, seconds: number): Point {
  const len = Math.hypot(dir.x, dir.y); if (!len) return p;
  const k = Math.min(1, len) / len * SPEED * seconds;
  return clampToVillage({ x: p.x + dir.x * k, y: p.y + dir.y * k });
}
/** Moves `p` towards `to` at walking speed and stops there. */
export function approach(p: Point, to: Point, seconds: number, speed = SPEED): Point {
  const dx = to.x - p.x, dy = to.y - p.y, d = Math.hypot(dx, dy), reach = speed * seconds;
  return d <= reach ? { ...to } : { x: p.x + dx / d * reach, y: p.y + dy / d * reach };
}

const STROLL_MS = 16000;
const home = (id: string): Point => { const a = hash01(id + ':hx') * Math.PI * 2, r = Math.sqrt(hash01(id + ':hy')) * .86; return { x: POND.cx + Math.cos(a) * LAND.rx * r, y: POND.cy + Math.sin(a) * LAND.ry * r }; };
const waypoint = (id: string, k: number): Point => {
  const h = home(id), a = hash01(`${id}:a:${k}`) * Math.PI * 2, r = 30 + hash01(`${id}:r:${k}`) * 110;
  return clampToVillage({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r * .8 });
};
/** Where a frog that came by today is strolling at time `now`: it walks to a new spot near its own corner, rests, and walks again.
 * Depends only on the id and the clock, so every member sees the same stroll. `still` keeps it at its resting spot (reduced motion). */
export function strollAt(id: string, now: number, still = false): Point & { moving: boolean } {
  const offset = hash01(id + ':t') * STROLL_MS, t = now + offset, k = Math.floor(t / STROLL_MS), f = (t % STROLL_MS) / STROLL_MS;
  const from = waypoint(id, k - 1), to = waypoint(id, k);
  if (still) return { ...to, moving: false };
  const walk = .45; if (f >= walk) return { ...to, moving: false };
  const e = f / walk, s = e * e * (3 - 2 * e);
  return { x: from.x + (to.x - from.x) * s, y: from.y + (to.y - from.y) * s, moving: true };
}

/** Where a floating pad sits: spread around the pond, the same on every device. */
export function padSpot(id: string, index: number): Point {
  const a = index * 2.39996 + (hash01(id + ':pa') - .5) * .3, r = Math.sqrt((index % 24 + .6) / 24) * .84 + (hash01(id + ':pr') - .5) * .05;
  return { x: POND.cx + Math.cos(a) * POND.rx * r, y: POND.cy + Math.sin(a) * POND.ry * r };
}

/** Which other frogs to draw when there are more than fit: the ones moving right now, nearest first, then today's other visitors
 * in an order that does not change from moment to moment. */
export function pickShown(me: Point, live: (Point & { id: string })[], visitors: string[], max = MAX_SHOWN): string[] {
  const d = (p: Point) => (p.x - me.x) ** 2 + (p.y - me.y) ** 2;
  const moving = [...live].sort((a, b) => d(a) - d(b) || (a.id < b.id ? -1 : 1)).map(p => p.id);
  const seen = new Set(moving);
  const rest = visitors.filter(id => !seen.has(id)).sort((a, b) => hash01(a + ':show') - hash01(b + ':show') || (a < b ? -1 : 1));
  return [...moving, ...rest].slice(0, max);
}

export type Move = Point & { id: string };
/** What one member tells the others while steering: which frog, and where. The name and the look never travel this way;
 * they come from the server's list of today's frogs, so a made-up message cannot put a made-up frog on the map. */
export function cleanMove(value: unknown): Move | null {
  const v = value as Partial<Move> | null;
  if (!v || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(v.id) || typeof v.x !== 'number' || typeof v.y !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  return { id: v.id, ...clampToVillage({ x: v.x, y: v.y }) };
}

/** 연못지기: the one frog that lives in the village. It is drawn with its own badge and never passes for a member. */
export const KEEPER = { id: 'keeper', name: '연못지기', spot: { x: 150, y: 760 } as Point, card: { name: '연못지기', color: 'leaf', growth: 'frog', equipped: { head: 'bucket' } as Record<string, string> } };
export const KEEPER_LINES = [
  '어서 와요. 오늘은 물이 잔잔해요.',
  '구경만 하다 가도 좋아요.',
  '연잎은 띄워도, 띄우지 않아도 괜찮아요.',
  '천천히 둘러봐요. 서두를 일이 없어요.',
  '와줘서 반가워요. 편한 자리에 머물러요.',
  '물가는 조용해서 쉬기 좋아요.',
  '다른 개구리에게 다가가 눌러 보면 응원을 건넬 수 있어요.',
];
/** One line a day, the same for everyone that day. */
export const keeperLine = (day: string) => KEEPER_LINES[Math.floor(hash01('keeper:' + day) * KEEPER_LINES.length)];
