const STOP = new Set('a an the is are of to in and or for with what how explain describe this that it from as on by be does do'.split(' '));
export const tokenize = text => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(x => !STOP.has(x));

export function chunkPages(pages, size = 150, overlap = 25) {
  if (size <= overlap || overlap < 0) throw new Error('Chunk size must exceed overlap.');
  const chunks = [];
  for (const {page, text, title} of pages) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    for (let start = 0; start < words.length; start += size - overlap) {
      chunks.push({id:`S${chunks.length + 1}`,page,text:words.slice(start,start+size).join(' '),title:title||detectTitle(text, page)});
      if (start + size >= words.length) break;
    }
  }
  return chunks;
}
export function detectTitle(text, page) {
  const first = text.split('\n').find(x => x.trim().length > 4 && x.trim().length < 100);
  return first?.trim() || `Page ${page}`;
}
export function retrieve(chunks, question, topK=5, vectors=null, queryVector=null) {
  const q = tokenize(question);
  if (!q.length) return [];
  const documents = chunks.map(c=>tokenize(c.text));
  const average = documents.reduce((s,d)=>s+d.length,0)/Math.max(1,documents.length);
  const scores = chunks.map((chunk,index)=>{
    const terms = documents[index];
    let score = 0;
    for (const term of new Set(q)) {
      const frequency = terms.filter(t=>t===term).length;
      const df = documents.filter(d=>d.includes(term)).length;
      const idf = Math.log(1+(chunks.length-df+0.5)/(df+0.5));
      score += idf * frequency * 2.2 / (frequency + 1.2*(0.25+0.75*terms.length/(average||1)));
    }
    return {...chunk,score,index};
  });
  const lexical = [...scores].sort((a,b)=>b.score-a.score);
  if (vectors && queryVector) {
    const semantic = scores.map(c=>({...c,similarity:dot(vectors[c.index],queryVector)})).sort((a,b)=>b.similarity-a.similarity);
    const fused = scores.map(c=>({...c,score:(c.score>0?1/(60+lexical.findIndex(x=>x.id===c.id)+1):0)+1/(60+semantic.findIndex(x=>x.id===c.id)+1)}));
    return deduplicate(fused.sort((a,b)=>b.score-a.score)).slice(0,topK);
  }
  return deduplicate(lexical.filter(c=>c.score>0)).slice(0,topK);
}
function dot(a,b) { return a.reduce((sum,x,i)=>sum+x*b[i],0); }
function deduplicate(chunks) {
  const seen = new Set(); return chunks.filter(c=>{const key=c.text.toLowerCase(); if(seen.has(key))return false;seen.add(key);return true;});
}
export function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>25);
}
export function sectionEvidence(chunks) {
  // Preserve every chunk. Generation is batched rather than taking a top-K sample of the document.
  const groups=[]; let current=[]; let length=0;
  for(const chunk of chunks) {
    if(length+chunk.text.length>10000 && current.length) {groups.push(current);current=[];length=0;}
    current.push(chunk);length+=chunk.text.length;
  }
  if(current.length)groups.push(current);
  return groups;
}
