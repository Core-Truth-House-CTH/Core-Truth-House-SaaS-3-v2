import React, { useId } from "react";
import { Check } from "lucide-react";

/**
 * Small presentational primitives shared across Content Studio screens.
 * Kept together so each screen stays readable rather than re-declaring these.
 */

/* ---------------- Page header ---------------- */

export function PageHeader({ title, subtitle, actions = null, eyebrow = null }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        marginBottom: 26,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow ? (
          <span className="cs-badge cs-badge-gold" style={{ marginBottom: 10 }}>
            {eyebrow}
          </span>
        ) : null}
        <h1 className="cs-title">{title}</h1>
        {subtitle ? <p className="cs-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div> : null}
    </header>
  );
}

/* ---------------- Filter tabs ---------------- */

/**
 * Keyboard-operable tab list. Arrow keys move between tabs, matching the
 * WAI-ARIA tabs pattern. Scrolls horizontally on narrow screens instead of
 * wrapping into an unreadable stack.
 */
export function FilterTabs({ tabs, value, onChange, label = "Filter" }) {
  const handleKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + direction + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    const nodes = event.currentTarget.parentNode.querySelectorAll("[role='tab']");
    nodes[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="cs-scroll-x"
      style={{ display: "flex", gap: 6, paddingBottom: 4, marginBottom: 18 }}
    >
      {tabs.map((tab, index) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={{
              flexShrink: 0,
              minHeight: 32,
              padding: "0 14px",
              borderRadius: "var(--cs-radius-pill)",
              border: `1px solid ${active ? "var(--cs-crimson)" : "var(--cs-border)"}`,
              background: active ? "var(--cs-crimson)" : "var(--cs-panel)",
              color: active ? "#fff" : "var(--cs-ruby)",
              fontSize: 12,
              fontWeight: active ? 500 : 400,
              fontFamily: "var(--cs-sans)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Stat card ---------------- */

/**
 * A single dashboard metric.
 *
 * `value === null` renders an explicit unavailable state rather than a zero,
 * because "we cannot compute this" and "this is zero" are different facts and
 * the design's sample numbers must never be faked.
 */
export function StatCard({ label, value, hint = null, unavailable = false }) {
  return (
    <div className="cs-card cs-card-pad">
      <p className="cs-h3" style={{ marginBottom: 10 }}>
        {label}
      </p>
      {unavailable || value === null || value === undefined ? (
        <>
          <p style={{ fontFamily: "var(--cs-serif)", fontSize: 24, margin: 0, color: "var(--cs-tuscany)" }}>
            —
          </p>
          <p style={{ fontSize: 11, color: "var(--cs-tuscany)", margin: "4px 0 0" }}>
            Not yet measured
          </p>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "var(--cs-serif)", fontSize: 30, margin: 0, color: "var(--cs-ink)", lineHeight: 1.1 }}>
            {value}
          </p>
          {hint ? (
            <p style={{ fontSize: 11.5, color: "var(--cs-ruby)", margin: "4px 0 0" }}>{hint}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------- Status badge ---------------- */

const STATUS_TONES = {
  active: "var(--cs-status-active)",
  ready: "var(--cs-status-active)",
  paused: "var(--cs-status-paused)",
  draft: "var(--cs-tuscany)",
  queued: "var(--cs-gold)",
  exported: "var(--cs-ruby)",
  success: "var(--cs-status-active)",
};

export function StatusBadge({ status }) {
  const key = String(status || "draft").toLowerCase();
  const tone = STATUS_TONES[key] || "var(--cs-tuscany)";
  return (
    <span className="cs-badge">
      <span className="cs-dot" style={{ background: tone }} aria-hidden="true" />
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}

/* ---------------- Field ---------------- */

export function Field({ label, error, children, hint, required = false }) {
  const id = useId();
  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
      })
    : children;

  return (
    <div className="cs-field">
      <label className="cs-label" htmlFor={child?.props?.id || id}>
        {label}
        {required ? <span aria-hidden="true" style={{ color: "var(--cs-crimson)" }}> *</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {child}
      {hint && !error ? (
        <span id={`${id}-hint`} style={{ display: "block", fontSize: 11.5, color: "var(--cs-tuscany)", marginTop: 5 }}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="cs-error-text" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        background: "none",
        border: 0,
        cursor: "pointer",
        padding: 4,
        fontFamily: "var(--cs-sans)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 34,
          height: 19,
          borderRadius: 999,
          background: checked ? "var(--cs-crimson)" : "var(--cs-tuscany)",
          position: "relative",
          transition: "background 140ms ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 17 : 2,
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 140ms ease",
            display: "grid",
            placeItems: "center",
          }}
        >
          {checked ? <Check size={9} style={{ color: "var(--cs-crimson)" }} /> : null}
        </span>
      </span>
      <span style={{ fontSize: 12.5, color: "var(--cs-ink)" }}>{label}</span>
    </button>
  );
}

export default { PageHeader, FilterTabs, StatCard, StatusBadge, Field, Toggle };
