const DRAFT_KEY = "cth-brand-diagnostic-draft-v1";
const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_DRAFT_CHARS = 12_000;
const INDUSTRY_NICHES = new Set([
  "beauty", "travel", "real_estate", "health_wellness", "creative_services",
  "education", "retail_ecommerce", "food_beverage", "technology",
  "professional_services", "nonprofit", "other",
]);
const BUSINESS_TYPES = new Set([
  "services", "physical_products", "digital_products", "memberships", "mixed", "other",
]);

function cleanLeadInfo(value = {}) {
  return {
    business_name: typeof value.business_name === "string" ? value.business_name.slice(0, 160) : "",
    industry_niche: INDUSTRY_NICHES.has(value.industry_niche) ? value.industry_niche : "",
    business_type: BUSINESS_TYPES.has(value.business_type) ? value.business_type : "",
    years_in_business: typeof value.years_in_business === "string" ? value.years_in_business.slice(0, 80) : "",
    revenue_band: typeof value.revenue_band === "string" ? value.revenue_band.slice(0, 80) : "",
    current_challenge: typeof value.current_challenge === "string" ? value.current_challenge.slice(0, 160) : "",
    marketing_consent: value.marketing_consent === true,
  };
}

function cleanAnswers(value, questionIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const allowed = new Set(questionIds);
  const answers = {};
  for (const [id, answer] of Object.entries(value)) {
    if (!allowed.has(id) || !Number.isInteger(answer) || answer < 1 || answer > 4) return null;
    answers[id] = answer;
  }
  return answers;
}

function cleanDraft(value, { questionIds, now = Date.now() }) {
  if (!value || value.version !== DRAFT_VERSION || typeof value.draftId !== "string") return null;
  if (!/^[a-f0-9-]{36}$/i.test(value.draftId)) return null;
  const updatedAt = Number(value.updatedAt);
  if (!Number.isFinite(updatedAt) || updatedAt > now + 5 * 60 * 1000 || now - updatedAt > DRAFT_TTL_MS) return null;
  const answers = cleanAnswers(value.answers, questionIds);
  if (!answers) return null;
  const validSteps = new Set(["lead", "quiz", "result"]);
  let step = validSteps.has(value.step) ? value.step : "lead";
  if (step === "result" && questionIds.some((id) => !(id in answers))) step = "quiz";
  const currentQuestion = Math.min(Math.max(Number(value.currentQuestion) || 0, 0), questionIds.length - 1);
  return {
    version: DRAFT_VERSION,
    draftId: value.draftId,
    step,
    currentQuestion,
    answers,
    leadInfo: cleanLeadInfo(value.leadInfo),
    ownerUserId: typeof value.ownerUserId === "string" ? value.ownerUserId : null,
    workspaceId: typeof value.workspaceId === "string" ? value.workspaceId : null,
    updatedAt,
  };
}

export function createDiagnosticDraftId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function createFreshDiagnosticDraft({ userId = null, workspaceId = null, now = Date.now() } = {}) {
  return {
    version: DRAFT_VERSION,
    draftId: createDiagnosticDraftId(),
    step: "lead",
    currentQuestion: 0,
    answers: {},
    leadInfo: cleanLeadInfo(),
    ownerUserId: userId,
    workspaceId,
    updatedAt: now,
  };
}

export function advanceDiagnosticAnswer({ questionIds, answers = {}, currentQuestion = 0, value } = {}) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return null;
  const index = Math.min(Math.max(Number(currentQuestion) || 0, 0), questionIds.length - 1);
  const questionId = questionIds[index];
  const isLastQuestion = index === questionIds.length - 1;
  return {
    answers: { ...answers, [questionId]: value },
    currentQuestion: isLastQuestion ? index : index + 1,
    step: isLastQuestion ? "result" : "quiz",
  };
}

export function buildDiagnosticAuthPath(route, pathname, search = "") {
  const returnTo = `${pathname}${search}`;
  return `${route}?redirect_url=${encodeURIComponent(returnTo)}`;
}

export function getDiagnosticSignupRedirectUrl({ redirectUrl = "", source = "" } = {}) {
  if (redirectUrl) return redirectUrl;
  return source === "diagnostic" ? "/brand-diagnostic" : "/command-center";
}

export function getDiagnosticAccess({ isSignedIn = false, serverResult = null } = {}) {
  return {
    canTakeQuiz: true,
    canSubmit: Boolean(isSignedIn),
    canRevealFullResults: Boolean(isSignedIn && serverResult?.id && Number.isInteger(serverResult?.score)),
  };
}

export function clearDiagnosticDraft(storage = globalThis.sessionStorage) {
  try {
    storage?.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be unavailable in private browsing or locked-down contexts.
  }
}

export function persistDiagnosticDraft(storage, draft, { questionIds, now = Date.now() } = {}) {
  const cleaned = cleanDraft({ ...draft, updatedAt: now }, { questionIds, now });
  if (!storage || !cleaned) return false;
  const serialized = JSON.stringify(cleaned);
  if (serialized.length > MAX_DRAFT_CHARS) return false;
  try {
    storage.setItem(DRAFT_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function restoreDiagnosticDraft(storage, { questionIds, userId = null, workspaceId = null, workspaceReady = true, now = Date.now() } = {}) {
  if (!storage) return null;
  let serialized;
  try {
    serialized = storage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
  if (!serialized) return null;
  if (serialized.length > MAX_DRAFT_CHARS) {
    clearDiagnosticDraft(storage);
    return null;
  }
  try {
    const draft = cleanDraft(JSON.parse(serialized), { questionIds, now });
    if (!draft || (draft.ownerUserId && draft.ownerUserId !== userId) || (workspaceReady && draft.workspaceId && draft.workspaceId !== workspaceId)) {
      clearDiagnosticDraft(storage);
      return null;
    }
    return draft;
  } catch {
    clearDiagnosticDraft(storage);
    return null;
  }
}

export function bindDiagnosticDraftOwner(draft, { userId = null, workspaceId = null } = {}) {
  if (!draft) return null;
  if (draft.ownerUserId && draft.ownerUserId !== userId) return null;
  if (draft.workspaceId && workspaceId && draft.workspaceId !== workspaceId) return null;
  return {
    ...draft,
    ownerUserId: userId || draft.ownerUserId || null,
    workspaceId: workspaceId || draft.workspaceId || null,
  };
}

