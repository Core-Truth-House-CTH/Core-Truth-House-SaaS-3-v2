import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, BookOpen,
  Search, MessageSquare, Users, Package, Sparkles, Trophy, ArrowRight, FileText
} from 'lucide-react';

// ─── STEP DEFINITIONS ────────────────────────────────────────
// `metricKey` maps each step to a boolean on the metrics object supplied by
// useOnboardingProgress. A step is complete when its milestone flag is true OR
// its module_completed_at timestamp exists (the hook resolves both into the
// metric boolean).
const STEPS = [
  {
    id: 'brand-audit',
    metricKey: 'audit_complete',
    title: 'Complete Brand Audit',
    description: 'See where your brand stands today.',
    icon: Search,
    route: '/brand-audit',
    cta: 'Start Brand Audit',
    tip: 'Answer honestly — the audit sets your baseline brand health score and tells Zuri exactly where to focus first.',
    successCriteria: 'Audit complete',
    minutesEstimate: 10,
  },
  {
    id: 'brand-foundation',
    metricKey: 'foundation_complete',
    title: 'Build Brand Foundation',
    description: 'Define your mission, vision, and positioning.',
    icon: BookOpen,
    route: '/brand-foundation',
    cta: 'Build Foundation',
    tip: 'Use Ask the House to draft every section, then edit anything that does not sound like you before saving.',
    successCriteria: 'Foundation complete',
    minutesEstimate: 15,
  },
  {
    id: 'messaging',
    metricKey: 'messaging_complete',
    title: 'Structure Your Messaging',
    description: 'Build the rules your brand follows when it speaks.',
    icon: MessageSquare,
    route: '/messaging-structure',
    cta: 'Open Messaging Structure',
    tip: 'Lock your brand promise, elevator pitch, one-liner, and core message — these become the voice behind every generation.',
    successCriteria: 'Messaging structured',
    minutesEstimate: 15,
  },
  {
    id: 'audience',
    metricKey: 'audience_complete',
    title: 'Define Your Audience',
    description: 'Document who you are building this brand for.',
    icon: Users,
    route: '/audience',
    cta: 'Define Audience',
    tip: 'Start with one primary avatar — their core fear, core desire, and the transformation they want most.',
    successCriteria: 'Audience defined',
    minutesEstimate: 10,
  },
  {
    id: 'offer',
    metricKey: 'offer_complete',
    title: 'Create Your First Offer',
    description: 'Package what you sell into a clear, buyable offer.',
    icon: Package,
    route: '/offer-builder',
    cta: 'Create Your Offer',
    tip: 'The Transformation Statement matters most: "After working with me, my client goes from ___ to ___."',
    successCriteria: 'One offer published',
    minutesEstimate: 10,
  },
];

// ─── PROGRESS CALCULATOR ─────────────────────────────────────
// Reads each step's boolean straight off the metrics object from
// useOnboardingProgress (milestone flag OR module_completed_at, resolved upstream).
function calcProgress(metrics) {
  const m = metrics || {};
  return STEPS.reduce((acc, step) => {
    acc[step.id] = Boolean(m[step.metricKey]);
    return acc;
  }, {});
}

// ─── WELCOME MODAL ───────────────────────────────────────────
function WelcomeModal({ userFirstName, onStart, onDismiss }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-command-cinnabar), var(--cth-command-muted))' }} />
        <div style={{ padding: 32 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: 'var(--cth-brand-primary-soft)', border: '1px solid var(--cth-brand-primary-deep)', marginBottom: 24 }}>
            <Sparkles size={13} style={{ color: 'var(--cth-command-cinnabar)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cth-command-muted)' }}>Quick Start</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cth-on-dark)', marginBottom: 12, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.25 }}>
            Welcome to Core Truth House,{' '}
            <span style={{ color: 'var(--cth-command-cinnabar)' }}>{userFirstName}.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(248,245,250,0.6)', marginBottom: 28, lineHeight: 1.7 }}>
            Your brand house is open. Your Quick Start gets you from setup to your first published content in 30 minutes.
          </p>

          {/* 30-day goals */}
          <div style={{ borderRadius: 16, padding: 20, marginBottom: 24, background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-soft)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cth-command-cinnabar)', marginBottom: 14 }}>Your 30-Day Goals</p>
            {[
              'Brand Audit completed',
              'Brand Foundation defined',
              'Messaging and audience structured',
              'First offer created',
            ].map((goal) => (
              <div key={goal} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--cth-command-cinnabar)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(248,245,250,0.7)' }}>{goal}</span>
              </div>
            ))}
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '12px 18px', background: 'var(--cth-surface-raised-strong)', border: '1px solid var(--cth-brand-primary-soft)', marginBottom: 28 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--cth-command-cinnabar)' }}>30</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cth-on-dark)', margin: 0 }}>minutes to your first content</p>
              <p style={{ fontSize: 12, color: 'rgba(248,245,250,0.4)', margin: 0 }}>Five steps. One clear path.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onStart}
              data-testid="onboarding-start-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, fontWeight: 700, color: 'var(--cth-on-dark)', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--cth-brand-primary), var(--cth-command-cinnabar))', fontSize: 14 }}
            >
              Start Quick Start <ArrowRight size={16} />
            </button>
            <button
              onClick={onDismiss}
              data-testid="onboarding-skip-btn"
              style={{ padding: '14px 20px', borderRadius: 12, fontSize: 13, color: 'rgba(248,245,250,0.5)', cursor: 'pointer', background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-soft)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP MODAL ───────────────────────────────────────────────
function StepModal({ steps, progress, currentIdx, onNext, onPrev, onGo, onDismiss }) {
  const step = steps[currentIdx];
  const Icon = step.icon;
  const done = progress[step.id];
  const total = steps.length;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-command-cinnabar), var(--cth-command-muted))' }} />

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '20px 28px 8px' }}>
          {steps.map((s, i) => (
            <div
              key={s.id}
              style={{
                height: 6,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                width: i === currentIdx ? 28 : 6,
                background: progress[s.id] ? 'var(--cth-command-success)' : i === currentIdx ? 'var(--cth-command-cinnabar)' : 'var(--cth-brand-primary-soft)',
              }}
            />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--cth-command-muted)' }}>{currentIdx + 1} of {total}</span>
        </div>

        <div style={{ padding: '16px 28px 28px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cth-brand-primary-soft)', color: 'var(--cth-command-cinnabar)', flexShrink: 0 }}>
              <Icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cth-command-muted)', margin: 0 }}>Step {currentIdx + 1}</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--cth-on-dark)', margin: 0, lineHeight: 1.25 }}>{step.title}</h2>
            </div>
            {done && <CheckCircle2 size={18} style={{ color: 'var(--cth-command-success)', marginLeft: 'auto', flexShrink: 0 }} />}
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: 'rgba(248,245,250,0.65)', lineHeight: 1.75, marginBottom: 18 }}>{step.description}</p>

          {/* Tip */}
          <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 18, background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-deep)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--cth-command-cinnabar)', margin: '0 0 6px' }}>TIP</p>
            <p style={{ fontSize: 12, color: 'rgba(248,245,250,0.6)', lineHeight: 1.65, margin: 0 }}>{step.tip}</p>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cth-command-cinnabar)' }} />
              <span style={{ fontSize: 12, color: 'rgba(248,245,250,0.5)' }}>{step.minutesEstimate} min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--cth-command-success)' }} />
              <span style={{ fontSize: 12, color: 'rgba(248,245,250,0.5)' }}>{step.successCriteria}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onPrev}
              disabled={currentIdx === 0}
              style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--cth-brand-primary-soft)', background: 'var(--cth-surface-raised)', color: 'var(--cth-command-muted)', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => onGo(step.route)}
              data-testid={`onboarding-step-${step.id}-btn`}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: done ? '1px solid var(--cth-command-success)' : 'none',
                background: done ? 'color-mix(in srgb, var(--cth-command-success) 55%, var(--cth-surface-night))' : 'linear-gradient(135deg, var(--cth-brand-primary), var(--cth-command-cinnabar))',
                color: done ? 'color-mix(in srgb, var(--cth-command-success) 70%, white)' : 'var(--cth-white)',
              }}
            >
              {done ? <><CheckCircle2 size={15} style={{ color: 'var(--cth-command-success)' }} /> Complete — Review Again</> : <>{step.cta} <ArrowRight size={15} /></>}
            </button>

            <button
              onClick={onNext}
              disabled={currentIdx === total - 1}
              style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--cth-brand-primary-soft)', background: 'var(--cth-surface-raised)', color: 'var(--cth-command-muted)', cursor: currentIdx === total - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === total - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <button
              onClick={onDismiss}
              style={{ fontSize: 12, color: 'rgba(248,245,250,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT: OnboardingChecklist ────────────────────────
export function OnboardingChecklist({ metrics, upcomingEvents, userFirstName, userId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showStep, setShowStep] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const STORAGE_KEY = `cth-onboarding-dismissed-${userId || 'anon'}`;

  useEffect(() => {
    if (!userId) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show welcome modal after short delay on first visit
      const t = setTimeout(() => setShowWelcome(true), 1200);
      return () => clearTimeout(t);
    }
  }, [userId]);

  const progress = calcProgress(metrics);

  const completed = STEPS.filter((s) => progress[s.id]).length;
  const total = STEPS.length;
  const pct = Math.round((completed / total) * 100);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcome(false);
    setShowStep(false);
  };

  const handleGo = (route) => {
    dismiss();
    navigate(route);
  };

  const handleStart = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcome(false);
    setShowStep(true);
    setCurrentIdx(0);
  };

  // Hide floating button if all complete, or dismissed for this session (mobile X)
  if (pct === 100 || hidden) return null;

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && !showStep && (
        <WelcomeModal
          userFirstName={userFirstName || 'there'}
          onStart={() => handleStart()}
          onDismiss={dismiss}
        />
      )}

      {/* Step Modal */}
      {showStep && !showWelcome && (
        <StepModal
          steps={STEPS}
          progress={progress}
          currentIdx={currentIdx}
          onNext={() => setCurrentIdx(i => Math.min(i + 1, STEPS.length - 1))}
          onPrev={() => setCurrentIdx(i => Math.max(i - 1, 0))}
          onGo={handleGo}
          onDismiss={() => { dismiss(); setShowStep(false); }}
        />
      )}

      {/* Floating Widget */}
      <div style={{ position: 'fixed', zIndex: 8000, ...(isMobile
        ? { top: '50%', right: 8, transform: 'translateY(-50%)' }
        : { bottom: 72, right: 24 }) }}>
        {open ? (
          <div
            data-testid="onboarding-checklist-panel"
            style={{
              width: isMobile ? 'min(300px, calc(100vw - 24px))' : 300,
              borderRadius: 20,
              ...(isMobile
                ? { overflowX: 'hidden', overflowY: 'auto', maxHeight: '80dvh' }
                : { overflow: 'hidden' }),
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              background: 'var(--cth-surface-deep)',
              border: '1px solid var(--cth-brand-primary-soft)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--cth-surface-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={16} style={{ color: 'var(--cth-command-cinnabar)' }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cth-on-dark)' }}>Your Quick Start</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,245,250,0.5)', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '14px 18px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(248,245,250,0.5)' }}>{completed} of {total} complete</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cth-command-cinnabar)' }}>{pct}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--cth-brand-primary-soft)' }}>
                <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.5s ease', width: `${pct}%`, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-command-cinnabar))' }} />
              </div>
            </div>

            {/* Steps list */}
            <div style={{ padding: '8px 10px 10px' }}>
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done = progress[step.id];
                return (
                  <button
                    key={step.id}
                    data-testid={`checklist-step-${step.id}`}
                    onClick={() => {
                      if (!done) {
                        setCurrentIdx(i);
                        setShowStep(true);
                        setOpen(false);
                      }
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                      marginBottom: 4, border: done ? '1px solid transparent' : '1px solid var(--cth-brand-primary-soft)',
                      background: done ? 'transparent' : 'var(--cth-surface-raised)',
                      opacity: done ? 0.5 : 1, cursor: done ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {done
                        ? <CheckCircle2 size={15} style={{ color: 'var(--cth-command-success)' }} />
                        : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--cth-command-cinnabar)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--cth-on-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(248,245,250,0.4)', margin: 0 }}>{step.minutesEstimate} min · {step.successCriteria}</p>
                    </div>
                    {!done && <ChevronRight size={13} style={{ color: 'rgba(248,245,250,0.3)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* View guide link */}
            <div style={{ padding: '0 10px 12px' }}>
              <button
                onClick={() => { setCurrentIdx(0); setShowStep(true); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, fontSize: 12, color: 'var(--cth-command-muted)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)', cursor: 'pointer' }}
              >
                <FileText size={12} />
                View Step-by-Step Guide
              </button>
            </div>
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setHidden(true)}
              aria-label="Hide Quick Start"
              style={{
                width: 28, height: 28, padding: 0, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 99,
                border: '1px solid var(--cth-brand-primary-soft)', background: 'var(--cth-surface-deep)',
                color: 'var(--cth-on-dark)', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
            <button
              data-testid="onboarding-checklist-toggle"
              onClick={() => setOpen(true)}
              aria-label={`Quick Start, ${pct}% complete`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                width: 52, height: 52, padding: 0, flexShrink: 0, borderRadius: 99,
                fontWeight: 800, color: 'var(--cth-on-dark)',
                cursor: 'pointer', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                background: 'linear-gradient(135deg, var(--cth-surface-strong), var(--cth-brand-primary-deep))',
              }}
            >
              <Trophy size={16} style={{ color: 'var(--cth-command-cinnabar)' }} />
              <span style={{ fontSize: 9, fontWeight: 800 }}>{pct}%</span>
            </button>
          </div>
        ) : (
          <button
            data-testid="onboarding-checklist-toggle"
            onClick={() => setOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              borderRadius: 99, fontWeight: 700, fontSize: 13, color: 'var(--cth-on-dark)',
              cursor: 'pointer', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              background: 'linear-gradient(135deg, var(--cth-surface-strong), var(--cth-brand-primary-deep))',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(175,0,36,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'; }}
          >
            <Trophy size={15} style={{ color: 'var(--cth-command-cinnabar)' }} />
            <span>Quick Start</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 800, background: 'var(--cth-command-cinnabar)', color: 'var(--cth-on-dark)' }}>{pct}%</span>
          </button>
        )}
      </div>
    </>
  );
}

export default OnboardingChecklist;
