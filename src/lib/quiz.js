import {cleanSentences} from './pedagogy.js';
const generic=new Set('this that which there their about source chapter document property matter original demonstration fixture these those sentence statement'.split(' '));
const terms=text=>(text.match(/\p{L}[\p{L}\p{M}-]{2,}/gu)||[]).filter(t=>!generic.has(t.toLowerCase()));
export function sourceMcqs(chunks){
 const vocabulary=[...new Map(chunks.flatMap(c=>terms(c.text)).map(t=>[t.toLowerCase(),t])).values()];
 return chunks.slice(0,10).flatMap((c,i)=>{
  const sentence=cleanSentences(c).find(s=>terms(s).length>=2);if(!sentence)return [];
  const targets=terms(sentence);const titleTerms=new Set(terms(c.title).map(t=>t.toLowerCase()));const answer=targets.find(t=>titleTerms.has(t.toLowerCase()))||targets.find(t=>t.length>=5)||targets[0];
  const pool=vocabulary.filter(t=>t.toLowerCase()!==answer.toLowerCase());const offset=i%Math.max(1,pool.length);const distractors=[...pool.slice(offset),...pool.slice(0,offset)].slice(0,3);if(distractors.length<3)return [];
  const options=[answer,...distractors];let seed=[...c.text].reduce((n,x)=>(n*31+x.codePointAt(0))>>>0,1);
  for(let j=3;j>0;j--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const k=seed%(j+1);[options[j],options[k]]=[options[k],options[j]];}
  return [{title:`Choose the word that completes the source statement: ${sentence.replace(answer,'________')}`,body:`${sentence}\n\nThe missing term is “${answer}” in the cited source. This is source-wording recall practice.`,answer,options,sources:[c.id]}];
 });
}
export function quizScore(items,responses){return {correct:items.filter((item,i)=>responses[i]===item.answer).length,total:items.length,answered:items.filter((_,i)=>responses[i]).length};}
