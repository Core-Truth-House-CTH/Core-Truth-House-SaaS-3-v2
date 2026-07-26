import React from "react";
import AuthShell from "../components/AuthShell";

/*
 * Stage 1: Workspace under the new shared shell.
 * Placeholder body only. The real Workspace content is built in a later section.
 */
export default function WorkspacePage() {
  return (
    <AuthShell activeNav="workspace">
      <main className="as-placeholder">
        <span className="as-eyebrow">Workspace Control</span>
        <h1>Workspace</h1>
        <p>
          Everything the House is building, storing, and organizing for your brand.
          The Workspace content is built in a later section. This placeholder
          confirms it renders beneath the same shared shell.
        </p>
      </main>
    </AuthShell>
  );
}
