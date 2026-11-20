import { useCallback, useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import { errorMessage, homeRows, nextStep } from "../lib/foundationSections.mjs";

// The member's Foundation section statuses. enabled=false loads nothing (the Command Center asks only
// for Founding Cohort workspaces).
export function useFoundationSections(enabled = true) {
  const [state, setState] = useState({ sections: [], reviewer: false, loading: enabled, error: "" });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const r = await apiClient.get("/api/foundation/sections");
      setState({ sections: r?.sections || [], reviewer: Boolean(r?.reviewer), loading: false, error: "" });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(e, "Section status could not be loaded.") }));
    }
  }, []);
  useEffect(() => { if (enabled) load(); }, [enabled, load]);
  return { ...state, reload: load };
}

// Foundation Home's rows and "Your next step", in one place for every page that shows them.
// Readiness only tells "In progress" from "Not started"; without it every unsubmitted draft reads Not started.
export function useFoundationProgress(enabled = true) {
  const sectionsState = useFoundationSections(enabled);
  const [readiness, setReadiness] = useState([]);
  const loadReadiness = useCallback(async () => {
    try { const r = await apiClient.get("/api/foundation/readiness"); setReadiness(r?.sections || []); } catch { setReadiness([]); }
  }, []);
  useEffect(() => { if (enabled) loadReadiness(); }, [enabled, loadReadiness]);
  const rows = homeRows(sectionsState.sections, readiness);
  return { ...sectionsState, rows, step: nextStep(rows) };
}
