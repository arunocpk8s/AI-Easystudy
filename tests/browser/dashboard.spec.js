import {test,expect} from '@playwright/test';
test('dashboard generates source-linked materials, quiz and process view',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Your next “aha” starts here.'})).toBeVisible();
  await page.getByRole('button',{name:/Short notes The essentials/}).click();
  await expect(page.getByText('Extractive — original source language')).toBeVisible();
  await page.getByRole('button',{name:'p. 1 S1',exact:true}).first().click();
  await expect(page.getByRole('dialog',{name:'Source evidence'})).toBeVisible();await page.getByRole('button',{name:'Close source'}).click();
  await page.getByRole('button',{name:'Practice quiz',exact:true}).click();await page.getByRole('button',{name:'Create material'}).click();
  await page.getByRole('button',{name:'Check answers'}).click();await expect(page.getByText(/Suggested answer:/).first()).toBeVisible();
  await page.getByRole('button',{name:'Behind the answer',exact:true}).click();await expect(page.getByText('Measured wall-clock time')).toBeVisible();
});
test('real PDF extraction, evidence search, deletion and responsive layout',async({page})=>{
  await page.goto('/');await page.getByLabel('Upload PDF file').setInputFiles('tests/fixtures/study.pdf');
  await expect(page.locator('.document-strip').getByText('study.pdf',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ask your PDF',exact:true}).click();await page.getByLabel('Question',{exact:true}).fill('electric charge conserved');
  await page.getByRole('button',{name:'Find an answer'}).click();await expect(page.getByRole('heading',{name:'Retrieved evidence'})).toBeVisible();
  await page.getByRole('button',{name:'Overview',exact:true}).click();await page.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.getByText('No document yet')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('flashcard reveal, mind-map sources, unsupported question and export',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Flashcards Small cards/}).click();
  await expect(page.getByRole('button',{name:'Reveal answer'}).first()).toBeVisible();
  await page.getByRole('button',{name:'Reveal answer'}).first().click();
  await expect(page.getByRole('button',{name:'Hide answer'}).first()).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export',exact:true}).click();
  expect((await downloadPromise).suggestedFilename()).toBe('study-flashcards.md');
  await page.getByRole('button',{name:'Mind map',exact:true}).click();
  await page.getByRole('button',{name:'Create material'}).click();
  await expect(page.locator('.map-root')).toBeVisible();
  await expect(page.locator('.map-node')).toHaveCount(4);
  await page.getByRole('button',{name:'Ask your PDF',exact:true}).click();
  await page.getByLabel('Question',{exact:true}).fill('photosynthesis chlorophyll');
  await page.getByRole('button',{name:'Find an answer'}).click();
  await expect(page.getByRole('heading',{name:'Not enough evidence'})).toBeVisible();
  const response=await page.request.post('/api/study',{data:{}});
  expect([401,503]).toContain(response.status());
});
