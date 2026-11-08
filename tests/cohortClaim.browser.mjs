import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {rolldown} from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import {chromium} from '/root/pw/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const workspaceSource=fs.readFileSync(path.join(root,'src/context/WorkspaceContext.jsx'),'utf8');
assert.match(workspaceSource,/apiClient\.get\("\/api\/user\/plan"/);
assert.match(workspaceSource,/"X-Workspace-ID": workspaceId/);
assert.match(workspaceSource,/identity\?\.user_id/);
assert.match(workspaceSource,/isOwnedByCurrentUser:/);
assert.doesNotMatch(workspaceSource,/isOwnedByCurrentUser:[^\n]*user\?\.id/);
const mocks={
  entry:`import React from'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import Page from'${root}/src/pages/CohortClaimPage.jsx';const root=createRoot(document.getElementById('root'));window.__render=()=>root.render(React.createElement(BrowserRouter,null,React.createElement(Page)));window.__render();`,
  auth:`export function useUser(){return{user:{id:'user-1'}}};`,
  workspace:`export function useWorkspace(){return window.__workspace};`,
  plan:`export function usePlan(){return{refreshPlan:async()=>{}}};`,
  api:`export default{post:async()=>({})};`,
  lifetime:`export function readClaimToken(){return'test-claim'};export function forgetClaimToken(){};export async function claimCohortSeat(){return{}};`,
  router:`export function useNavigate(){return()=>{}};export function useSearchParams(){return[new URLSearchParams('cohort_token=test') ]};export const BrowserRouter=({children})=>children;`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{
  name:'cohort-claim-test-isolation',
  resolveId(source){
    if(source.startsWith('mock:'))return source;
    if(source==='../hooks/useAuth')return'mock:auth';
    if(source==='../context/WorkspaceContext')return'mock:workspace';
    if(source==='../context/PlanContext')return'mock:plan';
    if(source==='../lib/apiClient')return'mock:api';
    if(source==='../lib/lifetimeAccess.mjs')return'mock:lifetime';
    if(source==='react-router-dom')return'mock:router';
    if(['react','react-dom/client'].includes(source))return req.resolve(source);
  },
  load(id){
    if(id.endsWith('/CohortClaimPage.jsx'))return{code:req('node:fs').readFileSync(id,'utf8'),moduleType:'jsx'};
    if(id.startsWith('mock:'))return{code:mocks[id.slice(5)],moduleType:'jsx'};
  },
}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const code=output.find(item=>item.type==='chunk').code;
const server=http.createServer((request,response)=>{
  response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
  response.end(request.url==='/bundle.js'?code:'<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,checks=0;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  page.on('pageerror',error=>console.error('PAGEERROR',error.message));
  page.on('console',message=>{if(message.type()==='error')console.error('BROWSER',message.text())});
  await page.addInitScript(()=>{
    const member={id:'member-ws',name:'Member workspace',owner_id:'internal-other',isOwnedByCurrentUser:false};
    const owned={id:'owned-ws',name:'Owned workspace',owner_id:'internal-user',isOwnedByCurrentUser:true};
    window.__workspace={activeWorkspaceId:null,activeWorkspace:null,workspaces:[],loading:true,initialized:false,error:null,
      selectWorkspace:(id)=>{const ws=window.__workspace.workspaces.find(item=>item.id===id);window.__workspace.activeWorkspace=ws;window.__workspace.activeWorkspaceId=id;window.__render()},
      refreshWorkspaces:async()=>{window.__refreshCalls=(window.__refreshCalls||0)+1;window.__workspace={...window.__workspace,activeWorkspaceId:owned.id,activeWorkspace:owned,workspaces:[owned],loading:false,initialized:true,error:null};window.__render()}};
    window.__fixtures={member,owned};
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  console.log('CLAIM_PAGE_BODY',await page.locator('body').innerText());
  await page.getByRole('status').getByText('Setting up your workspace…').waitFor();
  checks++;

  await page.evaluate(()=>{window.__workspace={...window.__workspace,loading:false,initialized:true,error:new Error('offline')};window.__render()});
  await page.getByRole('alert').getByText("We couldn't load your workspace.").waitFor();
  await page.getByRole('button',{name:'Retry'}).click();
  await page.getByText('Estate access will be added to: Owned workspace').waitFor();
  assert.equal(await page.evaluate(()=>window.__refreshCalls),1);
  checks++;

  await page.evaluate(()=>{const owned=window.__fixtures.owned;window.__workspace={...window.__workspace,activeWorkspaceId:owned.id,activeWorkspace:owned,workspaces:[owned],loading:false,initialized:true,error:null};window.__render()});
  await page.getByText('Estate access will be added to: Owned workspace').waitFor();
  assert.equal(await page.getByRole('button',{name:'Claim access'}).isEnabled(),true);
  checks++;

  await page.evaluate(()=>{const{member,owned}=window.__fixtures;window.__workspace={...window.__workspace,activeWorkspaceId:member.id,activeWorkspace:member,workspaces:[member,owned],loading:false,initialized:true,error:null};window.__render()});
  await page.getByRole('alert').getByText('Founding access must go to a workspace you own.').waitFor();
  assert.equal(await page.getByRole('button',{name:'Claim access'}).isDisabled(),true);
  await page.getByRole('combobox',{name:'Choose a workspace you own'}).selectOption('owned-ws');
  await page.getByText('Estate access will be added to: Owned workspace').waitFor();
  checks++;

  await page.evaluate(()=>{const member=window.__fixtures.member;window.__workspace={...window.__workspace,activeWorkspaceId:member.id,activeWorkspace:member,workspaces:[member],loading:false,initialized:true,error:null};window.__render()});
  await page.getByText("Founding access must go to a workspace you own. Email hello@coretruthhouse.com and we'll set it up for you within 1 business day. Keep this link; it stays valid.").waitFor();
  assert.equal(await page.getByRole('button',{name:'Create my workspace'}).count(),0);
  checks++;
  console.log(`${checks} cohort claim Chromium state checks passed`);
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
