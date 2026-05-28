import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Package,
  X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";

const TYPE_META = {
  brand_kit_zip: { label: "Brand Kit (ZIP)", icon: Package },
  brand_kit_pdf: { label: "Brand Kit (PDF)", icon: FileText },
  brand_guidelines: { label: "Brand Guidelines", icon: FileText },
  brand_foundation_report: { label: "Brand Foundation Report", icon: FileText },
};

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "brand_kit_zip", label: "Brand Kit (ZIP)" },
  { id: "brand_kit_pdf", label: "Brand Kit (PDF)" },
  { id: "brand_guidelines", label: "Brand Guidelines" },
  { id: "brand_foundation_report", label: "Brand Foundation Report" },
];

function typeLabel(value) {
  return TYPE_META[value]?.label || value || "Report";
}

function typeIcon(value) {
  return TYPE_META[value]?.icon || FileText;
}

function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
  );
}

async function fetchReportBlobUrl(report) {
  const path = String(report?.download_url || "");
  if (!path) return "";
  const fullUrl = typeof apiClient.buildApiUrl === "function"
    ? apiClient.buildApiUrl(path)
    : path;
  const headers = typeof apiClient.getAuthHeaders === "function"
    ? await apiClient.getAuthHeaders()
    : {};
  const response = await fetch(fullUrl, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}

export default function SavedReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/export/saved-reports");
      setReports(Array.isArray(response?.reports) ? response.reports : []);
    } catch (err) {
      console.error("Failed to load saved reports", err);
      setError(err?.message || "Could not load saved reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const visibleReports = useMemo(() => {
    if (filterType === "all") return reports;
    return reports.filter((report) => report.type === filterType);
  }, [reports, filterType]);

  async function handleDownload(report) {
    const reportId = report?.id;
    if (!reportId) return;
    setError("");
    setDownloadingIds((current) => new Set(current).add(reportId));
    try {
      const objectUrl = await fetchReportBlobUrl(report);
      if (!objectUrl) return;
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = report.filename || report.name || "report";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed", err);
      setError(err?.message || "Could not download this report.");
    } finally {
      setDownloadingIds((current) => {
        const next = new Set(current);
        next.delete(reportId);
        return next;
      });
    }
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Saved Reports"
        subtitle="Every brand kit, PDF, and guidelines export generated for this workspace."
      />

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{
              background: "var(--cth-command-panel-soft)",
              border: "1px solid var(--cth-command-error)",
              color: "var(--cth-command-ink)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--cth-command-error)" }}
            />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              style={{ color: "var(--cth-command-muted)" }}
            >
              <X size={12} />
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = filterType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: active
                    ? "var(--cth-command-crimson)"
                    : "var(--cth-command-panel)",
                  color: active
                    ? "var(--cth-command-panel)"
                    : "var(--cth-command-muted)",
                  border:
                    "1px solid " +
                    (active
                      ? "var(--cth-command-crimson)"
                      : "var(--cth-command-border)"),
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && !reports.length ? (
          <div
            className="flex items-center gap-2 rounded-xl p-5 text-sm"
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
            }}
          >
            <Loader2 size={14} className="animate-spin" /> Loading reports...
          </div>
        ) : !reports.length ? (
          <section
            className="rounded-xl p-8 text-center"
            style={{
              background: "var(--cth-command-panel)",
              border: "1px dashed var(--cth-command-border)",
            }}
          >
            <FileText
              size={32}
              className="mx-auto"
              style={{ color: "var(--cth-command-crimson)" }}
            />
            <h3
              className="mt-3 font-serif text-lg font-semibold"
              style={{ color: "var(--cth-command-ink)" }}
            >
              No reports yet
            </h3>
            <p
              className="mx-auto mt-2 max-w-md text-sm leading-6"
              style={{ color: "var(--cth-command-muted)" }}
            >
              Generated brand kits and guidelines exports show up here. Run an
              export from Brand Foundation, Brand Studio, or Identity Studio to
              fill this page.
            </p>
          </section>
        ) : !visibleReports.length ? (
          <p
            className="rounded-xl p-5 text-center text-sm"
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
            }}
          >
            No reports match this filter.
          </p>
        ) : (
          <section
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
            }}
          >
            <table className="w-full text-left text-sm">
              <thead
                style={{
                  background: "var(--cth-command-panel-soft)",
                  color: "var(--cth-command-muted)",
                }}
              >
                <tr>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderBottom: "1px solid var(--cth-command-border)",
                    }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderBottom: "1px solid var(--cth-command-border)",
                    }}
                  >
                    Type
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderBottom: "1px solid var(--cth-command-border)",
                    }}
                  >
                    Generated
                  </th>
                  <th
                    className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderBottom: "1px solid var(--cth-command-border)",
                    }}
                  >
                    {/* Download column header is intentionally blank */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.map((report, idx) => {
                  const Icon = typeIcon(report.type);
                  const isLast = idx === visibleReports.length - 1;
                  const downloading = downloadingIds.has(report.id);
                  return (
                    <tr key={report.id}>
                      <td
                        className="px-4 py-3"
                        style={{
                          color: "var(--cth-command-ink)",
                          borderBottom: isLast
                            ? "none"
                            : "1px solid var(--cth-command-border)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            size={14}
                            style={{ color: "var(--cth-command-muted)" }}
                          />
                          <span className="font-medium">{report.name}</span>
                        </div>
                        {report.file_size ? (
                          <div
                            className="mt-0.5 text-[11px]"
                            style={{ color: "var(--cth-command-muted)" }}
                          >
                            {formatFileSize(report.file_size)}
                          </div>
                        ) : null}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid var(--cth-command-border)",
                        }}
                      >
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            background: "var(--cth-command-blush)",
                            color: "var(--cth-command-ink)",
                          }}
                        >
                          {typeLabel(report.type)}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{
                          color: "var(--cth-command-muted)",
                          borderBottom: isLast
                            ? "none"
                            : "1px solid var(--cth-command-border)",
                        }}
                      >
                        {formatDate(report.created_at)}
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : "1px solid var(--cth-command-border)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleDownload(report)}
                          disabled={downloading}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                          style={{
                            background: "var(--cth-command-crimson)",
                            color: "var(--cth-command-panel)",
                          }}
                        >
                          {downloading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {!loading && reports.length > 0 ? (
          <p
            className="text-[11px]"
            style={{ color: "var(--cth-command-muted)" }}
          >
            Showing {visibleReports.length} of {reports.length} reports.
          </p>
        ) : null}
      </main>
    </DashboardLayout>
  );
}
