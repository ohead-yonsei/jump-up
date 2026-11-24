// 숫자로 남는 이용 기록(0.47.0): how long each screen was open and how often a few things were pressed, as counts per day.
// Second-round feedback: for an app the numbers matter (time spent, what gets pressed), because what people say tends to sound alike.
// It holds no text and no times of day — only day, screen or action, and a number. It stays on the device with the other records,
// goes into the person's own CSV export, and is not sent to a cohort (that would need its own line in the consent).
// 0.48.0: a place is a tab or something open over it that is worth telling apart (the first talk with the keeper, a practice
// chat under way, an open mission card, the notebook, the urgent-help window), and 메뉴 › 머문 시간 보기 shows the numbers as they stand.
export const tabScreens = ['today', 'practice', 'resources', 'places', 'journal', 'closet', 'pond'] as const;
export type TabScreen = typeof tabScreens[number];
export const screens = [...tabScreens, 'onboarding', 'chat', 'mission', 'notes', 'help'] as const;
export type Screen = typeof screens[number];
export const screenLabel: Record<Screen, string> = { today: '연못(홈)', practice: '연습 상황 고르기', resources: '도움받기', places: '가볼 곳', journal: '기록', closet: '꾸미기', pond: '연못 마을', onboarding: '연못지기와의 대화', chat: '대화 연습 중', mission: '미션 카드', notes: '개구리 수첩', help: '긴급 도움 창' };
/** Where the person is right now. What is open over a tab wins over the tab, so its time is not mixed into the tab's. */
export function placeOf(at: { onboarding?: boolean; help?: boolean; tab: TabScreen; chatting?: boolean; home?: 'mission' | 'notes' | null }): Screen {
  if (at.onboarding) return 'onboarding'; if (at.help) return 'help';
  if (at.tab === 'practice' && at.chatting) return 'chat';
  if (at.tab === 'today' && at.home) return at.home; return at.tab;
}
/** Nothing touched for this long means the person has probably put the phone down: the stretch is not counted. */
export const IDLE_MS = 120000;
/** The seconds of a stretch that count (times in ms): from `since` to `now`, or none when it was not in view or sat untouched. */
export function stretchSeconds(since: number, now: number, lastTouch: number) { return since > 0 && now > since && now - lastTouch < IDLE_MS ? (now - since) / 1000 : 0; }
export const actions = ['frog', 'mission', 'shuffle', 'notes', 'chat', 'help'] as const;
export type Action = typeof actions[number];
export const actionLabel: Record<Action, string> = { frog: '친구 만지기', mission: '미션 열어보기', shuffle: '다른 미션 넘기기', notes: '개구리 수첩 열기', chat: '대화 연습 시작', help: '긴급 도움 열기' };
export type DayUse = { sec: Partial<Record<Screen, number>>; open: Partial<Record<Screen, number>>; act: Partial<Record<Action, number>> };
export type Usage = Record<string, DayUse>;
export const USAGE_KEY = 'poljjak-usage-v1';
export const MAX_USE_DAYS = 120;
/** One stretch on a screen counts at most this long, so a phone left open on the table does not look like an hour of use. */
export const MAX_STRETCH_SEC = 600;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const empty = (): DayUse => ({ sec: {}, open: {}, act: {} });
const keep = (usage: Usage): Usage => Object.fromEntries(Object.keys(usage).sort().slice(-MAX_USE_DAYS).map(d => [d, usage[d]]));
const bump = <K extends string>(map: Partial<Record<K, number>>, key: K, by: number, max: number) => ({ ...map, [key]: Math.min(max, (map[key] ?? 0) + by) });
export function addTime(usage: Usage, screen: Screen, seconds: number, day: string): Usage {
  const s = Math.min(MAX_STRETCH_SEC, Math.floor(seconds)); if (!(s > 0) || !DAY.test(day)) return usage;
  const d = usage[day] ?? empty(); return keep({ ...usage, [day]: { ...d, sec: bump(d.sec, screen, s, 86400) } });
}
export function addOpen(usage: Usage, screen: Screen, day: string): Usage {
  if (!DAY.test(day)) return usage; const d = usage[day] ?? empty(); return keep({ ...usage, [day]: { ...d, open: bump(d.open, screen, 1, 9999) } });
}
export function addAct(usage: Usage, action: Action, day: string): Usage {
  if (!DAY.test(day)) return usage; const d = usage[day] ?? empty(); return keep({ ...usage, [day]: { ...d, act: bump(d.act, action, 1, 9999) } });
}
/** Reads saved usage, keeping only known days, screens, actions and sane numbers. */
export function validUsage(value: unknown): Usage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Usage = {};
  const pick = <K extends string>(raw: unknown, keys: readonly K[], max: number) => {
    const m: Partial<Record<K, number>> = {}; if (!raw || typeof raw !== 'object') return m;
    for (const k of keys) { const n = (raw as Record<string, unknown>)[k]; if (Number.isInteger(n) && Number(n) > 0 && Number(n) <= max) m[k] = Number(n); }
    return m;
  };
  for (const [day, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!DAY.test(day) || Number.isNaN(Date.parse(day)) || !raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>; const d: DayUse = { sec: pick(r.sec, screens, 86400), open: pick(r.open, screens, 9999), act: pick(r.act, actions, 9999) };
    if (Object.keys(d.sec).length || Object.keys(d.open).length || Object.keys(d.act).length) out[day] = d;
  }
  return keep(out);
}
const sum = (m: Partial<Record<string, number>>) => Object.values(m).reduce((n: number, v) => n + (v ?? 0), 0);
/** Totals for the summary row and the export sheet: all the seconds and opens, and where most of the time went. */
export function usageTotals(usage: Usage) {
  const days = Object.values(usage); const bySec = screens.map(s => ({ screen: s, seconds: days.reduce((n, d) => n + (d.sec[s] ?? 0), 0), opens: days.reduce((n, d) => n + (d.open[s] ?? 0), 0) }));
  const byAct = actions.map(a => ({ action: a, count: days.reduce((n, d) => n + (d.act[a] ?? 0), 0) }));
  const most = [...bySec].sort((a, b) => b.seconds - a.seconds)[0];
  return { seconds: days.reduce((n, d) => n + sum(d.sec), 0), opens: days.reduce((n, d) => n + sum(d.open), 0), days: days.length, screens: bySec, actions: byAct, most: most && most.seconds > 0 ? most.screen : null };
}
/** Rows for the CSV: one per day and screen (seconds, opens) and one per day and action (count). `[day, kind, id, label, seconds, count]`. */
export function usageRows(usage: Usage): [string, 'usage' | 'action', string, string, number | '', number | ''][] {
  const rows: [string, 'usage' | 'action', string, string, number | '', number | ''][] = [];
  for (const day of Object.keys(usage).sort()) {
    const d = usage[day];
    for (const s of screens) if (d.sec[s] || d.open[s]) rows.push([day, 'usage', s, screenLabel[s], d.sec[s] ?? 0, d.open[s] ?? 0]);
    for (const a of actions) if (d.act[a]) rows.push([day, 'action', a, actionLabel[a], '', d.act[a]!]);
  }
  return rows;
}
/** Only one day of the usage, for ‘오늘’ in the view. */
export const usageOn = (usage: Usage, day: string): Usage => usage[day] ? { [day]: usage[day] } : {};
/** Places with any time or opens, longest first; ties keep the order of `screens`. */
export function usageRanked(usage: Usage) { return usageTotals(usage).screens.filter(s => s.seconds > 0 || s.opens > 0).sort((a, b) => b.seconds - a.seconds); }
/** To the second, for checking the counter: ‘45초’, ‘2분 14초’, ‘3분’, ‘1시간 5분’. */
export function clockLabel(seconds: number) {
  const s = Math.max(0, Math.floor(seconds) || 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
  return h ? `${h}시간${m ? ` ${m}분` : ''}` : m ? `${m}분${r ? ` ${r}초` : ''}` : `${r}초`;
}
/** The numbers as a few lines of plain text, to copy and hand to whoever is running the test. Days, labels and numbers only. */
export function usageSummary(usage: Usage): string {
  const t = usageTotals(usage); const days = Object.keys(usage).sort(); if (!days.length) return '폴짝 머문 시간: 아직 남은 숫자가 없어요.';
  const lines = [`폴짝 머문 시간 · ${days.length}일 (${days[0]}${days.length > 1 ? ` ~ ${days[days.length - 1]}` : ''})`, `모두 ${clockLabel(t.seconds)} · 화면을 연 횟수 ${t.opens}번`];
  for (const s of usageRanked(usage)) lines.push(`- ${screenLabel[s.screen]}: ${clockLabel(s.seconds)} · ${s.opens}번`);
  const acts = t.actions.filter(a => a.count > 0); if (acts.length) lines.push('누른 것: ' + acts.map(a => `${actionLabel[a.action]} ${a.count}번`).join(' · '));
  return lines.join('\n');
}
/** ‘23분’, ‘1시간 5분’, ‘1분 미만’. */
export function spentLabel(seconds: number) {
  if (seconds < 60) return seconds > 0 ? '1분 미만' : '0분';
  const m = Math.round(seconds / 60); return m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`;
}
