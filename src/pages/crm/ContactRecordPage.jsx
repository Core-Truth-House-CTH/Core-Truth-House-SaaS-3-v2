/**
 * Full-page contact record at /crm/contacts/:id.
 *
 * Replaces the drawer's contact branch. It works on a cold load / hard refresh:
 * it fetches the one contact (GET /crm/contacts/{id}) plus the workspace deals
 * and activities, then filters the latter two by contact_id client-side -- the
 * same filter the drawer did, but here the data is fetched by the page rather
 * than inherited from a list that may never have loaded.
 *
 * The compose-email flow is the shared hook from ./composeEmail -- the same one
 * CRMSuite uses. This page does NOT own a second copy.
 *
 * The presentational pieces below (stage bar, metric strip, tab chrome, row
 * cards) are laid out for full width, not the drawer's 480px column. The drawer
 * still carries its own now-dead copies pending a follow-up delete; these are the
 * live ones.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Trash2 } from "lucide-react";

import { DashboardLayout } from "../../components/Layout";
import apiClient from "../../lib/apiClient";
import API_PATHS from "../../lib/apiPaths";
import { useComposeEmail, ComposeEmailModal } from "./composeEmail";
import {
 SANS,
 SERIF,
 PAGE_STYLE,
 PANEL_STYLE,
 EYEBROW_STYLE,
 PRIMARY_BUTTON_STYLE,
 SECONDARY_BUTTON_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 currency,
 formatDate,
 intakeLabel,
 daysWaiting,
 EmptyValue,
 DetailField,
 Chip,
} from "./crmUi";

// Centered content cap. Wide enough for a two-column header and a 4-up metric
// strip, narrow enough that line length and the tab panels do not sprawl on a
// wide monitor.
const CONTENT_MAX = 880;

// The contact's own lifecycle, not the deal funnel -- a contact can hold several
// deals at different stages, so a single deal stage on the person is undefined.
// These are the server's crm_contacts.status values.
const CONTACT_LIFECYCLE = ["lead", "prospect", "customer"];
const INACTIVE_STATUS = "inactive";

function ContactStageBar({ status }) {
 const value = String(status || "").toLowerCase();
 const isInactive = value === INACTIVE_STATUS;
 // -1 for inactive and for any status this file has not been taught, so nothing
 // fills rather than a wrong segment filling.
 const reached = isInactive ? -1 : CONTACT_LIFECYCLE.indexOf(value);

 return (
 <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
 {CONTACT_LIFECYCLE.map((stage, index) => {
 const done = index <= reached;
 const current = index === reached;
 return (
 <div key={stage} style={{ flex: "1 1 0", minWidth: 0 }}>
 <div
 style={{
 height: 3,
 borderRadius: 2,
 background: done ? "var(--cth-command-crimson)" : "var(--cth-command-border)",
 }}
 />
 <div
 style={{
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: current ? 700 : 500,
 letterSpacing: "0.14em",
 textTransform: "uppercase",
 color: current ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
 marginTop: 6,
 }}
 >
 {stage}
 </div>
 </div>
 );
 })}
 {isInactive ? <Chip tone="muted">Inactive</Chip> : null}
 </div>
 );
}

// Metric strip fixed to four equal columns at full width -- not the drawer's
// wrapping flex, which would spread thin across a wide page.
function MetricStrip({ contact }) {
 const score = contact?.diagnostic_score;
 const waited = daysWaiting(contact);
 const cells = [
 ["Score", score != null ? `${score}/60` : "-"],
 ["Tier", contact?.recommended_tier || "-"],
 ["Days waiting", waited != null ? waited : "-"],
 [
 "Last contacted",
 contact?.last_contacted_at && formatDate(contact.last_contacted_at)
 ? formatDate(contact.last_contacted_at)
 : "Never",
 ],
 ];
 return (
 <div
 style={{
 ...PANEL_STYLE,
 borderRadius: 8,
 display: "grid",
 gridTemplateColumns: "repeat(4, 1fr)",
 }}
 >
 {cells.map(([label, value], i) => (
 <div
 key={label}
 style={{
 padding: "14px 18px",
 borderLeft: i === 0 ? "none" : "1px solid var(--cth-command-border)",
 minWidth: 0,
 }}
 >
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1.2,
 wordBreak: "break-word",
 }}
 >
 {value}
 </div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.12em", marginTop: 4 }}>
 {label}
 </div>
 </div>
 ))}
 </div>
 );
}

function TabButton({ label, count, active, onClick }) {
 return (
 <button
 type="button"
 role="tab"
 aria-selected={active}
 onClick={onClick}
 style={{
 appearance: "none",
 background: "transparent",
 border: "none",
 borderBottom: `2px solid ${active ? "var(--cth-command-crimson)" : "transparent"}`,
 padding: "12px 2px",
 marginRight: 22,
 cursor: "pointer",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: active ? 700 : 500,
 color: active ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
 }}
 >
 {label}
 {count != null ? (
 <span style={{ color: "var(--cth-command-muted)", fontWeight: 500 }}>{` ${count}`}</span>
 ) : null}
 </button>
 );
}

function TabEmpty({ text }) {
 return (
 <div
 style={{
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 8,
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

function LinkedDealRow({ deal }) {
 return (
 <div style={{ border: "1px solid var(--cth-command-border)", borderRadius: 8, padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 minWidth: 0,
 overflow: "hidden",
 textOverflow: "ellipsis",
 whiteSpace: "nowrap",
 }}
 >
 {deal.title || "Untitled deal"}
 </div>
 <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", flexShrink: 0 }}>
 {currency(deal.value_dollars || 0)}
 </div>
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10 }}>
 {deal.stage ? <Chip>{deal.stage}</Chip> : null}
 {deal.expected_close_date && formatDate(deal.expected_close_date) ? (
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 {`Closes ${formatDate(deal.expected_close_date)}`}
 </span>
 ) : null}
 </div>
 </div>
 );
}

function EmailRow({ activity }) {
 return (
 <div style={{ border: "1px solid var(--cth-command-border)", borderRadius: 8, padding: "14px 16px" }}>
 <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {activity.subject || "No subject"}
 </div>
 {activity.details ? (
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 lineHeight: 1.55,
 whiteSpace: "pre-wrap",
 marginTop: 8,
 }}
 >
 {activity.details}
 </div>
 ) : null}
 {activity.occurred_at && formatDate(activity.occurred_at) ? (
 <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", marginTop: 10 }}>
 {formatDate(activity.occurred_at)}
 </div>
 ) : null}
 </div>
 );
}

function ConfirmDelete({ open, name, busy, onCancel, onConfirm }) {
 if (!open) return null;
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
 maxWidth: 460,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 12,
 padding: 28,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
 Delete Contact
 </h3>
 <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: "12px 0 24px", lineHeight: 1.55 }}>
 This will permanently delete{" "}
 <strong style={{ color: "var(--cth-command-ink)", fontWeight: 600 }}>{name || "this contact"}</strong>. This
 cannot be undone.
 </p>
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 <button type="button" onClick={onCancel} disabled={busy} style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}>
 Cancel
 </button>
 <button type="button" onClick={onConfirm} disabled={busy} style={{ ...DESTRUCTIVE_OUTLINE_STYLE, opacity: busy ? 0.7 : 1 }}>
 {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
 Delete
 </button>
 </div>
 </div>
 </div>
 );
}

function Toast({ message }) {
 if (!message) return null;
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
 }}
 >
 {message}
 </div>
 );
}

export default function ContactRecordPage() {
 const { id } = useParams();
 const navigate = useNavigate();

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [contact, setContact] = useState(null);
 const [deals, setDeals] = useState([]);
 const [activities, setActivities] = useState([]);
 const [tab, setTab] = useState("overview");
 const [toast, setToast] = useState(null);
 const [confirmOpen, setConfirmOpen] = useState(false);
 const [deleteBusy, setDeleteBusy] = useState(false);

 const load = useCallback(async () => {
 setLoading(true);
 setError("");
 try {
 // Three fetches in parallel: the one contact, plus the workspace deals and
 // activities the tabs filter locally. contactById is what makes a hard
 // refresh work with no list in memory.
 const [contactRes, dealsRes, activitiesRes] = await Promise.all([
 apiClient.get(API_PATHS.crm.contactById(id)),
 apiClient.get(API_PATHS.crm.deals),
 apiClient.get(API_PATHS.crm.activities),
 ]);
 setContact(contactRes?.contact || null);
 setDeals(dealsRes?.deals || []);
 setActivities(activitiesRes?.activities || []);
 if (!contactRes?.contact) setError("This contact could not be found.");
 } catch (err) {
 console.error("Failed to load contact", err);
 setError(err?.message || "Failed to load this contact.");
 } finally {
 setLoading(false);
 }
 }, [id]);

 useEffect(() => {
 load();
 }, [load]);

 useEffect(() => {
 if (!toast) return undefined;
 const timer = setTimeout(() => setToast(null), 2500);
 return () => clearTimeout(timer);
 }, [toast]);

 const compose = useComposeEmail({
 notify: (message) => setToast(message),
 onSent: () => load(),
 });

 const contactDeals = useMemo(
 () => (contact ? deals.filter((deal) => deal.contact_id === contact.id) : []),
 [deals, contact]
 );

 // contact_id AND type: crm_activities also holds calls, meetings, tasks and
 // notes, and this tab is email. Only the email send links a contact today, so
 // the type filter is a guard for when other activity types start linking.
 const contactEmails = useMemo(
 () =>
 contact
 ? activities.filter(
 (item) => item.contact_id === contact.id && String(item.type || "").toLowerCase() === "email"
 )
 : [],
 [activities, contact]
 );

 const goBack = () => navigate("/crm");

 const handleDelete = async () => {
 if (!contact) return;
 setDeleteBusy(true);
 try {
 await apiClient.delete(API_PATHS.crm.contactById(contact.id));
 // The record is gone; there is nothing to return to on this route.
 navigate("/crm");
 } catch (err) {
 console.error("Failed to delete contact", err);
 setToast(err?.message || "Failed to delete contact.");
 setConfirmOpen(false);
 } finally {
 setDeleteBusy(false);
 }
 };

 const backControl = (
 <button
 type="button"
 onClick={goBack}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 8,
 background: "transparent",
 border: "none",
 padding: 0,
 cursor: "pointer",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-muted)",
 }}
 >
 <ArrowLeft size={16} />
 Back to CRM
 </button>
 );

 const tags = Array.isArray(contact?.tags) ? contact.tags : [];

 return (
 <DashboardLayout>
 <div style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", width: "100%" }}>
 <div style={{ marginBottom: 18 }}>{backControl}</div>

 {loading ? (
 <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
 <Loader2 size={28} className="animate-spin" style={{ color: "var(--cth-command-crimson)" }} />
 </div>
 ) : error || !contact ? (
 <div style={{ ...PANEL_STYLE, borderRadius: 8, padding: 28 }}>
 <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 Contact not found
 </div>
 <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: "8px 0 20px" }}>
 {error || "This contact could not be found."}
 </div>
 <button type="button" onClick={goBack} style={SECONDARY_BUTTON_STYLE}>
 Back to CRM
 </button>
 </div>
 ) : (
 <div style={{ display: "grid", gap: 20 }}>
 {/* Header: identity on the left, actions on the right, stage bar under. */}
 <section style={{ ...PANEL_STYLE, borderRadius: 8, padding: "24px 26px" }}>
 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
 <div style={{ minWidth: 0 }}>
 <div style={EYEBROW_STYLE}>Contact</div>
 <h1
 style={{
 fontFamily: SERIF,
 fontSize: 28,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "6px 0 0",
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 wordBreak: "break-word",
 }}
 >
 {contact.name || "Untitled contact"}
 </h1>
 <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", marginTop: 6, lineHeight: 1.5 }}>
 {contact.company ? `${contact.company} · ` : ""}
 {intakeLabel(contact.intake_channel)}
 </div>
 {tags.length ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
 {tags.map((tag) => (
 <Chip key={tag} tone="muted">
 {tag}
 </Chip>
 ))}
 </div>
 ) : null}
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
 <button type="button" onClick={() => compose.open(contact)} style={PRIMARY_BUTTON_STYLE}>
 <Mail size={14} />
 Send email
 </button>
 <button type="button" onClick={() => setConfirmOpen(true)} style={DESTRUCTIVE_OUTLINE_STYLE}>
 <Trash2 size={14} />
 Delete contact
 </button>
 </div>
 </div>

 <div style={{ marginTop: 22 }}>
 <ContactStageBar status={contact.status} />
 </div>
 </section>

 <MetricStrip contact={contact} />

 {/* Tabs */}
 <div>
 <div role="tablist" style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid var(--cth-command-border)" }}>
 <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
 <TabButton label="Deals" count={contactDeals.length} active={tab === "deals"} onClick={() => setTab("deals")} />
 <TabButton label="Emails" count={contactEmails.length} active={tab === "emails"} onClick={() => setTab("emails")} />
 <TabButton label="Notes" active={tab === "notes"} onClick={() => setTab("notes")} />
 </div>

 <div style={{ paddingTop: 20 }}>
 {tab === "overview" ? (
 <div style={{ ...PANEL_STYLE, borderRadius: 8, padding: "22px 24px" }}>
 <DetailField label="Name">{contact.name || <EmptyValue />}</DetailField>
 <DetailField label="Email">{contact.email || <EmptyValue />}</DetailField>
 <DetailField label="Phone">{contact.phone || <EmptyValue />}</DetailField>
 <DetailField label="Company">{contact.company || <EmptyValue />}</DetailField>
 <DetailField label="Status">
 {contact.status ? <Chip>{contact.status}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {contact.created_at ? formatDate(contact.created_at) : <EmptyValue />}
 </DetailField>
 </div>
 ) : null}

 {tab === "deals" ? (
 contactDeals.length === 0 ? (
 <TabEmpty text="No deals linked to this contact yet." />
 ) : (
 <div style={{ display: "grid", gap: 12 }}>
 {contactDeals.map((deal) => (
 <LinkedDealRow key={deal.id} deal={deal} />
 ))}
 </div>
 )
 ) : null}

 {tab === "emails" ? (
 contactEmails.length === 0 ? (
 <TabEmpty text="No emails sent to this contact yet." />
 ) : (
 <div style={{ display: "grid", gap: 12 }}>
 {contactEmails.map((item) => (
 <EmailRow key={item.id} activity={item} />
 ))}
 </div>
 )
 ) : null}

 {tab === "notes" ? (
 contact.notes ? (
 // No inner max-height/scroll: the page scrolls. A scrollbar inside
 // a scrollbar was a drawer compromise, not wanted at full height.
 <div
 style={{
 ...PANEL_STYLE,
 borderRadius: 8,
 padding: "22px 24px",
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-ink)",
 lineHeight: 1.6,
 whiteSpace: "pre-wrap",
 }}
 >
 {contact.notes}
 </div>
 ) : (
 <TabEmpty text="No notes on this contact yet." />
 )
 ) : null}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <ComposeEmailModal compose={compose} />
 <ConfirmDelete
 open={confirmOpen}
 name={contact?.name}
 busy={deleteBusy}
 onCancel={() => (deleteBusy ? null : setConfirmOpen(false))}
 onConfirm={handleDelete}
 />
 <Toast message={toast} />
 </DashboardLayout>
 );
}
