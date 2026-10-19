import test from "node:test";
import assert from "node:assert/strict";
import {
 advanceDiagnosticAnswer,
 buildDiagnosticAuthPath,
  bindDiagnosticDraftOwner,
  clearDiagnosticDraft,
  createDiagnosticDraftId,
  createFreshDiagnosticDraft,
  getDiagnosticAccess,
  getDiagnosticSignupRedirectUrl,
  persistDiagnosticDraft,
  restoreDiagnosticDraft,
} from "./brandDiagnosticDraft.mjs";

const questionIds = Array.from({ length: 15 }, (_, index) => `q${index + 1}`);
const answers = Object.fromEntries(questionIds.map((id) => [id, 3]));
const now = 1_800_000_000_000;

function makeStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

function draft(overrides = {}) {
  return {
    version: 1,
    draftId: createDiagnosticDraftId(),
    step: "quiz",
    currentQuestion: 7,
    answers: Object.fromEntries(Object.entries(answers).slice(0, 7)),
    leadInfo: { marketing_consent: false },
    ownerUserId: null,
    workspaceId: null,
    updatedAt: now,
    ...overrides,
  };
}

test("anonymous visitors can take the quiz but cannot submit or reveal full results", () => {
  assert.deepEqual(getDiagnosticAccess({}), {
    canTakeQuiz: true,
    canSubmit: false,
    canRevealFullResults: false,
  });
  assert.equal(getDiagnosticAccess({ isSignedIn: true }).canRevealFullResults, false);
});

test("an anonymous answer draft survives reload and the sign-in return, then binds to that account", () => {
  const storage = makeStorage();
  const original = draft({ step: "result", answers });
  assert.equal(persistDiagnosticDraft(storage, original, { questionIds, now }), true);
  const afterReload = restoreDiagnosticDraft(storage, { questionIds, now });
  assert.equal(afterReload.draftId, original.draftId);
  assert.deepEqual(afterReload.answers, answers);
  const claimed = bindDiagnosticDraftOwner(afterReload, { userId: "user-a", workspaceId: "workspace-a" });
  assert.equal(claimed.ownerUserId, "user-a");
  assert.equal(persistDiagnosticDraft(storage, claimed, { questionIds, now }), true);
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, userId: "user-a", workspaceId: "workspace-a", now }).draftId, original.draftId);
});

test("optional industry and business type selections survive a draft roundtrip and invalid values are discarded", () => {
  const storage = makeStorage();
  const selected = draft({
    leadInfo: { industry_niche: "creative_services", business_type: "digital_products" },
  });
  assert.equal(persistDiagnosticDraft(storage, selected, { questionIds, now }), true);
  const restored = restoreDiagnosticDraft(storage, { questionIds, now });
  assert.equal(restored.leadInfo.industry_niche, "creative_services");
  assert.equal(restored.leadInfo.business_type, "digital_products");

  const invalidStorage = makeStorage();
  persistDiagnosticDraft(invalidStorage, draft({
    leadInfo: { industry_niche: "invented_niche", business_type: "unlisted_model" },
  }), { questionIds, now });
  const cleaned = restoreDiagnosticDraft(invalidStorage, { questionIds, now });
  assert.equal(cleaned.leadInfo.industry_niche, "");
  assert.equal(cleaned.leadInfo.business_type, "");
});

test("older draft lead info remains valid when selector fields are absent", () => {
  const storage = makeStorage();
  const olderDraft = draft({ leadInfo: { business_name: "Older draft", marketing_consent: false } });
  persistDiagnosticDraft(storage, olderDraft, { questionIds, now });
  const restored = restoreDiagnosticDraft(storage, { questionIds, now });
  assert.equal(restored.leadInfo.industry_niche, "");
  assert.equal(restored.leadInfo.business_type, "");
});

test("starting a new attempt creates a fresh empty draft without changing saved history", () => {
  const storage = makeStorage();
  const unfinished = draft({
    leadInfo: { industry_niche: "beauty", business_type: "services", marketing_consent: true },
    answers: { q1: 1, q2: 2 },
  });
  persistDiagnosticDraft(storage, unfinished, { questionIds, now });
  const savedHistory = Object.freeze([{ id: "saved-report-1", score: 45 }]);
  const historySnapshot = structuredClone(savedHistory);

  const fresh = createFreshDiagnosticDraft({ userId: "user-a", workspaceId: "workspace-a", now });
  assert.notEqual(fresh.draftId, unfinished.draftId);
  assert.equal(fresh.step, "lead");
  assert.equal(fresh.currentQuestion, 0);
  assert.deepEqual(fresh.answers, {});
  assert.deepEqual(fresh.leadInfo, {
    business_name: "",
    industry_niche: "",
    business_type: "",
    years_in_business: "",
    revenue_band: "",
    current_challenge: "",
    marketing_consent: false,
  });
  assert.equal(fresh.ownerUserId, "user-a");
  assert.equal(fresh.workspaceId, "workspace-a");

  persistDiagnosticDraft(storage, fresh, { questionIds, now });
  const restored = restoreDiagnosticDraft(storage, { questionIds, userId: "user-a", workspaceId: "workspace-a", now });
  assert.equal(restored.draftId, fresh.draftId);
  assert.deepEqual(restored.answers, {});
  assert.deepEqual(savedHistory, historySnapshot);
  assert.equal(savedHistory[0].id, "saved-report-1");
});

test("signed-out completion persists the result step and returns to it through sign-in", () => {
 const storage = makeStorage();
  const originalDraft = draft();
 let state = { answers: {}, currentQuestion: 0, step: "quiz" };
 for (let index = 0; index < questionIds.length; index += 1) {
 state = advanceDiagnosticAnswer({
 questionIds,
 answers: state.answers,
 currentQuestion: state.currentQuestion,
 value: 3,
 });
 assert.equal(persistDiagnosticDraft(storage, {
 ...originalDraft,
 ...state,
 ownerUserId: null,
 workspaceId: null,
 }, { questionIds, now }), true);
 }

 const restored = restoreDiagnosticDraft(storage, { questionIds, now });
 assert.equal(restored.step, "result");
 assert.equal(Object.keys(restored.answers).length, questionIds.length);
 assert.deepEqual(getDiagnosticAccess({ isSignedIn: false }), {
 canTakeQuiz: true,
 canSubmit: false,
 canRevealFullResults: false,
 });
 assert.equal(buildDiagnosticAuthPath("/sign-in", "/brand-diagnostic", "?source=test"),
 "/sign-in?redirect_url=%2Fbrand-diagnostic%3Fsource%3Dtest");
  assert.equal(
    buildDiagnosticAuthPath("/sign-in", "/brand-diagnostic", ""),
    "/sign-in?redirect_url=%2Fbrand-diagnostic",
  );
  assert.equal(
    buildDiagnosticAuthPath("/sign-up", "/brand-diagnostic", ""),
    "/sign-up?redirect_url=%2Fbrand-diagnostic",
  );
  assert.equal(
    buildDiagnosticAuthPath("/sign-in", "/brand-diagnostic/report/result-42", "?from=history"),
    "/sign-in?redirect_url=%2Fbrand-diagnostic%2Freport%2Fresult-42%3Ffrom%3Dhistory",
  );
  assert.equal(
    buildDiagnosticAuthPath("/sign-up", "/brand-diagnostic/report/result-42", ""),
    "/sign-up?redirect_url=%2Fbrand-diagnostic%2Freport%2Fresult-42",
  );

 const claimed = bindDiagnosticDraftOwner(restored, { userId: "user-a", workspaceId: "workspace-a" });
 assert.equal(claimed.step, "result");
 assert.deepEqual(claimed.answers, restored.answers);
 assert.equal(getDiagnosticAccess({ isSignedIn: true }).canRevealFullResults, false);
 assert.equal(getDiagnosticAccess({ isSignedIn: true, serverResult: { id: "saved-1", score: 45 } }).canRevealFullResults, true);
});

test("a draft cannot follow a user or workspace switch", () => {
  const storage = makeStorage();
  const owned = draft({ ownerUserId: "user-a", workspaceId: "workspace-a" });
  persistDiagnosticDraft(storage, owned, { questionIds, now });
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, userId: "user-b", workspaceId: "workspace-a", now }), null);
  persistDiagnosticDraft(storage, owned, { questionIds, now });
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, userId: "user-a", workspaceId: "workspace-b", now }), null);
  assert.equal(storage.values.size, 0);
  assert.equal(bindDiagnosticDraftOwner(owned, { userId: "user-b", workspaceId: "workspace-a" }), null);
});

test("only server-saved scores unlock the result view", () => {
  assert.equal(getDiagnosticAccess({ isSignedIn: true, serverResult: { score: 45 } }).canRevealFullResults, false);
  assert.equal(getDiagnosticAccess({ isSignedIn: true, serverResult: { id: "saved-1", score: 45 } }).canRevealFullResults, true);
  assert.equal(getDiagnosticAccess({ isSignedIn: false, serverResult: { id: "saved-1", score: 45 } }).canRevealFullResults, false);
});

test("diagnostic signup returns to the report unless an explicit return route was supplied", () => {
  assert.equal(getDiagnosticSignupRedirectUrl({ source: "diagnostic" }), "/brand-diagnostic");
  assert.equal(
    getDiagnosticSignupRedirectUrl({ source: "diagnostic", redirectUrl: "/brand-diagnostic?view=results" }),
    "/brand-diagnostic?view=results",
  );
  assert.equal(getDiagnosticSignupRedirectUrl({ source: "other" }), "/command-center");
});

test("retake clears the prior local draft and consent", () => {
  const storage = makeStorage();
  persistDiagnosticDraft(storage, draft({ step: "result", answers, leadInfo: { marketing_consent: true } }), { questionIds, now });
  clearDiagnosticDraft(storage);
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, now }), null);
  const retake = draft({ step: "lead", answers: {}, currentQuestion: 0, leadInfo: { marketing_consent: false } });
  assert.equal(retake.leadInfo.marketing_consent, false);
});

test("expired or oversized drafts are discarded", () => {
  const storage = makeStorage();
  persistDiagnosticDraft(storage, draft(), { questionIds, now: now - 7 * 60 * 60 * 1000 });
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, now }), null);
  storage.setItem("cth-brand-diagnostic-draft-v1", "x".repeat(12_001));
  assert.equal(restoreDiagnosticDraft(storage, { questionIds, now }), null);
  assert.equal(storage.values.size, 0);
});

test("a draft waits for workspace resolution and clears only after a different workspace is known", () => {
  const storage = makeStorage();
  const owned = draft({ ownerUserId: "user-a", workspaceId: "workspace-a" });
  persistDiagnosticDraft(storage, owned, { questionIds, now });
  const duringWorkspaceLoad = restoreDiagnosticDraft(storage, {
    questionIds, userId: "user-a", workspaceId: null, workspaceReady: false, now,
  });
  assert.equal(duringWorkspaceLoad.draftId, owned.draftId);
  assert.equal(bindDiagnosticDraftOwner(duringWorkspaceLoad, { userId: "user-a", workspaceId: null }).workspaceId, "workspace-a");
  assert.equal(restoreDiagnosticDraft(storage, {
    questionIds, userId: "user-a", workspaceId: "workspace-b", workspaceReady: true, now,
  }), null);
});
