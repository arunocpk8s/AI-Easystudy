import test from 'node:test';import assert from 'node:assert/strict';
import {translateStudyItems,splitTranslationText,LANGUAGE_CODES,terminologyTranslation,prepareTranslationInput,normalizeTranslationTerms} from '../src/lib/translation-core.js';
test('local translation retains formulas, original quotes, citations and quiz consistency',async()=>{
 const item={title:'Charge',body:'Like charges repel.',sources:['S1'],definition:{text:'Repulsion',sources:['S1']},formula:{text:'E = F/q',sources:['S1']},textbookExcerpt:{text:'Like charges repel.',sources:['S1']},options:['Repel','Attract'],answer:'Repel',subtopics:[{title:'Interaction',points:[{text:'Repulsion',sources:['S1']}],sources:['S1']}]};
 const calls=[];const [translated]=await translateStudyItems([item],async text=>{calls.push(text);return `Tamil: ${text}`;});
 assert.deepEqual(translated.formula,item.formula);assert.deepEqual(translated.textbookExcerpt,item.textbookExcerpt);assert.deepEqual(translated.sources,['S1']);assert.equal(translated.answer,translated.options[0]);assert.equal(translated.subtopics[0].points[0].text,'Tamil: Repulsion');assert.equal(item.title,'Charge');assert.ok(!calls.includes('S1'));
});
test('translation segments preserve long content and reject unsafe unbroken tokens',()=>{
 const text=Array.from({length:120},(_,i)=>`Sentence ${i}.`).join(' ');const parts=splitTranslationText(text);assert.ok(parts.every(p=>p.length<=320));assert.equal(parts.join(' '),text);assert.throws(()=>splitTranslationText('x'.repeat(321)));assert.equal(LANGUAGE_CODES.Tamil,'tam_Taml');
});

test('physics terminology is scoped and ambiguous electrical charge receives context',()=>{
 assert.equal(terminologyTranslation('Electric charge','English','Tamil','Physics'),'மின்சுமை');
 assert.equal(terminologyTranslation('charge','English','Tamil','Economics'),null);
 assert.equal(prepareTranslationInput('Like charges repel. Electric charge.','English','Physics'),'Like electric charges repel. Electric charge.');
 assert.equal(normalizeTranslationTerms('மின் கட்டணங்கள்','English','Tamil','Physics'),'மின்சுமைகள்');
 assert.equal(normalizeTranslationTerms('கட்டணம்','English','Tamil','Economics'),'கட்டணம்');
 assert.deepEqual(splitTranslationText('Like charges repel. Unlike charges attract.'),['Like charges repel.','Unlike charges attract.']);
});

test('Hindi uses the supported language code and collapsed translated choices remain unique',async()=>{
 assert.equal(LANGUAGE_CODES.Hindi,'hin_Deva');const item={title:'Question',body:'Evidence',sources:['S1'],options:['Repel','Attract','Disappear','Stay'],answer:'Attract'};
 const [translated]=await translateStudyItems([item],async()=> 'विकल्प');
 assert.equal(new Set(translated.options).size,4);assert.equal(translated.answer,translated.options[1]);assert.deepEqual(translated.sources,['S1']);
});
