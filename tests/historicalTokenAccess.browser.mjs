import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from '/root/pw/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..',process.env.DIST_DIR||'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 let file=path.join(root,pathname.replace(/^\/+/,''));
 if(!file.startsWith(root)) { res.writeHead(400).end(); return; }
 try { if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html'); } catch {}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()) file=path.join(root,'index.html');
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 const verified=[];
 await page.route('**/*',async route=>{
  const u=route.request().url();
  if(u.startsWith(base)){ await route.continue(); return; }
  if(u==='https://api.coretruthhouse.com/api/headshots/verify/synthetic-token'){
   verified.push(u); await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({studio_url:'https://synthetic-studio.invalid/access'})}); return;
  }
  if(u==='https://synthetic-studio.invalid/access') { await route.fulfill({status:200,contentType:'text/html',body:'<title>Mock studio</title><p>synthetic</p>'}); return; }
  await route.abort();
 });
 await page.goto(`${base}/studio/synthetic-token`,{waitUntil:'domcontentloaded'});
 await page.locator('iframe[title="The Presence Studio"]').waitFor({timeout:10000});
 assert.deepEqual(verified,['https://api.coretruthhouse.com/api/headshots/verify/synthetic-token']);
 assert.equal(await page.locator('iframe[title="The Presence Studio"]').getAttribute('src'),'https://synthetic-studio.invalid/access');
 console.log('PASS synthetic valid historical token reaches expected API URL and embeds returned studio URL');
 await page.unrouteAll({behavior:'wait'});
 await page.route('**/*',async route=>{
  const u=route.request().url();
  if(u.startsWith(base)){ await route.continue(); return; }
  if(u==='https://api.coretruthhouse.com/api/headshots/verify/synthetic-token'){
   verified.push(u); await route.fulfill({status:404,contentType:'application/json',body:'{}'}); return;
  }
  await route.abort();
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Access Link Unavailable'}).waitFor({timeout:10000});
 assert.equal(await page.getByRole('link',{name:'Contact Support'}).count(),1);
 assert.equal(verified.length,2);
 console.log('PASS synthetic invalid token fails closed with support contact; no external provider requests');
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }