// Stand-in API for the Foundation pages in one review state.
//   ?s=draft|waiting|changes|unlocked|locked|incomplete   the state of one section
//   ?sec=core_truth|audience|positioning|messaging|expression|brand_audit   which section (default core_truth)
//   ?credits=none   every ai-assist answers 402      ?reviewer=1   the review queue answers with rows
// Synthetic data only. Follows the server's rules for the routes it answers.
const params = new URLSearchParams(location.search);
const scenario = params.get("s") || "draft";
const target = params.get("sec") || "core_truth";
const credits = params.get("credits") !== "none";
const reviewer = params.get("reviewer") === "1";
const LABELS = { brand_audit: "Diagnostic Insight", core_truth: "Core Truth", audience: "Audience Truth", positioning: "Positioning", messaging: "Messaging", expression: "Brand Expression" };
const IDS = Object.keys(LABELS);
const state = Object.fromEntries(IDS.map((id) => [id, { section_id: id, label: LABELS[id], status: "draft", version: 1, required_complete: true, missing_items: [] }]));
if (target !== "brand_audit") Object.assign(state.brand_audit, { status: "locked", locked_at: "2026-11-12T10:00:00Z" });   // locked unless it is the section under test
const t = state[target];
if (scenario === "waiting") Object.assign(t, { status: "submitted", submitted_at: "2026-11-18T09:00:00Z" });
if (scenario === "changes") Object.assign(t, { review_note: "Say who it's for and what changes for them. One sentence.", review_note_at: "2026-11-17T15:00:00Z" });
if (scenario === "unlocked") Object.assign(t, { version: 2, review_note: "Opened so you can update the mission.", review_note_at: "2026-11-19T12:00:00.000420+00:00", unlocked_at: "2026-11-19T12:00:00.000400+00:00" });
if (scenario === "locked") Object.assign(t, { status: "locked", locked_at: "2026-11-19T12:00:00Z" });
if (scenario === "incomplete") Object.assign(t, { required_complete: false, missing_items: ["Vision", "Founder insight"] });
const score = { brand_audit: 100, core_truth: 60, audience: 40, positioning: 0, messaging: 0, expression: 0 };
const foundation = { purpose: "Help founders lead with clarity.", mission: "Turn brand decisions into a working system.", vision: "", beliefs: ["Clarity builds trust.", "A strong foundation guides growth."], values: ["Clarity", "Integrity", "Community"], founder_insight: "Founders need one clear place to bring their brand decisions together and put them to work.", tagline: "Where serious brands are built.", positioning: "For independent founders who want a brand that holds together, Core Truth House is the brand operating system that turns decisions into one working Foundation.", brand_pillars: ["Clarity", "Structure", "Proof"], tone_of_voice: "Calm, direct and warm. We explain before we ask." };
const positioning = { category: "Brand strategy software", audience_specificity: "Independent founders with a working offer and a scattered brand", differentiator: "A reviewed, locked Foundation instead of a one-off brand exercise." };
const messaging = { brand_promise: "Your brand decisions, in one place that holds.", one_liner: "Core Truth House turns brand decisions into a working system.", core_message: "A serious brand is built on decisions you can stand behind.", elevator_pitch: "", calls_to_action: "Start the Brand Diagnostic", proof_points: "Founding Cohort members\nReviewed Foundations" };
const avatar = { id: "av-1", is_primary: true, created_at: "2026-11-10T10:00:00Z", name: "The overextended founder", stage: "Growing", description: "Runs a service business alone and makes every brand call herself.", primary_problem: "Her brand says different things in different places.", transformation_desired: "One clear brand she can hand to anyone.", core_fear: "Looking amateur next to bigger names.", core_desire: "", emotional_trigger: "", surface_symptoms: ["Rewrites her bio every month"], where_they_are: ["LinkedIn", "Podcasts"], objections: [] };
const identity = { colors: [{ id: "primary", role: "primary", label: "Crimson", hex: "#AF0024" }, { id: "secondary", role: "secondary", label: "Deep plum", hex: "#33033C" }], fonts: [{ id: "display", role: "display", label: "Heading", family: "Cormorant Garamond", source: "system" }, { id: "body", role: "body", label: "Body", family: "DM Sans", source: "system" }] };
const assets = [{ asset_id: "a1", name: "Primary logo.svg", status: "confirmed", context: "brand_asset" }];
const diagnostic = { available: true, completed: true, result: { score: 38, score_range: "Building: the basics are there, the system isn't", recommended_tier: "Foundation", taken_by_me: true, top_gaps: ["Positioning", "Messaging consistency"], interpretation: { priority_actions: [{ priority: 1, category: "Positioning", action: "Write one sentence that says who you serve and why you." }, { priority: 2, category: "Messaging", action: "Choose three brand pillars and use them everywhere." }], scope_note: "Based on your Diagnostic answers only." } } };
const queue = [{ workspace_id: "ws-demo", section_id: "core_truth", label: "Core Truth", status: "submitted", version: 1 }];
const fail = (status, code, message, extra = {}) => { const e = new Error(message); e.status = status; e.payload = { detail: { code, message, ...extra } }; throw e; };
const log = (m, p, b) => { window.__calls = (window.__calls || []).concat([{ m, p, b }]); };
const guard = (section) => { if (state[section].status === "locked") fail(423, "section_locked", `${LABELS[section]} is locked. Request an unlock to change it.`); };
let suggestions = 0;
const suggest = (b) => { if (!credits) fail(402, "", "Insufficient AI credits."); suggestions += 1; return { field: b.field || b.field_id, suggestion: suggestions === 1 ? "Help independent founders turn scattered brand decisions into one clear working system." : "Give founders one working system for every brand decision." }; };
const api = {
  get: async (p) => {
    log("GET", p);
    if (p === "/api/foundation/sections") return { sections: IDS.map((id) => ({ ...state[id] })), reviewer, required_fields_confirmed: true };
    if (p === "/api/foundation/readiness") return { sections: IDS.map((id) => ({ id, label: LABELS[id], score: state[id].status === "locked" ? 100 : score[id] })) };
    if (p === "/api/foundation/diagnostic-insight") return diagnostic;
    if (p === "/api/foundation/review/queue") { if (!reviewer) fail(403, "not_reviewer", "Reviewers only."); return { queue }; }
    if (p === "/api/persist/brand-foundation") return { foundation: { ...foundation } };
    if (p === "/api/persist/brand-positioning") return { positioning: { ...positioning } };
    if (p === "/api/persist/messaging-structure") return { messaging_structure: { ...messaging } };
    if (p === "/api/audience/avatars") return { avatars: [{ ...avatar }] };
    if (p === "/api/identity") return { ...identity };
    if (p === "/api/media-upload/assets") return { assets };
    return {};
  },
  post: async (p, b) => {
    log("POST", p, b);
    if (p.endsWith("/ai-assist")) return suggest(b);
    if (p === "/api/persist/brand-foundation") { if (target !== "positioning" && target !== "messaging" && target !== "expression") guard("core_truth"); Object.assign(foundation, b); return { saved: true }; }
    if (p === "/api/persist/brand-positioning") { guard("positioning"); Object.assign(positioning, b); return { saved: true }; }
    if (p === "/api/persist/messaging-structure") { guard("messaging"); Object.assign(messaging, b); return { saved: true }; }
    if (p === "/api/identity/save") { guard("expression"); Object.assign(identity, b); return { saved: true }; }
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
  patch: async (p, b) => {
    log("PATCH", p, b);
    if (p === "/api/audience/avatars/av-1") { guard("audience"); Object.assign(avatar, b); return { avatar }; }
    return {};
  },
};
export default api;
