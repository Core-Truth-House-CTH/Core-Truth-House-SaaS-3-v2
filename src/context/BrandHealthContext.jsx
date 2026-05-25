import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import apiClient from "../lib/apiClient";

const BrandHealthContext = createContext(null);

export function BrandHealthProvider({ children }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const refreshCallbacks = useRef([]);

  const registerRefreshCallback = useCallback((fn) => {
    if (typeof fn !== "function") return () => {};
    refreshCallbacks.current.push(fn);
    return () => {
      refreshCallbacks.current = refreshCallbacks.current.filter((f) => f !== fn);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/brand-health");
      setHealthData(res || null);
      setLastFetched(Date.now());
    } catch (err) {
      console.error("Brand health fetch failed", err);
    } finally {
      setLoading(false);
    }

    // Fan-out: notify every registered dashboard panel that score data has changed.
    // Errors in one callback don't block the others.
    refreshCallbacks.current.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Brand health refresh callback failed", err);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandHealthContext.Provider
      value={{ healthData, loading, refresh, lastFetched, registerRefreshCallback }}
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
