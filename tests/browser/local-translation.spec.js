import {test,expect} from '@playwright/test';
async function localWorker(page,stall=false){await page.addInitScript(({stall})=>{
 const RealWorker=window.Worker;window.localRequests=[];
 window.Worker=class{constructor(url,options){if(!String(url).includes('translation.worker'))return new RealWorker(url,options);this.stopped=false;}
 postMessage(data){if(data.type==='clear')return;window.localRequests.push(data);setTimeout(()=>{if(this.stopped)return;this.onmessage?.({data:{id:data.id,type:'progress',message:'Loading local translation model…'}});if(!stall)this.onmessage?.({data:{id:data.id,type:'result',text:data.source==='Tamil'?'electric charge conservation':`மொழிபெயர்ப்பு: ${data.text}`}});},10);}
 terminate(){this.stopped=true;}
 };},{stall});}
test('uploaded PDF uses local Tamil notes, mind map and Q&A without cloud requests',async({page})=>{
 await localWorker(page);let cloudCalls=0;await page.route('**/api/study',r=>{cloudCalls++;return r.abort();});
 await page.goto('/');await page.getByLabel('Upload study file').setInputFiles('tests/fixtures/study.pdf');await expect(page.locator('.document-strip')).toContainText('study.pdf');await page.getByLabel('Preferred language',{exact:true}).selectOption('Tamil');
 await page.getByRole('button',{name:'Create Short notes',exact:true}).click();await expect(page.locator('.notebook-notes')).toContainText('மொழிபெயர்ப்பு');await expect(page.locator('.original-comparison').first()).toContainText('charge');await expect(page.locator('.section-heading')).toContainText('Locally translated source study aids');await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByRole('button',{name:'p. 1 S1',exact:true}).first().click();await expect(page.getByRole('dialog',{name:'Source evidence'})).toContainText('charge');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Mind map',exact:true}).click();await page.getByRole('button',{name:'Create material',exact:true}).click();await expect(page.locator('.map-node').first()).toContainText('மொழிபெயர்ப்பு');
 await page.getByRole('button',{name:'Ask this document',exact:true}).click();await page.getByLabel('Question',{exact:true}).fill('மின்சுமை நிலைபேறு என்றால் என்ன?');await page.getByRole('button',{name:'Find an answer'}).click();await expect(page.getByRole('heading',{name:'Locally translated source answer'})).toBeVisible();expect(cloudCalls).toBe(0);expect(await page.evaluate(()=>window.localRequests.some(r=>r.source==='Tamil'&&r.target==='English'))).toBe(true);
 await page.getByRole('tab',{name:'Behind the RAG'}).click();await expect(page.getByText('Local answer translation',{exact:true})).toBeVisible();
});
test('local translation can be cancelled and English preview remains usable',async({page})=>{
 await localWorker(page,true);await page.goto('/');await page.getByLabel('Upload study file').setInputFiles('tests/fixtures/study.pdf');await expect(page.locator('.document-strip')).toContainText('study.pdf');await page.getByLabel('Preferred language',{exact:true}).selectOption('Tamil');await page.getByRole('button',{name:'Create Short notes',exact:true}).click();await expect(page.getByRole('status')).toContainText('Loading local');await page.getByRole('button',{name:'Cancel translation'}).click();await expect(page.getByRole('alert')).toContainText('cancelled');
 await page.locator('.generation-controls select').first().selectOption('English');await page.getByRole('button',{name:'Create material',exact:true}).click();await expect(page.locator('.notebook-notes')).toContainText('charge');
});
