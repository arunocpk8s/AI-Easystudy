import test from 'node:test';import assert from 'node:assert/strict';
import {hasVisibleInk,classifyPage} from '../src/lib/page-quality.js';
import {chunkPages} from '../src/lib/rag.js';
test('empty white pages are blank; visible and unchecked pages are not called blank',()=>{
 assert.equal(hasVisibleInk(new Uint8ClampedArray([255,255,255,255,255,255,255,0])),false);
 assert.equal(hasVisibleInk(new Uint8ClampedArray([0,0,0,255])),true);
 assert.equal(classifyPage('',false).status,'blank');assert.equal(classifyPage('',true).status,'visual');assert.equal(classifyPage('',null).status,'unknown');assert.equal(classifyPage('Units',false).status,'text');
 const chunks=chunkPages([{page:1,text:'An introduction.'},{page:2,text:''},{page:3,text:'Units'}]);assert.deepEqual(chunks.map(c=>c.page),[1,3]);
});
