import React from "react";
import AuthShell from "../components/AuthShell";

/*
 * Stage 1: Command Center under the new shared shell.
 * Placeholder body only. The real Command Center content is rebuilt in a
 * later section. The live /command-center route is untouched.
 */
export default function CommandCenterNext() {
  return (
    <AuthShell activeNav="command-center">
      <main className="as-placeholder">
        <span className="as-eyebrow">Command Center</span>
        <h1>Command Center</h1>
        <p>
          The new Command Center shell is in place. Its content is built in a later
          section. This placeholder confirms the shared top bar and full-width
          page frame render correctly.
        </p>
      </main>
    </AuthShell>
  );
}
