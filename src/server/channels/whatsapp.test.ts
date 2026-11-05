import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MessageReply } from '../../core/contract';
import { createHmac } from 'node:crypto';
import { LedgerStore } from '../ledger-store';
const mocks = vi.hoisted(() => ({ store: vi.fn(), service: vi.fn(), voice: vi.fn(), limit: vi.fn(() => true) }));
vi.mock('../web', () => ({ store: mocks.store, service: mocks.service }));
vi.mock('./runtime', async () => { const actual = await vi.importActual<typeof import('./runtime')>('./runtime'); return { ...actual, voiceMessage: mocks.voice, takeVoiceLimit: mocks.limit }; });
import { validSignature, verify, outgoing, receive, dispatch, downloadAudio } from './whatsapp';
let db: LedgerStore;
let app: { handleMessage: ReturnType<typeof vi.fn>; handleInteractive: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.unstubAllGlobals(); vi.clearAllMocks();
  db = new LedgerStore(':memory:');
  db.sqlite.prepare("INSERT INTO owners(id,name,passcode_hash,is_demo) VALUES('owner','Synthetic','disabled',0)").run();
  mocks.store.mockReturnValue(db);
  app = { handleMessage: vi.fn(async () => ({ replyText: 'review' })), handleInteractive: vi.fn(async () => ({ replyText: 'choice' })) };
  mocks.service.mockReturnValue(app);
  process.env.WHATSAPP_GRAPH_VERSION = 'v23.0'; process.env.WHATSAPP_PHONE_NUMBER_ID = '123'; process.env.WHATSAPP_ACCESS_TOKEN = 'synthetic'; process.env.WHATSAPP_APP_SECRET = 'synthetic-secret'; process.env.WHATSAPP_VERIFY_TOKEN = 'synthetic-verify'; process.env.WHATSAPP_OWNER_MAP_JSON = JSON.stringify({ '2348000000000': 'owner' });
});
afterEach(() => { db.sqlite.close(); vi.unstubAllGlobals(); });
function request(messages: unknown[], phone = '123', secret = 'synthetic-secret') {
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: phone }, messages } }] }] });
  return new Request('https://local/api/whatsapp', { method: 'POST', headers: { 'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` }, body });
}
const text = { id: 'wamid.synthetic', from: '2348000000000', type: 'text', text: { body: 'synthetic text' } };
it('verifies challenge and exact raw-body HMAC; malformed and missing signatures fail closed', () => {
  expect(verify(new Request('https://local?hub.mode=subscribe&hub.verify_token=synthetic-verify&hub.challenge=42')).status).toBe(200);
  expect(verify(new Request('https://local?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42')).status).toBe(403);
  expect(validSignature(Buffer.from('x'), 'sha256=bad', 's')).toBe(false);
  expect(validSignature(Buffer.from('x'), null, 's')).toBe(false);
});
it('deduplicates message ids durably across deliveries and ignores unauthorized senders/phone ids', async () => {
  const fetcher = vi.fn(async () => Response.json({ messages: [{ id: 'sent' }] })); vi.stubGlobal('fetch', fetcher);
  expect((await receive(request([text], '123', 'wrong'))).status).toBe(403);
  await receive(request([text], '999'));
  await receive(request([{ ...text, from: '2348000000001' }]));
  expect(app.handleMessage).not.toHaveBeenCalled();
  await receive(request([text])); await receive(request([text]));
  expect(app.handleMessage).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(db.sqlite.prepare('SELECT state FROM channel_whatsapp_inbox').get()).toEqual({ state: 'done' });
});
it('does not blindly retry an uncertain outbound send or re-execute core', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw Error('timeout'); }));
  await receive(request([text])); await receive(request([text]));
  expect(app.handleMessage).toHaveBeenCalledTimes(1);
  expect(db.sqlite.prepare('SELECT state FROM channel_whatsapp_inbox').get()).toEqual({ state: 'uncertain' });
});
it('routes text choices and review-bound buttons/list ids through core ownership/version checks', async () => {
  await dispatch('owner', { ...text, text: { body: '1 save' } });
  expect(app.handleMessage).toHaveBeenCalledWith({ channel: 'whatsapp', senderId: text.from, text: '1 save' });
  for (const id of ['save:review','edit:review','cancel:review','answer:review:0']) {
    await dispatch('owner', { ...text, type: 'interactive', interactive: { type: 'button_reply', button_reply: { id } } });
    expect(app.handleInteractive).toHaveBeenLastCalledWith({ channel: 'whatsapp', senderId: text.from, id });
  }
});
it('sends the complete review once, with all three correctly shaped reply buttons', () => {
  const result = outgoing(text.from, { replyText: 'Full review\n1 save / 2 edit / 3 cancel', interactive: { kind: 'buttons', body: 'Review', buttons: ['save','edit','cancel'].map((action, i) => ({ id: `${action}:review`, title: `${i+1} ${action}` })) } });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ type: 'interactive', interactive: { type: 'button', body: { text: 'Full review\n1 save / 2 edit / 3 cancel' }, action: { buttons: [{ type: 'reply', reply: { id: 'save:review', title: '1 save' } }, { type: 'reply', reply: { id: 'edit:review' } }, { type: 'reply', reply: { id: 'cancel:review' } }] } } });
});
it.each(['buttons', 'list'] as const)('delivers one complete %s reply through signed receive and dedupes redelivery', async kind => {
  const reply: MessageReply = { replyText: 'Ada owes ₦3,800.\n1 save / 2 edit / 3 cancel', interactive: kind === 'buttons'
    ? { kind, body: 'Lossy summary', buttons: [{ id: 'save:review', title: '1 Save' }, { id: 'edit:review', title: '2 Edit' }, { id: 'cancel:review', title: '3 Cancel' }] }
    : { kind, body: 'Lossy summary', rows: [{ id: 'answer:review:1', title: 'Ada' }, { id: 'answer:review:2', title: 'New customer' }] } };
  app.handleMessage.mockResolvedValue(reply);
  const fetcher = vi.fn(async () => Response.json({ messages: [{ id: 'sent' }] })); vi.stubGlobal('fetch', fetcher);
  await receive(request([text])); await receive(request([text]));
  expect(app.handleMessage).toHaveBeenCalledTimes(1);
  expect(mocks.service).toHaveBeenCalledWith('owner');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]).toEqual(expect.arrayContaining(['https://graph.facebook.com/v23.0/123/messages']));
  const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1];
  const sent = JSON.parse(init.body as string);
  expect(sent).toMatchObject({ to: text.from, type: 'interactive', interactive: { body: { text: reply.replyText } } });
  expect(db.sqlite.prepare('SELECT state FROM channel_whatsapp_inbox').get()).toEqual({ state: 'done' });
  const ids = kind === 'buttons' ? reply.interactive!.buttons!.map(b => b.id) : reply.interactive!.rows!.map(r => r.id);
  for (const [i, id] of ids.entries()) {
    const type = kind === 'buttons' ? 'button_reply' : 'list_reply';
    const m = { id: `wamid.choice.${i}`, from: text.from, type: 'interactive', interactive: { type, [type]: { id } } };
    await receive(request([m])); await receive(request([m]));
    expect(app.handleInteractive).toHaveBeenLastCalledWith({ channel: 'whatsapp', senderId: text.from, id });
  }
  expect(app.handleInteractive).toHaveBeenCalledTimes(ids.length);
});
it('delivers long text chunks then all choices, without repeating facts or retrying partial sends', async () => {
  const reply: MessageReply = { replyText: `${'Synthetic fact ₦3,800.\n'.repeat(500)}1 save / 2 edit / 3 cancel`, interactive: { kind: 'buttons', body: 'Synthetic fact ₦3,800.', buttons: [{ id: 'save:review', title: '1 Save' }, { id: 'edit:review', title: '2 Edit' }, { id: 'cancel:review', title: '3 Cancel' }] } };
  app.handleMessage.mockResolvedValue(reply);
  const sent: { type: string; text?: { body: string }; interactive?: { body: { text: string }; action: { buttons: { reply: { id: string } }[] } } }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => { sent.push(JSON.parse(init.body as string)); return Response.json({ messages: [{ id: 'sent' }] }); }));
  await receive(request([text])); await receive(request([text]));
  expect(sent.slice(0, -1).map(m => m.text!.body).join('')).toBe(reply.replyText);
  expect(sent.at(-1)).toMatchObject({ type: 'interactive', interactive: { body: { text: 'Choose an option for the reply above.' }, action: { buttons: [{ reply: { id: 'save:review' } }, { reply: { id: 'edit:review' } }, { reply: { id: 'cancel:review' } }] } } });
  expect(app.handleMessage).toHaveBeenCalledTimes(1);
  expect(db.sqlite.prepare('SELECT state FROM channel_whatsapp_inbox').get()).toEqual({ state: 'done' });

  const failing = vi.fn(async (_url: string, init: RequestInit) => {
    if (JSON.parse(init.body as string).type === 'interactive') throw Error('uncertain action delivery');
    return Response.json({ messages: [{ id: 'sent' }] });
  }); vi.stubGlobal('fetch', failing);
  const next = { ...text, id: 'wamid.partial' };
  await receive(request([next]));
  const calls = failing.mock.calls.length;
  await receive(request([next]));
  expect(failing).toHaveBeenCalledTimes(calls);
  expect(app.handleMessage).toHaveBeenCalledTimes(2);
  expect(db.sqlite.prepare('SELECT state FROM channel_whatsapp_inbox WHERE message_id=?').get(next.id)).toEqual({ state: 'uncertain' });
});
it('downloads only bounded Meta-hosted audio, then passes a private audio reference to voice wrapper', async () => {
  const transport = vi.fn(async (url: string | URL) => String(url).includes('graph.facebook.com') ? Response.json({ url: 'https://lookaside.fbsbx.com/audio', mime_type: 'audio/ogg', file_size: 5 }) : new Response('audio'));
  vi.stubGlobal('fetch', transport);
  mocks.voice.mockResolvedValue({ replyText: 'transcript review' });
  expect(await dispatch('owner', { ...text, type: 'audio', audio: { id: '456' } })).toMatchObject({ replyText: 'transcript review' });
  expect(mocks.voice).toHaveBeenCalledWith('owner', expect.objectContaining({ channel: 'whatsapp', senderId: text.from, audioPath: expect.stringContaining('clip-') }));
  const evil = vi.fn(async () => Response.json({ url: 'https://evil.example/audio', mime_type: 'audio/ogg', file_size: 5 }));
  await expect(downloadAudio('456', evil as typeof fetch)).rejects.toThrow('Untrusted'); expect(evil).toHaveBeenCalledTimes(1);
});
