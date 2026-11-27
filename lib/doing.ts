// The one mission a person said they would try (‘해볼게요’). It stays until they record it (‘해봤어요’),
// put it off (‘다음에 할게요’) or the day ends, so leaving to do the thing and coming back finds it waiting.
// Interview feedback (0.57.0): a single ‘해봤어요’ under a mission that was only just read was hard to accept.
export type Doing = {id: string; day: string};
export const DOING_KEY = 'poljjak-mission-doing';
/** The mission still being tried on this day, or null. Yesterday's is let go without a word. */
export function doingToday(value: unknown, day: string): string | null {
 if (!value || typeof value !== 'object') return null;
 const v = value as Record<string, unknown>;
 return typeof v.id === 'string' && v.id.length <= 40 && /^[a-z]+-[a-z0-9-]+$/.test(v.id) && v.day === day ? v.id : null;
}
