import React from "react";

import { DashboardLayout } from "../../../components/Layout";
import { ContentStudioProvider } from "../context/ContentStudioProvider";
import ContentStudioNav from "./ContentStudioNav";
import "../styles/contentStudio.css";

/**
 * Content Studio shell.
 *
 * Composes INSIDE the app's existing DashboardLayout so global navigation,
 * notifications, and Ask The House stay available — the approved editorial nav
 * is added for Content Studio rather than replacing application chrome.
 *
 * This is a children wrapper rather than an <Outlet> layout route because the
 * app resolves routes through a flat path -> component registry
 * (src/navigation/pageRegistry.jsx). Each Content Studio page wraps itself,
 * exactly as the existing ContentStudio.jsx wraps itself in DashboardLayout.
 * Introducing nested layout routes would mean restructuring AppRouter for all
 * 60 routes, which is out of scope for this pass.
 *
 * The `cth-cs` class scopes the approved token set; every descendant resolves
 * --cs-* from here.
 */
export default function ContentStudioShell({ children, title }) {
  return (
    <DashboardLayout>
      <ContentStudioProvider>
        <div className="cth-cs" data-testid="content-studio-shell">
          <ContentStudioNav />
          <main id="content-studio-main" tabIndex={-1} aria-label={title || "Content Studio"}>
            {children}
          </main>
        </div>
      </ContentStudioProvider>
    </DashboardLayout>
  );
}
