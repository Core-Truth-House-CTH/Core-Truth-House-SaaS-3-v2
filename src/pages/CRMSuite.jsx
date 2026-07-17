import React, { useCallback, useEffect, useMemo, useState } from "react";
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
 Send,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import DetailDrawer from "./crm/DetailDrawer";
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
const DEAL_STAGE_OPTIONS = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const DEAL_STATUS_OPTIONS = ["open", "active", "won", "closed_won", "lost", "closed_lost"];
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

function dealStageAccent(stage) {
 const s = String(stage || "").toLowerCase();
 if (s === "qualified") return "var(--cth-command-gold)";
 if (s === "proposal" || s === "negotiation") return "var(--cth-command-purple)";
 if (s === "won" || s === "lost") return "var(--cth-command-crimson)";
 return "var(--cth-command-muted)";
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


function FieldLabel({ children }) {
 return (
 <label style={{ ...EYEBROW_STYLE, display: "block", fontSize: 11, marginBottom: 6 }}>
 {children}
 </label>
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

function DealCard({ deal, onOpen, onDelete }) {
 const [hover, setHover] = useState(false);
 const accent = dealStageAccent(deal.stage);
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
 {deal.stage ? <Chip>{deal.stage}</Chip> : null}
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

function ComposeEmailModal({ contact, subject, body, busy, onSubjectChange, onBodyChange, onCancel, onSend }) {
 if (!contact) return null;
 return (
 <div
 role="presentation"
 onClick={onCancel}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 65,
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
 maxWidth: 540,
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
 fontSize: 24,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 Send email
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "8px 0 22px",
 lineHeight: 1.55,
 }}
 >
 Sent from your workspace sender identity.
 </p>

 <div style={{ display: "grid", gap: 16 }}>
 <div>
 <FieldLabel>To</FieldLabel>
 <input
 type="email"
 value={contact.email || ""}
 readOnly
 style={{
 ...INPUT_STYLE,
 background: "var(--cth-command-panel-soft)",
 color: "var(--cth-command-muted)",
 cursor: "not-allowed",
 }}
 />
 </div>
 <div>
 <FieldLabel>Subject</FieldLabel>
 <input
 type="text"
 value={subject}
 onChange={onSubjectChange}
 placeholder="Subject"
 style={INPUT_STYLE}
 />
 </div>
 <div>
 <FieldLabel>Message</FieldLabel>
 <textarea
 value={body}
 onChange={onBodyChange}
 onInput={(e) => {
 e.target.style.height = "auto";
 e.target.style.height = `${Math.max(120, e.target.scrollHeight)}px`;
 }}
 placeholder="Write your message"
 rows={5}
 style={{ ...INPUT_STYLE, minHeight: 120, resize: "vertical", lineHeight: 1.55 }}
 />
 </div>
 </div>

 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
 <button type="button" onClick={onCancel} disabled={busy} style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}>
 Cancel
 </button>
 <button
 type="button"
 onClick={onSend}
 disabled={busy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: busy ? 0.7 : 1 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
 Send email
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

export default function CRMSuite() {
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [pageError, setPageError] = useState("");

 const [summary, setSummary] = useState(EMPTY_SUMMARY);
 const [contacts, setContacts] = useState([]);
 const [deals, setDeals] = useState([]);
 const [activities, setActivities] = useState([]);
 const [notes, setNotes] = useState([]);
 const [needsAttention, setNeedsAttention] = useState([]);
 const [dismissingId, setDismissingId] = useState(null);
 const [addType, setAddType] = useState(null);
 const [addMenuOpen, setAddMenuOpen] = useState(false);

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
 stage: "lead",
 status: "open",
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

 const [composeTarget, setComposeTarget] = useState(null);
 const [composeSubject, setComposeSubject] = useState("");
 const [composeBody, setComposeBody] = useState("");
 const [composeBusy, setComposeBusy] = useState(false);

 const loadCRM = useCallback(async ({ silent = false } = {}) => {
 if (silent) setRefreshing(true);
 else setLoading(true);

 setPageError("");

 try {
 const [summaryRes, contactsRes, dealsRes, activitiesRes, notesRes, attentionRes] =
 await Promise.all([
 apiClient.get(API_PATHS.crm.dashboard),
 apiClient.get(API_PATHS.crm.contacts),
 apiClient.get(API_PATHS.crm.deals),
 apiClient.get(API_PATHS.crm.activities),
 apiClient.get(API_PATHS.crm.notes),
 apiClient.get(API_PATHS.crm.contactsSearch({ needs_attention: true })),
 ]);

 setSummary(summaryRes || EMPTY_SUMMARY);
 setContacts(contactsRes?.contacts || []);
 setDeals(dealsRes?.deals || []);
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

 useEffect(() => {
 loadCRM();
 }, [loadCRM]);

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
 [item.title, item.company, item.stage, item.status]
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
 }, [deals, dealQuery, dealSortOrder]);

 const dealsByStage = useMemo(() => {
 const buckets = {
 lead: [],
 qualified: [],
 proposal: [],
 won: [],
 };

 filteredDeals.forEach((deal) => {
 const stage = String(deal.stage || "").toLowerCase();
 if (stage === "qualified") buckets.qualified.push(deal);
 else if (stage === "proposal" || stage === "negotiation") buckets.proposal.push(deal);
 else if (stage === "won" || stage === "lost") buckets.won.push(deal);
 else buckets.lead.push(deal);
 });

 return buckets;
 }, [filteredDeals]);

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
 stage: dealDraft.stage || "lead",
 status: dealDraft.status || "open",
 expected_close_date: fromInputDate(dealDraft.close_date),
 });

 setAddType(null);
 setDealDraft({
 title: "",
 company: "",
 contact_id: "",
 value: "",
 stage: "lead",
 status: "open",
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
 const openContactDrawer = (contact) => setDrawer({ type: "contact", record: contact });
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

 const openCompose = (contact) => {
 if (!contact) return;
 if (!contact.email) {
 setToast({ message: "This contact has no email address." });
 return;
 }
 setComposeSubject("");
 setComposeBody("");
 setComposeTarget(contact);
 };

 const cancelCompose = () => {
 if (composeBusy) return;
 setComposeTarget(null);
 };

 const handleSendEmail = async () => {
 if (!composeTarget) return;
 const subject = composeSubject.trim();
 const body = composeBody.trim();
 if (!subject) {
 setToast({ message: "Subject is required." });
 return;
 }
 if (!body) {
 setToast({ message: "Write a message body." });
 return;
 }

 setComposeBusy(true);
 try {
 await apiClient.post(
 `/api/crm/contacts/${encodeURIComponent(composeTarget.id)}/send-email`,
 { subject, body }
 );
 setComposeTarget(null);
 setToast({ message: "Email sent" });
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to send email", error);
 setToast({ message: error?.message || "Failed to send email." });
 } finally {
 setComposeBusy(false);
 }
 };

 const handleManualRefresh = async () => {
 await loadCRM({ silent: true });
 setToast({ message: "CRM data refreshed" });
 };

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

 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
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
 </div>

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

 {/*
 The default view. Deliberately not a Panel: Panel is the visual language of
 the pipeline, the directory, and the notes feed, and this is meant to outrank
 all of them. Full width, above the metrics, first thing on screen.
 */}
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
 onOpen={openContactDrawer}
 onEmail={openCompose}
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

 {/* One strip, hairline-divided, instead of five padded cards. */}
 <div
 style={{
 ...PANEL_STYLE,
 borderRadius: 8,
 display: "flex",
 flexWrap: "wrap",
 }}
 >
 {[
 ["Contacts", summary.contacts || 0, "var(--cth-command-purple)"],
 ["Deals", summary.deals || 0, "var(--cth-command-crimson)"],
 ["Open Deals", summary.open_deals || 0, "var(--cth-command-gold)"],
 ["Open Pipeline", currency(summary.open_pipeline_dollars || 0), "var(--cth-command-purple-mid)"],
 ["Won Revenue", currency(summary.won_revenue_dollars || 0), "var(--cth-command-crimson)"],
 ].map(([label, value, accent], i) => (
 <div
 key={label}
 style={{
 flex: "1 1 0",
 minWidth: 110,
 borderLeft: i === 0 ? "none" : "1px solid var(--cth-command-border)",
 }}
 >
 <MetricTile label={label} value={value} accent={accent} />
 </div>
 ))}
 </div>

 <div className="grid gap-5">
 <Section eyebrow="Pipeline" title="Deals Pipeline">
 <div className="grid gap-5 lg:grid-cols-4">
 {[
 { key: "lead", title: "Lead", accent: "var(--cth-command-muted)" },
 { key: "qualified", title: "Qualified", accent: "var(--cth-command-gold)" },
 { key: "proposal", title: "Proposal", accent: "var(--cth-command-purple)" },
 { key: "won", title: "Won / Lost", accent: "var(--cth-command-crimson)" },
 ].map((column) => (
 <div
 key={column.key}
 style={{
 ...SOFT_PANEL_STYLE,
 padding: 14,
 display: "flex",
 flexDirection: "column",
 gap: 12,
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
 background: column.accent,
 display: "inline-block",
 }}
 />
 <div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>Stage</div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginTop: 2,
 }}
 >
 {column.title}
 </div>
 </div>
 </div>
 <Chip tone="muted">{dealsByStage[column.key].length}</Chip>
 </div>

 {dealsByStage[column.key].length === 0 ? (
 <EmptyState text="No deals here." />
 ) : (
 dealsByStage[column.key].map((deal) => (
 <DealCard
 key={deal.id}
 deal={deal}
 onOpen={openDealDrawer}
 onDelete={(rec) => requestDelete("deal", rec)}
 />
 ))
 )}
 </div>
 ))}
 </div>
 </Section>

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
 onClick={() => openContactDrawer(contact)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 openContactDrawer(contact);
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
 openCompose(contact);
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
 <LabeledSelect
 label="Stage"
 value={dealDraft.stage}
 onChange={(e) => setDealDraft((s) => ({ ...s, stage: e.target.value }))}
 options={DEAL_STAGE_OPTIONS}
 />
 <LabeledSelect
 label="Status"
 value={dealDraft.status}
 onChange={(e) => setDealDraft((s) => ({ ...s, status: e.target.value }))}
 options={DEAL_STATUS_OPTIONS}
 />
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
 deals={deals}
 activities={activities}
 onClose={closeDrawer}
 onRequestDelete={requestDelete}
 onCompose={openCompose}
 />
 <ComposeEmailModal
 contact={composeTarget}
 subject={composeSubject}
 body={composeBody}
 busy={composeBusy}
 onSubjectChange={(e) => setComposeSubject(e.target.value)}
 onBodyChange={(e) => setComposeBody(e.target.value)}
 onCancel={cancelCompose}
 onSend={handleSendEmail}
 />
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
