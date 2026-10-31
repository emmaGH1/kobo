import { describe, expect, it, vi } from 'vitest';
import { ModelProviderError, ResponsesModelProvider, modelConfig } from './model-provider';

const config = { baseUrl: 'https://provider.example/v1/', modelId: 'fictional-model', apiKey: 'fictional-test-key' };
const tool = { type: 'function' as const, name: 'list_debtors', description: 'Read debtors', parameters: {type:'object',properties:{},additionalProperties:false} };
function fakeFetch(data: unknown, status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}}));
}

describe('Responses provider boundary (mocked transport, not live verification)', () => {
  it('reads all provider settings from environment and strips trailing slash', () => {
    expect(modelConfig({MODEL_BASE_URL:config.baseUrl,MODEL_ID:config.modelId,MODEL_API_KEY:config.apiKey})).toEqual({...config,baseUrl:'https://provider.example/v1'});
  });
  it('fails closed for missing config without leaking credential values', () => {
    for (const environment of [
      {MODEL_BASE_URL:config.baseUrl,MODEL_ID:'',MODEL_API_KEY:config.apiKey},
      {MODEL_BASE_URL:'http://example.com',MODEL_ID:'test',MODEL_API_KEY:config.apiKey},
      {MODEL_BASE_URL:'https://user:secret@example.com',MODEL_ID:'test',MODEL_API_KEY:config.apiKey},
      {},
    ]) {
      expect(() => modelConfig(environment)).toThrow('Invalid model configuration');
      try { modelConfig(environment); } catch (error) { expect(String(error)).not.toContain(config.apiKey); }
    }
  });
  it('reads catalog IDs, preserving an empty catalog as empty', async () => {
    const transport = fakeFetch({data:[{id:'fictional-model'}]});
    expect(await new ResponsesModelProvider(config,transport).listModels()).toEqual(['fictional-model']);
    expect(transport.mock.calls[0][0]).toBe('https://provider.example/v1/models');
    expect(transport.mock.calls[0][1]).toMatchObject({method:'GET',redirect:'error',headers:{Authorization:`Bearer ${config.apiKey}`}});
    expect(await new ResponsesModelProvider(config,fakeFetch({data:[]})).listModels()).toEqual([]);
  });
  it('rejects malformed catalogs rather than reporting missing access', async () => {
    await expect(new ResponsesModelProvider(config,fakeFetch({models:[]})).listModels()).rejects.toThrow('Invalid model catalog');
  });
  it('sends documented flat tools with configured model and no provider response storage', async () => {
    const fixture = {output:[{type:'function_call',name:'list_debtors',arguments:'{}',call_id:'fictional'}]};
    const transport = fakeFetch(fixture);
    const provider = new ResponsesModelProvider(config,transport);
    expect(await provider.requestToolResponse({input:'Fictional test',tools:[tool]})).toEqual(fixture);
    expect(transport.mock.calls[0][0]).toBe('https://provider.example/v1/responses');
    const body = JSON.parse(transport.mock.calls[0][1]!.body as string);
    expect(body).toEqual({model:config.modelId,input:[{role:'user',content:'Fictional test'}],tools:[tool],tool_choice:'auto',max_output_tokens:1024,store:false});
    expect(body.tools[0].function).toBeUndefined();
  });
  it('rejects invalid requests before making any calls', async () => {
    const transport = fakeFetch({});
    const provider = new ResponsesModelProvider(config,transport);
    await expect(provider.requestToolResponse({input:'',tools:[tool]})).rejects.toThrow('Invalid tool response request');
    await expect(provider.requestToolResponse({input:'test',tools:[]})).rejects.toThrow('Invalid tool response request');
    expect(transport).not.toHaveBeenCalled();
  });
  it('preserves exact HTTP/code/detail for operator diagnostics and never retries', async () => {
    const transport = fakeFetch({error:{code:'model_not_found',message:'The requested model was not found.'}},404);
    try {
      await new ResponsesModelProvider(config,transport).requestToolResponse({input:'Fictional test',tools:[tool]});
      throw new Error('Expected provider error');
    } catch (error) {
      expect(error).toBeInstanceOf(ModelProviderError);
      expect(error).toMatchObject({status:404,code:'model_not_found',detail:'The requested model was not found.'});
    }
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('redacts credentials even if an upstream error echoes them', async () => {
    const provider = new ResponsesModelProvider(config,fakeFetch({error:{code:config.apiKey,message:`Rejected ${config.apiKey}`}},401));
    try { await provider.listModels(); } catch (error) {
      const e = error as ModelProviderError;
      expect(e.message+e.code+e.detail).not.toContain(config.apiKey);
      expect(e.detail).toBe('Rejected [REDACTED]');
    }
  });
  it('rejects non-JSON errors without retaining response bodies', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('private upstream body',{status:502}));
    await expect(new ResponsesModelProvider(config,transport).listModels()).rejects.toMatchObject({status:502,code:'invalid_json',detail:undefined});
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
