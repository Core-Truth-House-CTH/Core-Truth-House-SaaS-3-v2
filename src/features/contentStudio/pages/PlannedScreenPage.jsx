import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import { PageHeader } from "../components/Primitives";

/**
 * Honest placeholder for approved screens that are routed but not yet built.
 *
 * These screens are deliberately out of scope for this implementation session
 * (see the session stop-point list). Rather than shipping a mock that looks
 * finished, each states exactly what is missing and what it is waiting on, so
 * nothing here can be mistaken for working functionality.
 */
export default function PlannedScreenPage({ title, subtitle, summary, dependsOn = [], backTo = "/content-studio" }) {
  return (
    <ContentStudioShell title={title}>
      <div className="cs-page">
        <PageHeader title={title} subtitle={subtitle} eyebrow="Planned" />

        <section className="cs-card cs-card-pad" style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Compass size={18} aria-hidden="true" style={{ color: "var(--cs-tuscany)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h2 className="cs-h2" style={{ fontSize: 18, marginBottom: 8 }}>
                Not built yet
              </h2>
              <p style={{ fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.65, margin: 0 }}>{summary}</p>

              {dependsOn.length > 0 ? (
                <>
                  <p className="cs-h3" style={{ margin: "16px 0 7px" }}>
                    Waiting on
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 17, fontSize: 12.5, color: "var(--cs-ruby)", lineHeight: 1.75 }}>
                    {dependsOn.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              <Link to={backTo} className="cs-btn cs-btn-secondary" style={{ marginTop: 20 }}>
                Back to Content Studio
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ContentStudioShell>
  );
}
