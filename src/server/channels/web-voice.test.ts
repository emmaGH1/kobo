import { it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('../web', () => ({ sameOrigin: vi.fn(() => true), session: vi.fn(() => ({ ownerId: 'o', senderId: 's' })) }));
vi.mock('./runtime', () => ({ takeVoiceLimit: vi.fn(() => true), voiceMessage: vi.fn(async () => ({ replyText: 'review', transcript: 'synthetic' })), boundedBytes: async (req: Request) => new Uint8Array(await req.arrayBuffer()) }));
vi.mock('../voice', () => ({ MAX_AUDIO_BYTES: 15000000, withAudio: vi.fn(async (_bytes, use) => use('trusted')) }));
import { webVoice } from './web-voice';
import { sameOrigin, session } from '../web';
import { voiceMessage, takeVoiceLimit } from './runtime';
beforeEach(() => { vi.clearAllMocks(); vi.mocked(sameOrigin).mockReturnValue(true); vi.mocked(session).mockReturnValue({ ownerId: 'o', senderId: 's' }); vi.mocked(takeVoiceLimit).mockReturnValue(true); });
function req(extra = false) { const form = new FormData(); form.set('audio', new File(['synthetic'], 'record.webm', { type: 'audio/webm' })); if (extra) form.set('audioPath','/etc/passwd'); return new NextRequest('http://localhost/api/whatsapp/voice', { method: 'POST', body: form }); }
it('accepts browser recording/upload and returns transcript for same session', async () => { const res = await webVoice(req()); expect(res.status).toBe(200); expect((await res.json()).transcript).toBe('synthetic'); expect(voiceMessage).toHaveBeenCalledWith('o', { channel: 'web', senderId: 's', audioPath: 'trusted' }); });
it('rejects origin, unauthenticated, rate limited and arbitrary paths before core', async () => { vi.mocked(sameOrigin).mockReturnValue(false); expect((await webVoice(req())).status).toBe(403); vi.mocked(sameOrigin).mockReturnValue(true); vi.mocked(session).mockReturnValue(undefined); expect((await webVoice(req())).status).toBe(401); vi.mocked(session).mockReturnValue({ ownerId: 'o', senderId: 's' }); vi.mocked(takeVoiceLimit).mockReturnValue(false); expect((await webVoice(req())).status).toBe(429); vi.mocked(takeVoiceLimit).mockReturnValue(true); expect((await webVoice(req(true))).status).toBe(400); expect(voiceMessage).not.toHaveBeenCalled(); });
