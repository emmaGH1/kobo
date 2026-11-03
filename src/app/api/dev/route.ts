import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { login, sameOrigin, service, session, store } from '../../../server/web';
import { balances } from '../../../core/ledger';
import { formatNaira } from '../../../server/copy';

// POST routes run in the default Node.js runtime; cacheComponents forbids segment overrides.
const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('login'), mode: z.enum(['owner', 'demo']), passcode: z.string().max(1024).optional() }).strict(),
  z.object({ action: z.literal('logout') }).strict(),
  z.object({ action: z.literal('customer'), name: z.string().trim().min(1).max(100) }).strict(),
  z.object({ action: z.literal('reminder'), name: z.string().trim().min(1).max(100), phone: z.string().regex(/^[1-9]\d{7,14}$/) }).strict(),
  z.object({ action: z.literal('message'), text: z.string().trim().min(1).max(4000) }).strict(),
  z.object({ action: z.enum(['confirm', 'cancel', 'edit']), pendingId: z.uuid() }).strict(),
  // Opaque ids from a previous reply's `interactive` block; routed and re-checked server-side.
  z.object({ action: z.literal('interactive'), id: z.string().max(100) }).strict(),
]);
async function boundedBody(req: NextRequest): Promise<string> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (!Number.isFinite(length) || length < 0 || length > 10000 || !req.body) throw new Error('Invalid body');
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let total = 0; let body = '';
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 10000) { await reader.cancel(); throw new Error('Body too large'); }
      body += decoder.decode(value, {stream:true});
    }
    return body + decoder.decode();
  } finally { reader.releaseLock(); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  try {
    const body = await boundedBody(req);
    const parsed = requestSchema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const data = parsed.data;
    if (data.action === 'login') return login(req, data.mode, data.passcode);
    const auth = session(req);
    if (!auth) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    if (data.action === 'logout') {
      store().sqlite.prepare('DELETE FROM web_sessions WHERE token_hash=?').run(auth.senderId);
      const res = NextResponse.json({ ok: true }); res.cookies.delete('kobo_session'); return res;
    }
    if (data.action === 'customer') {
      const exists = store().sqlite.prepare(`SELECT 1 FROM customers WHERE owner_id=? AND name=? COLLATE NOCASE UNION ALL SELECT 1 FROM customer_aliases WHERE owner_id=? AND alias=? COLLATE NOCASE LIMIT 1`).get(auth.ownerId, data.name, auth.ownerId, data.name);
      if (exists) return NextResponse.json({ error: 'Customer already exists' }, { status: 409 });
      store().sqlite.prepare('INSERT INTO customers(id,owner_id,name) VALUES(?,?,?)').run(randomUUID(), auth.ownerId, data.name);
      return NextResponse.json({ ok: true });
    }
    if (data.action === 'reminder') {
      const customer = store().findCustomer(auth.ownerId, data.name);
      if (!customer) return NextResponse.json({ error: 'Customer not found or ambiguous' }, { status: 404 });
      const amount = balances(store().events(auth.ownerId))[customer.id] ?? 0;
      if (amount <= 0) return NextResponse.json({ error: 'No outstanding balance' }, { status: 400 });
      const amountText = formatNaira(amount);
      const message = `Hello ${customer.name}, this is a reminder that your outstanding balance is ${amountText}. Thank you.`;
      return NextResponse.json({ replyText: message, reminderUrl: `https://wa.me/${data.phone}?text=${encodeURIComponent(message)}` }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const app = service(auth.ownerId); const context = { channel: 'web' as const, senderId: auth.senderId };
    const reply = data.action === 'message' ? await app.handleMessage({ ...context, text: data.text })
      : data.action === 'confirm' ? await app.confirm({ ...context, pendingId: data.pendingId })
      : data.action === 'edit' ? await app.edit({ ...context, pendingId: data.pendingId })
      : data.action === 'interactive' ? await app.handleInteractive({ ...context, id: data.id })
      : await app.cancel({ ...context, pendingId: data.pendingId });
    return NextResponse.json(reply, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Request could not be completed. Nothing new was saved unless a previous confirmation succeeded.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
