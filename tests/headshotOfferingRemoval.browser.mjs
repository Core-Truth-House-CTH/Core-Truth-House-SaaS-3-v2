import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from '/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs';
import { chromium } from '/root/pw/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire('/root/cth-workspace-visual-pass/package.json');
const studioUrl = 'https://ais-pre-zecc37ofjq7mrbnqkroaxi-39918502251.us-east1.run.app';
const apiRequests = [];
let code = '';
const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/headshots/verify/')) {
    apiRequests.push(request.url);
    const token = request.url.split('/').pop();
    response.setHeader('Content-Type', 'application/json');
    if (token === 'synthetic-valid') {
      response.statusCode = 200;
      response.end(JSON.stringify({ valid: true, studio_url: studioUrl }));
    } else {
      response.statusCode = 404;
      response.end(JSON.stringify({ detail: 'Invalid access link.' }));
    }
    return;
  }
  response.setHeader('Content-Type', request.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  response.end(request.url === '/bundle.js' ? code : '<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;

const entry = [
  'import React from "react";',
  'import {createRoot} from "react-dom/client";',
  'import {BrowserRouter,Routes,Route} from "react-router-dom";',
  'import Studios from "' + root + '/src/pages/Studios.jsx";',
  'import PublicFooter from "' + root + '/src/components/public/PublicFooter.jsx";',
  'import StudioAccess from "' + root + '/src/pages/StudioAccess.jsx";',
  'function Missing(){return <main><h1>Page not found</h1></main>}',
  'createRoot(document.getElementById("root")).render(<BrowserRouter><Routes>',
  '<Route path="/studios" element={<Studios/>}/>',
  '<Route path="/footer" element={<PublicFooter/>}/>',
  '<Route path="/studio/:token" element={<StudioAccess/>}/>',
  '<Route path="*" element={<Missing/>}/>',
  '</Routes></BrowserRouter>);',
].join('');
const bundle = await rolldown({
  input: 'mock:entry',
  plugins: [{
    name: 'headshot-offering-removal',
    resolveId(source) {
      if (source === 'mock:entry') return source;
      if (source.endsWith('/components/Layout')) return 'mock:layout';
      if (['react', 'react-dom/client', 'react-router-dom', 'lucide-react'].includes(source)) return req.resolve(source);
    },
    load(id) {
      if (id === 'mock:entry') return { code: entry, moduleType: 'jsx' };
      if (id === 'mock:layout') return { code: 'import React from "react";export function DashboardLayout({children}){return <div>{children}</div>}', moduleType: 'jsx' };
    },
    transform(source, id) {
      if (id.endsWith('/src/pages/StudioAccess.jsx')) {
        return { code: source.replaceAll('import.meta.env.VITE_API_BASE_URL', JSON.stringify(base)), moduleType: 'jsx' };
      }
    },
  }],
  transform: { jsx: { runtime: 'classic' } },
  logLevel: 'silent',
});
const generated = await bundle.generate({ format: 'iife' });
await bundle.close();
code = generated.output.find(item => item.type === 'chunk').code;

let browser;
let checks = 0;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(studioUrl + '/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Synthetic legacy access page</p>' }));

  await page.goto(base + '/studios');
  assert.equal(await page.getByRole('heading', { name: 'Studios' }).count(), 1);
  assert.equal(await page.getByText('AI Headshot Generator', { exact: true }).count(), 0);
  assert.equal(await page.locator('[data-testid="studio-card-visual-studio"]').count(), 1);
  checks += 3;

  await page.goto(base + '/footer');
  assert.equal(await page.getByRole('link', { name: 'AI Headshot Generator' }).count(), 0);
  assert.equal(await page.getByRole('link', { name: 'The Store' }).count(), 1);
  checks += 2;

  await page.goto(base + '/headshots');
  assert.equal(await page.getByRole('heading', { name: 'Page not found' }).count(), 1);
  await page.goto(base + '/studios/headshot');
  assert.equal(await page.getByRole('heading', { name: 'Page not found' }).count(), 1);
  checks += 2;

  await page.goto(base + '/studio/synthetic-invalid');
  await page.getByRole('heading', { name: 'Access Link Unavailable' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Contact Support' }).getAttribute('href'), '/contact');
  assert.equal(await page.getByText(/purchase access|get access/i).count(), 0);
  assert.equal(apiRequests.at(-1), '/api/headshots/verify/synthetic-invalid');
  checks += 4;

  await page.goto(base + '/studio/synthetic-valid');
  const iframe = page.locator('iframe[title="The Presence Studio"]');
  await iframe.waitFor();
  assert.equal(await iframe.getAttribute('src'), studioUrl);
  assert.equal(apiRequests.at(-1), '/api/headshots/verify/synthetic-valid');
  checks += 2;

  const sourceChecks = [
    ['src/navigation/AppRouter.jsx', /<Route path="\/studio\/:token"/],
    ['src/navigation/AppRouter.jsx', /<Route path="\/headshots"/],
    ['src/config/appRoutes.js', /path: "\/studios\/headshot"/],
    ['src/navigation/pageRegistry.jsx', /"\/studios\/headshot"/],
    ['src/pages/estate/EstateShell.jsx', /AI Headshot Generator/],
    ['src/pages/StudiosVisual.jsx', /Upload your headshot|Anchors the visual to your face/],
    ['public/llms.txt', /AI Headshot Generator/],
  ];
  for (const [file, pattern] of sourceChecks) {
    const content = await readFile(path.join(root, file), 'utf8');
    const shouldExist = file === 'src/navigation/AppRouter.jsx' && pattern.source.includes('studio');
    assert.equal(pattern.test(content), shouldExist, file + ' route/marketing check');
    checks++;
  }
  assert.deepEqual(errors, []);
  checks++;
  console.log(checks + ' mounted Chromium/source checks passed; external studio was stubbed and API responses were synthetic');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
