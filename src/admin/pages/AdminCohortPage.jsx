import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, RefreshCw, X } from "lucide-react";
import apiClient from "../../lib/apiClient";

const STATUS_TONES = {
  received: "bg-[var(--cth-surface-info-soft)] text-[var(--cth-info-blue-deep)]",
  approved: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
  paid: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
  rejected: "bg-[var(--cth-admin-panel)] text-[var(--cth-admin-muted)]",
};

const SEAT_TONES = {
  founding: "bg-[color-mix(in_srgb,var(--cth-admin-accent)_14%,var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
  standard: "bg-[color-mix(in_srgb,var(--cth-brand-secondary)_16%,var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
};

function Pill({ tone, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function AdminCohortPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/api/cohort/applications");
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.payload?.detail || err?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleReject = useCallback(
    async (applicationId) => {
      if (!window.confirm("Reject this application? An email will be sent to the applicant.")) return;
      setRejecting(applicationId);
      try {
        await apiClient.post(`/api/cohort/applications/${applicationId}/reject`);
        await fetchApplications();
      } catch (err) {
        window.alert(err?.payload?.detail || err?.message || "Failed to reject application.");
      } finally {
        setRejecting(null);
      }
    },
    [fetchApplications]
  );

  const counts = useMemo(() => {
    const c = { total: applications.length, received: 0, approved: 0, paid: 0, rejected: 0 };
    for (const app of applications) {
      const s = app.status || "received";
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [applications]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--cth-admin-accent)_14%,var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--cth-admin-ink)]">Cohort Applications</h1>
            <p className="mt-1 text-sm text-[var(--cth-admin-muted)]">
              Review applicants for The Core Truth Cohort.
            </p>
          </div>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-xs text-[var(--cth-admin-ink)] transition hover:bg-[var(--cth-admin-panel)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: counts.total },
          { label: "Received", value: counts.received },
          { label: "Approved", value: counts.approved },
          { label: "Paid", value: counts.paid },
          { label: "Rejected", value: counts.rejected },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--cth-admin-border)] bg-white p-4"
          >
            <div className="text-xs uppercase tracking-wide text-[var(--cth-admin-muted)]">{stat.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--cth-admin-ink)]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--cth-admin-border)] px-5 py-4">
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">Applications</div>
          <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">Newest first.</div>
        </div>

        {error ? (
          <div className="p-5 text-sm text-[var(--cth-status-error-deep)]">{error}</div>
        ) : loading ? (
          <div className="p-5 text-sm text-[var(--cth-admin-muted)]">Loading…</div>
        ) : applications.length === 0 ? (
          <div className="p-5 text-sm text-[var(--cth-admin-muted)]">No applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--cth-admin-border)] text-sm">
              <thead className="bg-[var(--cth-admin-panel)] text-left text-xs uppercase tracking-wide text-[var(--cth-admin-muted)]">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Seat</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cth-admin-border)]">
                {applications.map((app) => {
                  const status = app.status || "received";
                  const seat = app.seat_type || "founding";
                  const isRejected = status === "rejected";
                  return (
                    <tr key={app.application_id} className="text-[var(--cth-admin-ink)]">
                      <td className="px-5 py-4">
                        <div className="font-medium">{app.name}</div>
                        <div className="text-xs text-[var(--cth-admin-muted)]">{app.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone={SEAT_TONES[seat] || SEAT_TONES.founding}>{seat}</Pill>
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone={STATUS_TONES[status] || STATUS_TONES.received}>{status}</Pill>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--cth-admin-muted)]">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleReject(app.application_id)}
                          disabled={isRejected || rejecting === app.application_id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cth-admin-border)] px-3 py-1.5 text-xs text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-admin-panel)] disabled:opacity-40"
                        >
                          <X size={13} />
                          {rejecting === app.application_id ? "Rejecting…" : "Reject"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
