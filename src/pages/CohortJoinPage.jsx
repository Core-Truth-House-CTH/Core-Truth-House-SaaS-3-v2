import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import apiClient from "../lib/apiClient";

export default function CohortJoinPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [invite, setInvite] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    document.title = "Claim Your Seat | Core Truth House";
  }, []);

  useEffect(() => {
    if (!token) {
      setErrorMsg("No invite token provided.");
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/api/cohort/invite/${encodeURIComponent(token)}`);
        if (cancelled) return;
        setInvite(data);
        setStatus("valid");
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "This invite link is no longer valid.";
        setErrorMsg(msg);
        setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const wrapper = {
    background: "#EFE7E3",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  };

  const card = {
    maxWidth: "640px",
    width: "100%",
    textAlign: "center",
  };

  const eyebrow = {
    fontSize: "12px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#C4A95B",
    fontWeight: 700,
    marginBottom: "24px",
  };

  const heading = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: "clamp(2rem, 5vw, 3.2rem)",
    lineHeight: 1.05,
    color: "#2B1040",
    margin: "0 0 20px",
    letterSpacing: "-0.02em",
  };

  const body = {
    fontSize: "1.1rem",
    color: "#7C6576",
    lineHeight: 1.7,
    margin: "0 0 16px",
    maxWidth: "520px",
    marginLeft: "auto",
    marginRight: "auto",
  };

  const primaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "0 32px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #AF0024, #E04E35)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    letterSpacing: "0.02em",
    textDecoration: "none",
    boxShadow: "0 12px 28px rgba(175, 0, 36, 0.24)",
  };

  const secondaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "0 32px",
    borderRadius: "999px",
    background: "transparent",
    color: "#2B1040",
    border: "1px solid #2B1040",
    fontWeight: 700,
    fontSize: "0.95rem",
    letterSpacing: "0.02em",
    textDecoration: "none",
  };

  let content;

  if (status === "loading") {
    content = (
      <>
        <p style={eyebrow}>Core Truth House</p>
        <h1 style={heading}>Validating your invite…</h1>
        <p style={body}>One moment while we confirm your seat.</p>
      </>
    );
  } else if (status === "valid") {
    const firstName = invite?.first_name || "there";
    const tierLabel = invite?.cohort_tier === "founding" ? "founding" : "standard";
    const email = invite?.email || "";
    const redirectAfter = `/command-center?cohort_token=${encodeURIComponent(token)}`;
    const signUpHref = email
      ? `/sign-up?redirect_url=${encodeURIComponent(redirectAfter)}&email=${encodeURIComponent(email)}`
      : `/sign-up?redirect_url=${encodeURIComponent(redirectAfter)}`;
    const signInHref = `/sign-in?redirect_url=${encodeURIComponent(redirectAfter)}`;

    content = (
      <>
        <p style={eyebrow}>Core Truth House</p>
        <h1 style={heading}>Welcome, {firstName}.</h1>
        <p style={body}>
          Your {tierLabel} seat is ready. Create your account to access the OS and your cohort channel.
        </p>
        {email ? (
          <p style={{ ...body, fontSize: "0.9rem", marginBottom: "32px" }}>
            Use this email: <strong style={{ color: "#2B1040" }}>{email}</strong>
          </p>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <a href={signUpHref} style={primaryBtn}>
            Create Your Account
          </a>
          <a href={signInHref} style={secondaryBtn}>
            Already have an account? Sign in
          </a>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <p style={eyebrow}>Core Truth House</p>
        <h1 style={heading}>This invite link is no longer valid.</h1>
        <p style={body}>{errorMsg || "The invite may have expired or already been used."}</p>
        <p style={{ ...body, fontSize: "0.95rem", marginTop: "20px" }}>
          Contact{" "}
          <a href="mailto:hello@coretruthhouse.com" style={{ color: "#AF0024" }}>
            hello@coretruthhouse.com
          </a>{" "}
          if you believe this is an error.
        </p>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <main style={wrapper}>
        <div style={card}>{content}</div>
      </main>
      <PublicFooter />
    </>
  );
}
