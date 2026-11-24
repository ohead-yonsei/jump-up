// 테스트 기간(0.49.0): everyone who starts joins the same cohort, so the team can check the app with real numbers on the operator page.
// Server only. The app asks GET /api/cohort whether a test cohort is open and joins it with POST {test:true}; it never needs the code.
// 0.50.0: joining is not a choice in a test period. The app joins by itself the first time the person touches it, and says so in plain
// lines (start screen, 이용 안내, the records tab) without asking for anything. Leaving on the records tab still works and is not undone.
// To end the test period: set `on` to false here and deploy, set TEST_COHORT=off in the deployment, or end the cohort on the operator page.
import { cohortEnded, normalizeCode, validJoinCode } from './cohort';
import { DuplicateCode, type Cohort, type CohortStore } from './cohort-store';
import { newOperatorCode, sha256 } from './cohort-server';

export const TEST_COHORT = { on: true, code: 'TESTPZZK', name: '테스트 기수', org: '폴짝 팀', startsOn: '2026-11-24', endsOn: '2027-02-28' } as const;
type Env = Record<string, string | undefined>;
/** The join code of the test cohort, or null when the test period is off. TEST_COHORT_CODE points it at a cohort the team already opened. */
export function testCohortCode(env: Env = process.env): string | null {
  if (!TEST_COHORT.on || env.TEST_COHORT?.trim().toLowerCase() === 'off') return null;
  const own = normalizeCode(env.TEST_COHORT_CODE ?? '');
  return validJoinCode(own) ? own : TEST_COHORT.code;
}
type Store = Pick<CohortStore, 'cohortByJoinCode' | 'createCohort'>;
/** The test cohort. With `create`, the built-in one is opened the first time someone joins; its operator code is random and unknown,
 * so only the team's admin key sees it until a new operator code is issued on the operator page. */
export async function testCohort(store: Store, env: Env = process.env, create = false): Promise<Cohort | null> {
  const code = testCohortCode(env); if (!code) return null;
  const found = await store.cohortByJoinCode(code);
  if (found || !create || code !== TEST_COHORT.code) return found;
  try { return await store.createCohort({ name: TEST_COHORT.name, org: TEST_COHORT.org, startsOn: TEST_COHORT.startsOn, endsOn: TEST_COHORT.endsOn, joinCode: code, operatorHash: sha256(newOperatorCode()) }); }
  catch (e) { if (e instanceof DuplicateCode) return store.cohortByJoinCode(code); throw e; }
}
/** What the app is told: the name to show while the test cohort can still be joined, else null. A built-in cohort not opened yet counts as open. */
export async function openTestCohort(store: Store, env: Env = process.env, today?: string): Promise<{ name: string } | null> {
  const code = testCohortCode(env); if (!code) return null;
  const found = await store.cohortByJoinCode(code);
  if (found) return cohortEnded(found, today) ? null : { name: found.name };
  return code === TEST_COHORT.code && !cohortEnded(TEST_COHORT, today) ? { name: TEST_COHORT.name } : null;
}
