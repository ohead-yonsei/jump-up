import { localDay, usageSummary, validEntries, validVisits, validParticipant, recordRows, recordsHeader, toCsv, type Entry } from './records';

/** Letters and digits that are hard to mix up when read aloud or copied from paper (no 0/O, 1/I/L). */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 8;
export const OPERATOR_CODE_LENGTH = 12;
export const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
const fromAlphabet = (value: string, length: number) => value.length === length && [...value].every(c => CODE_ALPHABET.includes(c));
export const validJoinCode = (value: string) => fromAlphabet(value, JOIN_CODE_LENGTH);
export const validOperatorCode = (value: string) => fromAlphabet(value, OPERATOR_CODE_LENGTH);
/** Groups of four, the way people read codes out: 7K3Q-PW2M. */
export const formatCode = (value: string) => value.match(/.{1,4}/g)?.join('-') ?? value;

/** Today on the Korean calendar, so cohort dates and day counts do not shift with the server's time zone. */
export const seoulDay = (at: Date | string = new Date()) => new Date(at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

export type CohortInfo = { name: string; org: string; startsOn: string; endsOn: string };
/** A calendar day that exists: 2026-02-30 is turned away instead of rolling over to March. */
export const validDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
export function validCohortInput(value: unknown): CohortInfo | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const name = typeof v.name === 'string' ? v.name.trim() : '';
  const org = typeof v.org === 'string' ? v.org.trim() : '';
  const startsOn = v.startsOn, endsOn = v.endsOn;
  if (!name || name.length > 40 || org.length > 40 || !validDay(startsOn) || !validDay(endsOn) || endsOn < startsOn) return null;
  return { name, org, startsOn, endsOn };
}
export const cohortEnded = (cohort: CohortInfo, today = seoulDay()) => cohort.endsOn < today;
export function cohortStage(cohort: CohortInfo, today = seoulDay()) {
  return today < cohort.startsOn ? '시작 전' : cohortEnded(cohort, today) ? '마침' : '진행 중';
}

/** What the device keeps after joining: the cohort as shown to the person, and which records and days it has already sent
 * (or chose not to send, for everything from before joining). Tracking ids rather than a time keeps a wrong device clock from skipping records. */
export type Membership = CohortInfo & { token: string; joinedAt: string; sent: string[]; sentVisits: string[]; code: string; lastSync: string };
const time = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
const strings = (value: unknown, max: number, ok: (s: string) => boolean): value is string[] => Array.isArray(value) && value.length <= max && value.every(s => typeof s === 'string' && ok(s));
export function validMembership(value: unknown): Membership | null {
  const info = validCohortInput(value);
  if (!info) return null;
  const v = value as Record<string, unknown>;
  const token = v.token, joinedAt = v.joinedAt, sent = v.sent, sentVisits = v.sentVisits, code = v.code, lastSync = v.lastSync;
  // Without the sent lists there is no telling which records are from before joining, so the device has to join again.
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !time(joinedAt) || !strings(sent, 4000, s => s.length <= 100) || !strings(sentVisits, 2000, validDay)) return null;
  return { ...info, token, joinedAt, sent, sentVisits, code: typeof code === 'string' && validParticipant(code) ? code : '', lastSync: time(lastSync) ? lastSync : '' };
}
/** Everything already on the device counts as handled, except today's visit, so only what comes after joining is sent. */
export function startMembership(cohort: CohortInfo, token: string, code: string, entries: Entry[], visits: string[], now = new Date()): Membership {
  const today = localDay(now);
  return { ...cohort, token, code, joinedAt: now.toISOString(), sent: entries.map(e => e.id), sentVisits: visits.filter(d => d !== today), lastSync: '' };
}

export const MAX_SYNC_ENTRIES = 500;
export const MAX_SYNC_BYTES = 400_000;
export function pendingSync(entries: Entry[], visits: string[], m: Membership) {
  const sent = new Set(m.sent), sentVisits = new Set(m.sentVisits);
  return { entries: entries.filter(e => !sent.has(e.id)), visits: visits.filter(d => !sentVisits.has(d)) };
}
/** Marks a batch as sent, keeping only ids still on the device so the lists stay as short as the records themselves. */
export function afterSync(m: Membership, entries: Entry[], visits: string[], batch: Entry[], batchVisits: string[], code: string, now = new Date()): Membership {
  const ids = new Set([...m.sent, ...batch.map(e => e.id)]), days = new Set([...m.sentVisits, ...batchVisits]);
  return { ...m, code, lastSync: now.toISOString(), sent: entries.map(e => e.id).filter(id => ids.has(id)), sentVisits: visits.filter(d => days.has(d)) };
}

const ENTRY_KEYS = ['id', 'at', 'type', 'title', 'energy', 'energyLevel', 'missionId', 'goal', 'springStage', 'rating', 'before', 'after', 'mode', 'calm', 'talk', 'outside', 'note', 'supportId', 'channel'] as const;
/** Rebuilds a record from known fields only, so the server never stores anything else a client adds. */
export function storedEntry(e: Entry): Entry {
  const kept: Record<string, unknown> = {};
  for (const key of ENTRY_KEYS) if (e[key] !== undefined) kept[key] = e[key];
  return { ...kept, at: new Date(e.at).toISOString() } as Entry;
}
export function validSync(value: unknown): { participant: string; entries: Entry[]; visits: string[] } | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.entries) || v.entries.length > MAX_SYNC_ENTRIES || !Array.isArray(v.visits) || v.visits.length > 730) return null;
  const participant = typeof v.participant === 'string' && validParticipant(v.participant) ? v.participant : '';
  const entries = validEntries(v.entries).filter(e => /^[A-Za-z0-9-]{1,64}$/.test(e.id)).map(storedEntry);
  return { participant, entries, visits: validVisits(v.visits).filter(validDay) };
}

/** One person's records as the operator pages see them: a pseudonymous code, never a name. */
export type ParticipantRecords = { id: string; code: string; joinedAt: string; lastSyncAt: string | null; entries: Entry[]; visits: string[] };
const koreanDay = (at: string) => seoulDay(at);
export function participantSummary(p: ParticipantRecords, now = new Date()) {
  const weekAgo = seoulDay(new Date(now.getTime() - 6 * 864e5));
  const activity = p.entries.filter(e => e.type === 'step' || e.type === 'rest' || e.type === 'practice');
  const checkins = p.entries.filter(e => e.type === 'checkin');
  return {
    ...usageSummary(p.entries, p.visits, koreanDay),
    recentActiveDays: new Set(activity.map(e => koreanDay(e.at)).filter(d => d >= weekAgo)).size,
    firstCheckin: checkins[0] ?? null,
    lastCheckin: checkins.length > 1 ? checkins.at(-1)! : null,
    notes: p.entries.filter(e => e.type === 'feedback').length,
  };
}
/** The same columns as a person's own export, one block of rows per participant. */
export function cohortCsv(people: ParticipantRecords[]) {
  return toCsv([recordsHeader, ...people.flatMap(p => recordRows(p.entries, p.code, p.visits, koreanDay))]);
}
