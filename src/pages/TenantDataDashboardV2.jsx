/**
 * TenantDataDashboardV2.jsx
 * Core Truth House OS — Workspace Library
 *
 * Single file-management surface for the workspace. Reads BOTH the documents
 * collection (/api/documents) and the media_assets collection
 * (/api/media-upload/assets), normalizes them into one card grid that mirrors
 * the former Media Assets page:
 *   - card grid + type filter chips + category badges
 *   - image preview lightbox (authenticated blob URLs)
 *   - authenticated blob downloads
 *   - inline category editing (routed to the right backend by origin)
 *   - upload with category selector (routed to the right collection by type)
 *   - Export Workspace Data + summary counts
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  File as FileIcon,
  FileText,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

// =========================================================
// Category vocabularies (two collections, two vocabularies)
// =========================================================

// media_assets vocabulary (matches media_upload backend)
const MEDIA_CATEGORY_OPTIONS = [
  { value: "brand_asset", label: "Brand Asset" },
  { value: "logo_light", label: "Logo (Light)" },
  { value: "logo_dark", label: "Logo (Dark)" },
  { value: "icon", label: "Icon" },
  { value: "pattern", label: "Pattern" },
  { value: "watermark", label: "Watermark" },
  { value: "font_file", label: "Font" },
  { value: "reference_image", label: "Reference Image" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

// documents vocabulary
const DOC_CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "document", label: "Document" },
  { value: "content", label: "Content" },
  { value: "brand", label: "Brand Data" },
];

const CATEGORY_LABELS = {
  brand_asset: "Brand Asset",
  logo_light: "Logo (Light)",
  logo_dark: "Logo (Dark)",
  icon: "Icon",
  pattern: "Pattern",
  watermark: "Watermark",
  font_file: "Font",
  reference_image: "Reference",
  document: "Document",
  other: "Other",
  general: "General",
  brand: "Brand Data",
  content: "Content",
  media: "Media",
};

const CATEGORY_STYLES = {
  brand_asset:     { background: "var(--cth-command-muted)",      color: "var(--cth-command-panel)" },
  logo_light:      { background: "var(--cth-command-gold)",       color: "var(--cth-command-ink)" },
  logo_dark:       { background: "var(--cth-command-ink)",        color: "var(--cth-command-panel)" },
  icon:            { background: "var(--cth-command-purple)",     color: "var(--cth-command-panel)" },
  pattern:         { background: "var(--cth-command-cinnabar)",   color: "var(--cth-command-panel)" },
  watermark:       { background: "var(--cth-command-crimson)",    color: "var(--cth-command-panel)" },
  font_file:       { background: "var(--cth-command-purple)",     color: "var(--cth-command-panel)" },
  reference_image: { background: "var(--cth-command-muted)",      color: "var(--cth-command-panel)" },
  document:        { background: "var(--cth-command-purple)",     color: "var(--cth-command-panel)" },
  general:         { background: "var(--cth-command-muted)",      color: "var(--cth-command-panel)" },
  brand:           { background: "var(--cth-command-gold)",       color: "var(--cth-command-ink)" },
  content:         { background: "var(--cth-command-cinnabar)",   color: "var(--cth-command-panel)" },
  media:           { background: "var(--cth-command-gold)",       color: "var(--cth-command-ink)" },
  other:           { background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)", border: "1px solid var(--cth-command-border)" },
};

function categoryLabel(value) {
  return CATEGORY_LABELS[value] || (value ? value : "Other");
}

function styleForCategory(value) {
  return CATEGORY_STYLES[value] || CATEGORY_STYLES.other;
}

const TYPE_CHIP_COLORS = {
  image: "var(--cth-command-gold)",
  document: "var(--cth-command-purple)",
  font: "var(--cth-command-cinnabar)",
  report: "var(--cth-command-gold)",
  other: "var(--cth-command-muted)",
};

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "document", label: "Documents" },
  { id: "font", label: "Fonts" },
  { id: "report", label: "Reports" },
  { id: "other", label: "Other" },
];

// Read-only labels for generated report artifacts (saved_reports.type).
const REPORT_TYPE_LABELS = {
  brand_kit_zip: "Brand Kit (ZIP)",
  brand_kit_pdf: "Brand Kit (PDF)",
  brand_guidelines: "Brand Guidelines",
  brand_foundation_report: "Brand Foundation Report",
};

function reportTypeLabel(value) {
  return REPORT_TYPE_LABELS[value] || "Report";
}

// Widened document detection: pdf/doc/docx/csv/txt/xls/xlsx all read as "document".
const DOC_EXTS = new Set(["pdf", "doc", "docx", "csv", "txt", "xls", "xlsx", "ppt", "pptx", "rtf", "odt", "ods"]);
const FONT_EXTS = new Set(["ttf", "otf", "woff", "woff2", "eot"]);

// =========================================================
// Helpers
// =========================================================

function extensionOf(filename) {
  const raw = String(filename || "");
  const idx = raw.lastIndexOf(".");
  return idx >= 0 ? raw.slice(idx + 1).toLowerCase() : "";
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
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

// Classify any item (either origin) into a filter bucket.
function itemType(item) {
  // Reports are generated artifacts — bucket by origin, not by mime, so a
  // PDF/ZIP report never leaks into the Documents/Other chips.
  if (item?.origin === "report") return "report";
  const mime = String(item?.mime || "").toLowerCase();
  const ext = extensionOf(item?.filename);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("font/") || FONT_EXTS.has(ext) || item?.category === "font_file") return "font";
  if (
    mime === "application/pdf" ||
    mime === "text/plain" ||
    mime === "text/csv" ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    DOC_EXTS.has(ext)
  ) {
    return "document";
  }
  return "other";
}

// Where a freshly picked file should be stored: images + fonts -> media_assets,
// everything else (pdf/doc/csv/txt/xlsx/...) -> documents.
function uploadTargetFor(file) {
  const mime = String(file?.type || "").toLowerCase();
  const ext = extensionOf(file?.name);
  if (mime.startsWith("image/") || mime.startsWith("font/") || FONT_EXTS.has(ext)) {
    return "media";
  }
  return "document";
}

// Normalize a media_assets record into the unified card shape.
function normalizeMedia(a = {}) {
  return {
    origin: "media",
    id: a.asset_id || a.id || "",
    name: a.label || a.filename || "Untitled",
    filename: a.filename || a.stored_filename || "media",
    mime: a.file_type || "",
    size: a.file_size || 0,
    category: a.category || "other",
    created_at: a.created_at || "",
    previewPath: a.preview_url || "",
    ownerId: a.user_id || "",
    raw: a,
  };
}

// Normalize a documents record into the unified card shape.
function normalizeDoc(d = {}) {
  const id = d.document_id || d.id || "";
  return {
    origin: "document",
    id,
    name: d.title || d.original_filename || d.filename || "Untitled Document",
    filename: d.original_filename || d.filename || d.title || "document",
    mime: d.content_type || d.mime_type || "",
    size: d.size_bytes || d.file_size || 0,
    category: d.category || "general",
    created_at: d.created_at || "",
    previewPath: d.file_url || (id ? `/api/documents/${id}/download` : ""),
    ownerId: d.created_by || d.user_id || "",
    raw: d,
  };
}

// Normalize a saved_reports record into the unified card shape.
// origin "report": read-only generated artifact (no category editing).
function normalizeReport(r = {}) {
  return {
    origin: "report",
    id: r.id || "",
    name: r.name || reportTypeLabel(r.type) || r.filename || "Report",
    filename: r.filename || "report",
    mime: r.content_type || "",
    size: r.file_size || 0,
    reportType: r.type || "",
    category: r.type || "",
    created_at: r.created_at || "",
    previewPath: r.download_url || (r.filename ? `/api/export/download/${encodeURIComponent(r.filename)}` : ""),
    ownerId: r.user_id || "",
    raw: r,
  };
}

function useAuthedBlobUrl(path) {
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    if (!path) {
      setBlobUrl("");
      return undefined;
    }
    // Absolute non-API URL (e.g. CDN) — use directly.
    if (/^https?:\/\//i.test(path) && !path.includes("/api/")) {
      setBlobUrl(path);
      return undefined;
    }

    let cancelled = false;
    let createdUrl = "";

    (async () => {
      try {
        const fullUrl = typeof apiClient.buildApiUrl === "function" ? apiClient.buildApiUrl(path) : path;
        const headers = typeof apiClient.getAuthHeaders === "function" ? await apiClient.getAuthHeaders() : {};
        const response = await fetch(fullUrl, { method: "GET", headers, credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        createdUrl = window.URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load authed preview:", err);
          setBlobUrl("");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) window.URL.revokeObjectURL(createdUrl);
    };
  }, [path]);

  return blobUrl;
}

// =========================================================
// Sub-components
// =========================================================

function CategoryChip({ value, options, editable, busy, onChange }) {
  const [editing, setEditing] = useState(false);
  const style = styleForCategory(value);

  if (editing && editable) {
    return (
      <select
        autoFocus
        value={value || "other"}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setEditing(false);
        }}
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] outline-none"
        style={style}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (editable) setEditing(true);
      }}
      disabled={!editable || busy}
      title={editable ? "Click to change category" : ""}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:cursor-default"
      style={style}
    >
      {busy ? <Loader2 size={9} className="animate-spin" /> : null}
      {categoryLabel(value)}
    </button>
  );
}

function TypeChip({ type, extension }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
      style={{ background: TYPE_CHIP_COLORS[type] || TYPE_CHIP_COLORS.other, color: "var(--cth-command-panel)" }}
    >
      {extension || type}
    </span>
  );
}

function ItemThumb({ item, type }) {
  const imagePath = type === "image" ? String(item?.previewPath || "") : "";
  const blobUrl = useAuthedBlobUrl(imagePath);

  if (type === "image") {
    if (blobUrl) {
      return <img src={blobUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />;
    }
    return (
      <div className="absolute inset-0 grid place-items-center">
        <Loader2 size={20} className="animate-spin" style={{ color: TYPE_CHIP_COLORS.image }} />
      </div>
    );
  }

  const Icon = type === "document" ? FileText : type === "font" ? Type : FileIcon;
  const iconColor = TYPE_CHIP_COLORS[type] || TYPE_CHIP_COLORS.other;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <Icon size={36} style={{ color: iconColor }} />
    </div>
  );
}

function ItemCard({ item, canManage, busyDelete, busyCategory, onOpen, onDownload, onDelete, onCategoryChange }) {
  const type = itemType(item);
  const ext = extensionOf(item.filename);
  const options = item.origin === "media" ? MEDIA_CATEGORY_OPTIONS : DOC_CATEGORY_OPTIONS;

  return (
    <article
      className="overflow-hidden rounded-xl"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative block aspect-square w-full overflow-hidden"
        style={{ background: "var(--cth-command-blush)", borderBottom: "1px solid var(--cth-command-border)" }}
      >
        <ItemThumb item={item} type={type} />
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(13,0,16,0.55) 100%)" }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            title="Download"
            className="rounded-md p-1.5"
            style={{ background: "rgba(248,244,242,0.92)", color: "var(--cth-command-ink)" }}
          >
            <Download size={12} />
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={busyDelete}
              title="Delete"
              className="rounded-md p-1.5 disabled:opacity-50"
              style={{ background: "rgba(248,244,242,0.92)", color: "var(--cth-command-crimson)" }}
            >
              {busyDelete ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          ) : null}
        </div>
      </button>

      <div className="space-y-1.5 p-2.5">
        <p className="truncate font-serif text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }} title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-1.5">
          {item.origin === "report" ? (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={styleForCategory("document")}
              title="Generated report"
            >
              {reportTypeLabel(item.reportType)}
            </span>
          ) : (
            <CategoryChip
              value={item.category}
              options={options}
              editable={canManage}
              busy={busyCategory}
              onChange={onCategoryChange}
            />
          )}
          <TypeChip type={type} extension={ext} />
        </div>
        <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--cth-command-muted)" }}>
          <span>{formatFileSize(item.size)}</span>
          <span>{formatDate(item.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

function UploadModal({ file, target, category, options, saving, error, onCategoryChange, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ background: "rgba(13,0,16,0.55)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl" style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>Upload file</h3>
          <button type="button" onClick={onCancel} className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm">
          <div className="rounded-md p-3" style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
            <p className="truncate font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }} title={file.name}>{file.name}</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              {formatFileSize(file.size)}{file.type ? ` · ${file.type}` : ""}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
              Stored in {target === "media" ? "media assets" : "documents"}
            </p>
          </div>

          <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
            Category
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {error ? <p className="text-xs" style={{ color: "var(--cth-command-crimson)" }}>{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ color: "var(--cth-command-muted)" }}>Cancel</button>
          <button type="button" onClick={onSubmit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ item, onClose, onDownload }) {
  const blobUrl = useAuthedBlobUrl(String(item?.previewPath || ""));
  return (
    <div className="fixed inset-0 z-[1200] flex flex-col items-center justify-center p-4" style={{ background: "rgba(13,0,16,0.85)" }} onClick={onClose}>
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button type="button" onClick={(e) => { e.stopPropagation(); onDownload(); }} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--cth-command-panel)", color: "var(--cth-command-ink)" }}>
          <Download size={12} /> Download
        </button>
        <button type="button" onClick={onClose} className="rounded-full p-1.5" style={{ background: "var(--cth-command-panel)", color: "var(--cth-command-muted)" }}>
          <X size={14} />
        </button>
      </div>
      {blobUrl ? (
        <img src={blobUrl} alt={item.name} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
      ) : (
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--cth-command-panel)" }} />
      )}
      <p className="mt-3 text-xs" style={{ color: "var(--cth-command-panel)" }}>{item.name}</p>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>{label}</div>
      <div className="mt-0.5 font-serif text-xl font-semibold" style={{ color: "var(--cth-command-ink)" }}>{value}</div>
      {sub ? <div className="text-[10px]" style={{ color: "var(--cth-command-muted)" }}>{sub}</div> : null}
    </div>
  );
}

// =========================================================
// Main component
// =========================================================

export default function TenantDataDashboard() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();
  const { isSuperAdmin, userRole } = usePlan();

  const isPlatformAdmin = isSuperAdmin === true || ADMIN_ROLES.includes(userRole);
  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || "";
  const userId = user?.id || "default";
  const hasContext = Boolean(workspaceId) && userId && userId !== "default";

  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [media, setMedia] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [categoryBusyIds, setCategoryBusyIds] = useState(() => new Set());

  const fileInputRef = useRef(null);

  const flash = useCallback((text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!hasContext) {
      setSummary(null);
      return;
    }
    try {
      const res = await apiClient.get("/api/tenant-data/summary", {
        params: { workspace_id: workspaceId, user_id: userId },
      });
      setSummary(res);
    } catch (err) {
      console.error("Failed to load tenant data summary:", err);
      setSummary(null);
    }
  }, [hasContext, workspaceId, userId]);

  const loadFiles = useCallback(async () => {
    if (!hasContext) {
      setDocuments([]);
      setMedia([]);
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [docRes, mediaRes, reportRes] = await Promise.all([
        apiClient.get(API_PATHS.documents.list({})).catch((e) => {
          console.error("Failed to load documents:", e);
          return { documents: [] };
        }),
        apiClient.get("/api/media-upload/assets").catch((e) => {
          console.error("Failed to load media assets:", e);
          return { assets: [] };
        }),
        apiClient.get("/api/export/saved-reports").catch((e) => {
          console.error("Failed to load saved reports:", e);
          return { reports: [] };
        }),
      ]);
      setDocuments(Array.isArray(docRes?.documents) ? docRes.documents.map(normalizeDoc) : []);
      setMedia(Array.isArray(mediaRes?.assets) ? mediaRes.assets.map(normalizeMedia) : []);
      setReports(Array.isArray(reportRes?.reports) ? reportRes.reports.map(normalizeReport) : []);
    } catch (err) {
      console.error("Failed to load workspace library:", err);
      setError(err?.message || "Could not load workspace library.");
    } finally {
      setLoading(false);
    }
  }, [hasContext]);

  useEffect(() => {
    loadSummary();
    loadFiles();
  }, [loadSummary, loadFiles]);

  const items = useMemo(() => {
    // Option A de-dupe: a report (e.g. brand_guidelines) is also auto-saved into
    // the documents collection. The report card wins — suppress the document
    // whose stored_filename matches a report's filename so it shows once.
    const reportFilenames = new Set(
      reports.map((r) => String(r.raw?.filename || r.filename || "")).filter(Boolean)
    );
    const dedupedDocs = documents.filter(
      (d) => !reportFilenames.has(String(d.raw?.stored_filename || ""))
    );
    const merged = [...dedupedDocs, ...media, ...reports];
    merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return merged;
  }, [documents, media, reports]);

  const visibleItems = useMemo(() => {
    let result = filterType === "all" ? items : items.filter((item) => itemType(item) === filterType);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.filename || "").toLowerCase().includes(q) ||
        String(item.origin === "report" ? reportTypeLabel(item.reportType) : categoryLabel(item.category)).toLowerCase().includes(q) ||
        String(item.category || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, filterType, search]);

  function canManage(item) {
    return isPlatformAdmin || (item.ownerId && String(item.ownerId) === String(user?.id || ""));
  }

  // ---- Export ----
  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const res = await apiClient.get("/api/tenant-data/full-export", {
        params: { workspace_id: workspaceId, user_id: userId },
      });
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-library-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  // ---- Upload (routed by file type) ----
  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFilePicked(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!hasContext) {
      setError("Workspace context is still loading. Try again in a moment.");
      return;
    }
    const target = uploadTargetFor(file);
    setUploadError("");
    setPendingUpload({
      file,
      target,
      category: target === "media" ? "brand_asset" : "document",
    });
  }

  async function uploadToMedia(file, category) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", "brand_asset");
    formData.append("category", category || "brand_asset");
    const url = typeof apiClient.buildApiUrl === "function"
      ? apiClient.buildApiUrl("/api/media-upload/upload-asset")
      : "/api/media-upload/upload-asset";
    const headers = typeof apiClient.getAuthHeaders === "function"
      ? await apiClient.getAuthHeaders({ isFormData: true })
      : {};
    const response = await fetch(url, { method: "POST", headers, credentials: "include", body: formData });
    if (!response.ok) {
      const text = await response.text();
      let msg = `Upload failed (${response.status})`;
      try { const p = JSON.parse(text); if (p?.detail) msg = p.detail; } catch { /* not JSON */ }
      throw new Error(msg);
    }
    return response.json();
  }

  async function uploadToDocuments(file, category) {
    const meta = await apiClient.post(API_PATHS.documents.create, {
      title: file.name,
      description: "",
      category: category || "document",
      tags: [],
      is_public: false,
    });
    const documentId = meta?.document_id || meta?.id;
    if (!documentId) throw new Error("Document record created without an id.");

    const form = new FormData();
    form.append("file", file);
    const url = typeof apiClient.buildApiUrl === "function"
      ? apiClient.buildApiUrl(API_PATHS.documents.uploadBinary(documentId))
      : API_PATHS.documents.uploadBinary(documentId);
    const headers = typeof apiClient.getAuthHeaders === "function"
      ? await apiClient.getAuthHeaders({ isFormData: true })
      : {};
    const response = await fetch(url, { method: "POST", headers, credentials: "include", body: form });
    if (!response.ok) {
      const text = await response.text();
      let msg = `Upload failed (${response.status})`;
      try { const p = JSON.parse(text); if (p?.detail) msg = p.detail; } catch { /* not JSON */ }
      throw new Error(msg);
    }
    return response.json();
  }

  async function handleConfirmUpload() {
    if (!pendingUpload?.file) return;
    setUploading(true);
    setUploadError("");
    try {
      if (pendingUpload.target === "media") {
        await uploadToMedia(pendingUpload.file, pendingUpload.category);
      } else {
        await uploadToDocuments(pendingUpload.file, pendingUpload.category);
      }
      setPendingUpload(null);
      await Promise.all([loadFiles(), loadSummary()]);
      flash("File uploaded");
    } catch (err) {
      console.error("Upload failed", err);
      setUploadError(err?.message || "Could not upload file.");
    } finally {
      setUploading(false);
    }
  }

  // ---- Download / open (authed blob for both origins) ----
  async function fetchBlobUrl(item) {
    const raw = String(item?.previewPath || "");
    if (!raw) return "";
    const fullUrl = typeof apiClient.buildApiUrl === "function" ? apiClient.buildApiUrl(raw) : raw;
    const headers = typeof apiClient.getAuthHeaders === "function" ? await apiClient.getAuthHeaders() : {};
    const response = await fetch(fullUrl, { method: "GET", headers, credentials: "include" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  }

  async function handleOpen(item) {
    if (itemType(item) === "image") {
      setPreviewItem(item);
      return;
    }
    setError("");
    try {
      const objectUrl = await fetchBlobUrl(item);
      if (!objectUrl) return;
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      console.error("Open failed", err);
      setError(err?.message || "Could not open this file.");
    }
  }

  async function handleDownload(item) {
    setError("");
    try {
      const objectUrl = await fetchBlobUrl(item);
      if (!objectUrl) return;
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = item.filename || item.name || "download";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed", err);
      setError(err?.message || "Could not download this file.");
    }
  }

  // ---- Delete (routed by origin) ----
  function removeFromState(item) {
    if (item.origin === "media") {
      setMedia((cur) => cur.filter((m) => m.id !== item.id));
    } else if (item.origin === "report") {
      setReports((cur) => cur.filter((r) => r.id !== item.id));
    } else {
      setDocuments((cur) => cur.filter((d) => d.id !== item.id));
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setError("");
    setDeletingIds((cur) => new Set(cur).add(item.id));
    const docSnapshot = documents;
    const mediaSnapshot = media;
    const reportSnapshot = reports;
    removeFromState(item);
    try {
      if (item.origin === "media") {
        await apiClient.delete(`/api/media-upload/assets/${encodeURIComponent(item.id)}`);
      } else if (item.origin === "report") {
        await apiClient.delete(`/api/export/saved-reports/${encodeURIComponent(item.id)}`);
      } else {
        await apiClient.delete(API_PATHS.documents.delete(item.id));
      }
      await loadSummary();
      flash("File deleted");
    } catch (err) {
      console.error("Delete failed", err);
      setDocuments(docSnapshot);
      setMedia(mediaSnapshot);
      setReports(reportSnapshot);
      setError(err?.message || "Could not delete file.");
    } finally {
      setDeletingIds((cur) => {
        const next = new Set(cur);
        next.delete(item.id);
        return next;
      });
    }
  }

  // ---- Inline category edit (routed by origin) ----
  function patchCategoryInState(item, nextCategory) {
    if (item.origin === "media") {
      setMedia((cur) => cur.map((m) => (m.id === item.id ? { ...m, category: nextCategory } : m)));
    } else {
      setDocuments((cur) => cur.map((d) => (d.id === item.id ? { ...d, category: nextCategory } : d)));
    }
  }

  async function handleCategoryChange(item, nextCategory) {
    if (!nextCategory || nextCategory === item.category) return;
    setError("");
    setCategoryBusyIds((cur) => new Set(cur).add(item.id));
    const docSnapshot = documents;
    const mediaSnapshot = media;
    patchCategoryInState(item, nextCategory);
    try {
      if (item.origin === "media") {
        await apiClient.patch(`/api/media-upload/assets/${encodeURIComponent(item.id)}`, { category: nextCategory });
      } else {
        // documents backend exposes PUT (not PATCH) for updates.
        await apiClient.put(API_PATHS.documents.byId(item.id), { category: nextCategory });
      }
    } catch (err) {
      console.error("Category update failed", err);
      setDocuments(docSnapshot);
      setMedia(mediaSnapshot);
      setError(err?.message || "Could not update category.");
    } finally {
      setCategoryBusyIds((cur) => {
        const next = new Set(cur);
        next.delete(item.id);
        return next;
      });
    }
  }

  const collections = summary?.collections || {};
  const docCount = collections.documents?.count || 0;
  const mediaCount = collections.media_assets?.count || 0;
  const contentCount = collections.content_assets?.count || 0;
  const reportCount = reports.length; // client-side: tenant-data summary does not track saved_reports
  const totalFiles = docCount + mediaCount;

  const headerAction = (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePicked} />
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting || !hasContext}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}
      >
        {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export
      </button>
      <button
        type="button"
        onClick={handleUploadClick}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
      >
        <Upload size={13} /> Upload file
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Workspace Library
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Documents, media, and brand files for this workspace — in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {headerAction}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}><X size={12} /></button>
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-success)", color: "var(--cth-command-ink)" }}>
            {message}
          </div>
        ) : null}

        {/* Summary counts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Files" value={loading && !items.length ? "…" : totalFiles} sub="documents + media" />
          <StatCard label="Documents" value={docCount} sub="document files" />
          <StatCard label="Media Assets" value={mediaCount} sub="images, fonts, logos" />
          <StatCard label="Reports" value={reportCount} sub="generated reports" />
          <StatCard label="Content" value={contentCount} sub="saved content" />
        </div>

        {/* Type filter chips */}
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
                  background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel)",
                  color: active ? "var(--cth-command-panel)" : "var(--cth-command-muted)",
                  border: "1px solid " + (active ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
                }}
              >
                {f.label}
              </button>
            );
          })}
          <div className="relative ml-auto">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--cth-command-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-44 rounded-md py-1 pl-8 pr-2 text-[12px] outline-none transition-[width] focus:w-56"
              style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}
            />
          </div>
          <button
            type="button"
            onClick={() => { loadFiles(); loadSummary(); }}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Grid */}
        {loading && !items.length ? (
          <div className="flex items-center gap-2 rounded-xl p-5 text-sm" style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Loading files...
          </div>
        ) : !items.length ? (
          <section className="rounded-xl p-8 text-center" style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}>
            <ImagePlus size={32} className="mx-auto" style={{ color: "var(--cth-command-crimson)" }} />
            <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>No files yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
              Upload documents, logos, patterns, fonts, and reference images. Images and fonts are stored as media assets; PDFs, docs, and spreadsheets are stored as documents.
            </p>
            <button type="button" onClick={handleUploadClick} className="mt-5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
              <Upload size={13} /> Upload your first file
            </button>
          </section>
        ) : !visibleItems.length ? (
          <p className="rounded-xl p-5 text-center text-sm" style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            No files match this filter.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleItems.map((item) => (
              <ItemCard
                key={`${item.origin}:${item.id}`}
                item={item}
                canManage={canManage(item)}
                busyDelete={deletingIds.has(item.id)}
                busyCategory={categoryBusyIds.has(item.id)}
                onOpen={() => handleOpen(item)}
                onDownload={() => handleDownload(item)}
                onDelete={() => handleDelete(item)}
                onCategoryChange={(next) => handleCategoryChange(item, next)}
              />
            ))}
          </section>
        )}

        {!loading && items.length > 0 ? (
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            Showing {visibleItems.length} of {items.length} files.
          </p>
        ) : null}
      </main>

      {pendingUpload ? (
        <UploadModal
          file={pendingUpload.file}
          target={pendingUpload.target}
          category={pendingUpload.category}
          options={pendingUpload.target === "media" ? MEDIA_CATEGORY_OPTIONS : DOC_CATEGORY_OPTIONS}
          saving={uploading}
          error={uploadError}
          onCategoryChange={(value) => setPendingUpload((cur) => (cur ? { ...cur, category: value } : cur))}
          onCancel={() => { if (!uploading) { setPendingUpload(null); setUploadError(""); } }}
          onSubmit={handleConfirmUpload}
        />
      ) : null}

      {previewItem ? (
        <ImagePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onDownload={() => handleDownload(previewItem)}
        />
      ) : null}
    </DashboardLayout>
  );
}
