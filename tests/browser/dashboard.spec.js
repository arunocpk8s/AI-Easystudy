import {test,expect} from '@playwright/test';
test('dashboard generates source-linked materials, quiz and process view',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Upload any study PDF'})).toBeVisible();
  await page.getByRole('button',{name:'Create Short notes',exact:true}).click();
  await expect(page.getByText('Bilingual demo — manually authored')).toBeVisible();
  await page.getByRole('button',{name:'p. 1 S1',exact:true}).first().click();
  await expect(page.getByRole('dialog',{name:'Source evidence'})).toBeVisible();await page.getByRole('button',{name:'Close source'}).click();
  await page.getByRole('button',{name:'Practice quiz',exact:true}).click();await page.getByRole('button',{name:'Create material'}).click();
  await page.getByRole('button',{name:'Check answers'}).click();await expect(page.getByText(/Suggested answer:/).first()).toBeVisible();
  await page.getByRole('tab',{name:'Behind the RAG',exact:true}).click();await expect(page.getByText('Measured wall-clock time')).toBeVisible();
});
test('real PDF extraction, evidence search, deletion and responsive layout',async({page})=>{
  await page.goto('/');await page.getByLabel('Upload PDF file').setInputFiles('tests/fixtures/study.pdf');
  await expect(page.locator('.document-strip').getByText('study.pdf',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ask this PDF',exact:true}).click();await page.getByLabel('Question',{exact:true}).fill('electric charge conserved');
  await page.getByRole('button',{name:'Find an answer'}).click();await expect(page.getByRole('heading',{name:'Source-based answer',level:2,exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Student view',exact:true}).click();await page.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.getByText('No document yet')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('flashcard reveal, mind-map sources, unsupported question and export',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Create Flash cards',exact:true}).click();
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
  await page.getByRole('button',{name:'Ask this PDF',exact:true}).click();
  await page.getByLabel('Question',{exact:true}).fill('photosynthesis chlorophyll');
  await page.getByRole('button',{name:'Find an answer'}).click();
  await expect(page.getByRole('heading',{name:'Not enough evidence'})).toBeVisible();
  const response=await page.request.post('/api/study',{data:{}});
  expect([401,503]).toContain(response.status());
});


test('reference views show real stages and both graphs have navigable source links',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('tab',{name:'Student view'})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.reference-tool')).toHaveCount(8);
  await page.getByLabel('Class',{exact:true}).selectOption('11');
  await page.getByLabel('Subject',{exact:true}).selectOption('Chemistry');
  await expect(page.locator('.reference-subnav')).toContainText('Class 11 · Chemistry');
  await page.getByRole('tab',{name:'Behind the RAG'}).click();
  await expect(page.locator('.pipeline-card')).toHaveCount(8);
  await expect(page.locator('.pipeline-card').filter({has:page.getByRole('heading',{name:'3. OCR',exact:true})})).toContainText('Available');await expect(page.locator('.stage-unavailable')).toHaveCount(0);
  await page.getByRole('tab',{name:'Student view'}).click();
  await page.getByRole('button',{name:'Create Mind map',exact:true}).click();
  await expect(page.getByRole('region',{name:'Graphical mind map'})).toBeVisible();
  await expect(page.locator('.graph-edge')).toHaveCount(16);
  await page.locator('.map-node').first().click();
  await page.locator('.graph-inspector').getByRole('button',{name:'p. 1 S1',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Source evidence'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Source evidence'})).not.toBeVisible();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(page.locator('.graph-actions')).not.toContainText('Fit page');
  await page.getByRole('button',{name:'Fit graph to page'}).click();await expect(page.locator('.graph-actions')).toContainText('Fit page');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export SVG',exact:true}).click();
  expect((await downloadPromise).suggestedFilename()).toBe('study-mindmap.svg');
  await page.getByRole('button',{name:'Study roadmap',exact:true}).click();
  await page.getByRole('button',{name:'Create material',exact:true}).click();
  await expect(page.getByRole('region',{name:'Graphical study roadmap'})).toBeVisible();
  await expect(page.locator('.roadmap-node')).toHaveCount(4);
  await expect(page.locator('.graph-edge')).toHaveCount(3);
  await page.locator('.roadmap-node').first().click();
  await page.getByRole('button',{name:'Mark as reviewed',exact:true}).click();
  await expect(page.getByRole('button',{name:'Mark as not reviewed',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('AI quiz UI supports multiple choice and keeps feedback hidden until submission',async({page})=>{
  await page.route('**/api/status',route=>route.fulfill({json:{aiConfigured:true,model:'mock-model'}}));
  let context;
  await page.route('**/api/study',route=>{
    context=route.request().postDataJSON();
    return route.fulfill({json:{items:[{title:'What do like charges do?',body:'Like charges repel.',sources:['S1'],options:['Repel','Attract','Disappear','Lose charge'],answer:'Repel'}],generationMs:10,usage:{prompt_tokens:10,completion_tokens:10}}});
  });
  await page.goto('/');
  await page.getByLabel('Class',{exact:true}).selectOption('11');await page.getByLabel('Subject',{exact:true}).selectOption('Chemistry');
  await page.getByRole('button',{name:'Create Quiz',exact:true}).click();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByLabel('Workspace access token').fill('test-token');
  await page.getByRole('button',{name:'Save for this session'}).click();
  await page.getByRole('button',{name:'Regenerate / open',exact:true}).click();
  await expect(page.locator('.mcq-options input[type=radio]')).toHaveCount(4);
  await expect(page.getByText(/Suggested answer:/)).toHaveCount(0);
  await page.getByLabel('Repel',{exact:true}).check();
  await page.getByRole('button',{name:'Check answers',exact:true}).click();
  await expect(page.getByText('Suggested answer: Repel',{exact:true})).toBeVisible();
  expect(context.classLevel).toBe('11');expect(context.subject).toBe('Chemistry');
});

test('Tamil demo and graphical architecture are accessible',async({page})=>{
 await page.goto('/');await page.getByLabel('Preferred language',{exact:true}).selectOption('Tamil');
 await page.getByRole('button',{name:'Create Short notes',exact:true}).click();
 await expect(page.locator('.notebook-notes')).toContainText('மின்சுமை');
 await page.getByRole('button',{name:'Visual HLD / LLD',exact:true}).click();
 await expect(page.locator('.architecture-canvas svg')).toBeVisible();
 await page.getByRole('button',{name:'LLD',exact:true}).click();
 await expect(page.locator('.architecture-caption')).toContainText('Low');
 await page.locator('.architecture-canvas [data-node-id]').first().click();
 await expect(page.locator('.architecture-detail')).toBeVisible();
 const response=await page.request.get('/docs/HLD.svg');expect(response.status()).toBe(200);expect(await response.text()).toContain('<svg');
});

test('Tamil question is translated for retrieval before a grounded AI response',async({page})=>{
 await page.route('**/api/status',r=>r.fulfill({json:{aiConfigured:true}}));const requests=[];
 await page.route('**/api/study',r=>{const input=r.request().postDataJSON();requests.push(input);return r.fulfill({json:input.feature==='translate_query'?{query:'electric charge conservation',generationMs:3,usage:{prompt_tokens:2,completion_tokens:2}}:{items:[{title:'மின்சுமை',body:'மின்சுமை அழியாது; அது நிலைபேறு உடையது.',sources:['S1']}],generationMs:5,usage:{prompt_tokens:4,completion_tokens:4}}});});
 await page.goto('/');await page.getByLabel('Upload PDF file').setInputFiles('tests/fixtures/study.pdf');await expect(page.locator('.document-strip')).toContainText('study.pdf');
 await page.getByLabel('Preferred language',{exact:true}).selectOption('Tamil');
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Workspace access token').fill('test-token');await page.getByLabel('Study mode',{exact:true}).selectOption('ai');await page.getByRole('button',{name:'Save for this session'}).click();
 await page.getByRole('button',{name:'Ask this PDF',exact:true}).click();await page.getByLabel('Question',{exact:true}).fill('மின்சுமை நிலைபேறு என்றால் என்ன?');await page.getByRole('button',{name:'Find an answer'}).click();
 await expect(page.getByRole('heading',{name:'மின்சுமை',exact:true})).toBeVisible();expect(requests.map(r=>r.feature)).toEqual(['translate_query','ask']);expect(requests[1].evidence[0].text).toMatch(/charge/i);
});
