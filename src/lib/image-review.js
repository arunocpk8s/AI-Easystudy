import {chunkPages,detectTitle} from './rag.js';
export function reviewImageDocument(doc,text){
 if(doc?.format!=='image')throw Error('Only an image transcription can be reviewed here.');
 const reviewed=text.trim();if(reviewed.length>20000)throw Error('Keep the reviewed image transcription under 20,000 characters.');if((reviewed.match(/\p{L}/gu)||[]).length<8||reviewed.split(/\s+/).length<2)throw Error('Enter readable text from the original image before continuing.');
 const runs=reviewed.match(/[A-Za-z]{3,}/g)||[];
 if(/[\uFFFD\u0000]/u.test(reviewed)||(reviewed.match(/[\p{L}\p{M}\p{N}]/gu)||[]).length/Math.max((reviewed.match(/\S/gu)||[]).length,1)<0.65||(runs.length>=4&&runs.filter(w=>/[aeiouy]/i.test(w)).length/runs.length<0.6))throw Error('This transcription still looks unreadable. Correct the text from the original image before continuing.');
 const started=performance.now();const page={...doc.pages[0],text:reviewed,title:detectTitle(reviewed,1),origin:'image-reviewed',sourceLabel:'Image 1'};
 delete page.ocrConfidence;
 const chunks=chunkPages([page]).map(c=>({...c,sourceLabel:'Image 1',ocrDraft:page.ocrDraft||''}));
 const reviewMs=performance.now()-started;return {...doc,reviewMs,warnings:doc.warnings.filter(w=>w.startsWith('GIF:')),ocrWarnings:doc.warnings,processing:{...doc.processing,chunkMs:reviewMs},needsReview:false,reviewed:true,pages:[page],chunks,pageReport:[{page:1,sourceLabel:'Image 1',status:'reviewed'}],sourceLookup:new Map(chunks.map(c=>[c.id,c]))};
}
