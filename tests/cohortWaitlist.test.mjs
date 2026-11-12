// Cohort waitlist: helpers, routing and copy. No app startup, network or env files.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WAITLIST_TIERS, WAITLIST_YEARS, parseWaitlistQuery, waitlistHref, waitlistPayload,
} from "../src/lib/cohortWaitlist.mjs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const form = { name: " Avery Stone ", email: "avery@example.com", businessName: "Stone Studio", yearsInBusiness: "3 to 5 years", usResident: "yes" };

test("payload matches the backend contract", () => {
  const result = waitlistPayload(form, { source: "brand_diagnostic", recommendedTier: "House" });
  assert.deepEqual(result, { ok: true, body: {
    name: "Avery Stone", email: "avery@example.com", business_name: "Stone Studio",
    years_in_business: "3 to 5 years", us_resident: true, source: "brand_diagnostic", recommended_tier: "House",
  } });
  assert.equal(waitlistPayload({ ...form, usResident: "no" }).body.us_resident, false);
  assert.equal(waitlistPayload(form, { source: "evil", recommendedTier: "Mansion" }).body.source, "direct");
  assert.equal("recommended_tier" in waitlistPayload(form, { recommendedTier: "Mansion" }).body, false);
});

test("honeypot is only sent when something filled it", () => {
  assert.equal("cth_hp_field" in waitlistPayload(form).body, false);
  assert.equal("cth_hp_field" in waitlistPayload({ ...form, hp: "   " }).body, false);
  assert.equal(waitlistPayload({ ...form, hp: "http://spam.example" }).body.cth_hp_field, "http://spam.example");
  assert.equal(waitlistPayload({ ...form, hp: "x".repeat(900) }).body.cth_hp_field.length, 500);
  const component = read("src/components/cohort/CohortWaitlistForm.jsx");
  assert.match(component, /className="cth-waitlist-hp" aria-hidden="true"/);
  assert.match(component, /name="cth_hp_field"\s+tabIndex=\{-1\}\s+autoComplete="off"\s+data-lpignore="true"\s+data-1p-ignore="true"/);
  assert.doesNotMatch(component, /name="website"/);
  assert.match(component, /\.cth-waitlist-hp \{ position: absolute; left: -10000px/);
  assert.match(component, /response\.status === 429/);
});

test("payload refuses incomplete forms", () => {
  for (const bad of [
    { ...form, name: "  " }, { ...form, email: "nope" }, { ...form, businessName: "" },
    { ...form, yearsInBusiness: "forever" }, { ...form, usResident: "" },
  ]) assert.equal(waitlistPayload(bad).ok, false);
});

test("links and query parsing only carry known values", () => {
  assert.equal(waitlistHref({ source: "brand_diagnostic", tier: "Estate" }), "/cohort/waitlist?source=brand_diagnostic&tier=Estate");
  assert.equal(waitlistHref({ source: "x", tier: "<script>" }), "/cohort/waitlist");
  assert.deepEqual(parseWaitlistQuery("?source=cohort_page&tier=Structure"), { source: "cohort_page", tier: "Structure" });
  assert.deepEqual(parseWaitlistQuery("?source=x&tier=y"), { source: "direct", tier: null });
});

test("years and tiers match the backend lists", () => {
  const backend = new URL("../../authoritative-backend/backend/routes/cohort_waitlist.py", import.meta.url);
  if (!fs.existsSync(backend)) return;
  const source = fs.readFileSync(backend, "utf8");
  for (const year of WAITLIST_YEARS) assert.ok(source.includes(`"${year}"`), year);
  for (const tier of WAITLIST_TIERS) assert.ok(source.includes(`"${tier}"`), tier);
});

test("form posts to the public endpoint without auth and shows the routed tier", () => {
  const component = read("src/components/cohort/CohortWaitlistForm.jsx");
  assert.match(component, /\/api\/cohort\/waitlist/);
  assert.doesNotMatch(component, /getToken|Authorization|useAuth/);
  assert.match(component, /Where you'd start:/);
  assert.match(read("src/App.jsx"), /path="\/cohort\/waitlist" element=\{<CohortWaitlistPage \/>\}/);
});

test("waitlist shows on closed apply page and /cohort buttons follow intake", () => {
  const apply = read("src/pages/CohortApplyPage.jsx");
  assert.match(apply, /intakeState === "closed" \? <CohortWaitlistForm source="cohort_apply" \/>/);
  const landing = read("src/pages/estate/EstateCohortPage.jsx");
  assert.doesNotMatch(landing, /<Link to="\/cohort\/apply" className="ec-btn/);
  assert.equal((landing.match(/<CohortCta /g) || []).length, 2);
  assert.match(landing, /p\.accepting_applications === true/);
});

test("diagnostic result buttons go to the waitlist, not plan sign-up", () => {
  const diagnostic = read("src/pages/BrandDiagnosticPage.jsx");
  assert.match(diagnostic, /waitlistHref\(\{ source: "brand_diagnostic", tier: recommendation\.tier \}\)/);
  assert.doesNotMatch(diagnostic, /href=\{\s*`\/sign-up\?tier=/);
  assert.match(diagnostic, /Where you'd start:/);
  // After saving, the result panel on the page repeats the tier and button.
  const live = diagnostic.slice(diagnostic.indexOf('data-testid="diagnostic-live-start"'));
  assert.match(live.slice(0, 600), /Where you'd start: <strong>\{savedTier\}<\/strong>/);
  assert.match(live.slice(0, 600), /waitlistHref\(\{ source: "brand_diagnostic", tier: savedTier \}\)/);
  assert.match(diagnostic, /const savedTier = WAITLIST_TIERS\.includes\(resultSnapshot\?\.recommendation\?\.tier\)/);
  assert.doesNotMatch(live.slice(0, 600), /\u2014|refund|start date|starts? on|December/i);
  const results = read("src/pages/PublicDiagnosticResults.jsx");
  assert.match(results, /waitlistHref\(\{ source: "diagnostic_return", tier: startTier \}\)/);
  assert.doesNotMatch(results, /\/sign-up\?tier=/);
  assert.match(results, /Where you'd start:/);
});

test("waitlist copy has no em dashes, refund or start-date promises, or legal name", () => {
  const copy = [
    read("src/components/cohort/CohortWaitlistForm.jsx"),
    read("src/pages/CohortWaitlistPage.jsx"),
    read("src/lib/cohortWaitlist.mjs"),
  ].join("\n");
  const metadata = read("scripts/inject-static-route-metadata.mjs");
  const entry = metadata.slice(metadata.indexOf('route: "/cohort/waitlist"'), metadata.indexOf('route: "/enrollment-policy"'));
  for (const text of [copy, entry]) {
    assert.doesNotMatch(text, /\u2014/);
    assert.doesNotMatch(text, /refund|money.back|guarantee|starts? on|start date|December|Dec\.? \d|begins? on/i);
    assert.doesNotMatch(text, /Shakerian|Brooks|\bLLC\b|\bInc\.?\b/);
  }
  assert.match(copy + entry, /US only for now|US residents only for now/);
});
