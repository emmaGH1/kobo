import { describe, it, expect, vi, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { withAudio, transcribe, handleVoiceMessage } from './index';
afterEach(() => vi.unstubAllEnvs());
describe('voice', () => {
  it.each(['wav', 'ogg', 'webm'])('converts synthetic %s and reuses the harness multipart contract with bias', async format => {
    vi.stubEnv('VOICE_API_KEY', 'synthetic-voice-key');
    vi.stubEnv('MODEL_API_KEY', 'synthetic-gateway-key');
    vi.stubEnv('MODEL_BASE_URL', 'https://ai-gateway.vercel.sh/v1');
    const bytes = execFileSync('ffmpeg', ['-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.1','-f',format,'pipe:1']);
    let path = '';
    const transport = vi.fn(async (url, init) => {
      expect(new URL(String(url)).origin).toBe('https://api.meta.ai');
      expect(init!.headers).toMatchObject({ Authorization: 'Bearer synthetic-voice-key' });
      const form = init!.body as FormData;
      const settings = JSON.parse(await (form.get('request') as Blob).text());
      expect(settings).toMatchObject({ model: 'muse-voice-transcribe-1.0', keywords: ['Ada Example','Rice'] });
      const wav = Buffer.from(await (form.get('audio') as Blob).arrayBuffer());
      expect(wav.subarray(0,4).toString()).toBe('RIFF');
      return Response.json({ transcript: 'synthetic transcript' });
    }) as typeof fetch;
    await withAudio(bytes, async p => { path = p; expect(await transcribe(p, ['Ada Example','Rice'], transport)).toBe('synthetic transcript'); expect((await readFile(p)).length).toBeGreaterThan(0); });
    await expect(access(path)).rejects.toThrow(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['https://ai-gateway.vercel.sh/v1', 'https://api.meta.ai.evil.example/v1', 'http://api.meta.ai/v1', 'https://user:pass@api.meta.ai/v1', 'invalid-url'])('never forwards a text key from %s to direct Meta ASR', async base => {
    vi.stubEnv('VOICE_API_KEY', '');
    vi.stubEnv('MODEL_API_KEY', 'synthetic-text-key');
    vi.stubEnv('MODEL_BASE_URL', base);
    const transport = vi.fn();
    const app = { handleMessage: vi.fn() };
    let path = '';
    await expect(withAudio(new Uint8Array([1]), async p => {
      path = p;
      return handleVoiceMessage(app, { channel: 'whatsapp', senderId: 'synthetic', audioPath: p }, [], (audio, hints) => transcribe(audio, hints, transport));
    })).rejects.toThrow('Voice is not configured. Set VOICE_API_KEY');
    expect(transport).not.toHaveBeenCalled();
    expect(app.handleMessage).not.toHaveBeenCalled();
    await expect(access(path)).rejects.toThrow();
  });
  it.each(['', 'https://api.meta.ai/v1'])('preserves text-key fallback only for the direct Meta base (%s)', async base => {
    vi.stubEnv('VOICE_API_KEY', '');
    vi.stubEnv('MODEL_API_KEY', 'synthetic-direct-key');
    vi.stubEnv('MODEL_BASE_URL', base);
    const bytes = execFileSync('ffmpeg', ['-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.1','-f','wav','pipe:1']);
    const transport = vi.fn(async (_url, init) => {
      expect(init!.headers).toMatchObject({ Authorization: 'Bearer synthetic-direct-key' });
      return Response.json({ transcript: 'synthetic transcript' });
    }) as typeof fetch;
    await expect(withAudio(bytes, p => transcribe(p, [], transport))).resolves.toBe('synthetic transcript');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('never interprets a transcribed choice as confirmation', async () => {
    const app = { handleMessage: vi.fn() };
    const reply = await handleVoiceMessage(app, { channel: 'web', senderId: 's', audioPath: 'trusted' }, [], async () => '1 save');
    expect(reply.replyText).toContain('Voice alone cannot confirm');
    expect(app.handleMessage).not.toHaveBeenCalled();
  });
  it('rejects arbitrary paths and deletes failed uploads', async () => {
    await expect(transcribe('/etc/passwd', [])).rejects.toThrow('Untrusted');
    await expect(withAudio(new Uint8Array(), async () => {})).rejects.toThrow();
    let path = '';
    await expect(withAudio(new Uint8Array([1]), async p => { path = p; throw Error('failed'); })).rejects.toThrow();
    await expect(access(path)).rejects.toThrow();
  });
  it('passes only transcript to core and displays it in review; ASR failure never calls core', async () => {
    const app = { handleMessage: vi.fn(async () => ({ replyText: 'review', pending: { id: 'id', summary: 'summary', flags: [] } })) };
    const input = { channel: 'web' as const, senderId: 'session', audioPath: 'trusted' };
    const reply = await handleVoiceMessage(app, input, ['Rice'], async () => 'Ada bought rice');
    expect(app.handleMessage).toHaveBeenCalledWith({ channel: 'web', senderId: 'session', text: 'Ada bought rice' });
    expect(reply.pending?.summary).toContain('Ada bought rice');
    app.handleMessage.mockClear();
    await expect(handleVoiceMessage(app, input, [], async () => { throw Error('failed'); })).rejects.toThrow();
    expect(app.handleMessage).not.toHaveBeenCalled();
  });
});
