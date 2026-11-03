import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LedgerStore } from '../ledger-store';
const mocks = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock('../web', () => ({ store: mocks.store, service: vi.fn() }));
import { boundedBytes, ownerKeywords, takeVoiceLimit } from './runtime';
let db: LedgerStore;
beforeEach(() => {
  db = new LedgerStore(':memory:'); mocks.store.mockReturnValue(db);
  db.sqlite.exec("CREATE TABLE request_limits(name TEXT PRIMARY KEY,window_start INTEGER,count INTEGER); INSERT INTO owners(id,name,passcode_hash,is_demo) VALUES('a','A','disabled',0),('b','B','disabled',0); INSERT INTO customers(id,owner_id,name) VALUES('ca','a','Ada Example'),('cb','b','Bola Example');");
});
afterEach(() => { db.sqlite.close(); delete process.env.VOICE_PRODUCT_NAMES_JSON; });
it('bias includes only the current owner customer/product names', () => {
  process.env.VOICE_PRODUCT_NAMES_JSON = JSON.stringify({ a: ['Rice'], b: ['Beans'] });
  expect(ownerKeywords('a')).toEqual(['Ada Example','Rice']);
  expect(ownerKeywords('b')).toEqual(['Bola Example','Beans']);
});
it('bounds actual streamed bodies without trusting Content-Length', async () => {
  await expect(boundedBytes(new Request('http://local', { method: 'POST', body: '12345', headers: { 'content-length': '1' } }), 4)).rejects.toThrow('too large');
  expect(await boundedBytes(new Request('http://local', { method: 'POST', body: '123' }), 4)).toEqual(Buffer.from('123'));
});
it('caps each owner persistently before provider work', () => {
  expect([takeVoiceLimit('a'), takeVoiceLimit('a'), takeVoiceLimit('a'), takeVoiceLimit('a')]).toEqual([true,true,true,false]);
  expect(takeVoiceLimit('b')).toBe(true);
});
