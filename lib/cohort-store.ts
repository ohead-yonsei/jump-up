import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Entry } from './records';
import type { CohortInfo, ParticipantRecords } from './cohort';

export type Cohort = CohortInfo & { id: string; joinCode: string; createdAt: string };
export type Participant = { id: string; cohortId: string; code: string; joinedAt: string; lastSyncAt: string | null };
/** A join or operator code that is already taken; the caller draws a new one. */
export class DuplicateCode extends Error {}
export interface CohortStore {
  kind: 'supabase' | 'file' | 'memory';
  createCohort(cohort: CohortInfo & { joinCode: string; operatorHash: string }): Promise<Cohort>;
  listCohorts(): Promise<(Cohort & { participants: number })[]>;
  cohort(id: string): Promise<Cohort | null>;
  cohortByJoinCode(code: string): Promise<Cohort | null>;
  cohortByOperatorHash(hash: string): Promise<Cohort | null>;
  setOperatorHash(id: string, hash: string): Promise<void>;
  addParticipant(p: { cohortId: string; code: string; tokenHash: string }): Promise<Participant>;
  participantByToken(hash: string): Promise<{ participant: Participant; cohort: Cohort } | null>;
  /** Adds records not seen before; a record already stored is never changed. */
  saveRecords(id: string, code: string, entries: Entry[], visits: string[]): Promise<void>;
  /** Removes the person and everything they sent. */
  removeParticipant(id: string): Promise<void>;
  cohortRecords(cohortId: string): Promise<ParticipantRecords[]>;
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
    async addParticipant(p) {
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
      kept.push(...entries.filter(e => !known.has(e.id))); kept.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
      d.visits[id] = [...new Set([...(d.visits[id] ?? []), ...visits])].sort();
      if (code) p.code = code;
      p.lastSyncAt = new Date().toISOString(); await persist(d);
    },
    async removeParticipant(id) {
      d.participants = d.participants.filter(p => p.id !== id); delete d.entries[id]; delete d.visits[id]; await persist(d);
    },
    async cohortRecords(cohortId) {
      return d.participants.filter(p => p.cohortId === cohortId).map(p => ({ ...person(p), entries: d.entries[p.id] ?? [], visits: d.visits[p.id] ?? [] }));
    },
  };
}
export async function fileStore(file: string) {
  let data = emptyData();
  try { data = { ...data, ...JSON.parse(await fs.readFile(file, 'utf8')) }; } catch {}
  return memoryStore(data, async d => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(d, null, 1)); }, 'file');
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
  async function pages<T>(pathname: string) {
    const rows: T[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await call<T[]>(`${pathname}&limit=${PAGE}&offset=${offset}`);
      rows.push(...page);
      if (page.length < PAGE) return rows;
    }
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
      if (entries.length) await call('entries?on_conflict=participant_id,id', { method: 'POST', prefer, body: entries.map(e => ({ participant_id: id, id: e.id, at: e.at, type: e.type, data: e })) });
      if (visits.length) await call('visits?on_conflict=participant_id,day', { method: 'POST', prefer, body: visits.map(day => ({ participant_id: id, day })) });
      await call('participants?id=' + eq(id), { method: 'PATCH', prefer: 'return=minimal', body: { last_sync_at: new Date().toISOString(), ...(code ? { code } : {}) } });
    },
    async removeParticipant(id) { await call('participants?id=' + eq(id), { method: 'DELETE', prefer: 'return=minimal' }); },
    async cohortRecords(cohortId) {
      if (!uuid(cohortId)) return [];
      const people = await call<ParticipantRow[]>(`participants?select=${participantColumns}&cohort_id=${eq(cohortId)}&order=joined_at.asc`);
      if (!people.length) return [];
      const ids = `in.(${people.map(p => p.id).join(',')})`;
      const [entries, visits] = await Promise.all([
        pages<{ participant_id: string; data: Entry }>(`entries?select=participant_id,data&participant_id=${ids}&order=at.asc,id.asc`),
        pages<{ participant_id: string; day: string }>(`visits?select=participant_id,day&participant_id=${ids}&order=day.asc`),
      ]);
      return people.map(p => ({ ...toParticipant(p), entries: entries.filter(e => e.participant_id === p.id).map(e => e.data), visits: visits.filter(v => v.participant_id === p.id).map(v => v.day) }));
    },
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
