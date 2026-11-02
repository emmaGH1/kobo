/** Parse stated naira without model arithmetic or floating-point money. */
export type NairaResult = { kind: 'amount'; kobo: number } | { kind: 'ambiguous'; candidatesKobo: number[] } | { kind: 'invalid' };
const invalid: NairaResult = { kind: 'invalid' };
const units: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
function asKobo(naira: bigint): NairaResult {
  const kobo = naira * BigInt(100);
  return kobo > BigInt(0) && kobo <= BigInt(Number.MAX_SAFE_INTEGER) ? { kind: 'amount', kobo: Number(kobo) } : invalid;
}
/** The supplied span must be literally present, bounded by non-word characters. */
export function sourceHasSpan(source: string, span: string): boolean {
  const value = span.trim();
  if (!value) return false;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(source);
}
export function parseNaira(span: string, source: string): NairaResult {
  if (!sourceHasSpan(source, span)) return invalid;
  let s = span.trim().toLowerCase().replace(/^₦\s*/, '').replace(/\s*(?:naira|nairas|n\.?g\.?n\.?)$/, '').trim();
  if (s === 'three eight') return { kind: 'ambiguous', candidatesKobo: [38000000, 380000000] };
  const numeric = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*([km])?$/.exec(s);
  if (numeric) {
    const whole = BigInt(numeric[1].replaceAll(',', ''));
    const frac = BigInt((numeric[2] ?? '').padEnd(2, '0') || '0');
    const multiplier = numeric[3] === 'k' ? BigInt(1000) : numeric[3] === 'm' ? BigInt(1000000) : BigInt(1);
    const kobo = (whole * BigInt(100) + frac) * multiplier;
    return kobo > BigInt(0) && kobo <= BigInt(Number.MAX_SAFE_INTEGER) ? { kind: 'amount', kobo: Number(kobo) } : invalid;
  }
  const numericScale = /^(\d+)\s+(thousand|million)$/.exec(s);
  if (numericScale) return asKobo(BigInt(numericScale[1]) * (numericScale[2] === 'million' ? BigInt(1000000) : BigInt(1000)));
  s = s.replaceAll('-', ' ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ');
  let total = 0, group = 0, last = 0;
  for (const token of tokens) {
    if (token in units) {
      const n = units[token];
      if ((last > 0 && last < 20) || (last >= 20 && n >= 10)) return invalid;
      group += n; last = n;
    } else if (token === 'hundred') {
      if (group < 1 || group > 9 || last < 1 || last > 9) return invalid;
      group *= 100; last = 0;
    } else if (token === 'thousand' || token === 'million') {
      const scale = token === 'million' ? 1000000 : 1000;
      if (!group || (total && total < scale)) return invalid;
      total += group * scale; group = 0; last = 0;
    } else return invalid;
  }
  return asKobo(BigInt(total + group));
}
