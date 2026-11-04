import { validDueDate } from './ledger-store';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY = '(?:today|tomorrow|(?:next\\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\\d{4}-\\d{2}-\\d{2})';
const PREFIX = '(?:(?:(?:she|he|they|e|im|dem)\\s+)?(?:(?:will|go)\\s+)?pay(?:\\s+(?:me|the balance))?|remain(?:ing)?(?:\\s+balance)?(?:\\s+(?:go\\s+)?pay)?|due(?:\\s+on)?)';

/** Only a whole date answer/promise, never a weekday buried in a new transaction or query. */
export function resolveDueDate(text: string): string | undefined {
  const relative = text.trim().toLowerCase().replace(new RegExp(`^${PREFIX}\\s+`, 'i'), '').replace(/[.!]$/, '').trim();
  if (validDueDate(relative)) return relative;
  const weekday = WEEKDAYS.indexOf(relative.replace(/^next\s+/, ''));
  if (relative !== 'today' && relative !== 'tomorrow' && weekday < 0) return;
  const lagos = new Date(Date.now() + 3600000);
  const delta = weekday >= 0 ? ((weekday - lagos.getUTCDay() + 6) % 7) + 1 : relative === 'tomorrow' ? 1 : 0;
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + delta)).toISOString().slice(0, 10);
}

/** Recover a literal payment promise if extraction omitted it. Vague promises stay unresolved. */
export function paymentPromise(text: string): string | undefined {
  return new RegExp(`\\b${PREFIX}\\s+(${DAY}|next week|soon|when market (?:is )?good)(?=[.!]?\\s*$)`, 'i').exec(text)?.[0];
}
export function dateOptions(source: string) {
  const mentioned = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.exec(source)?.[1].toLowerCase();
  const days = [...new Set([...(mentioned ? [mentioned] : []), 'tomorrow', 'friday', 'no date'])];
  return days.map((day, i) => ({ value: String(i + 1), label: day === 'no date' ? 'No date' : day[0].toUpperCase() + day.slice(1), day }));
}
export const noDate = (text: string) => /^(?:no date|no pay day|no day yet)$/i.test(text);
/** Invalid but date-shaped answers can be re-asked without a paid extraction call. */
export const dateAnswerShape = (text: string) => new RegExp(`^(?:${PREFIX}\\s+)?(?:${DAY}|next week|soon|no date)[.!]?$`, 'i').test(text);
