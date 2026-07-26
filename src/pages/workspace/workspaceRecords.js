import { normalizeNumber, normalizeStatus } from "./workspaceRoutes";

export const errorText = (error) =>
  error?.response?.data?.detail || error?.message || "The request could not be completed.";

export function documentRecord(item, index) {
  return {
    id: String(item?.id || item?.document_id || item?._id || `document-${index}`),
    title: item?.title || item?.original_filename || item?.filename || "Untitled file",
    filename: item?.original_filename || item?.stored_filename || item?.filename || "",
    type: item?.content_type || item?.mime_type || item?.category || item?.type || "document",
    size: normalizeNumber(item?.size_bytes || item?.file_size || item?.size),
    updatedAt: item?.updated_at || item?.created_at || null,
    downloadUrl: item?.file_url || item?.download_url || "",
    raw: item,
  };
}

export function memberRecord(item) {
  const name =
    item?.name || item?.full_name ||
    [item?.first_name, item?.last_name].filter(Boolean).join(" ") ||
    item?.email || "Workspace member";
  return {
    id: String(item?.id || item?.user_id || item?.member_id || name),
    name,
    email: item?.email || "",
    role: item?.role || item?.workspace_role || "member",
    status: item?.status || "active",
    lastActive: item?.last_active_at || item?.last_seen_at || null,
  };
}

export function workRecord(item, source, index) {
  return {
    id: `${source}-${String(item?.id || item?._id || item?.slug || item?.title || index)}`,
    title: item?.title || item?.name || `${source} item`,
    type: item?.type || source,
    owner: item?.owner_name || item?.owner || item?.created_by_name || "Workspace owner",
    status: normalizeStatus(item?.status || item?.state || item?.approval_status),
    dueAt: item?.due_at || item?.due_date || item?.launch_date || null,
    raw: item,
  };
}
