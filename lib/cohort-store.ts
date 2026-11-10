import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Entry } from './records';
import type { CohortInfo, ParticipantRecords } from './cohort';

export type Cohort = CohortInfo & { id: string; joinCode: string; createdAt: string };
export type Participant = { id: string; cohortId: string; code: string; joinedAt: string; lastSyncAt: string | null };
/** A join, operator or participant code that is already taken in that place. */
export class DuplicateCode extends Error {}
/** A person has sent more records than one cohort could plausibly produce. */
export class TooManyRecords extends Error {}
export const MAX_STORED_ENTRIES = 2000;
export interface CohortStore {
  kind: 'supabase' | 'file' | 'memory';
  createCohort(cohort: CohortInfo & { joinCode: string; operatorHash: string }): Promise<Cohort>;
  listCohorts(): Promise<(Cohort & { participants: number })[]>;
  cohort(id: string): Promise<Cohort | null>;
  cohortByJoinCode(code: string): Promise<Cohort | null>;
  cohortByOperatorHash(hash: string): Promise<Cohort | null>;
  setOperatorHash(id: string, hash: string): Promise<void>;
  /** Moves the last day, to extend a cohort or end it early. */
  setEndsOn(id: string, endsOn: string): Promise<void>;
  memberCount(cohortId: string): Promise<number>;
  addParticipant(p: { cohortId: string; code: string; tokenHash: string }): Promise<Participant>;
  participantByToken(hash: string): Promise<{ participant: Participant; cohort: Cohort } | null>;
  /** Adds records not seen before; a record already stored is never changed. */
  saveRecords(id: string, code: string, entries: Entry[], visits: string[]): Promise<void>;
  /** Removes the person and everything they sent. */
  removeParticipant(id: string): Promise<void>;
  cohortRecords(cohortId: string): Promise<ParticipantRecords[]>;
  /** One small read, so a quiet Supabase Free project is not paused for inactivity. */
  ping(): Promise<void>;
}

type Data = { cohorts: (Cohort & { operatorHash: string })[]; participants: (Participant & { tokenHash: string })[]; entries: Record<string, Entry[]>; visits: Record<string, string[]> };
const emptyData = (): Data => ({ cohorts: [], participants: [], entries: {}, visits: {} });
/** Keeps everything in one object, for tests and, through `fileStore`, local development. */
export function memoryStore(d: Data = emptyData(), persist: (d: Data) => Promise<void> = async () => {}, kind: 'memory' | 'file' = 'memory'): CohortStore {
  const cohort = ({ operatorHash: _, ...c }: Data['cohorts'][number]): Cohort => c;
  const person = ({ tokenHash: _, ...p }: Data['participants'][number]): Participant => p;
  return {
    kind,
    async createCohort(c) {
      if (d.cohorts.some(x => x.joinCode === c.joinCode || x.operatorHash === c.operatorHash)) throw new DuplicateCode();
      const created = { ...c, id: randomUUID(), createdAt: new Date().toISOString() };
      d.cohorts.push(created); await persist(d);
      return cohort(created);
    },
    async listCohorts() { return [...d.cohorts].reverse().map(c => ({ ...cohort(c), participants: d.participants.filter(p => p.cohortId === c.id).length })); },
    async cohort(id) { const c = d.cohorts.find(x => x.id === id); return c ? cohort(c) : null; },
    async cohortByJoinCode(code) { const c = d.cohorts.find(x => x.joinCode === code); return c ? cohort(c) : null; },
    async cohortByOperatorHash(hash) { const c = d.cohorts.find(x => x.operatorHash === hash); return c ? cohort(c) : null; },
    async setOperatorHash(id, hash) { const c = d.cohorts.find(x => x.id === id); if (c) { c.operatorHash = hash; await persist(d); } },
    async setEndsOn(id, endsOn) { const c = d.cohorts.find(x => x.id === id); if (c) { c.endsOn = endsOn; await persist(d); } },
    async memberCount(cohortId) { return d.participants.filter(p => p.cohortId === cohortId).length; },
    async addParticipant(p) {
      if (d.participants.some(x => x.cohortId === p.cohortId && x.code === p.code)) throw new DuplicateCode();
      const created = { id: randomUUID(), cohortId: p.cohortId, code: p.code, tokenHash: p.tokenHash, joinedAt: new Date().toISOString(), lastSyncAt: null };
      d.participants.push(created); await persist(d);
      return person(created);
    },
    async participantByToken(hash) {
      const p = d.participants.find(x => x.tokenHash === hash); const c = p && d.cohorts.find(x => x.id === p.cohortId);
      return p && c ? { participant: person(p), cohort: cohort(c) } : null;
    },
    async saveRecords(id, code, entries, visits) {
      const p = d.participants.find(x => x.id === id); if (!p) return;
      const kept = d.entries[id] ??= []; const known = new Set(kept.map(e => e.id));
      const added = entries.filter(e => !known.has(e.id));
      if (kept.length + added.length > MAX_STORED_ENTRIES) throw new TooManyRecords();
      kept.push(...added); kept.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
      d.visits[id] = [...new Set([...(d.visits[id] ?? []), ...visits])].sort();
      // A code someone else in the cohort already uses is not taken over; the old one stays.
      if (code && !d.participants.some(x => x.cohortId === p.cohortId && x.id !== id && x.code === code)) p.code = code;
      p.lastSyncAt = new Date().toISOString(); await persist(d);
    },
    async removeParticipant(id) {
      d.participants = d.participants.filter(p => p.id !== id); delete d.entries[id]; delete d.visits[id]; await persist(d);
    },
    async cohortRecords(cohortId) {
      return d.participants.filter(p => p.cohortId === cohortId).map(p => ({ ...person(p), entries: d.entries[p.id] ?? [], visits: d.visits[p.id] ?? [] }));
    },
    async ping() {},
  };
}
let fileQueue: Promise<unknown> = Promise.resolve();
/** Local development only: every call reads the file, changes it and writes it back before the next call starts, so requests never overwrite each other. */
export function fileStore(file: string): CohortStore {
  const run = <T>(work: (s: CohortStore) => Promise<T>) => {
    const next = fileQueue.then(async () => {
      let data = emptyData();
      try { data = { ...data, ...JSON.parse(await fs.readFile(file, 'utf8')) }; } catch {}
      return work(memoryStore(data, async d => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(d, null, 1)); }, 'file'));
    });
    fileQueue = next.catch(() => {});
    return next;
  };
  return {
    kind: 'file',
    createCohort: c => run(s => s.createCohort(c)),
    listCohorts: () => run(s => s.listCohorts()),
    cohort: id => run(s => s.cohort(id)),
    cohortByJoinCode: code => run(s => s.cohortByJoinCode(code)),
    cohortByOperatorHash: hash => run(s => s.cohortByOperatorHash(hash)),
    setOperatorHash: (id, hash) => run(s => s.setOperatorHash(id, hash)),
    setEndsOn: (id, endsOn) => run(s => s.setEndsOn(id, endsOn)),
    memberCount: cohortId => run(s => s.memberCount(cohortId)),
    addParticipant: p => run(s => s.addParticipant(p)),
    participantByToken: hash => run(s => s.participantByToken(hash)),
    saveRecords: (id, code, entries, visits) => run(s => s.saveRecords(id, code, entries, visits)),
    removeParticipant: id => run(s => s.removeParticipant(id)),
    cohortRecords: cohortId => run(s => s.cohortRecords(cohortId)),
    ping: async () => {},
  };
}

type CohortRow = { id: string; name: string; org: string; starts_on: string; ends_on: string; join_code: string; created_at: string; participants?: { count: number }[] };
type ParticipantRow = { id: string; cohort_id: string; code: string; joined_at: string; last_sync_at: string | null; cohort?: CohortRow | null };
// The operator code hash and token hashes are never selected back out of the database.
const cohortColumns = 'id,name,org,starts_on,ends_on,join_code,created_at';
const participantColumns = 'id,cohort_id,code,joined_at,last_sync_at';
const toCohort = (r: CohortRow): Cohort => ({ id: r.id, name: r.name, org: r.org, startsOn: r.starts_on, endsOn: r.ends_on, joinCode: r.join_code, createdAt: r.created_at });
const toParticipant = (r: ParticipantRow): Participant => ({ id: r.id, cohortId: r.cohort_id, code: r.code, joinedAt: r.joined_at, lastSyncAt: r.last_sync_at });
const eq = (value: string) => 'eq.' + encodeURIComponent(value);
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const PAGE = 1000;
/** Talks to Supabase's REST API with the server-only secret key; the tables have row level security on and no public policies. */
export function supabaseStore(url: string, key: string, fetcher: typeof fetch = fetch): CohortStore {
  const base = url.replace(/\/+$/, '') + '/rest/v1/';
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys go only in apikey.
  const auth: Record<string, string> = key.startsWith('eyJ') ? { apikey: key, Authorization: 'Bearer ' + key } : { apikey: key };
  async function call<T>(pathname: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
    const response = await fetcher(base + pathname, {
      method: init.method ?? 'GET', cache: 'no-store', signal: AbortSignal.timeout(10000),
      headers: { ...auth, 'Content-Type': 'application/json', ...(init.prefer ? { Prefer: init.prefer } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (response.status === 409) throw new DuplicateCode();
    if (!response.ok) throw new Error('supabase_' + response.status);
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
  const one = async (filter: string) => { const rows = await call<CohortRow[]>(`cohorts?select=${cohortColumns}&${filter}&limit=1`); return rows[0] ? toCohort(rows[0]) : null; };
  // Reads until an empty page, so a project whose row limit is below PAGE still returns everything. Callers order by a unique key.
  async function pages<T>(pathname: string) {
    const rows: T[] = [];
    for (;;) {
      const page = await call<T[]>(`${pathname}&limit=${PAGE}&offset=${rows.length}`);
      if (!page.length) return rows;
      rows.push(...page);
    }
  }
  async function storedCount(id: string) {
    const response = await fetcher(`${base}entries?select=id&participant_id=${eq(id)}&limit=1`, { headers: { ...auth, Prefer: 'count=exact' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('supabase_' + response.status);
    return Number(response.headers.get('content-range')?.split('/')[1]) || 0;
  }
  return {
    kind: 'supabase',
    async createCohort(c) {
      const rows = await call<CohortRow[]>(`cohorts?select=${cohortColumns}`, { method: 'POST', prefer: 'return=representation', body: { name: c.name, org: c.org, starts_on: c.startsOn, ends_on: c.endsOn, join_code: c.joinCode, operator_hash: c.operatorHash } });
      return toCohort(rows[0]);
    },
    async listCohorts() {
      const rows = await call<CohortRow[]>(`cohorts?select=${cohortColumns},participants(count)&order=created_at.desc`);
      return rows.map(r => ({ ...toCohort(r), participants: r.participants?.[0]?.count ?? 0 }));
    },
    cohort: id => uuid(id) ? one('id=' + eq(id)) : Promise.resolve(null),
    cohortByJoinCode: code => one('join_code=' + eq(code)),
    cohortByOperatorHash: hash => one('operator_hash=' + eq(hash)),
    async setOperatorHash(id, hash) { await call('cohorts?id=' + eq(id), { method: 'PATCH', prefer: 'return=minimal', body: { operator_hash: hash } }); },
    async setEndsOn(id, endsOn) { await call('cohorts?id=' + eq(id), { method: 'PATCH', prefer: 'return=minimal', body: { ends_on: endsOn } }); },
    async memberCount(cohortId) {
      if (!uuid(cohortId)) return 0;
      const rows = await call<CohortRow[]>(`cohorts?select=participants(count)&id=${eq(cohortId)}&limit=1`);
      return rows[0]?.participants?.[0]?.count ?? 0;
    },
    async addParticipant(p) {
      const rows = await call<ParticipantRow[]>(`participants?select=${participantColumns}`, { method: 'POST', prefer: 'return=representation', body: { cohort_id: p.cohortId, code: p.code, token_hash: p.tokenHash } });
      return toParticipant(rows[0]);
    },
    async participantByToken(hash) {
      const rows = await call<ParticipantRow[]>(`participants?select=${participantColumns},cohort:cohorts(${cohortColumns})&token_hash=${eq(hash)}&limit=1`);
      const r = rows[0];
      return r?.cohort ? { participant: toParticipant(r), cohort: toCohort(r.cohort) } : null;
    },
    async saveRecords(id, code, entries, visits) {
      const prefer = 'resolution=ignore-duplicates,return=minimal';
      if (entries.length) {
        if (await storedCount(id) + entries.length > MAX_STORED_ENTRIES) throw new TooManyRecords();
        await call('entries?on_conflict=participant_id,id', { method: 'POST', prefer, body: entries.map(e => ({ participant_id: id, id: e.id, at: e.at, type: e.type, data: e })) });
      }
      if (visits.length) await call('visits?on_conflict=participant_id,day', { method: 'POST', prefer, body: visits.map(day => ({ participant_id: id, day })) });
      await call('participants?id=' + eq(id), { method: 'PATCH', prefer: 'return=minimal', body: { last_sync_at: new Date().toISOString() } });
      // A code someone else in the cohort already uses (unique per cohort) is not taken over; the old one stays.
      if (code) try { await call('participants?id=' + eq(id), { method: 'PATCH', prefer: 'return=minimal', body: { code } }); } catch (e) { if (!(e instanceof DuplicateCode)) throw e; }
    },
    async removeParticipant(id) { await call('participants?id=' + eq(id), { method: 'DELETE', prefer: 'return=minimal' }); },
    async cohortRecords(cohortId) {
      if (!uuid(cohortId)) return [];
      const people = await pages<ParticipantRow>(`participants?select=${participantColumns}&cohort_id=${eq(cohortId)}&order=joined_at.asc,id.asc`);
      if (!people.length) return [];
      // Filter through the participant instead of listing every id, so a large cohort does not make an over-long URL.
      const inCohort = `participants!inner(cohort_id)&participants.cohort_id=${eq(cohortId)}`;
      const [entries, visits] = await Promise.all([
        pages<{ participant_id: string; data: Entry }>(`entries?select=participant_id,data,${inCohort}&order=participant_id.asc,at.asc,id.asc`),
        pages<{ participant_id: string; day: string }>(`visits?select=participant_id,day,${inCohort}&order=participant_id.asc,day.asc`),
      ]);
      return people.map(p => ({ ...toParticipant(p), entries: entries.filter(e => e.participant_id === p.id).map(e => e.data), visits: visits.filter(v => v.participant_id === p.id).map(v => v.day) }));
    },
    async ping() { await call('cohorts?select=id&limit=1'); },
  };
}

/** Supabase when its keys are set; otherwise a local file during development, and nothing in production. */
export async function storeFromEnv(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch): Promise<CohortStore | null> {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key && url.startsWith('https://')) return supabaseStore(url, key, fetcher);
  if (env.NODE_ENV !== 'production') return fileStore(path.join(process.cwd(), '.data', 'cohorts.json'));
  return null;
}
