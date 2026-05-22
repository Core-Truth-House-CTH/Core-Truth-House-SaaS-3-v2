import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const RADIO_QUESTIONS = [
  {
    key: "business_duration",
    section: "qualify",
    label: "How long have you been running your current business?",
    options: ["Under 2 years", "2 to 3 years", "3 to 7 years", "7 or more years"],
  },
  {
    key: "revenue_range",
    section: "qualify",
    label: "What is your approximate revenue in the last 12 months?",
    options: [
      "Under $50k",
      "$50k to $150k",
      "$150k to $500k",
      "$500k or more",
      "Prefer not to say",
    ],
  },
  {
    key: "business_type",
    section: "qualify",
    label: "Which best describes your business?",
    options: [
      "Solo service provider",
      "Solo with contractors",
      "Team of 2 to 5",
      "Team of 6 or more",
    ],
  },
  {
    key: "content_frequency",
    section: "qualify",
    label: "How often are you currently publishing content for your brand?",
    options: ["Rarely", "Monthly", "Weekly", "Multiple times per week", "Daily"],
  },
];

const TRIED_BEFORE_OPTIONS = [
  "Courses",
  "Coaches",
  "Rebrand",
  "Copywriter",
  "DIY",
  "Nothing yet",
];

const COMMITMENT_OPTIONS = [
  "Yes, I can commit to all four",
  "I can make most but not all",
  "I need to check my schedule",
];

const REFERRAL_OPTIONS = [
  "Yes, that is a fair exchange",
  "I need more information",
  "No",
];

const initialAnswers = {
  business_duration: "",
  revenue_range: "",
  business_type: "",
  content_frequency: "",
  one_sentence_pitch: "",
  common_objection: "",
  target_client: "",
  tried_before: [],
  success_definition: "",
  session_commitment: "",
  referral_comfort: "",
  why_now: "",
};

function SectionLabel({ children }) {
  return <p className="cth-apply-section-label">{children}</p>;
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="cth-apply-field-label">
      {children}
      {required ? <span aria-hidden="true"> *</span> : null}
    </label>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div className="cth-apply-radio-group" role="radiogroup">
      {options.map((opt) => {
        const checked = value === opt;
        return (
          <label key={opt} className={`cth-apply-radio ${checked ? "checked" : ""}`}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={checked}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxGroup({ options, values, onToggle }) {
  return (
    <div className="cth-apply-check-group">
      {options.map((opt) => {
        const checked = values.includes(opt);
        return (
          <label key={opt} className={`cth-apply-check ${checked ? "checked" : ""}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function SuccessState() {
  return (
    <div className="cth-apply-success">
      <p className="cth-apply-eyebrow">Thank you</p>
      <h2>Application received.</h2>
      <p className="cth-apply-success-body">
        We review every application by hand. You will hear from us within 48 hours. Check your inbox for a confirmation.
      </p>
      <Link to="/" className="cth-apply-btn cth-apply-btn-primary">
        Back to Core Truth House
      </Link>
    </div>
  );
}

export default function CohortApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState(initialAnswers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTriedBefore(opt) {
    setAnswers((prev) => {
      const current = prev.tried_before;
      const next = current.includes(opt)
        ? current.filter((v) => v !== opt)
        : [...current, opt];
      return { ...prev, tried_before: next };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cohort/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          answers,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || payload.message || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cth-apply-page">
      <PublicHeader active="cohort" />

      <section className="cth-apply-section">
        <div className="cth-apply-shell">
          {submitted ? (
            <SuccessState />
          ) : (
            <>
              <header className="cth-apply-intro">
                <p className="cth-apply-eyebrow">The Core Truth Cohort</p>
                <h1>Apply for Your Seat</h1>
                <p className="cth-apply-sub">
                  Applications are reviewed by hand. We admit 8 founders per cohort. Tell us about where you are and what you are building.
                </p>
                <div className="cth-apply-badges">
                  <span className="cth-apply-badge cth-apply-badge-founding">Founding: $497</span>
                  <span className="cth-apply-badge cth-apply-badge-standard">Standard: $997</span>
                </div>
              </header>

              <form className="cth-apply-form" onSubmit={handleSubmit} noValidate>
                <div className="cth-apply-row">
                  <div className="cth-apply-field">
                    <FieldLabel required>Name</FieldLabel>
                    <input
                      className="cth-apply-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="cth-apply-field">
                    <FieldLabel required>Email</FieldLabel>
                    <input
                      className="cth-apply-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <SectionLabel>Qualify</SectionLabel>

                {RADIO_QUESTIONS.filter((q) => q.section === "qualify").map((q) => (
                  <div key={q.key} className="cth-apply-field">
                    <FieldLabel>{q.label}</FieldLabel>
                    <RadioGroup
                      name={q.key}
                      options={q.options}
                      value={answers[q.key]}
                      onChange={(v) => setAnswer(q.key, v)}
                    />
                  </div>
                ))}

                <SectionLabel>Your Situation</SectionLabel>

                <div className="cth-apply-field">
                  <FieldLabel>In one sentence, how do you currently explain what you do?</FieldLabel>
                  <input
                    className="cth-apply-input"
                    type="text"
                    value={answers.one_sentence_pitch}
                    onChange={(e) => setAnswer("one_sentence_pitch", e.target.value)}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>What is the most common objection you hear right before someone does not buy?</FieldLabel>
                  <input
                    className="cth-apply-input"
                    type="text"
                    value={answers.common_objection}
                    onChange={(e) => setAnswer("common_objection", e.target.value)}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>Who are you trying to reach? Describe them as a single person.</FieldLabel>
                  <input
                    className="cth-apply-input"
                    type="text"
                    value={answers.target_client}
                    onChange={(e) => setAnswer("target_client", e.target.value)}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>What have you already tried to fix your positioning?</FieldLabel>
                  <CheckboxGroup
                    options={TRIED_BEFORE_OPTIONS}
                    values={answers.tried_before}
                    onToggle={toggleTriedBefore}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>What would need to be true 90 days from now for this to have been worth it?</FieldLabel>
                  <textarea
                    className="cth-apply-textarea"
                    rows={4}
                    value={answers.success_definition}
                    onChange={(e) => setAnswer("success_definition", e.target.value)}
                  />
                </div>

                <SectionLabel>Commitment</SectionLabel>

                <div className="cth-apply-field">
                  <FieldLabel>
                    The cohort requires four live sessions across 14 days plus 4 to 6 hours of async work. Can you commit?
                  </FieldLabel>
                  <RadioGroup
                    name="session_commitment"
                    options={COMMITMENT_OPTIONS}
                    value={answers.session_commitment}
                    onChange={(v) => setAnswer("session_commitment", v)}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>
                    Founding members receive lifetime Estate access to Core Truth House OS. In exchange, we ask for one referral of a qualified founder to a future cohort. Are you comfortable with that?
                  </FieldLabel>
                  <RadioGroup
                    name="referral_comfort"
                    options={REFERRAL_OPTIONS}
                    value={answers.referral_comfort}
                    onChange={(v) => setAnswer("referral_comfort", v)}
                  />
                </div>

                <div className="cth-apply-field">
                  <FieldLabel>Why now? What changed that made you look for this?</FieldLabel>
                  <textarea
                    className="cth-apply-textarea"
                    rows={4}
                    value={answers.why_now}
                    onChange={(e) => setAnswer("why_now", e.target.value)}
                  />
                </div>

                {error ? <p className="cth-apply-error">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="cth-apply-btn cth-apply-btn-primary cth-apply-btn-block"
                >
                  {loading ? (
                    <span className="cth-apply-spinner" aria-hidden="true" />
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <PublicFooter />

      <style>{`
        .cth-apply-page {
          background: #f8f4f2;
          color: #2b1040;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        .cth-apply-section {
          padding: 96px 0 120px;
        }

        .cth-apply-shell {
          width: min(760px, calc(100vw - 48px));
          margin: 0 auto;
        }

        .cth-apply-eyebrow {
          margin: 0 0 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #af0024;
        }

        .cth-apply-intro {
          text-align: center;
          margin-bottom: 48px;
        }

        .cth-apply-intro h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          line-height: 1.1;
          color: #2b1040;
          margin: 0 0 16px;
          font-weight: 700;
        }

        .cth-apply-sub {
          font-size: 16px;
          line-height: 1.65;
          color: #4a3b4a;
          margin: 0 0 22px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cth-apply-badges {
          display: inline-flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cth-apply-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .cth-apply-badge-founding {
          background: #6b0f1a;
          color: #c4a95b;
          border: 1px solid #6b0f1a;
        }

        .cth-apply-badge-standard {
          background: transparent;
          color: #2b1040;
          border: 1px solid #2b1040;
        }

        .cth-apply-form {
          background: #ffffff;
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 8px;
          padding: 40px;
        }

        .cth-apply-section-label {
          margin: 36px 0 22px;
          padding-top: 22px;
          border-top: 1px solid rgba(216, 197, 195, 0.7);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 800;
          color: #af0024;
        }

        .cth-apply-form > .cth-apply-section-label:first-of-type {
          margin-top: 28px;
        }

        .cth-apply-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .cth-apply-field {
          margin-bottom: 22px;
        }

        .cth-apply-field-label {
          display: block;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #2b1040;
          line-height: 1.4;
        }

        .cth-apply-field-label span {
          color: #af0024;
        }

        .cth-apply-input,
        .cth-apply-textarea {
          width: 100%;
          min-height: 46px;
          padding: 12px 14px;
          border: 1px solid rgba(216, 197, 195, 0.9);
          border-radius: 4px;
          background: #fff;
          color: #2b1040;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.5;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }

        .cth-apply-textarea {
          resize: vertical;
        }

        .cth-apply-input:focus,
        .cth-apply-textarea:focus {
          border-color: #af0024;
          box-shadow: 0 0 0 3px rgba(175, 0, 36, 0.12);
        }

        .cth-apply-radio-group,
        .cth-apply-check-group {
          display: grid;
          gap: 8px;
        }

        .cth-apply-radio,
        .cth-apply-check {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 4px;
          background: #fff;
          font-size: 14.5px;
          color: #2b1040;
          cursor: pointer;
          transition: border-color 180ms ease, background 180ms ease;
        }

        .cth-apply-radio:hover,
        .cth-apply-check:hover {
          border-color: #af0024;
        }

        .cth-apply-radio.checked,
        .cth-apply-check.checked {
          border-color: #af0024;
          background: rgba(175, 0, 36, 0.04);
        }

        .cth-apply-radio input,
        .cth-apply-check input {
          accent-color: #af0024;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .cth-apply-error {
          margin: 0 0 16px;
          padding: 12px 14px;
          border-radius: 4px;
          background: rgba(175, 0, 36, 0.08);
          border: 1px solid rgba(175, 0, 36, 0.32);
          color: #af0024;
          font-size: 14px;
        }

        .cth-apply-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          padding: 0 26px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          border: 0;
          transition: background 180ms ease, transform 180ms ease;
        }

        .cth-apply-btn-primary {
          background: #af0024;
          color: #fff;
          box-shadow: 0 16px 32px rgba(175, 0, 36, 0.22);
        }

        .cth-apply-btn-primary:hover {
          background: #8e001d;
          transform: translateY(-1px);
        }

        .cth-apply-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .cth-apply-btn-block {
          width: 100%;
          margin-top: 8px;
        }

        .cth-apply-spinner {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          animation: cth-apply-spin 800ms linear infinite;
          display: inline-block;
        }

        @keyframes cth-apply-spin {
          to { transform: rotate(360deg); }
        }

        .cth-apply-success {
          background: #ffffff;
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 8px;
          padding: 56px 40px;
          text-align: center;
        }

        .cth-apply-success h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 3.6vw, 2.8rem);
          line-height: 1.15;
          color: #2b1040;
          margin: 0 0 18px;
          font-weight: 700;
        }

        .cth-apply-success-body {
          font-size: 16px;
          line-height: 1.7;
          color: #4a3b4a;
          margin: 0 auto 32px;
          max-width: 480px;
        }

        @media (max-width: 640px) {
          .cth-apply-section {
            padding: 72px 0 96px;
          }

          .cth-apply-form,
          .cth-apply-success {
            padding: 28px 20px;
          }

          .cth-apply-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
