export const OCR_LANGUAGES={English:'eng',Tamil:'tam',Hindi:'hin'};
export function assessOcr(data){
 const text=(data?.text||'').trim();const confidence=Number(data?.confidence);
 const letters=(text.match(/\p{L}/gu)||[]).length;
 if(!text||letters<8||text.split(/\s+/).length<2)return {accepted:false,text:'',reason:'OCR found no usable printed text.'};
 if(!Number.isFinite(confidence)||confidence<45)return {accepted:false,text:'',reason:'OCR text was uncertain and was not indexed. Check the original page or upload a clearer scan.'};
 return {accepted:true,text,confidence};
}
export function waitForOcr(promise,{signal,timeoutMs=120000}={}){
 return new Promise((resolve,reject)=>{
  let timer;const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('PDF processing cancelled.','AbortError'));};
  Promise.resolve(promise).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
  if(signal?.aborted){abort();return;}
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{cleanup();reject(new Error('OCR timed out. Try a smaller chapter or a clearer scan.'));},timeoutMs);
 });
}

// Tesseract exposes the native Worker only after initialization. Capture its
// synchronous creation to support termination during downloads too. Restore
// the constructor before yielding to any other browser task.
export function captureOcrWorker(create,onWorker){
 const NativeWorker=globalThis.Worker;
 globalThis.Worker=class extends NativeWorker{constructor(...args){super(...args);onWorker(this);}};
 try{return create();}finally{globalThis.Worker=NativeWorker;}
}
