// Billing page (Agent Tasks 21): Founding Cohort members see their plan and credits, never plan cards; credits are
// read from /api/usage/summary (monthly, purchased, total); the Credit packs section shows only while packs are on sale.
// Renders the real src/pages/Billing.jsx in a browser with a stand-in API. Not a live-server test.
// Screenshots go to $SHOTS (default /tmp/cth-billing-lifetime).
import http from "node:http";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rolldown } from "/root/cth-workspace-visual-pass/node_modules/rolldown/dist/index.mjs";
import { chromium } from "/root/pw/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire("/root/cth-workspace-visual-pass/package.json");
const fs = req("node:fs");
const SHOTS = process.env.SHOTS || "/tmp/cth-billing-lifetime";
fs.mkdirSync(SHOTS, { recursive: true });

const mocks = {
  entry: `import React from"react";import{createRoot}from"react-dom/client";import{MemoryRouter}from"react-router-dom";import Billing from"${root}/src/pages/Billing.jsx";
    createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={["/billing"]}><Billing/></MemoryRouter>);`,
  layout: `import React from"react";export function DashboardLayout({children}){return <div>{children}</div>}`,
  workspace: `export function useWorkspace(){return{activeWorkspaceId:"ws-demo"}}`,
  plan: `const q=new URLSearchParams(location.search);export function usePlan(){const lifetime=q.get("member")==="lifetime";return{hasActivePlan:true,hasLifetimeAccess:lifetime,refreshPlan:async()=>null}}`,
  auth: `export function useUser(){return{user:{id:"u1"}}}export function useClerk(){return{signOut:async()=>{}}}`,
  api: `const q=new URLSearchParams(location.search);window.__calls=[];
    const PLANS=["foundation","structure","house","estate"].map((id,i)=>({id,name:id[0].toUpperCase()+id.slice(1),monthly_price_cents:[4700,9700,29700,69700][i],annual_price_cents:null,monthly_credits:100}));
    const PACKS=[["pack_200","The Brief",200,2900],["pack_500","The Workshop",500,5900],["pack_1000","The Build",1000,9900]].map(([id,name,credits,price_cents])=>({id,name,credits,price_cents}));
    const USAGE={allowance_remaining:900,purchased_credit_balance:500,credit_balance:1400,refill_on:"2026-12-13",unlimited:false};
    export default{async get(p,opts){window.__calls.push({p,opts});
      if(p==="/api/billing/plans")return{plans:PLANS};
      if(p==="/api/billing/credit-packs")return{packs:PACKS,total:3,checkout_enabled:q.get("packs")==="open"};
      if(p==="/api/billing/summary")return{plan_id:q.get("member")==="lifetime"?"estate":"house",subscription_status:q.get("member")==="lifetime"?"inactive":"active",credits:{available:0},available_credits:0};
      if(p==="/api/usage/summary"){if(q.get("usage")==="fail")throw Object.assign(new Error("Workspace credit account not found"),{status:404});return q.get("usage")==="unlimited"?{...USAGE,unlimited:true}:USAGE}
      throw new Error("unexpected GET "+p)},async post(p){window.__calls.push({p});throw new Error("no checkout in this test")}};`,
};
const bundle = await rolldown({ input: "mock:entry", plugins: [{ name: "billing-isolated",
  resolveId(s) {
    if (s.startsWith("mock:")) return s;
    if (["react", "react-dom/client", "react-router-dom", "lucide-react"].includes(s)) return req.resolve(s);
    const m = { "../components/Layout": "mock:layout", "../context/WorkspaceContext": "mock:workspace", "../context/PlanContext": "mock:plan",
      "../hooks/useAuth": "mock:auth", "../lib/apiClient": "mock:api" };
    if (m[s]) return m[s];
  },
  load(id) {
    if (id.startsWith(root + "/src/") && /\.jsx$/.test(id)) return { code: fs.readFileSync(id, "utf8"), moduleType: "jsx" };
    if (id.startsWith("mock:")) return { code: mocks[id.slice(5)], moduleType: "jsx" };
  } }], transform: { jsx: { runtime: "classic" } }, logLevel: "silent" });
const { output } = await bundle.generate({ format: "iife" }); await bundle.close();
const js = output.find((x) => x.type === "chunk").code;
const server = http.createServer((q, s) => {
  const u = q.url.split("?")[0];
  if (u === "/bundle.js") { s.setHeader("Content-Type", "text/javascript"); s.end(js); return; }
  if (u === "/styles.css") {
    s.setHeader("Content-Type", "text/css");
    const files = fs.readdirSync(path.join(root, "dist-candidate/assets")).filter((f) => f.endsWith(".css"));
    if (!files.length) throw new Error("build dist-candidate first");
    s.end(files.map((f) => fs.readFileSync(path.join(root, "dist-candidate/assets", f), "utf8")).join("\n")); return;
  }
  s.setHeader("Content-Type", "text/html");
  s.end('<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const results = []; let browser;
const check = async (name, fn) => { try { await fn(); results.push([name, true]); console.log("PASS  " + name); } catch (e) { results.push([name, false]); console.log("FAIL  " + name + "  -- " + String(e.message).replace(/\s+/g, " ").slice(0, 300)); } };
try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const base = "http://127.0.0.1:" + server.address().port;
  const open = async (qs, w = 1440, h = 1000) => {
    const p = await browser.newPage({ viewport: { width: w, height: h } }); p.errors = [];
    p.on("pageerror", (e) => p.errors.push(e.message));
    await p.goto(base + "/?" + qs); await p.getByTestId("billing-credits").waitFor(); return p;
  };
  const text = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
  const credits = async (p) => (await p.getByTestId("billing-credits").innerText()).replace(/\s+/g, " ");
  const shot = (p, name) => p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

  await check("L1 Founding Cohort member, packs closed: plan label, split credits, no plan cards, no packs section", async () => {
    const p = await open("member=lifetime");
    const t = await text(p);
    assert.ok(t.includes("Founding Cohort · Estate, lifetime access"), t);
    assert.equal(await p.getByRole("button", { name: /choose plan/i }).count(), 0);
    assert.equal(await p.getByRole("button", { name: "Monthly" }).count(), 0);
    assert.ok(!/\$697/.test(t) && !/Current plan/.test(t), t);
    assert.ok(!/billing status/i.test(t) && !/\binactive\b/i.test(t), "no subscription status for lifetime members: " + t);
    const c = await credits(p);
    assert.ok(/Monthly credits 900 Refills on December 13/i.test(c), c);
    assert.ok(/Purchased credits 500/i.test(c) && /Total 1,400/i.test(c), c);
    assert.equal(await p.getByRole("heading", { name: "Credit packs" }).count(), 0);
    assert.ok(!/not open yet/i.test(t) && !/Buy credits/.test(t), t);
    assert.equal(await p.locator("#credit-packs").count(), 0);
    assert.deepEqual(p.errors, []);
    await shot(p, "lifetime-packs-closed"); await p.close();
  });
  await check("L2 Founding Cohort member, packs open: the three packs show, still no plan cards", async () => {
    const p = await open("member=lifetime&packs=open");
    await p.getByRole("heading", { name: "Credit packs" }).waitFor();
    assert.equal(await p.getByRole("button", { name: "Buy credits" }).count(), 3);
    const t = (await text(p)).toLowerCase();
    assert.ok(t.includes("the brief") && t.includes("the workshop") && t.includes("the build"), t);
    assert.equal(await p.getByRole("button", { name: /choose plan/i }).count(), 0);
    await shot(p, "lifetime-packs-open"); await p.close();
  });
  await check("S1 monthly plan member: plan cards stay, credits are the real balance (never 0), packs hidden while closed", async () => {
    const p = await open("member=subscriber");
    assert.ok((await p.getByRole("button", { name: /choose plan/i }).count()) >= 1);
    const t = await text(p);
    assert.ok(!t.includes("Founding Cohort"), t);
    assert.ok(/Status active/i.test(t), "subscribers still see their status: " + t);
    assert.ok(/Total 1,400/i.test(await credits(p)));
    assert.equal(await p.getByRole("heading", { name: "Credit packs" }).count(), 0);
    await shot(p, "subscriber-packs-closed"); await p.close();
  });
  await check("U1 the credit-exempt workspace reads Unlimited", async () => {
    const p = await open("member=lifetime&usage=unlimited");
    assert.ok(/AI credits Unlimited/i.test(await credits(p)));
    await p.close();
  });
  await check("E1 usage summary fails: the credits card says so, the rest of the page still loads, no 0 shown", async () => {
    const p = await open("member=lifetime&usage=fail");
    const c = await credits(p);
    assert.ok(/could not be loaded/i.test(c) && !/\b0\b/.test(c), c);
    assert.ok((await text(p)).includes("Founding Cohort · Estate, lifetime access"));
    await p.close();
  });
  await check("R1 balances are read from /api/usage/summary for the active workspace", async () => {
    const p = await open("member=lifetime");
    const calls = await p.evaluate(() => window.__calls);
    const usage = calls.filter((c) => c.p === "/api/usage/summary");
    assert.equal(usage.length, 1);
    assert.deepEqual(usage[0].opts, { params: { workspace_id: "ws-demo" } });
    await p.close();
  });
  await check("M phone widths 390 and 320: no sideways scrolling", async () => {
    for (const w of [390, 320]) for (const qs of ["member=lifetime", "member=lifetime&packs=open"]) {
      const p = await open(qs, w, 844); await p.waitForTimeout(200);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `${qs} @${w}: overflow ${over}px`);
      if (w === 390) await shot(p, `${qs.replace(/[=&]/g, "-")}-phone`);
      await p.close();
    }
  });
} finally {
  if (browser) await browser.close();
  server.close();
}
const failed = results.filter((r) => !r[1]).length;
console.log(`SUMMARY: ${results.length - failed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);
