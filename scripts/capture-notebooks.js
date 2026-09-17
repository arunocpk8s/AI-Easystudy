import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1100}});await page.goto('http://127.0.0.1:5173');
for(const [feature,label] of [['mindmap','Mind map'],['roadmap','Study roadmap'],['notes','Short notes']]){
 await page.getByRole('tab',{name:'Student view',exact:true}).click();await page.getByRole('button',{name:`Create ${label}`,exact:true}).click();await page.locator(feature==='notes'?'.notebook-notes':'.study-graph').waitFor().catch(()=>{});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`artifacts/notebook-${feature}.png`,fullPage:true});await page.pdf({path:`artifacts/notebook-${feature}.pdf`,printBackground:true,preferCSSPageSize:true});
}
for(const kind of ['HLD','LLD']){await page.goto(`http://127.0.0.1:5173/docs/${kind}.html`);await page.screenshot({path:`artifacts/${kind}-visual.png`,fullPage:true});await page.pdf({path:`artifacts/${kind}-visual.pdf`,printBackground:true,format:'A4',landscape:true});}
await browser.close();
