/**
 * Shared CRM design tokens and primitives.
 *
 * Extracted from CRMSuite.jsx so DetailDrawer can use them without the two
 * modules importing each other. The drawer needs SANS, SERIF, EYEBROW_STYLE,
 * PRIMARY_BUTTON_STYLE, DESTRUCTIVE_OUTLINE_STYLE, currency, formatDate,
 * EmptyValue, Chip, and IconButton -- all of which lived in CRMSuite, so a
 * one-file extraction would have created a cycle. This is that shared layer.
 *
 * Pure move: every value below is byte-identical to its CRMSuite original.
 */

import React, { useState } from "react";

const SANS = "'DM Sans', sans-serif";
// The project's display face is a token (styles/cth-tokens.css). Referencing the
// token rather than hardcoding a face keeps this file from disagreeing with the
// brand when that decision changes.
const SERIF = "var(--font-display)";

const PAGE_STYLE = {
 background: "var(--cth-command-blush)",
 minHeight: "100%",
};

const PANEL_STYLE = {
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 12,
};

const SOFT_PANEL_STYLE = {
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 10,
};

const INPUT_STYLE = {
 width: "100%",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 7,
 padding: "10px 12px",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 outline: "none",
};

const SMALL_INPUT_STYLE = {
 ...INPUT_STYLE,
 padding: "8px 12px",
 fontSize: 13,
};

const PRIMARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 7,
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 7,
 background: "transparent",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 cursor: "pointer",
};

const DESTRUCTIVE_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 7,
 background: "var(--cth-command-crimson)",
 color: "var(--cth-command-ivory)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const DESTRUCTIVE_OUTLINE_STYLE = {
 ...SECONDARY_BUTTON_STYLE,
 color: "var(--cth-command-crimson)",
 border: "1px solid var(--cth-command-crimson)",
};

const EYEBROW_STYLE = {
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-command-muted)",
};

function currency(value) {
 const amount = Number(value || 0);
 return amount.toLocaleString("en-US", {
 style: "currency",
 currency: "USD",
 maximumFractionDigits: 0,
 });
}

function formatDate(value) {
 if (!value) return "";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";
 return date.toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 });
}

function EmptyValue({ label = "Not set" }) {
 return (
 <span style={{ fontStyle: "italic", color: "var(--cth-command-muted)" }}>{label}</span>
 );
}

function Chip({ children, tone = "default" }) {
 const tones = {
 default: {
 background: "rgba(175,0,42,0.10)",
 border: "1px solid rgba(175,0,42,0.22)",
 color: "var(--cth-command-crimson)",
 },
 muted: {
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-muted)",
 },
 success: {
 background: "rgba(34,135,90,0.12)",
 border: "1px solid rgba(34,135,90,0.28)",
 color: "#15803d",
 },
 gold: {
 background: "rgba(196,169,91,0.18)",
 border: "1px solid rgba(196,169,91,0.40)",
 color: "var(--cth-command-purple)",
 },
 };
 const style = tones[tone] || tones.default;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 borderRadius: 999,
 padding: "3px 10px",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.06em",
 textTransform: "uppercase",
 ...style,
 }}
 >
 {children}
 </span>
 );
}

function IconButton({ onClick, label, tone = "muted", children }) {
 const [hover, setHover] = useState(false);
 const baseColor = tone === "muted" ? "var(--cth-command-muted)" : "var(--cth-command-crimson)";
 const hoverColor = tone === "muted" ? "var(--cth-command-crimson)" : "var(--cth-command-crimson)";
 return (
 <button
 type="button"
 aria-label={label}
 onClick={onClick}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 width: 32,
 height: 32,
 borderRadius: 7,
 background: "transparent",
 border: `1px solid ${hover ? "var(--cth-command-border)" : "transparent"}`,
 color: hover ? hoverColor : baseColor,
 cursor: "pointer",
 transition: "color 150ms ease, border-color 150ms ease",
 }}
 >
 {children}
 </button>
 );
}

export {
 SANS,
 SERIF,
 PAGE_STYLE,
 PANEL_STYLE,
 SOFT_PANEL_STYLE,
 INPUT_STYLE,
 SMALL_INPUT_STYLE,
 PRIMARY_BUTTON_STYLE,
 SECONDARY_BUTTON_STYLE,
 DESTRUCTIVE_BUTTON_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 EYEBROW_STYLE,
 currency,
 formatDate,
 EmptyValue,
 Chip,
 IconButton,
};
