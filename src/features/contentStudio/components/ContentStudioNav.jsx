import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Command Center", to: "/command-center", end: true },
  { label: "Content Studio", to: "/content-studio", end: true },
  { label: "Campaigns", to: "/campaign-builder", end: true },
  { label: "Storyboards", to: "/content-studio/storyboards", end: true },
  { label: "Production", to: "/content-studio/storyboards?mode=production", end: true },
  { label: "Media Library", to: "/content-studio/media", end: false },
  { label: "Brand Memory", to: "/brand-memory", end: true },
  { label: "Automations", to: "/content-studio/automations", end: false },
  { label: "Analytics", to: "/analytics", end: true },
];

export default function ContentStudioNav() {
  return (
    <nav aria-label="Content Studio" className="cs-scroll-x" style={navShell}>
      <ul style={navList}>
        {NAV_ITEMS.map((item) => (
          <li key={item.to} style={{ flexShrink: 0 }}>
            <NavLink
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...navLink,
                background: isActive ? "var(--cs-crimson)" : "transparent",
                color: isActive ? "#fff" : "rgba(248, 241, 236, 0.72)",
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const navShell = {
  background: "var(--cs-night)",
  borderBottom: "1px solid rgba(248, 241, 236, 0.08)",
};

const navList = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  listStyle: "none",
  margin: "0 auto",
  padding: "0 var(--cs-gutter)",
  maxWidth: "var(--cs-max)",
  minHeight: 52,
};

const navLink = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 34,
  padding: "0 14px",
  borderRadius: "var(--cs-radius-pill)",
  fontSize: 12.5,
  letterSpacing: "0.01em",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "background 120ms ease, color 120ms ease",
};

export { NAV_ITEMS };
