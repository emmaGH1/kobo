import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { outstandingDebts } from '../core/ledger';
import { Reminders } from './reminders';
import type { MessageReply } from '../core/contract';
import { LedgerStore } from './ledger-store';
import { createModelProvider, type ModelProvider } from './model-provider';
import { Service } from './service';
import { demoSummaryCard } from './demo-summary';
import { sameOrigin, store as defaultStore } from './web';

const COOKIE = 'kobo_demo';
const TTL = 30 * 60 * 1000;
export const DEMO_LIMIT = 12;
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
interface Session { token: string; owner: string; expires: number; used: number }
export interface DemoOptions { store: LedgerStore; provider: () => ModelProvider; dailyCap?: number; ip?: (r: NextRequest) => string }

/** Server-only demo boundary. No UI/voice/channel dependencies. */
export function createDemoHandler(options: DemoOptions) {
  const { store } = options;
  const db = store.sqlite;
  db.exec(`CREATE TABLE IF NOT EXISTS demo_sessions(token TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES owners(id), expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, busy TEXT, busy_until INTEGER);
    CREATE TABLE IF NOT EXISTS demo_limits(key TEXT PRIMARY KEY, start INTEGER NOT NULL, used INTEGER NOT NULL);`);
  function take(key: string, max: number, window: number) {
    if (max <= 0) return false;
    const now = Date.now();
    const row = db.prepare('SELECT start,used FROM demo_limits WHERE key=?').get(key) as {start:number;used:number} | undefined;
    const fresh = !row || now - row.start >= window;
    if (!fresh && row.used >= max) return false;
    db.prepare('INSERT INTO demo_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET start=excluded.start,used=excluded.used').run(key, fresh ? now : row.start, fresh ? 1 : row.used + 1);
    return true;
  }
  function session(req: NextRequest): Session | undefined {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
    return db.prepare('SELECT token,owner,expires,used FROM demo_sessions WHERE token=? AND expires>?').get(hash(token), Date.now()) as Session | undefined;
  }
  function seed() {
    const owner = `demo-${randomUUID()}`;
    db.prepare("INSERT INTO owners VALUES(?, 'Fictional demo book', 'disabled', 1)").run(owner);
    const chidi = randomUUID(), bayo = randomUUID();
    db.prepare('INSERT INTO customers VALUES(?,?,?)').run(chidi, owner, 'Mama Chidi');
    db.prepare('INSERT INTO customers VALUES(?,?,?)').run(bayo, owner, 'Bayo');
    store.seedConfirmed(owner, Date.now() - 14 * 86400000, 'Fictional demo opening debt', [{customerId:chidi,kind:'opening_debt',amountKobo:1350000}]);
    store.seedConfirmed(owner, Date.now() - 9 * 86400000, 'Fictional demo payment', [{customerId:chidi,kind:'payment',amountKobo:500000}]);
    store.seedConfirmed(owner, Date.now() - 2 * 86400000, 'Fictional demo opening debt', [{customerId:bayo,kind:'opening_debt',amountKobo:2800000}]);
    const d = new Date(Date.now()+3600000);
    const nextFriday = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+((5-d.getUTCDay()+7)%7||7))).toISOString().slice(0,10);
    store.seedConfirmed(owner,Date.now()-86400000,'Fictional demo credit sale and partial payment',[{customerId:chidi,kind:'sale',amountKobo:4500000,dueDate:nextFriday},{customerId:chidi,kind:'payment',amountKobo:2000000}]);
    return owner;
  }
  const limited = () => NextResponse.json({ reason:'demo_limit', replies:[], remaining:0, limited:true }, {status:429});
  return async function handle(req: NextRequest, operation: string): Promise<Response> {
    const json = (value: unknown, status = 200) => NextResponse.json(value, {status,headers:{'Cache-Control':'no-store'}});
    if (req.method === 'GET' && operation === 'samples') return json({ suggestions:['Bayo paid 3,800', 'Who owes me?', 'Show me Mama Chidi history', 'How market today?'], voiceSamples:[] });
    if (req.method === 'GET' && operation === 'summary-card') {
      const s = session(req);
      return s ? demoSummaryCard(store,s.owner) : json({error:'Demo session required'},401);
    }
    if (req.method !== 'POST') return json({error:'Method not allowed'},405);
    if (!sameOrigin(req)) return json({error:'Invalid origin'},403);
    // Bound bodies before JSON parsing, including chunked requests with no Content-Length.
    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();
    let size = 0;
    if (reader) {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 8192) { await reader.cancel(); return json({error:'Body too large'},413); }
        chunks.push(part.value);
      }
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    let body: Record<string, unknown>;
    try { const v: unknown = raw ? JSON.parse(raw) : {}; if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(); body = v as Record<string, unknown>; }
    catch { return json({error:'Invalid JSON'},400); }
    let s = session(req);
    if (operation === 'session' || operation === 'reset') {
      if (s && operation === 'session') return json({expiresAt:s.expires,remaining:DEMO_LIMIT-s.used,language:store.language(s.owner,'web',s.token)?.language === 'pg' ? 'pcm' : 'en'});
      // Only trust a proxy-provided IP when explicitly configured; otherwise one safe global bucket.
      const ip = options.ip?.(req) ?? (process.env.KOBO_TRUST_PROXY_IP === '1' ? req.headers.get('x-real-ip') ?? 'unknown' : 'unknown');
      const result = db.transaction(() => {
        if (!take(`ip:${hash(ip)}`,3,3600000) || !take('session-global',100,3600000)) return;
        if (s) {
          const current = db.prepare('SELECT busy_until FROM demo_sessions WHERE token=?').get(s.token) as {busy_until:number|null}|undefined;
          if (current?.busy_until && current.busy_until > Date.now()) return;
          db.prepare('DELETE FROM demo_sessions WHERE token=?').run(s.token);
        }
        const token = randomBytes(32).toString('hex');
        const owner = seed();
        const expires = s?.expires ?? Date.now()+TTL;
        const used = s?.used ?? 0; // Reset never replenishes the paid-call allowance or TTL.
        db.prepare('INSERT INTO demo_sessions(token,owner,expires,used) VALUES(?,?,?,?)').run(hash(token),owner,expires,used);
        return {token,expires,used};
      }).immediate();
      if (!result) return limited();
      const response = json({expiresAt:result.expires,remaining:DEMO_LIMIT-result.used,language:'en'});
      response.cookies.set(COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/demo',maxAge:Math.max(0,Math.floor((result.expires-Date.now())/1000))});
      return response;
    }
    if (!s) return json({error:'Demo session required'},401);
    if (operation === 'voice-sample') return json({error:'No consented server-owned voice sample is configured',reason:'unavailable'},503);
    if (operation === 'skip-friday') {
      const debts=outstandingDebts(store.events(s.owner)).filter(d=>d.dueDate).sort((a,b)=>a.dueDate!.localeCompare(b.dueDate!));
      if(!debts.length) return json({replies:[],remaining:DEMO_LIMIT-s.used,simulated:true});
      const now=Date.parse(`${debts[0].dueDate}T07:00:00Z`);
      const reminders=new Reminders(store);
      reminders.tick(now,{owner:s.owner,channel:'web',sender:s.token},true);
      const lang=store.language(s.owner,'web',s.token)?.language??'en';
      const queued=reminders.queued(s.owner,'web',s.token,lang);
      return json({replies:queued.map(q=>({lang:lang==='pg'?'pcm':'en',kind:'buttons',body:q.reply.replyText,buttons:q.reply.interactive?.buttons})),remaining:DEMO_LIMIT-s.used,simulated:true,simulatedAt:now});
    }
    if (!['message','action'].includes(operation)) return json({error:'Not found'},404);
    if (operation === 'message' && (typeof body.text !== 'string' || !body.text.trim() || body.text.length>4000)) return json({error:'Invalid text'},400);
    if (operation === 'action' && (typeof body.action !== 'string' || body.action.length>300)) return json({error:'Invalid action'},400);
    const lease = randomUUID();
    if (!db.prepare('UPDATE demo_sessions SET busy=?,busy_until=? WHERE token=? AND (busy IS NULL OR busy_until<?)').run(lease,Date.now()+120000,s.token,Date.now()).changes) return json({error:'Request in progress'},409);
    let capHit = false;
    const provider: ModelProvider = {listModels:async()=>[],requestToolResponse:async request => {
      const allowed = db.transaction(() => {
        if (!db.prepare('SELECT 1 FROM demo_sessions WHERE token=? AND expires>? AND used<?').get(s!.token,Date.now(),DEMO_LIMIT)) return false;
        const configured = options.dailyCap ?? Number(process.env.KOBO_DEMO_DAILY_CAP ?? 100);
        const cap = Number.isSafeInteger(configured) && configured>=0 ? configured : 0;
        if (!take(`paid:${new Date(Date.now()+3600000).toISOString().slice(0,10)}`,cap,48*3600000)) return false;
        db.prepare('UPDATE demo_sessions SET used=used+1 WHERE token=?').run(s!.token);
        return true;
      }).immediate();
      if (!allowed) { capHit=true; throw new Error('demo_limit'); }
      return options.provider().requestToolResponse(request); // Reserved before invocation, even on provider failure.
    }};
    const service = new Service(s.owner,store,provider);
    const ctx = {channel:'web' as const,senderId:s.token};
    try {
      let reply: MessageReply;
      if (operation === 'message') reply = await service.handleMessage({...ctx,text:body.text as string});
      else {
        const action = body.action as string;
        // Both opaque button ids from ReplyView and the documented structured action envelope.
        if (['confirm','edit','cancel','choose'].includes(action)) {
          if (typeof body.pendingId !== 'string' || body.version !== 1) {
            const current = store.current(s.owner,'web',s.token)[0];
            reply = current ? await service.handleInteractive({...ctx,id:`save:${randomUUID()}`}) : {replyText:'Nothing is waiting to save.'};
          } else if (action === 'choose') {
            if (typeof body.value !== 'string' || body.value.length>200) return json({error:'Invalid choice'},400);
            try { reply = await service.resolveClarification({...ctx,pendingId:body.pendingId,answer:body.value}); }
            catch { reply = await service.handleInteractive({...ctx,id:`save:${randomUUID()}`}); }
          } else reply = await service.handleInteractive({...ctx,id:`${action==='confirm'?'save':action}:${body.pendingId}`});
        } else reply = await service.handleInteractive({...ctx,id:action});
      }
      if (capHit) return limited();
      s = session(req)!;
      const lang = store.language(s.owner,'web',s.token)?.language === 'pg' ? 'pcm' : 'en';
      const i = reply.interactive;
      const view = {lang,kind:i?.kind ?? 'text',body:i?.body ?? reply.replyText,...(i?.footer?{footer:i.footer}:{}),...(i?.buttons?{buttons:i.buttons}:{}),...(i?.rows?{list:{button:i.listButton??'Choose',rows:i.rows}}:{}),...(reply.pending?{pendingId:reply.pending.id,pendingVersion:1}:{})};
      return json({...reply,replies:[view],remaining:DEMO_LIMIT-s.used});
    } catch { return json({error:'Request could not be processed. Nothing new was saved.'},400); }
    finally { db.prepare('UPDATE demo_sessions SET busy=NULL,busy_until=NULL WHERE token=? AND busy=?').run(s!.token,lease); }
  };
}
let handler: ReturnType<typeof createDemoHandler> | undefined;
export function demoHandler(req: NextRequest, operation: string) {
  handler ??= createDemoHandler({store:defaultStore(),provider:()=>createModelProvider()});
  return handler(req,operation);
}
