import React, { useEffect, useMemo } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useColors } from "../context/ThemeContext";
import { Layers, ArrowLeft } from "lucide-react";
import { useUser, useClerk, HAS_CLERK } from "../hooks/useAuth";
import { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from "@clerk/react";

let SignIn = null;
let SignUp = null;

if (HAS_CLERK) {
  SignIn = ClerkSignIn;
  SignUp = ClerkSignUp;
}

// CTH crimson — primary accent used across the auth experience.
const CTH_CRIMSON = "#e04e35";

// Shared Clerk appearance so SignUp and SignIn render identically.
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#e04e35",
    colorText: "#2b1040",
    colorTextSecondary: "#763b5b",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#2b1040",
    borderRadius: "18px",
    fontFamily: '"DM Sans", system-ui, sans-serif',
  },
  elements: {
    card: {
      boxShadow: "0 20px 70px rgba(20,15,43,0.10)",
      border: "1px solid #d8c5c3",
      borderRadius: "28px",
    },
    headerTitle: {
      fontFamily: "Georgia, serif",
      letterSpacing: "-0.045em",
      color: "#2b1040",
    },
    headerSubtitle: {
      color: "#763b5b",
    },
    formButtonPrimary: {
      backgroundColor: "#e04e35",
      boxShadow: "0 18px 40px rgba(224,78,53,0.22)",
      borderRadius: "999px",
      fontWeight: 800,
    },
    formFieldInput: {
      borderColor: "#d8c5c3",
      borderRadius: "18px",
      minHeight: "48px",
    },
    footerActionLink: {
      color: "#e04e35",
      fontWeight: 800,
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
          <button onClick={() => navigate("/")} className="cth-auth-back">
            <ArrowLeft size={16} />
            Back to home
          </button>

          <div className="cth-auth-brand">
            <div className="cth-auth-mark">
              <Layers size={24} color="white" />
            </div>
            <div>
              <strong>Core Truth House</strong>
              <span>Brand OS</span>
            </div>
          </div>

          <div className="cth-auth-message">
            <p>Secure workspace access</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
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
          background: #efe7e3 !important;
          color: #2b1040 !important;
        }

        .cth-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background:
            radial-gradient(circle at 16% 18%, rgba(224,78,53,0.14), transparent 28%),
            radial-gradient(circle at 82% 8%, rgba(118,59,91,0.12), transparent 26%),
            linear-gradient(180deg, #efe7e3, #f2e9e5);
          font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .cth-auth-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(43,16,64,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(43,16,64,0.045) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          opacity: 0.72;
        }

        .cth-auth-shell {
          position: relative;
          z-index: 1;
          width: 100vw;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          background: #f8f4f2;
          border: 1px solid #d8c5c3;
          border-radius: 0;
          overflow: hidden;
          box-shadow: none;
        }

        .cth-auth-story {
          background:
            radial-gradient(circle at 24% 20%, rgba(224,78,53,0.22), transparent 32%),
            linear-gradient(145deg, #140f2b, #120717);
          color: #fff;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100vh;
        }

        .cth-auth-back {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          color: #c7a09d;
          cursor: pointer;
          padding: 0;
          font-weight: 850;
        }

        .cth-auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cth-auth-mark {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(248,244,242,0.10);
          border: 1px solid rgba(248,244,242,0.16);
        }

        .cth-auth-brand strong {
          display: block;
          color: #fff;
          font-family: Georgia, serif;
          font-size: 18px;
          line-height: 1.1;
        }

        .cth-auth-brand span {
          display: block;
          margin-top: 4px;
          color: rgba(248,244,242,0.58);
          font-size: 12px;
          font-weight: 800;
        }

        .cth-auth-message p {
          margin: 0 0 14px;
          color: #c7a09d;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .cth-auth-message h1 {
          margin: 0;
          max-width: 440px;
          color: #fff;
          font-family: Georgia, serif;
          font-size: clamp(3rem, 6vw, 5.4rem);
          line-height: 0.96;
          letter-spacing: -0.065em;
        }

        .cth-auth-message span {
          display: block;
          margin-top: 18px;
          color: rgba(248,244,242,0.72);
          font-weight: 750;
          line-height: 1.6;
        }

        .cth-auth-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .cth-auth-proof span {
          border: 1px solid rgba(248,244,242,0.14);
          background: rgba(248,244,242,0.08);
          color: rgba(248,244,242,0.74);
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 850;
        }

        .cth-auth-diagnostic {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cth-auth-diag-greeting {
          color: #c7a09d;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 0.04em;
        }

        .cth-auth-diag-score {
          display: flex;
          align-items: baseline;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cth-auth-diag-score-num {
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(3rem, 6vw, 4.6rem);
          font-weight: 600;
          line-height: 0.9;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .cth-auth-diag-tier {
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${CTH_CRIMSON};
        }

        .cth-auth-diag-challenge {
          color: rgba(248,244,242,0.86);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.5;
        }

        .cth-auth-diag-challenge-label {
          color: rgba(248,244,242,0.58);
          font-weight: 850;
        }

        .cth-auth-diag-motivation {
          margin: 0;
          color: rgba(248,244,242,0.78);
          font-size: 15px;
          font-weight: 750;
          line-height: 1.55;
          max-width: 380px;
        }

        .cth-auth-form-panel {
          background: linear-gradient(180deg, #f8f4f2, #ffffff);
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
          border-radius: 28px;
          box-shadow: 0 20px 70px rgba(20,15,43,0.10);
          border: 1px solid #d8c5c3;
        }

        @media (max-width: 900px) {
          .cth-auth-shell {
            grid-template-columns: 1fr;
            min-height: 100vh;
          }

          .cth-auth-story {
            min-height: auto;
            gap: 34px;
            padding: 34px 24px;
          }

          .cth-auth-form-panel {
            min-height: 58vh;
            padding: 34px 18px;
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

  // redirect_url takes priority; otherwise diagnostic sign-ups land on the
  // personalized welcome.
  const redirectUrl =
    params.get("redirect_url") ||
    (source === "diagnostic" ? "/command-center?welcome=diagnostic" : "/command-center");

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
