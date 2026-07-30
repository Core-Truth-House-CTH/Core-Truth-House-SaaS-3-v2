import React from "react";
import { Link } from "react-router-dom";
import { Bot, FileText, Image as ImageIcon, Music, Video } from "lucide-react";

import { StatusBadge } from "./Primitives";

/* ---------------- Agent card (approved screens 1 and 3) ---------------- */

export function AgentCard({ agent, to = null, footer = null }) {
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 10 }}>
        <span
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--cs-crimson-soft)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Bot size={15} style={{ color: "var(--cs-crimson)" }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: "var(--cs-ink)" }}>{agent.name}</p>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--cs-ruby)",
              margin: "3px 0 0",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {agent.description || "No description yet."}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {agent.category ? <span className="cs-badge cs-badge-category">{agent.category}</span> : null}
        <StatusBadge status={agent.status || "active"} />
      </div>

      {footer}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="cs-card cs-card-pad" style={{ textDecoration: "none", display: "block" }}>
        {body}
      </Link>
    );
  }

  return <article className="cs-card cs-card-pad">{body}</article>;
}

/* ---------------- Media card (approved screen 8) ---------------- */

const MEDIA_ICONS = { image: ImageIcon, video: Video, audio: Music, document: FileText };

export function MediaCard({ item, to = null }) {
  const kind = String(item.kind || item.type || "image").toLowerCase();
  const Icon = MEDIA_ICONS[kind] || ImageIcon;
  const name = item.filename || item.label || item.id;

  const inner = (
    <>
      <div
        style={{
          aspectRatio: "4 / 3",
          borderRadius: "var(--cs-radius)",
          overflow: "hidden",
          background: "var(--cs-blush)",
          display: "grid",
          placeItems: "center",
          marginBottom: 9,
        }}
      >
        {item.preview_url || item.image_url ? (
          <img
            src={item.preview_url || item.image_url}
            alt={item.alt_text || name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Icon size={20} aria-hidden="true" style={{ color: "var(--cs-tuscany)" }} />
        )}
      </div>
      <p
        style={{
          fontSize: 12,
          margin: 0,
          color: "var(--cs-ink)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={name}
      >
        {name}
      </p>
      {item.created_at ? (
        <p style={{ fontSize: 10.5, color: "var(--cs-tuscany)", margin: "2px 0 0" }}>
          {formatDate(item.created_at)}
        </p>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="cs-card" style={{ padding: 10, textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return <article className="cs-card" style={{ padding: 10 }}>{inner}</article>;
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default { AgentCard, MediaCard, formatDate };
