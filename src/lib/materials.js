import {sentences} from './rag.js';
export const FEATURES = [
  {id:'notes',label:'Short notes',description:'The essentials, without the noise',icon:'FileText'},
  {id:'mindmap',label:'Mind map',description:'See how your topics connect',icon:'Network'},
  {id:'flashcards',label:'Flashcards',description:'Small cards. Stronger recall.',icon:'Layers'},
  {id:'summary',label:'Topic summaries',description:'Make the big ideas feel simple',icon:'AlignLeft'},
  {id:'questions',label:'Question types',description:'Practise beyond definitions',icon:'MessageCircleQuestion'},
  {id:'confusions',label:'Confusion points',description:'Untangle similar ideas',icon:'Lightbulb'},
  {id:'quiz',label:'Practice quiz',description:'Find out what has stuck',icon:'CircleHelp'},
  {id:'revision',label:'Last-minute revision',description:'A focused final read-through',icon:'Timer'},
  {id:'roadmap',label:'Study roadmap',description:'Your next steps, in order',icon:'Route'}
];
export function extractiveMaterials(chunks,feature) {
  const items = chunks.map(c=>({title:c.title,body:sentences(c.text).slice(0,feature==='revision'?2:4).join(' ')||c.text,sources:[c.id]}));
  if(feature==='flashcards')return items.map(item=>({...item,title:`Recall: ${item.title}`,body:item.body}));
  if(feature==='questions')return items.map(item=>({...item,title:`Explanation practice: ${item.title}`,body:`Explain this passage in your own words, identify the key terms, and check your answer against the source.\n\n${item.body}`}));
  if(feature==='confusions')return items.map(item=>({...item,title:`Check your understanding: ${item.title}`,body:`Review the definitions, conditions and units in this passage. These are review prompts, not verified common misconceptions.\n\n${item.body}`}));
  if(feature==='roadmap')return items.map((item,i)=>({...item,title:`${i+1}. ${item.title}`,body:`Read the source, explain the main idea aloud, then practise recall. This follows document order; prerequisites have not been inferred.`}));
  if(feature==='quiz')return chunks.slice(0,10).map(c=>{
    const sentence=sentences(c.text).find(s=>s.split(' ').length>8)||c.text;
    const words=sentence.split(' ');const index=words.findIndex((w,i)=>i>3&&w.replace(/[^\p{L}]/gu,'').length>5);
    const answer=words[index>=0?index:Math.min(4,words.length-1)];
    const masked=[...words];masked[index>=0?index:Math.min(4,words.length-1)]='________';
    return {title:masked.join(' '),body:sentence,answer,sources:[c.id]};
  });
  return items;
}
