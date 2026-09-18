import {OCR_LANGUAGES,waitForOcr,captureOcrWorker} from './ocr-quality.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
export function createOcrSession({language='English',signal,onProgress=()=>{}}={}){
 let worker=null;let startupWorker=null;let loading=null;let stopped=false;let currentPage=0;
 const close=()=>{stopped=true;if(worker){void worker.terminate().catch(()=>{});worker=null;}else startupWorker?.terminate();startupWorker=null;signal?.removeEventListener('abort',close);};
 signal?.addEventListener('abort',close,{once:true});
 async function load(){
  if(stopped||signal?.aborted)throw new DOMException('PDF processing cancelled.','AbortError');
  if(!loading){
   loading=import('tesseract.js').then(async({createWorker,PSM})=>{
    if(stopped)throw new DOMException('PDF processing cancelled.','AbortError');
    const next=await captureOcrWorker(()=>createWorker(OCR_LANGUAGES[language]||'eng',1,{
     workerPath,workerBlobURL:false,langPath:`https://cdn.jsdelivr.net/npm/@tesseract.js-data/${OCR_LANGUAGES[language]||'eng'}@1.0.0/4.0.0_best_int`,corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',
     logger:m=>{if(!stopped)onProgress(`OCR page ${currentPage}: ${m.status}${m.status==='recognizing text'?` ${Math.round((m.progress||0)*100)}%`:''}`);},
     errorHandler:()=>{}
    }),next=>{startupWorker=next;});
    if(stopped){await next.terminate();throw new DOMException('PDF processing cancelled.','AbortError');}
    worker=next;
    await next.setParameters({tessedit_pageseg_mode:PSM.AUTO,user_defined_dpi:'200'});
    return next;
   });
  }
  try{return await waitForOcr(loading,{signal});}catch(error){close();throw error;}
 }
 return {async recognize(canvas,page){currentPage=page;const active=await load();try{const result=await waitForOcr(active.recognize(canvas),{signal,timeoutMs:90000});return result.data;}catch(error){close();throw error;}},close};
}
