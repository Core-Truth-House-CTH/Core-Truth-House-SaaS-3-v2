import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "../components/Auth";
import { rememberClaimToken } from "../lib/lifetimeAccess.mjs";
import CohortClaimPage from "./CohortClaimPage";

// Capture legacy URLs before authentication redirects. Never forward the bearer
// token to Clerk or another HTTP URL; the same-tab session preserves retries.
export default function CohortClaimEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
    const token = fragment.get("cohort_token") || query.get("cohort_token");
    if (token) {
      try { rememberClaimToken(token); } catch { setError(true); return; }
      query.delete("cohort_token");
      navigate(`/cohort/claim${query.size ? `?${query}` : ""}`, { replace: true });
      return;
    }
    setReady(true);
  }, [location.search, location.hash, navigate]);
  if (error) return <p role="alert">Enable session storage to preserve your claim safely, then reopen your link.</p>;
  if (!ready) return <p>Preparing your claim…</p>;
  return <ProtectedRoute><CohortClaimPage /></ProtectedRoute>;
}
