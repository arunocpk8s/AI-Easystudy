import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('evaluation/results',{recursive:true});const browser=await chromium.launch();const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');let last=0;await page.exposeFunction('translationProgress',message=>{if(Date.now()-last>10000){console.log(message);last=Date.now();}});page.on('pageerror',e=>console.log('Page error',e.message));
const started=Date.now();try{
 const result=await page.evaluate(async()=>{const {translateLocalText}=await import('/src/lib/translation.js');const english='Like charges repel. Unlike charges attract.';const tamil=await translateLocalText(english,'English','Tamil',window.translationProgress,'Physics');const query=await translateLocalText('மின்சுமை என்றால் என்ன?','Tamil','English',window.translationProgress,'Physics');return {english,tamil,query};});
 const report={...result,elapsedMs:Date.now()-started,scope:'Live browser WASM NLLB smoke test; not a full technical translation benchmark.'};await writeFile('evaluation/results/local-translation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){await writeFile('evaluation/results/local-translation.json',JSON.stringify({error:e.message,elapsedMs:Date.now()-started}));console.log(e.message);process.exitCode=1;}finally{await browser.close();}
