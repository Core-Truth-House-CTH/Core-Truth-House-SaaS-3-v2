// A locked Foundation section: every field read-only, plain wording on the review card, and Request unlock still offered.
// sectionLock() is what the shared section layout (FoundationSectionLayout.jsx) uses; reviewCard() is the card's wording.
import test from "node:test";
import assert from "node:assert/strict";
import * as sections from "../src/lib/foundationSections.mjs";

const { memberActions } = sections;
const lockOf = (section) => {
  assert.equal(typeof sections.sectionLock, "function", "sectionLock helper is missing");
  return sections.sectionLock(section);
};

test("a locked section disables its fields and the review card says so plainly", () => {
  const lock = lockOf({ section_id: "core_truth", status: "locked" });
  assert.equal(lock.locked, true);
  assert.equal(lock.fieldsDisabled, true);
  const card = sections.reviewCard({ section_id: "core_truth", status: "locked" });
  assert.equal(card.heading, "Approved and locked");
  assert.equal(card.text, "To make changes, request an unlock.");
  assert.ok(!(card.heading + card.text).includes("\u2014"), "no em-dash in copy");
});

test("a locked section with an unlock already requested stays locked", () => {
  const lock = lockOf({ status: "locked", unlock_requested_at: "2026-11-18T00:00:00Z" });
  assert.equal(lock.fieldsDisabled, true);
});

test("draft, submitted and in-review sections keep their fields editable", () => {
  for (const status of ["draft", "submitted", "in_review"]) {
    const lock = lockOf({ status });
    assert.equal(lock.locked, false, status);
    assert.equal(lock.fieldsDisabled, false, status);
  }
});

test("unknown or not-yet-loaded status stays editable (the server still refuses a locked save)", () => {
  for (const section of [undefined, null, {}, { status: "" }]) {
    assert.equal(lockOf(section).fieldsDisabled, false, JSON.stringify(section));
  }
});

test("the lock agrees with memberActions: locked exactly when the member cannot edit", () => {
  for (const status of ["draft", "submitted", "in_review", "locked"]) {
    assert.equal(lockOf({ status }).fieldsDisabled, !memberActions({ status }).editable, status);
  }
});

test("when locked, Request unlock is still offered to the member", () => {
  const section = { status: "locked" };
  assert.equal(lockOf(section).fieldsDisabled, true);
  assert.equal(memberActions(section).requestUnlock, true);
});
