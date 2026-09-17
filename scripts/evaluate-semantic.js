import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5173');page.setDefaultTimeout(120000);
const golden=JSON.parse(readFileSync('evaluation/golden.json','utf8'));
const tamil=[
  {id:'ta01',question:'மின்னழுத்தம் என்றால் என்ன?',expectedPage:4},
  {id:'ta02',question:'மின்புலம் என்றால் என்ன?',expectedPage:3},
  {id:'ta03',question:'கூலூம் விதியை விளக்கவும்',expectedPage:2}
];
try{
  const results=await page.evaluate(async({golden,tamil})=>{
    const {embedTexts}=await import('/src/lib/semantic.js');
    const {chunkPages,retrieve}=await import('/src/lib/rag.js');
    const {samplePages}=await import('/src/lib/sample.js');
    const chunks=chunkPages(samplePages);const start=performance.now();
    const vectors=await embedTexts(chunks.map(c=>c.text));const indexingMs=performance.now()-start;
    const results=[];
    for(const q of [...golden,...tamil]){
      const start=performance.now();const [v]=await embedTexts([q.question],undefined,'query');
      const found=retrieve(chunks,q.question,3,vectors,v);
      results.push({...q,pages:found.map(c=>c.page),hitAt1:found[0]?.page===q.expectedPage,hitAt3:found.some(c=>c.page===q.expectedPage),latencyMs:performance.now()-start});
    }
    return {indexingMs,results};
  },{golden,tamil});
  const report={model:'Xenova/multilingual-e5-small',date:new Date().toISOString(),scope:'Real browser multilingual embeddings and RRF on original demo fixture, not teacher-reviewed textbook evaluation.',...results};
  writeFileSync('evaluation/results/hybrid.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}catch(e){console.log('SEMANTIC_EVALUATION_FAILED',e.message);process.exitCode=1;}
finally{await browser.close();}