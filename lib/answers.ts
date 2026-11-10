/** What a person may leave with a mission: one word, one emoji or a short line. Always optional — ‘해봤어요’ works the same
 * with the field empty. An answer stays in the person's own records: it is not sent to a cohort (`ENTRY_KEYS` in cohort.ts
 * leaves it out) and is not in the CSV export, because these missions promise “누구에게도 보여주지 않아도 돼요”. */
export type AnswerKind = 'word' | 'emoji' | 'line';
export type AnswerField = { kind: AnswerKind; label: string; placeholder?: string };
/** Longest answer of each kind, in characters as a person counts them. */
export const ANSWER_MAX: Record<AnswerKind, number> = { word: 12, emoji: 1, line: 100 };
export const answerEmojis = [
  { emoji: '😊', name: '편안해요' }, { emoji: '🙂', name: '괜찮아요' }, { emoji: '😐', name: '그저 그래요' }, { emoji: '😴', name: '졸려요' },
  { emoji: '🥱', name: '지쳤어요' }, { emoji: '😶', name: '잘 모르겠어요' }, { emoji: '😟', name: '걱정돼요' }, { emoji: '😢', name: '슬퍼요' },
  { emoji: '😠', name: '화나요' }, { emoji: '😳', name: '긴장돼요' }, { emoji: '🤔', name: '생각이 많아요' }, { emoji: '🌱', name: '조금 기대돼요' },
] as const;
/** Missions whose last step is choosing or writing something. Every other mission is finished with the button alone. */
export const answerFields: Record<string, AnswerField> = {
  'connect-word': { kind: 'word', label: '지금 떠오른 단어', placeholder: '예: 잔잔함' },
  'outside-weather': { kind: 'word', label: '오늘 날씨를 한 단어로', placeholder: '예: 포근함' },
  'rhythm-color': { kind: 'word', label: '내가 찾은 색', placeholder: '예: 연두색' },
  'connect-emoji': { kind: 'emoji', label: '오늘 기분과 가까운 이모지' },
  'connect-kindnote': { kind: 'line', label: '나에게 다정한 한 줄', placeholder: '예: 오늘도 여기까지 왔네' },
  'connect-draft': { kind: 'line', label: '보내지 않을 안부 한 줄', placeholder: '예: 잘 지내?' },
  'connect-memo': { kind: 'line', label: '짧은 쪽지', placeholder: '예: 나중의 나에게, 고마워' },
  'connect-grateful': { kind: 'line', label: '고마웠던 순간', placeholder: '예: 문을 잡아준 사람' },
  'connect-likes': { kind: 'line', label: '좋아하는 것 세 가지', placeholder: '예: 귤, 비 오는 소리, 고양이' },
  'rhythm-diary': { kind: 'line', label: '오늘 하루 한 줄', placeholder: '예: 창문을 열었다' },
  'rhythm-week': { kind: 'line', label: '이번 주 해보고 싶은 일', placeholder: '예: 동네 한 바퀴' },
};
export const answerField = (missionId: string): AnswerField | null => answerFields[missionId] ?? null;
/** The answer as it is stored: spaces tidied and cut to length; an emoji must be one from the list. Nothing left means no answer. */
export function cleanAnswer(kind: AnswerKind, text: string): string | undefined {
  if (kind === 'emoji') return answerEmojis.some(e => e.emoji === text) ? text : undefined;
  const tidy = [...text.replace(/\s+/g, ' ').trim()].slice(0, ANSWER_MAX[kind]).join('').trim();
  return tidy || undefined;
}
