/**
 * PreAuditIntake.jsx
 * CTH OS — Pre-Audit Intake Form (Phase 3 rebuild)
 *
 * Renders inside BrandAudit (no DashboardLayout). Phase 3 layout:
 * inline header + progress, 148px left section nav, right field area with
 * "why this matters" box, three tip cards, fields, and a Zuri card.
 * Matches docs/references/CTH_brand_audit_intake.html.
 *
 * Collects 12 questions across 4 sections.
 * On submit: POST /api/brand-audit/intake, then onComplete().
 */

import React, { useState } from 'react';
import { useUser } from '../../hooks/useAuth';
import { Check, Pencil, Circle, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const INK = '#1a0828';
const MUTED = '#7c6576';
const CRIMSON = '#5d0012';
const GREEN = '#2d6a4f';
const ACCENT = '#e04e35';
const BORDER = '#e8d5d0';
const BORDER2 = '#d8c5c3';
const BG = '#f8f4f2';
const NAVBG = '#faf7f5';
const BODYTEXT = '#3d2d4a';
const WHYTEXT = '#4a3860';

const SECTIONS = [
  {
    id: 'brand',
    number: 1,
    label: 'Your Brand',
    subtitle: "Tell us about the brand we're auditing — the name, the promise, and who it's for.",
    why: 'Your brand foundation score measures how clearly you have defined who you are, what you do, and who you serve. This section is the bedrock everything else is scored against.',
    tips: [
      'Use the name you actually operate under publicly, not your legal entity name',
      "Describe what you do in plain language — the way you'd say it to a friend",
      'Name one specific person you serve, not a broad demographic',
    ],
    zuriLabel: 'Zuri · brand context',
    zuriText: 'Clarity beats cleverness. The brands that score highest here can describe who they serve in one sentence without hedging.',
    questions: [
      { id: 'brand_name', label: 'What is your brand name?', sublabel: 'The name you operate under publicly.', type: 'input', placeholder: 'e.g. Oak & Ember Studio', required: true },
      { id: 'tagline', label: 'Do you have a tagline?', sublabel: "One sentence that describes what you do. Leave blank if you don't have one yet.", type: 'input', placeholder: 'e.g. Strategy that turns scattered effort into steady growth.', required: false },
      { id: 'what_you_do', label: 'What do you do?', sublabel: 'Describe your service, product, or expertise in 1-2 sentences.', type: 'textarea', placeholder: 'e.g. I help service-based founders clarify their message, package their offers, and build a repeatable marketing system.', required: true, rows: 3 },
      { id: 'who_you_serve', label: 'Who do you serve?', sublabel: 'Describe your ideal client. One specific person, not a broad demographic.', type: 'textarea', placeholder: 'e.g. Service-based business owners who are getting referrals but struggling to turn online attention into consistent sales.', required: true, rows: 3 },
    ],
  },
  {
    id: 'offer',
    number: 2,
    label: 'Your Offer',
    subtitle: 'Tell us about your primary offer and how you monetize your expertise.',
    why: 'Your offer suite score measures how clearly your offers are positioned, priced, and differentiated. This section tells us what we are scoring.',
    tips: [
      'Name your most important offer — the one that generates most of your revenue',
      'Price point helps us assess positioning alignment with your market',
      'Select the type that best describes how you deliver your work',
    ],
    zuriLabel: 'Zuri · offer context',
    zuriText: 'A clear primary offer is the anchor of every strong brand. If you have more than three offers, list the one you most want to be known for.',
    questions: [
      { id: 'primary_offer', label: 'What is your primary offer?', sublabel: 'The main thing you want people to buy from you right now.', type: 'input', placeholder: 'e.g. A 6-week brand strategy intensive, monthly consulting plan, or digital toolkit.', required: true },
      { id: 'price_point', label: 'What is the price?', sublabel: 'Monthly, one-time, or hourly — just give us the number.', type: 'input', placeholder: 'e.g. $97/month, $2,500 one-time, $350/hour', required: true },
      { id: 'offer_type', label: 'What type of offer is it?', type: 'pills', required: true, options: ['Recurring subscription', 'One-time service', 'Digital product', 'Coaching / consulting', 'Course or program', 'Done-for-you', 'Agency retainer', 'Physical product'] },
      { id: 'other_offers', label: 'Do you have any other offers?', sublabel: 'List them briefly. Leave blank if this is your only one.', type: 'textarea', placeholder: 'e.g. Brand audit intensive ($497), Brand Foundation workshop ($997)', required: false, rows: 2 },
    ],
  },
  {
    id: 'presence',
    number: 3,
    label: 'Your Presence',
    subtitle: 'Tell us where you show up and how consistently you publish.',
    why: 'Your content library and launch readiness scores draw on where you are active and how often you show up. Consistency and platform fit matter more than being everywhere.',
    tips: [
      'Select only the platforms where you publish regularly — not every account you own',
      'Posting frequency helps us gauge whether your engine is built for momentum',
      "A live website strengthens launch readiness, but it's optional here",
    ],
    zuriLabel: 'Zuri · presence context',
    zuriText: "Presence isn't about being on every platform. It's about showing up consistently where your buyers already are.",
    questions: [
      { id: 'active_platforms', label: 'Where are you currently active?', sublabel: 'Select all platforms where you publish content regularly.', type: 'checkboxes', required: true, options: ['LinkedIn', 'Instagram', 'TikTok', 'Twitter/X', 'Threads', 'YouTube', 'Facebook', 'Pinterest', 'Email list', 'Podcast', 'Blog'] },
      { id: 'posting_frequency', label: 'How often do you post?', type: 'pills', required: false, options: ['Daily', '4-5x per week', '2-3x per week', 'Weekly', 'A few times a month', 'Rarely or never'] },
      { id: 'website', label: 'Do you have a website?', sublabel: 'Share the URL if yes.', type: 'input', placeholder: 'e.g. coretruthhouse.com (or leave blank)', required: false },
    ],
  },
  {
    id: 'goals',
    number: 4,
    label: 'Your Goals',
    subtitle: 'Tell us where you want to go so the audit can point you there.',
    why: 'Your goals shape how we weight the recommendations. The audit scores where you are; your goals decide which gaps matter most right now.',
    tips: [
      'Pick the single goal that matters most for the next 90 days',
      'Be specific about your biggest challenge — precision produces a sharper audit',
      'A concrete revenue target lets us prioritize the highest-leverage moves',
    ],
    zuriLabel: 'Zuri · goal context',
    zuriText: "Specific goals produce specific strategy. 'More clients' tells me little; '$10K MRR in 90 days' tells me where to focus.",
    questions: [
      { id: 'primary_goal', label: 'What is your primary goal right now?', type: 'pills', required: true, options: ['Get my first paying clients', 'Scale past 6 figures', 'Build to 7 figures', 'Launch a new offer', 'Build recurring revenue', 'Grow my audience', 'Position as an authority', 'Systematize and scale'] },
      { id: 'biggest_challenge', label: 'What is your biggest brand challenge right now?', sublabel: 'Be specific. The more precise, the more useful the audit.', type: 'textarea', placeholder: "e.g. I post consistently but nothing converts. I'm not sure if my messaging is off or if I'm reaching the wrong people.", required: true, rows: 3 },
      { id: 'revenue_target', label: 'What is your revenue goal for the next 90 days?', sublabel: 'Give us a number. Specific goals produce specific strategy.', type: 'input', placeholder: 'e.g. $10,000 MRR, $25,000 in new clients, $5K this month', required: false },
    ],
  },
];

const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions);
const REQUIRED_COUNT = ALL_QUESTIONS.filter((q) => q.required).length;

function isFilled(val) {
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val && val.toString().trim().length > 0);
}

function FieldInput({ q, value, onChange, hasError }) {
  const base = {
    padding: '9px 12px',
    background: '#fff',
    border: `0.5px solid ${hasError ? CRIMSON : BORDER2}`,
    borderRadius: 8,
    fontSize: 12,
    color: INK,
    fontFamily: SANS,
    outline: 'none',
    width: '100%',
  };

  if (q.type === 'textarea') {
    return (
      <textarea
        data-testid={`intake-${q.id}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={q.rows || 3}
        style={{ ...base, resize: 'vertical', lineHeight: 1.6, minHeight: 72 }}
      />
    );
  }

  if (q.type === 'pills') {
    const selected = value || '';
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {q.options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              type="button"
              key={opt}
              data-testid={`intake-${q.id}-${opt.replace(/\s/g, '-').toLowerCase()}`}
              onClick={() => onChange(isSelected ? '' : opt)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
                border: `0.5px solid ${isSelected ? CRIMSON : BORDER2}`,
                background: isSelected ? CRIMSON : '#fff',
                color: isSelected ? '#fff' : BODYTEXT,
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === 'checkboxes') {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt) =>
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {q.options.map((opt) => {
          const isSelected = arr.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              data-testid={`intake-${q.id}-${opt.replace(/\s/g, '-').toLowerCase()}`}
              onClick={() => toggle(opt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 10px',
                background: isSelected ? '#f0e8e5' : '#fff',
                border: `0.5px solid ${isSelected ? '#c7a09d' : BORDER2}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: `0.5px solid ${isSelected ? CRIMSON : BORDER2}`,
                  background: isSelected ? CRIMSON : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSelected ? <Check size={10} style={{ color: '#fff' }} /> : null}
              </span>
              <span style={{ fontSize: 11, color: INK }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      data-testid={`intake-${q.id}`}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder}
      style={base}
    />
  );
}

/**
 * PreAuditIntake
 * Props:
 *   onComplete  — called after intake + audit trigger succeeds
 *   onSkip      — allow skipping intake (optional; renders a skip link if passed)
 *   workspaceId — scopes the localStorage draft key
 */
export default function PreAuditIntake({ onComplete, onSkip, workspaceId = '' }) {
  const { user } = useUser();
  const userId = user?.id;
  const storageKey = `cth-brand-audit-intake:${workspaceId || userId || 'default'}`;

  const [step, setStep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved.step || 1;
    } catch {
      return 1;
    }
  });

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved.answers || {};
    } catch {
      return {};
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [errorFields, setErrorFields] = useState([]);

  const currentSection = SECTIONS[step - 1];
  const isLastStep = step === SECTIONS.length;

  const persistDraft = (nextAnswers, nextStep = step) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers: nextAnswers, step: nextStep, updatedAt: new Date().toISOString() })
      );
    } catch {
      // localStorage can fail in private mode; do not block the form.
    }
  };

  const setAnswer = (qId, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: value };
      persistDraft(next);
      return next;
    });
  };

  const sectionComplete = (idx) =>
    SECTIONS[idx].questions.filter((q) => q.required).every((q) => isFilled(answers[q.id]));

  const completedCount = SECTIONS.filter((_, i) => sectionComplete(i)).length;

  const canAdvance = () =>
    currentSection.questions.filter((q) => q.required).every((q) => isFilled(answers[q.id]));

  const flagMissing = () => {
    const missingIds = currentSection.questions
      .filter((q) => q.required)
      .filter((q) => !isFilled(answers[q.id]))
      .map((q) => q.id);
    setErrorFields(missingIds);
    setError('Please fill in the required fields before continuing.');
  };

  const handleNext = () => {
    if (!canAdvance()) {
      flagMissing();
      return;
    }
    setError(null);
    setErrorFields([]);
    if (isLastStep) {
      setShowReview(true);
    } else {
      const next = step + 1;
      setStep(next);
      persistDraft(answers, next);
    }
  };

  const handleBack = () => {
    setError(null);
    setErrorFields([]);
    setStep((s) => {
      const nextStep = Math.max(1, s - 1);
      persistDraft(answers, nextStep);
      return nextStep;
    });
  };

  // Left-nav navigation: back is always free; forward requires the current and
  // any intervening sections to be valid (lands on the first incomplete one).
  const goToSection = (targetStep) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      setError(null);
      setErrorFields([]);
      setStep(targetStep);
      persistDraft(answers, targetStep);
      return;
    }
    if (!canAdvance()) {
      flagMissing();
      return;
    }
    for (let i = step; i < targetStep; i += 1) {
      if (!sectionComplete(i - 1)) {
        setError(null);
        setErrorFields([]);
        setStep(i);
        persistDraft(answers, i);
        return;
      }
    }
    setError(null);
    setErrorFields([]);
    setStep(targetStep);
    persistDraft(answers, targetStep);
  };

  const handleBackToEdit = () => {
    setError(null);
    setShowReview(false);
  };

  const handleSubmit = async () => {
    if (!canAdvance()) {
      setError('Please fill in the required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/api/brand-audit/intake', {
        answers,
        user_id: userId || 'default',
      });
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Review screen ----------
  if (showReview) {
    return (
      <div data-testid="pre-audit-intake" style={{ background: BG, fontFamily: SANS, padding: '40px 24px', minHeight: '100%' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: INK, margin: 0, lineHeight: 1.2 }}>
            Review your answers
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: '8px 0 0', lineHeight: 1.6 }}>
            Review your answers before running the audit. You can go back to make changes.
          </p>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SECTIONS.map((section) => (
              <div key={section.id} style={{ background: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <p style={{ fontFamily: SANS, fontSize: 8, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>
                  Section {section.number}
                </p>
                <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: INK, margin: '4px 0 16px' }}>
                  {section.label}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {section.questions.map((q) => {
                    const raw = answers[q.id];
                    const empty = !isFilled(raw);
                    const displayed = Array.isArray(raw) ? raw.join(', ') : raw == null ? '' : String(raw);
                    return (
                      <div key={q.id}>
                        <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, margin: 0 }}>
                          {q.label}
                        </p>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: empty ? MUTED : INK,
                            fontStyle: empty ? 'italic' : 'normal',
                            margin: '6px 0 0',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {empty ? 'Not answered' : displayed}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'color-mix(in srgb, var(--cth-danger) 8%, #fff)', border: '0.5px solid color-mix(in srgb, var(--cth-danger) 25%, #e8d5d0)', borderRadius: 8 }}>
              <p data-testid="intake-error" style={{ fontFamily: SANS, fontSize: 12, color: 'var(--cth-danger)', margin: 0 }}>{error}</p>
            </div>
          ) : null}

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button
              type="button"
              data-testid="intake-back-to-edit-btn"
              onClick={handleBackToEdit}
              style={{ padding: '11px 22px', borderRadius: 8, border: `0.5px solid ${BORDER2}`, background: '#fff', color: INK, fontSize: 13, fontWeight: 500, fontFamily: SANS, cursor: 'pointer' }}
            >
              ← Back to edit
            </button>
            <button
              type="button"
              data-testid="intake-run-audit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 1,
                padding: 11,
                borderRadius: 8,
                border: 'none',
                background: GREEN,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                fontFamily: SANS,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'cth-spin 0.8s linear infinite' }} />
                  Running your Brand Audit...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Run Brand Audit
                </>
              )}
            </button>
          </div>
        </div>
        <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ---------- Section wizard ----------
  return (
    <div data-testid="pre-audit-intake" style={{ display: 'flex', flexDirection: 'column', background: BG, fontFamily: SANS, minHeight: '100%' }}>
      <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Inline header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: INK }}>Brand Audit</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Answer a few questions so we can score your brand infrastructure.</div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
          {onSkip ? (
            <button type="button" data-testid="intake-skip-btn" onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 11, fontFamily: SANS }}>
              Skip intake
            </button>
          ) : null}
          <div>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>{completedCount} of {SECTIONS.length} complete</div>
            <div style={{ width: 100, height: 3, background: '#f0e8e5', borderRadius: 2, overflow: 'hidden', marginLeft: 'auto' }}>
              <div style={{ width: `${(completedCount / SECTIONS.length) * 100}%`, height: '100%', background: GREEN, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Body: nav + field area */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '148px 1fr' }}>
        {/* Left section nav */}
        <nav style={{ borderRight: `0.5px solid ${BORDER}`, padding: '14px 0', background: NAVBG }}>
          <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, padding: '0 14px 8px', fontWeight: 500 }}>
            Sections
          </div>
          {SECTIONS.map((section, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === step;
            const isDone = sectionComplete(idx);
            const state = isActive ? 'act' : isDone ? 'done' : 'todo';
            const Icon = isActive ? Pencil : isDone ? Check : Circle;
            const iconColor = isActive ? CRIMSON : isDone ? GREEN : BORDER2;
            const textColor = isActive ? CRIMSON : isDone ? MUTED : '#b0a0b8';
            return (
              <button
                key={section.id}
                type="button"
                data-testid={`intake-nav-${section.id}`}
                onClick={() => goToSection(stepNum)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  borderLeft: `2px solid ${isActive ? CRIMSON : 'transparent'}`,
                  width: '100%',
                  background: isActive ? '#fff' : 'transparent',
                  border: 'none',
                  borderLeftWidth: 2,
                  borderLeftStyle: 'solid',
                  borderLeftColor: isActive ? CRIMSON : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Icon size={11} style={{ color: iconColor, flexShrink: 0 }} />
                <span style={{ color: textColor, fontSize: 11, fontWeight: isActive ? 500 : 400 }}>{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Field area */}
        <div key={step} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: INK }}>{currentSection.label}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{currentSection.subtitle}</div>
          </div>

          {/* Why this matters */}
          <div style={{ background: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '11px 14px' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, fontWeight: 500, marginBottom: 4 }}>Why this matters</div>
            <div style={{ fontSize: 11, color: WHYTEXT, lineHeight: 1.6 }}>{currentSection.why}</div>
          </div>

          {/* Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {currentSection.tips.map((tip, i) => (
              <div key={i} style={{ background: '#fff', border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, fontWeight: 500, marginBottom: 3 }}>Tip {i + 1}</div>
                <div style={{ fontSize: 10, color: BODYTEXT, lineHeight: 1.5 }}>{tip}</div>
              </div>
            ))}
          </div>

          {/* Fields */}
          {currentSection.questions.map((q) => {
            const hasError = errorFields.includes(q.id);
            return (
              <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, fontWeight: 500 }}>
                  {q.label}
                  {q.required ? <span style={{ color: ACCENT, marginLeft: 4 }}>*</span> : null}
                </div>
                {q.sublabel ? <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.5, marginBottom: 2 }}>{q.sublabel}</div> : null}
                <FieldInput
                  q={q}
                  value={answers[q.id]}
                  hasError={hasError}
                  onChange={(val) => {
                    setAnswer(q.id, val);
                    setError(null);
                    setErrorFields((prev) => prev.filter((id) => id !== q.id));
                  }}
                />
                {hasError ? (
                  <p data-testid={`intake-required-${q.id}`} style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: CRIMSON, fontFamily: SANS, letterSpacing: '0.04em' }}>
                    Required
                  </p>
                ) : null}
              </div>
            );
          })}

          {/* Error banner */}
          {error ? (
            <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--cth-danger) 8%, #fff)', border: '0.5px solid color-mix(in srgb, var(--cth-danger) 25%, #e8d5d0)', borderRadius: 8 }}>
              <p data-testid="intake-error" style={{ fontSize: 12, color: 'var(--cth-danger)', margin: 0 }}>{error}</p>
            </div>
          ) : null}

          {/* Zuri card */}
          <div style={{ background: INK, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src="/zuri.png" alt="Zuri" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a6090' }}>{currentSection.zuriLabel}</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 12, color: '#e8dff0', fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{currentSection.zuriText}&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 22px', borderTop: `0.5px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NAVBG, flexShrink: 0 }}>
        {step > 1 ? (
          <button type="button" data-testid="intake-back-btn" onClick={handleBack} style={{ fontSize: 12, color: MUTED, background: '#fff', border: `0.5px solid ${BORDER2}`, borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontFamily: SANS }}>
            ← {SECTIONS[step - 2].label}
          </button>
        ) : (
          <span />
        )}
        <span style={{ fontSize: 11, color: MUTED }}>{step} of {SECTIONS.length}</span>
        <button
          type="button"
          data-testid="intake-next-btn"
          onClick={handleNext}
          disabled={submitting}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#fff',
            background: isLastStep ? GREEN : CRIMSON,
            border: 'none',
            borderRadius: 7,
            padding: '7px 20px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: SANS,
            opacity: submitting ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          {isLastStep ? 'Run Brand Audit' : 'Save & continue →'}
        </button>
      </div>
    </div>
  );
}
