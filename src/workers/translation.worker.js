import {pipeline,env} from '@huggingface/transformers';
import {TRANSLATION_MODEL,LANGUAGE_CODES,splitTranslationText,terminologyTranslation,prepareTranslationInput,normalizeTranslationTerms} from '../lib/translation-core.js';
env.allowLocalModels=false;env.useBrowserCache=true;
// A single WASM thread works without cross-origin isolation on Vercel.
env.backends.onnx.wasm.numThreads=1;
let translator;const cache=new Map();let queue=Promise.resolve();
async function run({id,text,source,target,subject}){
 try{
  if(!LANGUAGE_CODES[source]||!LANGUAGE_CODES[target])throw new Error('Local translation supports English and Tamil only.');
  const term=terminologyTranslation(text,source,target,subject);if(term){self.postMessage({id,type:'result',text:term});return;}
  const key=JSON.stringify([source,target,subject,text]);if(cache.has(key)){self.postMessage({id,type:'result',text:cache.get(key)});return;}
  if(!translator){
   self.postMessage({id,type:'progress',message:'Downloading local translation model. First use needs around 900 MB; cached files can be reused.'});
   translator=await pipeline('translation',TRANSLATION_MODEL,{revision:'261c31d1a5732c67cdd16d80e8d6088507c7ccea',device:'wasm',dtype:'q8',session_options:{graphOptimizationLevel:'disabled'},progress_callback:p=>{
    if(p.status==='progress')self.postMessage({id,type:'progress',message:`Downloading ${p.file}: ${Math.round(p.progress||0)}% (${Math.round((p.loaded||0)/1048576)} MB)`});
    else if(p.status==='done')self.postMessage({id,type:'progress',message:'Preparing downloaded translation model…'});
   }});
  }
  const chunks=splitTranslationText(text);const translated=[];
  for(let i=0;i<chunks.length;i++){
   const chunk=chunks[i];self.postMessage({id,type:'progress',message:`Translating passage ${i+1} of ${chunks.length} locally…`});
   // Preserve standalone equations and cloze blanks instead of changing their meaning.
   if(!/\p{L}/u.test(chunk)||/^[\w\s²³₀-₉α-ωε∝\/|+*^().-]+\s*=\s*[^\n]+$/u.test(chunk)){translated.push(chunk);continue;}
   const parts=chunk.split(/(_{3,})/);const output=[];
   for(const part of parts){if(!part.trim()||/^_{3,}$/.test(part)){output.push(part);continue;}
    if(source==='English'&&/[\u0B80-\u0BFF]/.test(part)){output.push(part);continue;}
    const value=await translator(prepareTranslationInput(part,source,subject),{src_lang:LANGUAGE_CODES[source],tgt_lang:LANGUAGE_CODES[target],max_new_tokens:256,num_beams:4});
    const translatedText=value?.[0]?.translation_text?.trim();if(!translatedText)throw new Error('The local model returned an empty translation.');output.push(normalizeTranslationTerms(translatedText,source,target,subject));
   }translated.push(output.join(' '));
  }
  const output=translated.join('\n');if(cache.size>=1000)cache.clear();cache.set(key,output);self.postMessage({id,type:'result',text:output});
 }catch(error){translator=undefined;self.postMessage({id,type:'error',message:`Local translation could not finish: ${error.message}. Check internet for the initial download and use a laptop with sufficient memory. Retry or select English source preview.`});}
}
self.addEventListener('message',({data})=>{if(data.type==='clear'){cache.clear();return;}queue=queue.then(()=>run(data));});
