import React from "react";
import { Sparkles } from "lucide-react";

import { useContentStudio } from "../context/ContentStudioProvider";

/**
 * The dashboard trial / add-on panel from approved screen 1.
 *
 * The countdown renders only when the backend actually returned trial data —
 * never a hardcoded "7 days left".
 */
export default function TrialPanel() {
  const {
    entitlement,
    isEstate,
    trialActive,
    addOnActive,
    daysRemaining,
    trialAvailable,
    activateTrial,
    trialPending,
    trialNotice,
    dismissTrialNotice,
  } = useContentStudio();

  const hasTrialRecord = Boolean(entitlement?.trial_ends_at);

  let heading = "Agents & Automations";
  let detail = "Custom agents, automations, storyboards, and edit requests.";
  let statusLine = null;

  if (addOnActive) {
    heading = "Agents & Automations Add-On";
    statusLine = "Active";
    detail = "Unlimited custom agents and automations for this workspace.";
  } else if (trialActive && hasTrialRecord) {
    heading = "Agents & Automations Trial";
    statusLine = `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`;
    detail = "Unlock unlimited agents & automations.";
  } else if (hasTrialRecord) {
    heading = "Trial ended";
    detail = "Add the Agents & Automations add-on to keep creating.";
  } else if (!isEstate) {
    heading = "Estate plan required";
    detail = "Custom agents and automations are part of the Estate plan.";
  }

  return (
    <aside
      className="cs-card"
      aria-labelledby="cs-trial-heading"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} aria-hidden="true" style={{ color: "var(--cs-gold)" }} />
        <h2 id="cs-trial-heading" style={{ fontSize: 12.5, fontWeight: 500, margin: 0, color: "var(--cs-ink)" }}>
          {heading}
        </h2>
      </div>

      {statusLine ? (
        <p style={{ fontSize: 20, fontFamily: "var(--cs-serif)", margin: 0, color: "var(--cs-ink)" }}>
          {statusLine}
        </p>
      ) : null}

      <p style={{ fontSize: 12.5, color: "var(--cs-ruby)", margin: 0, lineHeight: 1.55 }}>{detail}</p>

      {trialNotice ? (
        <p
          role="status"
          style={{
            fontSize: 12,
            margin: 0,
            color: trialNotice.tone === "error" ? "var(--cs-status-error)" : "var(--cs-ruby)",
          }}
          onAnimationEnd={dismissTrialNotice}
        >
          {trialNotice.message}
        </p>
      ) : null}

      {trialAvailable && !addOnActive ? (
        <button
          type="button"
          className="cs-btn cs-btn-primary"
          style={{ width: "100%", marginTop: 4 }}
          onClick={activateTrial}
          disabled={trialPending}
        >
          {trialPending ? "Starting trial…" : "Start 7-day trial"}
        </button>
      ) : (
        <a className="cs-btn cs-btn-primary" style={{ width: "100%", marginTop: 4 }} href="/billing">
          {addOnActive ? "Manage add-on" : "Upgrade Add-On"}
        </a>
      )}
    </aside>
  );
}
