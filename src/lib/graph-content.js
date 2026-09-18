import {tokenize} from './rag.js';
const normalize=text=>text.replace(/\s+/g,' ').trim();
const boilerplate=/^(?:activity|exercise|figure|fig\.|table|example\s*\d|copyright|all rights|reprint|learning outcomes|contents)|original demonstration fixture|not an NCERT excerpt|download|www\.|https?:|©/i;
function graphSentences(chunk){
 let text=chunk.text;
 // A title can be an entire short paragraph: never remove it as a heading.
 if(!/[.!?]/.test(chunk.title)&&!/\b(is|are|describes|means|refers)\b/i.test(chunk.title)&&text.startsWith(chunk.title)&&/^[\r\n.]/.test(text.slice(chunk.title.length)))text=text.slice(chunk.title.length);
 const lines=text.trim().split('\n');
 while(lines.length>1&&lines[0].trim().length<90&&!/[.!?=]/.test(lines[0])&&!/\b(is|are|describes|means|refers)\b/i.test(lines[0]))lines.shift();
 return normalize(lines.join(' ')).split(/(?<=[.!?])\s+/).filter(text=>text.length>=10||/=/.test(text));
}
export function conceptLabel(text){
 if(/\bSI unit\b|\bunit(?:s)?(?: is|:| of|\s*=)\b|\bcoulomb\s*\(C\)/i.test(text))return 'Units';
 if(/=/.test(text))return 'Formula';
 if(/conserv|quantis|quantiz/i.test(text))return 'Properties';
 if(/repel|attract/i.test(text))return 'Interactions';
 if(/because|depends|proportional|doubling|increases|decreases/i.test(text))return 'Relationship';
 if(/direction|vector|scalar/i.test(text))return 'Nature';
 if(/\bis\b|defined|refers to|describes/i.test(text))return 'Definition';
 return 'Key idea';
}
export function selectGraphPoints(points,title,limit=3){
 const merged=new Map();
 for(const p of points||[]){
  if(!p?.text?.trim())continue;
  // Keep complete source sentences rather than cutting away conditions or negations.
  const parts=normalize(p.text).split(/(?<=[.!?])\s+(?=[\p{Lu}\d])/u);
  for(const text of parts){if(boilerplate.test(text))continue;const key=text.toLowerCase();if(merged.has(key)){const old=merged.get(key);old.sources=[...new Set([...old.sources,...p.sources])];}else merged.set(key,{text,sources:[...p.sources]});}
 }
 const terms=new Set(tokenize(title));
 const candidates=[...merged.values()].map((p,index)=>({...p,index,score:tokenize(p.text).filter(t=>terms.has(t)).length+(/\bis\b|defined|describes/i.test(p.text)?3:0)+(/=|\bunit\b|repel|attract|because|conserv|quantis/i.test(p.text)?2:0)+(/\bnot\b|only if|unless/i.test(p.text)?4:0)}));
 const concise=candidates.filter(p=>p.text.length<=190);
 const pool=concise.length?concise:candidates.sort((a,b)=>a.text.length-b.text.length).slice(0,1);
 const ranked=pool.sort((a,b)=>b.score-a.score||a.index-b.index);const selected=[];const labels=new Set();
 for(const p of ranked){const label=conceptLabel(p.text);if(labels.has(label))continue;selected.push(p);labels.add(label);if(selected.length===limit)break;}
 for(const p of ranked){if(selected.length===limit)break;if(!selected.includes(p))selected.push(p);}
 selected.sort((a,b)=>a.index-b.index);
 return selected.map(({text,sources})=>({text,sources}));
}
export function sourceGraphMaterials(chunks,feature){
 const groups=new Map();
 for(const chunk of chunks){const key=normalize(chunk.title).toLowerCase();if(!groups.has(key))groups.set(key,{title:normalize(chunk.title),chunks:[]});groups.get(key).chunks.push(chunk);}
 return [...groups.values()].flatMap(({title,chunks:group})=>{
  const candidates=group.flatMap(c=>graphSentences(c).map(text=>({text,sources:[c.id]})));
  const keyPoints=selectGraphPoints(candidates,title);
  if(!keyPoints.length)return [];
  if(/^Page \d+$/i.test(title)||title.length>70||/[.!?]/.test(title)){const subject=keyPoints[0].text.match(/^(.{5,60}?)\s+(?:is|are|refers to|describes|means)\b/i)?.[1];title=subject||`Key concepts · page ${group[0].page}`;}
  const sources=[...new Set(keyPoints.flatMap(p=>p.sources))];
  const formula=keyPoints.find(p=>/=/.test(p.text));
  const labels=[...new Set(keyPoints.map(p=>conceptLabel(p.text).toLowerCase()))];
  const learningGoal=`Explain ${title}: ${labels.join(', ')}.`;
  return [{title,body:keyPoints[0].text,sources,keyPoints,formula,subtopics:keyPoints.map(p=>({title:conceptLabel(p.text),points:[p],sources:p.sources})),learningGoal,checkpoint:{text:formula?`Explain each quantity and the conditions for using the formula for ${title}.`:`Explain ${title} from memory, then check the cited page.`,sources},sourceBased:true}];
 });
}
export function compactGraphItems(items){
 const grouped=new Map();
 for(const item of items){const key=normalize(item.title).toLowerCase();if(!grouped.has(key))grouped.set(key,{...item,sources:[...item.sources],keyPoints:[...(item.keyPoints||[])],subtopics:[...(item.subtopics||[])]});else{const old=grouped.get(key);old.sources=[...new Set([...old.sources,...item.sources])];old.keyPoints.push(...(item.keyPoints||[]));old.subtopics.push(...(item.subtopics||[]));}}
 return [...grouped.values()].map(item=>{
  const keyPoints=selectGraphPoints(item.keyPoints?.length?item.keyPoints:item.subtopics?.length?item.subtopics.flatMap(s=>s.points):[{text:item.body,sources:item.sources}],item.title);
  const subtopics=[];const seen=new Set();
  for(const sub of item.subtopics||[]){const points=selectGraphPoints(sub.points,item.title,2).filter(p=>!seen.has(p.text.toLowerCase()));if(!points.length)continue;points.forEach(p=>seen.add(p.text.toLowerCase()));subtopics.push({...sub,points,sources:[...new Set(points.flatMap(p=>p.sources))]});if(subtopics.length===3)break;}
  return {...item,body:keyPoints[0]?.text||item.body,definition:item.definition?.text.length<=240?item.definition:undefined,keyPoints,subtopics:subtopics.length?subtopics:keyPoints.map(p=>({title:conceptLabel(p.text),points:[p],sources:p.sources}))};
 });
}
