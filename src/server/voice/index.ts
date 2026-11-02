import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, chmod, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { BookkeepingService, MessageInput, MessageReply } from '../../core/contract';
const exec = promisify(execFile);
export const MAX_AUDIO_BYTES = 15_000_000;
const root = () => resolve(process.env.KOBO_AUDIO_DIR || 'private/audio');
/** Callback scope is the retention policy: always erase source + converted audio, even on failure. */
export async function withAudio<T>(bytes: Uint8Array, use: (path: string) => Promise<T>): Promise<T> {
  if (!bytes.length || bytes.length > MAX_AUDIO_BYTES) throw new Error('Invalid audio size');
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const dir = await mkdtemp(join(root(), 'clip-'));
  const path = join(dir, 'input');
  try { await writeFile(path, bytes, { mode: 0o600 }); return await use(path); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
export async function transcribe(path: string, keywords: string[], transport: typeof fetch = fetch): Promise<string> {
  // Only paths minted by withAudio, never a browser-supplied path or URL.
  if (dirname(dirname(resolve(path))) !== root() || !/^clip-[\w-]+$/.test(dirname(path).split('/').pop()!) || !['input'].includes(path.split('/').pop()!)) throw new Error('Untrusted audio reference');
  const key = process.env.VOICE_API_KEY || process.env.MODEL_API_KEY;
  if (!key) throw new Error('Voice is not configured');
  const wav = join(dirname(path), 'converted.wav');
  try {
    await exec('ffmpeg', ['-nostdin','-hide_banner','-loglevel','error','-y','-i',path,'-map','0:a:0','-vn','-t','601','-ac','1','-ar','24000','-c:a','pcm_s16le','-map_metadata','-1',wav], { timeout: 45000, maxBuffer: 65536 });
    await chmod(wav, 0o600);
    const probe = await exec('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',wav], { timeout: 10000, maxBuffer: 65536 });
    const info = JSON.parse(probe.stdout); const s = info.streams[0]; const duration = Number(info.format.duration);
    if (s.codec_name !== 'pcm_s16le' || s.channels !== 1 || Number(s.sample_rate) !== 24000 || Number(s.bits_per_sample) !== 16 || !Number.isFinite(duration) || duration <= 0 || duration > 600 || (await stat(wav)).size > 31_000_000) throw new Error('Unsupported audio');
    const form = new FormData();
    const hints = [...new Set(keywords.map(s => s.trim()).filter(Boolean))].slice(0, 100).map(s => s.slice(0, 100));
    form.append('request', new Blob([JSON.stringify({ model: 'muse-voice-transcribe-1.0', audioEncoding: 'WAV', mode: 'PUSH_TO_TALK', ...(hints.length ? { languageBias: ['English'], keywords: hints } : {}) })], { type: 'application/json' }), '');
    form.append('audio', new Blob([new Uint8Array(await readFile(wav))], { type: 'audio/wav' }), 'audio.wav');
    const response = await transport(`https://api.meta.ai/v1/asr/transcribe?sessionId=${randomUUID()}`, { method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, body: form, signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error('Transcription unavailable');
    const body = await response.json();
    if (body.error || body.type === 'error' || typeof body.transcript !== 'string' || !body.transcript.trim() || body.transcript.length > 4000) throw new Error('Invalid transcription');
    return body.transcript.trim();
  } catch { throw new Error('Audio could not be transcribed. Nothing was saved. Please send text or a shorter recording.'); }
  finally { await rm(wav, { force: true }); }
}
/** Adapter-level handleMessage; core currently accepts text only. No audio is retained as evidence. */
export async function handleVoiceMessage(app: Pick<BookkeepingService, 'handleMessage'>, input: MessageInput, keywords: string[], recognize = transcribe): Promise<MessageReply & { transcript?: string }> {
  if (!input.audioPath) return app.handleMessage(input);
  const transcript = await recognize(input.audioPath, keywords);
  // Do not concatenate a caption: it could silently change what was heard.
  const reply = await app.handleMessage({ channel: input.channel, senderId: input.senderId, text: transcript });
  const quote = `Transcript: “${transcript}”`;
  return { ...reply, transcript, replyText: `${quote}\n\n${reply.replyText}`, pending: reply.pending ? { ...reply.pending, summary: `${quote}\n\n${reply.pending.summary}` } : undefined, interactive: reply.interactive ? { ...reply.interactive, body: `${quote}\n\n${reply.interactive.body}`.slice(0,1024) } : undefined };
}
