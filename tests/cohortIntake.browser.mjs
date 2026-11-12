import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {rolldown} from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import {chromium} from '/root/pw/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const mocks={
  entry:`import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import Page from'${root}/src/pages/CohortApplyPage.jsx';createRoot(document.getElementById('root')).render(<BrowserRouter><Page/></BrowserRouter>);`,
  auth:`export function useAuth(){return{getToken:async()=>'synthetic_auth'}};export function useUser(){return{isSignedIn:true}};`,
  header:`export default function Header(){return null}`,
  footer:`export default function Footer(){return null}`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{
  name:'intake-test-isolation',
  resolveId(source){
    if(source.startsWith('mock:'))return source;
    if(source==='../hooks/useAuth')return'mock:auth';
    if(source==='../components/public/PublicHeader')return'mock:header';
    if(source==='../components/public/PublicFooter')return'mock:footer';
    if(['react','react-dom/client','react-router-dom'].includes(source))return req.resolve(source);
  },
  load(id){
    if(id.endsWith('/CohortApplyPage.jsx'))return{code:req('node:fs').readFileSync(id,'utf8'),moduleType:'jsx'};
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
let browser,checks=0,intakeStatus=200,intakeOpen=false,acknowledgements=0,applications=0,ackContext='';
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.route('**/api/cohort/phase',route=>route.fulfill({status:intakeStatus,contentType:'application/json',body:JSON.stringify({accepting_applications:intakeOpen})}));
  await page.route('**/api/cohort/policy-acknowledgement',route=>{acknowledgements++;ackContext=route.request().postDataJSON().context;return route.fulfill({status:500,contentType:'application/json',body:'{}'})});
  await page.route('**/api/cohort/apply',route=>{applications++;return route.fulfill({status:200,contentType:'application/json',body:'{}'})});
  await page.goto(base);
  await page.getByText('New applications are not currently open.').waitFor();
  assert.equal(await page.locator('form').isVisible(),false);
  assert.equal(await page.getByRole('link',{name:'Go to your secure reservation'}).isVisible(),true);
  checks++;

  intakeOpen=true;
  await page.reload();
  await page.locator('form').waitFor({state:'visible'});
  const eligible = page.getByRole('checkbox',{name:/I am a US resident age 18 or older/});
  const submit = page.getByRole('button',{name:'Submit Application'});
  assert.equal(await submit.isDisabled(),true);
  await eligible.check();
  assert.equal(await submit.isEnabled(),true);
  checks++;
  await page.locator('input[type="text"]').first().fill('Test Founder');
  await page.locator('input[type="email"]').fill('founder@example.test');
  await submit.click();
  await page.locator('.cth-apply-error').waitFor();
  assert.equal(acknowledgements,1);
  assert.equal(ackContext,'cohort_application');
  assert.equal(applications,0);
  checks++;

  intakeStatus=503;
  await page.reload();
  await page.getByText('New applications are not currently open.').waitFor();
  assert.equal(await page.locator('form').isVisible(),false);
  checks++;
  console.log(`${checks} cohort intake mounted Chromium checks passed`);
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
