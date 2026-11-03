import { timingSafeEqual, createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { Reminders } from '@/server/reminders';
import { store } from '@/server/web';

/** Invoke once/minute from a trusted scheduler. Queues jobs only; no WhatsApp transport here. */
export async function POST(req: NextRequest) {
  const configured=process.env.KOBO_REMINDER_CRON_TOKEN;
  if(!configured || configured.length<32)return Response.json({error:'Scheduler not configured'},{status:503});
  const hash=(s:string)=>createHash('sha256').update(s).digest();
  if(!timingSafeEqual(hash(req.headers.get('authorization')??''),hash(`Bearer ${configured}`)))return Response.json({error:'Unauthorized'},{status:401});
  const queued=new Reminders(store()).tick();
  return Response.json({queued,whatsappSent:0,delivery:'outbox_only',requires:'Approved utility template and channel adapter'},{headers:{'Cache-Control':'no-store'}});
}
