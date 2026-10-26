export type Entry = {
  id: string; at: string; type: 'step' | 'rest' | 'practice' | 'feedback';
  missionId?: string; goal?: string; springStage?: number;
  title: string; energy: number | null; rating?: number; before?: number; after?: number; mode?: string;
};
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
    && ['step', 'rest', 'practice', 'feedback'].includes(e.type)
    && typeof e.title === 'string' && e.title.length <= 200
    && (e.energy === null || (Number.isInteger(e.energy) && e.energy >= 1 && e.energy <= 5))
    && (e.missionId === undefined || (typeof e.missionId === 'string' && e.missionId.length <= 100))
    && (e.goal === undefined || ['rhythm','outside','connect'].includes(e.goal))
    && (e.springStage === undefined || (Number.isInteger(e.springStage) && e.springStage >= 0 && e.springStage <= 3))
    && score(e.rating) && score(e.before) && score(e.after)
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
    ['participant_code', 'record_id', 'date', 'type', 'title', 'energy', 'rating', 'confidence_before', 'confidence_after', 'practice_mode', 'mission_id', 'goal', 'spring_stage'],
    ...entries.map(e => [participant, e.id, e.at, e.type, e.title, e.energy, e.rating, e.before, e.after, e.mode, e.missionId, e.goal, e.springStage]),
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
      count: entries.filter(e => e.type !== 'feedback' && new Date(e.at).toLocaleDateString() === date.toLocaleDateString()).length };
  });
}
