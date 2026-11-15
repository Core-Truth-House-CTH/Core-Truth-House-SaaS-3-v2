import React, { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";

// The only source of truth for admin access is the server. GET /api/admin/me
// answers from the role stored on the user record and returns 403 for anyone
// else. Nothing on the client (Clerk metadata, workspace ownership, notes) can
// grant access, and every /api/admin route re-checks the role on the server.
export default function AdminProtectedRoute() {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let cancelled = false;
    if (!isLoaded) return undefined;
    if (!user?.id) {
      setState({ loading: false, allowed: false });
      return undefined;
    }
    setState({ loading: true, allowed: false });
    apiClient
      .get("/api/admin/me")
      .then((res) => {
        if (!cancelled) {
          setState({ loading: false, allowed: res?.allowed === true && (res?.is_admin === true || res?.is_super_admin === true) });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, allowed: false });
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  if (!isLoaded || state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] text-white">
        Loading admin access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/sign-in" replace state={{ from: location }} />;
  }

  if (!state.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cth-surface-midnight)] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--cth-surface-sidebar-border)] bg-[linear-gradient(180deg,var(--cth-command-ink),var(--cth-surface-midnight))] p-8 text-[var(--cth-on-dark)] shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--cth-command-muted)]">Core Truth House</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm text-[var(--cth-command-border)]">
            This account is not authorized for the admin area.
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
