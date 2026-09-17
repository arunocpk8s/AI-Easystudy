import {sentences,tokenize} from './rag.js';
export function cleanSentences(chunk){
  const text=chunk.text.replace(chunk.title,'').trim();
  return text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>25||(/[=²]/.test(s)&&s.length>=5)).filter(s=>!/original demonstration fixture|not an NCERT excerpt/i.test(s));
}
export function sourceAnswer(evidence,question){
  const terms=new Set(tokenize(question));
  const candidates=evidence.flatMap(chunk=>cleanSentences(chunk).map(text=>({text,sources:[chunk.id],score:tokenize(text).reduce((sum,t)=>sum+(terms.has(t)?1:0),0)})));
  const selected=candidates.sort((a,b)=>b.score-a.score).filter(c=>c.score>0).slice(0,3);
  if(!selected.length)return [{title:'Not enough evidence',body:'The retrieved passages do not support a precise answer. Try a more specific question.',sources:[]}];
  return [{title:'Source-based answer',body:selected.map(p=>p.text).join('\n\n'),sources:[...new Set(selected.flatMap(p=>p.sources))],keyPoints:selected.map(({text,sources})=>({text,sources}))}];
}
export function structuredPreview(chunks,feature){
  const groups=new Map();
  for(const c of chunks){if(!groups.has(c.title))groups.set(c.title,[]);groups.get(c.title).push(c);}
  return [...groups].map(([title,group])=>{
    const points=group.flatMap(c=>cleanSentences(c).map(text=>({text,sources:[c.id]}))).filter((p,i,a)=>a.findIndex(x=>x.text===p.text)===i).slice(0,6);
    const sources=[...new Set(group.map(c=>c.id))];
    const keyPoints=feature==='revision'?points.slice(0,3):points;
    const formula=points.find(p=>/[=²]/.test(p.text));
    return {title,body:keyPoints.map(p=>p.text).join('\n'),sources,keyPoints,definition:points.find(p=>/\bis\b|describes|refers to/i.test(p.text)),formula,textbookExcerpt:points[0],subtopics:keyPoints.slice(0,3).map(p=>({title:p.text.split(':')[0].slice(0,70),points:[p],sources:p.sources})),learningGoal:`Understand the source statements about ${title}.`,checkpoint:{text:`Explain ${title} in your own words and compare your explanation with the source.`,sources}};
  });
}
