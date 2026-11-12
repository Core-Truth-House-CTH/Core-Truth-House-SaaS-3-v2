import React, { useEffect, useMemo } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useColors } from "../context/ThemeContext";
import { ArrowLeft } from "lucide-react";
import { useUser, useClerk, HAS_CLERK } from "../hooks/useAuth";
import { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from "@clerk/react";

let SignIn = null;
let SignUp = null;

if (HAS_CLERK) {
  SignIn = ClerkSignIn;
  SignUp = ClerkSignUp;
}

// Estate gold — accent used on the dark story panel (tier badge, eyebrow).
const CTH_GOLD = "#c4a95b";

// Shared Clerk appearance so SignUp and SignIn — and every Clerk sub-screen
// (password reset, email/phone verification) — render in the estate system.
// Purely visual: no Clerk behaviour is configured here.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#af0024",
    colorText: "#2b1040",
    colorTextSecondary: "#6b4a63",
    colorBackground: "#fbf7f1",
    colorInputBackground: "#ffffff",
    colorInputText: "#2b1040",
    borderRadius: "4px",
    fontFamily: '"DM Sans", system-ui, sans-serif',
  },
  elements: {
    card: {
      background: "#fbf7f1",
      boxShadow: "0 18px 50px rgba(28,1,34,0.08)",
      border: "1px solid rgba(216,197,195,0.6)",
      borderRadius: "6px",
    },
    headerTitle: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "#33033c",
    },
    headerSubtitle: {
      color: "#6b4a63",
    },
    socialButtonsBlockButton: {
      borderRadius: "4px",
      border: "1px solid rgba(51,3,60,0.18)",
    },
    dividerLine: {
      backgroundColor: "rgba(51,3,60,0.12)",
    },
    formButtonPrimary: {
      backgroundColor: "#af0024",
      color: "#fff7ec",
      boxShadow: "none",
      borderRadius: "4px",
      fontWeight: 600,
      letterSpacing: "0.02em",
      textTransform: "none",
    },
    formFieldInput: {
      borderColor: "rgba(51,3,60,0.18)",
      borderRadius: "4px",
      minHeight: "48px",
    },
    footerActionLink: {
      color: "#af0024",
      fontWeight: 700,
    },
  },
};

// Maps the diagnostic "current challenge" select values to readable labels.
const CHALLENGE_LABELS = {
  visible_not_converting: "Visibility without conversion",
  inconsistent_messaging: "Inconsistent messaging",
  unclear_offer: "Offer clarity",
  content_not_converting: "Content that does not sell",
  brand_depends_on_me: "Brand dependency on you",
  need_operating_system: "No brand operating system",
};

function readableChallenge(value) {
  if (!value) return "";
  return CHALLENGE_LABELS[value] || value;
}

// Tier-specific motivating line shown on the story panel.
const TIER_MOTIVATION = {
  Foundation: "Your foundation is closer than you think.",
  Structure: "The structure you need already exists in your answers.",
  House: "You have built something real. Now make it run.",
  Estate: "You are ready to operate at scale.",
};

function AuthShell({ title, subtitle, children, diagnosticContext }) {
  const navigate = useNavigate();
  const dc = diagnosticContext;

  return (
    <main className="cth-auth-page">
      <section className="cth-auth-shell">
        <div className="cth-auth-story">
          <div className="cth-auth-story-top">
            <button onClick={() => navigate("/")} className="cth-auth-back">
              <ArrowLeft size={16} />
              Back to home
            </button>

            <div className="cth-auth-brand">
              <img src="/estate-assets/cth-seal.webp" alt="" className="cth-auth-mark" />
              <div>
                <strong>Core Truth House</strong>
                <span>Brand Operating System</span>
              </div>
            </div>
          </div>

          <div className="cth-auth-message">
            <span className="cth-auth-eyebrow">Secure workspace access</span>
            <h1>{title}</h1>
            <span className="cth-auth-sub">{subtitle}</span>
          </div>

          {dc ? (
            <div className="cth-auth-diagnostic">
              {dc.first_name ? (
                <div className="cth-auth-diag-greeting">Welcome, {dc.first_name}</div>
              ) : null}
              {dc.score ? (
                <div className="cth-auth-diag-score">
                  <span className="cth-auth-diag-score-num">{dc.score}/60</span>
                  {dc.tier ? (
                    <span className="cth-auth-diag-tier">{dc.tier} Brand</span>
                  ) : null}
                </div>
              ) : null}
              {dc.challenge ? (
                <div className="cth-auth-diag-challenge">
                  <span className="cth-auth-diag-challenge-label">Your biggest gap:</span>{" "}
                  {readableChallenge(dc.challenge)}
                </div>
              ) : null}
              {dc.tier && TIER_MOTIVATION[dc.tier] ? (
                <p className="cth-auth-diag-motivation">{TIER_MOTIVATION[dc.tier]}</p>
              ) : null}
            </div>
          ) : (
            <div className="cth-auth-proof">
              <span>Clarity</span>
              <span>Structure</span>
              <span>Power</span>
            </div>
          )}
        </div>

        <div className="cth-auth-form-panel">
          {children}
        </div>
      </section>

      <style>{`
        body {
          background: #1c0122 !important;
          color: #2b1040 !important;
        }

        .cth-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: #fbf7f1;
          font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .cth-auth-shell {
          position: relative;
          z-index: 1;
          width: 100vw;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 0.94fr 1.06fr;
          background: #fbf7f1;
          overflow: hidden;
        }

        /* ---- story panel: the estate at night ---- */
        .cth-auth-story {
          position: relative;
          isolation: isolate;
          color: #f4ecdf;
          padding: 52px 52px 56px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 40px;
          min-height: 100vh;
          background:
            linear-gradient(180deg, rgba(28,1,34,0.66) 0%, rgba(28,1,34,0.34) 42%, rgba(13,0,16,0.86) 100%),
            url("/estate-assets/login-building.webp") center/cover no-repeat;
        }

        .cth-auth-story::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background-image:
            linear-gradient(rgba(196,169,91,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(196,169,91,0.08) 1px, transparent 1px);
          background-size: 72px 72px;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        .cth-auth-story-top {
          display: flex;
          flex-direction: column;
          gap: 34px;
        }

        .cth-auth-back {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: rgba(244,236,223,0.72);
          cursor: pointer;
          padding: 0;
          font-family: "DM Sans", sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: color 0.2s ease;
        }
        .cth-auth-back:hover { color: #c4a95b; }

        .cth-auth-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .cth-auth-mark {
          width: 46px;
          height: 46px;
          object-fit: contain;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.4));
        }

        .cth-auth-brand strong {
          display: block;
          color: #fff;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 600;
          font-size: 19px;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }

        .cth-auth-brand span {
          display: block;
          margin-top: 5px;
          color: rgba(244,236,223,0.62);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .cth-auth-eyebrow {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          border: 1px solid #c4a95b;
          border-radius: 999px;
          color: #c4a95b;
          padding: 7px 15px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .cth-auth-message h1 {
          margin: 20px 0 0;
          max-width: 460px;
          color: #fff;
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 600;
          font-size: clamp(2.8rem, 5vw, 4.6rem);
          line-height: 1.0;
          letter-spacing: -0.03em;
        }

        .cth-auth-sub {
          display: block;
          margin-top: 20px;
          max-width: 420px;
          color: rgba(244,236,223,0.82);
          font-weight: 500;
          font-size: 16px;
          line-height: 1.6;
        }

        .cth-auth-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .cth-auth-proof span {
          border: 1px solid rgba(196,169,91,0.4);
          background: rgba(28,1,34,0.3);
          color: rgba(244,236,223,0.86);
          border-radius: 999px;
          padding: 9px 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
        }

        .cth-auth-diagnostic {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cth-auth-diag-greeting {
          color: #c4a95b;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
        }

        .cth-auth-diag-score {
          display: flex;
          align-items: baseline;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cth-auth-diag-score-num {
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(3rem, 6vw, 4.4rem);
          font-weight: 600;
          line-height: 0.9;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .cth-auth-diag-tier {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${CTH_GOLD};
        }

        .cth-auth-diag-challenge {
          color: rgba(244,236,223,0.9);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
        }

        .cth-auth-diag-challenge-label {
          color: rgba(244,236,223,0.6);
          font-weight: 600;
        }

        .cth-auth-diag-motivation {
          margin: 0;
          color: rgba(244,236,223,0.82);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.55;
          max-width: 380px;
        }

        /* ---- form panel: cream sheet ---- */
        .cth-auth-form-panel {
          background: #fbf7f1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 46px;
        }

        .cth-auth-form-panel .cl-rootBox {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .cth-auth-form-panel .cl-card {
          width: 100%;
          max-width: 430px;
          border-radius: 6px;
          box-shadow: 0 18px 50px rgba(28,1,34,0.08);
          border: 1px solid rgba(216,197,195,0.6);
        }

        @media (max-width: 900px) {
          .cth-auth-shell {
            grid-template-columns: 1fr;
            min-height: 100vh;
          }

          .cth-auth-story {
            min-height: auto;
            gap: 30px;
            padding: 34px 24px 40px;
          }

          .cth-auth-message h1 {
            font-size: clamp(2.4rem, 9vw, 3.4rem);
          }

          .cth-auth-form-panel {
            min-height: 58vh;
            padding: 40px 18px;
          }
        }
      `}</style>
    </main>
  );
}

export function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  if (!HAS_CLERK) {
    return children;
  }
  if (!isLoaded) {
    return <div style={{ color: "white", padding: 20 }}>Loading...</div>;
  }
  if (!isSignedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect_url=${redirect}`} replace />;
  }
  return children;
}

export function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!HAS_CLERK) {
    return <div style={{ color: "white", padding: 20 }}>Clerk not configured</div>;
  }

  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") || "/command-center";

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={redirectUrl}
        appearance={CLERK_APPEARANCE}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  const { isSignedIn } = useUser();

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const source = params.get("source");

  // Diagnostic context surfaced on the story panel (only the readable fields).
  const diagnosticContext = useMemo(() => {
    if (source !== "diagnostic") return null;
    return {
      tier: params.get("tier") || "",
      score: params.get("score") || "",
      challenge: params.get("challenge") || "",
      first_name: params.get("first_name") || "",
      source,
    };
  }, [params, source]);

  // Persist the full param set immediately on mount so the diagnostic context
  // survives Clerk's sub-route changes during the multi-step sign-up flow.
  useEffect(() => {
    if (source !== "diagnostic") return;
    try {
      const full = {};
      params.forEach((value, key) => {
        full[key] = value;
      });
      sessionStorage.setItem("cth_diagnostic_context", JSON.stringify(full));
    } catch (err) {
      console.error("Failed to persist diagnostic context", err);
    }
  }, [params, source]);

  if (!HAS_CLERK) {
    return <div style={{ color: "white", padding: 20 }}>Clerk not configured</div>;
  }

  // redirect_url takes priority; otherwise diagnostic sign-ups land on billing
  // (with the recommended tier preselected) before the personalized welcome.
  const diagnosticTier = params.get("tier");
  const redirectUrl =
    params.get("redirect_url") ||
    (source === "diagnostic"
      ? (diagnosticTier
          ? `/billing?welcome=diagnostic&tier=${diagnosticTier}`
          : "/billing?welcome=diagnostic")
      : "/command-center");

  if (isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start building"
      diagnosticContext={diagnosticContext}
    >
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={redirectUrl}
        appearance={CLERK_APPEARANCE}
      />
    </AuthShell>
  );
}

export function UserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!HAS_CLERK || !isLoaded || !user) return null;

  return (
    <button
      onClick={async () => {
        await signOut();
        window.location.href = "/sign-in";
      }}
      style={{
        padding: "8px 12px",
        background: "var(--cth-surface-midnight)",
        color: "white",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      Sign Out
    </button>
  );
}
