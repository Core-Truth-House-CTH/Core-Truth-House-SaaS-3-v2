import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { rolldown } from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import { chromium } from '/root/pw/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire('/root/cth-workspace-visual-pass/package.json');
const mocks = {
  entry: [
    'import React from "react";',
    'import {createRoot} from "react-dom/client";',
    'import {BrowserRouter,Routes,Route} from "react-router-dom";',
    'import EstateContactPage from "'+root+'/src/pages/estate/EstateContactPage.jsx";',
    'import EmailSettings from "'+root+'/src/pages/EmailSettings.jsx";',
    'import Members from "'+root+'/src/pages/Members.jsx";',
    'createRoot(document.getElementById("root")).render(<BrowserRouter><Routes>',
    '<Route path="/contact" element={<EstateContactPage/>}/>',
    '<Route path="/email-settings" element={<EmailSettings/>}/>',
    '<Route path="/members" element={<Members/>}/>',
    '</Routes></BrowserRouter>);'
  ].join(''),
  api: [
    'const calls=[];window.apiCalls=calls;',
    'const api={',
    'get:async(path)=>{',
    'if(path==="/api/mail/integrations")return{integrations:[{provider:"resend",settings:{api_key_last4:"1234",from_address:"mail@example.test"}}]};',
    'if(path.endsWith("/members"))return{members:[{id:"m1",user_id:"synthetic-user",role:"owner",email:"owner@example.test",name:"Synthetic Owner",status:"active",created_at:"2026-01-01"}]};',
    'if(path.endsWith("/activity-summary"))return{total_credits_used:0,content_generated:0,credits_by_member:{}};',
    'if(path.endsWith("/pending-invites"))return{invites:[{id:"i1",email:"invitee@example.test",role:"member",status:"pending",created_at:"2026-01-01"}]};',
    'if(path.endsWith("/seat-usage"))return{used:1,limit:10,plan:"estate"};',
    'return{};',
    '},',
    'post:async(path)=>{calls.push("POST "+path);if(path==="/api/contact")return{success:true,contact_id:"synthetic-contact"};return{success:true};},',
    'put:async(path)=>{calls.push("PUT "+path);return{success:true};},',
    'delete:async(path)=>{calls.push("DELETE "+path);return{success:true};}',
    '};export default api;'
  ].join(''),
  auth: 'export function useUser(){return{user:{id:"synthetic-user"}}}export function useAuth(){return{getToken:async()=>"synthetic-token"}}',
  plan: 'export function usePlan(){return{isSuperAdmin:false,userRole:"member"}}',
  workspace: 'export function useWorkspace(){return{activeWorkspaceId:"ws_synthetic"}}',
  layout: 'import React from "react";export function DashboardLayout({children}){return <div>{children}</div>}',
  gsap: 'export const gsap={registerPlugin(){},matchMedia(){return{add(){},revert(){}}},utils:{toArray(){return[]}},from(){}}',
  scroll: 'export const ScrollTrigger={refresh(){}}',
  split: 'export const SplitText={create(){return{lines:[],revert(){}}}}',
  utm: 'export function getStoredAttribution(){return{}}'
};

const bundle = await rolldown({
  input: 'mock:entry',
  plugins: [{
    name: 'isolated-launch-email-review',
    resolveId(source) {
      if (source.startsWith('mock:')) return source;
      if (source.endsWith('/lib/apiClient')) return 'mock:api';
      if (source.endsWith('/hooks/useAuth')) return 'mock:auth';
      if (source.endsWith('/context/PlanContext')) return 'mock:plan';
      if (source.endsWith('/context/WorkspaceContext')) return 'mock:workspace';
      if (source.endsWith('/components/Layout')) return 'mock:layout';
      if (source === 'gsap') return 'mock:gsap';
      if (source === 'gsap/ScrollTrigger') return 'mock:scroll';
      if (source === 'gsap/SplitText') return 'mock:split';
      if (source.endsWith('/lib/utmCapture')) return 'mock:utm';
      if (['react','react-dom/client','react-router-dom','lucide-react'].includes(source)) return req.resolve(source);
    },
    load(id) {
      if (id === 'mock:entry') return {code:mocks.entry,moduleType:'jsx'};
      if (id.startsWith('mock:')) return {code:mocks[id.slice(5)] || '',moduleType:'jsx'};
    }
  }],
  transform: {jsx:{runtime:'classic'}},
  logLevel:'silent'
});
const generated = await bundle.generate({format:'iife'});
await bundle.close();
const code = generated.output.find((item)=>item.type==='chunk').code;
const server = http.createServer((request,response)=>{
  response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');
  response.end(request.url==='/bundle.js'?code:'<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+server.address().port;
let browser;
let checks=0;
try {
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());

  await page.goto(base+'/contact');
  await page.locator('#ec-first').fill('Synthetic');
  await page.locator('#ec-last').fill('Contact');
  await page.locator('#ec-email').fill('synthetic@example.test');
  await page.locator('#ec-reason').selectOption('Customer support');
  await page.locator('#ec-message').fill('Synthetic browser test only.');
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button',{name:/Send Message/}).click();
  await page.locator('.ec-form-success').waitFor();
  const contactSuccess=await page.locator('.ec-form-success').textContent();
  assert.match(contactSuccess,/Message received/);
  assert.match(contactSuccess,/sends no automatic email/);
  assert.equal(/confirmation is on its way|we reply within/i.test(contactSuccess),false);
  assert.deepEqual(await page.evaluate(()=>window.apiCalls),['POST /api/contact']);
  checks+=4;

  await page.goto(base+'/email-settings');
  await page.waitForTimeout(250);
  const settingsBody=await page.locator('body').innerText();
  if(!settingsBody.includes('Email Settings')) {
    throw new Error('Email Settings did not mount: '+settingsBody+' pageErrors='+JSON.stringify(pageErrors));
  }
  assert.equal(await page.getByText('Credentials saved',{exact:true}).count(),1);
  assert.equal(await page.getByText(/credentials are not used for platform sends during this launch/i).count(),1);
  assert.equal(await page.getByText(/evidence-validated cohort reservation and verified-paid access messages/i).count(),1);
  checks+=3;

  await page.goto(base+'/members');
  const inviteAction=page.getByRole('button',{name:'Team invitations unavailable during the cohort-only email launch'});
  await inviteAction.waitFor();
  await page.getByText('Synthetic Owner').waitFor();
  assert.equal(await page.getByText('Synthetic Owner').count(),1);
  assert.equal(await inviteAction.isDisabled(),true);
  await page.getByRole('status').filter({hasText:'New and resent team invitations are unavailable'}).waitFor();
  const resend=page.locator('button[aria-label="Resend unavailable during the cohort-only email launch"]');
  await resend.waitFor();
  assert.equal(await resend.isDisabled(),true);
  const revoke=page.locator('button[title="Revoke"]');
  assert.equal(await revoke.isEnabled(),true);
  await revoke.click();
  await page.waitForFunction(()=>window.apiCalls.includes('DELETE /api/teams/ws_synthetic/pending-invites/i1'));
  assert.deepEqual(await page.evaluate(()=>window.apiCalls),['DELETE /api/teams/ws_synthetic/pending-invites/i1']);
  checks+=7;

  assert.deepEqual(pageErrors,[]);
  checks++;
  console.log(checks+' mounted Chromium checks passed with mocked API/auth providers');
} finally {
  if(browser) await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
