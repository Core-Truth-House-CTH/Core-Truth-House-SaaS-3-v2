import React from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

import { classifyApiError, CS_ERROR } from "../utilities/errors";

/**
 * Shared loading / empty / error / permission states.
 *
 * All of them announce themselves to assistive tech: loading uses
 * role="status" with aria-live, errors use role="alert".
 */

export function LoadingState({ label = "Loading", rows = 3 }) {
  return (
    <div role="status" aria-live="polite" style={{ padding: "8px 0" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "var(--cs-ruby)",
          marginBottom: 14,
        }}
      >
        <Loader2 size={14} aria-hidden="true" style={{ animation: "spin 0.9s linear infinite" }} />
        {label}…
      </span>
      <div aria-hidden="true" style={{ display: "grid", gap: 10 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            style={{
              height: 64,
              borderRadius: "var(--cs-radius)",
              background:
                "linear-gradient(90deg, var(--cs-blush) 0%, var(--cs-panel) 50%, var(--cs-blush) 100%)",
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action = null, icon: Icon = Inbox }) {
  return (
    <div
      className="cs-card"
      style={{
        padding: "44px 28px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Icon size={26} aria-hidden="true" style={{ color: "var(--cs-tuscany)" }} />
      <h3 className="cs-h2" style={{ fontSize: 19 }}>
        {title}
      </h3>
      {description ? (
        <p style={{ fontSize: 13, color: "var(--cs-ruby)", maxWidth: 420, margin: 0 }}>{description}</p>
      ) : null}
      {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
    </div>
  );
}

/**
 * Renders an API failure with copy matched to its classification. Retry is
 * offered only when the classifier says the failure is retryable — a 402 or
 * 403 will never show a Retry button, because retrying cannot help.
 */
export function ErrorState({ error, onRetry = null, compact = false }) {
  const classified = error?.kind ? error : classifyApiError(error);
  const canRetry = Boolean(onRetry) && classified.retryable !== false;

  return (
    <div
      role="alert"
      className="cs-card"
      style={{
        padding: compact ? "14px 16px" : "26px 22px",
        borderColor: "rgba(164, 35, 44, 0.28)",
        background: "rgba(164, 35, 44, 0.04)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <AlertCircle size={17} aria-hidden="true" style={{ color: "var(--cs-status-error)", flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--cs-ink)" }}>
          {classified.title || "Something went wrong"}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cs-ruby)" }}>{classified.message}</p>
        {canRetry ? (
          <button type="button" className="cs-btn cs-btn-secondary" style={{ marginTop: 12 }} onClick={onRetry}>
            <RefreshCw size={13} aria-hidden="true" />
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Explains why a control is unavailable to this user. Used next to disabled
 * delete buttons so the restriction is legible rather than mysterious.
 */
export function PermissionNotice({ reason }) {
  if (!reason) return null;
  return (
    <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--cs-ruby)" }}>{reason}</p>
  );
}

export default { LoadingState, EmptyState, ErrorState, PermissionNotice };
