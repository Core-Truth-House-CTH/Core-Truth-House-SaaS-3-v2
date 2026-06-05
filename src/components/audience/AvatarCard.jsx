import React, { useRef, useState } from "react";
import { RefreshCw, Trash2, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import apiClient from "../../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const STAGE_LABELS = {
  unaware: "Unaware",
  problem_aware: "Problem Aware",
  solution_aware: "Solution Aware",
  product_aware: "Product Aware",
  most_aware: "Most Aware",
};

const STAGE_BADGE_STYLE = {
  fontFamily: SANS,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 500,
  padding: "3px 8px",
  borderRadius: 20,
  background: "rgba(0,0,0,0.45)",
  color: "rgba(255,255,255,0.9)",
  whiteSpace: "nowrap",
};

const PRIMARY_BADGE_STYLE = {
  fontFamily: SANS,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 500,
  padding: "3px 8px",
  borderRadius: 20,
  background: "var(--cth-command-crimson)",
  color: "#f5e0e0",
  whiteSpace: "nowrap",
};

const FOOTER_BTN = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 500,
  color: "var(--cth-command-ink)",
  background: "var(--cth-command-panel)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
};

function ImageHeader({ avatar, isGenerating, isUploading, onGenerate, onUploadClick, onView }) {
  const stageLabel = STAGE_LABELS[avatar.stage] || avatar.stage || "Unstaged";
  const src = avatar.portrait_image_url
    ? apiClient.buildApiUrl(avatar.portrait_image_url)
    : null;
  const busy = isGenerating || isUploading;

  return (
    <div
      style={{
        width: "100%",
        height: 120,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {busy ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "#1a0828",
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {isUploading ? "Uploading your photo" : "Zuri is generating your portrait"}
          </div>
          <div
            style={{
              width: 80,
              height: 2,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "60%",
                background: "var(--cth-command-crimson)",
                borderRadius: 2,
                animation: "cth-portrait-indeterminate 1.1s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      ) : src ? (
        <>
          <img
            src={src}
            alt={avatar.name || "Avatar portrait"}
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView();
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              cursor: "zoom-in",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onUploadClick) onUploadClick();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: SANS,
                fontSize: 9,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.45)",
                border: "none",
                borderRadius: 5,
                padding: "3px 7px",
                cursor: "pointer",
              }}
            >
              <Upload size={10} />
              Upload
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGenerate();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: SANS,
                fontSize: 9,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.45)",
                border: "none",
                borderRadius: 5,
                padding: "3px 7px",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={10} />
              Regenerate
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "#1a0828",
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            No portrait yet
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGenerate();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(224,78,53,0.85)",
                background: "transparent",
                border: "0.5px solid rgba(224,78,53,0.4)",
                borderRadius: 5,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <Wand2 size={11} />
              Generate with Zuri
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onUploadClick) onUploadClick();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                background: "transparent",
                border: "0.5px solid rgba(255,255,255,0.25)",
                borderRadius: 5,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <Upload size={11} />
              Upload photo
            </button>
          </div>
        </div>
      )}

      {/* Overlaid badges */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
        }}
      >
        <span style={STAGE_BADGE_STYLE}>{stageLabel}</span>
        {avatar.is_primary ? <span style={PRIMARY_BADGE_STYLE}>Primary</span> : <span />}
      </div>
    </div>
  );
}

export default function AvatarCard({
  avatar,
  onOpen,
  onEdit,
  onDelete,
  onSetPrimary,
  onGeneratePortrait,
  onUploadPortrait,
  isGenerating = false,
  isUploading = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef(null);
  if (!avatar) return null;

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("That image is larger than 5MB.");
      return;
    }
    if (onUploadPortrait) onUploadPortrait(avatar, file);
  };

  const portraitFullUrl = avatar.portrait_image_url
    ? apiClient.buildApiUrl(avatar.portrait_image_url)
    : null;

  const description =
    (typeof avatar.description === "string" && avatar.description.trim()) ||
    (typeof avatar.primary_problem === "string" && avatar.primary_problem.trim()) ||
    "";

  // surface_symptoms may be an array of short tags OR sentence-like phrases
  // (or, for some records, a single string). Show the first 3 entries as-is
  // and truncate each pill to 20 chars so longer phrases stay readable.
  const rawSymptoms = avatar.surface_symptoms;
  const symptomList = Array.isArray(rawSymptoms)
    ? rawSymptoms
    : typeof rawSymptoms === "string"
      ? rawSymptoms.split(/[\n,]+/)
      : [];
  const tags = symptomList
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => (s.length > 20 ? `${s.slice(0, 20).trim()}…` : s));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--cth-command-panel)",
        border: avatar.is_primary
          ? "1px solid var(--cth-command-crimson)"
          : "0.5px solid var(--cth-command-border)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered ? "0 6px 20px rgba(51, 3, 60, 0.10)" : "none",
        transition: "box-shadow 200ms ease",
        fontFamily: SANS,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFilePicked}
      />
      <ImageHeader
        avatar={avatar}
        isGenerating={isGenerating}
        isUploading={isUploading}
        onGenerate={() => onGeneratePortrait && onGeneratePortrait(avatar)}
        onUploadClick={() => fileInputRef.current?.click()}
        onView={() => setLightboxOpen(true)}
      />

      <div
        onClick={() => onOpen && onOpen()}
        style={{ padding: "14px 15px 10px", cursor: onOpen ? "pointer" : "default" }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--cth-command-ink)",
            lineHeight: 1.25,
            marginBottom: 6,
          }}
        >
          {avatar.name || "Untitled avatar"}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: "var(--cth-command-muted)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontStyle: description ? "normal" : "italic",
            opacity: description ? 1 : 0.7,
          }}
        >
          {description || "No primary problem captured yet."}
        </div>
      </div>

      {tags.length > 0 && (
        <div style={{ padding: "0 15px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              style={{
                fontFamily: SANS,
                fontSize: 11,
                padding: "3px 9px",
                borderRadius: 20,
                background:
                  "color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))",
                border: "0.5px solid var(--cth-command-border)",
                color: "var(--cth-command-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          padding: "8px 15px",
          borderTop: "0.5px solid var(--cth-command-border)",
          display: "flex",
          gap: 5,
          marginTop: "auto",
        }}
      >
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{ ...FOOTER_BTN, flex: 1 }}
          >
            Edit
          </button>
        )}
        {onSetPrimary && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
            style={{ ...FOOTER_BTN, color: "var(--cth-command-muted)", background: "transparent" }}
          >
            Set primary
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete avatar"
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: "#b05050",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              padding: "5px 7px",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {lightboxOpen && portraitFullUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(13,0,16,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              borderRadius: 999,
              padding: 6,
              background: "var(--cth-command-panel)",
              color: "var(--cth-command-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
          <img
            src={portraitFullUrl}
            alt={avatar.name || "Avatar portrait"}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "85vh", maxWidth: "90vw", objectFit: "contain", cursor: "default" }}
          />
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--cth-command-panel)", fontFamily: SANS }}>
            {avatar.name || "Avatar portrait"}
          </p>
        </div>
      )}
    </div>
  );
}
