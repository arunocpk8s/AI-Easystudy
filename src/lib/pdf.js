import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {classifyPage,hasVisibleInk} from './page-quality.js';
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
    const pages=[]; const warnings=[];const pageReport=[];
    for(let page=1;page<=pdf.numPages;page++) {
      const p=await pdf.getPage(page); const content=await p.getTextContent();
      const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
      let visibleInk=null;
      if(!text){
        let canvas;
        try{
          const base=p.getViewport({scale:1});const viewport=p.getViewport({scale:256/Math.max(base.width,base.height)});
          canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
          const context=canvas.getContext('2d',{willReadFrequently:true});
          await p.render({canvasContext:context,viewport,background:'rgb(255,255,255)'}).promise;
          visibleInk=hasVisibleInk(context.getImageData(0,0,canvas.width,canvas.height).data);
        }catch{visibleInk=null;}finally{if(canvas){canvas.width=0;canvas.height=0;}}
      }
      const quality=classifyPage(text,visibleInk);pageReport.push({page,...quality});
      if(quality.warning)warnings.push(`Page ${page}: ${quality.warning}`);
      pages.push({page,text});p.cleanup();onProgress(page,pdf.numPages);
    }
    const parsingMs=performance.now()-started;const structureStart=performance.now();
    const structuredPages=pages.map(p=>({...p,title:detectTitle(p.text,p.page)}));const structureMs=performance.now()-structureStart;const chunkStart=performance.now();
    const chunks=chunkPages(structuredPages);const chunkingMs=performance.now()-chunkStart;const indexStart=performance.now();const sourceLookup=new Map(chunks.map(c=>[c.id,c]));const indexMs=performance.now()-indexStart;
    if(!chunks.length)throw new Error('No selectable text found. This PDF may be blank or contain only images. Please upload a searchable PDF; image-only text needs OCR first.');
    return {name:file.name,pages,chunks,warnings,pageReport,parsingMs,chunkingMs,processing:{validateMs,decodeMs:parsingMs,structureMs,chunkMs:chunkingMs,indexMs},sourceLookup};
  } finally {await task.destroy();}
}
