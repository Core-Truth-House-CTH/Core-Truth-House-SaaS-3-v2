import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";

function CenteredCard({ children }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--cth-command-blush)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm"
        style={{
          background: "var(--cth-command-panel)",
          border: "1px solid var(--cth-command-border)",
        }}
      >
        {children}
      </div>
    </main>
  );
}

function Heading({ children }) {
  return (
    <h1
      className="font-serif text-2xl font-semibold"
      style={{ color: "var(--cth-command-ink)" }}
    >
      {children}
    </h1>
  );
}

function Subtitle({ children }) {
  return (
    <p
      className="mt-2 text-sm leading-6"
      style={{ color: "var(--cth-command-muted)" }}
    >
      {children}
    </p>
  );
}

export default function JoinWorkspace() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!token) {
      setStatus("invalid-token");
      return;
    }
    if (!isSignedIn) {
      const redirect = encodeURIComponent(`/join?token=${token}`);
      window.location.replace(`/sign-in?redirect_url=${redirect}`);
      return;
    }
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    (async () => {
      setStatus("accepting");
      try {
        await apiClient.post(
          `/api/teams/accept-invite?token=${encodeURIComponent(token)}`
        );
        setStatus("accepted");
        setTimeout(() => navigate("/command-center", { replace: true }), 1200);
      } catch (err) {
        console.error("Accept invite failed", err);
        const statusCode = err?.response?.status;
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Could not accept this invitation.";
        if (statusCode === 403) {
          setStatus("wrong-email");
          setErrorMessage(detail);
        } else if (statusCode === 404) {
          setStatus("invalid-token");
          setErrorMessage(detail);
        } else {
          setStatus("error");
          setErrorMessage(detail);
        }
      }
    })();
  }, [isLoaded, isSignedIn, token, navigate]);

  if (!isLoaded || status === "idle" || status === "accepting") {
    return (
      <CenteredCard>
        <div className="flex items-center gap-3">
          <Loader2
            size={20}
            className="animate-spin"
            style={{ color: "var(--cth-command-crimson)" }}
          />
          <Heading>Joining workspace…</Heading>
        </div>
        <Subtitle>
          Verifying your invitation and adding you to the workspace.
        </Subtitle>
      </CenteredCard>
    );
  }

  if (status === "accepted") {
    return (
      <CenteredCard>
        <div className="flex items-center gap-3">
          <CheckCircle2
            size={22}
            style={{ color: "var(--cth-command-success)" }}
          />
          <Heading>You're in.</Heading>
        </div>
        <Subtitle>Redirecting to your Command Center…</Subtitle>
      </CenteredCard>
    );
  }

  if (status === "invalid-token") {
    return (
      <CenteredCard>
        <div className="flex items-center gap-3">
          <AlertCircle
            size={22}
            style={{ color: "var(--cth-command-error)" }}
          />
          <Heading>Invitation not found</Heading>
        </div>
        <Subtitle>
          {errorMessage ||
            "This invitation link is invalid or has already been used."}
          {" "}Ask the person who invited you to send a new invitation.
        </Subtitle>
      </CenteredCard>
    );
  }

  if (status === "wrong-email") {
    return (
      <CenteredCard>
        <div className="flex items-center gap-3">
          <AlertCircle
            size={22}
            style={{ color: "var(--cth-command-error)" }}
          />
          <Heading>Wrong email</Heading>
        </div>
        <Subtitle>{errorMessage}</Subtitle>
        <Subtitle>
          Sign out and sign back in with the email address this invitation was
          sent to.
        </Subtitle>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <div className="flex items-center gap-3">
        <AlertCircle
          size={22}
          style={{ color: "var(--cth-command-error)" }}
        />
        <Heading>Something went wrong</Heading>
      </div>
      <Subtitle>{errorMessage}</Subtitle>
    </CenteredCard>
  );
}
