import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 ArrowRight,
 CheckCircle2,
 Clock,
 Compass,
 Lock,
 ShieldCheck,
 Sparkles,
 Target,
 X,
} from "lucide-react";
import {
 questions,
 buildLiveDimensions,
 buildNextMoves,
} from "../utils/diagnosticDimensions";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import apiClient from "../lib/apiClient";
import { useAuth, useUser } from "../hooks/useAuth";
import { useWorkspace } from "../context/WorkspaceContext";
import {
 advanceDiagnosticAnswer,
 buildDiagnosticAuthPath,
 bindDiagnosticDraftOwner,
 clearDiagnosticDraft,
  createFreshDiagnosticDraft,
 createDiagnosticDraftId,
 getDiagnosticAccess,
 persistDiagnosticDraft,
 restoreDiagnosticDraft,
} from "./brandDiagnosticDraft.mjs";
import { getDiagnosticHistoryViewState } from "./diagnosticHistoryState.mjs";

const A = {
 logo: "/brand-assets/logo/cth-logo-seal.png",
 heroFrame: "/brand-diagnostic-assets/cth-brand-diagnostic-hero-architectural-frame.png",
 ctaBuilding: "/brand-diagnostic-assets/cth-brand-diagnostic-cta-building-line-art.webp",
 heroBuilding: "/brand-diagnostic-assets/diagnostic-hero-building.webp",
 band: "/brand-diagnostic-assets/dark-blueprint-band.webp",
 finalCta: "/brand-diagnostic-assets/final-cta-building-line-art.webp",
 trustTarget: "/brand-diagnostic-assets/gold-target-icon.webp",
 trustCube: "/brand-diagnostic-assets/gold-cube-icon.webp",
 trustCompass: "/brand-diagnostic-assets/gold-compass-icon.webp",
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

const initialLeadInfo = {
 business_name: "",
  industry_niche: "",
  business_type: "",
 years_in_business: "",
 revenue_band: "",
 current_challenge: "",
 marketing_consent: false,
};

const yearsOptions = ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "10+ years"];
const revenueOptions = ["Pre-revenue", "Under $2k monthly", "$2k to $5k monthly", "$5k to $10k monthly", "$10k to $25k monthly", "$25k+ monthly"];
const challengeOptions = [
 "I am visible but not converting",
 "My messaging feels inconsistent",
 "My offer is not clear enough",
 "My content is not leading to sales",
 "My brand depends too much on me",
 "I need a stronger operating system",
];
const industryOptions = [
  ["beauty", "Beauty"],
  ["travel", "Travel"],
  ["real_estate", "Real estate"],
  ["health_wellness", "Health and wellness"],
  ["creative_services", "Creative services"],
  ["education", "Education"],
  ["retail_ecommerce", "Retail and e-commerce"],
  ["food_beverage", "Food and beverage"],
  ["technology", "Technology"],
  ["professional_services", "Professional services"],
  ["nonprofit", "Nonprofit"],
  ["other", "Other / not listed"],
];
const businessTypeOptions = [
  ["services", "Services"],
  ["physical_products", "Physical products"],
  ["digital_products", "Digital products"],
  ["memberships", "Memberships"],
  ["mixed", "A mix of these"],
  ["other", "Other / not listed"],
];

const diagnosticQuestionIds = questions.map(([id]) => id);

function getSessionStorage() {
 try {
 return typeof window === "undefined" ? null : window.sessionStorage;
 } catch {
 return null;
 }
}

const answerOptions = [
 { label: "Not yet", value: 1 },
 { label: "Somewhat", value: 2 },
 { label: "Mostly", value: 3 },
 { label: "Yes", value: 4 },
];

const afterScore = [
 ["Foundation", "Establish your truth, purpose, and strategic positioning.", A.foundation],
 ["Strategic OS", "Build the operating system that aligns your brand.", A.strategic],
 ["Structure", "Design the systems, offers, and experiences.", A.structure],
 ["Execution", "Launch with confidence and measure what matters.", A.execution],
];

function getSeverity(score) {
 if (score < 50) return "Critical";
 if (score < 68) return "High";
 if (score < 78) return "Moderate";
 return "Low";
}

function getLiveDimensionScore(liveDimensions, targetName) {
 const found = (liveDimensions || []).find(([name]) => name === targetName);
 return Number(found?.[1] ?? 60);
}

function buildRadarPolygon(liveDimensions) {
 const centerX = 50;
 const centerY = 50;

 const axes = [
 ["Brand Trust", [50, 6]],
 ["Messaging", [90, 34]],
 ["Offer Clarity", [75, 86]],
 ["Audience Fit", [25, 86]],
 ["Content Consistency", [10, 34]],
 ];

 const points = axes.map(([name, [targetX, targetY]]) => {
 const score = Math.max(0, Math.min(100, getLiveDimensionScore(liveDimensions, name)));
 const factor = score / 100;

 const x = centerX + (targetX - centerX) * factor;
 const y = centerY + (targetY - centerY) * factor;

 return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
 });

 return `polygon(${points.join(", ")})`;
}

function getRecommendation(score) {
 if (score <= 29) {
 return {
 tier: "Foundation",
 range: "15 to 29",
 cta: "Start Foundation",
 line: "Your brand needs documented core truth, buyer clarity, beliefs, and voice before more content can convert.",
 next: "/sign-up?redirect_url=%2Fbilling&tier=foundation&source=diagnostic",
 };
 }

 if (score <= 42) {
 return {
 tier: "Structure",
 range: "30 to 42",
 cta: "Build My Structure",
 line: "You have pieces, but not architecture. The next move is structure across content, offers, and conversion.",
 next: "/sign-up?redirect_url=%2Fbilling&tier=structure&source=diagnostic",
 };
 }

 if (score <= 52) {
 return {
 tier: "House",
 range: "43 to 52",
 cta: "Enter the House",
 line: "You have a real brand. The next move is integration across identity, offers, content, and launch planning.",
 next: "/sign-up?redirect_url=%2Fbilling&tier=house&source=diagnostic",
 };
 }

 return {
 tier: "Estate",
 range: "53 to 60",
 cta: "Apply for Estate",
 line: "You are ready for refinement and scale. The risk is no longer clarity. The risk is dilution.",
 next: "/sign-up?redirect_url=%2Fbilling&tier=estate&source=diagnostic",
 };
}

function ScoreRing({ score = 72, total = 100 }) {
 return (
 <div className="bdx-ring">
 <div>
 <strong>{score}</strong>
 <span>/{total}</span>
 </div>
 </div>
 );
}

function ModalDiagnostic({ open, onClose, onComplete, onRetake, initialStep = "lead", initialData = null, identity, isSignedIn, userId, workspaceId, navigate }) {
 const [step, setStep] = useState(initialData?.step || initialStep);
 const [currentQuestion, setCurrentQuestion] = useState(initialData?.currentQuestion || 0);
 const [leadInfo, setLeadInfo] = useState(initialData?.leadInfo || initialLeadInfo);
 const [answers, setAnswers] = useState(initialData?.answers || {});
 const [draftId, setDraftId] = useState(initialData?.draftId || createDiagnosticDraftId());
 const [draftOwnerUserId, setDraftOwnerUserId] = useState(initialData?.ownerUserId || (isSignedIn ? userId : null));
 const [draftWorkspaceId, setDraftWorkspaceId] = useState(initialData?.workspaceId || (isSignedIn ? workspaceId : null));
 const [serverResult, setServerResult] = useState(initialData?.id && Number.isInteger(initialData?.score) ? initialData : null);
 const [saving, setSaving] = useState(false);
 const [saveError, setSaveError] = useState("");
 const [resultSaved, setResultSaved] = useState(Boolean(initialData?.id && Number.isInteger(initialData?.score)));

 useEffect(() => {
 if (!open) return;
 const userChanged = draftOwnerUserId && draftOwnerUserId !== userId;
 const workspaceChanged = draftWorkspaceId && workspaceId && draftWorkspaceId !== workspaceId;
 if (userChanged || workspaceChanged) {
 clearDiagnosticDraft(getSessionStorage());
 setStep("lead");
 setCurrentQuestion(0);
 setLeadInfo(initialLeadInfo);
 setAnswers({});
 setDraftId(createDiagnosticDraftId());
 setDraftOwnerUserId(isSignedIn ? userId : null);
 setDraftWorkspaceId(isSignedIn ? workspaceId : null);
 setServerResult(null);
 setResultSaved(false);
 setSaveError("");
 return;
 }
 if (isSignedIn && userId && !draftOwnerUserId) setDraftOwnerUserId(userId);
 if (isSignedIn && workspaceId && !draftWorkspaceId) setDraftWorkspaceId(workspaceId);
 }, [open, isSignedIn, userId, workspaceId, draftOwnerUserId, draftWorkspaceId]);

 useEffect(() => {
 if (!open || resultSaved) return;
 persistDiagnosticDraft(getSessionStorage(), {
 version: 1,
 draftId,
 step,
 currentQuestion,
 answers,
 leadInfo,
 ownerUserId: draftOwnerUserId,
 workspaceId: draftWorkspaceId,
 }, { questionIds: diagnosticQuestionIds });
 }, [open, resultSaved, draftId, step, currentQuestion, answers, leadInfo, draftOwnerUserId, draftWorkspaceId]);

 const answeredCount = Object.keys(answers).length;
 const isComplete = answeredCount === questions.length;

 const score = useMemo(() => {
 if (!isComplete) return null;
 return questions.reduce((total, [id]) => total + Number(answers[id] || 0), 0);
 }, [answers, isComplete]);

 const recommendation = score ? getRecommendation(score) : null;

 const topGaps = useMemo(() => {
 if (!isComplete) return [];
 return [...questions]
 .sort(([a], [b]) => Number(answers[a] || 0) - Number(answers[b] || 0))
 .slice(0, 3);
 }, [answers, isComplete]);

 const leadReady = true;
 const canRevealFullResults = getDiagnosticAccess({ isSignedIn, serverResult }).canRevealFullResults;

 if (!open) return null;

 function updateLead(field, value) {
 setLeadInfo((current) => ({ ...current, [field]: value }));
 }

 function buildPayload() {
 return {
 business_name: leadInfo.business_name.trim(),
  industry_niche: leadInfo.industry_niche,
  business_type: leadInfo.business_type,
 years_in_business: leadInfo.years_in_business,
 revenue_band: leadInfo.revenue_band,
 current_challenge: leadInfo.current_challenge,
 answers,
 marketing_consent: Boolean(leadInfo.marketing_consent),
 };
 }

 async function startQuiz(event) {
 event.preventDefault();
 if (!leadReady || saving) return;
 setStep("quiz");
 }

 function answerCurrent(value) {
 const transition = advanceDiagnosticAnswer({
 questionIds: diagnosticQuestionIds,
 answers,
 currentQuestion,
 value,
 });
 if (!transition) return;

 persistDiagnosticDraft(getSessionStorage(), {
 version: 1,
 draftId,
 step: transition.step,
 currentQuestion: transition.currentQuestion,
 answers: transition.answers,
 leadInfo,
 ownerUserId: draftOwnerUserId,
 workspaceId: draftWorkspaceId,
 }, { questionIds: diagnosticQuestionIds });

 setAnswers(transition.answers);
 setCurrentQuestion(transition.currentQuestion);
 setStep(transition.step);
 }

 function navigateToAuth(route) {
 persistDiagnosticDraft(getSessionStorage(), {
 version: 1, draftId, step, currentQuestion, answers, leadInfo,
 ownerUserId: draftOwnerUserId, workspaceId: draftWorkspaceId,
 }, { questionIds: diagnosticQuestionIds });
 navigate(buildDiagnosticAuthPath(route, window.location.pathname, window.location.search));
 }

 async function saveResult() {
 if (!isSignedIn || !workspaceId || !isComplete || saving || resultSaved) return;
 setSaving(true);
 setSaveError("");
 try {
 const response = await apiClient.post("/api/brand-diagnostic/results", {
 ...buildPayload(),
 submission_id: draftId,
 });
 const record = response?.result;
 if (!record?.id || !Number.isInteger(record.score)) throw new Error("The saved result could not be verified.");
 const saved = {
 ...record,
 recommendation: getRecommendation(record.score),
 topGaps: questions.filter(([id, label]) => record.top_gaps?.includes(label)),
 };
 setServerResult(saved);
 setResultSaved(true);
 clearDiagnosticDraft(getSessionStorage());
 onComplete?.(saved);
 } catch (error) {
 setSaveError(error?.message || "Unable to save this result.");
 } finally {
 setSaving(false);
 }
 }

 function retakeDiagnostic() {
 clearDiagnosticDraft(getSessionStorage());
 onRetake?.();
 setStep("lead");
 setCurrentQuestion(0);
 setAnswers({});
 setLeadInfo(initialLeadInfo);
 setDraftId(createDiagnosticDraftId());
 setDraftOwnerUserId(isSignedIn ? userId : null);
 setDraftWorkspaceId(isSignedIn ? workspaceId : null);
 setServerResult(null);
 setResultSaved(false);
 setSaveError("");
 }

 const active = questions[currentQuestion];

 return (
 <div className="bdx-modal-wrap" role="dialog" aria-modal="true">
 <div className="bdx-modal-backdrop" onClick={onClose} />
 <section className="bdx-modal">
 <button type="button" className="bdx-modal-close" onClick={onClose} aria-label="Close diagnostic">
 <X size={18} />
 </button>

 {step === "lead" ? (
 <form onSubmit={startQuiz} data-mcp-action="brand-diagnostic-intake">
 <p className="bdx-kicker">Core Truth Brand Diagnostic</p>
 <h2>Set your business context</h2>
 <p className="bdx-modal-copy">
 {isSignedIn
 ? `Signed in as ${identity?.name || "your account"}${identity?.email ? ` (${identity.email})` : ""}. Complete the diagnostic, then save to your private workspace to view your full results.`
 : "Take all 15 questions free. A free account is required to view and save your full results. Your answers stay in this browser until then."}
 </p>
  <p className="bdx-assessment-note">Industry and business type are optional. They tailor report examples and next steps, but do not change your score.</p>

 <div className="bdx-lead-grid">
 <label>Business name<input autoComplete="organization" value={leadInfo.business_name} onChange={(e) => updateLead("business_name", e.target.value)} /></label>
  <label>Industry or niche <span>(optional)</span>
  <select value={leadInfo.industry_niche} onChange={(e) => updateLead("industry_niche", e.target.value)}>
  <option value="">Skip for now</option>
  {industryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
  </select>
  </label>
  <label>Business type <span>(optional)</span>
  <select value={leadInfo.business_type} onChange={(e) => updateLead("business_type", e.target.value)}>
  <option value="">Skip for now</option>
  {businessTypeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
  </select>
  </label>
 <label>Years in business
 <select value={leadInfo.years_in_business} onChange={(e) => updateLead("years_in_business", e.target.value)}>
 <option value="">Choose one</option>
 {yearsOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 <label>Revenue band
 <select value={leadInfo.revenue_band} onChange={(e) => updateLead("revenue_band", e.target.value)}>
 <option value="">Choose one</option>
 {revenueOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 <label className="full">Current challenge
 <select value={leadInfo.current_challenge} onChange={(e) => updateLead("current_challenge", e.target.value)}>
 <option value="">Choose one</option>
 {challengeOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 </div>

 <label className="bdx-consent">
 <input type="checkbox" checked={leadInfo.marketing_consent} onChange={(e) => updateLead("marketing_consent", e.target.checked)} />
 I agree to receive Core Truth House marketing and relevant personalized brand-needs communications. This is optional; if selected, you can unsubscribe at any time.
 </label>

 {saveError ? <p className="bdx-error">{saveError}</p> : null}

 <button type="submit" className="bdx-primary-btn" disabled={!leadReady || saving}>
 Start My Diagnostic
 <ArrowRight size={15} />
 </button>
 </form>
 ) : null}

 {step === "quiz" ? (
 <div>
 <p className="bdx-kicker">Question {currentQuestion + 1} of {questions.length}</p>
 <p className="bdx-assessment-note">Answer all 15 questions. Each response updates the final score.</p> <div className="bdx-modal-progress">
 <span style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
 </div>

 <article className="bdx-question-panel">
 <img src={active[4]} alt="" />
 <small>{active[2]}</small>
 <h2>{active[1]}</h2>
 <p>{active[3]}</p>
 </article>

 <div className="bdx-answer-grid">
 {answerOptions.map((option) => (
 <button type="button" key={option.label} onClick={() => answerCurrent(option.value)}>
 {option.label}
 </button>
 ))}
 </div>
 </div>
 ) : null}

 {step === "result" && !canRevealFullResults ? (
 <div>
 <p className="bdx-kicker">Your diagnostic is complete</p>
 <h2>Your full results are ready to unlock</h2>
 <p className="bdx-modal-copy">
 {isSignedIn
 ? "Save your answers to your private workspace. The score and recommendations will be shown after the server verifies and saves your result."
 : "Create a free account or sign in to view and save your full score, recommendations, and next steps. Your answers are saved in this browser while you sign in."}
 </p>
 {saveError ? <p className="bdx-error">{saveError}</p> : null}
 <div className="bdx-result-actions">
 {isSignedIn ? (
 <button type="button" onClick={saveResult} disabled={saving || !workspaceId}>
 {saving ? "Saving and calculating..." : !workspaceId ? "Choose a workspace to continue" : "View My Full Results"}
 <Lock size={15} />
 </button>
 ) : (
 <>
 <button type="button" onClick={() => navigateToAuth("/sign-up")}>Create a Free Account <ArrowRight size={15} /></button>
 <button type="button" className="light" onClick={() => navigateToAuth("/sign-in")}>Sign In <ArrowRight size={15} /></button>
 </>
 )}
 <button type="button" className="light" onClick={retakeDiagnostic}>Retake Diagnostic</button>
 </div>
 </div>
 ) : null}

 {step === "result" && canRevealFullResults && recommendation ? (
 <div>
 <p className="bdx-kicker">Step 03 · Your Result</p>
 <div className="bdx-result-top">
 <ScoreRing score={score} total={60} />
 <div>
 <h2>{recommendation.tier}</h2>
 <p>{recommendation.line}</p>
 <small>Score range: {recommendation.range}</small>
 </div>
 </div>

 <div className="bdx-result-gaps">
 <p>Top gaps to address first</p>
 {topGaps.map(([id, label, category, , icon]) => (
 <span key={id}>
 <img src={icon} alt="" />
 {label || category}
 </span>
 ))}
 </div>

 {saveError ? <p className="bdx-error">{saveError}</p> : null}

 <div className="bdx-result-actions">
 <button type="button" onClick={saveResult} disabled={saving || resultSaved}>
 {saving ? "Saving answers..." : resultSaved ? "Answers Saved" : "Save My Answers"}
 <Lock size={15} />
 </button>

 {resultSaved ? (
 <a
 href={
 `/sign-up?tier=${encodeURIComponent(recommendation.tier)}` +
 `&source=diagnostic` +
 `&score=${encodeURIComponent(score)}` +
 `&challenge=${encodeURIComponent(leadInfo.current_challenge)}`
 }
 >
 {recommendation.cta}
 <ArrowRight size={15} />
 </a>
 ) : (
 <p className="bdx-save-note">
 Save your answers to unlock the recommended next step.
 </p>
 )}

 <button type="button" className="light" onClick={retakeDiagnostic}>
 Retake Diagnostic
 </button>
 </div>
 </div>
 ) : null}
 </section>
 </div>
 );
}

export default function BrandDiagnosticPage() {
 const auth = useAuth();
 const { user } = useUser();
  const {
    activeWorkspaceId,
    initialized: workspaceInitialized,
    loading: workspaceLoading,
    error: workspaceError,
    refreshWorkspaces,
  } = useWorkspace();
 const navigate = useNavigate();
 const [diagnosticOpen, setDiagnosticOpen] = useState(false);
 const [resultSnapshot, setResultSnapshot] = useState(null);
 const [history, setHistory] = useState([]);
 const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
 const [historyError, setHistoryError] = useState("");
 const historyScopeRef = useRef(0);
 const [modalInitialStep, setModalInitialStep] = useState("lead");
 const [modalInitialData, setModalInitialData] = useState(null);
  const [showReplaceDraftDialog, setShowReplaceDraftDialog] = useState(false);
 // Bumped on each open so the modal remounts and re-reads initialStep/initialData.
 const [modalKey, setModalKey] = useState(0);
 const diagnosticOpenRef = useRef(diagnosticOpen);
 diagnosticOpenRef.current = diagnosticOpen;

 const identity = {
 name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
 email: user?.primaryEmailAddress?.emailAddress || "",
 };

 function normalizeSavedResult(result) {
 if (!result) return null;
 return {
 ...result,
 recommendation: getRecommendation(result.score),
 topGaps: questions.filter(([id, label]) => result.top_gaps?.includes(label)),
 };
 }

 async function loadHistory(resetSnapshot = false, expectedScope = historyScopeRef.current) {
 if (!auth.isSignedIn || !activeWorkspaceId || !workspaceInitialized) return;
 setHistoryLoading(true);
 setHistoryError("");
 try {
 const response = await apiClient.get("/api/brand-diagnostic/results");
 if (expectedScope !== historyScopeRef.current) return;
 const records = (response?.results || []).map(normalizeSavedResult);
 setHistory(records);
 if (records.length && (resetSnapshot || !resultSnapshot)) setResultSnapshot(records[0]);
 } catch (error) {
 if (expectedScope !== historyScopeRef.current) return;
 setHistoryError(error?.message || "Unable to load saved diagnostics.");
 } finally {
 if (expectedScope !== historyScopeRef.current) return;
 setHistoryLoading(false);
  setHistoryLoaded(true);
 }
 }

 useEffect(() => {
 if (diagnosticOpenRef.current) return;
 if (!auth.isLoaded || (auth.isSignedIn && !workspaceInitialized)) return;
 const restored = restoreDiagnosticDraft(getSessionStorage(), {
 questionIds: diagnosticQuestionIds,
 userId: auth.isSignedIn ? user?.id : null,
 workspaceId: auth.isSignedIn ? activeWorkspaceId : null,
 workspaceReady: Boolean(auth.isSignedIn && workspaceInitialized && activeWorkspaceId),
 });
 if (restored) {
 const ownedDraft = auth.isSignedIn
 ? bindDiagnosticDraftOwner(restored, { userId: user?.id, workspaceId: activeWorkspaceId })
 : restored;
 if (!ownedDraft) {
 clearDiagnosticDraft(getSessionStorage());
 } else {
 persistDiagnosticDraft(getSessionStorage(), ownedDraft, { questionIds: diagnosticQuestionIds });
 setModalInitialStep(ownedDraft.step);
 setModalInitialData(ownedDraft);
 setModalKey((current) => current + 1);
 setDiagnosticOpen(true);
 }
 }
 }, [auth.isLoaded, auth.isSignedIn, user?.id, activeWorkspaceId, workspaceInitialized]);

 useEffect(() => {
 const scope = ++historyScopeRef.current;
 setResultSnapshot(null);
 setHistory([]);
 setHistoryLoading(false);
  setHistoryLoaded(false);
 setHistoryError("");
 if (auth.isLoaded && auth.isSignedIn && workspaceInitialized && activeWorkspaceId) loadHistory(true, scope);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [auth.isLoaded, auth.isSignedIn, activeWorkspaceId, workspaceInitialized]);

  const historyViewState = getDiagnosticHistoryViewState({
    authLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    workspaceLoading,
    workspaceInitialized,
    activeWorkspaceId,
    historyLoading,
    historyLoaded,
    historyError,
    resultCount: history.length,
  });

 // Anonymous visitors can start the quiz. Results require a server-saved signed-in session.
 function openDiagnostic() {
 const draft = restoreDiagnosticDraft(getSessionStorage(), {
 questionIds: diagnosticQuestionIds,
 userId: auth.isSignedIn ? user?.id : null,
 workspaceId: auth.isSignedIn ? activeWorkspaceId : null,
 workspaceReady: Boolean(auth.isSignedIn && workspaceInitialized && activeWorkspaceId),
 });
 const ownedDraft = draft && auth.isSignedIn
 ? bindDiagnosticDraftOwner(draft, { userId: user?.id, workspaceId: activeWorkspaceId })
 : draft;
 if (draft && !ownedDraft) clearDiagnosticDraft(getSessionStorage());
 if (ownedDraft) {
 persistDiagnosticDraft(getSessionStorage(), ownedDraft, { questionIds: diagnosticQuestionIds });
 setModalInitialStep(ownedDraft.step);
 setModalInitialData(ownedDraft);
 } else if (resultSnapshot) {
 setModalInitialStep("result");
 setModalInitialData(resultSnapshot);
 } else {
 setModalInitialStep("lead");
 setModalInitialData(null);
 }
 setModalKey((current) => current + 1);
 setDiagnosticOpen(true);
 }

  function beginFreshDiagnostic({ discardCurrentDraft = false } = {}) {
  const storage = getSessionStorage();
  if (discardCurrentDraft) clearDiagnosticDraft(storage);
  const freshDraft = createFreshDiagnosticDraft({
  userId: auth.isSignedIn ? user?.id : null,
  workspaceId: auth.isSignedIn ? activeWorkspaceId : null,
  });
  persistDiagnosticDraft(storage, freshDraft, { questionIds: diagnosticQuestionIds });
  setShowReplaceDraftDialog(false);
  setResultSnapshot(null);
  setModalInitialStep("lead");
  setModalInitialData(freshDraft);
  setModalKey((current) => current + 1);
  setDiagnosticOpen(true);
  }

  function startNewDiagnostic() {
  const existingDraft = restoreDiagnosticDraft(getSessionStorage(), {
  questionIds: diagnosticQuestionIds,
  userId: auth.isSignedIn ? user?.id : null,
  workspaceId: auth.isSignedIn ? activeWorkspaceId : null,
  workspaceReady: Boolean(auth.isSignedIn && workspaceInitialized && activeWorkspaceId),
  });
  if (existingDraft) {
  setShowReplaceDraftDialog(true);
  return;
  }
  beginFreshDiagnostic();
  }

 const liveDimensions = useMemo(
 () => buildLiveDimensions(resultSnapshot?.answers || {}),
 [resultSnapshot]
 );

 const displayScore = resultSnapshot?.score ?? 72;
 const displayTotal = resultSnapshot?.score ? 60 : 100;
 const displayTier = resultSnapshot?.recommendation?.tier || "Brand Readiness";
 const displaySummary =
 resultSnapshot?.recommendation?.line ||
 "Your brand has strong potential, but structure and message clarity are reducing conversion.";

 const severityRows = useMemo(() => {
 return [...liveDimensions]
 .sort((a, b) => a[1] - b[1])
 .slice(0, 6)
 .map(([name, score]) => [name, getSeverity(score)]);
 }, [liveDimensions]);

 const overallAverage = Math.round(
 liveDimensions.reduce((sum, item) => sum + Number(item[1] || 0), 0) / liveDimensions.length
 );

 const radarPolygon = useMemo(
 () => buildRadarPolygon(liveDimensions),
 [liveDimensions]
 );

 // Next Best Move: derive from the result's weakest gap categories (recomputed
 // from the saved answers), deduped, with a static preview fallback when no
 // result has been saved yet. Shared with the public results page.
 const nextMoves = useMemo(
 () => buildNextMoves(resultSnapshot?.answers || {}),
 [resultSnapshot]
 );

 const pathwaySteps = resultSnapshot
 ? [
 ["✓", "Discover", "complete"],
 ["✓", "Diagnose", "complete"],
 ["✓", "Score", "complete"],
 ["✓", resultSnapshot.recommendation?.tier || "Recommend", "complete"],
 ["→", "Build", "active"],
 ]
 : [
 ["1", "Discover", ""],
 ["2", "Diagnose", ""],
 ["3", "Score", "active"],
 ["4", "Recommend", ""],
 ["5", "Build", ""],
 ];

 return (
    <main className="bdx-page">
       <PublicHeader
         active="diagnostic"
         loginTo={buildDiagnosticAuthPath("/sign-in", window.location.pathname, window.location.search)}
       />

      {/* ---------- hero ---------- */}
      <section className="bdx-hero-wrap">
        <div className="bdx-blueprint" aria-hidden="true" />
        <div className="bdx-inner bdx-hero">
          <div className="bdx-title">
            <span className="bdx-eyebrow">Brand Audit</span>
            <h1>
              Brand Diagnostic.
              <em>Your Blueprint for What&apos;s Next.</em>
            </h1>
            <span className="bdx-title-rule" aria-hidden="true" />
            <p>Find the disconnect. Name the truth. Clarify the next move.</p>

            <div className="bdx-assessment-stack">
              <div className="bdx-hero-buttons">
              <button
                type="button"
                onClick={() => resultSnapshot?.id
                  ? navigate(`/brand-diagnostic/report/${encodeURIComponent(resultSnapshot.id)}`)
                  : openDiagnostic()}
                className="bdx-primary-btn"
              >
                {resultSnapshot ? "Continue to Saved Result" : "Start the Brand Diagnostic"}
                <ArrowRight size={16} />
              </button>
              {resultSnapshot?.id ? (
                <button type="button" onClick={startNewDiagnostic} className="bdx-secondary-btn">
                  Start a New Diagnostic
                  <ArrowRight size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById("score-explainer");
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className="bdx-secondary-btn"
              >
                How the Score Works
              </button>
              </div>
              <p className="bdx-assessment-note">Free 15-question assessment. Create a free account or sign in after the quiz to view and save your full results.</p>
            </div>

            {auth.isSignedIn ? (
              <section className="bdx-saved-results" aria-label="Saved diagnostic history">
                <h2>Your saved diagnostics</h2>
                {historyViewState === "checking-auth" ? <p>Checking your account before loading saved diagnostics.</p> : null}
                {historyViewState === "loading-workspace" ? <p>Loading your workspace before checking saved diagnostics.</p> : null}
                {historyViewState === "loading-history" ? <p>Loading saved results.</p> : null}
                {historyViewState === "workspace-unavailable" ? (
                  <div className="bdx-error" role="alert">
                    <p>{workspaceError?.message || "We could not confirm an active workspace, so saved diagnostics have not been checked."}</p>
                    <button type="button" className="bdx-secondary-btn" onClick={() => { void refreshWorkspaces(); }}>
                      Retry workspace
                    </button>
                  </div>
                ) : null}
                {historyViewState === "error" ? (
                  <div className="bdx-error" role="alert">
                    <p>{historyError}</p>
                    <button type="button" className="bdx-secondary-btn" onClick={() => { void loadHistory(true); }}>
                      Retry saved diagnostics
                    </button>
                  </div>
                ) : null}
                {historyViewState === "empty" ? <p>No saved diagnostics yet.</p> : null}
                {historyViewState === "results" ? history.map((record) => (
                  <button type="button" className="bdx-saved-result-card" key={record.id} onClick={() => {
                    setResultSnapshot(normalizeSavedResult(record));
                    navigate(`/brand-diagnostic/report/${encodeURIComponent(record.id)}`);
                  }}>
                    <span>{record.recommendation?.tier} · {record.score}/60</span>
                    <time dateTime={record.created_at}>{new Date(record.created_at).toLocaleDateString()}</time>
                    <span className="bdx-saved-result-action">View saved report <ArrowRight size={14} /></span>
                  </button>
                )) : null}
              </section>
            ) : null}

            <div className="bdx-trust">
              <div>
                <Clock size={22} />
                <div>
                  <strong>8-10 Minutes</strong>
                  <span>Instant results.</span>
                </div>
              </div>
              <div>
                <CheckCircle2 size={22} />
                <div>
                  <strong>Fact-Based</strong>
                  <span>Not fluff.</span>
                </div>
              </div>
              <div>
                <Lock size={22} />
                <div>
                  <strong>100% Confidential</strong>
                  <span>Your insight is safe.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bdx-hero-art">
            <img src={A.heroBuilding} alt="Architectural rendering of the Core Truth House" />
          </div>
        </div>
      </section>

      {/* ---------- clarity band ---------- */}
      <section className="bdx-band">
        <div className="bdx-inner bdx-band-inner">
          <div className="bdx-band-lead">
            <Compass size={44} strokeWidth={1.4} />
            <div>
              <strong>Clarity Changes Everything.</strong>
              <p>Founders who start with clarity build faster, grow stronger, and lead with confidence.</p>
            </div>
          </div>
          <div className="bdx-band-stats">
            <div>
              <strong>100+</strong>
              <span>Brands Clarified</span>
            </div>
            <div>
              <strong>5</strong>
              <span>Core Areas Evaluated</span>
            </div>
            <div>
              <strong>8-10</strong>
              <span>Minutes to Complete</span>
            </div>
            <div>
              <em>Instant</em>
              <span>Diagnostic Report</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bdx-wrap">
        <div className="bdx-score-panel">
          <div>
            <p className="bdx-kicker">Brand Readiness Score</p>
            <ScoreRing score={displayScore} total={displayTotal} />
          </div>

          <div>
            <h2>{displaySummary}</h2>
            <button type="button" onClick={resultSnapshot?.id ? startNewDiagnostic : openDiagnostic}>
              {resultSnapshot?.id ? "Start a New Diagnostic" : "Take the full diagnostic"} <ArrowRight size={13} />
            </button>
          </div>

          <div className="bdx-pathway">
            {pathwaySteps.map(([n, label, state]) => (
              <article className={state} key={`${n}-${label}`}>
                <span>{n}</span>
                <strong>{label}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="bdx-grid">
          <section className="bdx-card bdx-dimensions">
            <div className="bdx-card-head">
              <h2>Diagnostic Dimensions</h2>
              <p>Overall Average <strong>{overallAverage}/{resultSnapshot?.score ? "100" : "100"}</strong></p>
            </div>
            <div className="bdx-dim-grid">
              {liveDimensions.map(([name, score, text, icon]) => (
                <article key={name}>
                  <img src={icon} alt="" />
                  <h3>{name}</h3>
                  <strong>{score}<span>/100</span></strong>
                  <i><b style={{ width: `${score}%` }} /></i>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bdx-card bdx-gap" id="score-explainer">
            <div className="bdx-card-head">
              <h2>Structural Gap Map</h2>
              <p>{resultSnapshot ? "Live Result" : "Preview Mode"}</p>
            </div>

            <div className="bdx-score-explainer">
              <div>
                <p className="bdx-kicker">How the score works</p>
                <h3>{displayTier}</h3>
                <span>
                  The diagnostic scores 15 questions across five categories. Lower scores reveal the areas creating the most friction in trust, clarity, and conversion.
                </span>
              </div>
              <strong>{resultSnapshot ? `${resultSnapshot.score}/60` : "72/100"}</strong>
            </div>

            <div className="bdx-radar-shell">
              <div className="bdx-radar">
                <span style={{ clipPath: radarPolygon }} />
                <em>Trust</em>
                <em>Message</em>
                <em>Offer</em>
                <em>Audience</em>
                <em>Content</em>
              </div>
              <div className="bdx-severity">
                {severityRows.map(([name, level]) => (
                  <p key={name} className={level.toLowerCase()}><i />{name}<strong>{level}</strong></p>
                ))}
              </div>
            </div>
          </section>

          <aside className="bdx-card bdx-next">
            <div className="bdx-next-head">
              <Sparkles size={22} />
              <h2>Next Best Move</h2>
            </div>

            {nextMoves.map(([title, text, icon], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <img src={icon} alt="" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}

            <button type="button" onClick={resultSnapshot?.id
              ? () => navigate(`/brand-diagnostic/report/${encodeURIComponent(resultSnapshot.id)}`)
              : openDiagnostic} className="bdx-outline-btn">
              {resultSnapshot?.id ? "View Saved Report" : "View Full Recommendation"}
              <ArrowRight size={14} />
            </button>
          </aside>
        </div>

        <div className="bdx-bottom">
          <section className="bdx-card bdx-after">
            <p>What Happens After the Score</p>
            <div>
              {afterScore.map(([title, text, icon], index) => (
                <article key={title}>
                  <span>{index + 1}</span>
                  <img src={icon} alt="" />
                  <h3>{title}</h3>
                  <small>{text}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="bdx-impact">
            <img src={A.ctaBuilding} alt="" />
            <p>Your Next Step</p>
            <h2>Turn Insight Into Impact</h2>
            <span>You&rsquo;ve identified the gaps. Now let&rsquo;s close them with a clear plan and expert guidance.</span>
            <button type="button" onClick={resultSnapshot?.id ? startNewDiagnostic : openDiagnostic}>
              {resultSnapshot?.id ? "Start a New Diagnostic" : "Start the Diagnostic"} <ArrowRight size={14} />
            </button>

            <small><ShieldCheck size={14} /> Trusted by founders and teams worldwide.</small>
          </section>
        </div>

        {/* ---------- assurance row ---------- */}
        <div className="bdx-assure">
          <div><Lock size={20} /><div><strong>Private &amp; Secure</strong><span>Your information is always protected.</span></div></div>
          <div><Sparkles size={20} /><div><strong>Instant Results</strong><span>Get your personalized report right away.</span></div></div>
          <div><Target size={20} /><div><strong>Focused &amp; Strategic</strong><span>Built for founders who want real clarity.</span></div></div>
          <div><CheckCircle2 size={20} /><div><strong>Built by Experts</strong><span>Backed by the Core Truth House methodology.</span></div></div>
          <div><ShieldCheck size={20} /><div><strong>Founder First</strong><span>Created by founders, for founders.</span></div></div>
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="bdx-final">
        <div className="bdx-final-art" aria-hidden="true">
          <img src={A.finalCta} alt="" />
        </div>
        <div className="bdx-inner bdx-final-inner">
          <p className="bdx-final-eyebrow">The best brands start with truth.</p>
          <h2>Ready to See the Truth About Your Brand?</h2>
          <button type="button" onClick={resultSnapshot?.id ? startNewDiagnostic : openDiagnostic} className="bdx-final-btn">
            {resultSnapshot?.id ? "Start a New Diagnostic" : "Start the Brand Diagnostic"}
            <ArrowRight size={16} />
          </button>
          <small>Takes 8-10 Minutes · Instant Results · 100% Confidential</small>
        </div>
      </section>

      <PublicFooter />

      {showReplaceDraftDialog ? (
        <div className="bdx-replace-draft-backdrop">
          <section
            className="bdx-replace-draft-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bdx-replace-draft-title"
            aria-describedby="bdx-replace-draft-copy"
          >
            <h2 id="bdx-replace-draft-title">You have an unfinished diagnostic</h2>
            <p id="bdx-replace-draft-copy">
              Continue that draft, or discard only that unfinished browser draft and start fresh. Your saved reports and history stay in your workspace.
            </p>
            <div>
              <button type="button" onClick={() => { setShowReplaceDraftDialog(false); openDiagnostic(); }}>
                Continue Unfinished Diagnostic
              </button>
              <button type="button" className="bdx-replace-draft-confirm" onClick={() => beginFreshDiagnostic({ discardCurrentDraft: true })}>
                Discard Draft and Start New
              </button>
            </div>
          </section>
        </div>
      ) : null}

 <ModalDiagnostic
 key={modalKey}
 open={diagnosticOpen}
 initialStep={modalInitialStep}
 initialData={modalInitialData}
 identity={identity}
 isSignedIn={auth.isSignedIn}
 userId={user?.id || null}
 workspaceId={activeWorkspaceId || null}
 navigate={navigate}
 onClose={() => setDiagnosticOpen(false)}
 onRetake={() => setResultSnapshot(null)}
 onComplete={(snapshot) => {
 setResultSnapshot(snapshot);
 setHistory((current) => [snapshot, ...current.filter((item) => item.id !== snapshot.id)]);
 setDiagnosticOpen(false);
 navigate(`/brand-diagnostic/report/${encodeURIComponent(snapshot.id)}`);
 }}
 />

 <style>{`
 .bdx-page {
 min-height: 100vh;
 background: linear-gradient(180deg, #fffaf6 0%, #f4ece6 100%);
 color: #2b1040;
 font-family: 'DM Sans', system-ui, sans-serif;
 }

 .bdx-page * { box-sizing: border-box; }

 .bdx-header {
 min-height: 64px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 18px;
 padding: 0 34px;
 border-bottom: 1px solid rgba(119,67,72,.2);
 background: rgba(255,249,244,.82);
 position: sticky;
 top: 0;
 z-index: 30;
 }

 .bdx-crumbs,
 .bdx-actions {
 display: flex;
 align-items: center;
 gap: 12px;
 }

 .bdx-crumbs {
 text-transform: uppercase;
 letter-spacing: .16em;
 color: rgba(43,16,64,.56);
 font-size: 11px;
 font-weight: 900;
 }

 .bdx-brand-mini {
 display: inline-flex;
 align-items: center;
 gap: 8px;
 color: #af0024;
 font-family: Georgia, serif;
 font-weight: 800;
 text-decoration: none;
 }

 .bdx-brand-mini img {
 width: 28px;
 height: 28px;
 }

 .bdx-mode {
 min-height: 36px;
 display: inline-flex;
 align-items: center;
 border: 1px solid rgba(119,67,72,.2);
 border-radius: 7px;
 background: rgba(255,255,255,.62);
 color: #2b1040;
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 padding: 0 14px;
 }

 .bdx-mode.primary {
 border: 0;
 background: #d6a158;
 cursor: pointer;
 }

 .bdx-wrap {
 width: min(100% - 56px, 1620px);
 margin: 0 auto;
 padding: 30px 0 14px;
 }

 .bdx-hero {
 display: grid;
 grid-template-columns: 420px minmax(0, 1fr);
 gap: 34px;
 align-items: center;
 margin-bottom: 18px;
 }

 .bdx-title h1 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: clamp(3.1rem, 5vw, 5.6rem);
 line-height: .9;
 letter-spacing: -.07em;
 }

 .bdx-title p {
 margin: 16px 0 0;
 font-family: Georgia, serif;
 font-size: 17px;
 color: rgba(43,16,64,.75);
 }

 .bdx-hero-buttons {
 display: flex;
 gap: 12px;
 flex-wrap: wrap;
 margin-top: 24px;
 }

 .bdx-primary-btn,
 .bdx-secondary-btn,
 .bdx-outline-btn,
 .bdx-result-actions a,
 .bdx-result-actions button,
 .bdx-impact button,
 .bdx-impact a {
 min-height: 42px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 9px;
 border-radius: 7px;
 padding: 0 18px;
 border: 0;
 cursor: pointer;
 text-decoration: none;
 font-size: 13px;
 font-weight: 900;
 }

 .bdx-primary-btn,
 .bdx-result-actions a,
 .bdx-result-actions button,
 .bdx-impact button {
 background: linear-gradient(135deg, #af0024, #e04e35);
 color: white;
 }

 .bdx-secondary-btn,
 .bdx-outline-btn,
 .bdx-result-actions .light {
 background: rgba(255,255,255,.68);
 border: 1px solid rgba(119,67,72,.24);
 color: #2b1040;
 }

 .bdx-score-panel,
 .bdx-card {
 border: 1px solid rgba(119,67,72,.26);
 border-radius: 10px;
 background: rgba(255,255,255,.56);
 box-shadow: 0 20px 50px rgba(43,16,64,.055);
 }

 .bdx-score-panel {
 position: relative;
 min-height: 230px;
 display: grid;
 grid-template-columns: 190px 330px minmax(350px, 1fr);
 align-items: center;
 gap: 26px;
 padding: 22px 26px;
 overflow: hidden;
 }

 .bdx-score-panel h2 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: 26px;
 line-height: 1.12;
 letter-spacing: -.04em;
 }

 .bdx-score-panel button {
 margin-top: 16px;
 border: 0;
 background: transparent;
 color: #af0024;
 font-weight: 900;
 cursor: pointer;
 }

 .bdx-score-art {
 position: absolute;
 right: 8px;
 bottom: -8px;
 width: 175px;
 opacity: .18;
 }

 .bdx-kicker {
 margin: 0 0 10px;
 color: rgba(43,16,64,.70);
 text-transform: uppercase;
 letter-spacing: .16em;
 font-size: 10px;
 font-weight: 950;
 }

 .bdx-ring {
 position: relative;
 width: 150px;
 height: 150px;
 border-radius: 50%;
 display: grid;
 place-items: center;
 background:
 radial-gradient(circle, #fffaf6 0 54%, transparent 56%),
 conic-gradient(#af0024 0 72%, #c4a95b 72% 86%, rgba(119,67,72,.14) 86% 100%);
 }

 .bdx-ring div {
 width: 116px;
 height: 116px;
 border-radius: 50%;
 display: grid;
 place-content: center;
 text-align: center;
 background: #fffaf6;
 }

 .bdx-ring strong {
 font-family: Georgia, serif;
 font-size: 48px;
 line-height: .9;
 font-weight: 500;
 }

 .bdx-ring span {
 color: rgba(43,16,64,.58);
 font-size: 14px;
 }

 .bdx-pathway {
 display: flex;
 flex-wrap: wrap;
 justify-content: center;
 gap: 14px 8px;
 position: relative;
 z-index: 2;
 }

 .bdx-pathway article {
 width: 58px;
 display: grid;
 justify-items: center;
 gap: 6px;
 text-align: center;
 }

 .bdx-pathway span {
 width: 38px;
 height: 38px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 border: 1px solid rgba(119,67,72,.3);
 background: white;
 font-family: Georgia, serif;
 }

 .bdx-pathway .active span {
 background: #d7a04b;
 color: white;
 border-color: #d7a04b;
 }

 .bdx-pathway .complete span {
 background: #af0024;
 color: white;
 border-color: #af0024;
 }

 .bdx-pathway .complete strong {
 color: #af0024;
 }

 .bdx-pathway strong {
 font-family: Georgia, serif;
 font-size: 12px;
 }

 .bdx-grid {
 display: grid;
 grid-template-columns: minmax(520px, .42fr) minmax(520px, .38fr) minmax(310px, .20fr);
 gap: 16px;
 }

 .bdx-card-head {
 min-height: 54px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 16px 16px 4px;
 }

 .bdx-card-head h2,
 .bdx-next-head h2 {
 margin: 0;
 color: rgba(43,16,64,.70);
 text-transform: uppercase;
 letter-spacing: .15em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-card-head p {
 margin: 0;
 font-family: Georgia, serif;
 font-size: 12px;
 color: rgba(43,16,64,.62);
 }

 .bdx-card-head strong {
 border: 1px solid rgba(196,169,91,.55);
 border-radius: 999px;
 color: #af0024;
 padding: 4px 9px;
 margin-left: 7px;
 }

 .bdx-dim-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 8px;
 padding: 10px 14px 16px;
 }

 .bdx-dim-grid article {
 min-height: 154px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .bdx-dim-grid img {
 width: 26px;
 height: 26px;
 object-fit: contain;
 margin-bottom: 9px;
 }

 .bdx-dim-grid h3 {
 display: inline;
 margin: 0;
 font-family: Georgia, serif;
 font-size: 14px;
 }

 .bdx-dim-grid strong {
 float: right;
 font-family: Georgia, serif;
 font-size: 18px;
 font-weight: 500;
 }

 .bdx-dim-grid span {
 font-size: 10px;
 color: rgba(43,16,64,.55);
 }

 .bdx-dim-grid i {
 clear: both;
 display: block;
 height: 5px;
 border-radius: 999px;
 background: rgba(119,67,72,.13);
 overflow: hidden;
 margin: 16px 0 10px;
 }

 .bdx-dim-grid b {
 display: block;
 height: 100%;
 background: linear-gradient(90deg, #af0024, #c4a95b);
 }

 .bdx-dim-grid p {
 margin: 0;
 text-align: center;
 color: rgba(43,16,64,.64);
 font-size: 11px;
 line-height: 1.35;
 }

 .bdx-score-explainer {
 display: grid;
 grid-template-columns: 1fr auto;
 gap: 18px;
 align-items: center;
 margin: 10px 16px 0;
 padding: 14px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 10px;
 background: rgba(255,249,244,.62);
 }

 .bdx-score-explainer h3 {
 margin: 6px 0 6px;
 font-family: Georgia, serif;
 font-size: 24px;
 line-height: 1;
 }

 .bdx-score-explainer span {
 display: block;
 color: rgba(43,16,64,.66);
 font-size: 12px;
 line-height: 1.45;
 }

 .bdx-score-explainer strong {
 font-family: Georgia, serif;
 color: #af0024;
 font-size: 34px;
 font-weight: 500;
 white-space: nowrap;
 }

 .bdx-radar-shell {
 display: grid;
 grid-template-columns: minmax(270px, 1fr) 220px;
 gap: 12px;
 padding: 16px;
 }

 .bdx-radar {
 position: relative;
 height: 260px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 background:
 radial-gradient(circle, rgba(175,0,36,.16) 0 34%, transparent 35%),
 repeating-conic-gradient(from 0deg, rgba(43,16,64,.12) 0 1deg, transparent 1deg 45deg),
 radial-gradient(circle, transparent 0 30%, rgba(119,67,72,.18) 31% 32%, transparent 33% 55%, rgba(119,67,72,.15) 56% 57%, transparent 58%);
 }

 .bdx-radar span {
 width: 150px;
 height: 150px;
 clip-path: polygon(50% 6%, 90% 34%, 75% 86%, 25% 86%, 10% 34%);
 background: rgba(175,0,36,.24);
 border: 2px solid #af0024;
 transition: clip-path .35s ease, transform .35s ease;
 }

 .bdx-radar em {
 position: absolute;
 font-style: normal;
 font-family: Georgia, serif;
 color: rgba(43,16,64,.72);
 font-size: 11px;
 }

 .bdx-radar em:nth-of-type(1) { top: 16px; left: 50%; transform: translateX(-50%); }
 .bdx-radar em:nth-of-type(2) { top: 72px; right: 14px; }
 .bdx-radar em:nth-of-type(3) { bottom: 34px; right: 38px; }
 .bdx-radar em:nth-of-type(4) { bottom: 34px; left: 34px; }
 .bdx-radar em:nth-of-type(5) { top: 72px; left: 14px; }

 .bdx-severity p {
 display: grid;
 grid-template-columns: 10px 1fr auto;
 gap: 8px;
 align-items: center;
 margin: 0;
 padding: 6px 0;
 font-family: Georgia, serif;
 font-size: 12px;
 color: rgba(43,16,64,.66);
 }

 .bdx-severity i {
 width: 7px;
 height: 7px;
 border-radius: 50%;
 background: #af0024;
 }

 .bdx-severity strong {
 color: #af0024;
 }

 .bdx-severity .critical strong { color: #9e0021; }
 .bdx-severity .high strong { color: #e04e35; }
 .bdx-severity .moderate strong { color: #c8872e; }
 .bdx-severity .low strong { color: #4f9466; }
 .bdx-severity .critical i { background: #9e0021; }
 .bdx-severity .high i { background: #e04e35; }
 .bdx-severity .moderate i { background: #c8872e; }
 .bdx-severity .low i { background: #4f9466; }

 .bdx-next {
 padding: 18px;
 }

 .bdx-next-head {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-bottom: 16px;
 color: #d59a54;
 }

 .bdx-next article {
 min-height: 82px;
 display: grid;
 grid-template-columns: 30px 38px 1fr;
 align-items: center;
 gap: 10px;
 padding: 12px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 margin-bottom: 10px;
 }

 .bdx-next article > span {
 width: 27px;
 height: 27px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,.58);
 border-radius: 50%;
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .bdx-next img {
 width: 30px;
 height: 30px;
 object-fit: contain;
 }

 .bdx-next h3 {
 margin: 0 0 4px;
 font-family: Georgia, serif;
 font-size: 15px;
 }

 .bdx-next p {
 margin: 0;
 color: rgba(43,16,64,.62);
 font-size: 11px;
 line-height: 1.35;
 }

 .bdx-outline-btn {
 width: 100%;
 margin-top: 2px;
 }

 .bdx-bottom {
 margin-top: 16px;
 display: grid;
 grid-template-columns: minmax(760px, .64fr) minmax(430px, .36fr);
 gap: 16px;
 }

 .bdx-after {
 padding: 14px 18px;
 }

 .bdx-after > p {
 margin: 0 0 12px;
 text-align: center;
 text-transform: uppercase;
 letter-spacing: .16em;
 color: rgba(43,16,64,.62);
 font-weight: 950;
 font-size: 11px;
 }

 .bdx-after > div {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 10px;
 }

 .bdx-after article {
 min-height: 138px;
 text-align: center;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .bdx-after article > span {
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .bdx-after img {
 width: 40px;
 height: 40px;
 object-fit: contain;
 margin: 6px auto;
 }

 .bdx-after h3 {
 margin: 0 0 5px;
 font-family: Georgia, serif;
 font-size: 15px;
 }

 .bdx-after small {
 color: rgba(43,16,64,.62);
 line-height: 1.35;
 }

 .bdx-impact {
 position: relative;
 min-height: 238px;
 overflow: hidden;
 border-radius: 9px;
 padding: 26px 30px;
 background: linear-gradient(135deg, #33033c, #0d0010);
 color: white;
 }

 .bdx-impact > img {
 position: absolute;
 right: -18px;
 bottom: -72px;
 width: 320px;
 opacity: .28;
 }

 .bdx-impact > *:not(img) {
 position: relative;
 z-index: 1;
 }

 .bdx-impact p {
 margin: 0;
 color: #d7a158;
 text-transform: uppercase;
 letter-spacing: .16em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-impact h2 {
 margin: 10px 0 8px;
 font-family: Georgia, serif;
 font-size: 34px;
 line-height: .98;
 letter-spacing: -.05em;
 }

 .bdx-impact span {
 display: block;
 max-width: 420px;
 color: rgba(255,255,255,.74);
 font-size: 13px;
 line-height: 1.55;
 }

 .bdx-impact button,
 .bdx-impact a {
 width: min(100%, 330px);
 margin-top: 14px;
 }

 .bdx-impact a {
 color: #f6eee8;
 border: 1px solid rgba(196,169,91,.36);
 background: transparent;
 }

 .bdx-impact small {
 display: flex;
 align-items: center;
 gap: 8px;
 margin-top: 12px;
 color: rgba(255,255,255,.70);
 }

 .bdx-footer {
 min-height: 54px;
 width: min(100% - 56px, 1620px);
 margin: 0 auto;
 display: grid;
 grid-template-columns: 1fr auto 1fr;
 align-items: center;
 border-top: 1px solid rgba(119,67,72,.2);
 color: rgba(43,16,64,.58);
 font-size: 11px;
 }

 .bdx-footer img {
 width: 32px;
 opacity: .58;
 }

 .bdx-footer div {
 justify-self: end;
 display: flex;
 gap: 30px;
 }

 .bdx-footer a {
 color: rgba(43,16,64,.62);
 text-decoration: none;
 }

 .bdx-modal-wrap {
 position: fixed;
 inset: 0;
 z-index: 100;
 display: grid;
 place-items: center;
 padding: 22px;
 }

 .bdx-modal-backdrop {
 position: absolute;
 inset: 0;
 background: rgba(13,0,16,.54);
 backdrop-filter: blur(8px);
 }

 .bdx-modal {
 position: relative;
 z-index: 2;
 width: min(100%, 760px);
 max-height: min(88vh, 820px);
 overflow: auto;
 border: 1px solid rgba(216,197,195,.42);
 border-radius: 26px;
 background: #fffaf6;
 box-shadow: 0 40px 110px rgba(13,0,16,.34);
 padding: 28px;
 }

 .bdx-modal-close {
 position: absolute;
 right: 18px;
 top: 18px;
 width: 36px;
 height: 36px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 border: 1px solid rgba(119,67,72,.2);
 background: rgba(255,255,255,.72);
 color: #2b1040;
 cursor: pointer;
 }

 .bdx-modal h2 {
 margin: 10px 0 0;
 font-family: Georgia, serif;
 font-size: clamp(2rem, 4vw, 3.4rem);
 line-height: .96;
 letter-spacing: -.05em;
 }

 .bdx-modal-copy {
 color: rgba(43,16,64,.68);
 line-height: 1.6;
 }

 .bdx-lead-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 12px;
 margin-top: 20px;
 }

 .bdx-lead-grid label {
 display: grid;
 gap: 6px;
 color: rgba(43,16,64,.72);
 font-size: 12px;
 font-weight: 900;
 }

 .bdx-lead-grid .full {
 grid-column: 1 / -1;
 }

 .bdx-lead-grid input,
 .bdx-lead-grid select {
 min-height: 42px;
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 10px;
 background: rgba(255,255,255,.75);
 padding: 0 12px;
 color: #2b1040;
 font: inherit;
 }

 .bdx-consent {
 display: flex;
 align-items: flex-start;
 gap: 9px;
 margin-top: 14px;
 color: rgba(43,16,64,.66);
 font-size: 13px;
 line-height: 1.4;
 }

 .bdx-primary-btn:disabled,
 .bdx-result-actions button:disabled {
 opacity: .55;
 cursor: not-allowed;
 }

 .bdx-error {
 margin: 14px 0 0;
 color: #af0024;
 background: rgba(175,0,36,.07);
 border: 1px solid rgba(175,0,36,.22);
 border-radius: 12px;
 padding: 10px;
 font-size: 13px;
 font-weight: 800;
 }

 .bdx-assessment-note {
 margin: 12px 0 0;
 color: rgba(43,16,64,.68);
 font-size: 13px;
 line-height: 1.45;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 12px;
 background: rgba(255,249,244,.66);
 padding: 10px 12px;
 }

 .bdx-modal-progress {
 height: 7px;
 border-radius: 999px;
 overflow: hidden;
 background: rgba(119,67,72,.14);
 margin: 18px 0;
 }

 .bdx-modal-progress span {
 display: block;
 height: 100%;
 background: linear-gradient(90deg, #af0024, #c4a95b);
 }

 .bdx-question-panel {
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 22px;
 background: rgba(255,249,244,.62);
 padding: 22px;
 }

 .bdx-question-panel img {
 width: 46px;
 height: 46px;
 object-fit: contain;
 }

 .bdx-question-panel small {
 display: block;
 margin-top: 12px;
 color: #af0024;
 text-transform: uppercase;
 letter-spacing: .13em;
 font-weight: 950;
 }

 .bdx-question-panel p {
 color: rgba(43,16,64,.72);
 line-height: 1.6;
 }

 .bdx-answer-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 10px;
 margin-top: 14px;
 }

 .bdx-answer-grid button {
 min-height: 42px;
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 999px;
 background: rgba(255,255,255,.76);
 color: #2b1040;
 font-weight: 900;
 cursor: pointer;
 }

 .bdx-result-top {
 display: grid;
 grid-template-columns: 170px 1fr;
 gap: 24px;
 align-items: center;
 margin-top: 20px;
 }

 .bdx-result-top p {
 color: rgba(43,16,64,.68);
 line-height: 1.55;
 }

 .bdx-result-top small {
 color: rgba(43,16,64,.58);
 font-weight: 800;
 }

 .bdx-result-gaps {
 display: grid;
 gap: 8px;
 margin-top: 20px;
 }

 .bdx-result-gaps p {
 margin: 0;
 color: #af0024;
 text-transform: uppercase;
 letter-spacing: .13em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-result-gaps span {
 display: flex;
 align-items: center;
 gap: 9px;
 border: 1px solid rgba(119,67,72,.2);
 border-radius: 12px;
 background: rgba(255,249,244,.64);
 padding: 9px 11px;
 font-weight: 850;
 }

 .bdx-result-gaps img {
 width: 26px;
 height: 26px;
 }

 .bdx-save-note {
 margin: 0;
 color: rgba(43,16,64,.66);
 font-size: 13px;
 line-height: 1.45;
 text-align: center;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 12px;
 padding: 10px 12px;
 background: rgba(255,249,244,.66);
 }

 .bdx-result-actions {
 display: grid;
 gap: 10px;
 margin-top: 20px;
 }

 .bdx-result-actions .light {
 background: rgba(255,255,255,.72);
 border: 1px solid rgba(119,67,72,.22);
 color: #2b1040;
 }

  .bdx-replace-draft-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(22, 9, 28, .62);
  }

  .bdx-replace-draft-dialog {
  width: min(100%, 520px);
  border: 1px solid rgba(119,67,72,.22);
  border-radius: 16px;
  padding: 24px;
  background: #fffaf5;
  color: #2b1040;
  box-shadow: 0 24px 80px rgba(0,0,0,.24);
  }

  .bdx-replace-draft-dialog h2 { margin: 0 0 10px; font-size: 21px; }
  .bdx-replace-draft-dialog p { color: rgba(43,16,64,.72); line-height: 1.55; }
  .bdx-replace-draft-dialog > div { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .bdx-replace-draft-dialog button { min-height: 42px; border: 1px solid rgba(119,67,72,.28); border-radius: 999px; padding: 0 16px; background: white; color: #2b1040; font-weight: 800; cursor: pointer; }
  .bdx-replace-draft-dialog .bdx-replace-draft-confirm { background: #33033c; color: #fffaf5; }

 @media (max-width: 1300px) {
 .bdx-hero,
 .bdx-grid,
 .bdx-bottom {
 grid-template-columns: 1fr;
 }

 .bdx-score-panel {
 grid-template-columns: 190px 1fr;
 }

 .bdx-pathway {
 grid-column: 1 / -1;
 }
 }

 @media (max-width: 720px) {
 .bdx-wrap,
 .bdx-footer {
 width: min(100% - 28px, 720px);
 }

 .bdx-header {
 align-items: flex-start;
 flex-direction: column;
 padding: 16px 20px;
 }

 .bdx-score-panel,
 .bdx-radar-shell,
 .bdx-result-top,
 .bdx-lead-grid {
 grid-template-columns: 1fr;
 }

 .bdx-dim-grid,
 .bdx-after > div,
 .bdx-answer-grid {
 grid-template-columns: 1fr 1fr;
 }

 .bdx-title h1 {
 font-size: 3.2rem;
 }
 }
 `}</style>

      <style>{`
        /* ===== estate redesign — hero, clarity band, assurance, final CTA ===== */
        .bdx-inner { width: min(1240px, calc(100% - 64px)); margin: 0 auto; }

        .bdx-hero-wrap { position: relative; background: linear-gradient(180deg, #fffaf6 0%, #f4ece6 100%); overflow: hidden; }
        .bdx-blueprint {
          position: absolute; inset: 0; opacity: 0.32; pointer-events: none;
          background-image:
            linear-gradient(rgba(51,3,60,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51,3,60,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 34%);
          mask-image: linear-gradient(to right, transparent, #000 34%);
        }
        .bdx-page .bdx-hero {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 0.94fr 1.06fr; align-items: center; gap: 50px;
          padding: 60px 0 54px; margin: 0 auto; width: min(1240px, calc(100% - 64px));
        }
        .bdx-eyebrow {
          display: inline-block; margin: 0 0 16px;
          color: #af0024; font-family: "DM Sans", sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
        }
        .bdx-page .bdx-title h1 {
          margin: 0; color: #33033c;
          font-family: "Playfair Display", Georgia, serif; font-weight: 600;
          font-size: clamp(2.9rem, 5vw, 4.6rem); line-height: 1.0; letter-spacing: -0.03em;
          text-wrap: balance;
        }
        .bdx-page .bdx-title h1 em { display: block; color: #af0024; font-style: italic; }
        .bdx-title-rule { display: block; width: 64px; height: 2px; margin: 26px 0; background: #c4a95b; }
        .bdx-page .bdx-title > p {
          max-width: 440px; margin: 0; color: #6d5866;
          font-family: "DM Sans", sans-serif; font-size: 1.05rem; line-height: 1.6;
        }
        .bdx-page .bdx-assessment-stack {
          display: flex; flex-direction: column; gap: 24px; margin-top: 28px;
        }
        .bdx-page .bdx-assessment-stack > .bdx-hero-buttons { margin-top: 0; }
        .bdx-page .bdx-assessment-stack > .bdx-assessment-note { margin: 0; }
        .bdx-page .bdx-saved-results {
          display: grid; gap: 12px; margin-top: 28px; padding-top: 22px;
          border-top: 1px solid rgba(51,3,60,0.16);
        }
        .bdx-page .bdx-saved-results h2 {
          margin: 0 0 2px; color: #33033c; font-family: "Playfair Display", Georgia, serif;
          font-size: 1.35rem; font-weight: 600; line-height: 1.2;
        }
        .bdx-page .bdx-saved-result-card {
          display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px 16px;
          width: 100%; padding: 14px 16px; border: 1px solid rgba(51,3,60,0.15); border-radius: 6px;
          background: rgba(255,255,255,0.68); color: #33033c; text-align: left; cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .bdx-page .bdx-saved-result-card:hover { border-color: #c4a95b; background: #fffaf6; }
        .bdx-page .bdx-saved-result-card > span:first-child { font-size: 14px; font-weight: 700; }
        .bdx-page .bdx-saved-result-card time { color: #6d5866; font-size: 12px; }
        .bdx-page .bdx-saved-result-action { display: inline-flex; grid-column: 1 / -1; align-items: center; gap: 6px; color: #af0024; font-size: 12px; font-weight: 700; }
        .bdx-page .bdx-saved-results > p { margin: 0; color: #6d5866; line-height: 1.5; }
        .bdx-trust { display: flex; flex-wrap: wrap; gap: 26px 34px; margin-top: 40px; }
        .bdx-trust > div { display: flex; align-items: center; gap: 12px; }
        .bdx-trust svg { color: #c4a95b; flex-shrink: 0; }
        .bdx-trust strong { display: block; color: #33033c; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; }
        .bdx-trust span { display: block; color: #8a7480; font-size: 12px; }
        .bdx-hero-art img { width: 100%; max-height: 560px; object-fit: contain; }

        /* clarity band */
        .bdx-band { position: relative; background-color: #0d0010; color: #f4ecdf; overflow: hidden; }
        .bdx-band::before {
          content: ""; position: absolute; inset: 0; opacity: 0.5; pointer-events: none;
          background-image:
            linear-gradient(rgba(196,169,91,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,169,91,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .bdx-band-inner { position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 34px 44px; padding: 40px 0; }
        .bdx-band-lead { display: flex; align-items: center; gap: 20px; max-width: 480px; }
        .bdx-band-lead svg { color: #c4a95b; flex-shrink: 0; }
        .bdx-band-lead strong { display: block; color: #c4a95b; font-family: "Playfair Display", Georgia, serif; font-weight: 600; font-size: 1.4rem; letter-spacing: -0.01em; }
        .bdx-band-lead p { margin: 6px 0 0; color: rgba(244,236,223,0.72); font-size: 0.92rem; line-height: 1.5; }
        .bdx-band-stats { display: flex; flex-wrap: wrap; gap: 30px; }
        .bdx-band-stats > div { padding-left: 28px; border-left: 1px solid rgba(196,169,91,0.28); }
        .bdx-band-stats > div:first-child { border-left: 0; padding-left: 0; }
        .bdx-band-stats strong, .bdx-band-stats em { display: block; color: #f4ecdf; font-family: "Playfair Display", Georgia, serif; font-weight: 600; font-style: normal; font-size: 2rem; line-height: 1; }
        .bdx-band-stats span { display: block; margin-top: 8px; color: rgba(244,236,223,0.6); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }

        /* assurance row */
        .bdx-assure { display: grid; grid-template-columns: repeat(5, 1fr); gap: 22px; margin: 8px 0 20px; padding: 34px 0 0; border-top: 1px solid rgba(51,3,60,0.12); }
        .bdx-assure > div { display: flex; align-items: flex-start; gap: 12px; }
        .bdx-assure svg { color: #c4a95b; flex-shrink: 0; margin-top: 2px; }
        .bdx-assure strong { display: block; color: #33033c; font-family: "DM Sans", sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .bdx-assure span { display: block; margin-top: 5px; color: #6d5866; font-size: 12.5px; line-height: 1.45; }

        /* final CTA */
        .bdx-final { position: relative; overflow: hidden; background: linear-gradient(160deg, #33033c 0%, #0d0010 100%); color: #f4ecdf; text-align: center; }
        .bdx-final-art { position: absolute; inset: 0 auto 0 0; width: 46%; opacity: 0.16; pointer-events: none; }
        .bdx-final-art img { height: 100%; width: 100%; object-fit: cover; object-position: left center; }
        .bdx-final-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 84px 0; }
        .bdx-final-eyebrow { margin: 0; color: #c4a95b; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
        .bdx-final h2 { margin: 8px 0 6px; max-width: 720px; color: #fff; font-family: "Playfair Display", Georgia, serif; font-weight: 600; font-size: clamp(2.1rem, 4vw, 3.4rem); line-height: 1.05; letter-spacing: -0.02em; text-wrap: balance; }
        .bdx-final-btn { display: inline-flex; align-items: center; gap: 10px; margin-top: 18px; padding: 15px 30px; border: 0; border-radius: 4px; background: #c4a95b; color: #33033c; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: transform 0.15s ease; }
        .bdx-final-btn:hover { transform: translateY(-1px); }
        .bdx-final small { margin-top: 16px; color: rgba(244,236,223,0.6); font-size: 12px; letter-spacing: 0.04em; }

        @media (max-width: 960px) {
          .bdx-page .bdx-hero { grid-template-columns: 1fr; gap: 32px; padding: 46px 0 40px; }
          .bdx-hero-art { max-width: 620px; }
          .bdx-band-inner { flex-direction: column; align-items: flex-start; }
          .bdx-assure { grid-template-columns: repeat(2, 1fr); gap: 24px 20px; }
        }
        @media (max-width: 560px) {
          .bdx-inner, .bdx-page .bdx-hero { width: min(100% - 36px, 1240px); }
          .bdx-band-stats { gap: 20px; }
          .bdx-band-stats > div { padding-left: 20px; }
          .bdx-assure { grid-template-columns: 1fr; }
          .bdx-final-inner { padding: 60px 0; }
          .bdx-final-art { width: 70%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bdx-final-btn { transition: none; }
        }
      `}</style>
 </main>
 );
}
