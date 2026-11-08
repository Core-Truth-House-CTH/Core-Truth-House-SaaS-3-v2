// Actual reservation component; mock auth/API/Stripe.js, deny all external network.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {rolldown} from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import {chromium} from '/root/pw/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const mocks={
 entry:`import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import Page from'${root}/src/pages/CohortReservationPage.jsx';createRoot(document.getElementById('root')).render(<BrowserRouter><Page/></BrowserRouter>);`,
 auth:`const getToken=async()=>'synthetic_auth';export function useAuth(){return{getToken}};export function useUser(){return{isLoaded:true,isSignedIn:window.fixture.signedIn}};`,
 api:`async function call(path,body,opts){const res=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...opts?.headers},...(body?{body:JSON.stringify(body)}:{})});if(!res.ok)throw Error('Request unavailable');return res.json()};export default{get:(p,o)=>call(p,null,o),post:(p,b,o)=>call(p,b,o)};`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{name:'isolated',resolveId(source){if(source.startsWith('mock:'))return source;if(source==='../hooks/useAuth')return'mock:auth';if(source==='../lib/apiClient')return'mock:api';if(['react','react-dom/client','react-router-dom'].includes(source))return req.resolve(source);},load(id){if(id.endsWith('/CohortReservationPage.jsx'))return{code:fs.readFileSync(id,'utf8').replace('import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY',JSON.stringify('pk_test_synthetic')),moduleType:'jsx'};if(id.startsWith('mock:'))return{code:mocks[id.slice(5)],moduleType:'jsx'};}}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();const code=output.find(x=>x.type==='chunk').code;
const server=http.createServer((q,r)=>{r.setHeader('Content-Type',q.url==='/bundle.js'?'text/javascript':'text/html');r.end(q.url==='/bundle.js'?code:'<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
let browser,checks=0;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const context=await browser.newContext();const page=await context.newPage();
 let state={},requests=[],continues=0;
 await context.addInitScript(()=>{
  window.fixture=JSON.parse(sessionStorage.getItem('fixture')||'{}');window.cardMounted=0;window.tokens=0;window.actions=0;
  window.Stripe=()=>({elements:(options)=>(window.elementsAmount=options.amount,{create:()=>({mount:()=>{window.cardMounted++},destroy:()=>{}}),submit:async()=>({})}),createConfirmationToken:async()=>{window.tokens++;return{confirmationToken:{id:'ctoken_synthetic'}}},handleNextAction:async()=>{window.actions++;return{}}});
 });
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
  if(url.pathname.startsWith('/api/')){
   assert.equal(route.request().headers().authorization,'Bearer synthetic_auth');requests.push(url.pathname);
   if(url.pathname.endsWith('/pay')){
    assert.deepEqual(route.request().postDataJSON(),{confirmation_token:'ctoken_synthetic'});
    state={state:'payment_pending',payment_state:'requires_action',payment_deadline:'2026-10-24T12:00:00Z',verification_deadline:'2026-10-25T11:59:00Z',can_submit:false};
   }
   if(url.pathname.endsWith('/continue')){continues++;if(continues===1)return route.fulfill({json:{...state,client_secret:'synthetic_private'}});state={...state,payment_state:'processing'};}
   return route.fulfill({json:state});
  }return route.continue();
 });
 async function go(signedIn,next){state=next;requests=[];await page.goto(base+'/init');await page.evaluate(f=>sessionStorage.setItem('fixture',JSON.stringify(f)),{signedIn});await page.goto(base+'/cohort/reservation?paid=true&success=true');}
 await go(false,{});await page.getByRole('link',{name:'Sign in to view your reservation'}).waitFor();assert.equal(requests.length,0);checks++;
 for(const next of [{state:'queued',can_submit:false},{state:'email_pending',can_submit:false},{state:'released',can_submit:false}]){
  await go(true,next);await page.getByText(`Reservation: ${next.state}`,{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Pay $495 USD once',exact:true}).count(),0);assert.equal(await page.evaluate(()=>window.cardMounted),0);checks++;
 }
 await go(true,{state:'active',can_submit:true,payment_deadline:'2026-10-24T12:00:00Z'});await page.getByText('Payment deadline: 2026-10-24 12:00:00 UTC',{exact:true}).waitFor();await page.waitForFunction(()=>window.cardMounted===1);assert.equal(await page.evaluate(()=>window.elementsAmount),49500);assert.equal(await page.evaluate(()=>window.tokens),0);assert.equal(requests.filter(p=>p.endsWith('/pay')).length,0);checks++;
 const policyCheckbox=page.locator('input[type=checkbox]');const payButton=page.getByRole('button',{name:'Pay $495 USD once',exact:true});assert.equal(await payButton.isDisabled(),true);await policyCheckbox.evaluate(el=>el.click());await page.waitForFunction(()=>{const checkbox=document.querySelector('input[type=checkbox]');const button=[...document.querySelectorAll('button')].find(item=>item.textContent?.includes('Pay $495 USD once'));return checkbox?.checked===true&&button&&!button.disabled;});assert.equal(await payButton.isEnabled(),true);await payButton.click();await page.getByText('Bank verification deadline: 2026-10-25 11:59:00 UTC',{exact:true}).waitFor();assert.equal(requests.filter(p=>p.endsWith('/pay')).length,1);checks++;
 await page.getByRole('button',{name:'Continue payment verification'}).click();await page.waitForFunction(()=>window.actions===1);await page.waitForFunction(()=>!document.querySelector('button')?.disabled);assert.equal(continues,2);checks++;
 await go(true,{state:'payment_pending',payment_state:'requires_action',verification_timing_pending:true,can_submit:false});await page.getByText("We're checking with your bank. Your verification deadline will appear here shortly.").waitFor();assert.equal(await page.getByText(/Bank verification deadline:/).count(),0);checks++;
 await go(true,{state:'payment_pending',payment_state:'requires_action',price_compatibility_review:true,can_submit:false});await page.getByRole('status').waitFor();assert.equal(await page.getByRole('button').count(),0);checks++;
 await go(true,{state:'paid',can_submit:false});await page.getByText("Payment confirmed. Check your email from hello@coretruthhouse.com for your claim link to open your workspace. Didn't get it within 10 minutes? Email hello@coretruthhouse.com.").waitFor();assert.equal(requests.some(p=>p.includes('redeem')),false);checks++;
 await context.close();console.log(`${checks} automatic enrollment mounted Chromium checks passed`);
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
