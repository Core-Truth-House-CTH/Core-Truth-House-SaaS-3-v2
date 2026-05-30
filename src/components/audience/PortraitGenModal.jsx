import React from "react";
import { Loader2, Wand2, X } from "lucide-react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

/**
 * Controlled portrait-generation dialog.
 *
 * Step 1 (draft) and the model list are fetched by the parent (Audience) and
 * passed in. The user edits the prompt and picks a model, then Generate hands
 * (prompt, modelId) back to the parent, which closes the modal and drives the
 * card's generating state.
 */
export default function PortraitGenModal({
  avatar,
  models = [],
  prompt,
  onPromptChange,
  modelId,
  onModelChange,
  loading = false,
  onGenerate,
  onClose,
}) {
  if (!avatar) return null;

  const canGenerate = !loading && prompt.trim().length > 0 && !!modelId;
  const isRegenerate = !!avatar.portrait_image_url;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 0, 16, 0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generate portrait"
        style={{
          background: "var(--cth-command-panel)",
          border: "0.5px solid var(--cth-command-border)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          fontFamily: SANS,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 18px", borderBottom: "0.5px solid var(--cth-command-border)" }}
        >
          <div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 18,
                fontWeight: 500,
                color: "var(--cth-command-ink)",
                lineHeight: 1.2,
              }}
            >
              {isRegenerate ? "Regenerate portrait" : "Generate portrait with Zuri"}
            </div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              {avatar.name || "Untitled avatar"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--cth-command-muted)",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Prompt */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--cth-command-muted)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Portrait prompt
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                disabled={loading}
                placeholder={loading ? "Zuri is drafting a prompt…" : "Describe the portrait…"}
                rows={5}
                style={{
                  width: "100%",
                  resize: "vertical",
                  background:
                    "color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--cth-command-ink)",
                  outline: "none",
                  minHeight: 96,
                  opacity: loading ? 0.6 : 1,
                }}
              />
              {loading && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 12,
                    fontSize: 12,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  Drafting…
                </div>
              )}
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--cth-command-muted)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Image model
            </label>
            <select
              value={modelId}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={loading || models.length === 0}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "0.5px solid var(--cth-command-border)",
                borderRadius: 8,
                background: "var(--cth-command-panel)",
                color: "var(--cth-command-ink)",
                fontSize: 13,
                fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              {models.length === 0 ? (
                <option value="">{loading ? "Loading models…" : "No models available"}</option>
              ) : (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              )}
            </select>
            {(() => {
              const selected = models.find((m) => m.id === modelId);
              return selected?.description ? (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--cth-command-muted)",
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {selected.description}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3"
          style={{ padding: "14px 18px", borderTop: "0.5px solid var(--cth-command-border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: "var(--cth-command-muted)",
              background: "var(--cth-command-panel)",
              border: "0.5px solid var(--cth-command-border)",
              borderRadius: 7,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canGenerate && onGenerate(prompt, modelId)}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5"
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              background: "var(--cth-command-crimson)",
              border: "none",
              borderRadius: 7,
              padding: "8px 18px",
              cursor: canGenerate ? "pointer" : "not-allowed",
              opacity: canGenerate ? 1 : 0.5,
            }}
          >
            <Wand2 size={13} />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
