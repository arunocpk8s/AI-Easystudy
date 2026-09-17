import test from 'node:test';
import assert from 'node:assert/strict';
import {handleStudy,validateOutput} from '../api/study.js';
const evidence=[{id:'S1',page:1,title:'Charge',text:'Like charges repel.'}];
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(data){this.data=JSON.parse(data);}};}
test('model output must cite supplied IDs and quizzes need answers',()=>{
  assert.throws(()=>validateOutput({items:[{title:'Claim',body:'Text',sources:['S99']}]},evidence,'notes'));
  assert.throws(()=>validateOutput({items:[{title:'Question',body:'Text',sources:['S1']}]},evidence,'quiz'));
  assert.equal(validateOutput({items:[{title:'Charge',body:'Like charges repel.',sources:['S1']}]},evidence,'notes').items.length,1);
});
test('API checks configuration, token, input, and validates provider output',async()=>{
  const oldKey=process.env.GROQ_API_KEY,oldToken=process.env.STUDY_ACCESS_TOKEN;
  try{
    delete process.env.GROQ_API_KEY;delete process.env.STUDY_ACCESS_TOKEN;
    let res=response();await handleStudy({method:'POST',headers:{},body:{}},res);assert.equal(res.statusCode,503);
    process.env.GROQ_API_KEY='test-not-real';process.env.STUDY_ACCESS_TOKEN='test-token';
    res=response();await handleStudy({method:'POST',headers:{},body:{}},res);assert.equal(res.statusCode,401);
    const req={method:'POST',headers:{'x-study-token':'test-token'},body:{feature:'notes',language:'English',evidence}};
    res=response();await handleStudy(req,res,async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({items:[{title:'Charge',body:'Like charges repel.',sources:['S1']}]})}}],usage:{prompt_tokens:20,completion_tokens:10}})}));
    assert.equal(res.statusCode,200);assert.equal(res.data.items[0].sources[0],'S1');assert.equal(res.data.usage.prompt_tokens,20);
    res=response();await handleStudy({...req,body:{...req.body,feature:'ask'}},res);assert.equal(res.statusCode,400);
    res=response();await handleStudy(req,res,async()=>({ok:false,status:429}));assert.equal(res.statusCode,429);
    res=response();await handleStudy(req,res,async()=>({ok:true,json:async()=>({choices:[{message:{content:'invalid'}}]})}));assert.equal(res.statusCode,502);
  }finally{if(oldKey===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=oldKey;if(oldToken===undefined)delete process.env.STUDY_ACCESS_TOKEN;else process.env.STUDY_ACCESS_TOKEN=oldToken;}
});
