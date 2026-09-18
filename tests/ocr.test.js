import test from 'node:test';import assert from 'node:assert/strict';
import {assessOcr,OCR_LANGUAGES,waitForOcr,captureOcrWorker} from '../src/lib/ocr-quality.js';import {chunkPages} from '../src/lib/rag.js';
test('OCR quality rejects empty, noisy and low-scoring output without indexing it',()=>{
 for(const data of [{text:'',confidence:99},{text:'x 1',confidence:99},{text:'Like charges repel.',confidence:20},{text:'Like charges repel.'}]){const result=assessOcr(data);assert.equal(result.accepted,false);assert.equal(result.text,'');}
 const exact='Like charges repel. Unlike charges attract.';assert.equal(assessOcr({text:exact,confidence:94}).text,exact);
});
test('printed-language OCR retains original scripts, text and page provenance',()=>{
 assert.deepEqual(OCR_LANGUAGES,{English:'eng',Tamil:'tam',Hindi:'hin'});for(const text of ['மின்சுமை என்பது பொருளின் ஒரு பண்பு.','विद्युत आवेश पदार्थ का एक गुण है।'])assert.equal(assessOcr({text,confidence:80}).text,text);
 const chunks=chunkPages([{page:1,text:'Like charges repel.',origin:'ocr',ocrConfidence:95},{page:2,text:''},{page:3,text:'Electric field is force per charge.',origin:'pdf-text'}]);assert.deepEqual(chunks.map(c=>c.page),[1,3]);assert.equal(chunks[0].origin,'ocr');assert.equal(chunks[0].ocrConfidence,95);assert.equal(chunks[1].origin,'pdf-text');
});
test('OCR waiting rejects cancellation and timeout and passes results and errors',async()=>{
 const controller=new AbortController();const result=waitForOcr(new Promise(()=>{}),{signal:controller.signal});controller.abort();await assert.rejects(result,{name:'AbortError'});
 await assert.rejects(waitForOcr(new Promise(()=>{}),{timeoutMs:10}),/timed out/);assert.equal(await waitForOcr(Promise.resolve('ready')),'ready');await assert.rejects(waitForOcr(Promise.reject(new Error('Download failed'))),/Download failed/);
});

test('OCR startup captures the native worker and restores the constructor even on failure',()=>{
 const previous=globalThis.Worker;class FakeWorker{terminate(){this.closed=true;}};globalThis.Worker=FakeWorker;let captured;
 try{const worker=captureOcrWorker(()=>new globalThis.Worker('ocr'),w=>{captured=w;});assert.equal(worker,captured);assert.equal(globalThis.Worker,FakeWorker);captured.terminate();assert.equal(captured.closed,true);assert.throws(()=>captureOcrWorker(()=>{throw new Error('startup');},()=>{}),/startup/);assert.equal(globalThis.Worker,FakeWorker);}finally{globalThis.Worker=previous;}
});

import {ocrImageDimensions} from '../src/lib/ocr-quality.js';
test('OCR rejects symbol noise, wrong scripts, unreadable English runs and low word scores',()=>{
 const cases=[{text:'xqz brrr zxcv plkq',confidence:90},{text:'Hello ### $$$ @@@ planet',confidence:90},{text:'Hello world replacement � characters',confidence:90},{text:'Like charges repel. Unlike charges attract.',confidence:60}];
 const words=['Like','charges','repel','Unlike','charges'].map(text=>({text,confidence:20}));
 cases.push({text:'Like charges repel. Unlike charges attract.',confidence:90,blocks:[{paragraphs:[{lines:[{words}]}]}]});
 for(const data of cases)assert.equal(assessOcr(data,{language:'English'}).accepted,false);
 assert.equal(assessOcr({text:'மின்சுமை என்பது பொருளின் ஒரு பண்பு.',confidence:90},{language:'English'}).accepted,false);
 assert.equal(assessOcr({text:'மின்சுமை என்பது பொருளின் ஒரு பண்பு.',confidence:90},{language:'Tamil'}).accepted,true);
 assert.equal(assessOcr({text:'विद्युत आवेश पदार्थ का एक गुण है।',confidence:90},{language:'Hindi'}).accepted,true);
});
test('image preparation enlarges small text without exceeding dimension and pixel budgets',()=>{assert.deepEqual(ocrImageDimensions(600,200),{width:1200,height:400});assert.deepEqual(ocrImageDimensions(1200,500),{width:1200,height:500});const photo=ocrImageDimensions(4000,6000);assert.equal(photo.height,3600);assert.ok(photo.width*photo.height<=10000000);const square=ocrImageDimensions(6000,6000);assert.ok(square.width*square.height<=10000000);});
