export type Entry = {
  id: string; at: string; type: 'step' | 'rest' | 'practice' | 'feedback' | 'checkin';
  missionId?: string; goal?: string; springStage?: number;
  title: string; energy: number | null; rating?: number; before?: number; after?: number; mode?: string;
  /** Optional self check-in for the field study: comfort of mind, of short talks, of going out (1-5). */
  calm?: number; talk?: number; outside?: number;
  /** A short free-text note the person chose to leave about the app. */
  note?: string;
};
/** The three questions are self-reported and never scored or compared with anyone else. */
export const checkinQuestions = [
  { key: 'calm', short: '마음의 편안함', label: '요즘 마음이 얼마나 편안한가요?', low: '많이 불안해요', high: '꽤 편안해요' },
  { key: 'talk', short: '대화의 편안함', label: '짧은 대화를 나누는 일은 얼마나 편한가요?', low: '아직 어려워요', high: '편하게 할 수 있어요' },
  { key: 'outside', short: '바깥의 편안함', label: '집 밖에 나가는 일은 얼마나 편한가요?', low: '아직 어려워요', high: '편하게 할 수 있어요' },
] as const;
export const CHECKIN_EVERY_DAYS = 7;
export function lastCheckin(entries: Entry[]) { return [...entries].reverse().find(e => e.type === 'checkin') ?? null; }
export function checkinDue(entries: Entry[], now = new Date()) {
  const last = lastCheckin(entries);
  return !last || now.getTime() - Date.parse(last.at) >= CHECKIN_EVERY_DAYS * 864e5;
}
export const validParticipant = (code: string) => /^[A-Za-z0-9-]{1,16}$/.test(code);
export const STORAGE_KEY = 'one-step-ai-v1';
export function recordId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
const score = (v: unknown) => v === undefined || (Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 5);
export function validEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((e): e is Entry => !!e && typeof e === 'object'
    && typeof e.id === 'string' && typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at))
    && ['step', 'rest', 'practice', 'feedback', 'checkin'].includes(e.type)
    && typeof e.title === 'string' && e.title.length <= 200
    && (e.energy === null || (Number.isInteger(e.energy) && e.energy >= 1 && e.energy <= 5))
    && (e.missionId === undefined || (typeof e.missionId === 'string' && e.missionId.length <= 100))
    && (e.goal === undefined || ['rhythm','outside','connect'].includes(e.goal))
    && (e.springStage === undefined || (Number.isInteger(e.springStage) && e.springStage >= 0 && e.springStage <= 3))
    && score(e.rating) && score(e.before) && score(e.after) && score(e.calm) && score(e.talk) && score(e.outside)
    && (e.note === undefined || (typeof e.note === 'string' && e.note.length <= 300))
    && (e.mode === undefined || ['example', 'live'].includes(e.mode))).slice(-200);
}
export function recordsCsv(entries: Entry[], participant = 'session-only') {
  // Spreadsheet applications may execute formula-like text even inside quotes.
  const escape = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [
    ['participant_code', 'record_id', 'date', 'type', 'title', 'energy', 'rating', 'confidence_before', 'confidence_after', 'practice_mode', 'mission_id', 'goal', 'spring_stage', 'calm', 'talk_comfort', 'outside_comfort', 'note'],
    ...entries.map(e => [participant, e.id, e.at, e.type, e.title, e.energy, e.rating, e.before, e.after, e.mode, e.missionId, e.goal, e.springStage, e.calm, e.talk, e.outside, e.note]),
  ].map(row => row.map(escape).join(',')).join('\r\n');
}
export function demoEntries(now = new Date()): Entry[] {
  const at = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(15, 0, 0, 0); return d.toISOString(); };
  return [
    { id: 'demo-1', at: at(4), type: 'step', title: '창밖의 색 하나 찾기', energy: 1 },
    { id: 'demo-2', at: at(2), type: 'rest', title: '내 속도로 쉬어가기', energy: 2 },
    { id: 'demo-3', at: at(1), type: 'practice', title: '카페에서 주문하기', energy: 3, before: 2, after: 3, mode: 'example' },
  ];
}
export function weekMoments(entries: Entry[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setDate(date.getDate() - 6 + i);
    return { label: date.toLocaleDateString('ko-KR', { weekday: 'short' }), day: date.getDate(), today: i === 6,
      count: entries.filter(e => e.type !== 'feedback' && e.type !== 'checkin' && new Date(e.at).toLocaleDateString() === date.toLocaleDateString()).length };
  });
}
