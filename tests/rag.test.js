import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkPages,retrieve,sectionEvidence} from '../src/lib/rag.js';
import {samplePages} from '../src/lib/sample.js';
import {extractiveMaterials,FEATURES} from '../src/lib/materials.js';
test('chunking preserves page provenance and covers the last words',()=>{
  const chunks=chunkPages([{page:7,text:Array.from({length:410},(_,i)=>`word${i}`).join(' ')}]);
  assert.ok(chunks.every(c=>c.page===7));assert.ok(chunks.at(-1).text.endsWith('word409'));
  assert.equal(new Set(chunks.map(c=>c.id)).size,chunks.length);
  assert.throws(()=>chunkPages([],10,10));
});
test('retrieval finds expected evidence and rejects unsupported vocabulary',()=>{
  const chunks=chunkPages(samplePages);
  assert.equal(retrieve(chunks,'Coulomb separation force',1)[0].page,2);
  assert.equal(retrieve(chunks,'potential scalar volt',1)[0].page,4);
  assert.deepEqual(retrieve(chunks,'photosynthesis chlorophyll'),[]);
});
test('whole-document batching covers every chunk exactly once',()=>{
  const chunks=Array.from({length:30},(_,i)=>({id:`S${i+1}`,text:'a'.repeat(1400),page:i+1}));
  const batches=sectionEvidence(chunks);assert.ok(batches.length>1);
  assert.deepEqual(batches.flat().map(c=>c.id),chunks.map(c=>c.id));
  assert.ok(batches.every(b=>b.reduce((s,c)=>s+c.text.length,0)<=10000));
});
test('hybrid retrieval uses vector and keyword rankings without duplicate passages',()=>{
  const chunks=[{id:'S1',page:1,text:'electric charge',title:'Charge'},{id:'S2',page:2,text:'potential energy',title:'Potential'}];
  const results=retrieve(chunks,'மின்னழுத்தம்',2,[[1,0],[0,1]],[0,1]);
  assert.equal(results[0].id,'S2');assert.equal(new Set(results.map(c=>c.id)).size,results.length);
});
test('all extractive tools preserve valid references; quizzes have four unique options and a matching answer',()=>{
  const chunks=chunkPages(samplePages);const ids=new Set(chunks.map(c=>c.id));
  for(const feature of FEATURES){const items=extractiveMaterials(chunks,feature.id);assert.ok(items.length);assert.ok(items.every(i=>i.sources.every(s=>ids.has(s))));}
  assert.ok(extractiveMaterials(chunks,'quiz').every(i=>i.options.length===4&&new Set(i.options).size===4&&i.options.includes(i.answer)));
});
