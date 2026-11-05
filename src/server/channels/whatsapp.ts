import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { MessageReply } from '../../core/contract';
import { MAX_AUDIO_BYTES, withAudio } from '../voice';
import { service, store } from '../web';
import { boundedBytes, takeVoiceLimit, voiceMessage } from './runtime';
export function validSignature(raw: Uint8Array, signature: string | null, secret: string): boolean {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature.slice(7), 'hex'), createHmac('sha256', secret).update(raw).digest());
}
export function verify(req: Request): Response {
  const url = new URL(req.url); const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token || url.searchParams.get('hub.mode') !== 'subscribe' || url.searchParams.get('hub.verify_token') !== token || !url.searchParams.get('hub.challenge')) return new Response('Forbidden', { status: 403 });
  return new Response(url.searchParams.get('hub.challenge'), { headers: { 'Cache-Control': 'no-store' } });
}
function config() {
  const version = process.env.WHATSAPP_GRAPH_VERSION;
  const phone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!version || !/^v\d+\.0$/.test(version) || !phone || !/^\d+$/.test(phone) || !token) throw Error('WhatsApp not configured');
  return { base: `https://graph.facebook.com/${version}`, phone, token };
}
async function graph(path: string, body?: unknown, transport: typeof fetch = fetch) {
  const c = config();
  const res = await transport(`${c.base}/${path}`, { method: body ? 'POST' : 'GET', redirect: 'error', headers: { Authorization: `Bearer ${c.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw Error('WhatsApp request failed');
  return res.json();
}
// Conservative UTF-16 limits also fit when Meta counts Unicode code points. IDs must
// fit our inbound schema (100), even though Graph permits longer opaque IDs.
const field = (max: number) => z.string().min(1).max(max).refine(s => !!s.trim() && s.isWellFormed());
const choiceId = field(100).refine(s => s === s.trim());
const uniqueIds = (items: { id: string }[]) => new Set(items.map(item => item.id)).size === items.length;
const controlsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('buttons'), footer: field(60).optional(), buttons: z.array(z.object({ id: choiceId, title: field(20) })).min(1).max(3).refine(uniqueIds).refine(items => new Set(items.map(item => item.title)).size === items.length) }),
  z.object({ kind: z.literal('list'), footer: field(60).optional(), listButton: field(20).default('Choose'), rows: z.array(z.object({ id: choiceId, title: field(24), description: field(72).optional() })).min(1).max(10).refine(uniqueIds) }),
]);
/** Keep ordinary grapheme clusters intact, including emoji/combining sequences.
 * An exceptional cluster larger than a whole message is split at code points instead.
 */
function textChunks(text: string): string[] {
  const chunks: string[] = [];
  let chunk = '';
  for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) {
    for (const part of segment.length <= 4096 ? [segment] : Array.from(segment)) {
      if (chunk.length + part.length > 4096) { chunks.push(chunk); chunk = ''; }
      chunk += part;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
/** replyText is the complete typed equivalent; ui.body may already be truncated.
 * Never repeat that review, trim its facts, shorten IDs/labels or drop excess rows.
 * Invalid controls fall back to the contract's complete typed-choice equivalent.
 */
export function outgoing(to: string, reply: MessageReply): object[] {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  const controls = controlsSchema.safeParse(reply.interactive);
  const fits = !!reply.replyText.trim() && reply.replyText.length <= 1024;
  const messages: object[] = fits && controls.success ? [] : textChunks(reply.replyText).map(body => ({ ...base, type: 'text', text: { body } }));
  if (!controls.success) return messages;
  const ui = controls.data;
  // The typed reply already carries review/question footers. Don't repeat them.
  const footer = ui.footer && !reply.replyText.includes(ui.footer) ? { footer: { text: ui.footer } } : {};
  messages.push({ ...base, type: 'interactive', interactive: {
    type: ui.kind === 'buttons' ? 'button' : 'list',
    body: { text: fits ? reply.replyText : 'Choose an option for the reply above.' },
    ...footer,
    action: ui.kind === 'buttons'
      ? { buttons: ui.buttons.map(button => ({ type: 'reply', reply: button })) }
      : { button: ui.listButton, sections: [{ rows: ui.rows }] },
  } });
  return messages;
}
export async function downloadAudio(id: string, transport: typeof fetch = fetch): Promise<Uint8Array> {
  if (!/^\d+$/.test(id)) throw Error('Invalid media id');
  const media = await graph(id, undefined, transport);
  if (typeof media.url !== 'string' || typeof media.mime_type !== 'string' || !media.mime_type.startsWith('audio/') || !Number.isSafeInteger(media.file_size) || media.file_size <= 0 || media.file_size > MAX_AUDIO_BYTES) throw Error('Invalid audio');
  const url = new URL(media.url);
  // Never forward the access token to an arbitrary webhook-supplied URL or redirect.
  if (url.protocol !== 'https:' || url.hostname !== 'lookaside.fbsbx.com' || url.port || url.username || url.password) throw Error('Untrusted media URL');
  const res = await transport(url, { redirect: 'error', headers: { Authorization: `Bearer ${config().token}` }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw Error('Media unavailable');
  return boundedBytes(new Request('http://local', { method: 'POST', body: res.body, duplex: 'half' } as RequestInit), MAX_AUDIO_BYTES);
}
const messageSchema = z.object({ id: z.string().min(1).max(300), from: z.string().regex(/^[1-9]\d{7,14}$/), type: z.string(), text: z.object({ body: z.string().min(1).max(4000) }).optional(), audio: z.object({ id: z.string().regex(/^\d+$/) }).optional(), interactive: z.object({ type: z.enum(['button_reply','list_reply']), button_reply: z.object({ id: z.string().max(100) }).optional(), list_reply: z.object({ id: z.string().max(100) }).optional() }).optional() });
const envelope = z.object({ object: z.literal('whatsapp_business_account'), entry: z.array(z.object({ changes: z.array(z.object({ field: z.string(), value: z.object({ metadata: z.object({ phone_number_id: z.string() }).optional(), messages: z.array(z.unknown()).optional() }) })) })) });
export type WhatsAppMessage = z.infer<typeof messageSchema>;
export async function dispatch(ownerId: string, m: WhatsAppMessage): Promise<MessageReply> {
  const context = { channel: 'whatsapp' as const, senderId: m.from };
  const app = service(ownerId);
  if (m.type === 'text' && m.text) return app.handleMessage({ ...context, text: m.text.body });
  const id = m.interactive?.type === 'button_reply' ? m.interactive.button_reply?.id : m.interactive?.list_reply?.id;
  if (m.type === 'interactive' && id) return app.handleInteractive({ ...context, id });
  if (m.type === 'audio' && m.audio) {
    if (!takeVoiceLimit(ownerId)) return { replyText: 'Please wait a minute before sending another voice note.' };
    return withAudio(await downloadAudio(m.audio.id), audioPath => voiceMessage(ownerId, { ...context, audioPath }));
  }
  return { replyText: 'Please send text or a voice note.' };
}
/** At-most-once inbox. Ambiguous/crashed attempts are quarantined, never blindly rerun. */
export function inbox() {
  const db = store().sqlite;
  db.exec(`CREATE TABLE IF NOT EXISTS channel_whatsapp_inbox (message_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, sender_id TEXT NOT NULL, state TEXT NOT NULL, at INTEGER NOT NULL);`);
  return db;
}
export async function receive(req: Request): Promise<Response> {
  let bytes: Uint8Array;
  try { bytes = await boundedBytes(req, 1000000); } catch { return new Response('Too large', { status: 413 }); }
  if (!validSignature(bytes, req.headers.get('x-hub-signature-256'), process.env.WHATSAPP_APP_SECRET || '')) return new Response('Forbidden', { status: 403 });
  try {
    const data = envelope.parse(JSON.parse(Buffer.from(bytes).toString('utf8'))); const c = config();
    // Explicit administrator mapping: a verified WhatsApp identity is not automatic owner access.
    const owners = z.record(z.string().regex(/^[1-9]\d{7,14}$/), z.string().min(1)).parse(JSON.parse(process.env.WHATSAPP_OWNER_MAP_JSON || '{}'));
    for (const entry of data.entry) for (const change of entry.changes) {
      if (change.field !== 'messages' || change.value.metadata?.phone_number_id !== c.phone) continue;
      for (const raw of change.value.messages || []) {
        const parsed = messageSchema.safeParse(raw); if (!parsed.success) continue;
        const m = parsed.data; const ownerId = owners[m.from];
        if (!ownerId || !store().sqlite.prepare('SELECT 1 FROM owners WHERE id=? AND is_demo=0').get(ownerId)) continue;
        const db = inbox();
        if (!db.prepare("INSERT OR IGNORE INTO channel_whatsapp_inbox VALUES(?,?,?,'processing',?)").run(m.id,ownerId,m.from,Date.now()).changes) continue;
        try {
          let reply: MessageReply;
          try { reply = await dispatch(ownerId, m); }
          catch { reply = { replyText: 'Your message could not be processed. Please check the current review before trying again; nothing is saved without your confirmation.' }; }
          // Claim send before network I/O: timeout is not evidence of failed delivery.
          db.prepare("UPDATE channel_whatsapp_inbox SET state='sending' WHERE message_id=?").run(m.id);
          for (const payload of outgoing(m.from, reply)) await graph(`${c.phone}/messages`, payload);
          db.prepare("UPDATE channel_whatsapp_inbox SET state='done' WHERE message_id=?").run(m.id);
        } catch { db.prepare("UPDATE channel_whatsapp_inbox SET state='uncertain' WHERE message_id=?").run(m.id); }
      }
    }
    return new Response('OK');
  } catch { return new Response('Invalid webhook or configuration', { status: 400 }); }
}
