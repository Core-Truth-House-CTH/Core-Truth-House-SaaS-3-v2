// First-touch marketing attribution capture.
//
// Runs once at app bootstrap (see src/index.jsx), before React Router mounts and
// strips the query string, so it works on public/pre-auth pages (the contact form
// and the brand diagnostic) as well as authenticated ones.
//
// First-touch: the first landing of the session wins. We only write to
// sessionStorage if nothing is stored yet, so mid-site navigation that drops or
// changes the query string never overwrites how the visitor actually arrived.

const STORAGE_KEY = "cth_attribution";

const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

// Capture the current URL's marketing params + referrer + landing path, once.
// Best-effort: never throws, never blocks app boot (sessionStorage can be
// unavailable in private mode or when cookies/storage are disabled).
export function captureUtmsFirstTouch() {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    // First-touch guard: the first landing already wrote attribution; leave it.
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const attribution = {};

    for (const key of UTM_PARAM_KEYS) {
      const value = (params.get(key) || "").trim();
      if (value) attribution[key] = value;
    }

    const referrer = (document.referrer || "").trim();
    if (referrer) attribution.referrer = referrer;

    // Always recorded, so the first landing is locked in even for a direct,
    // no-UTM visit -- that is what makes "first landing wins" hold.
    attribution.landing_path = window.location.pathname || "/";

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution is a nice-to-have; a storage failure must not break the app.
  }
}

// The stored first-touch attribution set, or {} if none/unavailable. Spread into
// an intake payload to forward it to the backend.
export function getStoredAttribution() {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return {};
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
