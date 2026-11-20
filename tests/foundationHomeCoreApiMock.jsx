// Stand-in API for Foundation Home + Core Truth in one review state (?s=draft|waiting|changes|locked|incomplete).
// Synthetic data only. Follows the server's rules for the member routes it answers.
const params = new URLSearchParams(location.search);
const scenario = params.get("s") || "draft";
const credits = params.get("credits") !== "none";
const LABELS = { brand_audit: "Brand Audit", core_truth: "Core Truth", audience: "Audience Truth", positioning: "Positioning", messaging: "Messaging", expression: "Brand Expression" };
const IDS = Object.keys(LABELS);
const state = Object.fromEntries(IDS.map((id) => [id, { section_id: id, label: LABELS[id], status: "draft", version: 1, required_complete: false, missing_items: ["Required fields"] }]));
Object.assign(state.brand_audit, { status: "locked", required_complete: true, missing_items: [], locked_at: "2026-11-12T10:00:00Z" });
Object.assign(state.core_truth, { required_complete: true, missing_items: [] });
if (scenario === "waiting") Object.assign(state.core_truth, { status: "submitted", submitted_at: "2026-11-18T09:00:00Z" });
if (scenario === "changes") Object.assign(state.core_truth, { review_note: "Say who it's for and what changes for them. One sentence.", review_note_at: "2026-11-17T15:00:00Z" });
if (scenario === "locked") Object.assign(state.core_truth, { status: "locked", locked_at: "2026-11-19T12:00:00Z" });
if (scenario === "incomplete") Object.assign(state.core_truth, { required_complete: false, missing_items: ["Vision", "Core values (at least 3; you have 2)"] });
const score = { brand_audit: 100, core_truth: 60, audience: 40, positioning: 0, messaging: 0, expression: 0 };
const foundation = { purpose: "Help founders lead with clarity.", mission: "Turn brand decisions into a working system.", vision: "", beliefs: ["Clarity builds trust.", "A strong foundation guides growth."], values: ["Clarity", "Integrity", "Community"], founder_insight: "Founders need one clear place to bring their brand decisions together and put them to work.", tagline: "Kept by the save" };
const fail = (status, code, message, extra = {}) => { const e = new Error(message); e.status = status; e.payload = { detail: { code, message, ...extra } }; throw e; };
const log = (m, p, b) => { window.__calls = (window.__calls || []).concat([{ m, p, b }]); };
let suggestions = 0;
const api = {
  get: async (p) => {
    log("GET", p);
    if (p === "/api/foundation/sections") return { sections: IDS.map((id) => ({ ...state[id] })), reviewer: false, required_fields_confirmed: true };
    if (p === "/api/foundation/readiness") return { sections: IDS.map((id) => ({ id, label: LABELS[id], score: state[id].status === "locked" ? 100 : score[id] })) };
    if (p === "/api/persist/brand-foundation") return { foundation: { ...foundation } };
    return {};
  },
  post: async (p, b) => {
    log("POST", p, b);
    if (p === "/api/persist/brand-foundation/ai-assist") {
      if (!credits) fail(402, "", "Insufficient AI credits.");
      suggestions += 1;
      return { field: b.field, suggestion: suggestions === 1 ? "Help independent founders turn scattered brand decisions into one clear working system." : "Give founders one working system for every brand decision." };
    }
    if (p === "/api/persist/brand-foundation") { if (state.core_truth.status === "locked") fail(423, "section_locked", "Core Truth is locked. Request an unlock to change it."); Object.assign(foundation, b); return { saved: true }; }
    const m = p.match(/^\/api\/foundation\/sections\/([a-z_]+)\/(submit|withdraw|request-unlock)$/);
    if (m) {
      const s = state[m[1]];
      if (m[2] === "submit") { if (s.status !== "draft") fail(409, "invalid_transition", "Not allowed from here."); if (!s.required_complete) fail(422, "required_fields_missing", "Complete the required fields before submitting.", { missing: s.missing_items }); Object.assign(s, { status: "submitted" }); delete s.review_note; delete s.review_note_at; }
      if (m[2] === "withdraw") { if (s.status !== "submitted") fail(409, "invalid_transition", "Not allowed from here."); s.status = "draft"; }
      if (m[2] === "request-unlock") { if (s.status !== "locked") fail(409, "invalid_transition", "Not allowed from here."); if (!String(b?.note || "").trim()) fail(422, "note_required", "A note is required."); Object.assign(s, { unlock_requested_at: new Date().toISOString() }); }
      return { section: { ...s } };
    }
    return {};
  },
};
export default api;
