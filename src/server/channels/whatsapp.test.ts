import { it, expect, vi, beforeEach } from 'vitest';
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
it('sends full text plus at most three correctly shaped reply buttons', () => {
  const result = outgoing(text.from, { replyText: '1 save / 2 edit / 3 cancel', interactive: { kind: 'buttons', body: 'Review', buttons: ['save','edit','cancel'].map((action, i) => ({ id: `${action}:review`, title: `${i+1} ${action}` })) } });
  expect(result[0]).toMatchObject({ type: 'text' });
  expect(result[1]).toMatchObject({ type: 'interactive', interactive: { type: 'button', action: { buttons: [{ type: 'reply', reply: { id: 'save:review', title: '1 save' } }, { type: 'reply', reply: { id: 'edit:review' } }, { type: 'reply', reply: { id: 'cancel:review' } }] } } });
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
