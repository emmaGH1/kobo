import { expect, it, vi } from 'vitest';
import { LedgerStore } from './ledger-store';
import { Service } from './service';

it.each([['Ada bought goods on credit for 12,000 naira', 1200000], ['Ada bought on credit for 6,000', 600000]])('reviews the failed English credit-sale case without provider dependence: %s', async (text, amountKobo) => {
  const store = new LedgerStore(':memory:');
  store.sqlite.exec("INSERT INTO owners VALUES('a','Demo','x',1),('b','Other','x',1)");
  const requestToolResponse = vi.fn(async () => { throw new Error('offline'); });
  const service = new Service('a', store, { listModels: async () => [], requestToolResponse });
  const ctx = { channel: 'web' as const, senderId: 's' };
  const reply = await service.handleMessage({ ...ctx, text });
  expect(reply.pending?.flags).toEqual([]);
  expect(store.pending('a', reply.pending!.id)?.entries).toEqual([{kind:'sale',customerName:'Ada',amountKobo}]);
  expect(store.events('a')).toHaveLength(0);
  expect(store.customers('a')).toHaveLength(0);
  await expect(new Service('b', store, {listModels:async()=>[],requestToolResponse}).confirm({...ctx,pendingId:reply.pending!.id})).rejects.toThrow();
  await service.confirm({...ctx,pendingId:reply.pending!.id});
  await service.confirm({...ctx,pendingId:reply.pending!.id});
  expect(store.events('a')).toHaveLength(1);
  expect(requestToolResponse).not.toHaveBeenCalled();
  store.sqlite.close();
});
