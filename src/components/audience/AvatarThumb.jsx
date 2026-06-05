import React from "react";
import apiClient from "../../lib/apiClient";

const SANS = "'DM Sans', sans-serif";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Small circular avatar thumbnail. Shows the avatar's portrait_image_url when
 * present, otherwise a placeholder circle with the avatar's initials.
 */
export default function AvatarThumb({ avatar, size = 24 }) {
  const url = avatar?.portrait_image_url
    ? apiClient.buildApiUrl(avatar.portrait_image_url)
    : null;

  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    border: "0.5px solid var(--cth-command-border)",
    overflow: "hidden",
  };

  if (url) {
    return (
      <img
        src={url}
        alt={avatar?.name || "Avatar"}
        style={{ ...base, objectFit: "cover", display: "block" }}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        background: "var(--cth-command-purple)",
        color: "var(--cth-command-gold)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontSize: Math.max(8, Math.round(size * 0.38)),
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
      aria-hidden="true"
    >
      {initials(avatar?.name)}
    </div>
  );
}
