import {test,expect} from '@playwright/test';import {PDFDocument,rgb} from 'pdf-lib';
test('blank page is skipped, short text retained, and only visible no-text page needs review',async({page})=>{
 const pdf=await PDFDocument.create();const first=pdf.addPage([400,500]);first.drawText('Electric charge is a property of matter.',{x:25,y:450,size:12});
 const blank=pdf.addPage([400,500]);blank.drawRectangle({x:0,y:0,width:400,height:500,color:rgb(1,1,1)});
 pdf.addPage([400,500]).drawText('Units',{x:25,y:450,size:12});pdf.addPage([400,500]).drawRectangle({x:25,y:300,width:200,height:80,color:rgb(0,0,0)});
 await page.goto('/');await page.getByLabel('Upload PDF file').setInputFiles({name:'page-coverage.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 const summary=page.getByRole('region',{name:'Document reading summary'});await expect(summary).toContainText('Page 2 is blank.');await expect(summary).toContainText('2 of 4 pages have selectable text');
 await expect(page.getByRole('alert')).toContainText('Page 4: Visible content');await expect(page.getByRole('alert')).not.toContainText('Page 2');
 await summary.getByText('Check page coverage and what to do next').click();await expect(summary).toContainText('Short text — included');await summary.getByRole('button',{name:'Page 2',exact:true}).click();await expect(page.getByRole('dialog',{name:'Source evidence'})).toContainText('PDF page 2');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Create Short notes',exact:true}).click();await expect(page.getByRole('button',{name:'p. 3 S2',exact:true}).first()).toBeVisible();
});
test('graph opens fitted on a normal page and complete content is readable without zoom',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Create Mind map',exact:true}).click();await expect(page.locator('.graph-actions')).toContainText('Fit page');
 await expect(page.getByRole('region',{name:'Detailed topic reading'})).toContainText('Conservation');
 const fits=await page.locator('.graph-scroll').evaluate(el=>({width:el.querySelector('svg').getBoundingClientRect().width<=el.clientWidth+1,noVerticalScroll:el.scrollHeight<=el.clientHeight+2}));expect(fits).toEqual({width:true,noVerticalScroll:true});
 await page.getByRole('button',{name:'Zoom in'}).click();await page.getByRole('button',{name:'Study roadmap',exact:true}).click();await page.getByRole('button',{name:'Create material',exact:true}).click();await expect(page.locator('.graph-actions')).toContainText('Fit page');await expect(page.getByRole('region',{name:'Detailed topic reading'})).toContainText('Self-check');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
