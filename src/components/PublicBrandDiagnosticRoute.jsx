import React, { useCallback } from "react";
import { ClerkProvider } from "@clerk/react";

import ApiClientBootstrap from "./ApiClientBootstrap";
import { useAuth, HAS_CLERK } from "../hooks/useAuth";
import { WorkspaceProvider, useWorkspace } from "../context/WorkspaceContext";
import BrandDiagnosticPage from "../pages/BrandDiagnosticPage";

const CLERK_KEY_RAW = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function DiagnosticPageRuntime() {
  const auth = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const getToken = useCallback(async () => {
    if (typeof auth?.getToken !== "function") return null;
    try {
      return (await auth.getToken()) || null;
    } catch (error) {
      console.error("Failed to retrieve auth token", error);
      return null;
    }
  }, [auth]);

  const getWorkspaceId = useCallback(async () => activeWorkspaceId || null, [activeWorkspaceId]);

  const handleUnauthorized = useCallback((error) => {
    console.warn("Unauthorized diagnostic API response; staying on the diagnostic route.");
  }, []);

  return (
    <ApiClientBootstrap getToken={getToken} getWorkspaceId={getWorkspaceId} onUnauthorized={handleUnauthorized}>
      <BrandDiagnosticPage />
    </ApiClientBootstrap>
  );
}

export default function PublicBrandDiagnosticRoute() {
  const page = (
    <WorkspaceProvider>
      <DiagnosticPageRuntime />
    </WorkspaceProvider>
  );

  if (!HAS_CLERK) return page;

  return (
    <ClerkProvider
      publishableKey={CLERK_KEY_RAW}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/command-center"
    >
      {page}
    </ClerkProvider>
  );
}
