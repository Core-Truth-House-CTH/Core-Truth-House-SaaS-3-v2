// Foundation Home + Core Truth (build reference E/F) in each review state. Renders the real pages in a
// browser with a stand-in API (tests/foundationHomeCoreApiMock.jsx). Not a live-server test.
// Screenshots go to $SHOTS (default /tmp/cth-foundation-home-core).
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
const SHOTS = process.env.SHOTS || "/tmp/cth-foundation-home-core";
fs.mkdirSync(SHOTS, { recursive: true });
const mocks = {
  entry: `import React from"react";import{createRoot}from"react-dom/client";import{MemoryRouter}from"react-router-dom";import Home from"${root}/src/pages/FoundationHome.jsx";import Core from"${root}/src/pages/BrandFoundation.jsx";const key=new URLSearchParams(location.search).get("page")||"core";const Page=key==="home"?Home:Core;createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={[key==="home"?"/foundation":"/brand-foundation"]}><Page/></MemoryRouter>);`,
  drawer: `export default function AskTheHouseDrawer(){return null}`,
  ask: `export function useAskTheHouse(){return{isOpen:false,open:(s,i)=>{window.__askOpen=[s,i]},close:()=>{},sectionId:null,initialInput:""}}export function getSurfaceFromPath(){return"brand_foundation"}`,
  paths: `export const API_PATHS={audience:{avatars:"/api/audience/avatars"}};export default API_PATHS;`,
  workspace: `export function useWorkspace(){return{activeWorkspaceId:"ws-demo",activeWorkspace:{name:"Demo"}}}`,
  auth: `export function useAuth(){return{userId:"u1"}}export function useUser(){return{user:{id:"u1",firstName:"Dana",fullName:"Dana Reyes",imageUrl:""}}}export function useClerk(){return{signOut:()=>{}}}`,
  brandHealth: `export function useBrandHealth(){return{refresh:()=>{}}}`,
  plan: `export function usePlan(){return{plan:"estate"}}`,
  planAccess: `export const PLAN_INFO={estate:{name:"Estate"},foundation:{name:"Foundation"}};export function normalizePlan(v){return v||"foundation"}`,
  notification: `export function NotificationBell(){return null}`,
  shellContext: `import React from"react";const c=React.createContext(false);export const AUTH_SHELL_OWNS_BELL=true;export default c`,
  tooltip: `export function SidebarTooltip({children}){return children}`,
  api: fs.readFileSync(path.join(root, "tests/foundationHomeCoreApiMock.jsx"), "utf8"),
};
const real = (rel) => root + "/src/" + rel;
const bundle = await rolldown({ input: "mock:entry", plugins: [{ name: "home-core-isolated",
  resolveId(s) {
    if (s.startsWith("mock:")) return s;
    if (["react", "react-dom/client", "react-router-dom", "lucide-react"].includes(s)) return req.resolve(s);
    const m = { "../components/AuthShell": real("components/AuthShell.jsx"), "../components/ask-the-house/AskTheHouseDrawer": "mock:drawer", "../context/AskTheHouseContext": "mock:ask",
      "../context/WorkspaceContext": "mock:workspace", "../context/BrandHealthContext": "mock:brandHealth", "../hooks/useAuth": "mock:auth", "../context/PlanContext": "mock:plan",
      "../config/planAccess": "mock:planAccess", "./NotificationBell": "mock:notification", "../context/AuthShellContext": "mock:shellContext", "./ui/tooltip": "mock:tooltip",
      "../lib/apiClient": "mock:api", "../../lib/apiClient": "mock:api", "../lib/apiPaths": "mock:paths", "./FoundationSectionLayout": real("pages/FoundationSectionLayout.jsx"),
      "../components/Foundation/FoundationReview": real("components/Foundation/FoundationReview.jsx"), "../lib/foundationSections.mjs": real("lib/foundationSections.mjs"), "../../lib/foundationSections.mjs": real("lib/foundationSections.mjs") };
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
    if (!files.length) throw new Error("build dist-candidate first: npx vite build --mode candidate --outDir dist-candidate");
    s.end(files.map((f) => fs.readFileSync(path.join(root, "dist-candidate/assets", f), "utf8")).join("\n")); return;
  }
  if (u === "/estate-assets/fonts/fonts.css") { s.setHeader("Content-Type", "text/css"); s.end(fs.readFileSync(path.join(root, "public/estate-assets/fonts/fonts.css"), "utf8")); return; }
  if (u.startsWith("/estate-assets/fonts/") && u.endsWith(".woff2")) { s.setHeader("Content-Type", "font/woff2"); s.end(fs.readFileSync(path.join(root, "public/estate-assets/fonts", decodeURIComponent(u.split("/").pop())))); return; }
  const pub = path.join(root, "public", decodeURIComponent(u));   // logo and other public images the shell uses
  if (u !== "/" && pub.startsWith(path.join(root, "public") + path.sep) && fs.existsSync(pub) && fs.statSync(pub).isFile()) {
    const ext = path.extname(pub).toLowerCase(); s.setHeader("Content-Type", { ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" }[ext] || "application/octet-stream"); s.end(fs.readFileSync(pub)); return;
  }
  s.setHeader("Content-Type", "text/html");
  s.end('<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/estate-assets/fonts/fonts.css"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const results = []; let browser;
const check = async (name, fn) => { try { await fn(); results.push([name, true]); console.log("PASS  " + name); } catch (e) { results.push([name, false]); console.log("FAIL  " + name + "  -- " + String(e.message).split("\n")[0].slice(0, 240)); } };
try {
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const base = "http://127.0.0.1:" + server.address().port;
  const open = async (qs, w = 1440, h = 1000) => {
    const p = await browser.newPage({ viewport: { width: w, height: h } }); p.errors = [];
    p.on("pageerror", (e) => p.errors.push(e.message)); p.on("console", (m) => { if (m.type() === "error") p.errors.push(m.text()); });
    await p.goto(base + "/?" + qs); await p.evaluate(() => document.fonts.ready); return p;
  };
  const shot = (p, name) => p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  const calls = (p) => p.evaluate(() => window.__calls || []);
  const card = (p) => p.locator(".fv3-status");
  const rows = (p) => p.locator(".fnd-tbl li").evaluateAll((els) => els.map((e) => [e.querySelector(".fnd-name").textContent, e.querySelector(".fnd-state").textContent]));
  // Fields a member could type into, anywhere in the section's two columns (the review card excluded).
  const typeable = (p) => p.locator(".fnd-main, .fnd-side").locator("textarea, input").evaluateAll((els) => els.filter((e) => !e.matches(":disabled") && !e.readOnly && !e.closest(".fv3-status")).length);
  const NAMES = ["Diagnostic Insight", "Core Truth", "Audience Truth", "Positioning", "Messaging", "Brand Expression", "Review and Lock"];
  const HOME = {
    draft: { core: "In progress", count: "1 of 7", step: "Continue Core Truth", note: false },
    waiting: { core: "Waiting for Shake", count: "1 of 7", step: "Continue Audience Truth", note: false },
    changes: { core: "Changes requested", count: "1 of 7", step: "Update Core Truth", note: true },
    locked: { core: "Locked", count: "2 of 7", step: "Continue Audience Truth", note: false },
  };

  for (const [s, want] of Object.entries(HOME)) {
    await check(`H-${s} Foundation Home: 7 rows, review-state labels, count, next step${want.note ? ", From Shake" : ", no From Shake card"}`, async () => {
      const p = await open(`page=home&s=${s}`); await p.locator(".fnd-tbl li").nth(6).waitFor();
      const r = await rows(p);
      assert.deepEqual(r.map((x) => x[0]), NAMES);
      assert.equal(r[0][1], "Locked"); assert.equal(r[1][1], want.core); assert.equal(r[2][1], "In progress"); assert.equal(r[3][1], "Not started"); assert.equal(r[6][1], "Not started");
      assert.match(await p.locator(".fnd-count").innerText(), new RegExp(`^${want.count} sections locked$`));
      assert.equal(await p.locator(".fnd-step-title").innerText(), want.step);
      assert.equal(await p.getByRole("link", { name: want.step.replace(/^(Continue|Update|Start) /, "Open ") }).count(), 1);
      assert.equal(await p.locator(".fnd-from").count(), want.note ? 1 : 0);
      if (want.note) { const t = await p.locator(".fnd-from").innerText(); assert.match(t, /On Core Truth, Nov 17/); assert.match(t, /Say who it's for/); }
      const text = await p.locator(".fnd").innerText();
      assert.ok(!/\d+%/.test(text), "no readiness percentage anywhere");
      for (const gone of ["Path to 100", "Brand Promise", "Blueprint card", "Review Conflicts", "Approval", "All Sections", "Guide me"]) assert.ok(!text.includes(gone), "removed block still shown: " + gone);
      assert.match(text, /Submit each section when it's ready\. Shake reviews it and locks it once it's approved\./);
      assert.equal((await calls(p)).filter((c) => c.m === "POST").length, 0, "Home never writes");
      await shot(p, `home-${s}`); assert.deepEqual(p.errors, []); await p.close();
    });
  }

  await check("C-draft Core Truth draft: heading Draft, Save draft saves the fields, Submit enabled, fields typeable", async () => {
    const p = await open("page=core&s=draft"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Draft");
    assert.match(await card(p).innerText(), /Submit when it's ready\. You can keep working on other sections while Shake reviews this one\./);
    assert.match(await card(p).locator(".fnd-required").innerText(), /Required fields are filled/);
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).isEnabled(), true);
    assert.ok(await typeable(p) > 0);
    await shot(p, "core-draft");
    await p.locator("#purpose").fill("Help founders lead with clarity, every day.");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const save = (await calls(p)).find((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation");
    assert.equal(save.b.purpose, "Help founders lead with clarity, every day."); assert.equal(save.b.tagline, "Kept by the save", "other saved fields are kept");
    await card(p).getByRole("button", { name: "Submit for review" }).click(); await card(p).getByText("Submitted for review.").waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Waiting for Shake");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-waiting Core Truth submitted: heading Waiting for Shake, Withdraw, no Submit", async () => {
    const p = await open("page=core&s=waiting"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Waiting for Shake");
    assert.match(await card(p).innerText(), /Shake gets an email when you submit\./);
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).count(), 0);
    await shot(p, "core-waiting");
    await card(p).getByRole("button", { name: "Withdraw" }).click(); await card(p).getByText("Withdrawn. You can edit again.").waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Draft");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-changes Core Truth sent back: heading, Shake's note with date, Save draft + Submit; Refine shows a suggestion; Use this saves it", async () => {
    const p = await open("page=core&s=changes"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Changes requested");
    const note = card(p).locator(".fv3-review-note[role=note]");
    assert.match(await note.innerText(), /Shake, Nov 17/); assert.match(await note.innerText(), /Say who it's for and what changes for them\. One sentence\./);
    await card(p).getByRole("button", { name: "Save draft" }).waitFor(); await card(p).getByRole("button", { name: "Submit for review" }).waitFor();
    // one AI button per field: Help me answer when empty (Vision), Refine when filled
    const ai = await p.locator(".fnd-field .fnd-btn-ai").evaluateAll((els) => els.map((e) => e.textContent));
    assert.deepEqual(ai, ["Refine", "Refine", "Help me answer", "Refine", "Refine", "Refine"]);
    await p.locator(".fnd-field", { hasText: "Who you serve" }).getByRole("button", { name: "Refine" }).click();
    const box = p.locator(".fnd-suggest"); await box.getByText("SUGGESTED MISSION, NOT APPLIED").waitFor();
    assert.equal(await p.getByRole("button", { name: "Request changes" }).count(), 0, "members never see Request changes");
    await shot(p, "core-changes");
    await box.getByRole("button", { name: "Try another" }).click(); await box.getByText("Give founders one working system").waitFor();
    await box.getByRole("button", { name: "Use this" }).click(); await p.waitForFunction(() => (window.__calls || []).some((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation"));
    const save = (await calls(p)).find((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation");
    assert.equal(save.b.mission, "Give founders one working system for every brand decision.");
    assert.equal(await p.locator("#mission").inputValue(), "Give founders one working system for every brand decision.");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-locked Core Truth locked: heading, Request unlock works, every field, list control and Ask the House is disabled", async () => {
    const p = await open("page=core&s=locked"); await card(p).waitFor(); await p.locator("#purpose").waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Approved and locked");
    assert.match(await card(p).innerText(), /To make changes, request an unlock\./);
    assert.equal(await typeable(p), 0, "fields still typeable while locked");
    assert.equal(await p.locator(".fnd-main button:not(:disabled), .fnd-side .fnd-house button:not(:disabled)").count(), 0, "no enabled buttons inside the locked fields");
    assert.equal(await p.locator("#house-ask").isDisabled(), true);
    await p.getByRole("link", { name: "Next: Audience Truth →" }).waitFor();
    await shot(p, "core-locked");
    await card(p).getByRole("button", { name: "Request unlock" }).click();
    await card(p).getByLabel(/Why does this section need to change/).fill("We rebranded.");
    await card(p).getByRole("button", { name: "Send request" }).click(); await card(p).getByText(/Unlock requested/).first().waitFor();
    assert.ok((await calls(p)).some((c) => c.m === "POST" && c.p === "/api/foundation/sections/core_truth/request-unlock"));
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-incomplete required fields missing: crimson count, Submit disabled and sends nothing", async () => {
    const p = await open("page=core&s=incomplete"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-required.is-missing").innerText(), "2 required fields left");
    const submit = card(p).getByRole("button", { name: "Submit for review" }); assert.equal(await submit.isDisabled(), true);
    await submit.click({ force: true }).catch(() => {});
    assert.equal((await calls(p)).filter((c) => c.p.endsWith("/submit")).length, 0);
    await p.close();
  });
  await check("C-credits out of AI credits: friendly message and a Buy credits link, never the raw error", async () => {
    const p = await open("page=core&s=draft&credits=none"); await card(p).waitFor();
    await p.locator(".fnd-field", { hasText: "Where you're going" }).getByRole("button", { name: "Help me answer" }).click();
    await p.getByRole("link", { name: "Buy credits" }).waitFor();
    const t = await p.locator(".fnd-house").innerText(); assert.match(t, /AI credits/); assert.ok(!/Insufficient AI credits/.test(t));
    await shot(p, "core-out-of-credits"); await p.close();
  });
  await check("C-house Tell the House opens Ask the House with the typed text; lists add and remove", async () => {
    const p = await open("page=core&s=draft"); await card(p).waitFor();
    await p.locator("#house-ask").fill("Make the mission shorter"); await p.locator("#house-ask").press("Enter");
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["core_truth", "Make the mission shorter"]);
    await p.getByRole("button", { name: "+ Add belief" }).click(); assert.equal(await p.evaluate(() => document.activeElement.id), "beliefs-2");
    await p.locator("#beliefs-2").fill("Proof beats promises.");
    await p.getByRole("button", { name: "Remove value: Integrity" }).click();
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const save = (await calls(p)).find((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation");
    assert.deepEqual(save.b.beliefs, ["Clarity builds trust.", "A strong foundation guides growth.", "Proof beats promises."]);
    assert.deepEqual(save.b.values, ["Clarity", "Community"]);
    await p.close();
  });
  await check("C-removed no old blocks on Core Truth (dropdowns, Save and Continue, readiness, path to 100%)", async () => {
    const p = await open("page=core&s=draft"); await card(p).waitFor();
    const text = await p.locator(".fnd").innerText();
    for (const gone of ["Save and Continue", "Path to 100", "complete", "Readiness", "Draft a Core Truth field", "Also saved in your Foundation", "Guide me", "Check alignment"]) assert.ok(!text.includes(gone), gone);
    assert.equal(await p.locator(".fnd select").count(), 0);
    assert.ok(!/\d+%/.test(text), "no percentages");
    await p.getByRole("link", { name: "← Foundation Home" }).waitFor(); await p.getByText("Lesson coming soon").waitFor();
    await p.close();
  });
  // The staging journey test (staging/journey-test/journey.mjs, backend repo) drives Core Truth with these exact selectors.
  await check("J journey-test selectors still find their targets on Core Truth", async () => {
    const editors = (p) => p.locator("main textarea:visible, main input[type=text]:visible");
    const saveButton = (p) => p.getByRole("button", { name: /^save draft$|^save$|^save changes$/i }).first();
    let p = await open("page=core&s=draft"); await card(p).waitFor();
    assert.equal(await editors(p).first().getAttribute("id"), "purpose", "step 3 edits the first field");
    await saveButton(p).click(); await p.waitForFunction(() => (window.__calls || []).some((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation"));
    await p.getByRole("button", { name: /^submit for review$/i }).click(); await p.getByText("Submitted for review.").waitFor();   // step 4
    await p.close();
    p = await open("page=core&s=changes"); await card(p).waitFor();
    assert.equal(await p.locator(".fv3-review-note[role=note]").filter({ hasText: "Say who it's for" }).count(), 1);      // step 6
    assert.equal(await p.getByRole("button", { name: /^submit for review$/i }).count(), 1);                                   // step 7 resubmit
    await p.close();
    p = await open("page=core&s=locked"); await card(p).waitFor(); await p.locator("#purpose").waitFor();
    assert.equal(await editors(p).evaluateAll((els) => els.filter((e) => !e.matches(":disabled") && !e.readOnly).length), 0);  // step 7a
    await p.getByRole("button", { name: /^request unlock$/i }).click();
    await p.locator(".fv3-status textarea").fill("cleanup, please unlock");                                                   // step 7c
    await p.getByRole("button", { name: /^send request$/i }).click(); await card(p).getByText(/Unlock requested/).first().waitFor();
    await p.close();
  });
  await check("M phone widths 390 and 320: no sideways scrolling on Home or Core Truth", async () => {
    for (const w of [390, 320]) for (const qs of ["page=home&s=changes", "page=core&s=changes"]) {
      const p = await open(qs, w, 844); await p.locator(".fnd-tbl, .fv3-status").first().waitFor(); await p.waitForTimeout(200);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `${qs} @${w}: overflow ${over}px`);
      if (w === 390) await shot(p, `${qs.includes("home") ? "home" : "core"}-changes-phone`);
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
