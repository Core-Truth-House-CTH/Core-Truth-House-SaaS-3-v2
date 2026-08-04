import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { canAccess, getRequiredPlan, PLAN_INFO } from "../config/planAccess";
import { useUser, useAuth } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import { useWorkspace } from "./WorkspaceContext";

const RECOGNIZED_PLANS = new Set([
  "free",
  "audit",
  "foundation",
  "structure",
  "house",
  "estate",
  "legacy",
]);

export const AUTHORITY_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  RESOLVED: "resolved",
  FAILED: "failed",
});

export const EMPTY_AUTHORITY = Object.freeze({
  plan: "free",
  isSuperAdmin: false,
  isAdmin: false,
  userRole: "MEMBER",
  workspaceRole: null,
  globalRole: null,
  subscriptionStatus: null,
  productAccessActive: false,
  entitlements: null,
  limits: null,
  features: null,
});

const PlanContext = createContext({
  ...EMPTY_AUTHORITY,
  authorityStatus: AUTHORITY_STATUS.IDLE,
  authorityLoading: false,
  authoritySettled: false,
  authorityFailed: false,
  loading: true,
  hasActivePlan: false,
  planResolved: false,
  canAccess: () => false,
  getRequiredPlanForRoute: () => null,
  getUpgradeInfo: () => null,
  refreshPlan: async () => {},
});

function normalizedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedRole(value) {
  const role = normalizedString(value).toUpperCase();
  return role || null;
}

export function validateEntitlementAuthority(data, expectedClerkUserId, expectedWorkspaceId) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const internalUserId = normalizedString(data.user_id);
  const clerkUserId = normalizedString(data.clerk_user_id);
  const workspaceId = normalizedString(data.workspace_id);
  const plan = normalizedString(data.plan).toLowerCase();
  const planId = normalizedString(data.plan_id).toLowerCase();

  if (!internalUserId) return null;
  if (!clerkUserId || clerkUserId !== normalizedString(expectedClerkUserId)) return null;
  if (!workspaceId || workspaceId !== normalizedString(expectedWorkspaceId)) return null;
  if (!RECOGNIZED_PLANS.has(plan) || !RECOGNIZED_PLANS.has(planId) || plan !== planId) return null;
  if (typeof data.product_access_active !== "boolean") return null;
  if (typeof data.is_admin !== "boolean" || typeof data.is_super_admin !== "boolean") return null;
  if (data.subscription_status != null && typeof data.subscription_status !== "string") return null;
  if (data.global_role != null && typeof data.global_role !== "string") return null;
  if (data.workspace_role != null && typeof data.workspace_role !== "string") return null;
  if (data.entitlements == null || typeof data.entitlements !== "object") return null;
  if (data.limits == null || typeof data.limits !== "object" || Array.isArray(data.limits)) return null;
  if (data.features == null || typeof data.features !== "object") return null;

  const globalRole = normalizedRole(data.global_role);
  const workspaceRole = normalizedRole(data.workspace_role);
  const isSuperAdmin = data.is_super_admin === true;
  const isAdmin = data.is_admin === true || isSuperAdmin;

  return {
    plan,
    isSuperAdmin,
    isAdmin,
    userRole: isSuperAdmin ? "SUPER_ADMIN" : globalRole || workspaceRole || "MEMBER",
    workspaceRole,
    globalRole,
    subscriptionStatus: data.subscription_status?.trim().toLowerCase() || null,
    productAccessActive: data.product_access_active,
    entitlements: data.entitlements,
    limits: data.limits,
    features: data.features,
  };
}

export function createIdleAuthorityState(generation = 0) {
  return {
    key: null,
    generation,
    status: AUTHORITY_STATUS.IDLE,
    authority: EMPTY_AUTHORITY,
  };
}

export function startAuthorityRequest(previousState, key, generation) {
  if (!key) return createIdleAuthorityState(generation);
  if (
    previousState.key === key &&
    previousState.generation === generation &&
    previousState.status === AUTHORITY_STATUS.LOADING
  ) {
    return previousState;
  }
  return {
    key,
    generation,
    status: AUTHORITY_STATUS.LOADING,
    authority: EMPTY_AUTHORITY,
  };
}

export function settleAuthorityIdle(state, generation) {
  if (
    state.key === null &&
    state.status === AUTHORITY_STATUS.IDLE &&
    state.authority === EMPTY_AUTHORITY
  ) {
    return state;
  }
  return createIdleAuthorityState(generation);
}

function ownsAuthorityRequest(state, key, generation) {
  return (
    state.key === key &&
    state.generation === generation &&
    state.status === AUTHORITY_STATUS.LOADING
  );
}

export function failAuthorityRequest(state, key, generation) {
  if (!ownsAuthorityRequest(state, key, generation)) return state;
  return {
    ...state,
    status: AUTHORITY_STATUS.FAILED,
    authority: EMPTY_AUTHORITY,
  };
}

export function resolveAuthorityRequest(
  state,
  { key, generation, data, clerkUserId, workspaceId },
) {
  if (!ownsAuthorityRequest(state, key, generation)) return state;
  const authority = validateEntitlementAuthority(data, clerkUserId, workspaceId);
  if (!authority) return failAuthorityRequest(state, key, generation);
  return {
    ...state,
    status: AUTHORITY_STATUS.RESOLVED,
    authority,
  };
}

export function getAuthorityStateView(state, currentKey) {
  const stateIsCurrent = Boolean(currentKey && state.key === currentKey);
  const status = stateIsCurrent ? state.status : AUTHORITY_STATUS.IDLE;
  const authority = status === AUTHORITY_STATUS.RESOLVED ? state.authority : EMPTY_AUTHORITY;
  return {
    authority,
    authorityStatus: status,
    authorityLoading: status === AUTHORITY_STATUS.LOADING,
    authoritySettled:
      status === AUTHORITY_STATUS.RESOLVED || status === AUTHORITY_STATUS.FAILED,
    authorityFailed: status === AUTHORITY_STATUS.FAILED,
    planResolved: status === AUTHORITY_STATUS.RESOLVED,
    hasActivePlan:
      status === AUTHORITY_STATUS.RESOLVED && authority.productAccessActive === true,
  };
}

export function getAuthorityRequestKey(userId, workspaceId) {
  return userId && workspaceId ? `${userId}::${workspaceId}` : null;
}

export async function executeAuthorityRequest({
  getToken,
  fetchAuthority,
  ownsLifecycle = () => true,
}) {
  try {
    const token = typeof getToken === "function" ? await getToken() : null;
    if (!ownsLifecycle()) return { type: "ignored" };
    if (!token) return { type: "failed", error: null };

    const data = await fetchAuthority(token);
    if (!ownsLifecycle()) return { type: "ignored" };
    return { type: "response", data };
  } catch (error) {
    if (!ownsLifecycle()) return { type: "ignored" };
    return { type: "failed", error };
  }
}

export function PlanProvider({ children }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const auth = useAuth();
  const workspace = useWorkspace();

  return (
    <PlanAuthorityProvider
      userId={user?.id || null}
      isUserLoaded={isUserLoaded}
      authLoaded={Boolean(auth?.isLoaded ?? true)}
      workspaceInitialized={Boolean(workspace?.initialized ?? true)}
      activeWorkspaceId={workspace?.activeWorkspaceId || workspace?.workspaceId || null}
      getToken={auth?.getToken}
      fetchAuthority={({ token, workspaceId }) =>
        apiClient.get("/api/user/entitlement-authority", {
          params: { workspace_id: workspaceId },
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    >
      {children}
    </PlanAuthorityProvider>
  );
}

export function PlanAuthorityProvider({
  children,
  userId = null,
  isUserLoaded = true,
  authLoaded = true,
  workspaceInitialized = true,
  activeWorkspaceId = null,
  getToken,
  fetchAuthority,
  onAuthorityEffect,
}) {
  const [authorityState, setAuthorityState] = useState(() => createIdleAuthorityState());
  const requestGenerationRef = useRef(0);
  const getTokenRef = useRef(getToken);
  const fetchAuthorityRef = useRef(fetchAuthority);
  const mountedRef = useRef(false);
  const lifecycleOwnershipRef = useRef(0);
  const onAuthorityEffectRef = useRef(onAuthorityEffect);

  getTokenRef.current = getToken;
  fetchAuthorityRef.current = fetchAuthority;
  onAuthorityEffectRef.current = onAuthorityEffect;
  const currentKey = getAuthorityRequestKey(userId, activeWorkspaceId);

  useEffect(() => {
    mountedRef.current = true;
    lifecycleOwnershipRef.current += 1;
    return () => {
      mountedRef.current = false;
      lifecycleOwnershipRef.current += 1;
      requestGenerationRef.current += 1;
    };
  }, []);

  const runAuthorityRequest = useCallback(
    async ({ key, generation, clerkUserId, workspaceId, lifecycleOwnership }) => {
      const result = await executeAuthorityRequest({
        getToken: () => getTokenRef.current?.(),
        fetchAuthority: (token) => fetchAuthorityRef.current?.({ token, workspaceId }),
        ownsLifecycle: () =>
          mountedRef.current && lifecycleOwnershipRef.current === lifecycleOwnership,
      });

      if (result.type === "ignored") return null;
      if (result.type === "response") {
        setAuthorityState((state) =>
          resolveAuthorityRequest(state, {
            key,
            generation,
            data: result.data,
            clerkUserId,
            workspaceId,
          }),
        );
        return result.data;
      }

      setAuthorityState((state) => {
        const nextState = failAuthorityRequest(state, key, generation);
        if (nextState !== state && result.error) {
          console.error("[PlanContext] Failed to fetch entitlement authority", result.error);
        }
        return nextState;
      });
      return null;
    },
    [],
  );

  const beginCurrentRequest = useCallback(() => {
    const generation = ++requestGenerationRef.current;
    if (!currentKey || !userId || !activeWorkspaceId) {
      setAuthorityState((state) => settleAuthorityIdle(state, generation));
      return Promise.resolve(null);
    }

    setAuthorityState((state) => startAuthorityRequest(state, currentKey, generation));
    return runAuthorityRequest({
      key: currentKey,
      generation,
      clerkUserId: userId,
      workspaceId: activeWorkspaceId,
      lifecycleOwnership: lifecycleOwnershipRef.current,
    });
  }, [activeWorkspaceId, currentKey, runAuthorityRequest, userId]);

  useEffect(() => {
    onAuthorityEffectRef.current?.();
    const generation = ++requestGenerationRef.current;

    if (!isUserLoaded || !authLoaded || !workspaceInitialized || !currentKey) {
      setAuthorityState((state) => settleAuthorityIdle(state, generation));
      return;
    }

    setAuthorityState((state) => startAuthorityRequest(state, currentKey, generation));
    void runAuthorityRequest({
      key: currentKey,
      generation,
      clerkUserId: userId,
      workspaceId: activeWorkspaceId,
      lifecycleOwnership: lifecycleOwnershipRef.current,
    });
  }, [
    activeWorkspaceId,
    authLoaded,
    currentKey,
    isUserLoaded,
    runAuthorityRequest,
    userId,
    workspaceInitialized,
  ]);

  const stateView = getAuthorityStateView(authorityState, currentKey);
  const authenticationLoading = !isUserLoaded || !authLoaded;
  const workspaceLoading = Boolean(userId && !workspaceInitialized);
  const loading = authenticationLoading || workspaceLoading || stateView.authorityLoading;

  const value = useMemo(() => {
    const checkAccess = (route) =>
      stateView.hasActivePlan &&
      canAccess(stateView.authority.plan, route, stateView.authority.isSuperAdmin);
    const getRequiredPlanForRoute = (route) => getRequiredPlan(route);
    const getUpgradeInfo = (route) => {
      const required = getRequiredPlan(route);
      const info = PLAN_INFO[required];
      return info ? { plan: required, ...info } : null;
    };

    return {
      ...stateView.authority,
      authorityStatus: stateView.authorityStatus,
      authorityLoading: stateView.authorityLoading,
      authoritySettled: stateView.authoritySettled,
      authorityFailed: stateView.authorityFailed,
      loading,
      hasActivePlan: stateView.hasActivePlan,
      planResolved: stateView.planResolved,
      canAccess: checkAccess,
      getRequiredPlanForRoute,
      getUpgradeInfo,
      refreshPlan: beginCurrentRequest,
    };
  }, [beginCurrentRequest, loading, stateView]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
