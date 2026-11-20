// Foundation Home and section-page rules from the approved build reference (artboards E and F).
import test from "node:test";
import assert from "node:assert/strict";
import {
  reviewState, homeRows, lockedCount, nextStep, latestNote, shortDate, requiredLine, reviewCard, aiButtonLabel,
  outOfCredits, changesRequested, SECTION_IDS,
} from "../src/lib/foundationSections.mjs";

const sec = (id, extra = {}) => ({ section_id: id, status: "draft", ...extra });
const ready = (id, score) => ({ id, score });

test("review state follows the spec table", () => {
  assert.equal(reviewState(sec("core_truth", { status: "locked" })), "locked");
  assert.equal(reviewState(sec("core_truth", { status: "submitted" })), "waiting");
  assert.equal(reviewState(sec("core_truth", { status: "in_review" })), "waiting");
  assert.equal(reviewState(sec("core_truth", { review_note: "Tighten it." }), ready("core_truth", 40)), "changes_requested");
  assert.equal(reviewState(sec("core_truth"), ready("core_truth", 40)), "in_progress");
  assert.equal(reviewState(sec("core_truth"), ready("core_truth", 0)), "not_started");
  assert.equal(reviewState(undefined, undefined), "not_started");
});

test("a note only means changes requested while the section is a draft", () => {
  assert.equal(changesRequested(sec("x", { review_note: "n" })), true);
  assert.equal(changesRequested(sec("x", { status: "submitted", review_note: "n" })), false);
});

test("home rows: seven in order, Review and Lock locked only when all six are", () => {
  const rows = homeRows(SECTION_IDS.map((id) => sec(id)), []);
  assert.deepEqual(rows.map((r) => r.name), ["Diagnostic Insight", "Core Truth", "Audience Truth", "Positioning", "Messaging", "Brand Expression", "Review and Lock"]);
  assert.equal(rows[6].label, "Not started");
  const all = homeRows(SECTION_IDS.map((id) => sec(id, { status: "locked" })), []);
  assert.equal(all[6].label, "Locked");
  assert.equal(lockedCount(all), 7);
  const three = homeRows(SECTION_IDS.map((id, i) => sec(id, i < 3 ? { status: "locked" } : {})), []);
  assert.equal(lockedCount(three), 3);
});

test("next step: changes requested first, then first unfinished, then waiting", () => {
  const rows = homeRows([sec("brand_audit", { status: "locked" }), sec("core_truth"), sec("audience", { review_note: "x" })], [ready("core_truth", 30)]);
  assert.deepEqual([nextStep(rows).title, nextStep(rows).button, nextStep(rows).path], ["Update Audience Truth", "Open Audience Truth", "/audience"]);
  const cont = homeRows([sec("brand_audit", { status: "locked" }), sec("core_truth")], [ready("core_truth", 30)]);
  assert.equal(nextStep(cont).title, "Continue Core Truth");
  const start = homeRows([sec("brand_audit", { status: "locked" })], []);
  assert.equal(nextStep(start).title, "Start Core Truth");
  assert.equal(nextStep(start).body, "Watch the lesson, then answer in your own words.");
  const wait = homeRows(SECTION_IDS.map((id) => sec(id, { status: "submitted" })), []);
  const w = nextStep(wait);
  assert.equal(w.title, "Waiting for Shake"); assert.equal(w.button, null);
  assert.equal(w.body, "Every section is with Shake. You'll get an email when there's news.");
});

test("latest note picks the newest across sections; none gives null", () => {
  assert.equal(latestNote([sec("core_truth")]), null);
  const n = latestNote([sec("core_truth", { review_note: "old", review_note_at: "2026-11-10T00:00:00Z" }), sec("messaging", { review_note: "new", review_note_at: "2026-11-17T09:00:00Z" })]);
  assert.deepEqual([n.sectionName, n.text, shortDate(n.at)], ["Messaging", "new", "Nov 17"]);
  assert.equal(shortDate(null), "");
});

test("required line and review card wording", () => {
  assert.equal(requiredLine({ required_complete: true }), "Required fields are filled");
  assert.equal(requiredLine({ required_complete: false, missing_items: ["a", "b"] }), "2 required fields left");
  assert.equal(requiredLine({ required_complete: false, missing_items: ["a"] }), "1 required field left");
  assert.equal(reviewCard(sec("x")).heading, "Draft");
  assert.equal(reviewCard(sec("x", { review_note: "n" })).heading, "Changes requested");
  assert.equal(reviewCard(sec("x", { status: "submitted" })).text, "Shake gets an email when you submit.");
  assert.equal(reviewCard(sec("x", { status: "in_review" })).heading, "Shake is reviewing");
  assert.deepEqual(reviewCard(sec("x", { status: "locked" })), { heading: "Approved and locked", text: "To make changes, request an unlock.", edit: false });
});

test("one AI button per field: Help me answer when empty, Refine when filled", () => {
  assert.equal(aiButtonLabel(""), "Help me answer");
  assert.equal(aiButtonLabel("  "), "Help me answer");
  assert.equal(aiButtonLabel("text"), "Refine");
  assert.equal(aiButtonLabel([]), "Help me answer");
  assert.equal(aiButtonLabel(["", "x"]), "Refine");
});

test("out of credits is the server's 402", () => {
  assert.equal(outOfCredits({ status: 402 }), true);
  assert.equal(outOfCredits({ status: 500 }), false);
});
