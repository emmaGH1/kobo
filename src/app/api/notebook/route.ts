import type { NextRequest } from 'next/server';
import { sameOrigin, service, session } from '@/server/web';
import { decodeNotebookBody } from '@/server/notebook';

/** Private authenticated upload; JSON inline bytes only, never a client URL/filesystem path. */
export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});
  const s=session(req);if(!s)return Response.json({error:'Authentication required'},{status:401});
  const reader=req.body?.getReader();if(!reader)return Response.json({error:'Image required'},{status:400});
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>2800000){await reader.cancel();return Response.json({error:'Image too large'},{status:413});}chunks.push(part.value);}
  try{
    const upload=decodeNotebookBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    const reply=await service(s.ownerId).handleNotebook({channel:'web',senderId:s.senderId,...upload});
    return Response.json(reply,{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Photo could not be processed. Nothing was saved.'},{status:400});}
}
