import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import { useAuth, HAS_CLERK } from "../hooks/useAuth";

const WorkspaceContext = createContext(null);

const LIVE_STORAGE_KEYS = {
  activeWorkspaceId: "activeWorkspaceId",
  workspaceId: "workspaceId",
};

function getStatusCode(err) {
  return err?.status || err?.response?.status || err?.request?.status || null;
}

function safeGetStorage(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch (error) {
    console.error(`Failed to read storage key: ${key}`, error);
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    if (value == null) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write storage key: ${key}`, error);
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage key: ${key}`, error);
  }
}

function normalizeWorkspace(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id || raw.workspace_id || raw.workspaceId || null;
  if (!id) return null;

  const plan =
    raw.plan ||
    raw.plan_name ||
    raw.subscription_plan ||
    raw.tier ||
    raw.plan_id ||
    "free";

  return {
    id: String(id),
    workspace_id: String(id),
    name: raw.name || raw.workspace_name || "Workspace",
    status: raw.status || "active",
    role: raw.role || raw.workspace_role || null,
    owner_id: raw.owner_id || null,
    plan: String(plan).toLowerCase(),
    plan_id: raw.plan_id || raw.plan || null,
    raw,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function WorkspaceProvider({ children }) {
  const auth = useAuth();

  // Keep the latest auth accessible without depending on its (unstable) identity.
  // Clerk returns a new auth object on every store tick; depending on the whole
  // object re-created fetchWorkspaces on every tick and re-ran its effect in the
  // same commit as the signed-out redirect, clobbering Router location propagation.
  const authRef = useRef(auth);
  authRef.current = auth;
  const authIsLoaded = auth?.isLoaded;
  const authIsSignedIn = auth?.isSignedIn;
  const authUserId = auth?.userId;

  const storageKeys = LIVE_STORAGE_KEYS;

  const provisionResolveRef = useRef(null);
  if (provisionResolveRef.current === null && apiClient.provisionGate === null) {
    const gate = new Promise((resolve) => {
      provisionResolveRef.current = resolve;
    });
    apiClient.setProvisionGate(gate);
    setTimeout(() => {
      if (provisionResolveRef.current) {
        console.warn("[WorkspaceProvider] Provision gate timed out after 4s - releasing");
        provisionResolveRef.current();
        provisionResolveRef.current = null;
      }
    }, 4000);
    try {
      const warmId =
        safeGetStorage(LIVE_STORAGE_KEYS.activeWorkspaceId) ||
        safeGetStorage(LIVE_STORAGE_KEYS.workspaceId);
      if (warmId && provisionResolveRef.current) {
        provisionResolveRef.current();
        provisionResolveRef.current = null;
      }
    } catch (_) {
      // storage read failed; let the fetch or safety timeout release the gate
    }
  }

  const releaseGate = useCallback(() => {
    if (provisionResolveRef.current) {
      provisionResolveRef.current();
      provisionResolveRef.current = null;
    }
  }, []);

  const getStoredWorkspaceId = useCallback(() => {
    return (
      safeGetStorage(storageKeys.activeWorkspaceId) ||
      safeGetStorage(storageKeys.workspaceId) ||
      null
    );
  }, [storageKeys]);

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() =>
    getStoredWorkspaceId()
  );
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const fetchInFlightRef = useRef(false);
  const fetchSequenceRef = useRef(0);
  const bootstrappedKeyRef = useRef(null);

  const writeActiveWorkspaceId = useCallback(
    (workspaceId) => {
      const normalizedId = workspaceId ? String(workspaceId) : null;

      safeSetStorage(storageKeys.activeWorkspaceId, normalizedId);
      safeSetStorage(storageKeys.workspaceId, normalizedId);
      setActiveWorkspaceIdState(normalizedId);

      return normalizedId;
    },
    [storageKeys]
  );

  const clearWorkspaceState = useCallback(() => {
    bootstrappedKeyRef.current = null;

    safeRemoveStorage(storageKeys.activeWorkspaceId);
    safeRemoveStorage(storageKeys.workspaceId);

    setWorkspaces([]);
    setActiveWorkspaceIdState(null);
    setActiveWorkspace(null);
    setError(null);
  }, [storageKeys]);

  const resolveAndApplyActiveWorkspace = useCallback(
    (nextWorkspaces) => {
      const storedId = getStoredWorkspaceId();

      const resolvedActive =
        nextWorkspaces.find((item) => item.id === storedId) ||
        nextWorkspaces[0] ||
        null;

      if (!resolvedActive) {
        writeActiveWorkspaceId(null);
        setActiveWorkspace(null);
        return null;
      }

      writeActiveWorkspaceId(resolvedActive.id);
      setActiveWorkspace(resolvedActive);
      return resolvedActive;
    },
    [getStoredWorkspaceId, writeActiveWorkspaceId]
  );

  const selectWorkspace = useCallback(
    (workspaceOrId) => {
      if (!workspaceOrId) {
        writeActiveWorkspaceId(null);
        setActiveWorkspace(null);
        return;
      }

      const resolvedId =
        typeof workspaceOrId === "string"
          ? String(workspaceOrId)
          : String(
              workspaceOrId.id ||
                workspaceOrId.workspace_id ||
                workspaceOrId.workspaceId ||
                ""
            );

      if (!resolvedId) {
        writeActiveWorkspaceId(null);
        setActiveWorkspace(null);
        return;
      }

      writeActiveWorkspaceId(resolvedId);

      setActiveWorkspace((prev) => {
        if (prev?.id === resolvedId) return prev;
        return workspaces.find((item) => item.id === resolvedId) || null;
      });
    },
    [workspaces, writeActiveWorkspaceId]
  );

  const fetchWorkspaces = useCallback(
    async ({ force = false } = {}) => {
      if (!HAS_CLERK) {
        setLoading(false);
        setInitialized(true);
        releaseGate();
        return [];
      }

      if (!authIsLoaded) {
        return [];
      }

      if (!authIsSignedIn) {
        clearWorkspaceState();
        setLoading(false);
        setInitialized(true);
        releaseGate();
        return [];
      }

      if (typeof authRef.current?.getToken !== "function") {
        setLoading(false);
        setInitialized(true);
        releaseGate();
        return [];
      }

      const bootKey = `${authUserId || "unknown"}:${
        authIsSignedIn ? "signed-in" : "signed-out"
      }`;

      if (!force && bootstrappedKeyRef.current === bootKey) {
        setInitialized(true);
        return [];
      }

      if (fetchInFlightRef.current) {
        return [];
      }

      fetchInFlightRef.current = true;
      fetchSequenceRef.current += 1;
      const requestId = fetchSequenceRef.current;

      setLoading(true);
      setError(null);

      try {
        let token = await authRef.current.getToken();

        if (!token) {
          await sleep(250);
          token = await authRef.current.getToken();
        }

        if (!token) {
          return [];
        }

        const payload = await apiClient.get(
          API_PATHS.platform?.workspacesMine ||
            API_PATHS.workspacesMine ||
            "/api/workspaces/mine",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            workspace: false,
            skipProvisionGate: true,
          }
        );

        if (requestId !== fetchSequenceRef.current) {
          return [];
        }

        const rawItems = payload?.workspaces || payload?.items || payload?.data || [];
        const normalized = Array.isArray(rawItems)
          ? rawItems.map(normalizeWorkspace).filter(Boolean)
          : [];

        setWorkspaces(normalized);
        resolveAndApplyActiveWorkspace(normalized);

        bootstrappedKeyRef.current = bootKey;
        setError(null);

        return normalized;
      } catch (err) {
        if (requestId !== fetchSequenceRef.current) {
          return [];
        }

        const status = getStatusCode(err);

        if (status === 401) {
          clearWorkspaceState();
          return [];
        }

        console.error("Failed to fetch workspaces", err);
        setError(err);
        setWorkspaces([]);
        setActiveWorkspace(null);
        return [];
      } finally {
        if (requestId === fetchSequenceRef.current) {
          fetchInFlightRef.current = false;
          setLoading(false);
          setInitialized(true);
        }
        releaseGate();
      }
    },
    [
      authIsLoaded,
      authIsSignedIn,
      authUserId,
      clearWorkspaceState,
      resolveAndApplyActiveWorkspace,
      releaseGate,
    ]
  );

  useEffect(() => {
    const storedId = getStoredWorkspaceId();
    setActiveWorkspaceIdState((prev) => (prev === storedId ? prev : storedId));
  }, [getStoredWorkspaceId]);

  useEffect(() => {
    if (!HAS_CLERK) {
      setInitialized(true);
      return;
    }

    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setActiveWorkspace(null);
      return;
    }

    const match = workspaces.find((item) => item.id === activeWorkspaceId) || null;
    setActiveWorkspace(match);
  }, [activeWorkspaceId, workspaces]);

  const refreshWorkspaces = useCallback(async () => {
    return fetchWorkspaces({ force: true });
  }, [fetchWorkspaces]);

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      currentWorkspace: activeWorkspace,
      workspaceId: activeWorkspaceId,
      currentWorkspaceId: activeWorkspaceId,
      loading,
      initialized,
      error,
      setActiveWorkspace: selectWorkspace,
      selectWorkspace,
      refreshWorkspaces,
    }),
    [
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      loading,
      initialized,
      error,
      selectWorkspace,
      refreshWorkspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}

export default WorkspaceContext;
