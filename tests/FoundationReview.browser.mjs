// Foundation V03 screens (status/submit cards, Review and Lock table, reviewer queue, Diagnostic Insight).
// Renders the real components in a browser with a stateful stand-in for the API. Not a live-server test.
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
const apiMock = fs.readFileSync(path.join(root, "tests/foundationReviewApiMock.jsx"), "utf8");
const mocks = {
  entry: `import React from"react";import{createRoot}from"react-dom/client";import{MemoryRouter}from"react-router-dom";import{BrandAuditPage,ReviewLockPage}from"${root}/src/pages/FoundationPages.jsx";import Core from"${root}/src/pages/BrandFoundation.jsx";const key=new URLSearchParams(location.search).get("page")||"core";const pages={audit:BrandAuditPage,core:Core,review:ReviewLockPage};const paths={audit:"/brand-audit",core:"/brand-foundation",review:"/foundation/review-lock"};const Page=pages[key];createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={[paths[key]]}><Page/></MemoryRouter>);`,
  drawer: `export default function AskTheHouseDrawer(){return null}`,
  ask: `export function useAskTheHouse(){return{isOpen:false,open:()=>{},close:()=>{},sectionId:null}}export function getSurfaceFromPath(){return"brand_foundation"}`,
  paths: `export const API_PATHS={audience:{avatars:"/api/audience/avatars",avatarById:(id)=>"/api/audience/avatars/"+id}};export default API_PATHS;`,
  workspace: `export function useWorkspace(){return{activeWorkspaceId:"ws-demo",activeWorkspace:{name:"Demo"}}}`,
  auth: `export function useAuth(){return{userId:"u1"}}export function useUser(){return{user:{id:"u1",firstName:"A",fullName:"A B",imageUrl:""}}}export function useClerk(){return{signOut:()=>{}}}`,
  brandHealth: `export function useBrandHealth(){return{refresh:()=>{}}}`,
  plan: `export function usePlan(){return{plan:"estate"}}`,
  planAccess: `export const PLAN_INFO={estate:{name:"Estate"},foundation:{name:"Foundation"}};export function normalizePlan(v){return v||"foundation"}`,
  notification: `export function NotificationBell(){return null}`,
  shellContext: `import React from"react";const c=React.createContext(false);export const AUTH_SHELL_OWNS_BELL=true;export default c`,
  tooltip: `export function SidebarTooltip({children}){return children}`,
  legacy: `export default function Legacy(){return <div>Legacy</div>}`,
  api: apiMock,
};
const real = (rel) => root + "/src/" + rel;
const bundle = await rolldown({ input: "mock:entry", plugins: [{ name: "review-isolated",
  resolveId(s) {
    if (s.startsWith("mock:")) return s;
    if (["react", "react-dom/client", "react-router-dom", "lucide-react"].includes(s)) return req.resolve(s);
    const m = { "../components/AuthShell": real("components/AuthShell.jsx"), "../components/ask-the-house/AskTheHouseDrawer": "mock:drawer", "../context/AskTheHouseContext": "mock:ask",
      "../context/WorkspaceContext": "mock:workspace", "../context/BrandHealthContext": "mock:brandHealth", "../hooks/useAuth": "mock:auth", "../context/PlanContext": "mock:plan",
      "../config/planAccess": "mock:planAccess", "./NotificationBell": "mock:notification", "../context/AuthShellContext": "mock:shellContext", "./ui/tooltip": "mock:tooltip",
      "../lib/apiClient": "mock:api", "../../lib/apiClient": "mock:api", "../lib/apiPaths": "mock:paths", "./FoundationSectionLayout": real("pages/FoundationSectionLayout.jsx"),
      "./BrandFoundation": real("pages/BrandFoundation.jsx"), "./BrandAudit": "mock:legacy", "./Audience": "mock:legacy", "./BrandPositioning": "mock:legacy",
      "./MessagingStructure": "mock:legacy", "./IdentityStudio": "mock:legacy",
      "../components/Foundation/FoundationReview": real("components/Foundation/FoundationReview.jsx"), "../../lib/foundationSections.mjs": real("lib/foundationSections.mjs") };
    if (m[s]) return m[s];
    if (s.endsWith(".css")) return "mock:css";
  },
  load(id) {
    if (id.startsWith(root + "/src/") && /\.(jsx)$/.test(id)) return { code: fs.readFileSync(id, "utf8"), moduleType: "jsx" };
    if (id.startsWith("mock:")) { if (id === "mock:css") return { code: "", moduleType: "js" }; return { code: mocks[id.slice(5)], moduleType: "jsx" }; }
  } }], transform: { jsx: { runtime: "classic" } }, logLevel: "silent" });
const { output } = await bundle.generate({ format: "iife" }); await bundle.close();
const js = output.find((x) => x.type === "chunk").code;
const server = http.createServer((q, s) => {
  const u = q.url.split("?")[0];
  if (u === "/bundle.js") { s.setHeader("Content-Type", "text/javascript"); s.end(js); return; }
  if (u === "/styles.css") {
    s.setHeader("Content-Type", "text/css");
    const files = fs.readdirSync(path.join(root, "dist-candidate/assets")).filter((f) => f.endsWith(".css"));
    s.end(files.map((f) => fs.readFileSync(path.join(root, "dist-candidate/assets", f), "utf8")).join("\n")); return;
  }
  if (u === "/estate-assets/fonts/fonts.css") { s.setHeader("Content-Type", "text/css"); s.end(fs.readFileSync(path.join(root, "public/estate-assets/fonts/fonts.css"), "utf8")); return; }
  if (u.startsWith("/estate-assets/fonts/") && u.endsWith(".woff2")) { s.setHeader("Content-Type", "font/woff2"); s.end(fs.readFileSync(path.join(root, "public/estate-assets/fonts", decodeURIComponent(u.split("/").pop())))); return; }
  s.setHeader("Content-Type", "text/html");
  s.end('<html><head><meta charset="UTF-8"><link rel="stylesheet" href="/estate-assets/fonts/fonts.css"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const results = []; let browser;
const check = async (name, fn) => { try { await fn(); results.push([name, true]); console.log("PASS  " + name); } catch (e) { results.push([name, false]); console.log("FAIL  " + name + "  -- " + String(e.message).split("\n")[0].slice(0, 220)); } };
try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const base = "http://127.0.0.1:" + server.address().port;
  const open = async (qs, w = 1366, h = 900) => { const p = await browser.newPage({ viewport: { width: w, height: h } }); p.errors = []; p.on("pageerror", (e) => p.errors.push(e.message)); p.on("console", (m) => { if (m.type() === "error") p.errors.push(m.text()); }); await p.goto(base + "/?" + qs); return p; };
  const card = (p) => p.locator(".fv3-status");
  const calls = (p) => p.evaluate(() => window.__calls || []);

  await check("S1 draft with missing fields: badge Draft, Submit disabled, says what is still needed", async () => {
    const p = await open("page=core&s=draft_incomplete"); await card(p).waitFor();
    assert.match(await card(p).innerText(), /Draft/);
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).isDisabled(), true);
    assert.match(await card(p).innerText(), /Core values \(at least 3; you have 2\)/);
    assert.equal((await calls(p)).filter((c) => c.m === "POST").length, 0);
    await p.screenshot({ path: "/tmp/cth-review-core-incomplete.png", fullPage: true }); assert.deepEqual(p.errors, []); await p.close();
  });
  await check("S2 complete draft: Submit works, becomes Submitted, Withdraw appears, Submit gone", async () => {
    const p = await open("page=core&s=draft_complete"); await card(p).waitFor();
    await card(p).getByRole("button", { name: "Submit for review" }).click();
    await card(p).getByText("Submitted for review").first().waitFor();
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).count(), 0);
    await card(p).getByRole("button", { name: /Withdraw/ }).waitFor();
    assert.ok((await calls(p)).some((c) => c.m === "POST" && c.p === "/api/foundation/sections/core_truth/submit"));
    await p.screenshot({ path: "/tmp/cth-review-core-submitted.png", fullPage: true });
    await card(p).getByRole("button", { name: /Withdraw/ }).click(); await card(p).getByRole("button", { name: "Submit for review" }).waitFor();
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("S3 reviewer's note is shown to the member after changes were requested", async () => {
    const p = await open("page=core&s=changes_requested"); await card(p).waitFor();
    assert.match(await card(p).locator(".fv3-review-note").innerText(), /Please sharpen the mission\./); assert.match(await card(p).innerText(), /Changes requested/);
    await p.close();
  });
  await check("S4 locked: badge Locked, no Submit, Request unlock needs a note, then shows pending", async () => {
    const p = await open("page=core&s=locked"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fv3-badge").innerText(), "Locked");
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).count(), 0);
    await card(p).getByRole("button", { name: "Request unlock" }).click();
    await card(p).getByRole("button", { name: "Send request" }).click();
    assert.match(await card(p).locator(".fv3-error").innerText(), /add a note/i);
    assert.equal((await calls(p)).filter((c) => c.p.endsWith("request-unlock")).length, 0, "no request without a note");
    await card(p).getByLabel(/Why does this section need to change/).fill("We rebranded.");
    await card(p).getByRole("button", { name: "Send request" }).click();
    await card(p).getByText(/Unlock requested/).first().waitFor();
    assert.equal(await card(p).getByRole("button", { name: "Request unlock" }).count(), 0);
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("S5 a disabled Submit sends nothing to the server", async () => {
    const p = await open("page=core&s=draft_incomplete"); await card(p).waitFor();
    await p.evaluate(() => {}); // button is disabled, so call the API path through a forced click
    await card(p).getByRole("button", { name: "Submit for review" }).click({ force: true }).catch(() => {});
    assert.equal((await calls(p)).filter((c) => c.p.endsWith("/submit")).length, 0, "disabled button sends nothing");
    await p.close();
  });
  await check("S6 Review and Lock as a member: 6-row status table, no reviewer queue", async () => {
    const p = await open("page=review&s=mixed"); await p.locator(".fv3-table").waitFor();
    assert.equal(await p.locator(".fv3-table tbody tr").count(), 6);
    const t = await p.locator(".fv3-table").innerText();
    for (const w of ["Submitted for review", "In review", "Locked", "Draft"]) assert.ok(t.includes(w), w);
    assert.match(t, /1 of 6 locked/); assert.match(t, /Needs: Core message/);
    assert.equal(await p.locator(".fv3-queue").count(), 0);
    await p.screenshot({ path: "/tmp/cth-review-table-member.png", fullPage: true }); assert.deepEqual(p.errors.filter((e) => !/403/.test(e)), []); await p.close();
  });
  await check("S7 reviewer queue: lists waiting rows and the unlock request; shows nothing queue-ish for others", async () => {
    const p = await open("page=review&s=mixed&role=reviewer"); await p.locator(".fv3-queue-row").first().waitFor();
    assert.equal(await p.locator(".fv3-queue-row").count(), 3);
    assert.match(await p.locator(".fv3-queue").innerText(), /We rebranded\./);
    await p.screenshot({ path: "/tmp/cth-review-queue.png", fullPage: true }); await p.close();
  });
  await check("S8 Request changes: needs a note; with a note the row leaves the queue and the member sees a draft", async () => {
    const p = await open("page=review&s=mixed&role=reviewer"); await p.locator(".fv3-queue-row").first().waitFor();
    const row = p.locator(".fv3-queue-row", { hasText: "Core Truth" });
    await row.getByRole("button", { name: "Request changes" }).click();
    await row.getByRole("button", { name: "Send back to draft" }).click();
    assert.match(await row.locator(".fv3-error").innerText(), /add a note/i);
    assert.equal((await calls(p)).filter((c) => c.p.endsWith("request-changes")).length, 0);
    await row.getByLabel(/What needs to change/).fill("Tighten the mission.");
    await row.getByRole("button", { name: "Send back to draft" }).click();
    await p.locator(".fv3-queue-row", { hasText: "Core Truth" }).waitFor({ state: "detached" });
    const c = (await calls(p)).find((x) => x.p.endsWith("request-changes")); assert.equal(c.b.note, "Tighten the mission.");
    assert.equal(await p.locator(".fv3-queue-row").count(), 2);
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("S9 Start review, Approve and lock, then Unlock (reason required)", async () => {
    const p = await open("page=review&s=mixed&role=reviewer"); await p.locator(".fv3-queue-row").first().waitFor();
    const core = p.locator(".fv3-queue-row", { hasText: "Core Truth" });
    await core.getByRole("button", { name: "Start review" }).click(); await core.locator(".fv3-badge", { hasText: "In review" }).waitFor();
    await core.getByRole("button", { name: "Approve and lock" }).click(); await p.locator(".fv3-queue-row", { hasText: "Core Truth" }).waitFor({ state: "detached" });
    const pos = p.locator(".fv3-queue-row", { hasText: "Positioning" });
    await pos.getByRole("button", { name: "Unlock" }).click(); await pos.getByRole("button", { name: "Unlock section" }).click();
    assert.match(await pos.locator(".fv3-error").innerText(), /add a note/i);
    await pos.getByLabel(/Reason for unlocking/).fill("Approved change."); await pos.getByRole("button", { name: "Unlock section" }).click();
    await p.locator(".fv3-queue-row", { hasText: "Positioning" }).waitFor({ state: "detached" });
    const u = (await calls(p)).find((x) => x.p.endsWith("/unlock")); assert.equal(u.b.note, "Approved change.");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("S10 a member never sees reviewer controls (queue hidden, no Request changes anywhere)", async () => {
    const p = await open("page=review&s=mixed"); await p.locator(".fv3-table").waitFor();
    const names = await p.getByRole("button").evaluateAll((els) => els.map((e) => (e.innerText || e.getAttribute("aria-label") || "").trim()));
    assert.ok(!names.some((n) => /Request Review|Approve and Lock|Start review|Unlock/i.test(n)), "no review controls for a member: " + JSON.stringify(names));
    assert.equal(await p.getByRole("button", { name: "Request changes" }).count(), 0); assert.equal(await p.getByRole("button", { name: "Approve and lock" }).count(), 0); await p.close();
  });
  await check("S11 Diagnostic Insight on Brand Audit: score, tier, gaps, first action; and the empty state", async () => {
    let p = await open("page=audit&s=draft_complete"); await p.locator(".fv3-insight").waitFor();
    const t = await p.locator(".fv3-insight").innerText();
    assert.match(t, /40/); assert.match(t, /Foundation/); assert.match(t, /Positioning/); assert.match(t, /Write one sentence/); assert.match(t, /Taken by a teammate/);
    await p.screenshot({ path: "/tmp/cth-review-insight.png", fullPage: true }); await p.close();
    p = await open("page=audit&insight=none"); await p.locator(".fv3-insight").waitFor();
    assert.match(await p.locator(".fv3-insight").innerText(), /No Brand Diagnostic/); await p.getByRole("link", { name: "Start the Brand Diagnostic" }).waitFor(); await p.close();
  });
  await check("S12 phone widths 390 and 320: no sideways scrolling on Review and Lock (reviewer) or a section page", async () => {
    for (const w of [390, 320]) for (const qs of ["page=review&s=mixed&role=reviewer", "page=core&s=changes_requested"]) {
      const p = await open(qs, w, 844); await p.locator(".fv3-status, .fv3-table").first().waitFor(); await p.waitForTimeout(200);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `${qs} @${w}: overflow ${over}px`);
      if (qs.includes("review") && w === 390) await p.screenshot({ path: "/tmp/cth-review-mobile.png", fullPage: true });
      await p.close();
    }
  });
} finally { if (browser) await browser.close(); await new Promise((r) => server.close(r)); }
const pass = results.filter((r) => r[1]).length;
console.log(`SUMMARY: ${pass} pass, ${results.length - pass} fail`);
process.exit(pass === results.length ? 0 : 1);
