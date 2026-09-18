const object = properties => ({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const string = {type:'string'};
export function studyResponseFormat(feature,evidence,model){
 if(!['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.8-27b'].includes(model))return {type:'json_object'};
 const sources={type:'array',items:{type:'string',enum:evidence.map(c=>c.id)},minItems:1,maxItems:20};
 const graph=['mindmap','roadmap'].includes(feature);
 const block=object({text:{type:'string',minLength:1,maxLength:graph?190:3000},sources});
 const blocks=(min,max)=>({type:'array',items:block,minItems:min,maxItems:max});
 const nullable=value=>({anyOf:[value,{type:'null'}]});
 let schema;
 if(feature==='translate_query')schema=object({query:string});
 else {
 const fields={title:{type:'string',minLength:1,maxLength:graph?70:1000},body:{type:'string',minLength:1,maxLength:graph?240:8000},sources};
 if(['notes','summary','revision'].includes(feature))Object.assign(fields,{keyPoints:blocks(2,6),definition:nullable(block),formula:nullable(block),example:nullable(block),misconception:nullable(block),textbookExcerpt:nullable(block)});
 if(feature==='mindmap')Object.assign(fields,{keyPoints:blocks(1,3),subtopics:{type:'array',minItems:2,maxItems:3,items:object({title:{type:'string',minLength:1,maxLength:45},points:blocks(1,2),sources})}});
 if(feature==='roadmap')Object.assign(fields,{learningGoal:{type:'string',minLength:1,maxLength:180},keyPoints:blocks(1,3),checkpoint:object({text:{type:'string',minLength:1,maxLength:180},sources})});
 if(feature==='questions')fields.answer=string;
 if(feature==='quiz')Object.assign(fields,{answer:string,options:{type:'array',items:string,minItems:4,maxItems:4}});
 schema=object({items:{type:'array',items:object(fields),minItems:1,maxItems:feature==='ask'?2:6}});
 }
 return {type:'json_schema',json_schema:{name:`study_${feature}`,strict:true,schema}};
}
export function removeNullFields(value){
 if(Array.isArray(value))return value.map(removeNullFields);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==null).map(([k,v])=>[k,removeNullFields(v)]));
 return value;
}
