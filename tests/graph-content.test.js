import test from 'node:test';import assert from 'node:assert/strict';
import {sourceGraphMaterials,compactGraphItems} from '../src/lib/graph-content.js';
import {validateOutput} from '../api/study.js';
test('graph extraction considers all chunks, removes repeated facts and preserves exact conditions and citations',()=>{
 const chunks=[{id:'S1',page:1,title:'Electric field',text:'Electric field. Electric field is force per unit charge. Like charges repel. Activity: collect supplies and discuss your observations.'},{id:'S2',page:2,title:'Electric field',text:'Electric field. Electric field is force per unit charge. A zero electric potential does not necessarily imply a zero electric field. E = F/q.'}];
 const [item]=sourceGraphMaterials(chunks,'mindmap');assert.ok(item.keyPoints.length<=3);assert.ok(item.sources.includes('S2'));assert.ok(item.keyPoints.every(p=>!p.text.includes('Activity')));assert.equal(item.subtopics.length,item.keyPoints.length);assert.ok(item.subtopics.every(s=>s.title.length<=45));
 const exact='A zero electric potential does not necessarily imply a zero electric field.';const [negative]=sourceGraphMaterials([{id:'S3',title:'Potential',page:3,text:exact}],'mindmap');assert.equal(negative.keyPoints[0].text,exact);assert.deepEqual(negative.keyPoints[0].sources,['S3']);
});
test('repeated graph topics are compacted without concatenating entire passages',()=>{
 const items=[{title:'Charge',body:'First paragraph',sources:['S1'],keyPoints:[{text:'Like charges repel.',sources:['S1']}]},{title:'Charge',body:'Unrelated full page',sources:['S2'],keyPoints:[{text:'Like charges repel.',sources:['S2']},{text:'Unlike charges attract.',sources:['S2']}]}];const [item]=compactGraphItems(items);assert.equal(item.body,'Like charges repel.');assert.equal(item.keyPoints.length,2);assert.deepEqual(item.keyPoints[0].sources,['S1','S2']);assert.ok(!item.body.includes('Unrelated'));
});
test('cloud graph contracts reject paragraph dumps and require concise roadmap skills',()=>{
 const evidence=[{id:'S1',page:1,title:'Charge',text:'Like charges repel.'}];const point={text:'Like charges repel.',sources:['S1']};const item={title:'Charge',body:'Like charges repel.',sources:['S1'],keyPoints:[point],subtopics:[{title:'Interactions',points:[point],sources:['S1']}]};assert.equal(validateOutput({items:[item]},evidence,'mindmap').items.length,1);assert.throws(()=>validateOutput({items:[{...item,body:'x'.repeat(241)}]},evidence,'mindmap'));assert.throws(()=>validateOutput({items:[{...item,subtopics:[{...item.subtopics[0],title:'x'.repeat(46)}]}]},evidence,'mindmap'));
 const roadmap={...item,learningGoal:'Explain charge interactions.',checkpoint:{text:'How do like charges interact?',sources:['S1']}};assert.equal(validateOutput({items:[roadmap]},evidence,'roadmap').items.length,1);assert.throws(()=>validateOutput({items:[{...roadmap,keyPoints:undefined}]},evidence,'roadmap'));
});

test('a short paragraph used as a page title is never discarded as a heading',()=>{
 const text='Electric charge is conserved. Like charges repel. Unlike charges attract.';
 const items=sourceGraphMaterials([{id:'S1',page:1,title:text,text}],'mindmap');assert.equal(items.length,1);assert.ok(items[0].keyPoints.some(p=>p.text==='Like charges repel.'));
});
