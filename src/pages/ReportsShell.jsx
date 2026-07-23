import React from "react";
import AuthShell from "../components/AuthShell";
import Analytics from "./Analytics";
import "../styles/reports-shell-bridge.css";

/*
 * Section 1 only: place the existing Reports/Analytics surface beneath the
 * shared authenticated top bar. The report body, data requests, plan gate,
 * and report interactions remain unchanged in this section.
 */
export default function ReportsShell() {
  return (
    <AuthShell activeNav="reports">
      <div className="as-embedded-reports">
        <Analytics />
      </div>
    </AuthShell>
  );
}
