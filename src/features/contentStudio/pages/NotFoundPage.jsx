import React from "react";
import { Link } from "react-router-dom";

import ContentStudioShell from "../components/ContentStudioShell";
import { EmptyState } from "../components/States";

/**
 * Controlled fallback for unrecognised /content-studio/* paths.
 *
 * Kept inside the Content Studio shell so the user stays oriented rather than
 * being bounced to the Command Center.
 */
export default function ContentStudioNotFound() {
  return (
    <ContentStudioShell title="Not found">
      <div className="cs-page">
        <EmptyState
          title="That Content Studio page does not exist"
          description="The link may be out of date. Everything in the studio is reachable from the dashboard."
          action={
            <Link to="/content-studio" className="cs-btn cs-btn-primary">
              Back to Content Studio
            </Link>
          }
        />
      </div>
    </ContentStudioShell>
  );
}
