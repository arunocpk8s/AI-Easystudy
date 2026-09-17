let extractor;
export async function embedTexts(texts,onProgress=()=>{},kind='passage') {
  if(!extractor) {
    const {pipeline,env}=await import('@huggingface/transformers');
    env.allowLocalModels=false;
    extractor=await pipeline('feature-extraction','Xenova/multilingual-e5-small',{device:'wasm',dtype:'q8',progress_callback:()=>onProgress('Downloading multilingual embedding model…')});
  }
  const vectors=[];
  for(let i=0;i<texts.length;i++) {
    onProgress(`Embedding ${i+1} of ${texts.length}`);
    const output=await extractor(`${kind}: ${texts[i]}`,{pooling:'mean',normalize:true});
    vectors.push(Array.from(output.data));
  }
  return vectors;
}
