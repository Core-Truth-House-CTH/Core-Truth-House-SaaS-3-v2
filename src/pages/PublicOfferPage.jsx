import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getWorkspaceSlugFromHost } from "../utils/subdomain";

// Fully public, standalone offer page. No DashboardLayout, no auth, no sidebar.
// Renders an offer branded entirely to the tenant's identity — intentionally
// free of Core Truth House design tokens (the only CTH mark is the footer).

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://api.coretruthhouse.com"
).replace(/\/$/, "");

// Brand-neutral fallbacks used only when the tenant has no identity configured.
const FALLBACK_PRIMARY = "#5d0012";
const FALLBACK_BG = "#ffffff";
const FALLBACK_TEXT = "#1a1a1a";
const FALLBACK_HEADING_FONT = "'Cormorant Garamond', Georgia, serif";
const FALLBACK_BODY_FONT = "'DM Sans', system-ui, sans-serif";

const CADENCE_SUFFIX = {
  "one-time": "one-time",
  monthly: "/ month",
  quarterly: "/ quarter",
  annual: "/ year",
};

function formatPrice(price, cadence) {
  const value = Number(price) || 0;
  if (value <= 0) return "";
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const suffix = CADENCE_SUFFIX[cadence] || "";
  return `$${formatted}${suffix ? ` ${suffix}` : ""}`;
}

// Best-effort: load brand font families from Google Fonts so headings/body
// actually render in the tenant's typefaces when they are Google families.
// Silently a no-op for non-Google or already-loaded fonts.
function useBrandFonts(headingFont, bodyFont) {
  useEffect(() => {
    const families = [headingFont, bodyFont]
      .filter(Boolean)
      .map((f) => String(f).replace(/['"]/g, "").split(",")[0].trim())
      .filter(Boolean);
    if (!families.length) return undefined;

    const params = families
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.brandFonts = "1";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch (_) {
        /* already gone */
      }
    };
  }, [headingFont, bodyFont]);
}

function Spinner({ color }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: FALLBACK_BG,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `3px solid rgba(0,0,0,0.10)`,
          borderTopColor: color || FALLBACK_PRIMARY,
          animation: "cth-offer-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes cth-offer-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Unavailable() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 24,
        textAlign: "center",
        background: FALLBACK_BG,
        color: FALLBACK_TEXT,
        fontFamily: FALLBACK_BODY_FONT,
      }}
    >
      <h1 style={{ fontFamily: FALLBACK_HEADING_FONT, fontSize: 30, margin: 0, fontWeight: 600 }}>
        This offer is not available
      </h1>
      <p style={{ margin: 0, color: "rgba(0,0,0,0.55)", fontSize: 15 }}>
        The link may be incorrect, or this offer is no longer published.
      </p>
      <PoweredByFooter />
    </div>
  );
}

function PoweredByFooter() {
  return (
    <footer style={{ marginTop: 40, textAlign: "center", padding: "28px 16px" }}>
      <a
        href="https://coretruthhouse.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: FALLBACK_BODY_FONT,
          fontSize: 12,
          letterSpacing: "0.04em",
          color: "rgba(0,0,0,0.45)",
          textDecoration: "none",
        }}
      >
        Powered by Core Truth House
      </a>
    </footer>
  );
}

export default function PublicOfferPage() {
  const { workspaceSlug: paramWorkspaceSlug, offerSlug } = useParams();

  // Two routing modes resolve to the same offer:
  //   {slug}.coretruthhouse.com/offers/{offerSlug}   -> slug from hostname
  //   coretruthhouse.com/offers/{slug}/{offerSlug}    -> slug from URL param
  // Hostname takes precedence so a subdomain always wins.
  const hostWorkspaceSlug = getWorkspaceSlugFromHost();
  const workspaceSlug = hostWorkspaceSlug || paramWorkspaceSlug;

  const [state, setState] = useState({ status: "loading", data: null });
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null });

    if (!workspaceSlug || !offerSlug) {
      setState({ status: "notfound", data: null });
      return undefined;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/offers/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(offerSlug)}`
        );
        if (!res.ok) {
          if (!cancelled) setState({ status: "notfound", data: null });
          return;
        }
        const data = await res.json();
        if (!cancelled) setState({ status: "ready", data });
      } catch (err) {
        if (!cancelled) setState({ status: "notfound", data: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, offerSlug]);

  const identity = state.data?.brand_identity || {};
  const primary = identity.primary_color || (identity.colors?.[0]?.hex) || FALLBACK_PRIMARY;
  const accent = identity.accent_color || identity.secondary_color || primary;
  const bg = identity.background_color || FALLBACK_BG;
  const text = identity.text_color || FALLBACK_TEXT;
  const headingFont = identity.heading_font
    ? `'${identity.heading_font}', ${FALLBACK_HEADING_FONT}`
    : FALLBACK_HEADING_FONT;
  const bodyFont = identity.body_font
    ? `'${identity.body_font}', ${FALLBACK_BODY_FONT}`
    : FALLBACK_BODY_FONT;

  useBrandFonts(identity.heading_font, identity.body_font);

  const brandName = state.data?.brand_name || "Brand";
  const offer = state.data?.offer || {};

  useEffect(() => {
    if (state.status === "ready" && offer?.name) {
      document.title = `${offer.name} · ${brandName}`;
    }
  }, [state.status, offer?.name, brandName]);

  const priceLabel = useMemo(
    () => formatPrice(offer.price, offer.price_cadence),
    [offer.price, offer.price_cadence]
  );

  if (state.status === "loading") return <Spinner color={primary} />;
  if (state.status === "notfound" || !state.data) return <Unavailable />;

  const hasCheckout = Boolean((offer.checkout_url || "").trim());
  const features = Array.isArray(offer.features) ? offer.features.filter(Boolean) : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: bodyFont,
        "--brand-primary": primary,
        "--brand-accent": accent,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        {/* Header: tenant logo or brand name, centered. No CTH branding. */}
        <header style={{ textAlign: "center", padding: "40px 0 20px" }}>
          {identity.logo_url && !logoFailed ? (
            <img
              src={identity.logo_url}
              alt={brandName}
              onError={() => setLogoFailed(true)}
              style={{ maxHeight: 56, maxWidth: 220, objectFit: "contain", margin: "0 auto" }}
            />
          ) : (
            <span
              style={{
                fontFamily: headingFont,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              {brandName}
            </span>
          )}
        </header>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "20px 0 8px" }}>
          <h1
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
              lineHeight: 1.05,
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            {offer.name}
          </h1>

          {priceLabel ? (
            <div
              style={{
                fontFamily: bodyFont,
                fontSize: 20,
                fontWeight: 600,
                color: primary,
                margin: "0 0 22px",
              }}
            >
              {priceLabel}
            </div>
          ) : null}

          {offer.transformation ? (
            <div
              style={{
                border: `1px solid ${accent}`,
                background: `color-mix(in srgb, ${accent} 8%, transparent)`,
                borderRadius: 14,
                padding: "18px 22px",
                margin: "0 auto 8px",
                maxWidth: 560,
                fontSize: 17,
                lineHeight: 1.55,
                fontFamily: headingFont,
                fontStyle: "italic",
              }}
            >
              {offer.transformation}
            </div>
          ) : null}
        </section>

        {/* Description */}
        {offer.description ? (
          <section style={{ padding: "20px 0" }}>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                margin: 0,
                color: text,
                whiteSpace: "pre-wrap",
              }}
            >
              {offer.description}
            </p>
          </section>
        ) : null}

        {/* Features */}
        {features.length ? (
          <section style={{ padding: "12px 0 8px" }}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {features.map((feature, i) => (
                <li
                  key={`${feature}-${i}`}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 16, lineHeight: 1.5 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      marginTop: 1,
                      borderRadius: "50%",
                      background: primary,
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* CTA */}
        <section style={{ padding: "28px 0 8px" }}>
          {hasCheckout ? (
            <a
              href={offer.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: primary,
                color: "#fff",
                fontFamily: bodyFont,
                fontSize: 17,
                fontWeight: 700,
                padding: "16px 24px",
                borderRadius: 12,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Buy Now
            </a>
          ) : (
            <div
              aria-disabled="true"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "rgba(0,0,0,0.10)",
                color: "rgba(0,0,0,0.45)",
                fontFamily: bodyFont,
                fontSize: 17,
                fontWeight: 700,
                padding: "16px 24px",
                borderRadius: 12,
                cursor: "not-allowed",
                boxSizing: "border-box",
              }}
            >
              Checkout coming soon
            </div>
          )}

          {offer.booking_url ? (
            <a
              href={offer.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 14,
                fontFamily: bodyFont,
                fontSize: 15,
                fontWeight: 500,
                color: primary,
                textDecoration: "none",
              }}
            >
              Book a call
            </a>
          ) : null}
        </section>

        <PoweredByFooter />
      </div>
    </div>
  );
}
