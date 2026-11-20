// Foundation Home and the seven section pages (build reference E/F) in each review state. Renders the real
// pages in a browser with a stand-in API (tests/foundationApiMock.jsx). Not a live-server test.
// Screenshots go to $SHOTS (default /tmp/cth-foundation-reskin).
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
const SHOTS = process.env.SHOTS || "/tmp/cth-foundation-reskin";
fs.mkdirSync(SHOTS, { recursive: true });
const mocks = {
  entry: `import React from"react";import{createRoot}from"react-dom/client";import{MemoryRouter}from"react-router-dom";import Home from"${root}/src/pages/FoundationHome.jsx";import Core from"${root}/src/pages/BrandFoundation.jsx";import{BrandAuditPage,AudiencePage,PositioningPage,MessagingPage,ExpressionPage,ReviewLockPage}from"${root}/src/pages/FoundationPages.jsx";import api from"mock:api";import{AdminFoundationLessons}from"${root}/src/components/admin/AdminFoundationLessons.jsx";function LessonsAdmin(){const[v,setV]=React.useState([]);const f=React.useCallback(async()=>{const r=await api.get("/api/training-videos");setV(r.videos||[])},[]);React.useEffect(()=>{f()},[f]);return <div style={{padding:24,background:"#fff",maxWidth:1100}}><AdminFoundationLessons trainingVideos={v} fetchTrainingVideos={f}/></div>}const PAGES={lessons:[LessonsAdmin,"/admin/onboarding"],home:[Home,"/foundation"],core:[Core,"/brand-foundation"],audit:[BrandAuditPage,"/brand-audit"],audience:[AudiencePage,"/audience"],positioning:[PositioningPage,"/brand-positioning"],messaging:[MessagingPage,"/messaging-structure"],expression:[ExpressionPage,"/identity-studio"],review:[ReviewLockPage,"/foundation/review-lock"]};const [Page,route]=PAGES[new URLSearchParams(location.search).get("page")||"core"];createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={[route]}><Page/></MemoryRouter>);`,
  drawer: `export default function AskTheHouseDrawer(){return null}`,
  ask: `export function useAskTheHouse(){return{isOpen:false,open:(s,i,m)=>{window.__askOpen=[s,i,m]},close:()=>{},sectionId:null,initialInput:"",initialMode:"guide"}}export function getSurfaceFromPath(){return"brand_foundation"}`,
  legacy: `export default function Legacy(){return null}`,
  paths: `export const API_PATHS={audience:{avatars:"/api/audience/avatars",avatarById:(id)=>"/api/audience/avatars/"+encodeURIComponent(id)}};export default API_PATHS;`,
  workspace: `export function useWorkspace(){return{activeWorkspaceId:"ws-demo",activeWorkspace:{name:"Demo"}}}`,
  auth: `export function useAuth(){return{userId:"u1"}}export function useUser(){return{user:{id:"u1",firstName:"Dana",fullName:"Dana Reyes",imageUrl:""}}}export function useClerk(){return{signOut:()=>{}}}`,
  brandHealth: `export function useBrandHealth(){return{refresh:()=>{}}}`,
  plan: `export function usePlan(){return{plan:"estate"}}`,
  planAccess: `export const PLAN_INFO={estate:{name:"Estate"},foundation:{name:"Foundation"}};export function normalizePlan(v){return v||"foundation"}`,
  notification: `export function NotificationBell(){return null}`,
  shellContext: `import React from"react";const c=React.createContext(false);export const AUTH_SHELL_OWNS_BELL=true;export default c`,
  tooltip: `export function SidebarTooltip({children}){return children}`,
  api: fs.readFileSync(path.join(root, "tests/foundationApiMock.jsx"), "utf8"),
};
const real = (rel) => root + "/src/" + rel;
const bundle = await rolldown({ input: "mock:entry", plugins: [{ name: "home-core-isolated",
  resolveId(s) {
    if (s.startsWith("mock:")) return s;
    if (["react", "react-dom/client", "react-router-dom", "lucide-react"].includes(s)) return req.resolve(s);
    const m = { "../components/AuthShell": real("components/AuthShell.jsx"), "../components/ask-the-house/AskTheHouseDrawer": "mock:drawer", "../context/AskTheHouseContext": "mock:ask", "../../context/AskTheHouseContext": "mock:ask", "./BrandAudit": "mock:legacy", "./Audience": "mock:legacy", "./BrandPositioning": "mock:legacy", "./MessagingStructure": "mock:legacy", "./IdentityStudio": "mock:legacy",
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
const check = async (name, fn) => { try { await fn(); results.push([name, true]); console.log("PASS  " + name); } catch (e) { results.push([name, false]); console.log("FAIL  " + name + "  -- " + String(e.message).replace(/\s+/g," ").slice(0, 300)); } };
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
    draft: { core: "In progress", count: "1 of 6", step: "Continue Core Truth", note: false },
    waiting: { core: "Waiting for review", count: "1 of 6", step: "Continue Audience Truth", note: false },
    changes: { core: "Changes requested", count: "1 of 6", step: "Update Core Truth", note: true },
    locked: { core: "Locked", count: "2 of 6", step: "Continue Audience Truth", note: false },
  };

  for (const [s, want] of Object.entries(HOME)) {
    await check(`H-${s} Foundation Home: 7 rows, review-state labels, count, next step${want.note ? ", From your reviewer" : ", no reviewer note card"}`, async () => {
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
      for (const gone of ["Path to 100", "Brand Promise", "Blueprint card", "Review Conflicts", "Approval", "All Sections", "Guide me", "Export", "Shake"]) assert.ok(!text.includes(gone), "removed block still shown: " + gone);
      assert.match(text, /Submit each section when it's ready\. Your reviewer checks it and locks it once it's approved\./);
      assert.equal((await calls(p)).filter((c) => c.m === "POST").length, 0, "Home never writes");
      await shot(p, `home-${s}`); assert.deepEqual(p.errors, []); await p.close();
    });
  }

  await check("C-draft Core Truth draft: heading Draft, Save draft saves the fields, Submit enabled, fields typeable", async () => {
    const p = await open("page=core&s=draft"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Draft");
    assert.match(await card(p).innerText(), /Submit when it's ready\. You can keep working on other sections while this one is reviewed\./);
    assert.match(await card(p).locator(".fnd-required").innerText(), /Required fields are filled/);
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).isEnabled(), true);
    assert.ok(await typeable(p) > 0);
    await shot(p, "core-draft");
    await p.locator("#purpose").fill("Help founders lead with clarity, every day.");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const save = (await calls(p)).find((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation");
    assert.equal(save.b.purpose, "Help founders lead with clarity, every day."); assert.equal(save.b.tagline, "Where serious brands are built.", "other saved fields are kept");
    await card(p).getByRole("button", { name: "Submit for review" }).click(); await card(p).getByText("Submitted for review.").waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading") .innerText(), "Waiting for review");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-waiting Core Truth submitted: heading Waiting for review, Withdraw, no Submit", async () => {
    const p = await open("page=core&s=waiting"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading") .innerText(), "Waiting for review");
    assert.match(await card(p).innerText(), /Your reviewer gets an email when you submit\./);
    assert.equal(await card(p).getByRole("button", { name: "Submit for review" }).count(), 0);
    await shot(p, "core-waiting");
    await card(p).getByRole("button", { name: "Withdraw" }).click(); await card(p).getByText("Withdrawn. You can edit again.").waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Draft");
    assert.deepEqual(p.errors, []); await p.close();
  });
  await check("C-changes Core Truth sent back: heading, reviewer's note with date, Save draft + Submit; Refine shows a suggestion; Use this saves it", async () => {
    const p = await open("page=core&s=changes"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Changes requested");
    const note = card(p).locator(".fv3-review-note[role=note]");
    assert.match(await note.innerText(), /Reviewer's note, Nov 17/); assert.ok(!/Shake/.test(await p.locator(".fnd").innerText()), "reviewer never named"); assert.equal(await note.locator("svg").count(), 1, "neutral icon, no initial"); assert.match(await note.innerText(), /Say who it's for and what changes for them\. One sentence\./);
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
  await check("C-incomplete required fields missing: names them in crimson, Submit disabled and sends nothing", async () => {
    const p = await open("page=core&s=incomplete"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-required.is-missing").innerText(), "Add Vision and Founder insight to submit");
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
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["core_truth", "Make the mission shorter", "guide"]);
    await p.getByRole("button", { name: "+ Add belief" }).click(); assert.equal(await p.evaluate(() => document.activeElement.id), "beliefs-2");
    await p.locator("#beliefs-2").fill("Proof beats promises.");
    await p.getByRole("button", { name: "Remove core value: Integrity" }).click();
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const save = (await calls(p)).find((c) => c.m === "POST" && c.p === "/api/persist/brand-foundation");
    assert.deepEqual(save.b.beliefs, ["Clarity builds trust.", "A strong foundation guides growth.", "Proof beats promises."]);
    assert.deepEqual(save.b.values, ["Clarity", "Community"]);
    await p.close();
  });
  await check("C-removed no old blocks on Core Truth (dropdowns, Save and Continue, readiness, path to 100%)", async () => {
    const p = await open("page=core&s=draft"); await card(p).waitFor();
    const text = await p.locator(".fnd").innerText();
    for (const gone of ["Save and Continue", "Path to 100", "complete", "Readiness", "Draft a Core Truth field", "Also saved in your Foundation", "Draft from my answers", "Export"]) assert.ok(!text.includes(gone), gone);
    assert.equal(await p.locator(".fnd select").count(), 0);
    assert.ok(!/\d+%/.test(text), "no percentages");
    await p.getByRole("link", { name: "← Diagnostic Insight" }).waitFor(); await p.getByText("Lesson coming soon").waitFor();
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
  await check("A Ask the House: Guide me opens Guide mode; Check alignment opens Review mode with the starting message; hidden on Diagnostic Insight", async () => {
    let p = await open("page=core&s=draft"); await card(p).waitFor();
    await p.locator(".fnd-house").getByRole("button", { name: "Guide me" }).click();
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["core_truth", "", "guide"]);
    await p.locator(".fnd-house").getByRole("button", { name: "Check alignment" }).click();
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["core_truth", "Check that my Core Truth agrees with my Foundation sections that are already locked, and point out anything that contradicts them.", "review"]);
    assert.equal((await calls(p)).filter((c) => c.m === "POST").length, 0, "opening the chat sends nothing");
    await p.close();
    p = await open("page=positioning&sec=positioning&s=draft"); await card(p).waitFor();
    await p.locator(".fnd-house").getByRole("button", { name: "Check alignment" }).click();
    assert.match((await p.evaluate(() => window.__askOpen))[1], /^Check that my Positioning agrees/);
    await p.close();
    p = await open("page=audit&sec=brand_audit&s=draft"); await card(p).waitFor();
    await p.locator(".fnd-house").getByRole("button", { name: "Guide me" }).waitFor();
    assert.equal(await p.getByRole("button", { name: "Check alignment" }).count(), 0);
    await p.close();
  });
  await check("O unlocked section reads Open for edits on the card and on Home, with the reviewer's reason", async () => {
    let p = await open("page=core&s=unlocked"); await card(p).waitFor();
    assert.equal(await card(p).locator(".fnd-review-heading").innerText(), "Open for edits");
    assert.match(await card(p).locator(".fv3-review-note").innerText(), /Reviewer's note, Nov 19[\s\S]*Opened so you can update the mission\./);
    await card(p).getByRole("button", { name: "Submit for review" }).waitFor();
    await shot(p, "core-open-for-edits"); await p.close();
    p = await open("page=home&s=unlocked"); await p.locator(".fnd-tbl li").nth(6).waitFor();
    assert.equal((await rows(p))[1][1], "Open for edits");
    assert.equal(await p.locator(".fnd-step-title").innerText(), "Update Core Truth");
    assert.match(await p.locator(".fnd-step-body").innerText(), /Your reviewer opened it for edits/);
    await p.close();
  });

  // The other sections: [page, section id, title, first field id, field-card count, back link, save call]
  const SECTIONS = [
    ["audit", "brand_audit", "Diagnostic Insight", null, 4, "← Foundation Home", null],
    ["audience", "audience", "Audience Truth", "audience-name", 11, "← Core Truth", ["PATCH", "/api/audience/avatars/av-1"]],
    ["positioning", "positioning", "Positioning", "position-statement", 4, "← Audience Truth", ["POST", "/api/persist/brand-positioning"]],
    ["messaging", "messaging", "Messaging", "message-brand_promise", 8, "← Positioning", ["POST", "/api/persist/messaging-structure"]],
    ["expression", "expression", "Brand Expression", "expression-tone", 4, "← Messaging", ["POST", "/api/persist/brand-foundation"]],
  ];
  for (const [pg, sec, title, first, count, back, saveCall] of SECTIONS) {
    for (const s of ["draft", "waiting", "changes", "locked"]) {
      await check(`S-${pg}-${s} ${title} ${s}: header, tabs, review card, ${count} field cards, back link; ${s === "locked" ? "nothing typeable" : s === "draft" && saveCall ? "Save draft makes the page's save call" : "state shown"}`, async () => {
        const p = await open(`page=${pg}&sec=${sec}&s=${s}`); await card(p).waitFor(); await p.locator(".fnd-field").first().waitFor();
        assert.equal(await p.locator("h1.fnd-h1").textContent(), title);
        assert.equal(await p.locator(".fnd-tabs a.is-on").textContent(), title);
        assert.equal(await p.locator(".fnd-field").count(), count);
        await p.getByRole("link", { name: back }).waitFor(); await p.getByText("Lesson coming soon").waitFor();
        const text = await p.locator(".fnd").innerText();
        for (const gone of ["Save and Continue", "Path to 100", "Readiness", "Draft from my answers", "Request changes", "Shake", "Export", "Open the full"]) assert.ok(!text.includes(gone), "old block still shown: " + gone);
        assert.ok(!/\d+%/.test(text), "no percentages");
        const heading = await card(p).locator(".fnd-review-heading").innerText();
        assert.equal(heading, { draft: "Draft", waiting: "Waiting for review", changes: "Changes requested", locked: "Approved and locked" }[s]);
        if (s === "changes") assert.match(await card(p).locator(".fv3-review-note[role=note]").innerText(), /Reviewer's note, Nov 17/);
        if (s === "locked") {
          assert.equal(await typeable(p), 0, "fields still typeable while locked");
          assert.equal(await p.locator(".fnd-main button:not(:disabled), .fnd-side .fnd-house button:not(:disabled)").count(), 0);
        }
        if (first) assert.equal(await p.locator("main textarea:visible, main input[type=text]:visible").first().getAttribute("id"), first, "journey step 3 edits the first field");
        if (s === "draft" && saveCall) {
          if (pg !== "audit") assert.equal(await p.locator(".fnd-field .fnd-btn-ai").count(), count - (pg === "expression" ? 1 : 0), "one AI button per field");
          await p.locator("#" + first).fill(sec === "audience" ? "Overextended founder [edit]" : "Edited for the test.");
          await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
          const c = await calls(p); const last = c.filter((x) => x.m !== "GET").pop();
          assert.deepEqual([last.m, last.p], saveCall, "the page's own save call comes last");
        }
        await shot(p, `${pg}-${s}`); assert.deepEqual(p.errors, []); await p.close();
      });
    }
  }
  await check("D Diagnostic Insight shows the saved Diagnostic result read-only", async () => {
    const p = await open("page=audit&sec=brand_audit&s=draft"); await card(p).waitFor();
    const t = await p.locator(".fnd-fields").innerText();
    for (const want of ["38", "/ 60", "Foundation", "Positioning", "Write one sentence"]) assert.ok(t.includes(want), want);
    assert.equal(await p.locator(".fnd-fields textarea, .fnd-fields input").count(), 0);
    await p.close();
  });
  await check("P Positioning: the statement saves to the Foundation record first, then the positioning record; Refine suggests and Use this saves", async () => {
    const p = await open("page=positioning&sec=positioning&s=draft"); await card(p).waitFor();
    await p.locator("#position-statement").fill("For founders who want one brand that holds.");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const writes = (await calls(p)).filter((c) => c.m === "POST");
    assert.deepEqual(writes.map((c) => c.p), ["/api/persist/brand-foundation", "/api/persist/brand-positioning"]);
    assert.equal(writes[0].b.positioning, "For founders who want one brand that holds."); assert.equal(writes[0].b.mission, "Turn brand decisions into a working system.");
    assert.equal(writes[1].b.audience_specificity, "Independent founders with a working offer and a scattered brand");
    await p.locator(".fnd-field", { hasText: "Differentiator" }).getByRole("button", { name: "Refine" }).click();
    await p.locator(".fnd-suggest").getByText("SUGGESTED DIFFERENTIATOR, NOT APPLIED").waitFor();
    const ask = (await calls(p)).find((c) => c.p === "/api/persist/brand-positioning/ai-assist"); assert.equal(ask.b.field_id, "differentiator");
    await p.locator(".fnd-suggest").getByRole("button", { name: "Use this" }).click();
    const posts = async () => (await calls(p)).filter((c) => c.m === "POST" && c.p === "/api/persist/brand-positioning");
    for (let i = 0; i < 50 && (await posts()).length < 2; i++) await p.waitForTimeout(100);
    assert.equal((await posts()).length, 2, "Use this saves once");
    assert.match(await p.locator("#position-differentiator").inputValue(), /^Help independent founders/);
    await p.close();
  });
  await check("G Messaging: brand pillars save as names to the Foundation record (both pillar keys), proof points as lines", async () => {
    const p = await open("page=messaging&sec=messaging&s=draft"); await card(p).waitFor();
    await p.getByRole("button", { name: "+ Add pillar" }).click(); await p.locator("#message-pillars-3").fill("Calm");
    await p.getByRole("button", { name: "+ Add proof point" }).click(); await p.locator("#message-proof-2").fill("Ten Foundations locked");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const writes = (await calls(p)).filter((c) => c.m === "POST");
    assert.deepEqual(writes.map((c) => c.p), ["/api/persist/brand-foundation", "/api/persist/messaging-structure"]);
    assert.deepEqual(writes[0].b.brand_pillars, ["Clarity", "Structure", "Proof", "Calm"]);
    assert.deepEqual(writes[0].b.brand_pillars_full, [{ name: "Clarity" }, { name: "Structure" }, { name: "Proof" }, { name: "Calm" }]);
    assert.equal(writes[1].b.proof_points, "Founding Cohort members\nReviewed Foundations\nTen Foundations locked");
    await p.close();
  });
  await check("E Brand Expression: colors and fonts save to the identity, tone of voice to the Foundation record; a bad hex is refused", async () => {
    const p = await open("page=expression&sec=expression&s=draft"); await card(p).waitFor();
    await p.getByRole("button", { name: "+ Add color" }).click();
    await p.getByLabel("Color 3 name").fill("Gold"); await p.getByLabel("Color 3 hex").fill("gold");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await p.getByText("Colors need a hex value like #AF0024.").waitFor();
    assert.equal((await calls(p)).filter((c) => c.m === "POST").length, 0);
    await p.getByLabel("Color 3 hex").fill("#C4A95B"); await p.locator("#expression-tone").fill("Calm and direct.");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const writes = (await calls(p)).filter((c) => c.m === "POST");
    assert.deepEqual(writes.map((c) => c.p), ["/api/identity/save", "/api/persist/brand-foundation"]);
    assert.equal(writes[0].b.colors[2].hex, "#C4A95B"); assert.equal(writes[0].b.fonts.length, 2); assert.equal(writes[1].b.tone_of_voice, "Calm and direct.");
    await p.locator(".fnd-field", { hasText: "Tone of voice" }).getByRole("button", { name: "Refine" }).click();
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["expression", 'Help me refine my Tone of voice in Brand Expression. Right now it says: "Calm and direct."', "guide"]);
    await p.close();
  });
  await check("U Audience: lists save as lists; the AI button opens Ask the House with the question (no suggestion route exists)", async () => {
    const p = await open("page=audience&sec=audience&s=draft"); await card(p).waitFor();
    await p.getByRole("button", { name: "+ Add objection" }).click(); await p.locator("#audience-objections-0").fill("Not sure I have time");
    await card(p).getByRole("button", { name: "Save draft" }).click(); await card(p).getByText("Draft saved.").waitFor();
    const w = (await calls(p)).find((c) => c.m === "PATCH");
    assert.deepEqual(w.b.objections, ["Not sure I have time"]); assert.deepEqual(w.b.where_they_are, ["LinkedIn", "Podcasts"]);
    await p.locator(".fnd-field", { hasText: "Core desire" }).getByRole("button", { name: "Help me answer" }).click();
    assert.deepEqual(await p.evaluate(() => window.__askOpen), ["audience", "Help me answer Core desire in Audience Truth.", "guide"]);
    assert.equal((await calls(p)).filter((c) => c.p.endsWith("/ai-assist")).length, 0);
    await p.close();
  });
  await check("R Review and Lock: sections table, approval card, no Export, no readiness; a reviewer sees the queue", async () => {
    let p = await open("page=review&s=draft"); await p.locator(".fnd-tbl li").nth(6).waitFor();
    assert.deepEqual((await rows(p)).map((x) => x[0]), NAMES);
    const t = await p.locator(".fnd").innerText();
    assert.match(t, /Sections locked\s*1 of 6/); assert.match(t, /Waiting for review\s*0/);
    for (const gone of ["Export", "Readiness", "Path to 100", "Conflict", "Shake", "Check alignment"]) assert.ok(!t.includes(gone), gone);
    assert.ok(!/\d+%/.test(t));
    assert.equal(await p.locator(".fv3-queue").count(), 0, "members see no queue");
    await shot(p, "review-member"); assert.deepEqual(p.errors, []); await p.close();
    p = await open("page=review&s=draft&reviewer=1"); await p.locator("li.fv3-queue-row").waitFor();
    await p.locator("li.fv3-queue-row").getByRole("button", { name: "Start review" }).waitFor();
    await shot(p, "review-reviewer"); await p.close();
  });
  await check("L lesson spot: title and length, Play swaps in the YouTube player; still plays on a locked section; none set reads coming soon", async () => {
    for (const st of ["draft", "locked"]) {
      const p = await open(`page=positioning&sec=positioning&s=${st}&lesson=1`);
      await p.route(/youtube-nocookie\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html><body style='background:#000'></body></html>" }));
      const spot = p.locator(".fnd-lesson"); await spot.getByText("Positioning: the one sentence that holds").waitFor();
      assert.equal(await spot.locator(".fnd-lbl").innerText(), "LESSON, 9 MIN");
      assert.equal(await p.getByText("Lesson coming soon").count(), 0);
      if (st === "draft") await shot(p, "lesson-set");
      await spot.getByRole("button", { name: "Play lesson: Positioning: the one sentence that holds" }).click();
      const frame = p.locator(".fnd-lesson-player iframe"); await frame.waitFor();
      assert.match(await frame.getAttribute("src"), /^https:\/\/www\.youtube-nocookie\.com\/embed\/abcDEF12345\?autoplay=1/);
      assert.equal(await frame.getAttribute("title"), "Positioning: the one sentence that holds");
      if (st === "draft") await shot(p, "lesson-playing");
      assert.deepEqual(p.errors, []); await p.close();
    }
    const p = await open("page=messaging&sec=messaging&s=draft"); await p.getByText("Lesson coming soon").waitFor();
    assert.equal(await p.locator(".fnd-lesson button").count(), 0, "no play button without a lesson"); await p.close();
  });
  await check("LA admin Foundation Lessons: six rows; save a new lesson, refuse a non-YouTube link, edit, remove", async () => {
    const p = await open("page=lessons&sec=positioning&lesson=1", 1200, 1400);
    const rows = p.locator("[data-testid=foundation-lessons] > li"); await rows.nth(5).waitFor();
    assert.deepEqual(await rows.locator("h4").allInnerTexts(), ["Diagnostic Insight", "Core Truth", "Audience Truth", "Positioning", "Messaging", "Brand Expression"]);
    const pos = p.locator("li[data-section=positioning]");
    assert.equal(await pos.locator("#lesson-positioning-minutes").inputValue(), "9");
    const core = p.locator("li[data-section=core_truth]");
    await core.locator("#lesson-core_truth-url").fill("https://vimeo.com/123"); await core.locator("#lesson-core_truth-title").fill("Core Truth, start here");
    await core.getByRole("button", { name: "Save lesson" }).click();
    await core.getByRole("alert").filter({ hasText: "That is not a YouTube video link." }).waitFor();
    await core.locator("#lesson-core_truth-minutes").fill("0"); await core.getByRole("button", { name: "Save lesson" }).click();
    await core.getByRole("alert").filter({ hasText: "Length is whole minutes, 1 to 240." }).waitFor();
    await core.locator("#lesson-core_truth-url").fill("https://youtu.be/coreCORE123"); await core.locator("#lesson-core_truth-minutes").fill("7");
    await core.getByRole("button", { name: "Save lesson" }).click();
    await p.locator("li[data-section=core_truth]").getByText("Lesson set").waitFor();
    let w = (await calls(p)).filter((c) => c.m !== "GET");
    assert.deepEqual(w.map((c) => [c.m, c.p]), [["POST", "/api/admin/training-videos"], ["POST", "/api/admin/training-videos"]]);
    assert.deepEqual(w[1].b, { youtube_url: "https://youtu.be/coreCORE123", title: "Core Truth, start here", duration_minutes: 7, description: "", category: "foundation-core_truth", is_published: true });
    await shot(p, "lessons-admin");
    await pos.locator("#lesson-positioning-title").fill("Positioning, revised"); await pos.getByRole("button", { name: "Save lesson" }).click();
    await pos.getByText("Saved. Members see it on the section page.").waitFor();
    w = (await calls(p)).filter((c) => c.m !== "GET");
    assert.deepEqual(w.at(-1), { m: "PATCH", p: "/api/admin/training-videos/v-lesson", b: { youtube_url: "https://youtu.be/abcDEF12345", title: "Positioning, revised", duration_minutes: 9 } });
    await p.locator("li[data-section=positioning]").getByRole("button", { name: "Remove" }).click();
    await p.locator("li[data-section=positioning]").getByText("Lesson coming soon", { exact: true }).waitFor();
    await p.locator("li[data-section=positioning]").getByText('Removed. The section shows "Lesson coming soon".').waitFor();
    assert.equal(await p.locator("#lesson-positioning-url").inputValue(), "");
    assert.deepEqual((await calls(p)).filter((c) => c.m === "DELETE").map((c) => c.p), ["/api/admin/training-videos/v-lesson"]);
    assert.deepEqual(p.errors, []); await p.close();
  });
  // New journey step 8 rule: the first AI button on Positioning, then the credits message anywhere on the page.
  await check("J8 out-of-credits on Positioning, as the updated journey step 8 reads it", async () => {
    const p = await open("page=positioning&sec=positioning&s=draft&credits=none"); await card(p).waitFor();
    const ai = p.getByRole("button", { name: /\bai\b|suggest|generate|draft with|write with|help me answer|refine/i }).first();
    assert.equal(await ai.count(), 1); await ai.click(); await p.getByRole("link", { name: "Buy credits" }).waitFor();
    const text = (await p.locator("body").innerText()).replace(/\s+/g, " ");
    assert.ok(/credit/i.test(text) && !/insufficient ai credits/i.test(text));
    await shot(p, "positioning-out-of-credits"); await p.close();
  });
  await check("M phone widths 390 and 320: no sideways scrolling on any Foundation page", async () => {
    for (const w of [390, 320]) for (const qs of ["page=home&s=changes", "page=core&s=changes", "page=audit&sec=brand_audit", "page=audience&sec=audience", "page=positioning&sec=positioning", "page=messaging&sec=messaging", "page=expression&sec=expression", "page=review"]) {
      const p = await open(qs, w, 844); await p.locator(".fnd-tbl, .fv3-status").first().waitFor(); await p.waitForTimeout(200);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, `${qs} @${w}: overflow ${over}px`);
      if (w === 390) await shot(p, `${qs.split("&")[0].slice(5)}-phone`);
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
