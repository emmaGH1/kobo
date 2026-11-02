import type { NextRequest } from 'next/server';
import { demoHandler } from '@/server/demo';

// Node.js is the Next.js default; cacheComponents disallows a per-route runtime override.
async function handle(req: NextRequest, context: {params:Promise<{operation:string}>}) {
  return demoHandler(req,(await context.params).operation);
}
export const POST = handle;
export const GET = handle;
