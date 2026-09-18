import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {classifyPage,hasVisibleInk} from './page-quality.js';
import {assessOcr} from './ocr-quality.js';
import {chunkPages,detectTitle} from './rag.js';
pdfjs.GlobalWorkerOptions.workerSrc=worker;
export async function readPdf(file,onProgress,options={}){
 const {ocrEnabled=true,ocrLanguage='English',signal,onStatus=()=>{}}=options;
 const checkCancelled=()=>{if(signal?.aborted)throw new DOMException('PDF processing cancelled.','AbortError');};
 const preparationStart=performance.now();
 if(file.size>20*1024*1024)throw new Error('Please upload a PDF smaller than 20 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());checkCancelled();
 if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('This file is not a readable PDF.');
 const validateMs=performance.now()-preparationStart;const started=performance.now();
 const task=pdfjs.getDocument({data:bytes,isEvalSupported:false});let session=null;
 const abort=()=>{session?.close();void task.destroy();};signal?.addEventListener('abort',abort,{once:true});
 try{
  const pdf=await task.promise;checkCancelled();
  if(pdf.numPages>200)throw new Error('This version supports up to 200 pages. Upload a chapter or a smaller PDF.');
  const pages=[];const warnings=[];const pageReport=[];let decodeMs=0;let ocrMs=0;let ocrUnavailable=false;
  const ocr={enabled:ocrEnabled,language:ocrLanguage,attempted:0,recognized:0,failed:0};
  for(let page=1;page<=pdf.numPages;page++){
   checkCancelled();onStatus(`Reading page ${page} of ${pdf.numPages}`);const decodeStart=performance.now();
   const p=await pdf.getPage(page);let canvas=null;
   try{
    const content=await p.getTextContent();let text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
    let visibleInk=null;let origin='pdf-text';let ocrConfidence;
    if(!text){try{
     const base=p.getViewport({scale:1});const viewport=p.getViewport({scale:256/Math.max(base.width,base.height)});
     canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     const context=canvas.getContext('2d',{willReadFrequently:true});
     await p.render({canvasContext:context,viewport,background:'rgb(255,255,255)'}).promise;
     visibleInk=hasVisibleInk(context.getImageData(0,0,canvas.width,canvas.height).data);
    }catch{visibleInk=null;}}
    decodeMs+=performance.now()-decodeStart;checkCancelled();let quality=classifyPage(text,visibleInk);
    if(!text&&visibleInk!==false&&ocrEnabled){
     ocr.attempted++;const ocrStart=performance.now();let recognitionStarted=false;onStatus(`Recognizing scanned text on page ${page} of ${pdf.numPages} (${ocrLanguage})…`);
     try{
      if(ocrUnavailable)throw new Error('OCR engine could not load. Check your internet connection and retry the upload.');
      if(!session){const {createOcrSession}=await import('./ocr.js');checkCancelled();session=createOcrSession({language:ocrLanguage,signal,onProgress:onStatus});}
      const base=p.getViewport({scale:1});const viewport=p.getViewport({scale:Math.min(3,2400/Math.max(base.width,base.height))});
      if(!canvas)canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await p.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;checkCancelled();
      recognitionStarted=true;const result=assessOcr(await session.recognize(canvas,page));checkCancelled();
      if(result.accepted){text=result.text;origin='ocr';ocrConfidence=result.confidence;quality={status:'ocr',short:text.length<40,confidence:ocrConfidence};ocr.recognized++;}
      else{quality={...quality,ocrAttempted:true,warning:`${quality.warning||'Page needs review.'} ${result.reason}`};ocr.failed++;}
     }catch(error){checkCancelled();ocr.failed++;ocrUnavailable=recognitionStarted||!session;quality={...quality,ocrAttempted:true,warning:`${quality.warning||'Page needs review.'} OCR could not finish: ${error.message||'recognition failed'}.`};}
     finally{ocrMs+=performance.now()-ocrStart;}
    }
    if(quality.warning)warnings.push(`Page ${page}: ${quality.warning}`);
    pageReport.push({page,...quality});pages.push({page,text,origin,ocrConfidence});onProgress?.(page,pdf.numPages);
   }finally{if(canvas){canvas.width=0;canvas.height=0;}p.cleanup();}
  }
  checkCancelled();const parsingMs=performance.now()-started;const structureStart=performance.now();
  const structuredPages=pages.map(p=>({...p,title:detectTitle(p.text,p.page)}));const structureMs=performance.now()-structureStart;const chunkStart=performance.now();
  const chunks=chunkPages(structuredPages);const chunkingMs=performance.now()-chunkStart;const indexStart=performance.now();const sourceLookup=new Map(chunks.map(c=>[c.id,c]));const indexMs=performance.now()-indexStart;
  if(!chunks.length)warnings.unshift('No readable passages were indexed. Check the OCR printed language, internet connection and scan quality; diagrams require manual review.');
  return {name:file.name,pages,chunks,warnings,pageReport,ocr,parsingMs,chunkingMs,processing:{validateMs,decodeMs,ocrMs,structureMs,chunkMs:chunkingMs,indexMs},sourceLookup};
 }catch(error){checkCancelled();throw error;}finally{signal?.removeEventListener('abort',abort);session?.close();await task.destroy();}
}
