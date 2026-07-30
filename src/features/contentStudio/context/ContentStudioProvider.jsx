import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getEntitlement, startTrial } from "../api/contentStudioApi";
import { classifyApiError, CS_ERROR } from "../utilities/errors";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { usePlan } from "../../../context/PlanContext";
import { useUser } from "../../../hooks/useAuth";

/**
 * Content Studio entitlement + trial state.
 *
 * Deliberately does NOT create auth or workspace providers — it consumes the
 * app's existing WorkspaceContext and lets apiClient supply the Clerk token
 * and X-Workspace-ID header.
 */

const ContentStudioContext = createContext(null);

const EMPTY_ENTITLEMENT = {
  workspace_id: null,
  plan: null,
  estate_required: true,
  estate_eligible: false,
  add_on_active: false,
  trial_active: false,
  trial_started_at: null,
  trial_ends_at: null,
  days_remaining: 0,
  custom_creation_allowed: false,
};

export function ContentStudioProvider({ children }) {
  const workspace = useWorkspace() || {};
  const workspaceId = workspace.activeWorkspaceId || workspace.workspaceId || null;
  const { isSuperAdmin, userRole } = usePlan() || {};
  const { user } = useUser() || {};

  const [entitlement, setEntitlement] = useState(EMPTY_ENTITLEMENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trialPending, setTrialPending] = useState(false);
  const [trialNotice, setTrialNotice] = useState(null);

  // Guards against a stale response from a previous workspace overwriting a
  // newer one after a workspace switch.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const data = await getEntitlement();
      if (seq !== requestSeq.current) return null;
      setEntitlement({ ...EMPTY_ENTITLEMENT, ...(data || {}) });
      return data;
    } catch (err) {
      if (seq !== requestSeq.current) return null;
      // Never fall back to invented entitlement: fail closed.
      setEntitlement(EMPTY_ENTITLEMENT);
      setError(classifyApiError(err));
      return null;
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, workspaceId]);

  const activateTrial = useCallback(async () => {
    if (trialPending) return { ok: false };
    setTrialPending(true);
    setTrialNotice(null);
    try {
      const data = await startTrial();
      await refresh();
      setTrialNotice({
        tone: "success",
        message: `Your ${data?.days_remaining ?? 7}-day Content Studio trial is active.`,
      });
      return { ok: true, data };
    } catch (err) {
      const classified = classifyApiError(err);
      setTrialNotice({
        tone: classified.kind === CS_ERROR.CONFLICT ? "info" : "error",
        message: classified.message,
      });
      return { ok: false, error: classified };
    } finally {
      setTrialPending(false);
    }
  }, [refresh, trialPending]);

  // Viewer identity follows the app's established pattern (see Members.jsx):
  // Clerk user id + PlanContext role flags.
  const viewer = useMemo(
    () => ({
      userId: user?.id || "",
      role: String(userRole || "").toLowerCase(),
      isSuperAdmin: isSuperAdmin === true,
    }),
    [user?.id, userRole, isSuperAdmin],
  );

  const value = useMemo(
    () => ({
      entitlement,
      loading,
      error,
      refresh,
      activateTrial,
      trialPending,
      trialNotice,
      dismissTrialNotice: () => setTrialNotice(null),
      viewer,
      workspaceId,
      // Convenience flags used across the feature.
      canCreate: Boolean(entitlement.custom_creation_allowed),
      isEstate: Boolean(entitlement.estate_eligible),
      trialActive: Boolean(entitlement.trial_active),
      addOnActive: Boolean(entitlement.add_on_active),
      daysRemaining: Number(entitlement.days_remaining || 0),
      // A trial can only be offered if never started.
      trialAvailable: Boolean(entitlement.estate_eligible) && !entitlement.trial_started_at,
    }),
    [entitlement, loading, error, refresh, activateTrial, trialPending, trialNotice, viewer, workspaceId],
  );

  return <ContentStudioContext.Provider value={value}>{children}</ContentStudioContext.Provider>;
}

export function useContentStudio() {
  const ctx = useContext(ContentStudioContext);
  if (!ctx) {
    throw new Error("useContentStudio must be used inside <ContentStudioProvider>");
  }
  return ctx;
}

export default ContentStudioContext;
