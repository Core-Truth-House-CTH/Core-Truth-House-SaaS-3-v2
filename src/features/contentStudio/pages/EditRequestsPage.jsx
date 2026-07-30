import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Wand2 } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import EstateGate from "../components/EstateGate";
import { Field, FilterTabs, PageHeader, StatusBadge } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { formatDate } from "../components/Cards";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import { createEditRequest, listEditRequests } from "../api/contentStudioApi";
import {
  EDIT_STYLE_PREFERENCES,
  editRequestCreateSchema,
  validate,
} from "../schemas/contentStudioSchemas";

/** Approved screen 11 — Request Edit, plus the request list. */

const FILTERS = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function RequestForm({ initialMediaId, onSubmitted }) {
  const [form, setForm] = useState({
    media_id: initialMediaId || "",
    instructions: "",
    style_preference: "natural",
    priority: "standard",
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const creation = useMutation((payload) => createEditRequest(payload));

  const submit = async (event) => {
    event.preventDefault();
    setNotice(null);
    const result = validate(editRequestCreateSchema, form);
    setErrors(result.errors);
    if (!result.ok) return;

    const outcome = await creation.mutate(result.data);
    if (outcome.ok) {
      setForm({ media_id: "", instructions: "", style_preference: "natural", priority: "standard" });
      setNotice("Edit request submitted and queued.");
      onSubmitted();
    }
  };

  return (
    <form className="cs-card cs-card-pad" onSubmit={submit} noValidate style={{ maxWidth: 620 }}>
      <h2 className="cs-h2" style={{ fontSize: 19, marginBottom: 14 }}>
        Request an edit
      </h2>

      <Field
        label="Media ID"
        error={errors.media_id}
        required
        hint="The ID of generated media or an uploaded asset in this workspace."
      >
        <input
          className="cs-input"
          value={form.media_id}
          onChange={(e) => setForm((p) => ({ ...p, media_id: e.target.value }))}
        />
      </Field>

      <Field label="Edit instructions" error={errors.instructions} required>
        <textarea
          className="cs-textarea"
          style={{ minHeight: 140 }}
          value={form.instructions}
          onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
          placeholder="Describe the change you need…"
        />
      </Field>

      <div className="cs-grid cs-grid-2">
        <Field label="Style preference" error={errors.style_preference}>
          <select
            className="cs-select"
            value={form.style_preference}
            onChange={(e) => setForm((p) => ({ ...p, style_preference: e.target.value }))}
          >
            {EDIT_STYLE_PREFERENCES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </Field>

        <Field label="Priority" error={errors.priority}>
          <select
            className="cs-select"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="standard">Standard</option>
            <option value="priority">Priority</option>
          </select>
        </Field>
      </div>

      {creation.error ? <ErrorState error={creation.error} compact /> : null}
      {notice ? (
        <p role="status" style={{ fontSize: 13, color: "var(--cs-status-active)", marginTop: 10 }}>
          {notice}
        </p>
      ) : null}

      <button type="submit" className="cs-btn cs-btn-primary" style={{ marginTop: 16 }} disabled={creation.busy}>
        {creation.busy ? "Submitting…" : "Submit Edit Request"}
      </button>
    </form>
  );
}

function EditRequestsInner() {
  const [params] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const status = filter === "all" ? undefined : filter;
  const resource = useAsyncResource(() => listEditRequests({ status }), [status]);
  const items = resource.data?.edit_requests || [];

  return (
    <div className="cs-page">
      <PageHeader title="Edit Requests" subtitle="Ask the studio to refine your media." />

      <div style={{ marginBottom: 30 }}>
        <EstateGate feature="Submitting edit requests" mode="block">
          <RequestForm initialMediaId={params.get("mediaId")} onSubmitted={resource.reload} />
        </EstateGate>
      </div>

      <section aria-labelledby="cs-requests-heading">
        <h2 id="cs-requests-heading" className="cs-h2" style={{ fontSize: 19, marginBottom: 12 }}>
          Your requests
        </h2>

        <FilterTabs tabs={FILTERS} value={filter} onChange={setFilter} label="Filter edit requests" />

        {resource.loading ? (
          <LoadingState label="Loading requests" rows={2} />
        ) : resource.error ? (
          <ErrorState error={resource.error} onRetry={resource.reload} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filter === "all" ? "No edit requests yet" : `No ${filter} requests`}
            description="Submitted edits appear here with their status."
            icon={Wand2}
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {items.map((item) => (
              <li key={item.id} className="cs-card cs-card-pad">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, margin: 0, color: "var(--cs-ink)" }}>{item.instructions}</p>
                    <p style={{ fontSize: 11.5, color: "var(--cs-ruby)", margin: "5px 0 0" }}>
                      Media {item.media_id} · {item.style_preference} · {item.priority} ·{" "}
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function EditRequestsPage() {
  return (
    <ContentStudioShell title="Edit requests">
      <EditRequestsInner />
    </ContentStudioShell>
  );
}
