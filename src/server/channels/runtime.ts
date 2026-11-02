import { store, service } from '../web';
import { handleVoiceMessage } from '../voice';
import type { MessageInput } from '../../core/contract';
/** Product catalogue does not exist in core yet. Configure explicit owner-scoped names, never another tenant's data. */
export function ownerKeywords(ownerId: string): string[] {
  const customers = store().customers(ownerId).map(c => c.name);
  const configured: unknown = JSON.parse(process.env.VOICE_PRODUCT_NAMES_JSON || '{}');
  const products = configured && typeof configured === 'object' ? (configured as Record<string, unknown>)[ownerId] : undefined;
  return [...customers, ...(Array.isArray(products) ? products.filter((p): p is string => typeof p === 'string') : [])];
}
export function voiceMessage(ownerId: string, input: MessageInput) {
  return handleVoiceMessage(service(ownerId), input, ownerKeywords(ownerId));
}
export async function boundedBytes(req: Request, maximum: number): Promise<Uint8Array> {
  if (!req.body) throw Error('Missing body');
  const reader = req.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw Error('Body too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
/** Persistent caps, before multipart parsing/conversion/provider cost. */
export function takeVoiceLimit(ownerId: string): boolean {
  const db = store().sqlite;
  return db.transaction(() => {
    const now = Date.now(); const names = ['voice:global', `voice:${ownerId}`];
    for (const name of names) {
      const row = db.prepare('SELECT window_start AS start,count FROM request_limits WHERE name=?').get(name) as { start: number; count: number } | undefined;
      if (row && now - row.start < 60000 && row.count >= (name === 'voice:global' ? 10 : 3)) return false;
    }
    for (const name of names) db.prepare('INSERT INTO request_limits VALUES(?,?,1) ON CONFLICT(name) DO UPDATE SET count=CASE WHEN ?-window_start>=60000 THEN 1 ELSE count+1 END,window_start=CASE WHEN ?-window_start>=60000 THEN ? ELSE window_start END').run(name, now, now, now, now);
    return true;
  }).immediate();
}
