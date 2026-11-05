import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { LedgerStore } from '../ledger-store';
import { Service } from '../service';
import type { ModelProvider } from '../model-provider';
import type { MessageInput } from '../../core/contract';

const mocks = vi.hoisted(() => ({ store: vi.fn(), service: vi.fn(), recognize: vi.fn() }));
vi.mock('../web', () => ({ store: mocks.store, service: mocks.service }));
vi.mock('../voice', async () => {
  const actual = await vi.importActual<typeof import('../voice')>('../voice');
  return { ...actual,
    // No recording, audio conversion or paid ASR. Keep the real transcript dispatch wrapper.
    withAudio: async (_bytes: Uint8Array, consume: (path: string) => unknown) => consume('/fictional-private-clip/input'),
    handleVoiceMessage: (app: Service, input: MessageInput, keywords: string[]) => actual.handleVoiceMessage(app, input, keywords, mocks.recognize),
  };
});
vi.mock('./runtime', async () => ({ ...await vi.importActual<typeof import('./runtime')>('./runtime'), takeVoiceLimit: () => true }));
import { dispatch } from './whatsapp';

let db: LedgerStore;
let app: Service;
let provider: ReturnType<typeof vi.fn<ModelProvider['requestToolResponse']>>;
const senderId = '2348000000000';
beforeEach(() => {
  vi.clearAllMocks();
  db = new LedgerStore(':memory:');
  db.sqlite.exec("INSERT INTO owners VALUES('a','Fictional A','disabled',0),('b','Fictional B','disabled',0)");
  const id = randomUUID();
  db.sqlite.prepare('INSERT INTO customers VALUES(?,?,?)').run(id, 'a', 'Brother Tunde');
  db.sqlite.prepare('INSERT INTO customers VALUES(?,?,?)').run(randomUUID(), 'b', 'Private Fictional Customer');
  db.seedConfirmed('a', Date.now(), 'Fictional saved balance', [{ kind: 'opening_debt', customerId: id, amountKobo: 1200000 }]);
  provider = vi.fn(async () => { throw Error('Draft must not invoke the model'); });
  app = new Service('a', db, { listModels: async () => [], requestToolResponse: provider });
  mocks.store.mockReturnValue(db); mocks.service.mockReturnValue(app);
  vi.stubEnv('VOICE_PRODUCT_NAMES_JSON', '{}'); vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'fictional'); vi.stubEnv('WHATSAPP_GRAPH_VERSION', 'v23.0'); vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', '123');
});
afterEach(() => { db.close(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('routes WhatsApp audio through mocked transcription and the same draft service, with no customer sends or ledger changes', async () => {
  const transcript = 'help me draft a message asking Brother Tunde ... his debt is due';
  mocks.recognize.mockResolvedValue(transcript);
  // Mock only the two media-download responses. Any /messages send or ASR attempt fails this test.
  const transport = vi.fn(async (url: string | URL) => {
    if (String(url) === 'https://graph.facebook.com/v23.0/456') return Response.json({ url: 'https://lookaside.fbsbx.com/fictional', mime_type: 'audio/ogg', file_size: 5 });
    if (String(url) === 'https://lookaside.fbsbx.com/fictional') return new Response('dummy');
    throw Error('No sends or live transcription allowed');
  });
  vi.stubGlobal('fetch', transport);
  const before = db.events('a');
  const moneyTables = () => ['ledger_events', 'pending_actions', 'evidence', 'stock_purchases'].map(t => db.sqlite.prepare(`SELECT * FROM ${t}`).all());
  const saved = moneyTables();
  const reply = await dispatch('a', { id: 'wamid.fictional-audio', from: senderId, type: 'audio', audio: { id: '456' } });
  expect(reply.replyText).toContain(`Transcript: “${transcript}”`);
  expect(reply.replyText).toContain('Copy this and send it to Brother Tunde:');
  expect(reply.replyText).toContain('₦12,000'); expect(reply.replyText).not.toMatch(/wa\.me|due today/);
  expect(reply.pending).toBeUndefined(); expect(provider).not.toHaveBeenCalled();
  expect(mocks.recognize).toHaveBeenCalledWith('/fictional-private-clip/input', ['Brother Tunde']);
  expect(transport).toHaveBeenCalledTimes(2); expect(moneyTables()).toEqual(saved);
  expect(db.events('a')).toEqual(before); expect(db.events('b')).toEqual([]);
  // Text follows the same dispatch path without transcription and produces the same draft body.
  const typed = await dispatch('a', { id: 'wamid.fictional-text', from: senderId, type: 'text', text: { body: transcript } });
  expect(reply.replyText).toBe(`Transcript: “${transcript}”\n\n${typed.replyText}`);
  expect(mocks.recognize).toHaveBeenCalledTimes(1);
});
it('uses recent explicit text context for a voice pronoun, and clarifies when there is none', async () => {
  mocks.recognize.mockResolvedValue('draft message asking him to pay back');
  const { voiceMessage } = await import('./runtime');
  const input = { channel: 'whatsapp' as const, senderId, audioPath: '/fictional-private-clip/input' };
  expect((await voiceMessage('a', input)).replyText).toContain('Which saved customer');
  await dispatch('a', { id: 'wamid.fictional-history', from: senderId, type: 'text', text: { body: 'Show Brother Tunde book' } });
  expect((await voiceMessage('a', input)).replyText).toContain('Copy this and send it to Brother Tunde:');
  expect(provider).not.toHaveBeenCalled();
});
