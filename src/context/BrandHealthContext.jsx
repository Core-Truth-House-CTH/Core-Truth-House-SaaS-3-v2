import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import apiClient from "../lib/apiClient";

const BrandHealthContext = createContext(null);

export function BrandHealthProvider({ children }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandHealthContext.Provider value={{ healthData, loading, refresh, lastFetched }}>
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
