import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  File as FileIcon,
  FileText,
  ImagePlus,
  Loader2,
  Send,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

const CATEGORY_OPTIONS = [
  { value: "brand_asset", label: "Brand Asset (general)" },
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
  other:           { background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)", border: "1px solid var(--cth-command-border)" },
};

const TYPE_CHIP_COLORS = {
  image: "var(--cth-command-gold)",
  document: "var(--cth-command-purple)",
  font: "var(--cth-command-cinnabar)",
  other: "var(--cth-command-muted)",
};

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "document", label: "Documents" },
  { id: "font", label: "Fonts" },
  { id: "other", label: "Other" },
];

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((opt) => opt.value === value)?.label || (value ? value : "Other");
}

function styleForCategory(value) {
  return CATEGORY_STYLES[value] || CATEGORY_STYLES.other;
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

function assetType(asset) {
  const ft = String(asset?.file_type || "").toLowerCase();
  if (ft.startsWith("image/")) return "image";
  if (ft === "application/pdf") return "document";
  if (ft.startsWith("font/") || asset?.category === "font_file") return "font";
  return "other";
}

function extensionOf(filename) {
  const raw = String(filename || "");
  const idx = raw.lastIndexOf(".");
  return idx >= 0 ? raw.slice(idx + 1).toLowerCase() : "";
}

function resolvePreviewUrl(asset) {
  const raw = String(asset?.preview_url || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (typeof apiClient.buildApiUrl === "function") return apiClient.buildApiUrl(raw);
  return raw;
}

// =========================================================
// Sub-components
// =========================================================

function CategoryChip({ value, editable, busy, onChange }) {
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
        {CATEGORY_OPTIONS.map((opt) => (
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

function AssetThumb({ asset, type, url }) {
  if (type === "image" && url) {
    return (
      <img
        src={url}
        alt={asset.label || asset.filename || "Asset"}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
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

function AssetCard({
  asset,
  canDelete,
  busyDelete,
  busyCategory,
  onOpen,
  onDownload,
  onDelete,
  onCategoryChange,
}) {
  const type = assetType(asset);
  const url = resolvePreviewUrl(asset);
  const ext = extensionOf(asset.filename);
  const displayLabel = asset.label || asset.filename || "Untitled";

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
        <AssetThumb asset={asset} type={type} url={url} />
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
          {canDelete ? (
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
        <p className="truncate font-serif text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }} title={displayLabel}>
          {displayLabel}
        </p>
        <div className="flex items-center gap-1.5">
          <CategoryChip
            value={asset.category}
            editable={canDelete}
            busy={busyCategory}
            onChange={onCategoryChange}
          />
          <TypeChip type={type} extension={ext} />
        </div>
        <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--cth-command-muted)" }}>
          <span>{formatFileSize(asset.file_size)}</span>
          <span>{formatDate(asset.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

function UploadModal({ file, category, saving, error, onCategoryChange, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      style={{ background: "rgba(13,0,16,0.55)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            Upload media asset
          </h3>
          <button type="button" onClick={onCancel}
            className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm">
          <div className="rounded-md p-3"
            style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
            <p className="truncate font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }} title={file.name}>
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              {formatFileSize(file.size)}{file.type ? ` · ${file.type}` : ""}
            </p>
          </div>

          <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
            Category
            <select value={category} onChange={(e) => onCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="text-xs" style={{ color: "var(--cth-command-crimson)" }}>{error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ color: "var(--cth-command-muted)" }}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({ asset, onClose, onDownload }) {
  const url = resolvePreviewUrl(asset);
  return (
    <div className="fixed inset-0 z-[1200] flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(13,0,16,0.85)" }} onClick={onClose}>
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button type="button" onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{ background: "var(--cth-command-panel)", color: "var(--cth-command-ink)" }}>
          <Download size={12} /> Download
        </button>
        <button type="button" onClick={onClose}
          className="rounded-full p-1.5" style={{ background: "var(--cth-command-panel)", color: "var(--cth-command-muted)" }}>
          <X size={14} />
        </button>
      </div>
      <img
        src={url}
        alt={asset.label || asset.filename || "Asset"}
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-xs" style={{ color: "var(--cth-command-panel)" }}>
        {asset.label || asset.filename}
      </p>
    </div>
  );
}

// =========================================================
// Main component
// =========================================================

export default function MediaAssets() {
  const { user } = useUser();
  const { isSuperAdmin, userRole } = usePlan();
  const isPlatformAdmin = isSuperAdmin === true || ADMIN_ROLES.includes(userRole);
  const currentUserId = user?.id || "";

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewAsset, setPreviewAsset] = useState(null);

  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [categoryBusyIds, setCategoryBusyIds] = useState(() => new Set());

  const fileInputRef = useRef(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/media-upload/assets");
      setAssets(Array.isArray(response?.assets) ? response.assets : []);
    } catch (err) {
      console.error("Failed to load media assets", err);
      setError(err?.message || "Could not load media assets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const visibleAssets = useMemo(() => {
    if (filterType === "all") return assets;
    return assets.filter((asset) => assetType(asset) === filterType);
  }, [assets, filterType]);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFilePicked(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    setPendingUpload({ file, category: "brand_asset" });
  }

  async function handleConfirmUpload() {
    if (!pendingUpload?.file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", pendingUpload.file);
      formData.append("context", "brand_asset");
      formData.append("category", pendingUpload.category || "brand_asset");

      const url = typeof apiClient.buildApiUrl === "function"
        ? apiClient.buildApiUrl("/api/media-upload/upload-asset")
        : "/api/media-upload/upload-asset";
      const headers = typeof apiClient.getAuthHeaders === "function"
        ? await apiClient.getAuthHeaders({ isFormData: true })
        : {};
      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        let message = `Upload failed (${response.status})`;
        try {
          const parsed = JSON.parse(text);
          if (parsed?.detail) message = parsed.detail;
        } catch { /* not JSON */ }
        throw new Error(message);
      }
      const data = await response.json();
      const now = new Date().toISOString();
      const newAsset = {
        asset_id: data.asset_id,
        filename: data.filename,
        file_type: data.file_type,
        file_size: data.file_size,
        context: "brand_asset",
        category: data.category || pendingUpload.category || "brand_asset",
        label: data.label,
        preview_url: data.preview_url,
        storage_mode: data.storage_mode || "local",
        created_at: now,
        user_id: currentUserId,
      };
      setAssets((current) => [newAsset, ...current]);
      setPendingUpload(null);
    } catch (err) {
      console.error("Upload failed", err);
      setUploadError(err?.message || "Could not upload file.");
    } finally {
      setUploading(false);
    }
  }

  function handleOpenAsset(asset) {
    if (assetType(asset) === "image") {
      setPreviewAsset(asset);
    } else {
      const url = resolvePreviewUrl(asset);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function handleDownload(asset) {
    const url = resolvePreviewUrl(asset);
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = asset.filename || "download";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  async function handleDelete(asset) {
    if (!window.confirm(`Delete "${asset.label || asset.filename}"? This cannot be undone.`)) return;
    setError("");
    setDeletingIds((current) => new Set(current).add(asset.asset_id));
    const snapshot = assets;
    setAssets((current) => current.filter((a) => a.asset_id !== asset.asset_id));
    try {
      await apiClient.delete(`/api/media-upload/assets/${encodeURIComponent(asset.asset_id)}`);
    } catch (err) {
      console.error("Delete failed", err);
      setAssets(snapshot);
      setError(err?.message || "Could not delete asset.");
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(asset.asset_id);
        return next;
      });
    }
  }

  async function handleCategoryChange(asset, nextCategory) {
    if (!nextCategory || nextCategory === asset.category) return;
    setError("");
    setCategoryBusyIds((current) => new Set(current).add(asset.asset_id));
    const snapshot = assets;
    setAssets((current) =>
      current.map((a) => (a.asset_id === asset.asset_id ? { ...a, category: nextCategory } : a))
    );
    try {
      await apiClient.patch(
        `/api/media-upload/assets/${encodeURIComponent(asset.asset_id)}`,
        { category: nextCategory }
      );
    } catch (err) {
      console.error("Category update failed", err);
      setAssets(snapshot);
      setError(err?.message || "Could not update category.");
    } finally {
      setCategoryBusyIds((current) => {
        const next = new Set(current);
        next.delete(asset.asset_id);
        return next;
      });
    }
  }

  const headerAction = (
    <>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePicked} />
      <button
        type="button"
        onClick={handleUploadClick}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
      >
        <Upload size={13} /> Upload asset
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <TopBar
        title="Media Assets"
        subtitle="Logos, references, fonts, and brand assets shared across this workspace."
        action={headerAction}
      />

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
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
                  background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel)",
                  color: active ? "var(--cth-command-panel)" : "var(--cth-command-muted)",
                  border: "1px solid " + (active ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && !assets.length ? (
          <div className="flex items-center gap-2 rounded-xl p-5 text-sm"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Loading assets...
          </div>
        ) : !assets.length ? (
          <section className="rounded-xl p-8 text-center"
            style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}>
            <ImagePlus size={32} className="mx-auto" style={{ color: "var(--cth-command-crimson)" }} />
            <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
              No media assets yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
              Upload your logos, patterns, fonts, watermarks, and reference images. Everything you store here is available to every member of this workspace.
            </p>
            <button
              type="button"
              onClick={handleUploadClick}
              className="mt-5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
            >
              <Upload size={13} /> Upload your first asset
            </button>
          </section>
        ) : !visibleAssets.length ? (
          <p className="rounded-xl p-5 text-center text-sm"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            No assets match this filter.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleAssets.map((asset) => (
              <AssetCard
                key={asset.asset_id}
                asset={asset}
                canDelete={isPlatformAdmin || String(asset.user_id || "") === currentUserId}
                busyDelete={deletingIds.has(asset.asset_id)}
                busyCategory={categoryBusyIds.has(asset.asset_id)}
                onOpen={() => handleOpenAsset(asset)}
                onDownload={() => handleDownload(asset)}
                onDelete={() => handleDelete(asset)}
                onCategoryChange={(next) => handleCategoryChange(asset, next)}
              />
            ))}
          </section>
        )}

        {!loading && assets.length > 0 ? (
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            Showing {visibleAssets.length} of {assets.length} assets.
          </p>
        ) : null}
      </main>

      {pendingUpload ? (
        <UploadModal
          file={pendingUpload.file}
          category={pendingUpload.category}
          saving={uploading}
          error={uploadError}
          onCategoryChange={(value) => setPendingUpload((current) => current ? { ...current, category: value } : current)}
          onCancel={() => { if (!uploading) { setPendingUpload(null); setUploadError(""); } }}
          onSubmit={handleConfirmUpload}
        />
      ) : null}

      {previewAsset ? (
        <ImagePreviewModal
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
          onDownload={() => handleDownload(previewAsset)}
        />
      ) : null}
    </DashboardLayout>
  );
}
