let worker;let nextId=0;const pending=new Map();
function getWorker(){
 if(!worker){worker=new Worker(new URL('../workers/translation.worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;if(data.type==='progress'){job.onProgress(data.message);return;}pending.delete(data.id);if(data.type==='result')job.resolve(data.text);else{job.reject(new Error(data.message));cancelLocalTranslation(data.message);}};
  worker.onerror=()=>cancelLocalTranslation('The translation worker could not load. Reload the app and retry.');
 }return worker;
}
export function translateLocalText(text,source='English',target='Tamil',onProgress=()=>{},subject=''){
 if(!text.trim()||source===target)return Promise.resolve(text);
 return new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject,onProgress});try{getWorker().postMessage({id,text,source,target,subject});}catch(error){pending.delete(id);reject(error);}});
}
export function cancelLocalTranslation(message='Local translation cancelled. You can retry or select English.'){
 worker?.terminate();worker=undefined;for(const job of pending.values())job.reject(new Error(message));pending.clear();
}
export function clearTranslationCache(){worker?.postMessage({type:'clear'});}
