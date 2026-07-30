/**
 * CRM deal drawer.
 *
 * A flat field list for one deal, opened from the pipeline board. Contacts used
 * to open here too -- that branch (a header, lifecycle bar, metric strip, and
 * tabs over linked records) is gone: contacts now open their own full record
 * page at /crm/contacts/:id, so nothing opens a contact drawer anymore.
 *
 * The deal's Contact row is resolved client-side from the contacts CRMSuite
 * already fetched in loadCRM. No request is made from this file.
 *
 * Edit-in-place: an Edit toggle turns the field list into inputs (title,
 * company, value, stage, close date, probability) and PATCHes only the changed
 * fields via apiPaths.crm.dealById. On success it calls onSaved (loadCRM) so the
 * board and dashboard reflect the change, and keeps a local copy so this drawer
 * shows the new values without waiting to be re-opened.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import apiClient from "../../lib/apiClient";
import API_PATHS from "../../lib/apiPaths";
import {
 SANS,
 SERIF,
 EYEBROW_STYLE,
 INPUT_STYLE,
 PRIMARY_BUTTON_STYLE,
 SECONDARY_BUTTON_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 FieldLabel,
 currency,
 formatDate,
 EmptyValue,
 DetailField,
 Chip,
 IconButton,
} from "./crmUi";

// ISO / date value -> yyyy-mm-dd for a <input type="date">; "" when absent/bad.
function toDateInput(value) {
 if (!value) return "";
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return "";
 return d.toISOString().slice(0, 10);
}

function DetailDrawer({ drawer, contacts, stageIndex, onClose, onRequestDelete, onSaved }) {
 const open = Boolean(drawer);
 const record = drawer?.record;
 const type = drawer?.type;

 const [editing, setEditing] = useState(false);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const [form, setForm] = useState(null);
 // Local display copy so view mode reflects a save immediately, before the
 // parent re-opens the drawer with a refreshed record.
 const [local, setLocal] = useState(null);

 // A different deal opened (or the drawer closed): drop any edit state + local.
 useEffect(() => {
 setEditing(false);
 setError("");
 setLocal(null);
 }, [record?.id]);

 const view = local || record;

 const dealContact = useMemo(() => {
 if (!view?.contact_id) return null;
 return (contacts || []).find((item) => item.id === view.contact_id) || null;
 }, [contacts, view?.contact_id]);

 // Stage options for THIS deal's pipeline, in pipeline order (buildStageIndex
 // inserts stages in order and a Map preserves insertion order).
 const stageOptions = useMemo(() => {
 if (!view?.pipeline_id || !stageIndex) return [];
 return [...stageIndex.entries()]
 .filter(([, s]) => s.pipelineId === view.pipeline_id)
 .map(([id, s]) => ({ id, name: s.name }));
 }, [stageIndex, view?.pipeline_id]);

 const typeLabel = "Deal";
 const heading = view?.title || "Untitled deal";

 function startEdit() {
 setForm({
 title: view.title || "",
 company: view.company || "",
 value_dollars: view.value_dollars != null ? String(view.value_dollars) : "",
 stage_id: view.stage_id || "",
 expected_close_date: toDateInput(view.expected_close_date),
 probability: view.probability != null ? String(view.probability) : "",
 });
 setError("");
 setEditing(true);
 }

 function cancelEdit() {
 setEditing(false);
 setError("");
 }

 async function saveEdit() {
 const changed = {};
 if (form.title.trim() !== (view.title || "")) changed.title = form.title.trim();
 if (form.company.trim() !== (view.company || "")) changed.company = form.company.trim();

 const nextValue = form.value_dollars === "" ? 0 : Number(form.value_dollars);
 if (nextValue !== Number(view.value_dollars || 0)) changed.value_dollars = nextValue;

 if (form.stage_id && form.stage_id !== view.stage_id) changed.stage_id = form.stage_id;

 if (form.expected_close_date !== toDateInput(view.expected_close_date)) {
 changed.expected_close_date = form.expected_close_date || null;
 }

 const curProb = view.probability != null ? String(view.probability) : "";
 if (form.probability !== curProb) {
 changed.probability = form.probability === "" ? null : Number(form.probability);
 }

 if (Object.keys(changed).length === 0) {
 setEditing(false);
 return;
 }

 setSaving(true);
 setError("");
 try {
 await apiClient.patch(API_PATHS.crm.dealById(view.id), changed);
 setLocal({ ...view, ...changed });
 if (onSaved) await onSaved();
 setEditing(false);
 } catch (e) {
 // Keep the user in edit mode with their input intact.
 setError(e?.message || "Could not save this deal.");
 } finally {
 setSaving(false);
 }
 }

 const setField = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

 return (
 <>
 <div
 onClick={editing ? undefined : onClose}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 50,
 background: "rgba(13,0,16,0.4)",
 opacity: open ? 1 : 0,
 pointerEvents: open ? "auto" : "none",
 transition: "opacity 300ms ease",
 }}
 />
 <aside
 aria-hidden={!open}
 style={{
 position: "fixed",
 top: 0,
 right: 0,
 height: "100vh",
 width: "100%",
 maxWidth: 480,
 zIndex: 51,
 background: "var(--cth-command-panel)",
 borderLeft: "1px solid var(--cth-command-border)",
 boxShadow: "-30px 0 60px rgba(13,0,16,0.20)",
 transform: open ? "translateX(0)" : "translateX(100%)",
 transition: "transform 300ms ease",
 display: "flex",
 flexDirection: "column",
 }}
 >
 {view ? (
 <>
 <header
 style={{
 padding: "24px 28px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 }}
 >
 <div style={{ minWidth: 0 }}>
 <div style={EYEBROW_STYLE}>{typeLabel}</div>
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 24,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "6px 0 0",
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 wordBreak: "break-word",
 }}
 >
 {heading}
 </h3>
 </div>
 <IconButton label={editing ? "Cancel edit" : "Close drawer"} onClick={editing ? cancelEdit : onClose}>
 <X size={16} />
 </IconButton>
 </div>
 </header>

 <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
 {error ? (
 <div
 style={{
 marginBottom: 16,
 padding: "10px 14px",
 borderRadius: 8,
 background: "color-mix(in srgb, var(--cth-command-crimson) 10%, var(--cth-command-panel))",
 border: "1px solid var(--cth-command-crimson)",
 color: "var(--cth-command-crimson)",
 fontFamily: SANS,
 fontSize: 13,
 }}
 >
 {error}
 </div>
 ) : null}

 {editing ? (
 <div style={{ display: "grid", gap: 14 }}>
 <div>
 <FieldLabel>Name</FieldLabel>
 <input value={form.title} onChange={setField("title")} style={INPUT_STYLE} placeholder="Deal title" />
 </div>
 <div>
 <FieldLabel>Company</FieldLabel>
 <input value={form.company} onChange={setField("company")} style={INPUT_STYLE} placeholder="Company" />
 </div>
 <div>
 <FieldLabel>Value (USD)</FieldLabel>
 <input type="number" min="0" value={form.value_dollars} onChange={setField("value_dollars")} style={INPUT_STYLE} placeholder="0" />
 </div>
 <div>
 <FieldLabel>Stage</FieldLabel>
 <select value={form.stage_id} onChange={setField("stage_id")} style={INPUT_STYLE}>
 {stageOptions.length === 0 ? <option value="">No stages</option> : null}
 {stageOptions.map((s) => (
 <option key={s.id} value={s.id}>
 {s.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <FieldLabel>Close date</FieldLabel>
 <input type="date" value={form.expected_close_date} onChange={setField("expected_close_date")} style={INPUT_STYLE} />
 </div>
 <div>
 <FieldLabel>Probability (0-100)</FieldLabel>
 <input type="number" min="0" max="100" value={form.probability} onChange={setField("probability")} style={INPUT_STYLE} placeholder="—" />
 </div>
 </div>
 ) : (
 <>
 <DetailField label="Name">{view.title || <EmptyValue />}</DetailField>
 <DetailField label="Value">
 {view.value_dollars != null && view.value_dollars !== "" ? (
 currency(view.value_dollars)
 ) : (
 <EmptyValue />
 )}
 </DetailField>
 <DetailField label="Stage">
 {(() => {
 const stage = stageIndex?.get(view.stage_id);
 return stage ? (
 <Chip tone={stage.type === "won" ? "success" : stage.type === "lost" ? "muted" : "default"}>
 {stage.name}
 </Chip>
 ) : (
 <EmptyValue label="Unassigned" />
 );
 })()}
 </DetailField>
 <DetailField label="Probability">
 {view.probability != null && view.probability !== "" ? `${view.probability}%` : <EmptyValue />}
 </DetailField>
 <DetailField label="Company">{view.company || <EmptyValue />}</DetailField>
 <DetailField label="Contact">
 {dealContact?.name || view.contact_name || view.contact || <EmptyValue />}
 </DetailField>
 <DetailField label="Close date">
 {view.expected_close_date ? formatDate(view.expected_close_date) : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {view.created_at ? formatDate(view.created_at) : <EmptyValue />}
 </DetailField>
 </>
 )}
 </div>

 <footer
 style={{
 padding: "20px 28px",
 borderTop: "1px solid var(--cth-command-border)",
 display: "flex",
 justifyContent: "flex-end",
 gap: 10,
 }}
 >
 {editing ? (
 <>
 <button type="button" onClick={cancelEdit} disabled={saving} style={SECONDARY_BUTTON_STYLE}>
 Cancel
 </button>
 <button type="button" onClick={saveEdit} disabled={saving} style={{ ...PRIMARY_BUTTON_STYLE, opacity: saving ? 0.7 : 1 }}>
 {saving ? "Saving…" : "Save"}
 </button>
 </>
 ) : (
 <>
 <button type="button" onClick={() => onRequestDelete(type, view)} style={DESTRUCTIVE_OUTLINE_STYLE}>
 <Trash2 size={14} />
 Delete {typeLabel.toLowerCase()}
 </button>
 <button type="button" onClick={startEdit} style={PRIMARY_BUTTON_STYLE}>
 <Pencil size={14} />
 Edit
 </button>
 </>
 )}
 </footer>
 </>
 ) : null}
 </aside>
 </>
 );
}

export default DetailDrawer;
