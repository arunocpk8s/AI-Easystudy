import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {chunkPages,detectTitle} from './rag.js';
pdfjs.GlobalWorkerOptions.workerSrc = worker;
export async function readPdf(file, onProgress) {
  const preparationStart=performance.now();
  if (file.size > 20*1024*1024) throw new Error('Please upload a PDF smaller than 20 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-')) throw new Error('This file is not a readable PDF.');
  const validateMs=performance.now()-preparationStart;
  const started = performance.now();
  const task=pdfjs.getDocument({data:bytes,isEvalSupported:false});
  const pdf=await task.promise;
  try {
    if(pdf.numPages>200)throw new Error('This version supports up to 200 pages. Upload a chapter or a smaller PDF.');
    const pages=[]; const warnings=[];
    for(let page=1;page<=pdf.numPages;page++) {
      const p=await pdf.getPage(page); const content=await p.getTextContent();
      const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
      if(text.length<40)warnings.push(`Page ${page}: little or no text found. A scanned page may need OCR.`);
      pages.push({page,text});p.cleanup();onProgress(page,pdf.numPages);
    }
    const parsingMs=performance.now()-started;const structureStart=performance.now();
    const structuredPages=pages.map(p=>({...p,title:detectTitle(p.text,p.page)}));const structureMs=performance.now()-structureStart;const chunkStart=performance.now();
    const chunks=chunkPages(structuredPages);const chunkingMs=performance.now()-chunkStart;const indexStart=performance.now();const sourceLookup=new Map(chunks.map(c=>[c.id,c]));const indexMs=performance.now()-indexStart;
    if(!chunks.length)throw new Error('No readable text found. OCR is not implemented in this version. Please upload a text-based PDF.');
    return {name:file.name,pages,chunks,warnings,parsingMs,chunkingMs,processing:{validateMs,decodeMs:parsingMs,structureMs,chunkMs:chunkingMs,indexMs},sourceLookup};
  } finally {await task.destroy();}
}
