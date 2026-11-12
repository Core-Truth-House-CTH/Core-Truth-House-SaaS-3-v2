import test from "node:test";
import assert from "node:assert/strict";
import {
  statusLabel, noteRequired, validateNote, memberPath, reviewerPath, memberActions, reviewerActions,
  scoreNote, errorMessage, MAX_NOTE, SECTION_IDS, queueKey,
} from "../src/lib/foundationSections.mjs";

test("status labels are plain words and unknown values fall back to Draft", () => {
  assert.equal(statusLabel("submitted"), "Submitted for review");
  assert.equal(statusLabel("in_review"), "In review");
  assert.equal(statusLabel("locked"), "Locked");
  assert.equal(statusLabel(undefined), "Draft");
  assert.equal(statusLabel("weird"), "Draft");
});

test("only a complete draft can be submitted; an incomplete draft is blocked, not hidden", () => {
  assert.equal(memberActions({ status: "draft", required_complete: true }).submit, true);
  const blocked = memberActions({ status: "draft", required_complete: false });
  assert.equal(blocked.submit, false);
  assert.equal(blocked.submitBlocked, true);
  for (const status of ["submitted", "in_review", "locked"]) {
    assert.equal(memberActions({ status, required_complete: true }).submit, false, status);
  }
});

test("withdraw is only for a submitted section; in review cannot be withdrawn", () => {
  assert.equal(memberActions({ status: "submitted" }).withdraw, true);
  assert.equal(memberActions({ status: "in_review" }).withdraw, false);
  assert.equal(memberActions({ status: "draft" }).withdraw, false);
});

test("a locked section offers an unlock request once, then shows that one is pending", () => {
  assert.equal(memberActions({ status: "locked" }).requestUnlock, true);
  const pending = memberActions({ status: "locked", unlock_requested_at: "2026-11-12T00:00:00Z" });
  assert.equal(pending.requestUnlock, false);
  assert.equal(pending.unlockRequested, true);
  assert.equal(memberActions({ status: "locked" }).editable, false);
  assert.equal(memberActions({ status: "submitted" }).editable, true);
});

test("reviewer actions follow the server's allowed transitions", () => {
  assert.deepEqual(reviewerActions({ status: "submitted" }), { startReview: true, approve: true, requestChanges: true, unlock: false });
  assert.deepEqual(reviewerActions({ status: "in_review" }), { startReview: false, approve: true, requestChanges: true, unlock: false });
  assert.deepEqual(reviewerActions({ status: "locked" }), { startReview: false, approve: false, requestChanges: false, unlock: true });
  assert.deepEqual(reviewerActions({ status: "draft" }), { startReview: false, approve: false, requestChanges: false, unlock: false });
});

test("request changes, unlock and unlock requests need a note; submit and approve do not", () => {
  for (const action of ["request-changes", "unlock", "request-unlock"]) {
    assert.equal(noteRequired(action), true, action);
    assert.notEqual(validateNote(action, "   "), "", action);
    assert.equal(validateNote(action, "Please tighten the mission."), "", action);
  }
  for (const action of ["submit", "withdraw", "start-review", "approve"]) {
    assert.equal(noteRequired(action), false, action);
    assert.equal(validateNote(action, ""), "", action);
  }
  assert.notEqual(validateNote("approve", "x".repeat(MAX_NOTE + 1)), "");
  assert.equal(validateNote("approve", "x".repeat(MAX_NOTE)), "");
});

test("paths match the backend routes and encode ids", () => {
  assert.equal(memberPath("core_truth", "submit"), "/api/foundation/sections/core_truth/submit");
  assert.equal(reviewerPath("ws 1/x", "audience", "request-changes"), "/api/foundation/review/ws%201%2Fx/sections/audience/request-changes");
  assert.equal(SECTION_IDS.length, 6);
  assert.equal(queueKey({ workspace_id: "w", section_id: "s" }), "w:s");
});

test("score note: only a locked section says 100; submitted says it is capped", () => {
  assert.match(scoreNote({ locked: true, score: 100 }), /100%/);
  assert.match(scoreNote({ awaiting_review: true, score: 90 }), /90%/);
  assert.match(scoreNote({ score: 90, completeness: 100 }), /only a locked section reaches 100/);
  assert.equal(scoreNote({ score: 40, completeness: 40 }), "");
  assert.equal(scoreNote(null), "");
});

test("error messages: required-fields list, server message, plain string, fallback", () => {
  assert.equal(errorMessage({ payload: { detail: { code: "required_fields_missing", message: "x", missing: ["Purpose", "Mission"] } } }),
    "Required fields are still missing: Purpose; Mission.");
  assert.equal(errorMessage({ payload: { detail: { code: "note_required", message: "A note is required for this action." } } }), "A note is required for this action.");
  assert.equal(errorMessage({ payload: { detail: "Foundation review is limited to the Core Truth House reviewers." } }),
    "Foundation review is limited to the Core Truth House reviewers.");
  assert.equal(errorMessage({ message: "Network request failed." }), "Network request failed.");
  assert.equal(errorMessage({}), "That did not work. Please try again.");
});
