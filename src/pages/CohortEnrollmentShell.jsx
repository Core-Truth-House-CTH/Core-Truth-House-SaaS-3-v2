import React from "react";
import { ClerkProvider } from "@clerk/react";

// Enrollment needs authentication, but no subscription or workspace gate.
export default function CohortEnrollmentShell({ children }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key?.startsWith("pk_")) return <main>Enrollment authentication is currently unavailable.</main>;
  return <ClerkProvider publishableKey={key} signInUrl="/sign-in" signUpUrl="/sign-up">{children}</ClerkProvider>;
}
