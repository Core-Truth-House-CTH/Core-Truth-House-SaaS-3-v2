import React, { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import { claimCohortSeat, readClaimToken, forgetClaimToken } from "../lib/lifetimeAccess.mjs";

export default function CohortClaimPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    activeWorkspaceId, activeWorkspace, workspaces = [],
    loading: workspacesLoading, initialized: workspacesInitialized,
    error: workspaceError, ownershipError: workspaceOwnershipError,
    selectWorkspace, refreshWorkspaces,
  } = useWorkspace();
  const { refreshPlan } = usePlan();
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const token = readClaimToken();
  const ownedWorkspaces = workspaces.filter((workspace) => workspace.isOwnedByCurrentUser === true);
  const isLoadingWorkspace = workspacesLoading || !workspacesInitialized;
  const hasWorkspaceError = Boolean(workspaceError);
  const hasOwnershipError = Boolean(workspaceOwnershipError);
  const selectedWorkspaceIsOwned = Boolean(
    activeWorkspace?.isOwnedByCurrentUser === true
  );

  async function retryWorkspaceLoad() {
    if (retrying) return;
    setRetrying(true);
    setError("");
    try {
      await refreshWorkspaces();
    } finally {
      setRetrying(false);
    }
  }

  async function claim() {
    if (inFlight.current || !token || !selectedWorkspaceIsOwned || !activeWorkspaceId) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await claimCohortSeat({ token, workspaceId: activeWorkspaceId,
        post: (...args) => apiClient.post(...args), refreshWorkspaces, refreshPlan });
      forgetClaimToken(token);
      const next = new URLSearchParams(searchParams);
      next.delete("cohort_token");
      navigate(`/command-center${next.size ? `?${next.toString()}` : ""}`, { replace: true });
    } catch {
      setError("Your seat could not be confirmed. Your claim link is preserved; retry or contact hello@coretruthhouse.com.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>
    <h1>Claim your cohort seat</h1>
    {!token ? <p>A valid claim link is required.</p> : <>
      {isLoadingWorkspace ? <p role="status" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" style={{ animation: "cth-spin 1s linear infinite" }}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="42 16" />
        </svg>
        <style>{"@keyframes cth-spin { to { transform: rotate(360deg); } }"}</style>
        Setting up your workspace…
      </p> : hasWorkspaceError || hasOwnershipError ? <>
        <p role="alert">{hasWorkspaceError ? "We couldn't load your workspace." : "We couldn't verify workspace ownership."}</p>
        <button type="button" disabled={retrying} onClick={retryWorkspaceLoad}>
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </> : <>
        {activeWorkspace && !selectedWorkspaceIsOwned ? <>
          {ownedWorkspaces.length > 0 ? <>
            <p role="alert">Founding access must go to a workspace you own.</p>
            <label>
            Choose a workspace you own{" "}
            <select
              aria-label="Choose a workspace you own"
              value=""
              onChange={(event) => selectWorkspace(event.target.value)}
            >
              <option value="" disabled>Select a workspace</option>
              {ownedWorkspaces.map((workspace) =>
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              )}
            </select>
            </label>
          </> : <p role="alert">
            Founding access must go to a workspace you own. Email hello@coretruthhouse.com and we'll set it up for you within 1 business day. Keep this link; it stays valid.
          </p>}
        </> : activeWorkspace && selectedWorkspaceIsOwned ? <>
          <p>Estate access will be added to: {activeWorkspace.name}</p>
        </> : <>
          <p>No workspace is available for this account.</p>
        </>}
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={busy || !selectedWorkspaceIsOwned || !activeWorkspaceId} onClick={claim}>
          {busy ? "Confirming access…" : "Claim access"}
        </button>
      </>}
    </>}
  </main>;
}
