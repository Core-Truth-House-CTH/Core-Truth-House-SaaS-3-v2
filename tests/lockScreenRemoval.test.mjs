import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { rolldown } from '../node_modules/rolldown/dist/index.mjs';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(new URL('../package.json', import.meta.url));
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const source = fs.readFileSync(path.join(root, 'src/ProtectedApp.jsx'), 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const declaration = ast.program.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'ProtectedRoutes');
assert.ok(declaration, 'Test uses the actual outer route component');
const registry = fs.readFileSync(path.join(root, 'src/navigation/pageRegistry.jsx'), 'utf8');

test('retired screen implementation and active triggers are absent', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/pages/LockScreen.jsx')), false);
  assert.doesNotMatch(source, /LockScreen|lock-screen/);
  for (const relative of ['src/config/appRoutes.js', 'src/navigation/pageRegistry.jsx', 'src/components/BillingWall.jsx']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, relative), 'utf8'), /LockScreen|lock-screen/);
  }
  assert.match(registry, /["']\/command-center["']/);
});

test('old URL reaches normal authenticated, billing or sign-in page without blank screen or crash', async () => {
  // Transpile route components only in memory; no application build/artifact,
  // server API, Clerk, Stripe, database, or provider is started or contacted.
  const mocks = {
    entry: `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Route,Routes,Navigate}from'react-router-dom';
      import AppRouter from '${root}/src/navigation/AppRouter.jsx';
      const useOptionalClerkAuth=()=>({isSignedIn:window.fixture.signedIn});
      const AppVersionBanner=()=>null,Chatbot=()=>null,Toaster=()=>null;
      const SignInPage=()=> <main data-page="sign-in">Sign in</main>;
      const SignUpPage=()=> <main data-page="sign-up">Sign up</main>;
      const AdminLoginRedirect=()=> <Navigate to="/sign-in" replace/>;
      const LoadingFallback=()=> <p>Loading</p>;const Suspense=React.Suspense;
      ${generate(declaration).code}
      createRoot(document.getElementById('root')).render(<BrowserRouter><ProtectedRoutes/></BrowserRouter>);`,
    auth: `import React from'react';import{Navigate}from'react-router-dom';export function ProtectedRoute({children}){return window.fixture.signedIn?children:<Navigate to="/sign-in" replace/>;}`,
    hooks: 'export const useUser=()=>({isLoaded:true,isSignedIn:window.fixture.signedIn});',
    plan: 'export const usePlan=()=>({loading:false,planResolved:true,hasActivePlan:window.fixture.paid});',
    planGate: 'export const PlanGate=({children})=>children;',
    registry: `import React from'react';export function getPageComponent(p){if(p==='/command-center')return ()=> <main data-page="command-center">Command Center</main>;if(p==='/billing')return ()=> <main data-page="billing">Billing</main>;return ()=> <main data-page="other">Other page</main>;}`,
    page: `import React from'react';export default function Page(){return <main data-page="unexpected">Unexpected page</main>;}`,
  };
  const bundle = await rolldown({
    input: 'mock:entry',
    plugins: [{
      name: 'offline-route-fixture',
      resolveId(id, importer) {
        if(id.startsWith('mock:'))return id;
        if(id === '../components/Auth')return 'mock:auth';
        if(id === '../components/PlanGate')return 'mock:planGate';
        if(id === '../hooks/useAuth')return 'mock:hooks';
        if(id === '../context/PlanContext')return 'mock:plan';
        if(id === './pageRegistry')return 'mock:registry';
        if(importer?.endsWith('/AppRouter.jsx') && /(?:pages\/|admin\/AdminRouter)/.test(id))return 'mock:page';
        if(['react','react-dom/client','react-router-dom','lucide-react'].includes(id))return require.resolve(id);
      },
      load(id){if(id.startsWith('mock:'))return {code:mocks[id.slice(5)],moduleType:'jsx'};},
    }],
    transform:{jsx:{runtime:'classic'}},logLevel:'silent',
  });
  const { output } = await bundle.generate({format:'iife'});
  await bundle.close();
  const code=output.find(x=>x.type==='chunk').code;
  const server=http.createServer((q,r)=>{
    r.setHeader('Content-Type',q.url==='/fixture.js'?'text/javascript':'text/html');
    r.end(q.url==='/fixture.js'?code:'<html><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
  });
  let browser;
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    for(const fixture of [{signedIn:true,paid:true,page:'command-center'},{signedIn:true,paid:false,page:'billing'},{signedIn:false,paid:false,page:'sign-in'}]){
      const context=await browser.newContext();
      const failures=[],external=[];
      await context.addInitScript(state=>{window.fixture=state;},fixture);
      await context.route('**/*',route=>{
        if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}
        return route.continue();
      });
      const page=await context.newPage();
      page.on('pageerror',error=>failures.push(error.message));
      for(const oldPath of ['/lock-screen','/lock-screen/','/lock-screen?from=bookmark']){
        await page.goto(origin+oldPath);
        await page.locator('main[data-page="'+fixture.page+'"]').waitFor();
        assert.equal(new URL(page.url()).pathname,'/'+fixture.page);
        assert.ok((await page.locator('main').innerText()).trim());
        await page.reload();
        await page.locator('main[data-page="'+fixture.page+'"]').waitFor();
      }
      assert.deepEqual(failures,[]);
      assert.deepEqual(external,[]);
      await context.close();
    }
  } finally {
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
