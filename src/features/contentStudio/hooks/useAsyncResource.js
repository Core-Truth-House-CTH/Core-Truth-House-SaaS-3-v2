import { useCallback, useEffect, useRef, useState } from "react";

import { useWorkspace } from "../../../context/WorkspaceContext";
import { classifyApiError } from "../utilities/errors";

/**
 * Fetch-with-state helper used by every Content Studio list screen.
 *
 * Deliberate behaviours:
 *  - On failure `data` is left at its initial value. It NEVER substitutes
 *    placeholder or mock records, so a failed call cannot masquerade as data.
 *  - Every resource is automatically scoped to the active workspace. A
 *    workspace change invalidates the previous request, clears its data, and
 *    starts a replacement request for the new workspace.
 *  - A sequence guard discards stale responses after a workspace or filter
 *    change, preventing an older request from overwriting a newer one.
 */
export function useAsyncResource(loader, deps = [], { initialData = null, enabled = true } = {}) {
  const workspace = useWorkspace() || {};
  const workspaceId = workspace.activeWorkspaceId || workspace.workspaceId || null;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const seq = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const current = ++seq.current;

    // Clear records before the replacement request begins so data from the
    // previous workspace cannot remain visible during a tenant switch.
    setData(initialData);
    setError(null);

    if (!enabled) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const result = await loader();
      if (!mounted.current || current !== seq.current) return null;
      setData(result);
      return result;
    } catch (err) {
      if (!mounted.current || current !== seq.current) return null;
      setError(classifyApiError(err));
      return null;
    } finally {
      if (mounted.current && current === seq.current) setLoading(false);
    }
    // loader identity is controlled by the caller's dep list. workspaceId is
    // always included because every Content Studio API call is tenant-scoped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initialData, workspaceId, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run, setData };
}

/**
 * Guards a mutation against double submission and classifies failures.
 */
export function useMutation(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const mutate = useCallback(
    async (...args) => {
      if (inFlight.current) return { ok: false, duplicate: true };
      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        const data = await fn(...args);
        return { ok: true, data };
      } catch (err) {
        const classified = classifyApiError(err);
        setError(classified);
        return { ok: false, error: classified };
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [fn],
  );

  return { mutate, busy, error, reset: () => setError(null) };
}

export default useAsyncResource;