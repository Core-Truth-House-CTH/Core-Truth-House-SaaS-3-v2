import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import apiClient from "../lib/apiClient";
import { useWorkspace } from "./WorkspaceContext";

const BrandHealthContext = createContext(null);

export function BrandHealthProvider({ children }) {
  const { activeWorkspaceId } = useWorkspace();

  const [healthData, setHealthData] = useState(null);
  // Which workspace the data above was fetched for. Kept in state (not a ref)
  // so consumers re-render the moment the two stop matching.
  const [healthWorkspaceId, setHealthWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const refreshCallbacks = useRef([]);
  // Monotonic id of the latest brand-health request; same reviewed guard the
  // dashboard loaders use.
  const requestRef = useRef(0);

  const registerRefreshCallback = useCallback((fn) => {
    if (typeof fn !== "function") return () => {};
    refreshCallbacks.current.push(fn);
    return () => {
      refreshCallbacks.current = refreshCallbacks.current.filter((f) => f !== fn);
    };
  }, []);

  const refresh = useCallback(async () => {
    // Capture the workspace this request belongs to, and claim a generation
    // before anything else - including the no-workspace branch - so a workspace
    // switch or sign-out retires whatever is still in flight.
    const workspaceId = activeWorkspaceId;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const isStale = () => requestRef.current !== requestId;

    if (!workspaceId) {
      setHealthData(null);
      setHealthWorkspaceId(null);
      setLastFetched(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Send the captured workspace explicitly. apiClient only falls back to the
      // ambient workspace when the header is absent, so this pins the response
      // to the workspace the request was started for.
      const res = await apiClient.get("/api/brand-health", {
        headers: { "X-Workspace-ID": String(workspaceId) },
      });
      if (isStale()) return;
      setHealthData(res || null);
      setHealthWorkspaceId(workspaceId);
      setLastFetched(Date.now());
    } catch (err) {
      if (isStale()) return;
      console.error("Brand health fetch failed", err);
    } finally {
      if (!isStale()) setLoading(false);
    }

    // Fan-out: notify every registered dashboard panel that score data has changed.
    // Errors in one callback don't block the others. A retired request returns
    // above, so stale responses never trigger the fan-out.
    refreshCallbacks.current.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Brand health refresh callback failed", err);
      }
    });
  }, [activeWorkspaceId]);

  useEffect(() => {
    refresh();

    // Retire the in-flight generation when the workspace changes or the provider
    // unmounts, so a late response cannot write to the new workspace's screen.
    return () => {
      requestRef.current += 1;
    };
  }, [refresh]);

  // Never hand out health data belonging to a different workspace. Until the
  // request for the current workspace lands, consumers see null rather than the
  // previous workspace's module percentages.
  const scopedHealthData =
    healthWorkspaceId && healthWorkspaceId === activeWorkspaceId ? healthData : null;

  return (
    <BrandHealthContext.Provider
      value={{
        healthData: scopedHealthData,
        loading,
        refresh,
        lastFetched,
        registerRefreshCallback,
      }}
    >
      {children}
    </BrandHealthContext.Provider>
  );
}

export function useBrandHealth() {
  const ctx = useContext(BrandHealthContext);
  if (!ctx) {
    throw new Error("useBrandHealth must be used inside BrandHealthProvider");
  }
  return ctx;
}
