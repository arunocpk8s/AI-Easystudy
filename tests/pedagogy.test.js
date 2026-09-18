import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceAnswer,structuredPreview,cleanSentences} from '../src/lib/pedagogy.js';
import {demoMaterials} from '../src/lib/demo-materials.js';
import {samplePages} from '../src/lib/sample.js';
import {chunkPages} from '../src/lib/rag.js';
test('source answers choose pertinent sentences and refuse unrelated questions',()=>{
 const chunks=[{id:'S1',title:'Charge',page:1,text:'Charge. Like charges repel. Unlike charges attract. The total charge remains conserved.'}];
 assert.match(sourceAnswer(chunks,'total charge conserved')[0].body,/conserved/);
 assert.equal(sourceAnswer(chunks,'photosynthesis')[0].title,'Not enough evidence');
 assert.deepEqual(sourceAnswer(chunks,'total charge conserved')[0].sources,['S1']);
});
test('source preview groups pages without discarding their provenance',()=>{
 const chunks=[{id:'S1',title:'Field',page:1,text:'Field. Electric field is force per charge.'},{id:'S2',title:'Field',page:2,text:'Field. E = F/q.'}];
 const [item]=structuredPreview(chunks,'notes');assert.deepEqual(item.sources,['S1','S2']);assert.equal(item.keyPoints.length,2);assert.match(item.formula.text,/F\/q/);
});
test('manually authored Tamil demo contains substantive lessons and valid citations',()=>{
 const chunks=chunkPages(samplePages);const items=demoMaterials(chunks,'notes','Tamil');assert.equal(items.length,4);assert.match(items[0].definition.text,/[\u0B80-\u0BFF]/);const ids=new Set(chunks.map(c=>c.id));
 for(const item of items){assert.ok(item.keyPoints.length>=3);assert.ok(item.subtopics.length>=2);assert.ok(item.sources.every(id=>ids.has(id)));}
});

test('OCR source aids retain first-sentence page titles and short essential facts',()=>{
 const text='Electric charge is conserved. Like charges repel. Unlike charges attract.';const chunk={id:'S1',page:1,title:text,text,origin:'ocr'};
 assert.deepEqual(cleanSentences(chunk),['Electric charge is conserved.','Like charges repel.','Unlike charges attract.']);assert.equal(structuredPreview([chunk],'notes')[0].keyPoints.length,3);
 const definition='Electric field is force per unit positive test charge.';assert.deepEqual(cleanSentences({id:'S2',title:definition,text:definition,page:3}),[definition]);
});
