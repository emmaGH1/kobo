import { describe, expect, it } from 'vitest';
import { parseNaira, sourceHasSpan } from './naira';

describe('stated naira parsing', () => {
  it.each([
    ['₦45,000', 4500000], ['1.5k', 150000], ['2m', 200000000],
    ['twenty thousand', 2000000], ['forty-five thousand', 4500000],
    ['one hundred and twenty naira', 12000], ['38.50', 3850],
  ])('parses %s as integer kobo', (s, kobo) => {
    expect(parseNaira(s, `Paid ${s} today`)).toEqual({ kind: 'amount', kobo });
  });
  it('asks rather than guessing three eight', () => {
    expect(parseNaira('three eight', 'Bayo pay three eight')).toEqual({ kind: 'ambiguous', candidatesKobo: [38000000, 380000000] });
  });
  it.each(['12,34', 'two three', '0', '99999999999999999999', '5.999'])('rejects %s', s => {
    expect(parseNaira(s, s).kind).toBe('invalid');
  });
  it('requires an exact bounded source span', () => {
    expect(sourceHasSpan('paid 15000', '5000')).toBe(false);
    expect(parseNaira('5000', 'paid 15000').kind).toBe('invalid');
    expect(sourceHasSpan('paid ₦5,000 now', '₦5,000')).toBe(true);
  });
});
