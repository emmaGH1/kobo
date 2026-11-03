import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { LedgerStore } from './ledger-store';
import { createModelProvider, type ModelProvider } from './model-provider';
import { Service } from './service';

let instance: LedgerStore | undefined;
export function store() {
  if (!instance) {
    instance = new LedgerStore(process.env.KOBO_DB_PATH || undefined);
    instance.sqlite.exec(`CREATE TABLE IF NOT EXISTS web_sessions (token_hash TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS login_throttle (id INTEGER PRIMARY KEY CHECK(id=1), failures INTEGER NOT NULL, until_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS model_usage (id INTEGER PRIMARY KEY, at INTEGER NOT NULL, input_tokens INTEGER, output_tokens INTEGER);
      CREATE TABLE IF NOT EXISTS request_limits (name TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL);`);
  }
  return instance;
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
function takeLimit(name: string, maximum: number, windowMs: number) {
  const db = store().sqlite;
  return db.transaction(() => {
    const now = Date.now();
    const row = db.prepare('SELECT window_start AS start,count FROM request_limits WHERE name=?').get(name) as { start: number; count: number } | undefined;
    const count = !row || now - row.start >= windowMs ? 1 : row.count + 1;
    const start = !row || now - row.start >= windowMs ? now : row.start;
    if (count > maximum) return false;
    db.prepare('INSERT INTO request_limits VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET window_start=excluded.window_start,count=excluded.count').run(name, start, count);
    return true;
  }).immediate();
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return url.origin === origin && url.host === host && (url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:'));
  } catch { return false; }
}
export function session(req: NextRequest): { ownerId: string; senderId: string } | undefined {
  const token = req.cookies.get('kobo_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  const tokenHash = hash(token);
  const row = store().sqlite.prepare('SELECT owner_id AS ownerId FROM web_sessions WHERE token_hash=? AND expires_at>?').get(tokenHash, Date.now()) as {ownerId: string} | undefined;
  return row ? { ...row, senderId: tokenHash } : undefined;
}
export function login(req: NextRequest, mode: unknown, passcode: unknown): NextResponse {
  const db = store().sqlite; const now = Date.now();
  let ownerId: string;
  if (mode === 'owner') {
    const throttle = db.prepare('SELECT failures,until_at AS untilAt FROM login_throttle WHERE id=1').get() as {failures:number;untilAt:number} | undefined;
    if (throttle && throttle.untilAt > now) return NextResponse.json({ error: 'Try again later' }, { status: 429 });
    const configured = process.env.OWNER_PASSCODE;
    const valid = typeof passcode === 'string' && passcode.length <= 1024 && !!configured && configured.length >= 12 && timingSafeEqual(Buffer.from(hash(passcode)), Buffer.from(hash(configured)));
    if (!valid) {
      const failures = (throttle?.failures ?? 0) + 1;
      db.prepare('INSERT INTO login_throttle VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET failures=excluded.failures,until_at=excluded.until_at').run(failures, now + Math.min(300000, 1000 * 2 ** Math.min(failures, 8)));
      return NextResponse.json({ error: 'Invalid credentials or owner not configured' }, { status: 401 });
    }
    db.prepare('DELETE FROM login_throttle WHERE id=1').run();
    ownerId = 'owner';
    db.prepare("INSERT OR IGNORE INTO owners(id,name,passcode_hash,is_demo) VALUES(?,?,'external',0)").run(ownerId, 'Owner');
  } else if (mode === 'demo') {
    if (!takeLimit('demo_login', 10, 60000)) return NextResponse.json({ error: 'Try again later' }, { status: 429 });
    ownerId = `demo-${randomUUID()}`;
    db.transaction(() => {
      db.prepare("INSERT INTO owners(id,name,passcode_hash,is_demo) VALUES(?,?,'disabled',1)").run(ownerId, 'Demo');
      db.prepare('INSERT INTO customers(id,owner_id,name) VALUES(?,?,?)').run(randomUUID(), ownerId, 'Ada Example');
    })();
  } else return NextResponse.json({ error: 'Invalid login' }, { status: 400 });
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO web_sessions VALUES(?,?,?)').run(hash(token), ownerId, now + 8 * 3600000);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('kobo_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 8 * 3600 });
  return res;
}
export function service(ownerId: string) {
  const real = createModelProvider();
  const provider: ModelProvider = {
    listModels: () => real.listModels(),
    async requestToolResponse(request) {
      if (!takeLimit('model_global', 20, 60000) || !takeLimit(`model:${ownerId}`, 10, 60000)) throw new Error('Rate limit exceeded');
      const result = await real.requestToolResponse(request);
      if (typeof result === 'object' && result !== null && 'usage' in result && typeof result.usage === 'object' && result.usage !== null) {
        const usage = result.usage as Record<string, unknown>;
        const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : null;
        store().sqlite.prepare('INSERT INTO model_usage(at,input_tokens,output_tokens) VALUES(?,?,?)').run(Date.now(), count(usage.input_tokens), count(usage.output_tokens));
      }
      return result;
    },
  };
  return new Service(ownerId, store(), provider);
}
