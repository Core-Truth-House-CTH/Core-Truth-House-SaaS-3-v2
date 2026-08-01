import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";

export const WALL_WHITELIST = new Set([
  "/billing",
  "/help",
]);

export function canonicalWallPath(pathname) {
  const withoutQueryOrHash = String(pathname || "").split(/[?#]/, 1)[0];
  if (withoutQueryOrHash.length > 1 && withoutQueryOrHash.endsWith("/")) {
    return withoutQueryOrHash.slice(0, -1);
  }
  return withoutQueryOrHash;
}

export function isWhitelisted(pathname) {
  return WALL_WHITELIST.has(canonicalWallPath(pathname));
}

export function getBillingWallDecision({
  authLoaded,
  isSignedIn,
  pathname,
  authorityLoading,
  hasActivePlan,
}) {
  if (!authLoaded) return "loading";
  if (!isSignedIn) return "content";
  if (isWhitelisted(pathname)) return "content";
  if (authorityLoading) return "loading";
  return hasActivePlan ? "content" : "redirect";
}

function WallLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cth-command-blush, #efe7e3)",
        color: "var(--cth-command-ink, #2b1040)",
        padding: "48px 24px",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      Loading Core Truth House...
    </div>
  );
}

export default function BillingWall({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const { authorityLoading, hasActivePlan } = usePlan();
  const location = useLocation();
  const decision = getBillingWallDecision({
    authLoaded: isLoaded,
    isSignedIn,
    pathname: location.pathname,
    authorityLoading,
    hasActivePlan,
  });

  if (decision === "loading") return <WallLoading />;
  if (decision === "content") return children;
  return <Navigate to="/billing" replace />;
}
