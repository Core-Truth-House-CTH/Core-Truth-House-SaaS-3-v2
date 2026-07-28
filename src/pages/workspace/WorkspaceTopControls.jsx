import { useEffect, useMemo, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import {
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  Crown,
  LogOut,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NAV_ITEMS, planLabel } from "../../components/AuthShell";
import { NotificationBell } from "../../components/NotificationBell";
import { usePlan } from "../../context/PlanContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useClerk, useUser } from "../../hooks/useAuth";

/*
 * The light, page-integrated replacement for the dark masthead on Workspace
 * routes. Every control here is the real one: the selector writes through
 * WorkspaceContext.selectWorkspace (so the existing stale-request guards and
 * tenant scoping apply unchanged), the plan badge reads PlanContext, and the
 * account menu keeps every destination the shared masthead offers.
 */
export default function WorkspaceTopControls() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const plan = usePlan();
  const { workspaces, activeWorkspace, activeWorkspaceId, selectWorkspace } = useWorkspace();

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

  const options = useMemo(
    () => (Array.isArray(workspaces) ? workspaces.filter((item) => item?.id) : []),
    [workspaces]
  );

  const displayName =
    user?.firstName || (user?.fullName || "").split(" ")[0] || "Account";
  const avatarUrl = user?.imageUrl || "";
  const initials =
    (user?.firstName?.[0] || user?.fullName?.[0] || "U").toUpperCase();
  const roleLabel = String(
    activeWorkspace?.role || plan?.workspaceRole || plan?.userRole || "Member"
  );

  const handleSelect = (workspaceId) => {
    const match = options.find((item) => item.id === workspaceId);
    if (match) selectWorkspace(match);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      window.location.href = "/sign-in";
    }
  };

  return (
    <div className="ws-topctl">
      {options.length > 1 ? (
        <Select.Root value={activeWorkspaceId || undefined} onValueChange={handleSelect}>
          <Select.Trigger className="ws-topctl-selector" aria-label="Active workspace">
            <Building2 size={16} aria-hidden="true" />
            <Select.Value placeholder="Select workspace" />
            <Select.Icon asChild>
              <ChevronDown size={15} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="ws-select-content" position="popper" sideOffset={6}>
              <Select.Viewport>
                {options.map((item) => (
                  <Select.Item key={item.id} value={item.id} className="ws-select-item">
                    <Select.ItemText>{item.name || "Untitled workspace"}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={14} aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      ) : (
        <div className="ws-topctl-selector static">
          <Building2 size={16} aria-hidden="true" />
          <span>{activeWorkspace?.name || "No active workspace"}</span>
        </div>
      )}

      <div className="ws-topctl-plan">
        <Crown size={15} aria-hidden="true" />
        <span>{plan?.loading ? "Checking plan…" : planLabel(plan?.plan)}</span>
      </div>

      <span className="ws-topctl-bell">
        <NotificationBell panelClassName="as-notification-panel" />
      </span>

      <div ref={menuRef} className="ws-topctl-account">
        <button
          type="button"
          className="ws-topctl-profile"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="ws-account-menu"
        >
          <span className="ws-topctl-avatar" aria-hidden={!avatarUrl}>
            {avatarUrl ? <img src={avatarUrl} alt={`${displayName} profile`} /> : initials}
          </span>
          <span className="ws-topctl-profile-copy">
            <strong>{displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div className="ws-topctl-menu" id="ws-account-menu" role="menu">
            <div className="ws-topctl-menu-head">
              <strong>{displayName}</strong>
              <span>{planLabel(plan?.plan)}</span>
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="ws-topctl-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.path);
                  }}
                >
                  <Icon size={15} aria-hidden="true" /> {item.label}
                </button>
              );
            })}
            <div className="ws-topctl-menu-divider" role="separator" />
            <button
              type="button"
              className="ws-topctl-menu-item"
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
              className="ws-topctl-menu-item"
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
              className="ws-topctl-menu-item danger"
              role="menuitem"
              onClick={handleSignOut}
            >
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
