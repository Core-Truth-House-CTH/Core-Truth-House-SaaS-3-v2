import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

/**
 * Deletion confirmation.
 *
 * Radix AlertDialog is already a project dependency and handles focus trapping,
 * Escape, and the aria-modal semantics, so those are not reimplemented here.
 */
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  busy = false,
  title = "Delete this item?",
  description = "This cannot be undone.",
  confirmLabel = "Delete",
  error = null,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13, 0, 16, 0.42)",
            zIndex: 60,
          }}
        />
        <AlertDialog.Content
          className="cth-cs"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "calc(100vw - 32px)",
            maxWidth: 420,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            background: "var(--cs-panel)",
            border: "1px solid var(--cs-border)",
            borderRadius: "var(--cs-radius-lg)",
            padding: 24,
            zIndex: 61,
            boxShadow: "0 20px 60px rgba(13, 0, 16, 0.25)",
          }}
        >
          <AlertDialog.Title
            style={{ fontFamily: "var(--cs-serif)", fontSize: 21, margin: 0, color: "var(--cs-ink)" }}
          >
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{ fontSize: 13, color: "var(--cs-ruby)", margin: "8px 0 0", lineHeight: 1.55 }}
          >
            {description}
          </AlertDialog.Description>

          {error ? (
            <p role="alert" style={{ fontSize: 12.5, color: "var(--cs-status-error)", marginTop: 12 }}>
              {error.message || "That could not be deleted."}
            </p>
          ) : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22, flexWrap: "wrap" }}>
            <AlertDialog.Cancel asChild>
              <button type="button" className="cs-btn cs-btn-secondary" disabled={busy}>
                Cancel
              </button>
            </AlertDialog.Cancel>
            <button
              type="button"
              className="cs-btn cs-btn-primary"
              onClick={onConfirm}
              disabled={busy}
              data-testid="confirm-delete"
            >
              {busy ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
