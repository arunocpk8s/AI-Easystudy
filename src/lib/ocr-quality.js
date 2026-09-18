export const OCR_LANGUAGES={English:'eng',Tamil:'tam',Hindi:'hin'};
export function assessOcr(data,{language}={}){
 const text=(data?.text||'').normalize('NFC').trim(),confidence=Number(data?.confidence);
 const tokens=text.split(/\s+/).filter(Boolean),letters=(text.match(/\p{L}/gu)||[]).length;
 const reject=reason=>({accepted:false,text:'',reason});
 if(!text||letters<8||tokens.length<2)return reject('OCR found no usable printed text.');
 if(!Number.isFinite(confidence)||confidence<65)return reject('OCR text was uncertain and was not indexed. Select the correct printed language, use a sharper image, or correct the transcription in the review panel.');
 const visible=(text.match(/\S/gu)||[]).length,readable=(text.match(/[\p{L}\p{M}\p{N}]/gu)||[]).length;
 if(readable/Math.max(visible,1)<0.65||/[\uFFFD\u0000]/u.test(text))return reject('OCR contains too much character noise. Review the original image and correct the transcription.');
 const runs=text.match(/\p{L}[\p{L}\p{M}]*/gu)||[];
 const script=language==='Tamil'?/\p{Script=Tamil}/u:language==='Hindi'?/\p{Script=Devanagari}/u:language==='English'?/\p{Script=Latin}/u:null;
 if(script&&Array.from(text).filter(c=>/\p{L}/u.test(c)&&script.test(c)).length/letters<0.5)return reject('Recognized text does not match the selected printed language. Change Document printed language and re-upload.');
 if(language==='English'){const words=runs.filter(w=>w.length>=3);if(words.length>=4&&words.filter(w=>/[aeiouy]/i.test(w)).length/words.length<0.6)return reject('OCR appears to contain unreadable letter sequences. Correct the transcription before using it.');}
 const words=(data?.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[]))).filter(w=>/\p{L}/u.test(w.text||''));
 if(words.length>=4&&words.filter(w=>Number(w.confidence)>=60).length/words.length<0.7)return reject('Too many OCR words are uncertain. Use a clearer crop or correct the transcription.');
 return {accepted:true,text,confidence};
}
export function ocrImageDimensions(width,height){const scale=Math.min(Math.max(1,1200/Math.max(width,height)),2,3600/Math.max(width,height),Math.sqrt(10000000/(width*height)));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
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
