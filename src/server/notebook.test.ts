import {afterEach,expect,it,vi} from 'vitest';
import {LedgerStore} from './ledger-store';
import {Service} from './service';
import {notebookImage,decodeNotebookBody} from './notebook';
import {ResponsesModelProvider,type ModelProvider} from './model-provider';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=','base64');
const stores:LedgerStore[]=[];afterEach(()=>{stores.forEach(s=>s.sqlite.close());stores.length=0;});
const row=(name:string,amount:string|null,uncertain=false)=>({line_text:`${name} ${amount??''}`,customer_name:name,amount_text:amount,uncertain_name:false,uncertain_amount:uncertain});
function book(rows:unknown[]) {
 const store=new LedgerStore(':memory:');stores.push(store);store.sqlite.exec("INSERT INTO owners VALUES('a','Demo','x',1),('b','Other','x',1)");
 const requestToolResponse=vi.fn<ModelProvider['requestToolResponse']>(async()=>({status:'completed',output:[{type:'function_call',name:'read_notebook',arguments:JSON.stringify({rows})}]}));
 const service=new Service('a',store,{listModels:async()=>[],requestToolResponse});
 const ctx={channel:'web' as const,senderId:'s'};
 return{store,requestToolResponse,service,ctx,upload:{...ctx,bytes:png,mime:'image/png'}};
}
it('validates image format/size/dimensions and strips PNG metadata without persisting bytes',()=>{
 expect(notebookImage(png,'image/png').image.base64).toBe(png.toString('base64'));
 expect(()=>notebookImage(png,'image/jpeg')).toThrow();expect(()=>notebookImage(Buffer.alloc(3*1024*1024),'image/png')).toThrow();
 const huge=Buffer.from(png);huge.writeUInt32BE(9000,16);expect(()=>notebookImage(huge,'image/png')).toThrow('dimensions');
 expect(()=>decodeNotebookBody({mimeType:'image/png',imageBase64:'https://evil.test'})).toThrow();
 expect(()=>decodeNotebookBody({mimeType:'image/png',imageBase64:png.toString('base64'),path:'/private/file'})).toThrow();
 const metadata=Buffer.concat([Buffer.from([0,0,0,6]),Buffer.from('tEXtsecret'),Buffer.alloc(4)]);
 const tagged=Buffer.concat([png.subarray(0,33),metadata,png.subarray(33)]);
 expect(notebookImage(tagged,'image/png').image.base64).toBe(png.toString('base64'));
});
it('imports opening debts only through an explicit owner-bound review; repeated image and confirm cannot duplicate',async()=>{
 const {store,requestToolResponse,service,ctx,upload}=book([row('Ada','12,000'),row('Tunde','3,800')]);
 const review=await service.handleNotebook(upload);expect(review.pending?.flags).toEqual([]);expect(review.replyText).toContain('Check every name and amount');expect(store.events('a')).toHaveLength(0);expect(store.customers('a')).toHaveLength(0);
 expect((await service.handleNotebook(upload)).pending?.id).toBe(review.pending?.id);expect(requestToolResponse).toHaveBeenCalledTimes(1);
 expect(requestToolResponse.mock.calls[0][0]).toMatchObject({image:{mime:'image/png',base64:png.toString('base64')}});
 await expect(new Service('b',store,{listModels:async()=>[],requestToolResponse}).confirm({...ctx,pendingId:review.pending!.id})).rejects.toThrow();
 await service.confirm({...ctx,pendingId:review.pending!.id});await service.confirm({...ctx,pendingId:review.pending!.id});await service.handleNotebook(upload);
 expect(store.events('a').map(e=>[e.kind,e.amountKobo])).toEqual([['opening_debt',1200000],['opening_debt',380000]]);expect(store.events('b')).toHaveLength(0);expect(requestToolResponse).toHaveBeenCalledTimes(1);
 const raw=(store.sqlite.prepare('SELECT raw_input FROM pending_actions LIMIT 1').get() as {raw_input:string}).raw_input;expect(raw).not.toContain(png.toString('base64'));
});
it('never accepts uncertain OCR digits as money; an answer replaces the draft and needs fresh explicit save',async()=>{
 const {store,service,ctx,upload}=book([row('Ada','3,800',true),row('Tunde',null)]);
 const ask=await service.handleNotebook(upload);expect(ask.pending?.flags.length).toBeGreaterThan(0);
 await expect(service.confirm({...ctx,pendingId:ask.pending!.id})).rejects.toThrow('flags');
 const next=await service.resolveClarification({...ctx,pendingId:ask.pending!.id,answer:'3800'});expect(next.pending!.id).not.toBe(ask.pending!.id);expect(next.pending?.flags.length).toBeGreaterThan(0);
 const ready=await service.resolveClarification({...ctx,pendingId:next.pending!.id,answer:'5000'});expect(ready.pending?.flags).toEqual([]);expect(store.events('a')).toHaveLength(0);
 await expect(service.confirm({...ctx,pendingId:ask.pending!.id})).rejects.toThrow();await service.confirm({...ctx,pendingId:ready.pending!.id});expect(store.events('a')).toHaveLength(2);
});
it('blocks unclear names and repeated rows; malformed extraction/provider failure cannot create a proposal',async()=>{
 const a=book([{...row('Ada','100'),uncertain_name:true},row('Ada','200')]);const reply=await a.service.handleNotebook(a.upload);expect(reply.pending?.flags.join(' ')).toContain('name unclear');expect(reply.pending?.flags.join(' ')).toContain('Repeated customer');
 const b=book([{...row('Tunde','100'),line_text:'unrelated words'}]);expect((await b.service.handleNotebook(b.upload)).pending).toBeUndefined();expect(b.store.events('a')).toHaveLength(0);
 const c=book([]);c.requestToolResponse.mockRejectedValueOnce(new Error('offline'));expect((await c.service.handleNotebook(c.upload)).replyText).toContain('Nothing was saved');expect(c.store.sqlite.prepare('SELECT COUNT(*) AS n FROM pending_actions').get()).toEqual({n:0});
});
it('sends a Responses input_image data URL using the configured model, without retry or remote image URLs (mock transport only)',async()=>{
 const transport=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({status:'completed',output:[]})));
 const provider=new ResponsesModelProvider({baseUrl:'https://example.test/v1',modelId:'configured-muse',apiKey:'fictional-key'},transport);
 await provider.requestToolResponse({input:'Read synthetic notebook',image:{mime:'image/png',base64:png.toString('base64')},tools:[{type:'function',name:'read_notebook',description:'Read notebook',parameters:{type:'object'}}]});
 const body=JSON.parse(transport.mock.calls[0][1]!.body as string);expect(body.model).toBe('configured-muse');expect(body.input[0].content[1]).toEqual({type:'input_image',image_url:`data:image/png;base64,${png.toString('base64')}`});expect(transport).toHaveBeenCalledTimes(1);
});
