import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { CODE_ALPHABET, JOIN_CODE_LENGTH, OPERATOR_CODE_LENGTH } from './cohort';
import { isSameOrigin } from './request-origin';
import type { CohortStore } from './cohort-store';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomCode = (length: number) => Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
export const newJoinCode = () => randomCode(JOIN_CODE_LENGTH);
export const newOperatorCode = () => randomCode(OPERATOR_CODE_LENGTH);
/** The participant's device keeps the token; the server keeps only its hash. */
export const newToken = () => randomBytes(32).toString('base64url');
export const bearer = (request: Request) => request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1] ?? null;
/** Compares secrets without revealing how much of them matched. */
export const sameSecret = (a: string, b: string) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export const OPS_COOKIE = 'poljjak_ops';
export const OPS_SESSION_SECONDS = 12 * 60 * 60;
/** An operator session carries the hash of the code it signed in with, so issuing a new code ends it on the next request. */
export type OpsSession = { role: 'admin' } | { role: 'operator'; cohortId: string; op: string };
/** The team's admin key also signs operator sessions. Without one, or with a short one, the operator pages stay closed. */
export function opsKey(env: Record<string, string | undefined>) {
  const key = env.OPS_ADMIN_KEY?.trim();
  return key && key.length >= 12 ? key : null;
}
const mac = (body: string, key: string) => createHmac('sha256', 'poljjak-ops:' + key).update(body).digest('base64url');
export function signSession(session: OpsSession, key: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...session, exp: now + OPS_SESSION_SECONDS * 1000 })).toString('base64url');
  return body + '.' + mac(body, key);
}
export function readSession(value: string | undefined, key: string, now = Date.now()): OpsSession | null {
  const [body, signature, extra] = value?.split('.') ?? [];
  if (!body || !signature || extra !== undefined || !sameSecret(signature, mac(body, key))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof s.exp !== 'number' || s.exp < now) return null;
    if (s.role === 'admin') return { role: 'admin' };
    if (s.role === 'operator' && typeof s.cohortId === 'string' && typeof s.op === 'string' && /^[0-9a-f]{64}$/.test(s.op)) return { role: 'operator', cohortId: s.cohortId, op: s.op };
  } catch {}
  return null;
}
export const canSee = (session: OpsSession, cohortId: string) => session.role === 'admin' || session.cohortId === cohortId;
/** An operator's code must still be the cohort's current one. */
export async function stillValid(store: Pick<CohortStore, 'cohortByOperatorHash'>, session: OpsSession) {
  return session.role === 'admin' || (await store.cohortByOperatorHash(session.op))?.id === session.cohortId;
}

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export const secureRequest = (request: Request) => (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.slice(0, -1)) === 'https';
/** Same-origin JSON only, with a size limit, for every request that changes something. */
export async function readJson(request: Request, limit: number): Promise<{ value: unknown } | { error: Response }> {
  if (!isSameOrigin(request)) return { error: json({ error: '허용되지 않은 요청이에요.' }, 403) };
  if (!request.headers.get('content-type')?.includes('application/json')) return { error: json({ error: 'JSON 요청이 필요해요.' }, 415) };
  const text = await request.text();
  if (text.length > limit) return { error: json({ error: '한 번에 보내기에는 너무 많아요.' }, 413) };
  try { return { value: JSON.parse(text) }; } catch { return { error: json({ error: '입력을 확인해 주세요.' }, 400) }; }
}
export const clientAddress = (request: Request) => (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for'))?.split(',')[0]?.trim() || 'instance';
/** Best-effort per-instance limit, enough to slow down guessing codes. */
export function rateLimiter(max: number, windowMs = 60000) {
  const seen = new Map<string, { count: number; start: number }>();
  return (who: string) => {
    const now = Date.now();
    for (const [k, v] of seen) if (now - v.start > windowMs) seen.delete(k);
    const entry = seen.get(who) ?? { count: 0, start: now };
    if (entry.count >= max) return false;
    entry.count++; seen.set(who, entry);
    return true;
  };
}
