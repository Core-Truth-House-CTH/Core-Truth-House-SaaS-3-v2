import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LayoutGrid,
  BarChart3,
  Command,
  BookOpen,
  Search,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useUser, useClerk } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import { PLAN_INFO, normalizePlan } from "../config/planAccess";
import { NotificationBell } from "./NotificationBell";
import AuthShellContext, { AUTH_SHELL_OWNS_BELL } from "../context/AuthShellContext";
import "../styles/auth-shell.css";
import "../styles/auth-shell-enhancements.css";

// Served from public/; referenced by URL (not a module import).
const CTH_LOGO = "/command-center-assets/cth-logo-seal.png";

/*
 * Shared authenticated shell for the Command Center, Workspace, and Reports.
 * Full-width top bar + full-width page frame (responsive gutters, no max-width
 * wrapper, no sidebar). Nav, notifications, search, account, and plan are wired
 * to the app's real sources. Applied only to staged shell routes for now.
 */

const NAV_ITEMS = [
  { key: "command-center", label: "Command Center", icon: LayoutDashboard, path: "/command-center-next" },
  { key: "workspace", label: "Workspace", icon: LayoutGrid, path: "/workspace" },
  { key: "reports", label: "Reports", icon: BarChart3, path: "/analytics" },
  { key: "signal-os", label: "Signal OS", icon: Command, path: "/signal-inbox" },
  { key: "knowledge-base", label: "Knowledge Base", icon: BookOpen, path: "/knowledge-base" },
];

function planLabel(rawPlan) {
  const info = PLAN_INFO[normalizePlan(rawPlan)] || PLAN_INFO.foundation;
  return `${(info.name || "").replace(/^The\s+/, "")} Plan`;
}

export default function AuthShell({ activeNav, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const plan = usePlan();

  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const currentActive =
    activeNav ||
    NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ||
    "command-center";

  const displayName =
    user?.firstName || (user?.fullName || "").split(" ")[0] || "Account";
  const avatarUrl = user?.imageUrl || "";
  const initials =
    (user?.firstName?.[0] || user?.fullName?.[0] || "U").toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      window.location.href = "/sign-in";
    }
  };

  return (
    // This shell renders the notification bell for everything beneath it, so a
    // legacy DashboardLayout embedded in one of these routes omits its own.
    <AuthShellContext.Provider value={AUTH_SHELL_OWNS_BELL}>
    <div className="cth-authshell">
      <header className="as-topbar">
        <button
          type="button"
          className="as-brand"
          onClick={() => navigate("/command-center-next")}
          aria-label="Core Truth House Command Center"
        >
          <img src={CTH_LOGO} alt="Core Truth House logo" />
          <span className="as-brand-copy">
            <strong>CORE TRUTH HOUSE</strong>
            <span>COMMAND CENTER</span>
          </span>
        </button>

        <nav className="as-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentActive === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`as-navbtn${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(item.path)}
              >
                <Icon size={15} aria-hidden="true" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="as-actions">
          <form
            className="as-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = searchValue.trim();
              if (query) navigate(`/knowledge-base?q=${encodeURIComponent(query)}`);
            }}
          >
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search the House..."
              aria-label="Search the House"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </form>

          <span className="as-bell">
            <NotificationBell />
          </span>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="as-profile"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="as-account-menu"
            >
              <span className="as-avatar" aria-hidden={!avatarUrl}>
                {avatarUrl ? <img src={avatarUrl} alt={`${displayName} profile`} /> : initials}
              </span>
              <span className="as-profile-copy">
                <strong>{displayName}</strong>
                <small>{planLabel(plan?.plan)}</small>
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div className="as-menu" id="as-account-menu" role="menu">
                <div className="as-menu-head">
                  <strong>{displayName}</strong>
                  <span>{planLabel(plan?.plan)}</span>
                </div>
                <button
                  type="button"
                  className="as-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  <Settings size={15} aria-hidden="true" /> Account settings
                </button>
                <button
                  type="button"
                  className="as-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/billing");
                  }}
                >
                  <BarChart3 size={15} aria-hidden="true" /> Plan &amp; billing
                </button>
                <button
                  type="button"
                  className="as-menu-item danger"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  <LogOut size={15} aria-hidden="true" /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="as-frame">{children}</div>
    </div>
    </AuthShellContext.Provider>
  );
}
