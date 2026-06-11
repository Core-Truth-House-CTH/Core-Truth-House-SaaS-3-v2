// Shared Brand Diagnostic logic.
//
// Single source of truth for the diagnostic question set, the 8-dimension
// computation, and the Next Best Move mapping. Imported by both the public
// BrandDiagnosticPage (the funnel + modal) and PublicDiagnosticResults (the
// shareable per-token results page) so the two stay perfectly in sync.
//
// NOTE: the Python side (backend/routes/contact.py compute_diagnostic_dimensions)
// mirrors buildLiveDimensions so the results email shows the same dimension
// scores. Keep the two in lockstep if DIMENSION_QUESTION_MAP ever changes.

export const DIAGNOSTIC_ICONS = {
 positioning: "/brand-diagnostic-assets/cth-brand-diagnostic-positioning-icon.png",
 messaging: "/brand-diagnostic-assets/cth-brand-diagnostic-messaging-icon.png",
 offer: "/brand-diagnostic-assets/cth-brand-diagnostic-offer-clarity-icon.png",
 audience: "/brand-diagnostic-assets/cth-brand-diagnostic-audience-fit-icon.png",
 visual: "/brand-diagnostic-assets/cth-brand-diagnostic-visual-identity-icon.png",
 conversion: "/brand-diagnostic-assets/cth-brand-diagnostic-conversion-path-icon.png",
 content: "/brand-diagnostic-assets/cth-brand-diagnostic-content-consistency-icon.png",
 trust: "/brand-diagnostic-assets/cth-brand-diagnostic-brand-trust-icon.png",
 foundation: "/brand-diagnostic-assets/cth-brand-diagnostic-foundation-column-icon.png",
 strategic: "/brand-diagnostic-assets/cth-brand-diagnostic-strategic-os-compass-icon.png",
 structure: "/brand-diagnostic-assets/cth-brand-diagnostic-structure-temple-icon.png",
 execution: "/brand-diagnostic-assets/cth-brand-diagnostic-execution-rocket-icon.png",
};

const I = DIAGNOSTIC_ICONS;

// The 15 diagnostic questions. Shape: [id, label, category, prompt, icon].
export const questions = [
 ["core_truth_1", "Core Truth Clarity", "Core Truth Clarity", "Do you have one sentence that clearly names who you serve and the specific problem you solve for them?", I.foundation],
 ["core_truth_2", "Brand Independence", "Core Truth Clarity", "If someone saw your brand without your face, name, or personal story attached, would it still feel recognizable as yours?", I.trust],
 ["core_truth_3", "Brand Beliefs", "Core Truth Clarity", "Can you name the three core beliefs that separate you from every other person doing what you do?", I.positioning],
 ["messaging_1", "Message Consistency", "Messaging Coherence", "Does your brand voice stay consistent whether someone reads your website, sees your content, or speaks with you directly?", I.messaging],
 ["messaging_2", "Voice Framework", "Messaging Coherence", "Do you follow a documented framework when you create content?", I.content],
 ["messaging_3", "Delegatable Voice", "Messaging Coherence", "Could you hand your messaging guidelines to a contractor or assistant and have them create content that still sounds like your brand?", I.messaging],
 ["conversion_1", "Homepage Clarity", "Conversion Architecture", "Would a stranger understand who your website is for and what to do next without you explaining it?", I.conversion],
 ["conversion_2", "Buyer Path", "Conversion Architecture", "Do you have a documented process that moves a stranger toward becoming a buyer without you personally facilitating every step?", I.structure],
 ["conversion_3", "Lost Prospect Insight", "Conversion Architecture", "Do you understand specifically why your last few prospects did not buy?", I.conversion],
 ["audience_1", "Buyer Language", "Audience Resonance", "Do you describe your ideal client's frustrations using their exact words?", I.audience],
 ["audience_2", "Language Feedback Loop", "Audience Resonance", "Do you regularly update your messaging based on what prospects and clients tell you?", I.audience],
 ["audience_3", "Belief Shift", "Audience Resonance", "Do you know the specific belief your buyer has to shift before they say yes?", I.strategic],
 ["operations_1", "Brand Continuity", "Operational Discipline", "Is your brand building authority and trust even when you are not actively creating content?", I.execution],
 ["operations_2", "Brand Operations System", "Operational Discipline", "Do you have a documented system that guides your brand decisions without rebuilding them from scratch each time?", I.structure],
 ["operations_3", "Brand Health Metrics", "Operational Discipline", "Do you have a way to measure whether your brand is growing stronger month over month?", I.trust],
];

// Static preview dimensions shown before any diagnostic has been completed.
export const dimensions = [
 ["Positioning", 68, "Your position is unclear in the market.", I.positioning],
 ["Messaging", 64, "Core message lacks clarity and distinction.", I.messaging],
 ["Offer Clarity", 78, "Offer is strong but not clearly communicated.", I.offer],
 ["Audience Fit", 74, "You know your audience, but not their intent.", I.audience],
 ["Visual Identity", 81, "Visuals are cohesive but not fully differentiated.", I.visual],
 ["Conversion Path", 59, "Journey has friction and unclear next steps.", I.conversion],
 ["Content Consistency", 69, "Inconsistent across channels and touchpoints.", I.content],
 ["Brand Trust", 76, "Trust signals are present but under-leveraged.", I.trust],
];

// Maps each of the 8 displayed dimensions to the question ids that feed it.
export const dimensionQuestionMap = [
 {
 name: "Positioning",
 ids: ["core_truth_1", "core_truth_2", "core_truth_3"],
 icon: I.positioning,
 strong: "Your position is distinct enough to build from.",
 weak: "Your position needs clearer ownership in the market.",
 },
 {
 name: "Messaging",
 ids: ["messaging_1", "messaging_2", "messaging_3"],
 icon: I.messaging,
 strong: "Your voice and message have real consistency.",
 weak: "Your message is shifting too much across touchpoints.",
 },
 {
 name: "Offer Clarity",
 ids: ["conversion_1", "conversion_2", "conversion_3"],
 icon: I.offer,
 strong: "Your offer path is clear enough to support action.",
 weak: "Your offer and next-step path need sharper structure.",
 },
 {
 name: "Audience Fit",
 ids: ["audience_1", "audience_2", "audience_3"],
 icon: I.audience,
 strong: "Your audience language is close to buyer reality.",
 weak: "Your message needs to mirror the buyer more directly.",
 },
 {
 name: "Visual Identity",
 ids: ["core_truth_2", "messaging_1", "operations_3"],
 icon: I.visual,
 strong: "Your brand signals feel cohesive and recognizable.",
 weak: "Your visual trust signals need stronger alignment.",
 },
 {
 name: "Conversion Path",
 ids: ["conversion_1", "conversion_2", "conversion_3"],
 icon: I.conversion,
 strong: "Your brand has a clearer route from attention to action.",
 weak: "Your buyer path has friction and unclear next steps.",
 },
 {
 name: "Content Consistency",
 ids: ["messaging_2", "messaging_3", "operations_2"],
 icon: I.content,
 strong: "Your content can be repeated without rebuilding the brand.",
 weak: "Your content system depends too much on guessing.",
 },
 {
 name: "Brand Trust",
 ids: ["operations_1", "operations_2", "operations_3"],
 icon: I.trust,
 strong: "Your brand has stronger operational trust signals.",
 weak: "Your trust signals are present but not systemized.",
 },
];

// Next Best Move actions, keyed by the question category label (item[2]).
// Used to turn a user's weakest gap categories into concrete recommended moves.
export const NEXT_MOVE_BY_CATEGORY = {
 "Core Truth Clarity": {
 title: "Define Your Positioning Core",
 text: "Build one sentence that names exactly who you serve and what you solve. Everything else follows from that.",
 icon: I.foundation,
 },
 "Messaging Coherence": {
 title: "Build Your Voice Framework",
 text: "Document the rules your brand follows when it communicates. Without rules, every piece of content starts from scratch.",
 icon: I.messaging,
 },
 "Conversion Architecture": {
 title: "Map Your Buyer Path",
 text: "Document every step from stranger to buyer. If the path is not written down it cannot be optimized.",
 icon: I.conversion,
 },
 "Audience Resonance": {
 title: "Run a Language Audit",
 text: "Pull your last 10 sales conversations. The words your buyers use to describe their problem are your messaging.",
 icon: I.audience,
 },
 "Operational Discipline": {
 title: "Build Your Brand OS",
 text: "Document the decisions you make repeatedly so your brand runs without you rebuilding it each time.",
 icon: I.strategic,
 },
};

// Default preview moves shown before a diagnostic result exists.
export const defaultNextMoves = [
 ["Clarify Positioning", "Define a distinct, ownable position in your market.", I.positioning],
 ["Strengthen Offer Hierarchy", "Lead with your core offer.", I.structure],
 ["Align Messaging", "Speak to what your audience actually cares about.", I.audience],
];

// Recompute the 8 dimension scores from a saved answers map. Returns the static
// preview `dimensions` when there are no answers. Shape per row: [name, score,
// text, icon] — identical to the static `dimensions` array.
export function buildLiveDimensions(answers) {
 const hasAnswers = Object.keys(answers || {}).length > 0;

 if (!hasAnswers) {
 return dimensions;
 }

 return dimensionQuestionMap.map((item) => {
 const total = item.ids.reduce((sum, id) => sum + Number(answers[id] || 0), 0);
 const score = Math.round((total / (item.ids.length * 4)) * 100);
 const text = score >= 75 ? item.strong : item.weak;
 return [item.name, score, text, item.icon];
 });
}

// The three lowest-scoring questions, sorted ascending. Each row is a full
// question array [id, label, category, prompt, icon].
export function computeTopGaps(answers) {
 if (!answers || Object.keys(answers).length === 0) return [];
 return [...questions]
 .sort(([a], [b]) => Number(answers[a] || 0) - Number(answers[b] || 0))
 .slice(0, 3);
}

// Build the Next Best Move cards from a saved answers map. Derives the weakest
// gap categories, maps them through NEXT_MOVE_BY_CATEGORY (deduped), and falls
// back to the static preview when nothing resolves. Returns [title, text, icon].
export function buildNextMoves(answers) {
 const gaps = computeTopGaps(answers);
 if (!gaps.length) return defaultNextMoves;

 const seen = new Set();
 const moves = [];
 for (const gap of gaps) {
 const category = Array.isArray(gap) ? gap[2] : null;
 const move = category ? NEXT_MOVE_BY_CATEGORY[category] : null;
 if (move && !seen.has(move.title)) {
 seen.add(move.title);
 moves.push([move.title, move.text, move.icon]);
 }
 }
 return moves.length > 0 ? moves : defaultNextMoves;
}
