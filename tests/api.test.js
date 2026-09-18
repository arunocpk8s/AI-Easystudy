import test from 'node:test';
import assert from 'node:assert/strict';
import {handleStudy,validateOutput} from '../api/study.js';
const evidence=[{id:'S1',page:1,title:'Charge',text:'Like charges repel.'}];
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(data){this.data=JSON.parse(data);}};}
test('model output must cite supplied IDs and quizzes need answers',()=>{
  assert.throws(()=>validateOutput({items:[{title:'Claim',body:'Text',sources:['S99']}]},evidence,'notes'));
  assert.throws(()=>validateOutput({items:[{title:'Question',body:'Text',sources:['S1']}]},evidence,'quiz'));
  assert.equal(validateOutput({items:[{title:'Charge',body:'Like charges repel.',sources:['S1'],keyPoints:[{text:'Like charges repel.',sources:['S1']}]}]},evidence,'notes').items.length,1);
});
test('API checks configuration, token, input, and validates provider output',async()=>{
  const oldKey=process.env.GROQ_API_KEY,oldToken=process.env.STUDY_ACCESS_TOKEN;
  try{
    delete process.env.GROQ_API_KEY;delete process.env.STUDY_ACCESS_TOKEN;
    let res=response();await handleStudy({method:'POST',headers:{},body:{}},res);assert.equal(res.statusCode,503);
    process.env.GROQ_API_KEY='test-not-real';process.env.STUDY_ACCESS_TOKEN='test-token';
    res=response();await handleStudy({method:'POST',headers:{},body:{}},res);assert.equal(res.statusCode,401);
    const req={method:'POST',headers:{'x-study-token':'test-token'},body:{feature:'notes',language:'English',evidence}};
    res=response();await handleStudy(req,res,async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({items:[{title:'Charge',body:'Like charges repel.',sources:['S1'],keyPoints:[{text:'Like charges repel.',sources:['S1']}]}]})}}],usage:{prompt_tokens:20,completion_tokens:10}})}));
    assert.equal(res.statusCode,200);assert.equal(res.data.items[0].sources[0],'S1');assert.equal(res.data.usage.prompt_tokens,20);
    res=response();await handleStudy({...req,body:{...req.body,feature:'ask'}},res);assert.equal(res.statusCode,400);
    res=response();await handleStudy(req,res,async()=>({ok:false,status:429}));assert.equal(res.statusCode,429);
    res=response();await handleStudy(req,res,async()=>({ok:true,json:async()=>({choices:[{message:{content:'invalid'}}]})}));assert.equal(res.statusCode,502);
  }finally{if(oldKey===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=oldKey;if(oldToken===undefined)delete process.env.STUDY_ACCESS_TOKEN;else process.env.STUDY_ACCESS_TOKEN=oldToken;}
});


test('multiple-choice output must have unique options and a matching answer',()=>{
  const item={title:'What do like charges do?',body:'Like charges repel.',sources:['S1'],options:['Repel','Attract','Disappear','Lose charge'],answer:'Repel'};
  assert.equal(validateOutput({items:[item]},evidence,'quiz').items[0].options.length,4);
  assert.throws(()=>validateOutput({items:[{...item,answer:'Invalid'}]},evidence,'quiz'));
  assert.throws(()=>validateOutput({items:[{...item,options:['Repel','Repel']}]},evidence,'quiz'));
});

test('nested citations and exact textbook quotations are enforced',()=>{
 const item={title:'Charge',body:'Repulsion',sources:['S1'],keyPoints:[{text:'Like charges repel.',sources:['S1']}],textbookExcerpt:{text:'Like charges repel.',sources:['S1']}};
 assert.equal(validateOutput({items:[item]},evidence,'notes').items.length,1);
 assert.throws(()=>validateOutput({items:[{...item,keyPoints:[{text:'Claim',sources:['S99']}]}]},evidence,'notes'));
 assert.throws(()=>validateOutput({items:[{...item,textbookExcerpt:{text:'Opposite charges repel.',sources:['S1']}}]},evidence,'notes'));
 assert.throws(()=>validateOutput({items:[item]},evidence,'mindmap'));
 assert.throws(()=>validateOutput({items:[item]},evidence,'roadmap'));
});

test('cloud quizzes reject descriptive questions and require exactly four options',()=>{
 const item={title:'Choose',body:'Source',sources:['S1'],answer:'Repel'};
 assert.throws(()=>validateOutput({items:[item]},evidence,'quiz'));
 assert.throws(()=>validateOutput({items:[{...item,options:['Repel','Attract','Disappear']}]},evidence,'quiz'));
});

test('structured generation retries invalid output and never bypasses citation checks',async()=>{
 const oldKey=process.env.GROQ_API_KEY,oldToken=process.env.STUDY_ACCESS_TOKEN,oldModel=process.env.GROQ_MODEL;
 try{
 process.env.GROQ_API_KEY='test-not-real';process.env.STUDY_ACCESS_TOKEN='test-token';process.env.GROQ_MODEL='openai/gpt-oss-120b';
 const req={method:'POST',headers:{'x-study-token':'test-token'},body:{feature:'notes',language:'English',evidence}};
 let calls=0;const valid={items:[{title:'Charge',body:'Like charges repel.',sources:['S1'],keyPoints:[{text:'Like charges repel.',sources:['S1']}],definition:null}]};
 const res=response();await handleStudy(req,res,async(url,options)=>{
 const request=JSON.parse(options.body);assert.equal(request.response_format.type,'json_schema');assert.equal(request.response_format.json_schema.strict,true);assert.deepEqual(request.response_format.json_schema.schema.properties.items.items.properties.sources.items.enum,['S1']);
 calls++;return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?{items:[{title:'Bad',body:'Bad',sources:['S99']}]}:valid)}}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}})};
 });
 assert.equal(calls,2);assert.equal(res.statusCode,200);assert.equal(res.data.attempts,2);assert.equal(res.data.usage.total_tokens,60);assert.equal(res.data.items[0].definition,undefined);
 const bad=response();calls=0;await handleStudy(req,bad,async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({items:[{title:'Bad',body:'Bad',sources:['S99']}]})}}]})};});assert.equal(calls,2);assert.equal(bad.statusCode,502);assert.match(bad.data.error,/structure or source checks/);
 const timeout=response();await handleStudy(req,timeout,async()=>{const e=new Error('timeout');e.name='TimeoutError';throw e;});assert.equal(timeout.statusCode,504);assert.match(timeout.data.error,/timed out/);
 }finally{for(const [key,value] of Object.entries({GROQ_API_KEY:oldKey,STUDY_ACCESS_TOKEN:oldToken,GROQ_MODEL:oldModel})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
