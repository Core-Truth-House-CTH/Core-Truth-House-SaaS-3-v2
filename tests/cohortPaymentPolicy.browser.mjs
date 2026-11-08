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
  entry:`import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import Page from'${root}/src/pages/CohortReservationPage.jsx';createRoot(document.getElementById('root')).render(<BrowserRouter><Page/></BrowserRouter>);`,
  auth:`export function useAuth(){return{getToken:async()=>'synthetic_auth'}};export function useUser(){return{isLoaded:true,isSignedIn:true}};`,
  api:`const api={get:async()=>({can_submit:true,state:new URLSearchParams(location.search).get('state')||'reserved',verification_timing_pending:new URLSearchParams(location.search).get('timing')==='1',payment_deadline:'2026-10-26T12:00:00Z'}),post:async(url)=>{if(url==='/api/cohort/policy-acknowledgement'){window.__ackCalls=(window.__ackCalls||0)+1;throw Error('ack rejected')}if(url==='/api/cohort/reservation/pay'){window.__payCalls=(window.__payCalls||0)+1;return{}}if(url==='/api/cohort/reservation/continue')throw Error('synthetic bank verification pending');throw Error('unexpected route')}};export default api;`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{
  name:'payment-policy-test-isolation',
  resolveId(source){
    if(source.startsWith('mock:'))return source;
    if(source==='../hooks/useAuth')return'mock:auth';
    if(source==='../lib/apiClient')return'mock:api';
    if(source==='react'||source==='react-dom/client'||source==='react-router-dom')return req.resolve(source);
  },
  load(id){
    if(id.endsWith('/CohortReservationPage.jsx'))return{code:req('node:fs').readFileSync(id,'utf8').replace('import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY','""'),moduleType:'jsx'};
    if(id.startsWith('mock:'))return{code:mocks[id.slice(5)],moduleType:'jsx'};
  },
}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const code=output.find(item=>item.type==='chunk').code;
const server=http.createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?code:'<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const checkbox=page.locator('input[type=checkbox]');
  const pay=page.getByRole('button',{name:'Pay $495 USD once'});
  await checkbox.waitFor({state:'visible'});
  assert.equal(await pay.isDisabled(),true);
  await checkbox.evaluate(el=>el.click());
  await page.waitForFunction(()=>!document.querySelector("button")?.disabled);
  assert.equal(await pay.isEnabled(),true);
  await pay.evaluate(el=>el.click());
  await page.getByRole('alert').waitFor();
  assert.equal(await page.evaluate(()=>window.__ackCalls||0),1);
  assert.equal(await page.evaluate(()=>window.__payCalls||0),0);
  const copyCases=[
    ['reserved','Submit payment before the deadline shown above.'],
    ['queued','All Founding seats are currently taken. You have not been charged.'],
    ['email_pending',"Your seat is reserved. We're sending your acceptance email now, and this page will update when you can pay."],
    ['paid',"Payment confirmed. Check your email from hello@coretruthhouse.com for your claim link to open your workspace. Didn't get it within 10 minutes? Email hello@coretruthhouse.com."],
  ];
  for(const [state,copy] of copyCases){
    const statePage=await browser.newPage();
    await statePage.goto("http://127.0.0.1:"+server.address().port+"/?state="+state);
    await statePage.getByText(copy,{exact:true}).waitFor({state:'visible'});
    assert.equal(await statePage.getByText(copy,{exact:true}).count(),1);
    await statePage.close();
  }
  const timingPage=await browser.newPage();
  await timingPage.goto("http://127.0.0.1:"+server.address().port+"/?state=reserved&timing=1");
  const timingCopy="We're checking with your bank. Your verification deadline will appear here shortly.";
  await timingPage.getByText(timingCopy,{exact:true}).waitFor({state:'visible'});
  assert.equal(await timingPage.getByText(timingCopy,{exact:true}).count(),1);
  await timingPage.close();
  const pendingPage=await browser.newPage();
  await pendingPage.goto("http://127.0.0.1:"+server.address().port+"/?state=payment_pending");
  const pendingCopy="Your seat is held while your payment processes. If your bank asks you to verify, finish within 24 hours.";
  await pendingPage.getByText(pendingCopy,{exact:true}).waitFor({state:'visible'});
  assert.equal(await pendingPage.getByText(pendingCopy,{exact:true}).count(),1);
  await pendingPage.close();
  const bankPage=await browser.newPage();
  await bankPage.goto("http://127.0.0.1:"+server.address().port+"/?state=payment_pending");
  await bankPage.getByRole('button',{name:'Continue payment verification'}).evaluate(el=>el.click());
  const bankCopy="Your bank is still confirming this payment. This page will update when it's done.";
  await bankPage.getByRole('alert').filter({hasText:bankCopy}).waitFor({state:'visible'});
  assert.equal(await bankPage.getByRole('alert').innerText(),bankCopy);
  await bankPage.close();
  console.log('10 cohort payment policy and reservation copy Chromium checks passed');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
