import { useMemo, useState } from "react";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownToLine, File, FileImage, Search, Upload } from "lucide-react";
import { z } from "zod";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatBytes, formatDateTime, normalizeNumber } from "./workspaceRoutes";
import { errorText } from "./workspaceRecords";
import { Empty, Modal, Pill, SelectField } from "./WorkspacePrimitives";

const uploadSchema = z.object({
  title: z.string().trim().min(2, "Add a clear title."),
  type: z.enum(["document", "image", "video", "template", "report"]),
});

export default function WorkspaceLibraryView({ data }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", type: "document", file: null });

  const items = useMemo(() => [
    ...data.documents.map((item) => ({ ...item, libraryType: "document" })),
    ...data.assets.map((item, index) => ({
      id: String(item?.id || item?._id || `asset-${index}`),
      title: item?.title || item?.name || item?.filename || "Untitled asset",
      filename: item?.filename || item?.original_filename || "",
      type: item?.type || item?.asset_type || item?.mime_type || "asset",
      libraryType: String(item?.type || item?.asset_type || "asset").toLowerCase(),
      size: normalizeNumber(item?.size_bytes || item?.file_size),
      updatedAt: item?.updated_at || item?.created_at || null,
      downloadUrl: item?.url || item?.file_url || "",
    })),
  ], [data.assets, data.documents]);

  const filtered = items.filter((item) => {
    const matchesQuery = !query.trim() ||
      `${item.title} ${item.filename} ${item.type}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery &&
      (type === "all" || item.libraryType.includes(type) || String(item.type).toLowerCase().includes(type));
  });

  const upload = async (event) => {
    event.preventDefault();
    setMessage("");
    const parsed = uploadSchema.safeParse({ title: form.title, type: form.type });
    if (!parsed.success || !form.file) {
      setMessage(parsed.error?.issues?.[0]?.message || "Choose a file to upload.");
      return;
    }

    setSaving(true);
    try {
      const created = await apiClient.post(API_PATHS.documents.create, {
        title: parsed.data.title,
        document_type: parsed.data.type,
        original_filename: form.file.name,
        mime_type: form.file.type || "application/octet-stream",
      });
      const id = created?.id || created?.document_id || created?.document?.id;
      if (!id) throw new Error("The document record was created without an ID.");

      const body = new FormData();
      body.append("file", form.file);
      const headers = await apiClient.getAuthHeaders({ isFormData: true });
      await axios.post(apiClient.buildApiUrl(API_PATHS.documents.uploadBinary(id)), body, {
        headers,
        withCredentials: true,
      });
      setOpen(false);
      setForm({ title: "", type: "document", file: null });
      await data.reload();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const download = async (item) => {
    try {
      if (item.downloadUrl) {
        window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const headers = await apiClient.getAuthHeaders();
      const response = await axios.get(
        apiClient.buildApiUrl(API_PATHS.documents.download(item.id)),
        { headers, withCredentials: true, responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.filename || item.title;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(errorText(error));
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head">
        <div><h2>Library</h2><p>Every result is filtered by the active workspace.</p></div>
        <button className="ws-btn primary" onClick={() => setOpen(true)}><Upload size={16} /> Upload Asset</button>
      </div>
      <div className="ws-filters">
        <label className="ws-search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files, documents, assets, or content" /></label>
        <SelectField value={type} onValueChange={setType} label="Filter library type" options={[
          { value: "all", label: "All types" },
          { value: "document", label: "Documents" },
          { value: "image", label: "Images" },
          { value: "video", label: "Video" },
          { value: "report", label: "Reports" },
          { value: "template", label: "Templates" },
        ]} />
      </div>
      {message ? <div className="ws-inline-message">{message}</div> : null}
      {filtered.length ? (
        <div className="ws-asset-grid">
          {filtered.map((item) => (
            <article key={item.id} className="ws-asset-card">
              <span className="ws-asset-icon">{String(item.type).includes("image") ? <FileImage size={22} /> : <File size={22} />}</span>
              <div><strong>{item.title}</strong><p>{formatDateTime(item.updatedAt)}</p><div className="ws-asset-meta"><Pill>{String(item.type).split("/").pop()}</Pill><span>{item.size ? formatBytes(item.size) : "Size unavailable"}</span></div></div>
              <button className="ws-icon-btn" onClick={() => void download(item)} aria-label={`Download ${item.title}`}><ArrowDownToLine size={17} /></button>
            </article>
          ))}
        </div>
      ) : <Empty title="Your workspace library is empty" description="Upload documents, media, reports, and saved workspace files to begin." />}

      <Modal open={open} onOpenChange={setOpen} title="Upload to Workspace" description="The file will belong only to the active workspace.">
        <form className="ws-form" onSubmit={upload}>
          <label><span>Title</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Asset type</span><SelectField value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))} label="Asset type" options={[
            { value: "document", label: "Document" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
            { value: "template", label: "Template" },
            { value: "report", label: "Report" },
          ]} /></label>
          <label><span>File</span><input type="file" onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} /></label>
          {message ? <div className="ws-inline-message">{message}</div> : null}
          <div className="ws-dialog-actions"><Dialog.Close className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={saving}>{saving ? "Uploading…" : "Upload Asset"}</button></div>
        </form>
      </Modal>
    </article>
  );
}
