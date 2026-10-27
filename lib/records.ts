export type Entry = {
  id: string; at: string; type: 'step' | 'rest' | 'practice' | 'feedback' | 'checkin' | 'contact';
  missionId?: string; goal?: string; springStage?: number;
  title: string; energy: number | null; rating?: number; before?: number; after?: number; mode?: string;
  /** Optional self check-in for the field study: comfort of mind, of short talks, of going out (1-5). */
  calm?: number; talk?: number; outside?: number;
  /** A short free-text note the person chose to leave about the app. */
  note?: string;
  /** A contact button tapped in the help finder: which service and how. Whether the call or message happened is not known. */
  supportId?: string; channel?: 'phone' | 'text' | 'web';
};
export const contactChannelLabel = { phone: '전화', text: '문자', web: '온라인' } as const;
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
/** Enough for months of daily use; past it the oldest records roll off, except the first check-in, the study baseline. */
export const MAX_ENTRIES = 1000;
export function keepEntries(entries: Entry[], max = MAX_ENTRIES) {
  if (entries.length <= max) return entries;
  const baseline = entries.find(e => e.type === 'checkin');
  const tail = entries.slice(-max);
  return baseline && !tail.includes(baseline) ? [baseline, ...entries.slice(-(max - 1))] : tail;
}
/** Days the app was opened, as local dates, so a day of just looking around still counts as coming back. */
export const MAX_VISITS = 730;
export function localDay(at: Date | string = new Date()) {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addVisit(visits: string[], day = localDay()) {
  return visits.includes(day) ? visits : [...visits, day].sort().slice(-MAX_VISITS);
}
export function validVisits(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const days = value.filter((v): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)));
  return [...new Set(days)].sort().slice(-MAX_VISITS);
}
/** One line per person for the study sheet: over how many days, how often, how much, and contacts tried. */
export function usageSummary(entries: Entry[], visits: string[]) {
  const days = [...new Set([...visits, ...entries.map(e => localDay(e.at))])].sort();
  const firstDay = days[0] ?? '', lastDay = days.at(-1) ?? '';
  const activity = entries.filter(e => e.type === 'step' || e.type === 'rest' || e.type === 'practice');
  return {
    firstDay, lastDay,
    spanDays: firstDay ? Math.round((Date.parse(lastDay) - Date.parse(firstDay)) / 864e5) + 1 : 0,
    visitDays: days.length,
    activeDays: new Set(activity.map(e => localDay(e.at))).size,
    contactTaps: entries.filter(e => e.type === 'contact').length,
  };
}
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
  const kept = value.filter((e): e is Entry => !!e && typeof e === 'object'
    && typeof e.id === 'string' && typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at))
    && ['step', 'rest', 'practice', 'feedback', 'checkin', 'contact'].includes(e.type)
    && typeof e.title === 'string' && e.title.length <= 200
    && (e.energy === null || (Number.isInteger(e.energy) && e.energy >= 1 && e.energy <= 5))
    && (e.missionId === undefined || (typeof e.missionId === 'string' && e.missionId.length <= 100))
    && (e.goal === undefined || ['rhythm','outside','connect'].includes(e.goal))
    && (e.springStage === undefined || (Number.isInteger(e.springStage) && e.springStage >= 0 && e.springStage <= 3))
    && score(e.rating) && score(e.before) && score(e.after) && score(e.calm) && score(e.talk) && score(e.outside)
    && (e.note === undefined || (typeof e.note === 'string' && e.note.length <= 300))
    && (e.mode === undefined || ['example', 'live'].includes(e.mode))
    && (e.supportId === undefined || (typeof e.supportId === 'string' && /^[a-z0-9-]{1,60}$/.test(e.supportId)))
    && (e.channel === undefined || ['phone', 'text', 'web'].includes(e.channel)));
  return keepEntries(kept);
}
/** One row per record, a summary row first and a row per day the app was opened. Columns added later go at the end. */
export function recordsCsv(entries: Entry[], participant = 'session-only', visits: string[] = []) {
  // Spreadsheet applications may execute formula-like text even inside quotes.
  const escape = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const u = usageSummary(entries, visits);
  const blank = (n: number) => Array<string>(n).fill('');
  return '\uFEFF' + [
    ['participant_code', 'record_id', 'date', 'type', 'title', 'energy', 'rating', 'confidence_before', 'confidence_after', 'practice_mode', 'mission_id', 'goal', 'spring_stage', 'calm', 'talk_comfort', 'outside_comfort', 'note',
      'support_id', 'contact_channel', 'first_day', 'last_day', 'span_days', 'visit_days', 'active_days', 'contact_taps'],
    [participant, 'summary', u.lastDay, 'summary', '이용 요약', ...blank(12), ...blank(2), u.firstDay, u.lastDay, u.spanDays, u.visitDays, u.activeDays, u.contactTaps],
    ...entries.map(e => [participant, e.id, e.at, e.type, e.title, e.energy, e.rating, e.before, e.after, e.mode, e.missionId, e.goal, e.springStage, e.calm, e.talk, e.outside, e.note, e.supportId, e.channel, ...blank(6)]),
    ...visits.map(day => [participant, 'visit-' + day, day, 'visit', '폴짝을 연 날', ...blank(20)]),
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
      count: entries.filter(e => (e.type === 'step' || e.type === 'rest' || e.type === 'practice') && new Date(e.at).toLocaleDateString() === date.toLocaleDateString()).length };
  });
}
