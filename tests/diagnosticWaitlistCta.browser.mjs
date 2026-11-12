import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {rolldown} from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import {chromium} from '/root/pw/node_modules/playwright/index.mjs';

// Brand Diagnostic: once answers are saved, the result panel on the page itself
// shows "Where you'd start" and the cohort waitlist button. API is mocked.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const API='http://api.synthetic.test';
const mocks={
  entry:`import React from'react';import{createRoot}from'react-dom/client';import Page from'${root}/src/pages/BrandDiagnosticPage.jsx';createRoot(document.getElementById('root')).render(<Page/>);`,
  header:`export default function Header(){return null}`,
  footer:`export default function Footer(){return null}`,
  utm:`export function getStoredAttribution(){return{}}`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{
  name:'diagnostic-cta-isolation',
  resolveId(source){
    if(source.startsWith('mock:'))return source;
    if(source==='../components/public/PublicHeader')return'mock:header';
    if(source==='../components/public/PublicFooter')return'mock:footer';
    if(source==='../lib/utmCapture')return'mock:utm';
    if(['react','react-dom/client','lucide-react'].includes(source))return req.resolve(source);
  },
  load(id){
    if(id.endsWith('/BrandDiagnosticPage.jsx'))return{code:fs.readFileSync(id,'utf8')
      .replace('import.meta.env.VITE_API_BASE_URL',JSON.stringify(API))
      .replace('import.meta.env.VITE_API_URL','""'),moduleType:'jsx'};
    if(id.startsWith('mock:'))return{code:mocks[id.slice(5)],moduleType:'jsx'};
  },
}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const code=output.find(item=>item.type==='chunk').code;
const server=http.createServer((request,response)=>{
  response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');
  response.end(request.url==='/bundle.js'?code:'<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;

let browser,checks=0,leadStatus=200;
const leadPosts=[];
const liveStart='[data-testid="diagnostic-live-start"]';

async function finishQuiz(page){
  await page.getByRole('button',{name:'Start the Brand Diagnostic'}).first().click();
  const modal=page.locator('.bdx-modal');
  await modal.getByLabel(/First name/).fill('Test');
  await modal.getByLabel(/^Email/).fill('founder@example.test');
  for(const select of await modal.locator('select').all())await select.selectOption({index:1});
  await modal.locator('.bdx-consent input').check();
  await modal.locator('button[type="submit"]').click();
  while(!(await modal.locator('.bdx-result-start').isVisible())){
    await modal.locator('.bdx-answer-grid button').last().click();
  }
  return modal;
}

try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.route(`${API}/**`,route=>{
    if(route.request().method()==='POST')leadPosts.push(route.request().postDataJSON().status);
    return route.fulfill({status:leadStatus,contentType:'application/json',body:'{}'});
  });
  await page.goto(base);

  // Before saving: result shown in the pop-up only, nothing new on the page.
  let modal=await finishQuiz(page);
  const tier=(await modal.locator('.bdx-result-start strong').innerText()).trim();
  assert.ok(['Foundation','Structure','House','Estate'].includes(tier),tier);
  assert.equal(await page.locator(liveStart).count(),0);
  checks++;

  // A failed save keeps the pop-up open and does not show the page button.
  leadStatus=500;
  await modal.getByRole('button',{name:'Save My Answers'}).click();
  await modal.locator('.bdx-error').waitFor();
  assert.equal(await page.locator(liveStart).count(),0);
  checks++;

  // Saving closes the pop-up and shows tier + waitlist button on the page.
  leadStatus=200;
  await modal.getByRole('button',{name:'Save My Answers'}).click();
  await page.locator(liveStart).waitFor({state:'visible'});
  assert.equal(await modal.count(),0);
  const block=page.locator(liveStart);
  assert.equal((await block.locator('.bdx-result-start').innerText()).trim(),`Where you'd start: ${tier}`);
  const button=block.getByRole('link',{name:'Join the Cohort Waitlist'});
  assert.equal(await button.isVisible(),true);
  const expected=`/cohort/waitlist?source=brand_diagnostic&tier=${tier}`;
  assert.equal(await button.getAttribute('href'),expected);
  assert.deepEqual(leadPosts,['started','completed','completed']);
  checks++;

  // The existing pop-up button is kept and uses the same link.
  await page.getByRole('button',{name:'View Full Recommendation'}).click();
  modal=page.locator('.bdx-modal');
  assert.equal(await modal.getByRole('link',{name:'Join the Cohort Waitlist'}).getAttribute('href'),expected);
  await modal.getByRole('button',{name:'Close diagnostic'}).click();
  checks++;

  // A saved result restored after a reload still shows the page button.
  await page.reload();
  await page.locator(liveStart).waitFor({state:'visible'});
  assert.equal(await page.locator(liveStart).getByRole('link',{name:'Join the Cohort Waitlist'}).getAttribute('href'),expected);
  checks++;
  console.log(`${checks} diagnostic waitlist button Chromium checks passed`);
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
