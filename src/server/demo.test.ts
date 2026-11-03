import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { LedgerStore } from './ledger-store';
import { createDemoHandler } from './demo';
const stores: LedgerStore[]=[];
afterEach(()=>{ stores.forEach(s=>s.sqlite.close()); stores.length=0; vi.useRealTimers(); });
function setup(dailyCap=100) {
  const store = new LedgerStore(':memory:'); stores.push(store);
  const requestToolResponse=vi.fn(async()=>({status:'completed',output:[{type:'function_call',name:'record_entries',arguments:JSON.stringify({entries:[{kind:'payment',customer_name:'Bayo',description:null,amount_text:'100',remaining_text:null,due_date_text:null,evidence_text:'Bayo paid 100'}]})}]}));
  const handle = createDemoHandler({store,provider:()=>({listModels:async()=>[],requestToolResponse}),dailyCap,ip:r=>r.headers.get('test-ip')??'one'});
  async function call(op:string, body:unknown={},cookie='',ip='one',origin='http://localhost') {
    return handle(new NextRequest(`http://localhost/api/demo/${op}`,{method:'POST',headers:{host:'localhost',origin,cookie,'test-ip':ip},body:JSON.stringify(body)}),op);
  }
  async function start(ip='one') {const r=await call('session',{},'',ip);expect(r.status).toBe(200);return /kobo_demo=([a-f0-9]+)/.exec(r.headers.get('set-cookie')!)![1];}
  const cookie=(token:string)=>`kobo_demo=${token}`;
  return {store,requestToolResponse,handle,call,start,cookie};
}
it('creates a fresh fictional book per cookie, reuses it until expiry and enforces Origin',async()=>{
  const {store,call,start,cookie}=setup(); const a=await start(),b=await start();
  const owners=store.sqlite.prepare('SELECT owner FROM demo_sessions').all() as {owner:string}[];
  expect(new Set(owners.map(o=>o.owner)).size).toBe(2);
  for(const o of owners) {expect(store.customers(o.owner).map(c=>c.name)).toEqual(['Bayo','Mama Chidi']);expect(store.events(o.owner)).toHaveLength(5);}
  expect((await call('session',{},cookie(a))).headers.get('set-cookie')).toBeNull();
  expect((await call('message',{text:'who owes me'},cookie(a),'one','https://evil.test')).status).toBe(403);
  expect((await call('message',{text:'who owes me'},cookie(b))).status).toBe(200);
  expect((await call('message',{text:'who owes me'})).status).toBe(401);
});
it('routes reviews and explicit actions to the same service; rejects foreign and stale versions; confirm retries are idempotent',async()=>{
  const {store,call,start,cookie}=setup(); const a=cookie(await start()),b=cookie(await start());
  const review=await (await call('message',{text:'Ada bought on credit for 6,000'},a)).json();
  expect(review.replies[0].pendingVersion).toBe(1);
  expect(review.replies[0].pendingId).toBe(review.pending.id);
  const id=review.pending.id;
  await call('action',{action:'confirm',pendingId:id,version:1},b);
  await call('action',{action:'confirm',pendingId:id,version:2},a);
  expect(store.sqlite.prepare("SELECT COUNT(*) AS n FROM ledger_events WHERE pending_id=?").get(id)).toEqual({n:0});
  await call('action',{action:'confirm',pendingId:id,version:1},a);
  await call('action',{action:`save:${id}`},a);
  expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM ledger_events WHERE pending_id=?').get(id)).toEqual({n:1});
  const response=await (await call('message',{text:'1'},a)).json();
  expect(response.remaining).toBe(12); // deterministic commands and actions consume no model credits
});
it('runs notebook uploads through the quota wrapper and same explicit-confirmation service',async()=>{
  const {store,call,start,cookie,requestToolResponse}=setup();const c=cookie(await start());
  requestToolResponse.mockResolvedValueOnce({status:'completed',output:[{type:'function_call',name:'read_notebook',arguments:JSON.stringify({rows:[{line_text:'New Customer 1200',customer_name:'New Customer',amount_text:'1200',uncertain_name:false,uncertain_amount:false}]})}]});
  const upload={mimeType:'image/png',imageBase64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII='};
  const review=await (await call('notebook',upload,c)).json();expect(review.remaining).toBe(11);expect(review.pending.flags).toEqual([]);
  await call('action',{action:'confirm',pendingId:review.pending.id,version:1},c);
  await call('notebook',upload,c);expect(requestToolResponse).toHaveBeenCalledTimes(1);
  expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM ledger_events WHERE pending_id=?').get(review.pending.id)).toEqual({n:1});
});
it('previews Friday reminders using the demo book without saving money or spending model credits',async()=>{
  const {store,call,start,cookie,requestToolResponse}=setup();const c=cookie(await start());
  const before=(store.sqlite.prepare('SELECT COUNT(*) AS n FROM ledger_events').get() as {n:number}).n;
  const preview=await (await call('skip-friday',{},c)).json();expect(preview.simulated).toBe(true);expect(preview.remaining).toBe(12);expect(preview.replies[0].body).toContain('₦25,000');
  const draft=await (await call('action',{action:preview.replies[0].buttons[0].id},c)).json();expect(draft.replyText).toContain('Nothing goes out without you.');
  expect((store.sqlite.prepare('SELECT COUNT(*) AS n FROM ledger_events').get() as {n:number}).n).toBe(before);expect(requestToolResponse).not.toHaveBeenCalled();
});
it('reserves only actual model calls, blocks the thirteenth, and still permits read queries and save/cancel',async()=>{
  const {call,start,cookie,requestToolResponse}=setup(); const c=cookie(await start());
  for(let n=0;n<12;n++) {const r=await (await call('message',{text:'Bayo paid 100'},c)).json(); expect(r.remaining).toBe(11-n);await call('message',{text:'3'},c);}
  expect(requestToolResponse).toHaveBeenCalledTimes(12);
  const blocked=await call('message',{text:'Bayo paid 100'},c);expect(blocked.status).toBe(429);expect((await blocked.json()).reason).toBe('demo_limit');
  expect((await call('message',{text:'who owes me'},c)).status).toBe(200);
  const reset=await call('reset',{},c);expect((await reset.json()).remaining).toBe(0);
  expect((await call('message',{text:'who owes me'},c)).status).toBe(401);
});
it('enforces per-IP sessions, global daily kill switch, expiry and unsupported voice honestly',async()=>{
  const {call,start,cookie,requestToolResponse}=setup(0); const c=cookie(await start());
  expect((await call('message',{text:'Bayo paid 100'},c)).status).toBe(429);
  expect(requestToolResponse).not.toHaveBeenCalled();
  expect((await call('voice-sample',{sampleId:'anything'},c)).status).toBe(503);
  await start();await start();expect((await call('session')).status).toBe(429);
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(Date.now()+31*60000);
  expect((await call('message',{text:'who owes me'},c)).status).toBe(401);
});
it('fails closed if the session expires during a provider response and releases its lease',async()=>{
  const {store,call,start,cookie,requestToolResponse}=setup();const c=cookie(await start());
  vi.useFakeTimers({toFake:['Date']});
  requestToolResponse.mockImplementationOnce(async()=>{vi.setSystemTime(Date.now()+31*60000);return {status:'completed',output:[]};});
  expect((await call('message',{text:'Bayo paid 100'},c)).status).toBe(401);
  expect(store.sqlite.prepare('SELECT busy FROM demo_sessions').get()).toEqual({busy:null});
});
it('rejects oversized input, malformed requests and concurrent processing without duplicate provider work',async()=>{
  const {call,start,cookie,requestToolResponse}=setup();const c=cookie(await start());
  expect((await call('message',{text:'x'.repeat(9000)},c)).status).toBe(413);
  expect((await call('action',{action:'confirm',pendingId:crypto.randomUUID(),version:1},c)).status).toBe(200);
  let release!:()=>void;
  requestToolResponse.mockImplementationOnce(async()=>{await new Promise<void>(r=>{release=r;});return {status:'completed',output:[]};});
  const first=call('message',{text:'Bayo paid 100'},c);
  await vi.waitFor(()=>expect(release).toBeTypeOf('function'));
  expect((await call('message',{text:'Bayo paid 100'},c)).status).toBe(409);
  release();await first;expect(requestToolResponse).toHaveBeenCalledTimes(1);
});
it('accepts the design adapter clock and language operations without model calls',async()=>{
  const {store,call,cookie,requestToolResponse}=setup();
  const first=await call('session',{lang:'pcm'});expect((await first.json()).language).toBe('pcm');
  const c=cookie(/kobo_demo=([a-f0-9]+)/.exec(first.headers.get('set-cookie')!)![1]);
  const owner=(store.sqlite.prepare('SELECT owner,token FROM demo_sessions').get() as {owner:string;token:string});
  expect(store.language(owner.owner,'web',owner.token)).toEqual({language:'pg',explicit:true});
  expect((await call('language',{lang:'xx'},c)).status).toBe(400);
  expect(await (await call('language',{lang:'en'},c)).json()).toEqual({language:'en',remaining:12});
  expect(store.language(owner.owner,'web',owner.token)?.language).toBe('en');
  const preview=await (await call('clock',{to:'friday'},c)).json();
  expect(preview.simulated).toBe(true);expect(preview.replies[0].lang).toBe('en');expect(preview.replies[0].body).toContain('₦25,000');
  expect((await call('clock',{to:'monday'},c)).status).toBe(404);
  expect(requestToolResponse).not.toHaveBeenCalled();
});
