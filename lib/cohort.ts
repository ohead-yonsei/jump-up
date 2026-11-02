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
const validDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
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

/** What the device keeps after joining: the cohort as shown to the person, and how far its records were sent. */
export type Membership = CohortInfo & { token: string; joinedAt: string; syncedThrough: string; visitsThrough: string; code: string; lastSync: string };
const time = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
export function validMembership(value: unknown): Membership | null {
  const info = validCohortInput(value);
  if (!info) return null;
  const v = value as Record<string, unknown>;
  const token = v.token, joinedAt = v.joinedAt, syncedThrough = v.syncedThrough, visitsThrough = v.visitsThrough, code = v.code, lastSync = v.lastSync;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !time(joinedAt) || !time(syncedThrough)) return null;
  return {
    ...info, token, joinedAt, syncedThrough,
    visitsThrough: typeof visitsThrough === 'string' && /^(\d{4}-\d{2}-\d{2})?$/.test(visitsThrough) ? visitsThrough : '',
    code: typeof code === 'string' && validParticipant(code) ? code : '',
    lastSync: time(lastSync) ? lastSync : '',
  };
}

export const MAX_SYNC_ENTRIES = 500;
export const MAX_SYNC_BYTES = 400_000;
/** Records made since the last send. Nothing from before joining leaves the device. */
export function pendingSync(entries: Entry[], visits: string[], m: Membership) {
  const since = m.syncedThrough > m.joinedAt ? m.syncedThrough : m.joinedAt;
  const joinDay = localDay(m.joinedAt);
  return { entries: entries.filter(e => e.at > since), visits: visits.filter(d => d >= joinDay && d > m.visitsThrough) };
}
export function validSync(value: unknown): { participant: string; entries: Entry[]; visits: string[] } | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.entries) || v.entries.length > MAX_SYNC_ENTRIES || !Array.isArray(v.visits) || v.visits.length > 730) return null;
  const participant = typeof v.participant === 'string' && validParticipant(v.participant) ? v.participant : '';
  return { participant, entries: validEntries(v.entries), visits: validVisits(v.visits) };
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
