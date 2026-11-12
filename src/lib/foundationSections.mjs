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

export const STATUS_HELP = {
  draft: "You can keep editing. Submit this section when the required fields are complete.",
  submitted: "Waiting for a Core Truth House reviewer. You can withdraw it to keep editing.",
  in_review: "A reviewer is looking at this section now.",
  locked: "Approved and locked. Ask for it to be unlocked if something has to change.",
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

// The score line under a section: only locked sections reach 100.
export function scoreNote(readinessSection) {
  if (!readinessSection) return "";
  if (readinessSection.locked) return "Locked: counts as 100%.";
  if (readinessSection.awaiting_review) return "Submitted. Your score stays at most 90% until a reviewer locks it.";
  if (Number(readinessSection.score) >= 90 && readinessSection.completeness === 100) {
    return "All required fields are filled. Submit this section; only a locked section reaches 100%.";
  }
  return "";
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
