import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 Loader2,
 Plus,
 RefreshCw,
 Search,
 Trash2,
 Users,
 Activity,
 FileText,
 BriefcaseBusiness,
 X,
 Mail,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import DetailDrawer from "./crm/DetailDrawer";
import { useComposeEmail, ComposeEmailModal } from "./crm/composeEmail";
import {
 SANS,
 SERIF,
 PAGE_STYLE,
 PANEL_STYLE,
 SOFT_PANEL_STYLE,
 INPUT_STYLE,
 SMALL_INPUT_STYLE,
 PRIMARY_BUTTON_STYLE,
 SECONDARY_BUTTON_STYLE,
 DESTRUCTIVE_BUTTON_STYLE,
 EYEBROW_STYLE,
 currency,
 formatDate,
 intakeLabel,
 waitingSince,
 formatWaiting,
 EmptyValue,
 FieldLabel,
 buildStageIndex,
 stageAccent,
 Chip,
 IconButton,
} from "./crm/crmUi";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";


const EMPTY_SUMMARY = {
 contacts: 0,
 deals: 0,
 open_deals: 0,
 open_pipeline_dollars: 0,
 won_revenue_dollars: 0,
};

const CONTACT_STATUS_OPTIONS = ["lead", "prospect", "customer", "inactive"];
// Deal stage and status are gone: a deal's stage is a stage_id into its
// pipeline, and open/won/lost is the stage's type, not a separate field.
const ACTIVITY_TYPE_OPTIONS = ["call", "email", "meeting", "task", "note"];
const ACTIVITY_STATUS_OPTIONS = ["planned", "completed", "cancelled"];



function toInputDate(value) {
 if (!value) return "";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";
 return date.toISOString().slice(0, 10);
}

function fromInputDate(value) {
 if (!value) return null;
 const date = new Date(`${value}T12:00:00`);
 if (Number.isNaN(date.getTime())) return null;
 return date.toISOString();
}



// One cell of the metric strip. Number first, label under, no box: the tiles used
// to be bordered cards at 20px 22px padding with the label above a 36px number,
// which cost a full band of vertical space to say five short things.
function MetricTile({ label, value, accent }) {
 return (
 <div style={{ flex: "1 1 0", minWidth: 96, padding: "10px 16px" }}>
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 24,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1.1,
 }}
 >
 {value}
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
 <span
 aria-hidden="true"
 style={{
 width: 6,
 height: 6,
 borderRadius: "50%",
 background: accent,
 display: "inline-block",
 flexShrink: 0,
 }}
 />
 <span style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.14em" }}>{label}</span>
 </div>
 </div>
 );
}

// Replaces Panel on data surfaces. Same information, none of the card chrome: one
// hairline rule under a compact header instead of a bordered, rounded, 24px-padded
// box per region.
function SectionHead({ eyebrow, title, action }) {
 return (
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 10,
 padding: "12px 16px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 17,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 lineHeight: 1.2,
 }}
 >
 {title}
 </h2>
 {eyebrow ? <span style={EYEBROW_STYLE}>{eyebrow}</span> : null}
 </div>
 {action}
 </div>
 );
}

// flush = the body supplies its own row padding (tables, separator lists), so the
// section must not add a second inset around it.
function Section({ eyebrow, title, action, flush = false, children }) {
 return (
 <section style={{ ...PANEL_STYLE, borderRadius: 8, overflow: "hidden" }}>
 <SectionHead eyebrow={eyebrow} title={title} action={action} />
 {flush ? children : <div style={{ padding: 16 }}>{children}</div>}
 </section>
 );
}

function EmptyState({ text }) {
 return (
 <div
 style={{
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 10,
 padding: "18px 16px",
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 }}
 >
 {text}
 </div>
 );
}


function LabeledInput({ label, value, onChange, placeholder, type = "text" }) {
 return (
 <div>
 {label ? <FieldLabel>{label}</FieldLabel> : null}
 <input
 type={type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 style={INPUT_STYLE}
 />
 </div>
 );
}

function LabeledSelect({ label, value, onChange, options }) {
 return (
 <div>
 {label ? <FieldLabel>{label}</FieldLabel> : null}
 <select value={value} onChange={onChange} style={INPUT_STYLE}>
 {options.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 </div>
 );
}


// The one field that links a deal to a contact. crm_deals has carried contact_id
// since it was created and create_deal persists it; the form simply never sent
// one, so every deal landed unlinked and the drawer's Deals tab could never have
// anything to show.
//
// Its own component rather than a LabeledSelect: LabeledSelect maps a string[] to
// options whose value and label are the same string, and here they differ -- the
// value is an opaque contact id, the label is a human being.
function ContactSelect({ label, value, onChange, contacts }) {
 return (
 <div>
 {label ? <FieldLabel>{label}</FieldLabel> : null}
 <select value={value} onChange={onChange} style={INPUT_STYLE}>
 <option value="">No contact</option>
 {contacts.map((contact) => (
 <option key={contact.id} value={contact.id}>
 {contact.name || "Untitled contact"}
 {contact.email ? ` (${contact.email})` : ""}
 </option>
 ))}
 </select>
 </div>
 );
}

function DealCard({ deal, onOpen, onDelete, stageIndex }) {
 const [hover, setHover] = useState(false);
 const stage = stageIndex?.get(deal.stage_id);
 const accent = stageAccent(stage?.type);
 return (
 <div
 role="button"
 tabIndex={0}
 onClick={() => onOpen(deal)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 onOpen(deal);
 }
 }}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 background: "var(--cth-command-panel)",
 border: `1px solid ${hover ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
 borderLeft: `3px solid ${accent}`,
 borderRadius: 8,
 padding: "14px 16px",
 cursor: "pointer",
 transition: "border-color 150ms ease",
 }}
 >
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
 <div style={{ minWidth: 0 }}>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {deal.title || "Untitled deal"}
 </div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 12,
 color: "var(--cth-command-muted)",
 marginTop: 4,
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {deal.company || "No company"}
 </div>
 </div>
 <span onClick={(e) => e.stopPropagation()}>
 <IconButton
 label="Delete deal"
 onClick={(e) => {
 e.stopPropagation();
 onDelete(deal);
 }}
 >
 <Trash2 size={14} />
 </IconButton>
 </span>
 </div>

 <div
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginBottom: 10,
 lineHeight: 1.1,
 }}
 >
 {currency(deal.value_dollars || 0)}
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 <Chip tone={stage?.type === "won" ? "success" : stage?.type === "lost" ? "muted" : "default"}>
 {stage?.name || "Unassigned"}
 </Chip>
 {deal.expected_close_date ? (
 <Chip tone="muted">{formatDate(deal.expected_close_date)}</Chip>
 ) : null}
 </div>
 </div>
 );
}

const TH_STYLE = {
 ...EYEBROW_STYLE,
 textAlign: "left",
 padding: "8px 12px",
 whiteSpace: "nowrap",
 borderBottom: "1px solid var(--cth-command-border)",
};

const TD_STYLE = {
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-ink)",
 padding: "0 12px",
 height: 42,
 verticalAlign: "middle",
 whiteSpace: "nowrap",
 borderTop: "1px solid var(--cth-command-border)",
};

function NeedsAttentionRow({ lead, onOpen, onEmail, onDismiss, dismissing }) {
 const waited = formatWaiting(waitingSince(lead));
 const score = lead.diagnostic_score;
 const tier = lead.recommended_tier;
 const muted = { ...TD_STYLE, color: "var(--cth-command-muted)" };

 return (
 <tr
 onClick={() => onOpen(lead)}
 style={{ cursor: "pointer" }}
 >
 <td style={{ ...TD_STYLE, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
 {lead.name || "Unnamed lead"}
 </td>
 <td style={{ ...muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
 {lead.company || "-"}
 </td>
 <td style={TD_STYLE}>{intakeLabel(lead.intake_channel)}</td>
 <td style={muted}>
 {score != null || tier ? (
 <>
 {score != null ? `${score}/60` : ""}
 {score != null && tier ? " · " : ""}
 {tier || ""}
 </>
 ) : (
 "-"
 )}
 </td>
 <td style={muted}>{waited || "-"}</td>
 <td style={{ ...TD_STYLE, textAlign: "right", width: 1 }}>
 <span
 style={{ display: "inline-flex", gap: 2 }}
 onClick={(e) => e.stopPropagation()}
 >
 <IconButton label={`Email ${lead.name || "lead"}`} onClick={() => onEmail(lead)}>
 <Mail size={14} />
 </IconButton>
 <IconButton
 label={dismissing ? "Dismissing" : `Dismiss ${lead.name || "lead"}`}
 onClick={() => (dismissing ? null : onDismiss(lead))}
 >
 <X size={14} />
 </IconButton>
 </span>
 </td>
 </tr>
 );
}

const ADD_TYPES = [
 { key: "contact", label: "Contact", icon: Users },
 { key: "deal", label: "Deal", icon: BriefcaseBusiness },
 { key: "activity", label: "Activity", icon: Activity },
 { key: "note", label: "Note", icon: FileText },
];

// Replaces four always-open Quick Add cards that held the entire right rail to
// offer forms nobody was mid-way through filling. Same forms, same handlers, same
// draft state: only where they render changed.
function AddMenu({ open, onToggle, onPick }) {
 return (
 <div style={{ position: "relative" }}>
 <button type="button" onClick={onToggle} style={{ ...PRIMARY_BUTTON_STYLE, padding: "8px 14px", fontSize: 13 }}>
 <Plus size={14} />
 Add
 </button>
 {open ? (
 <>
 {/* Click-away. Sits under the menu, over everything else. */}
 <div onClick={onToggle} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
 <div
 role="menu"
 style={{
 position: "absolute",
 top: "calc(100% + 6px)",
 right: 0,
 zIndex: 41,
 minWidth: 168,
 ...PANEL_STYLE,
 borderRadius: 8,
 padding: 4,
 boxShadow: "0 18px 36px rgba(13,0,16,0.16)",
 }}
 >
 {ADD_TYPES.map(({ key, label, icon: Icon }) => (
 <button
 key={key}
 type="button"
 role="menuitem"
 onClick={() => onPick(key)}
 style={{
 display: "flex",
 alignItems: "center",
 gap: 10,
 width: "100%",
 padding: "8px 10px",
 borderRadius: 6,
 border: "none",
 background: "transparent",
 cursor: "pointer",
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-ink)",
 textAlign: "left",
 }}
 >
 <Icon size={14} style={{ color: "var(--cth-command-muted)" }} />
 {label}
 </button>
 ))}
 </div>
 </>
 ) : null}
 </div>
 );
}

function AddModal({ type, onClose, children }) {
 if (!type) return null;
 const label = ADD_TYPES.find((t) => t.key === type)?.label || "";
 return (
 <div
 role="presentation"
 onClick={onClose}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 60,
 background: "rgba(13,0,16,0.4)",
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "center",
 padding: "8vh 16px 16px",
 overflowY: "auto",
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 aria-label={`Add ${label}`}
 onClick={(e) => e.stopPropagation()}
 style={{
 ...PANEL_STYLE,
 borderRadius: 10,
 width: "100%",
 maxWidth: 460,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 padding: "12px 16px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 18,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 }}
 >
 {`New ${label}`}
 </h2>
 <IconButton label="Close" onClick={onClose}>
 <X size={14} />
 </IconButton>
 </div>
 <div style={{ padding: 16 }}>{children}</div>
 </div>
 </div>
 );
}

function ConfirmDeleteModal({ confirm, busy, onCancel, onConfirm }) {
 if (!confirm) return null;
 const { type, name } = confirm;
 const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Record";
 return (
 <div
 role="presentation"
 onClick={onCancel}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 60,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%",
 maxWidth: 480,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 12,
 padding: 28,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 Delete {typeLabel}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "12px 0 24px",
 lineHeight: 1.55,
 }}
 >
 This will permanently delete{" "}
 <strong style={{ color: "var(--cth-command-ink)", fontWeight: 600 }}>
 {name || `this ${type}`}
 </strong>
 . This cannot be undone.
 </p>
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 <button type="button" onClick={onCancel} disabled={busy} style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}>
 Cancel
 </button>
 <button
 type="button"
 onClick={onConfirm}
 disabled={busy}
 style={{ ...DESTRUCTIVE_BUTTON_STYLE, opacity: busy ? 0.7 : 1 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
 Delete
 </button>
 </div>
 </div>
 </div>
 );
}


function Toast({ toast }) {
 if (!toast) return null;
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed",
 bottom: 24,
 right: 24,
 zIndex: 70,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-gold)",
 borderRadius: 10,
 padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 display: "flex",
 alignItems: "center",
 gap: 14,
 }}
 >
 <span>{toast.message}</span>
 {toast.action ? (
 <button
 type="button"
 onClick={toast.action.onClick}
 style={{
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 700,
 letterSpacing: "0.04em",
 textTransform: "uppercase",
 color: "var(--cth-command-gold)",
 background: "transparent",
 border: "none",
 cursor: "pointer",
 padding: 0,
 }}
 >
 {toast.action.label}
 </button>
 ) : null}
 </div>
 );
}

const CRM_TABS = [
 { key: "dashboard", label: "Dashboard" },
 { key: "contacts", label: "Contacts" },
 { key: "deals", label: "Deals" },
 { key: "pipelines", label: "Pipelines" },
 { key: "activity", label: "Activity" },
 { key: "notes", label: "Notes" },
];

// Display-only control pill (period / source), matching the approved mockup.
const PILL_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 gap: 6,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 999,
 padding: "8px 14px",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 500,
 color: "var(--cth-command-muted)",
};

// In-page horizontal tab bar. Lives inside CRMSuite (under the app header); the
// global Sidebar / DashboardLayout are untouched.
function TabBar({ activeTab, onChange }) {
 return (
 <nav
 role="tablist"
 aria-label="CRM sections"
 style={{
 display: "flex",
 flexWrap: "wrap",
 gap: 4,
 borderBottom: "1px solid var(--cth-command-border)",
 paddingBottom: 10,
 }}
 >
 {CRM_TABS.map((tab) => {
 const active = tab.key === activeTab;
 return (
 <button
 key={tab.key}
 type="button"
 role="tab"
 aria-selected={active}
 onClick={() => onChange(tab.key)}
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: active ? 600 : 500,
 padding: "9px 15px",
 borderRadius: 11,
 cursor: "pointer",
 background: active ? "var(--cth-command-panel)" : "transparent",
 border: active ? "1px solid var(--cth-command-border)" : "1px solid transparent",
 color: active ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
 }}
 >
 {tab.label}
 </button>
 );
 })}
 </nav>
 );
}

export default function CRMSuite() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [pageError, setPageError] = useState("");

 const [summary, setSummary] = useState(EMPTY_SUMMARY);
 const [contacts, setContacts] = useState([]);
 const [deals, setDeals] = useState([]);
 const [pipelines, setPipelines] = useState([]);
 const [boardPipelineId, setBoardPipelineId] = useState("");
 const [activities, setActivities] = useState([]);
 const [notes, setNotes] = useState([]);
 const [needsAttention, setNeedsAttention] = useState([]);
 const [dismissingId, setDismissingId] = useState(null);
 const [addType, setAddType] = useState(null);
 const [addMenuOpen, setAddMenuOpen] = useState(false);
 // Reskin step 1: in-page top tab, default Dashboard. New state only — existing
 // state, handlers, and loadCRM are untouched.
 const [activeTab, setActiveTab] = useState("dashboard");

 const [contactQuery, setContactQuery] = useState("");
 const [dealQuery, setDealQuery] = useState("");
 const [contactSortOrder, setContactSortOrder] = useState("newest");
 const [dealSortOrder, setDealSortOrder] = useState("newest");

 const [contactBusy, setContactBusy] = useState(false);
 const [dealBusy, setDealBusy] = useState(false);
 const [activityBusy, setActivityBusy] = useState(false);
 const [noteBusy, setNoteBusy] = useState(false);

 const [contactDraft, setContactDraft] = useState({
 name: "",
 email: "",
 company: "",
 status: "lead",
 });

 const [dealDraft, setDealDraft] = useState({
 title: "",
 company: "",
 contact_id: "",
 value: "",
 pipeline_id: "",
 stage_id: "",
 close_date: "",
 });

 const [activityDraft, setActivityDraft] = useState({
 type: "call",
 title: "",
 status: "planned",
 due_date: "",
 });

 const [noteDraft, setNoteDraft] = useState({
 title: "",
 body: "",
 });

 const [deleteConfirm, setDeleteConfirm] = useState(null);
 const [deleteBusy, setDeleteBusy] = useState(false);
 const [drawer, setDrawer] = useState(null);
 const [toast, setToast] = useState(null);

 const loadCRM = useCallback(async ({ silent = false } = {}) => {
 if (silent) setRefreshing(true);
 else setLoading(true);

 setPageError("");

 try {
 const [summaryRes, contactsRes, dealsRes, pipelinesRes, activitiesRes, notesRes, attentionRes] =
 await Promise.all([
 apiClient.get(API_PATHS.crm.dashboard),
 apiClient.get(API_PATHS.crm.contacts),
 apiClient.get(API_PATHS.crm.deals),
 apiClient.get(API_PATHS.crm.pipelines),
 apiClient.get(API_PATHS.crm.activities),
 apiClient.get(API_PATHS.crm.notes),
 apiClient.get(API_PATHS.crm.contactsSearch({ needs_attention: true })),
 ]);

 setSummary(summaryRes || EMPTY_SUMMARY);
 setContacts(contactsRes?.contacts || []);
 setDeals(dealsRes?.deals || []);
 setPipelines(pipelinesRes?.pipelines || []);
 setActivities(activitiesRes?.activities || []);
 setNotes(notesRes?.notes || []);
 setNeedsAttention(attentionRes?.contacts || []);
 } catch (error) {
 console.error("Failed to load CRM", error);
 setPageError(error?.message || "Failed to load CRM.");
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 }, []);

 // The shared compose flow. notify routes its messages through this page's
 // toast; onSent reloads the CRM so a sent email updates the activity feed and
 // the follow-up clock. The contact record page consumes the same hook with its
 // own notify and its own refresh.
 const compose = useComposeEmail({
 notify: (message) => setToast({ message }),
 onSent: () => loadCRM({ silent: true }),
 });

 useEffect(() => {
 loadCRM();
 }, [loadCRM]);

 // One stage_id -> {name, type, pipelineId} map, rebuilt when pipelines change,
 // shared by the board, the cards, and the drawer.
 const stageIndex = useMemo(() => buildStageIndex(pipelines), [pipelines]);

 // The board shows one pipeline at a time; default to the workspace default.
 // Keep the current selection if it still exists after a reload, so editing a
 // pipeline does not bounce the board back to the default.
 useEffect(() => {
 if (!pipelines.length) return;
 setBoardPipelineId((current) => {
 if (current && pipelines.some((p) => p.id === current)) return current;
 const preferred = pipelines.find((p) => p.is_default) || pipelines[0];
 return preferred.id;
 });
 }, [pipelines]);

 const boardPipeline = useMemo(
 () => pipelines.find((p) => p.id === boardPipelineId) || null,
 [pipelines, boardPipelineId]
 );

 // When the Add Deal form opens, pre-select the default pipeline and its first
 // stage so the selects are never empty. create_deal would fall back anyway, but
 // an operator should see where the deal is about to land.
 useEffect(() => {
 if (addType !== "deal" || dealDraft.pipeline_id || !pipelines.length) return;
 const preferred = pipelines.find((p) => p.is_default) || pipelines[0];
 setDealDraft((s) => ({
 ...s,
 pipeline_id: preferred.id,
 stage_id: preferred.stages?.[0]?.id || "",
 }));
 }, [addType, pipelines, dealDraft.pipeline_id]);

 useEffect(() => {
 if (!toast) return undefined;
 // An undoable toast has to outlive the glance that notices it; 2s is not
 // enough time to read a message and decide to reverse it.
 const id = setTimeout(() => setToast(null), toast.action ? 8000 : 2000);
 return () => clearTimeout(id);
 }, [toast]);

 const filteredContacts = useMemo(() => {
 const q = contactQuery.trim().toLowerCase();
 const base = q
 ? contacts.filter((item) =>
 [item.name, item.email, item.company, item.status]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(q))
 )
 : contacts;

 const sorted = [...base];
 switch (contactSortOrder) {
 case "oldest":
 sorted.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
 break;
 case "name-asc":
 sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
 break;
 case "name-desc":
 sorted.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
 break;
 case "newest":
 default:
 sorted.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
 break;
 }
 return sorted;
 }, [contacts, contactQuery, contactSortOrder]);

 const filteredDeals = useMemo(() => {
 const q = dealQuery.trim().toLowerCase();
 const base = q
 ? deals.filter((item) =>
 [item.title, item.company, stageIndex.get(item.stage_id)?.name]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(q))
 )
 : deals;

 const sorted = [...base];
 switch (dealSortOrder) {
 case "oldest":
 sorted.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
 break;
 case "name-asc":
 sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
 break;
 case "name-desc":
 sorted.sort((a, b) => String(b.title || "").localeCompare(String(a.title || "")));
 break;
 case "newest":
 default:
 sorted.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
 break;
 }
 return sorted;
 }, [deals, dealQuery, dealSortOrder, stageIndex]);

 // One column per stage of the selected pipeline, plus an explicit Unassigned
 // column for that pipeline's deals whose stage_id no longer resolves (a deleted
 // stage). No else->Lead catch-all: a deal at a dead stage must not silently read
 // as a Lead. Deals belonging to other pipelines are not shown on this board.
 const boardColumns = useMemo(() => {
 if (!boardPipeline) return [];
 const columns = boardPipeline.stages.map((stage) => ({
 id: stage.id,
 name: stage.name,
 type: stage.type,
 deals: [],
 }));
 const byId = new Map(columns.map((column) => [column.id, column]));
 const unassigned = { id: "__unassigned__", name: "Unassigned", type: null, deals: [] };

 filteredDeals.forEach((deal) => {
 if (deal.pipeline_id !== boardPipeline.id) return;
 const column = byId.get(deal.stage_id);
 (column || unassigned).deals.push(deal);
 });

 return unassigned.deals.length ? [...columns, unassigned] : columns;
 }, [boardPipeline, filteredDeals]);

 const handleCreateContact = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!contactDraft.name.trim()) {
 throw new Error("Contact name is required.");
 }

 setContactBusy(true);

 await apiClient.post(API_PATHS.crm.contacts, {
 name: contactDraft.name.trim(),
 email: contactDraft.email.trim() || null,
 company: contactDraft.company.trim() || null,
 status: contactDraft.status || "lead",
 });

 setAddType(null);
 setContactDraft({
 name: "",
 email: "",
 company: "",
 status: "lead",
 });

 setContactQuery("");
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create contact", error);
 setPageError(error?.message || "Failed to create contact.");
 } finally {
 setContactBusy(false);
 }
 };

 const handleCreateDeal = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!dealDraft.title.trim()) {
 throw new Error("Deal title is required.");
 }

 setDealBusy(true);

 await apiClient.post(API_PATHS.crm.deals, {
 title: dealDraft.title.trim(),
 company: dealDraft.company.trim() || null,
 // "" means the operator chose "No contact". create_deal already coerces a
 // falsy contact_id to null, but sending null outright keeps the wire payload
 // honest about the difference between unset and empty-string.
 contact_id: dealDraft.contact_id || null,
 value_dollars: Number(dealDraft.value || 0),
 // Empty pipeline_id/stage_id let create_deal fall back to the default
 // pipeline and its first stage; a chosen pair is sent through.
 pipeline_id: dealDraft.pipeline_id || null,
 stage_id: dealDraft.stage_id || null,
 expected_close_date: fromInputDate(dealDraft.close_date),
 });

 setAddType(null);
 setDealDraft({
 title: "",
 company: "",
 contact_id: "",
 value: "",
 pipeline_id: "",
 stage_id: "",
 close_date: "",
 });
 setDealQuery("");

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create deal", error);
 setPageError(error?.message || "Failed to create deal.");
 } finally {
 setDealBusy(false);
 }
 };

 const handleCreateActivity = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!activityDraft.title.trim()) {
 throw new Error("Activity title is required.");
 }

 setActivityBusy(true);

 await apiClient.post(API_PATHS.crm.activities, {
 type: activityDraft.type || "call",
 subject: activityDraft.title.trim(),
 status: activityDraft.status || "planned",
 occurred_at: fromInputDate(activityDraft.due_date),
 details: "",
 });

 setAddType(null);
 setActivityDraft({
 type: "call",
 title: "",
 status: "planned",
 due_date: "",
 });

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create activity", error);
 setPageError(error?.message || "Failed to create activity.");
 } finally {
 setActivityBusy(false);
 }
 };

 const handleCreateNote = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!noteDraft.title.trim() && !noteDraft.body.trim()) {
 throw new Error("Add a title or note body.");
 }

 setNoteBusy(true);

 await apiClient.post(API_PATHS.crm.notes, {
 title: noteDraft.title.trim() || "Quick note",
 body: noteDraft.body.trim() || "",
 });

 setAddType(null);
 setNoteDraft({
 title: "",
 body: "",
 });

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create note", error);
 setPageError(error?.message || "Failed to create note.");
 } finally {
 setNoteBusy(false);
 }
 };

 const requestDelete = (type, record) => {
 if (!record || !record.id) return;
 const name =
 type === "deal"
 ? record.title
 : type === "contact"
 ? record.name
 : type === "note"
 ? record.title
 : record.subject || record.title;
 setDeleteConfirm({ type, id: record.id, name: name || `this ${type}` });
 };

 const cancelDelete = () => {
 if (deleteBusy) return;
 setDeleteConfirm(null);
 };

 const confirmDelete = async () => {
 if (!deleteConfirm) return;
 const { type, id } = deleteConfirm;
 setDeleteBusy(true);
 setPageError("");
 try {
 if (type === "contact") {
 await apiClient.delete(API_PATHS.crm.contactById(id));
 } else if (type === "deal") {
 await apiClient.delete(API_PATHS.crm.dealById(id));
 } else if (type === "activity") {
 await apiClient.delete(API_PATHS.crm.activityById(id));
 } else if (type === "note") {
 await apiClient.delete(API_PATHS.crm.noteById(id));
 }
 if (drawer && drawer.record?.id === id) setDrawer(null);
 setDeleteConfirm(null);
 await loadCRM({ silent: true });
 } catch (error) {
 console.error(`Failed to delete ${type}`, error);
 setPageError(error?.message || `Failed to delete ${type}.`);
 setDeleteConfirm(null);
 } finally {
 setDeleteBusy(false);
 }
 };

 const openDealDrawer = (deal) => setDrawer({ type: "deal", record: deal });
 // Contacts open their own record page at /crm/contacts/:id, not the drawer.
 // The drawer is deal-only now (its contact branch was deleted).
 const openContact = (contact) => {
 if (contact?.id) navigate(`/crm/contacts/${contact.id}`);
 };
 const closeDrawer = () => setDrawer(null);

 // Dismiss = "handled, stop showing me". Undoable rather than confirmed: a
 // confirm dialog on every dismiss would tax the exact workflow this list is
 // meant to make fast, and dismissal is cheap to reverse.
 const handleDismiss = async (lead) => {
 if (!lead?.id) return;
 setDismissingId(lead.id);
 try {
 await apiClient.patch(API_PATHS.crm.contactById(lead.id), {
 dismissed_at: new Date().toISOString(),
 });
 await loadCRM({ silent: true });
 setToast({
 message: `Dismissed ${lead.name || "lead"}`,
 action: { label: "Undo", onClick: () => handleUndoDismiss(lead) },
 });
 } catch (error) {
 console.error("Failed to dismiss lead", error);
 setToast({ message: error?.message || "Failed to dismiss." });
 } finally {
 setDismissingId(null);
 }
 };

 const handleUndoDismiss = async (lead) => {
 setToast(null);
 try {
 await apiClient.patch(API_PATHS.crm.contactById(lead.id), { dismissed_at: null });
 await loadCRM({ silent: true });
 setToast({ message: `Restored ${lead.name || "lead"}` });
 } catch (error) {
 console.error("Failed to restore lead", error);
 setToast({ message: error?.message || "Failed to restore." });
 }
 };

 const handleManualRefresh = async () => {
 await loadCRM({ silent: true });
 setToast({ message: "CRM data refreshed" });
 };

 // ---- Dashboard-tab derived data (read-only; computed from loadCRM data) ----

 // Contact growth: contacts bucketed by created_at month, last 6 months.
 const contactGrowth = useMemo(() => {
 const now = new Date();
 const buckets = [];
 for (let i = 5; i >= 0; i -= 1) {
 const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
 buckets.push({
 key: `${d.getFullYear()}-${d.getMonth()}`,
 label: d.toLocaleDateString("en-US", { month: "short" }),
 count: 0,
 });
 }
 const byKey = new Map(buckets.map((b, i) => [b.key, i]));
 contacts.forEach((c) => {
 if (!c.created_at) return;
 const d = new Date(c.created_at);
 if (Number.isNaN(d.getTime())) return;
 const k = `${d.getFullYear()}-${d.getMonth()}`;
 if (byKey.has(k)) buckets[byKey.get(k)].count += 1;
 });
 const max = Math.max(1, ...buckets.map((b) => b.count));
 return { buckets, max };
 }, [contacts]);

 // Deal funnel: reuse the same stage grouping the board uses (counts per stage
 // of the selected pipeline; the Unassigned column is dropped from the funnel).
 const dealFunnel = useMemo(() => {
 const cols = boardColumns.filter((c) => c.id !== "__unassigned__");
 const max = Math.max(1, ...cols.map((c) => c.deals.length));
 return cols.map((c) => ({
 id: c.id,
 name: c.name,
 type: c.type,
 count: c.deals.length,
 pct: Math.round((c.deals.length / max) * 100),
 }));
 }, [boardColumns]);

 // Follow-up status: categorize contacts by next_action_at / dismissed_at.
 const followups = useMemo(() => {
 const now = Date.now();
 const soon = now + 3 * 24 * 60 * 60 * 1000; // due within 3 days
 let overdue = 0;
 let dueSoon = 0;
 let onTrack = 0;
 contacts.forEach((c) => {
 if (c.dismissed_at) { onTrack += 1; return; } // handled/dismissed
 const na = c.next_action_at ? new Date(c.next_action_at).getTime() : null;
 if (na == null || Number.isNaN(na)) { onTrack += 1; return; } // nothing scheduled
 if (na < now) overdue += 1;
 else if (na <= soon) dueSoon += 1;
 else onTrack += 1;
 });
 const total = Math.max(1, overdue + dueSoon + onTrack);
 return {
 overdue,
 dueSoon,
 onTrack,
 onTrackPct: Math.round((onTrack / total) * 100),
 dueSoonPct: Math.round((dueSoon / total) * 100),
 overduePct: Math.round((overdue / total) * 100),
 };
 }, [contacts]);

 // Deal outcome / conversion, derived from deals + their stage TYPE. When there
 // are no lost deals a rate is not cleanly derivable, so fall back to a won/open
 // COUNT labeled as such rather than inventing a percentage.
 const dealOutcome = useMemo(() => {
 let won = 0;
 let lost = 0;
 let open = 0;
 deals.forEach((d) => {
 const type = stageIndex.get(d.stage_id)?.type;
 if (type === "won") won += 1;
 else if (type === "lost") lost += 1;
 else if (type === "open") open += 1;
 });
 if (won + lost > 0) {
 return { won, lost, open, value: `${Math.round((won / (won + lost)) * 100)}%`, label: "Won vs lost", note: `${won} won · ${lost} lost` };
 }
 return { won, lost, open, value: `${won}/${won + open}`, label: "Won vs open", note: `${won} won · ${open} open` };
 }, [deals, stageIndex]);

 // "New leads" = contacts still at lead status (a real count, not reused).
 const leadCount = useMemo(
 () => contacts.filter((c) => String(c.status || "").toLowerCase() === "lead").length,
 [contacts]
 );

 return (
 <DashboardLayout>
 <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            CRM
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Workspace-scoped pipeline, contacts, activity, and notes.
          </p>
        </div>
      </header>

 <div style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 <div className="mx-auto w-full max-w-[1200px] space-y-8">
 {pageError ? (
 <div
 style={{
 padding: "12px 16px",
 borderRadius: 8,
 background: "color-mix(in srgb, var(--cth-command-crimson) 10%, var(--cth-command-panel))",
 border: "1px solid var(--cth-command-crimson)",
 color: "var(--cth-command-crimson)",
 fontFamily: SANS,
 fontSize: 14,
 }}
 >
 {pageError}
 </div>
 ) : null}

 <TabBar activeTab={activeTab} onChange={setActiveTab} />

 <div className="flex flex-wrap items-end justify-between gap-3">
 <div>
 {activeTab === "dashboard" ? (
 <>
 <h1
 style={{
 fontFamily: SERIF,
 fontWeight: 600,
 fontSize: 32,
 color: "var(--cth-command-ink)",
 margin: 0,
 lineHeight: 1,
 }}
 >
 Dashboard
 </h1>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "6px 0 0",
 }}
 >
 Contacts, deals, follow-ups, and opportunities in one view.
 </p>
 </>
 ) : (
 <>
 <div style={EYEBROW_STYLE}>Customer Relationship Manager</div>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "8px 0 0",
 }}
 >
 {loading
 ? "Loading CRM..."
 : "Built once for every workspace. Simple first, scalable later."}
 </p>
 </>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {activeTab === "dashboard" && (
 <>
 <span style={PILL_STYLE}>This quarter ▾</span>
 <span style={PILL_STYLE}>All sources ▾</span>
 </>
 )}
 {activeTab === "deals" && (
 <>
 <div className="relative">
 <Search
 size={14}
 style={{
 position: "absolute",
 left: 12,
 top: "50%",
 transform: "translateY(-50%)",
 color: "var(--cth-command-muted)",
 pointerEvents: "none",
 }}
 />
 <input
 value={dealQuery}
 onChange={(e) => setDealQuery(e.target.value)}
 placeholder="Search deals"
 style={{ ...SMALL_INPUT_STYLE, paddingLeft: 32, width: 200 }}
 />
 </div>
 <select
 value={dealSortOrder}
 onChange={(e) => setDealSortOrder(e.target.value)}
 style={SMALL_INPUT_STYLE}
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 <option value="name-asc">Name A-Z</option>
 <option value="name-desc">Name Z-A</option>
 </select>
 </>
 )}
 <button
 type="button"
 onClick={handleManualRefresh}
 disabled={refreshing}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing ? 0.7 : 1 }}
 >
 {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
 Refresh
 </button>
 <AddMenu
 open={addMenuOpen}
 onToggle={() => setAddMenuOpen((v) => !v)}
 onPick={(key) => {
 setAddMenuOpen(false);
 setAddType(key);
 }}
 />
 </div>
 </div>

 {activeTab === "dashboard" && (
 <>
 {/* Hero + dark snapshot */}
 <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)" }}>
 <section
 style={{
 ...PANEL_STYLE,
 borderRadius: 20,
 padding: 24,
 display: "grid",
 gridTemplateColumns: "minmax(0, 1fr) 170px",
 gap: 18,
 alignItems: "center",
 background:
 "linear-gradient(135deg, var(--cth-command-panel), var(--cth-command-blush) 60%, color-mix(in srgb, var(--cth-command-gold) 22%, transparent))",
 }}
 >
 <div>
 <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", letterSpacing: "0.04em" }}>
 Lead → Follow-up → Deal → Customer
 </div>
 <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 600, lineHeight: 1, color: "var(--cth-command-ink)", margin: "8px 0 6px" }}>
 {currency(summary.open_pipeline_dollars || 0)}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)" }}>
 {currency(summary.won_revenue_dollars || 0)} won · {dealOutcome.value} {dealOutcome.label.toLowerCase()} · {needsAttention.length} follow-ups due
 </div>
 </div>
 <div style={{ ...SOFT_PANEL_STYLE, borderRadius: 18, padding: "20px 14px", textAlign: "center" }}>
 <div style={{ ...EYEBROW_STYLE, fontSize: 11, letterSpacing: "0.1em" }}>Won revenue</div>
 <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: "var(--cth-command-crimson)", lineHeight: 1, margin: "10px 0 5px" }}>
 {currency(summary.won_revenue_dollars || 0)}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>{dealOutcome.won} deals closed</div>
 </div>
 </section>

 <section
 style={{
 borderRadius: 20,
 padding: 24,
 border: "1px solid var(--cth-command-border)",
 background: "linear-gradient(155deg, var(--cth-command-purple), var(--cth-command-night))",
 color: "var(--cth-command-ivory)",
 }}
 >
 <div style={{ ...EYEBROW_STYLE, color: "var(--cth-command-gold)" }}>Snapshot</div>
 <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ivory)", margin: "6px 0 8px" }}>
 Relationship snapshot
 </h2>
 <p style={{ fontFamily: SANS, fontSize: 13, color: "color-mix(in srgb, var(--cth-command-ivory) 70%, transparent)", margin: "0 0 16px" }}>
 See every contact, lead, and follow-up before anything slips.
 </p>
 <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
 {[
 ["Active contacts", summary.contacts || 0],
 ["New leads", leadCount],
 ["Follow-ups due", needsAttention.length],
 ["Won revenue", currency(summary.won_revenue_dollars || 0)],
 ].map(([l, v]) => (
 <div
 key={l}
 style={{
 background: "color-mix(in srgb, var(--cth-command-ivory) 6%, transparent)",
 border: "1px solid color-mix(in srgb, var(--cth-command-gold) 25%, transparent)",
 borderRadius: 14,
 padding: 13,
 }}
 >
 <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "color-mix(in srgb, var(--cth-command-ivory) 60%, transparent)" }}>{l}</div>
 <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: "var(--cth-command-gold)", marginTop: 3 }}>{v}</div>
 </div>
 ))}
 </div>
 </section>
 </div>

 {/* 6 KPI tiles from summary + derived conversion */}
 <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
 {[
 ["Total contacts", summary.contacts || 0, "All records", "var(--cth-command-crimson)"],
 ["Open deals", summary.open_deals || 0, "In pipeline", "var(--cth-command-gold)"],
 ["Open pipeline", currency(summary.open_pipeline_dollars || 0), "Weighted value", "var(--cth-command-success)"],
 ["Won revenue", currency(summary.won_revenue_dollars || 0), "To date", "var(--cth-command-crimson)"],
 ["Needs attention", needsAttention.length, "Due or overdue", "var(--cth-command-gold)"],
 ["Conversion", dealOutcome.value, dealOutcome.note, "var(--cth-command-success)"],
 ].map(([label, value, note, accent]) => (
 <div key={label} style={{ ...PANEL_STYLE, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
 <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
 <div style={{ ...EYEBROW_STYLE, fontSize: 11, letterSpacing: "0.1em" }}>{label}</div>
 <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: "var(--cth-command-ink)", marginTop: 6, lineHeight: 1 }}>{value}</div>
 <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", marginTop: 6 }}>{note}</div>
 </div>
 ))}
 </div>

 {/* Charts row — all from loadCRM data, no chart library */}
 <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
 <div style={{ ...PANEL_STYLE, borderRadius: 16, padding: 24 }}>
 <div style={EYEBROW_STYLE}>Trend</div>
 <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ink)", margin: "6px 0 16px" }}>Contact growth</h2>
 <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 120, paddingTop: 8 }}>
 {contactGrowth.buckets.map((b) => (
 <div key={b.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
 <div
 title={`${b.label}: ${b.count}`}
 style={{
 width: "100%",
 height: `${Math.max(4, Math.round((b.count / contactGrowth.max) * 100))}%`,
 background: "linear-gradient(180deg, var(--cth-command-crimson), color-mix(in srgb, var(--cth-command-crimson) 35%, transparent))",
 borderRadius: "7px 7px 0 0",
 }}
 />
 <span style={{ fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)" }}>{b.label}</span>
 </div>
 ))}
 </div>
 </div>

 <div style={{ ...PANEL_STYLE, borderRadius: 16, padding: 24 }}>
 <div style={EYEBROW_STYLE}>Pipeline</div>
 <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ink)", margin: "6px 0 16px" }}>Deal funnel</h2>
 {dealFunnel.length === 0 ? (
 <EmptyState text="No pipeline stages yet." />
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {dealFunnel.map((f) => (
 <div
 key={f.id}
 style={{
 width: `${Math.max(30, f.pct)}%`,
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 background: "var(--cth-command-panel-soft)",
 borderLeft: `3px solid ${stageAccent(f.type)}`,
 borderRadius: 10,
 padding: "9px 13px",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 }}
 >
 <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
 <b style={{ color: "var(--cth-command-muted)", fontWeight: 600 }}>{f.count}</b>
 </div>
 ))}
 </div>
 )}
 </div>

 <div style={{ ...PANEL_STYLE, borderRadius: 16, padding: 24 }}>
 <div style={EYEBROW_STYLE}>Follow-ups</div>
 <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ink)", margin: "6px 0 16px" }}>Status</h2>
 <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
 <div
 style={{
 width: 120,
 height: 120,
 borderRadius: "50%",
 display: "grid",
 placeItems: "center",
 background: `conic-gradient(var(--cth-command-success) 0 ${followups.onTrackPct}%, var(--cth-command-gold) ${followups.onTrackPct}% ${followups.onTrackPct + followups.dueSoonPct}%, var(--cth-command-error) ${followups.onTrackPct + followups.dueSoonPct}% 100%)`,
 }}
 >
 <div style={{ width: 74, height: 74, borderRadius: "50%", background: "var(--cth-command-panel)" }} />
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 9, fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)" }}>
 <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 8, background: "var(--cth-command-success)" }} />On track {followups.onTrackPct}%</span>
 <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 8, background: "var(--cth-command-gold)" }} />Due soon {followups.dueSoonPct}%</span>
 <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 8, background: "var(--cth-command-error)" }} />Overdue {followups.overduePct}%</span>
 </div>
 </div>
 </div>
 </div>

 {/* Follow-up list (reused below the charts). */}
 <section
 style={{
 ...PANEL_STYLE,
 padding: 0,
 borderColor: "var(--cth-command-gold)",
 overflow: "hidden",
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "baseline",
 gap: 10,
 padding: "12px 16px",
 borderBottom: needsAttention.length ? "1px solid var(--cth-command-border)" : "none",
 }}
 >
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 18,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 lineHeight: 1.2,
 }}
 >
 Who needs you
 {needsAttention.length ? (
 <span style={{ color: "var(--cth-command-muted)" }}>{` (${needsAttention.length})`}</span>
 ) : null}
 </h2>
 <span style={EYEBROW_STYLE}>Today</span>
 </div>

 {needsAttention.length ? (
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr>
 <th style={TH_STYLE}>Name</th>
 <th style={TH_STYLE}>Company</th>
 <th style={TH_STYLE}>Channel</th>
 <th style={TH_STYLE}>Score / Tier</th>
 <th style={TH_STYLE}>Waiting</th>
 <th style={{ ...TH_STYLE, textAlign: "right" }}>Actions</th>
 </tr>
 </thead>
 <tbody>
 {needsAttention.map((lead) => (
 <NeedsAttentionRow
 key={lead.id}
 lead={lead}
 onOpen={openContact}
 onEmail={compose.open}
 onDismiss={handleDismiss}
 dismissing={dismissingId === lead.id}
 />
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div style={{ padding: "4px 16px 18px", fontFamily: SANS }}>
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 18,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginBottom: 4,
 }}
 >
 You're clear.
 </div>
 <div style={{ fontSize: 13, color: "var(--cth-command-muted)", maxWidth: 560 }}>
 No one is waiting on you. New leads from the diagnostic, contact form, and
 cohort applications land here automatically.
 </div>
 </div>
 )}
 </section>
 </>
 )}

 <div className="grid gap-5">
 {activeTab === "pipelines" && (
 <Section
 eyebrow="Pipelines"
 title="Pipelines"
 action={
 pipelines.length ? (
 <select
 value={boardPipelineId}
 onChange={(e) => setBoardPipelineId(e.target.value)}
 style={SMALL_INPUT_STYLE}
 aria-label="Pipeline"
 >
 {pipelines.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name}
 {p.is_default ? " (default)" : ""}
 </option>
 ))}
 </select>
 ) : null
 }
 >
 <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", lineHeight: 1.6 }}>
 {pipelines.length
 ? `Choose which pipeline the Deals board shows. ${pipelines.length} pipeline${pipelines.length === 1 ? "" : "s"} configured.`
 : "No pipelines yet."}
 </div>
 </Section>
 )}

 {activeTab === "deals" && (
 <Section eyebrow="Pipeline" title="Deals Pipeline">
 {!boardPipeline ? (
 <EmptyState text="No pipeline yet." />
 ) : (
 <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 4 }}>
 {boardColumns.map((column) => (
 <div
 key={column.id}
 style={{
 ...SOFT_PANEL_STYLE,
 padding: 14,
 display: "flex",
 flexDirection: "column",
 gap: 12,
 minWidth: 240,
 flex: "1 0 240px",
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 padding: "10px 12px",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 8,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span
 aria-hidden="true"
 style={{
 width: 8,
 height: 8,
 borderRadius: "50%",
 background: stageAccent(column.type),
 display: "inline-block",
 }}
 />
 <div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>
 {column.type || "No stage"}
 </div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginTop: 2,
 }}
 >
 {column.name}
 </div>
 </div>
 </div>
 <Chip tone="muted">{column.deals.length}</Chip>
 </div>

 {column.deals.length === 0 ? (
 <EmptyState text="No deals here." />
 ) : (
 column.deals.map((deal) => (
 <DealCard
 key={deal.id}
 deal={deal}
 stageIndex={stageIndex}
 onOpen={openDealDrawer}
 onDelete={(rec) => requestDelete("deal", rec)}
 />
 ))
 )}
 </div>
 ))}
 </div>
 )}
 </Section>
 )}

 {activeTab === "contacts" && (
 <Section
 eyebrow="Directory"
 title="Contacts"
 flush
 action={
 <div className="flex flex-wrap items-center gap-2">
 <div className="relative">
 <Search
 size={14}
 style={{
 position: "absolute",
 left: 12,
 top: "50%",
 transform: "translateY(-50%)",
 color: "var(--cth-command-muted)",
 pointerEvents: "none",
 }}
 />
 <input
 value={contactQuery}
 onChange={(e) => setContactQuery(e.target.value)}
 placeholder="Search contacts"
 style={{ ...SMALL_INPUT_STYLE, paddingLeft: 32, width: 200 }}
 />
 </div>
 <select
 value={contactSortOrder}
 onChange={(e) => setContactSortOrder(e.target.value)}
 style={SMALL_INPUT_STYLE}
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 <option value="name-asc">Name A-Z</option>
 <option value="name-desc">Name Z-A</option>
 </select>
 </div>
 }
 >
 {filteredContacts.length === 0 ? (
 <EmptyState
 text={
 contactQuery.trim()
 ? `No contacts matching "${contactQuery.trim()}"`
 : "No contacts yet."
 }
 />
 ) : (
 <div style={{ overflowX: "auto" }}>
 <table
 style={{
 minWidth: "100%",
 borderCollapse: "collapse",
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-ink)",
 textAlign: "left",
 }}
 >
 <thead>
 <tr>
 {["Name", "Email", "Company", "Status", ""].map((header, idx) => (
 <th
 key={idx}
 style={{
 ...EYEBROW_STYLE,
 padding: "10px 12px",
 borderBottom: "1px solid var(--cth-command-border)",
 fontWeight: 600,
 textAlign: idx === 4 ? "right" : "left",
 }}
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filteredContacts.map((contact) => (
 <tr
 key={contact.id}
 onClick={() => openContact(contact)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 openContact(contact);
 }
 }}
 tabIndex={0}
 style={{
 borderTop: "1px solid var(--cth-command-border)",
 cursor: "pointer",
 transition: "background 150ms ease",
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.background = "var(--cth-command-panel-soft)";
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.background = "transparent";
 }}
 >
 <td style={{ padding: "12px", fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {contact.name || "Untitled contact"}
 </td>
 <td style={{ padding: "12px", color: "var(--cth-command-muted)" }}>
 {contact.email || <EmptyValue />}
 </td>
 <td style={{ padding: "12px", color: "var(--cth-command-muted)" }}>
 {contact.company || <EmptyValue />}
 </td>
 <td style={{ padding: "12px" }}>
 {contact.status ? <Chip>{contact.status}</Chip> : <EmptyValue />}
 </td>
 <td style={{ padding: "12px", textAlign: "right" }}>
 <span
 onClick={(e) => e.stopPropagation()}
 style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}
 >
 <IconButton
 label="Send email"
 onClick={(e) => {
 e.stopPropagation();
 compose.open(contact);
 }}
 >
 <Mail size={14} />
 </IconButton>
 <IconButton
 label="Delete contact"
 onClick={(e) => {
 e.stopPropagation();
 requestDelete("contact", contact);
 }}
 >
 <Trash2 size={14} />
 </IconButton>
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </Section>
 )}

 {activeTab === "activity" && (
 <Section eyebrow="Activity" title="Recent Activity">
 {activities.length === 0 ? (
 <EmptyState text="No activity yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {activities.map((item) => (
 <div
 key={item.id}
 style={{ ...SOFT_PANEL_STYLE, padding: "12px 14px" }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 8,
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {item.subject || item.title || "Untitled activity"}
 </div>
 <IconButton
 label="Delete activity"
 onClick={() => requestDelete("activity", item)}
 >
 <Trash2 size={14} />
 </IconButton>
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
 {item.type ? <Chip>{item.type}</Chip> : null}
 {item.status ? (
 <Chip tone={item.status === "completed" ? "success" : "muted"}>
 {item.status}
 </Chip>
 ) : null}
 {(item.occurred_at || item.due_date) && formatDate(item.occurred_at || item.due_date) ? (
 <span
 style={{
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 }}
 >
 {formatDate(item.occurred_at || item.due_date)}
 </span>
 ) : null}
 </div>
 </div>
 ))}
 </div>
 )}
 </Section>
 )}

 {activeTab === "notes" && (
 <Section eyebrow="Notes" title="Notes Feed">
 {notes.length === 0 ? (
 <EmptyState text="No notes yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {notes.map((note) => (
 <div
 key={note.id}
 style={{ ...SOFT_PANEL_STYLE, padding: "12px 14px" }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 6,
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {note.title || "Untitled note"}
 </div>
 <IconButton
 label="Delete note"
 onClick={() => requestDelete("note", note)}
 >
 <Trash2 size={14} />
 </IconButton>
 </div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 whiteSpace: "pre-wrap",
 lineHeight: 1.55,
 }}
 >
 {note.body ? note.body : <EmptyValue label="No body" />}
 </div>
 {note.created_at && formatDate(note.created_at) ? (
 <div
 style={{
 marginTop: 8,
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 }}
 >
 {formatDate(note.created_at)}
 </div>
 ) : null}
 </div>
 ))}
 </div>
 )}
 </Section>
 )}
 </div>
 </div>
 </div>

 <AddModal type={addType} onClose={() => setAddType(null)}>
 {addType === "contact" ? (
 <form onSubmit={handleCreateContact} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Name"
 value={contactDraft.name}
 onChange={(e) => setContactDraft((s) => ({ ...s, name: e.target.value }))}
 placeholder="Contact name"
 />
 <LabeledInput
 label="Email"
 value={contactDraft.email}
 onChange={(e) => setContactDraft((s) => ({ ...s, email: e.target.value }))}
 placeholder="name@example.com"
 />
 <LabeledInput
 label="Company"
 value={contactDraft.company}
 onChange={(e) => setContactDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <LabeledSelect
 label="Status"
 value={contactDraft.status}
 onChange={(e) => setContactDraft((s) => ({ ...s, status: e.target.value }))}
 options={CONTACT_STATUS_OPTIONS}
 />
 <button
 type="submit"
 disabled={contactBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: contactBusy ? 0.7 : 1 }}
 >
 {contactBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Contact
 </button>
 </form>
 ) : null}
 {addType === "deal" ? (
 <form onSubmit={handleCreateDeal} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Title"
 value={dealDraft.title}
 onChange={(e) => setDealDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Deal title"
 />
 <LabeledInput
 label="Company"
 value={dealDraft.company}
 onChange={(e) => setDealDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <ContactSelect
 label="Contact"
 value={dealDraft.contact_id}
 onChange={(e) => setDealDraft((s) => ({ ...s, contact_id: e.target.value }))}
 contacts={contacts}
 />
 <LabeledInput
 label="Value (USD)"
 value={dealDraft.value}
 onChange={(e) => setDealDraft((s) => ({ ...s, value: e.target.value }))}
 placeholder="0"
 />
 <LabeledInput
 label="Close date"
 type="date"
 value={dealDraft.close_date}
 onChange={(e) => setDealDraft((s) => ({ ...s, close_date: e.target.value }))}
 />
 <div>
 <FieldLabel>Pipeline</FieldLabel>
 <select
 value={dealDraft.pipeline_id}
 onChange={(e) => {
 const pipelineId = e.target.value;
 const picked = pipelines.find((p) => p.id === pipelineId);
 // Moving pipelines invalidates the old stage; reset to the new one's first.
 setDealDraft((s) => ({
 ...s,
 pipeline_id: pipelineId,
 stage_id: picked?.stages?.[0]?.id || "",
 }));
 }}
 style={INPUT_STYLE}
 >
 {pipelines.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <FieldLabel>Stage</FieldLabel>
 <select
 value={dealDraft.stage_id}
 onChange={(e) => setDealDraft((s) => ({ ...s, stage_id: e.target.value }))}
 style={INPUT_STYLE}
 >
 {(pipelines.find((p) => p.id === dealDraft.pipeline_id)?.stages || []).map((stage) => (
 <option key={stage.id} value={stage.id}>
 {stage.name}
 </option>
 ))}
 </select>
 </div>
 <button
 type="submit"
 disabled={dealBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: dealBusy ? 0.7 : 1 }}
 >
 {dealBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Deal
 </button>
 </form>
 ) : null}
 {addType === "activity" ? (
 <form onSubmit={handleCreateActivity} style={{ display: "grid", gap: 12 }}>
 <LabeledSelect
 label="Type"
 value={activityDraft.type}
 onChange={(e) => setActivityDraft((s) => ({ ...s, type: e.target.value }))}
 options={ACTIVITY_TYPE_OPTIONS}
 />
 <LabeledSelect
 label="Status"
 value={activityDraft.status}
 onChange={(e) => setActivityDraft((s) => ({ ...s, status: e.target.value }))}
 options={ACTIVITY_STATUS_OPTIONS}
 />
 <LabeledInput
 label="Title"
 value={activityDraft.title}
 onChange={(e) => setActivityDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Activity title"
 />
 <LabeledInput
 label="Due date"
 type="date"
 value={activityDraft.due_date}
 onChange={(e) => setActivityDraft((s) => ({ ...s, due_date: e.target.value }))}
 />
 <button
 type="submit"
 disabled={activityBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: activityBusy ? 0.7 : 1 }}
 >
 {activityBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Activity
 </button>
 </form>
 ) : null}
 {addType === "note" ? (
 <form onSubmit={handleCreateNote} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Title"
 value={noteDraft.title}
 onChange={(e) => setNoteDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Note title"
 />
 <div>
 <FieldLabel>Body</FieldLabel>
 <textarea
 rows={4}
 value={noteDraft.body}
 onChange={(e) => setNoteDraft((s) => ({ ...s, body: e.target.value }))}
 placeholder="Write a quick note"
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 </div>
 <button
 type="submit"
 disabled={noteBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: noteBusy ? 0.7 : 1 }}
 >
 {noteBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Save Note
 </button>
 </form>
 ) : null}
 </AddModal>

 <DetailDrawer
 drawer={drawer}
 contacts={contacts}
 stageIndex={stageIndex}
 onClose={closeDrawer}
 onRequestDelete={requestDelete}
 onSaved={() => loadCRM({ silent: true })}
 />
 <ComposeEmailModal compose={compose} />
 <ConfirmDeleteModal
 confirm={deleteConfirm}
 busy={deleteBusy}
 onCancel={cancelDelete}
 onConfirm={confirmDelete}
 />
 <Toast toast={toast} />
 </DashboardLayout>
 );
}
