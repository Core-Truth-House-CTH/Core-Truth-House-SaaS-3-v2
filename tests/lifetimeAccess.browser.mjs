// Isolated component/browser harness: real claim/router/plan/gates, mocked auth,
// workspace and HTTP providers. No application startup, .env or real backend.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { rolldown } from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import { chromium } from '/root/pw/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const parser=req('@babel/parser');
const auth=fs.readFileSync(`${root}/src/components/Auth.jsx`,'utf8');
const protectedRoute=parser.parse(auth,{sourceType:'module',plugins:['jsx']}).program.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.id?.name==='ProtectedRoute');
const mocks={
 entry:`import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route}from'react-router-dom';import{PlanProvider}from'${root}/src/context/PlanContext.jsx';import AppRouter from'${root}/src/navigation/AppRouter.jsx';import{PlanGate}from'${root}/src/components/PlanGate.jsx';import CohortJoinPage from'${root}/src/pages/CohortJoinPage.jsx';import CohortWelcomePage from'${root}/src/pages/CohortWelcomePage.jsx';createRoot(document.getElementById('root')).render(<BrowserRouter><PlanProvider><Routes><Route path="/test-admin" element={<PlanGate route="/admin"><p>Forbidden admin content</p></PlanGate>}/><Route path="/cohort/join" element={<CohortJoinPage/>}/><Route path="/cohort/welcome" element={<CohortWelcomePage/>}/><Route path="*" element={<AppRouter/>}/></Routes></PlanProvider></BrowserRouter>);`,
 auth:`export const HAS_CLERK=true;export function useUser(){return{isLoaded:true,isSignedIn:window.fixture.signedIn,user:window.fixture.signedIn?{id:'synthetic_user',publicMetadata:{}}:null}};export function useAuth(){return{isLoaded:true,getToken:async()=>'synthetic_auth'}};`,
workspace:`export function useWorkspace(){return{initialized:true,activeWorkspaceId:'ws_synthetic',activeWorkspace:{id:'ws_synthetic',owner_id:'internal-user',isOwnedByCurrentUser:true,plan_id:window.fixture.plan,name:window.fixture.name||'Synthetic workspace'},workspaces:[{id:'ws_synthetic',owner_id:'internal-user',isOwnedByCurrentUser:true,plan_id:window.fixture.plan,name:window.fixture.name||'Synthetic workspace'}],refreshWorkspaces:async()=>{window.refreshes=(window.refreshes||0)+1;}}}`,
 api:`export default{get:async(path,opts)=>{const response=await fetch(path+'?'+new URLSearchParams(opts?.params||{}));if(!response.ok)throw Error('request failed');return response.json()},post:async(path,body)=>{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw Error('claim failed');return response.json()}}`,
 protected:`import React from'react';import{Navigate,useLocation}from'react-router-dom';import{useUser,HAS_CLERK}from'mock:auth';${auth.slice(protectedRoute.start,protectedRoute.end)}`,
 theme:`export const useColors=()=>({});`,
 layout:`export function DashboardLayout({children}){return children}`,
 registry:`import React from'react';import{usePlan}from'${root}/src/context/PlanContext.jsx';function Page(){const p=usePlan();return <main><h1>Protected content</h1><pre id='access'>{JSON.stringify({plan:p.plan,lifetime:p.hasLifetimeAccess,status:p.subscriptionStatus,active:p.hasActivePlan})}</pre></main>};export const getPageComponent=()=>Page;`,
 page:`import React from'react';export default function Page(){return <main>Mocked nonclaim page</main>}`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{name:'isolated-providers',resolveId(source,importer){
 if(source.startsWith('mock:'))return source;
 if(source.endsWith('/hooks/useAuth')||source==='../hooks/useAuth')return'mock:auth';
 if(source.endsWith('/context/WorkspaceContext')||source==='./WorkspaceContext')return'mock:workspace';
 if(source.endsWith('/lib/apiClient'))return'mock:api';
 if(source.endsWith('/components/Auth'))return'mock:protected';
 if(source.endsWith('/context/ThemeContext'))return'mock:theme';
 if(source==='./Layout')return'mock:layout';
 if(source==='./pageRegistry')return'mock:registry';
 if(source.endsWith('/public/PublicHeader')||source.endsWith('/public/PublicFooter'))return'mock:page';
 if(importer?.endsWith('/navigation/AppRouter.jsx')&&(source.startsWith('../pages/')||source==='../admin/AdminRouter')&&!source.endsWith('CohortClaimPage')&&!source.endsWith('CohortClaimEntry'))return'mock:page';
 if(['react','react-dom/client','react-router-dom','lucide-react'].includes(source))return req.resolve(source);
 },load(id){if(id.startsWith('mock:'))return{code:mocks[id.slice(5)],moduleType:'jsx'};}}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const code=output.find(x=>x.type==='chunk').code;
const server=http.createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?code:'<!doctype html><html><head><meta name="referrer" content="no-referrer"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser,checks=0;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext();
 const page=await context.newPage();
 let state={tier:'ordinary',status:'cancelled',plan:'foundation',signedIn:true,fail:true},posts=0;
 const logs=[];page.on('console',message=>logs.push(message.text()));
 await context.addInitScript(()=>{window.fixture=JSON.parse(sessionStorage.getItem('fixture')||'{}')});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==base)return route.abort();
  if(url.pathname==='/api/cohort/invite/validate'){assert.deepEqual(route.request().postDataJSON(),{token:'synthetic_claim'});return route.fulfill({json:{valid:true}});}
  if(url.pathname.startsWith('/api/cohort/invite/')){posts++;assert.equal(route.request().method(),'POST');assert.deepEqual(route.request().postDataJSON(),{token:'synthetic_claim',workspace_id:'ws_synthetic'});if(!state.fail)state.tier='founding';return route.fulfill({status:state.fail?503:200,json:state.claimResult||{success:true,workspace_id:'ws_synthetic'}});}
  if(url.pathname==='/api/user/plan')return route.fulfill({json:{plan:state.tier==='founding'?'estate':state.plan,subscription_status:state.status,effective_access:{plan:state.tier==='founding'?'estate':state.plan,lifetime:state.tier==='founding',active:state.tier==='founding'||state.status==='active'}}});
  if(url.pathname==='/api/billing/summary')return route.fulfill({json:{subscription:{status:state.status}}});
  return route.continue();
 });
 async function go(fixture,url){state={...fixture};await page.goto(base+'/test-init');await page.evaluate(value=>sessionStorage.setItem('fixture',JSON.stringify(value)),fixture);await page.goto(base+url);}
 for(const tier of ['founding','standard','ordinary'])for(const status of ['active','cancelled','unpaid','past_due','inactive']){
  await go({tier,status,plan:tier==='ordinary'?'foundation':'estate',signedIn:true},'/command-center');
  if(tier==='founding'||status==='active'){await page.waitForSelector('#access');const result=JSON.parse(await page.locator('#access').textContent());assert.equal(result.lifetime,tier==='founding');assert.equal(result.status,status);assert.equal(result.active,true);}
  else await page.waitForURL('**/billing');
  checks++;
 }
 await go({tier:'founding',status:'cancelled',plan:'estate',signedIn:true},'/community');await page.waitForSelector('#access');checks++;
 await go({tier:'ordinary',status:'active',plan:'foundation',signedIn:true},'/community');await page.getByTestId('plan-gate-page').waitFor();checks++;
 await go({tier:'founding',status:'cancelled',plan:'estate',signedIn:true},'/test-admin');await page.getByTestId('admin-gate-page').waitFor();assert.equal(await page.getByText('Forbidden admin content').count(),0);checks++;
 // Workspace names cannot forge effective lifetime or paid access.
 await go({tier:'ordinary',status:'inactive',plan:'foundation',signedIn:true,name:'Core Truth House'},'/command-center');await page.waitForURL('**/billing');checks++;
 // Legacy link reaches an authenticated claim without mounting paid content.
 await go({tier:'ordinary',status:'inactive',plan:'foundation',signedIn:true,fail:true},'/command-center?cohort_token=synthetic_claim&other=keep');await page.waitForURL('**/cohort/claim?other=keep');await page.getByRole('button',{name:'Claim access'}).click();await page.getByRole('alert').waitFor();assert.equal(new URL(page.url()).searchParams.has('cohort_token'),false);assert.equal(await page.evaluate(()=>sessionStorage.getItem('cth.cohort.claim')),'synthetic_claim');assert.equal(posts,1);checks++;
 for(const claimResult of [{success:false},{success:true,workspace_id:'other_workspace'}]){state.fail=false;state.claimResult=claimResult;await page.getByRole('button',{name:'Claim access'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>sessionStorage.getItem('cth.cohort.claim')),'synthetic_claim');checks++;}
 delete state.claimResult;state.fail=false;await page.getByRole('button',{name:'Claim access'}).click();await page.waitForURL('**/command-center?other=keep');await page.waitForSelector('#access');assert.equal(JSON.parse(await page.locator('#access').textContent()).lifetime,true);assert.equal(posts,4);assert.equal(await page.evaluate(()=>window.refreshes),1);assert.equal(await page.evaluate(()=>sessionStorage.getItem('cth.cohort.claim')),null);checks++;
 await go({tier:'ordinary',status:'inactive',plan:'foundation',signedIn:false},'/cohort/claim?cohort_token=synthetic_claim');await page.waitForURL('**/sign-in?**');assert.equal(new URL(page.url()).searchParams.get('redirect_url'),'/cohort/claim');assert.equal(await page.evaluate(()=>sessionStorage.getItem('cth.cohort.claim')),'synthetic_claim');assert.equal(posts,4);checks++;
 for(const [button,destination] of [['Already have an account? Sign in','/sign-in'],['Create Your Account','/sign-up']]){await go({tier:'ordinary',status:'inactive',plan:'foundation',signedIn:false},'/cohort/join#token=synthetic_claim');await page.getByRole('link',{name:button,exact:true}).click();await page.waitForURL(`**${destination}?**`);assert.equal(new URL(page.url()).searchParams.get('redirect_url'),'/cohort/claim');assert.equal(await page.evaluate(()=>sessionStorage.getItem('cth.cohort.claim')),'synthetic_claim');checks++;}
 // Public welcome never upgrades a URL/client claim into payment evidence.
 for(const [query,fixture] of [
  ['',{tier:'ordinary',status:'inactive',signedIn:false}],
  ['?success=true&payment_status=paid&verified=true&session_id=synthetic_session',{tier:'ordinary',status:'inactive',signedIn:false}],
  ['?payment_status=unpaid&session_id=synthetic_session',{tier:'ordinary',status:'inactive',signedIn:false}],
  ['?payment_status=pending&session_id=synthetic_session',{tier:'ordinary',status:'inactive',signedIn:false}],
  ['?application_id=other&session_id=mismatched',{tier:'ordinary',status:'inactive',signedIn:false}],
  ['?session_id=synthetic_session',{tier:'founding',status:'active',signedIn:true}],
 ]){
  const beforePosts=posts;
  await go({...fixture,plan:'estate'},'/cohort/welcome'+query);
  await page.locator('main[data-payment-state="unverifiable"]').waitFor();
  assert.equal(await page.getByRole('heading',{name:'Payment is not verified here.'}).count(),1);
  const content=await page.locator('main[data-payment-state="unverifiable"]').textContent();
  assert.equal(/Payment received|seat is confirmed|invite.*on its way/.test(content),false);
  assert.equal(content.includes('unpaid or still pending'),true);
  assert.equal(posts,beforePosts);checks++;
 }
 assert.equal(logs.some(value=>value.includes('synthetic_claim')),false);checks++;
 await context.close();
 console.log(`${checks} mounted Chromium checks passed against isolated mocked HTTP providers`);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
