import { describe, expect, it } from 'vitest';
import { factFlags, parseToolResponse, statedAmountKobo } from './tool-calls';

const call = (name: string, args: unknown) => ({ status: 'completed', output: [
  { type: 'reasoning' }, { type: 'function_call', status: 'completed', name, arguments: JSON.stringify(args) },
] });
describe('model tool boundary', () => {
  it('parses the verified Responses call shape', () => {
    expect(parseToolResponse(call('get_balance', { customer_name: 'Chika' }))).toEqual({ name: 'get_balance', args: { customer_name: 'Chika' } });
  });
  it('rejects unknown, malformed, extra, incomplete and multiple calls', () => {
    for (const response of [call('toString', {}), call('unknown', {}), call('list_debtors', { x: 1 }),
      { status: 'in_progress', output: [] }, { status: 'completed', output: [] },
      { status: 'completed', output: [{ type: 'function_call', name: 'get_balance', status: 'completed', arguments: '{' }] },
      { status: 'completed', output: [call('list_debtors', {}).output[1], call('list_debtors', {}).output[1]] }]) {
      expect(() => parseToolResponse(response)).toThrow();
    }
  });
  it('converts only stated, unambiguous decimal amounts without floats', () => {
    expect(statedAmountKobo('38.05', 'paid 38.05')).toBe(3805);
    expect(statedAmountKobo('3', 'paid 3800')).toBeUndefined();
    expect(statedAmountKobo('three eight', 'paid three eight')).toBeUndefined();
    expect(statedAmountKobo('90071992547410', 'paid 90071992547410')).toBeUndefined();
    expect(statedAmountKobo('30', 'paid 20')).toBeUndefined();
  });
  it('flags missing or invented customer and amount', () => {
    expect(factFlags({kind: 'sale', customer_name: 'Chika', amount_text: '3800'}, 'Chika bought 3800')).toEqual([]);
    expect(factFlags({kind: 'sale', customer_name: 'Ada', amount_text: '3800'}, 'Chika said three eight')).toHaveLength(2);
  });
});
