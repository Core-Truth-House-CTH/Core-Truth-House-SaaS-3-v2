import React from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";

export function hasBackendAdminAuthority({
  planResolved,
  isSuperAdmin,
  isAdmin,
}) {
  if (!planResolved) return false;
  return isSuperAdmin === true || isAdmin === true;
}

export function getAdminRouteDecision({ clerkLoaded, user, authority }) {
  if (!clerkLoaded) return "auth-loading";
  if (!user) return "sign-in";
  if (authority?.authorityLoading) return "authority-loading";
  return hasBackendAdminAuthority(authority || {}) ? "allowed" : "denied";
}

export default function AdminProtectedRoute() {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const authority = usePlan();
  const decision = getAdminRouteDecision({
    clerkLoaded: isLoaded,
    user,
    authority,
  });

  if (decision === "auth-loading" || decision === "authority-loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] text-white">
        Loading admin access...
      </div>
    );
  }

  if (decision === "sign-in") {
    return <Navigate to="/admin/sign-in" replace state={{ from: location }} />;
  }

  if (decision === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--cth-surface-sidebar-border)] bg-[linear-gradient(180deg,var(--cth-command-ink),var(--cth-surface-midnight))] p-8 text-[var(--cth-on-dark)] shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--cth-command-muted)]">Core Truth House</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm text-[var(--cth-command-border)]">
            Your signed-in account does not have an admin role in the current backend authority response.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/sign-in"
              className="inline-flex items-center rounded-lg bg-[var(--cth-command-cinnabar)] px-4 py-2 text-sm font-medium text-white"
            >
              Return to admin sign-in
            </Link>
            <Link
              to="/command-center"
              className="inline-flex items-center rounded-lg border border-[var(--cth-command-muted)] px-4 py-2 text-sm font-medium text-[var(--cth-on-dark)]"
            >
              Go to command center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
