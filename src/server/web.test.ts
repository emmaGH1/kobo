import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/dev/route';
import { session, store } from './web';

let dir: string;
const origin = 'http://localhost:3000';
function request(body: object, cookie?: string, validOrigin = true) {
  return new NextRequest(`${origin}/api/dev`, { method: 'POST', headers: { host: 'localhost:3000', 'content-type': 'application/json', ...(validOrigin ? { origin } : {}), ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'kobo-test-'));
  process.env.KOBO_DB_PATH = join(dir, 'test.sqlite');
  process.env.OWNER_PASSCODE = 'fictional-test-password';
});
afterAll(() => { store().close(); rmSync(dir, { recursive: true, force: true }); delete process.env.KOBO_DB_PATH; delete process.env.OWNER_PASSCODE; });
it('enforces origin, authentication, throttling and session revocation', async () => {
  expect((await POST(request({action:'login',mode:'demo'}, undefined, false))).status).toBe(403);
  expect((await POST(request({action:'customer',name:'Fictional'}))).status).toBe(401);
  expect((await POST(request({action:'login',mode:'owner',passcode:'wrong'}))).status).toBe(401);
  expect((await POST(request({action:'login',mode:'owner',passcode:'fictional-test-password'}))).status).toBe(429);
  store().sqlite.prepare('DELETE FROM login_throttle').run();
  const login = await POST(request({action:'login',mode:'owner',passcode:'fictional-test-password'}));
  expect(login.status).toBe(200);
  const cookie = login.headers.get('set-cookie')!.split(';')[0];
  expect(login.headers.get('set-cookie')).toContain('HttpOnly');
  expect((await POST(request({action:'customer',name:'Fictional'},cookie))).status).toBe(200);
  expect((await POST(request({action:'logout'},cookie))).status).toBe(200);
  expect((await POST(request({action:'customer',name:'Other'},cookie))).status).toBe(401);
});
it('isolates separate demo tenants', async () => {
  const one = await POST(request({action:'login',mode:'demo'}));
  const two = await POST(request({action:'login',mode:'demo'}));
  const a = one.headers.get('set-cookie')!.split(';')[0];
  const b = two.headers.get('set-cookie')!.split(';')[0];
  expect((await POST(request({action:'customer',name:'Only First'},a))).status).toBe(200);
  expect((await POST(request({action:'customer',name:'Only First'},b))).status).toBe(200);
  const ids = store().sqlite.prepare("SELECT owner_id FROM customers WHERE name='Only First'").all() as {owner_id:string}[];
  expect(ids).toHaveLength(2); expect(ids[0].owner_id).not.toBe(ids[1].owner_id);
  const ownerId = session(request({action:'logout'}, a))!.ownerId;
  const customer = store().findCustomer(ownerId, 'Only First')!;
  const pending = store().propose({ownerId, channel:'web', senderId:'fixture', idempotencyKey:'reminder-fixture', rawInput:'synthetic', entries:[{kind:'opening_debt', customerId:customer.id, amountKobo:12345}]});
  store().confirm(ownerId,pending.id,'web','fixture');
  const reminder = await POST(request({action:'reminder',name:'Only First',phone:'2348000000000'}, a));
  expect(reminder.status).toBe(200);
  const body = await reminder.json();
  expect(body.reminderUrl).toMatch(/^https:\/\/wa\.me\/2348000000000\?text=/);
  expect(body.replyText).toContain('123.45');
  expect((await POST(request({action:'reminder',name:'Only First',phone:'2348000000000'}, b))).status).toBe(400);
  expect((await POST(request({action:'reminder',name:'Only First',phone:'not-a-phone'}, a))).status).toBe(400);
});
it('routes interactive answers through the session-bound review ID and refuses other sessions', async () => {
  // Fictional configuration only; the interactive path never calls the model, so no request is made.
  Object.assign(process.env, { MODEL_BASE_URL: 'https://model.invalid/v1', MODEL_ID: 'fictional', MODEL_API_KEY: 'fictional-key' });
  const one = await POST(request({action:'login',mode:'demo'}));
  const two = await POST(request({action:'login',mode:'demo'}));
  const a = one.headers.get('set-cookie')!.split(';')[0];
  const b = two.headers.get('set-cookie')!.split(';')[0];
  const auth = session(request({action:'logout'}, a))!;
  const flag = 'Please clarify three eight: ₦3,800 or ₦38,000?';
  const pending = store().propose({ownerId:auth.ownerId, channel:'web', senderId:auth.senderId, idempotencyKey:'interactive-fixture', rawInput:'Fixture Person paid three eight', flags:[flag],
    entries:[{kind:'payment', customerName:'Fixture Person', amountQuestion:{source:'three eight', candidatesKobo:[380000,3800000], flag}}]});
  const id = `answer:${pending.id}:2`;
  // A different session cannot use this ID, and nothing changes.
  const foreign = await POST(request({action:'interactive', id}, b));
  expect((await foreign.json()).replyText).toContain('nothing waiting to save');
  expect(store().pending(auth.ownerId, pending.id)!.status).toBe('review');
  expect((await POST(request({action:'interactive', id}))).status).toBe(401);
  expect((await POST(request({action:'interactive', id}, a, false))).status).toBe(403);
  const answered = await POST(request({action:'interactive', id}, a));
  const body = await answered.json();
  expect(answered.status).toBe(200);
  expect(body.pending.id).not.toBe(pending.id);
  expect(body.interactive.buttons.map((x: {title: string}) => x.title)).toEqual(['1 Save', '2 Edit', '3 Cancel']);
  expect(store().pending(auth.ownerId, body.pending.id)!.entries[0].amountKobo).toBe(3800000);
  expect(store().events(auth.ownerId)).toHaveLength(0);
  // The old button is now stale and cannot change the new review.
  const stale = await (await POST(request({action:'interactive', id}, a))).json();
  expect(stale.replyText.startsWith("That draft was replaced.")).toBe(true);
  expect((await POST(request({action:'interactive', id:'bogus'}, a))).status).toBe(400);
  delete process.env.MODEL_BASE_URL; delete process.env.MODEL_ID; delete process.env.MODEL_API_KEY;
});
