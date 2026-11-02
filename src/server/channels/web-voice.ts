import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin, session } from '../web';
import { withAudio, MAX_AUDIO_BYTES } from '../voice';
import { boundedBytes, takeVoiceLimit, voiceMessage } from './runtime';
const types = new Set(['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-wav','audio/aac','video/webm','video/mp4']);
export async function webVoice(req: NextRequest) {
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!sameOrigin(req)) return json({ error: 'Invalid origin' }, 403);
  const auth = session(req);
  if (!auth) return json({ error: 'Sign in required' }, 401);
  if (!req.headers.get('content-type')?.startsWith('multipart/form-data;')) return json({ error: 'Use multipart audio' }, 415);
  if (!takeVoiceLimit(auth.ownerId)) return json({ error: 'Try again later' }, 429);
  try {
    const bytes = await boundedBytes(req, MAX_AUDIO_BYTES + 65536);
    const form = await new Request('http://localhost', { method: 'POST', headers: { 'content-type': req.headers.get('content-type')! }, body: new Uint8Array(bytes) }).formData();
    const audio = form.get('audio');
    if (!(audio instanceof File) || !types.has(audio.type.split(';')[0]) || form.has('audioPath') || [...form.keys()].some(k => k !== 'audio')) return json({ error: 'Supply one audio file' }, 400);
    if (form.getAll('audio').length !== 1) return json({ error: 'Supply one audio file' }, 400);
    const reply = await withAudio(new Uint8Array(await audio.arrayBuffer()), audioPath => voiceMessage(auth.ownerId, { channel: 'web', senderId: auth.senderId, audioPath }));
    return json(reply);
  } catch { return json({ error: 'Audio could not be processed. Nothing was saved. Please send text or a shorter recording.' }, 400); }
}
