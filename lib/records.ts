import type { Energy } from './content';
import { usageRows, usageTotals, type Usage } from './usage';
export type Entry = {
  id: string; at: string; type: 'step' | 'rest' | 'practice' | 'feedback' | 'checkin' | 'contact';
  missionId?: string; goal?: string; springStage?: number;
  /** `energy` is the old 5-level value and is only set on records made before 0.26.0. Newer records leave it null and set `energyLevel` (1-3). */
  title: string; energy: number | null; energyLevel?: Energy; rating?: number; before?: number; after?: number; mode?: string;
  /** Optional self check-in for the field study: comfort of mind, of short talks, of going out (1-5). */
  calm?: number; talk?: number; outside?: number;
  /** A short free-text note the person chose to leave about the app. */
  note?: string;
  /** The word, emoji or line the person chose to leave with a mission (answers.ts). Kept on the device only. */
  answer?: string;
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
/**
 * 돌아보기(0.47.0): three numbers about the app itself — how it was to use, wanting to keep caring for the friend, and how the mind
 * felt meanwhile. Second-round feedback asked for a numeric measure, ‘even something as simple as positive’.
 * Each answer is a `feedback` record with a `rating` (1-5) and the question's id in `missionId`, so nothing new is stored on the server.
 * The third question is two-sided: 3 means no change, below it heavier, above it lighter.
 */
export const reviewQuestions = [
  { id: 'review-use', short: '써보니', label: '폴짝을 써보니 어땠나요?', low: '불편했어요', high: '편했어요' },
  { id: 'review-grow', short: '돌보고 싶은 마음', label: '친구를 계속 돌보고 싶었나요?', low: '별로였어요', high: '많이 그랬어요' },
  { id: 'review-change', short: '마음의 변화', label: '폴짝을 쓰는 동안 마음은 어땠나요?', low: '더 무거워졌어요', high: '더 가벼워졌어요' },
] as const;
export type ReviewId = typeof reviewQuestions[number]['id'];
export const isReview = (e: Pick<Entry, 'type' | 'missionId' | 'rating'>) => e.type === 'feedback' && !!e.rating && reviewQuestions.some(q => q.id === e.missionId);
export const REVIEW_AFTER_DAYS = 3, REVIEW_EVERY_DAYS = 14;
/** Asked once the person has been here a few days, and again two weeks after the last answer. */
export function reviewDue(entries: Entry[], togetherDays: number, now = new Date()) {
  if (togetherDays < REVIEW_AFTER_DAYS) return false;
  const last = [...entries].reverse().find(isReview);
  return !last || now.getTime() - Date.parse(last.at) >= REVIEW_EVERY_DAYS * 864e5;
}
/** The most recent answer to each question, or null where there is none yet. */
export function latestReview(entries: Entry[]): Record<ReviewId, number | null> {
  const out = { 'review-use': null, 'review-grow': null, 'review-change': null } as Record<ReviewId, number | null>;
  for (const e of entries) if (isReview(e)) out[e.missionId as ReviewId] = e.rating!;
  return out;
}
export const CHECKIN_EVERY_DAYS = 7;
export function lastCheckin(entries: Entry[]) { return [...entries].reverse().find(e => e.type === 'checkin') ?? null; }
export function checkinDue(entries: Entry[], now = new Date()) {
  const last = lastCheckin(entries);
  return !last || now.getTime() - Date.parse(last.at) >= CHECKIN_EVERY_DAYS * 864e5;
}
/** The old five levels on today's three: 1-2 → 쉬어갈래요, 3 → 작은 것 하나, 4-5 → 조금 더 해볼래요. */
export const fromFiveLevels = (energy: number): Energy => energy <= 2 ? 1 : energy === 3 ? 2 : 3;
/** A record's energy on the 3-level scale, whichever version of the app made it. */
export function entryEnergy(e: Pick<Entry, 'energy' | 'energyLevel'>): Energy | null {
  return e.energyLevel ?? (e.energy === null ? null : fromFiveLevels(e.energy));
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
/** One line per person for the study sheet: over how many days, how often, how much, and contacts tried.
 * `dayOf` turns a record time into a day; the server passes Korea's calendar day so it matches the device. */
export function usageSummary(entries: Entry[], visits: string[], dayOf: (at: string) => string = localDay) {
  const days = [...new Set([...visits, ...entries.map(e => dayOf(e.at))])].sort();
  const firstDay = days[0] ?? '', lastDay = days.at(-1) ?? '';
  const activity = entries.filter(e => e.type === 'step' || e.type === 'rest' || e.type === 'practice');
  return {
    firstDay, lastDay,
    spanDays: firstDay ? Math.round((Date.parse(lastDay) - Date.parse(firstDay)) / 864e5) + 1 : 0,
    visitDays: days.length,
    activeDays: new Set(activity.map(e => dayOf(e.at))).size,
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
/** The longest answer a mission can leave (the same as `ANSWER_MAX.line` in answers.ts). */
export const MAX_ANSWER = 100;
const score = (v: unknown) => v === undefined || (Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 5);
export function validEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  const kept = value.filter((e): e is Entry => !!e && typeof e === 'object'
    && typeof e.id === 'string' && typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at))
    && ['step', 'rest', 'practice', 'feedback', 'checkin', 'contact'].includes(e.type)
    && typeof e.title === 'string' && e.title.length <= 200
    && (e.energy === null || (Number.isInteger(e.energy) && e.energy >= 1 && e.energy <= 5))
    && (e.energyLevel === undefined || [1, 2, 3].includes(e.energyLevel))
    && (e.missionId === undefined || (typeof e.missionId === 'string' && e.missionId.length <= 100))
    && (e.goal === undefined || ['rhythm','outside','connect'].includes(e.goal))
    && (e.springStage === undefined || (Number.isInteger(e.springStage) && e.springStage >= 0 && e.springStage <= 3))
    && score(e.rating) && score(e.before) && score(e.after) && score(e.calm) && score(e.talk) && score(e.outside)
    && (e.note === undefined || (typeof e.note === 'string' && e.note.length <= 300))
    && (e.answer === undefined || (typeof e.answer === 'string' && e.answer.length > 0 && [...e.answer].length <= MAX_ANSWER))
    && (e.mode === undefined || ['example', 'live'].includes(e.mode))
    && (e.supportId === undefined || (typeof e.supportId === 'string' && /^[a-z0-9-]{1,60}$/.test(e.supportId)))
    && (e.channel === undefined || ['phone', 'text', 'web'].includes(e.channel)));
  return keepEntries(kept);
}
export const recordsHeader = ['participant_code', 'record_id', 'date', 'type', 'title', 'energy', 'rating', 'confidence_before', 'confidence_after', 'practice_mode', 'mission_id', 'goal', 'spring_stage', 'calm', 'talk_comfort', 'outside_comfort', 'note',
  'support_id', 'contact_channel', 'first_day', 'last_day', 'span_days', 'visit_days', 'active_days', 'contact_taps', 'energy_level', 'screen', 'seconds', 'opens'];
/** One person's rows: a summary row first, a row per record and a row per day the app was opened. Columns added later go at the end.
 * `energy` keeps the 5-level value of records made before 0.26.0 and is empty after; `energy_level` is 1-3 for every record (old values converted).
 * `usage` (0.47.0) adds the time on each screen and a few press counts, a row per day and screen or action: `screen` names it,
 * `seconds` is the time and `opens` the count. The summary row carries the totals. A cohort's sheet has no usage, so those cells stay empty. */
export function recordRows(entries: Entry[], participant = 'session-only', visits: string[] = [], dayOf: (at: string) => string = localDay, usage: Usage = {}): unknown[][] {
  const u = usageSummary(entries, visits, dayOf);
  const blank = (n: number) => Array<string>(n).fill('');
  const t = usageTotals(usage); const used = t.days > 0;
  return [
    [participant, 'summary', u.lastDay, 'summary', '이용 요약', ...blank(12), ...blank(2), u.firstDay, u.lastDay, u.spanDays, u.visitDays, u.activeDays, u.contactTaps, '', used ? (t.most ?? '') : '', used ? t.seconds : '', used ? t.opens : ''],
    ...entries.map(e => [participant, e.id, e.at, e.type, e.title, e.energy, e.rating, e.before, e.after, e.mode, e.missionId, e.goal, e.springStage, e.calm, e.talk, e.outside, e.note, e.supportId, e.channel, ...blank(6), entryEnergy(e), ...blank(3)]),
    ...visits.map(day => [participant, 'visit-' + day, day, 'visit', '폴짝을 연 날', ...blank(24)]),
    ...usageRows(usage).map(([day, kind, id, label, seconds, count]) => [participant, `${kind}-${day}-${id}`, day, kind, label, ...blank(21), id, seconds, count]),
  ];
}
export function toCsv(rows: unknown[][]) {
  // Spreadsheet applications may execute formula-like text even inside quotes.
  const escape = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n');
}
export function recordsCsv(entries: Entry[], participant = 'session-only', visits: string[] = [], usage: Usage = {}) {
  return toCsv([recordsHeader, ...recordRows(entries, participant, visits, localDay, usage)]);
}
export function demoEntries(now = new Date()): Entry[] {
  const at = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(15, 0, 0, 0); return d.toISOString(); };
  return [
    { id: 'demo-1', at: at(4), type: 'step', title: '창밖의 색 하나 찾기', energy: null, energyLevel: 1 },
    { id: 'demo-2', at: at(2), type: 'rest', title: '내 속도로 쉬어가기', energy: null, energyLevel: 1 },
    { id: 'demo-3', at: at(1), type: 'practice', title: '카페에서 주문하기', energy: null, energyLevel: 2, before: 2, after: 3, mode: 'example' },
  ];
}
export function weekMoments(entries: Entry[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setDate(date.getDate() - 6 + i);
    return { label: date.toLocaleDateString('ko-KR', { weekday: 'short' }), day: date.getDate(), today: i === 6,
      count: entries.filter(e => (e.type === 'step' || e.type === 'rest' || e.type === 'practice') && new Date(e.at).toLocaleDateString() === date.toLocaleDateString()).length };
  });
}
