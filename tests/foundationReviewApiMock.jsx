// Stateful stand-in for the Foundation section API, following the server's transition rules.
const params = new URLSearchParams(location.search);
const scenario = params.get("s") || "draft_complete";
const reviewer = params.get("role") === "reviewer";
const LABELS = { brand_audit: "Brand Audit", core_truth: "Core Truth", audience: "Audience Truth", positioning: "Positioning", messaging: "Messaging", expression: "Brand Expression" };
const IDS = Object.keys(LABELS);
const base = (id) => ({ section_id: id, label: LABELS[id], status: "draft", version: 1, required_complete: true, missing_items: [] });
const state = Object.fromEntries(IDS.map((id) => [id, base(id)]));
if (scenario === "draft_incomplete") Object.assign(state.core_truth, { required_complete: false, missing_items: ["Core values (at least 3; you have 2)"] });
if (scenario === "changes_requested") Object.assign(state.core_truth, { review_note: "Please sharpen the mission." });
if (scenario === "locked") Object.assign(state.core_truth, { status: "locked", locked_at: "2026-11-13T00:00:00Z" });
if (scenario === "mixed") {
  Object.assign(state.core_truth, { status: "submitted", submitted_at: "2026-11-13T00:00:00Z" });
  Object.assign(state.audience, { status: "in_review" });
  Object.assign(state.positioning, { status: "locked", unlock_requested_at: "2026-11-13T01:00:00Z", unlock_request_note: "We rebranded." });
  Object.assign(state.messaging, { required_complete: false, missing_items: ["Core message", "Brand pillars (at least 3; you have 1)"] });
}
const fail = (status, code, message, extra = {}) => { const e = new Error(message); e.status = status; e.payload = { detail: { code, message, ...extra } }; throw e; };
const now = () => new Date().toISOString();
const needNote = (b) => { if (!String((b && b.note) || "").trim()) fail(422, "note_required", "A note is required for this action."); };
const log = (m, p, b) => { window.__calls = (window.__calls || []).concat([{ m, p, b }]); };
const sectionsOut = () => IDS.map((id) => ({ ...state[id] }));
const insight = params.get("insight") === "none"
  ? { available: false, completed: false, source: null, has_legacy_audit: false }
  : { available: true, completed: true, source: "diagnostic", result: { id: "d1", business_name: "Seed Studio", score: 40, recommended_tier: "Foundation", score_range: "31-45", top_gaps: ["Positioning", "Messaging"], taken_by_me: false, interpretation: { scope_note: "These explanations reflect the answers you supplied.", priority_actions: [{ priority: 1, category: "Positioning", action: "Write one sentence that names who you serve." }] } } };
const readiness = { scoring_model_version: "v3-locked-only", overall: 30, sections: [
  ...IDS.map((id) => ({ id, label: LABELS[id], score: state[id].status === "locked" ? 100 : 90, completeness: 100, locked: state[id].status === "locked", awaiting_review: state[id].status === "submitted" || state[id].status === "in_review", missing_items: [] })),
  { id: "review_lock", label: "Review and Lock", score: 17, missing_items: [] }] };
const api = {
  get: async (p) => {
    log("GET", p);
    if (p === "/api/foundation/sections") return { sections: sectionsOut(), reviewer, required_fields_confirmed: true };
    if (p === "/api/foundation/readiness") return readiness;
    if (p === "/api/foundation/diagnostic-insight") return insight;
    if (p === "/api/foundation/review/queue") {
      if (!reviewer) fail(403, "reviewer_only", "Foundation review is limited to the Core Truth House reviewers.");
      return { queue: IDS.filter((id) => ["submitted", "in_review"].includes(state[id].status) || (state[id].status === "locked" && state[id].unlock_requested_at))
        .map((id) => ({ ...state[id], workspace_id: "ws-demo" })) };
    }
    if (p.includes("audit/latest")) return { audit_id: "a1", overall_score: 50 };
    return {};
  },
  post: async (p, b) => {
    log("POST", p, b);
    let m = p.match(/^\/api\/foundation\/sections\/([a-z_]+)\/(submit|withdraw|request-unlock)$/);
    if (m) {
      const s = state[m[1]];
      if (m[2] === "submit") { if (s.status !== "draft") fail(409, "invalid_transition", "Not allowed from here."); if (!s.required_complete) fail(422, "required_fields_missing", "Complete the required fields before submitting.", { missing: s.missing_items }); Object.assign(s, { status: "submitted", submitted_at: now() }); delete s.review_note; }
      if (m[2] === "withdraw") { if (s.status !== "submitted") fail(409, "invalid_transition", "Not allowed from here."); s.status = "draft"; }
      if (m[2] === "request-unlock") { if (s.status !== "locked") fail(409, "invalid_transition", "Only a locked section can have an unlock requested."); needNote(b); Object.assign(s, { unlock_requested_at: now(), unlock_request_note: b.note }); }
      return { section: { ...s } };
    }
    m = p.match(/^\/api\/foundation\/review\/([^/]+)\/sections\/([a-z_]+)\/(start-review|approve|request-changes|unlock)$/);
    if (m) {
      if (!reviewer) fail(403, "reviewer_only", "Foundation review is limited to the Core Truth House reviewers.");
      const s = state[m[2]];
      if (m[3] === "start-review") { if (s.status !== "submitted") fail(409, "invalid_transition", "Not allowed from here."); s.status = "in_review"; }
      if (m[3] === "approve") { if (!["submitted", "in_review"].includes(s.status)) fail(409, "invalid_transition", "Not allowed from here."); s.status = "locked"; delete s.unlock_requested_at; }
      if (m[3] === "request-changes") { needNote(b); if (!["submitted", "in_review"].includes(s.status)) fail(409, "invalid_transition", "Not allowed from here."); Object.assign(s, { status: "draft", review_note: b.note }); }
      if (m[3] === "unlock") { needNote(b); if (s.status !== "locked") fail(409, "invalid_transition", "Not allowed from here."); Object.assign(s, { status: "draft", version: s.version + 1, review_note: b.note }); delete s.unlock_requested_at; delete s.unlock_request_note; }
      return { section: { ...s } };
    }
    return { saved: true };
  },
  patch: async () => ({ saved: true }),
};
export default api;
