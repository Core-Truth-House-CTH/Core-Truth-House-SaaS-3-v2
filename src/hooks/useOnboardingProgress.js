import { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import { useWorkspace } from "../context/WorkspaceContext";

// Workspace-scoped cache so the progress isn't refetched on every render or on
// navigation between pages. A new workspace id triggers a fresh fetch; errors are
// intentionally NOT cached so a later mount can retry.
const cache = new Map();

// Map the GET /api/onboarding/progress response to the metrics shape the
// OnboardingChecklist consumes. Each step is complete when its milestone flag is
// true OR its module_completed_at timestamp exists in the progress data.
function mapToMetrics(raw) {
  const data = raw || {};
  const stamped = (key) => Boolean(data[`${key}_completed_at`]);
  return {
    audit_complete: Boolean(data.audit_complete),
    foundation_complete: Boolean(data.foundation_complete),
    messaging_complete: stamped("messaging") || Boolean(data.messaging),
    audience_complete: stamped("audience") || Boolean(data.audience),
    offer_complete:
      stamped("offer") || Boolean(data.offer) || Boolean(data.first_offer_created),
    // Raw payload retained for any future consumers (counts, percentages, etc.).
    _raw: data,
  };
}

const EMPTY_METRICS = mapToMetrics({});

/**
 * Fetches the founder's onboarding progress once per workspace and returns it in
 * the metrics shape OnboardingChecklist expects.
 *
 * @returns {{ metrics: object, loading: boolean }}
 */
export default function useOnboardingProgress() {
  const { activeWorkspaceId } = useWorkspace();
  const [metrics, setMetrics] = useState(() =>
    activeWorkspaceId && cache.has(activeWorkspaceId)
      ? cache.get(activeWorkspaceId)
      : null
  );
  const [loading, setLoading] = useState(
    !(activeWorkspaceId && cache.has(activeWorkspaceId))
  );

  useEffect(() => {
    if (!activeWorkspaceId) return;

    if (cache.has(activeWorkspaceId)) {
      setMetrics(cache.get(activeWorkspaceId));
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    apiClient
      .get("/api/onboarding/progress")
      .then((res) => {
        const raw = res?.data ?? res ?? {};
        const mapped = mapToMetrics(raw);
        cache.set(activeWorkspaceId, mapped); // cache success only
        if (active) {
          setMetrics(mapped);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setMetrics(EMPTY_METRICS);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeWorkspaceId]);

  return { metrics: metrics || EMPTY_METRICS, loading };
}
