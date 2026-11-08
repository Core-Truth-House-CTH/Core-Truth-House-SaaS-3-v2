import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {rolldown} from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import {chromium} from '/root/pw/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire('/root/cth-workspace-visual-pass/package.json');
const iconNames=['AlertTriangle','ArrowRight','BriefcaseBusiness','CheckCircle2','ChevronRight','CircleDot','Compass','Gauge','Home','Lightbulb','Megaphone','MessageSquareText','PenTool','Radar','RefreshCw','SearchCheck','ShieldCheck','Sparkles','TrendingUp','Workflow','X'];
const iconModule=iconNames.map(name=>'export const '+name+'=()=>null;').join('');
const mocks={
 entry:`import React from'react';import{createRoot}from'react-dom/client';import Page from'${root}/src/pages/CommandCenterNext.jsx';createRoot(document.getElementById('root')).render(<Page/>);`,
 router:`export function useNavigate(){return(route)=>{window.__navigatedTo=route}};`,
 icons:iconModule,
 authShell:`export default function AuthShell({children}){return children}`,
 drawer:`export default function AskTheHouseDrawer(){return null}`,
 askContext:`export function useAskTheHouse(){return{isOpen:false,open:()=>{},close:()=>{},sectionId:null}}`,
 healthContext:`export function useBrandHealth(){return{healthData:null}}`,
 workspaceContext:`export function useWorkspace(){return{activeWorkspaceId:'synthetic-workspace',activeWorkspace:{name:'Synthetic Workspace'}}}`,
 planContext:`export function usePlan(){return{isAdmin:new URLSearchParams(location.search).get('admin')==='1'}}`,
 authHook:`export function useUser(){return{user:{id:'synthetic-user',firstName:'Test'}}}`,
 api:`const api={get:async()=>{const e=new Error('synthetic unavailable');e.status=503;throw e}};export default api;`,
 apiPaths:`const API_PATHS={onboarding:{progress:'/progress'},audit:{latest:'/audit'},workspace:{stats:(id)=>'/stats/'+id},buyerSignals:{list:()=>'/signals'},campaigns:{list:'/campaigns'},crm:{dashboard:'/crm'},analytics:{overview:'/analytics'}};export default API_PATHS;`,
 overview:`export async function fetchCommandCenterOverview(){const existing=new URLSearchParams(location.search).get('mode')==='existing';if(!existing)return{available:false};return{available:true,data:{brandHealth:{score:42,status:'Synthetic health'},buyerSignals:{confirmed:0,unconfirmed:0,recent:[]},openDecisions:{count:0},activeWork:{count:0,campaignCount:0,items:[]},systemAlerts:{count:0},brandHouse:{foundation:0,structure:0,house:0,estate:0},nextMove:{title:'Existing recommendation',body:'Preserve this recommendation.',action:'Open existing recommendation',route:'/existing-recommendation'},dailyIntelligence:[],recentProgress:[]}}}`,
};
const bundle=await rolldown({input:'mock:entry',plugins:[{
 name:'command-center-isolated-test',
 resolveId(source){
  if(source.startsWith('mock:'))return source;
  if(source==='react'||source==='react-dom/client')return req.resolve(source);
  const mapping={
   'react-router-dom':'mock:router',
   'lucide-react':'mock:icons',
   '../components/AuthShell':'mock:authShell',
   '../components/ask-the-house/AskTheHouseDrawer':'mock:drawer',
   '../context/AskTheHouseContext':'mock:askContext',
   '../context/BrandHealthContext':'mock:healthContext',
   '../context/WorkspaceContext':'mock:workspaceContext',
   '../context/PlanContext':'mock:planContext',
   '../hooks/useAuth':'mock:authHook',
   '../lib/apiClient':'mock:api',
   '../lib/apiPaths':'mock:apiPaths',
   '../lib/commandCenterOverview':'mock:overview',
  };
  if(mapping[source])return mapping[source];
  if(source.endsWith('.css'))return'mock:css';
 },
 load(id){
  if(id.endsWith('/CommandCenterNext.jsx'))return{code:req('node:fs').readFileSync(id,'utf8'),moduleType:'jsx'};
  if(id.startsWith('mock:'))return{code:id==='mock:css'?'':mocks[id.slice(5)],moduleType:'jsx'};
 },
}],transform:{jsx:{runtime:'classic'}},logLevel:'silent'});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const code=output.find(item=>item.type==='chunk').code;
const server=http.createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?code:'<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,checks=0;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const base='http://127.0.0.1:'+server.address().port;
 const nonAdmin=await browser.newPage();
 await nonAdmin.goto(base+'/?mode=fallback&admin=0');
 await nonAdmin.getByRole('heading',{name:'Start here: Brand Foundation'}).waitFor({state:'visible'});
 await nonAdmin.waitForFunction(()=>document.querySelector('.ccn-data-source')===null);
 assert.equal(await nonAdmin.getByText(/The consolidated Command Center backend is pending/).count(),0);checks++;
 const admin=await browser.newPage();
 await admin.goto(base+'/?mode=fallback&admin=1');
 await admin.getByText('The consolidated Command Center backend is pending. This preview is using verified existing workspace sources and leaves unsupported metrics blank.').waitFor({state:'visible'});
 assert.equal(await admin.locator('.ccn-data-source').count(),1);checks++;
 const noMove=await browser.newPage();
 await noMove.goto(base+'/?mode=fallback&admin=0');
 await noMove.getByRole('heading',{name:'Start here: Brand Foundation'}).waitFor({state:'visible'});
 await noMove.getByRole('button',{name:'Open Brand Foundation'}).evaluate(el=>el.click());
 await noMove.waitForFunction(()=>window.__navigatedTo==='/brand-foundation');
 checks+=2;
 const existing=await browser.newPage();
 await existing.goto(base+'/?mode=existing&admin=0');
 await existing.getByRole('heading',{name:'Existing recommendation'}).waitFor({state:'visible'});
 assert.equal(await existing.getByRole('heading',{name:'Start here: Brand Foundation'}).count(),0);
 await existing.getByRole('button',{name:'Open existing recommendation'}).evaluate(el=>el.click());
 await existing.waitForFunction(()=>window.__navigatedTo==='/existing-recommendation');
 checks+=2;
 console.log(checks+' mounted mocked Command Center checks passed');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
