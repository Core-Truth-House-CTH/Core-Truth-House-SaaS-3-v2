import React from "react";
import { Lock, Sparkles } from "lucide-react";

import { useContentStudio } from "../context/ContentStudioProvider";

/**
 * Wraps creation/mutation UI.
 *
 * Three distinct outcomes, matching the backend exactly:
 *   - not Estate            -> plan requirement (the 403 case)
 *   - Estate, no trial/addon-> trial or add-on activation (the 402 case)
 *   - entitled              -> children render
 *
 * `mode="inline"` renders a compact notice for use beside a control;
 * `mode="block"` renders the full panel used on creation pages.
 */
export default function EstateGate({ children, feature = "This feature", mode = "block" }) {
  const { isEstate, canCreate, trialAvailable, activateTrial, trialPending, daysRemaining, trialActive } =
    useContentStudio();

  if (canCreate) return children;

  const isPlanProblem = !isEstate;

  const title = isPlanProblem ? "Estate plan required" : "Agents & Automations add-on required";

  const body = isPlanProblem
    ? `${feature} is part of the Estate plan. Upgrade to unlock custom agents, automations, storyboards, and edit requests.`
    : `${feature} needs an active trial or the Agents & Automations add-on. Start your 7-day trial to continue.`;

  if (mode === "inline") {
    return (
      <div
        className="cs-card"
        style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}
      >
        <Lock size={14} aria-hidden="true" style={{ color: "var(--cs-ruby)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--cs-ruby)" }}>{title}</span>
      </div>
    );
  }

  return (
    <section
      className="cs-card"
      aria-labelledby="cs-gate-title"
      style={{ padding: "34px 28px", maxWidth: 560 }}
    >
      <span className="cs-badge cs-badge-gold" style={{ marginBottom: 14 }}>
        <Sparkles size={11} aria-hidden="true" />
        Estate tier only
      </span>

      <h2 id="cs-gate-title" className="cs-h2" style={{ marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13.5, color: "var(--cs-ruby)", lineHeight: 1.6, margin: 0 }}>{body}</p>

      {trialActive ? (
        <p style={{ fontSize: 12, color: "var(--cs-ruby)", marginTop: 12 }}>
          Trial active — {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left.
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
        {!isPlanProblem && trialAvailable ? (
          <button
            type="button"
            className="cs-btn cs-btn-primary"
            onClick={activateTrial}
            disabled={trialPending}
          >
            {trialPending ? "Starting…" : "Start 7-day trial"}
          </button>
        ) : null}

        <a className="cs-btn cs-btn-secondary" href="/billing">
          {isPlanProblem ? "View plans" : "Add the add-on"}
        </a>
      </div>
    </section>
  );
}
