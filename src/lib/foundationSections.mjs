// Foundation V03: section status, submit and review (pure helpers; no React, no network).
// The server is the authority for every rule here. These helpers only decide what to SHOW,
// so a button is never offered for something the server would refuse.

export const SECTION_IDS = ["brand_audit", "core_truth", "audience", "positioning", "messaging", "expression"];

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted for review",
  in_review: "In review",
  locked: "Locked",
};


export const MAX_NOTE = 2000;

// Actions that need a written note (the server answers 422 note_required without one).
const NOTE_REQUIRED = new Set(["request-unlock", "request-changes", "unlock"]);

export function statusLabel(status) {
  return STATUS_LABELS[status] || "Draft";
}

export function noteRequired(action) {
  return NOTE_REQUIRED.has(action);
}

export function validateNote(action, note) {
  const text = String(note ?? "").trim();
  if (noteRequired(action) && !text) return "Please add a note first.";
  if (text.length > MAX_NOTE) return `That note is too long (limit ${MAX_NOTE} characters).`;
  return "";
}

export function memberPath(sectionId, action) {
  return `/api/foundation/sections/${encodeURIComponent(sectionId)}/${action}`;
}

export function reviewerPath(workspaceId, sectionId, action) {
  return `/api/foundation/review/${encodeURIComponent(workspaceId)}/sections/${encodeURIComponent(sectionId)}/${action}`;
}

// What the member can do with one of their own sections right now.
export function memberActions(section) {
  const status = section?.status || "draft";
  return {
    submit: status === "draft" && section?.required_complete === true,
    submitBlocked: status === "draft" && section?.required_complete !== true,
    withdraw: status === "submitted",
    requestUnlock: status === "locked" && !section?.unlock_requested_at,
    unlockRequested: status === "locked" && Boolean(section?.unlock_requested_at),
    editable: status !== "locked",
  };
}

// How the shared section layout treats a section's fields. A locked section turns every field
// read-only in one place (the layout's disabled fieldset); the review card, with Request unlock,
// sits outside that fieldset so it stays usable. Unknown or not-yet-loaded status stays editable:
// the server still refuses a locked save with 423.
export function sectionLock(section) {
  const locked = Boolean(section) && !memberActions(section).editable;
  return { locked, fieldsDisabled: locked };
}

// What a reviewer can do with a row from the review queue (or a locked section).
export function reviewerActions(section) {
  const status = section?.status || "draft";
  return {
    startReview: status === "submitted",
    approve: status === "submitted" || status === "in_review",
    requestChanges: status === "submitted" || status === "in_review",
    unlock: status === "locked",
  };
}

export function missingText(section) {
  const items = section?.missing_items || [];
  return items.length ? items.join("; ") : "";
}

export function queueKey(row) {
  return `${row.workspace_id}:${row.section_id}`;
}

// Human message for a failed call. The server sends {detail:{code,message}} or {detail:"..."}.
export function errorMessage(error, fallback = "That did not work. Please try again.") {
  const detail = error?.payload?.detail ?? error?.data?.detail ?? error?.detail;
  if (detail && typeof detail === "object") {
    if (detail.code === "required_fields_missing" && Array.isArray(detail.missing)) {
      return `Required fields are still missing: ${detail.missing.join("; ")}.`;
    }
    if (detail.message) return String(detail.message);
  }
  if (typeof detail === "string" && detail) return detail;
  return error?.message || fallback;
}

// ------------------------------------------------------------------ Foundation Home and section pages (build reference E/F)

// The seven rows a member sees, in order. review_lock has no stored status of its own.
export const FOUNDATION_SECTIONS = [
  ["brand_audit", "Diagnostic Insight", "/brand-audit"],
  ["core_truth", "Core Truth", "/brand-foundation"],
  ["audience", "Audience Truth", "/audience"],
  ["positioning", "Positioning", "/brand-positioning"],
  ["messaging", "Messaging", "/messaging-structure"],
  ["expression", "Brand Expression", "/identity-studio"],
  ["review_lock", "Review and Lock", "/foundation/review-lock"],
];

export const REVIEW_STATE_LABELS = {
  locked: "Locked",
  waiting: "Waiting for Shake",
  changes_requested: "Changes requested",
  in_progress: "In progress",
  not_started: "Not started",
};

export function sectionName(sectionId) {
  return (FOUNDATION_SECTIONS.find(([id]) => id === sectionId) || [null, "Foundation section"])[1];
}

export function sectionPath(sectionId) {
  return (FOUNDATION_SECTIONS.find(([id]) => id === sectionId) || [null, null, "/foundation"])[2];
}

// A draft that still carries a reviewer's note was sent back (submit and approve clear the note).
export function changesRequested(section) {
  return (section?.status || "draft") === "draft" && Boolean(section?.review_note);
}

// One section's member-facing state. readinessSection (from /api/foundation/readiness) only decides
// whether a draft has any saved content.
export function reviewState(section, readinessSection) {
  const status = section?.status || "draft";
  if (status === "locked") return "locked";
  if (status === "submitted" || status === "in_review") return "waiting";
  if (changesRequested(section)) return "changes_requested";
  return Number(readinessSection?.score) > 0 ? "in_progress" : "not_started";
}

// Foundation Home rows: the six stored sections plus Review and Lock, which counts as locked only
// once every stored section is locked.
export function homeRows(sections = [], readinessSections = []) {
  const stored = SECTION_IDS.map((id) => {
    const section = sections.find((s) => s.section_id === id);
    return { id, section, state: reviewState(section, readinessSections.find((r) => r.id === id)) };
  });
  const allLocked = stored.every((r) => r.state === "locked");
  const rows = [...stored, { id: "review_lock", section: null, state: allLocked ? "locked" : "not_started" }];
  return rows.map((r, i) => ({ ...r, n: i + 1, name: sectionName(r.id), path: sectionPath(r.id), label: REVIEW_STATE_LABELS[r.state] }));
}

export function lockedCount(rows) {
  return rows.filter((r) => r.state === "locked").length;
}

// "Your next step": the first sent-back section, else the first unfinished one, else waiting.
export function nextStep(rows) {
  const content = rows.filter((r) => r.id !== "review_lock");
  const sentBack = content.find((r) => r.state === "changes_requested");
  if (sentBack) return { kind: "update", id: sentBack.id, title: `Update ${sentBack.name}`, body: "Shake sent it back with a note. Make the change, then submit it again.", path: sentBack.path, button: `Open ${sentBack.name}` };
  const open = content.find((r) => r.state === "in_progress" || r.state === "not_started");
  if (open) return { kind: open.state === "in_progress" ? "continue" : "start", id: open.id, title: `${open.state === "in_progress" ? "Continue" : "Start"} ${open.name}`, body: "Watch the lesson, then answer in your own words.", path: open.path, button: `Open ${open.name}` };
  return { kind: "waiting", id: null, title: "Waiting for Shake", body: "Every section is with Shake. You'll get an email when there's news.", path: null, button: null };
}

// The most recent reviewer note across all sections, or null.
export function latestNote(sections = []) {
  const withNote = sections.filter((s) => s?.review_note);
  if (!withNote.length) return null;
  const pick = withNote.reduce((a, b) => (String(b.review_note_at || "") > String(a.review_note_at || "") ? b : a));
  return { sectionId: pick.section_id, sectionName: sectionName(pick.section_id), text: pick.review_note, at: pick.review_note_at || null };
}

// "Nov 17" for a stored ISO time; "" when there is none.
export function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Required-fields line above Submit: 0 when complete, otherwise how many are still missing.
export function requiredLeft(section) {
  if (section?.required_complete === true) return 0;
  return Math.max(1, (section?.missing_items || []).length);
}

export function requiredLine(section) {
  const n = requiredLeft(section);
  return n === 0 ? "Required fields are filled" : `${n} required field${n === 1 ? "" : "s"} left`;
}

// The "Your Review" card for one section, by status.
export function reviewCard(section) {
  const status = section?.status || "draft";
  if (status === "locked") return { heading: "Approved and locked", text: "To make changes, request an unlock.", edit: false };
  if (status === "submitted") return { heading: "Waiting for Shake", text: "Shake gets an email when you submit.", edit: false };
  if (status === "in_review") return { heading: "Shake is reviewing", text: "", edit: false };
  if (changesRequested(section)) return { heading: "Changes requested", text: "", edit: true };
  return { heading: "Draft", text: "Submit when it's ready. You can keep working on other sections while Shake reviews this one.", edit: true };
}

// Ask the House field helpers: one button per field, its words depend on whether the field has text.
export function aiButtonLabel(value) {
  const filled = Array.isArray(value) ? value.some((v) => String(v ?? "").trim()) : Boolean(String(value ?? "").trim());
  return filled ? "Refine" : "Help me answer";
}

// The server answers 402 when the workspace has no AI credits left.
export function outOfCredits(error) {
  return error?.status === 402 || error?.response?.status === 402;
}
