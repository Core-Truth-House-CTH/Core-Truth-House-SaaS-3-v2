/**
 * CRM record drawer.
 *
 * The deal branch is a flat field list. The contact branch is not: a contact is
 * the hub the rest of the CRM hangs off, so it gets a header, a lifecycle bar, a
 * metric strip, and tabs over the records that point at it.
 *
 * Everything the contact branch renders is filtered client-side from the deals
 * and activities CRMSuite already fetched in loadCRM. No request is made from
 * this file.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Mail, Trash2, X } from "lucide-react";

import {
 SANS,
 SERIF,
 EYEBROW_STYLE,
 PRIMARY_BUTTON_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 currency,
 formatDate,
 intakeLabel,
 daysWaiting,
 EmptyValue,
 DetailField,
 Chip,
 IconButton,
} from "./crmUi";

// The contact's own lifecycle, which is not the deal funnel and does not borrow
// its vocabulary. A contact can hold any number of deals at different stages, so
// painting one deal's stage onto the person it belongs to is undefined: there is
// no single answer to "what stage is this contact at". These four are the
// server's crm_contacts.status values.
const CONTACT_LIFECYCLE = ["lead", "prospect", "customer"];
const INACTIVE_STATUS = "inactive";

// Lead -> Prospect -> Customer, with Inactive as an off-ramp rather than a fourth
// step: someone who goes quiet has left the track, not advanced along it. An
// inactive contact greys the whole track and flies the chip instead of filling a
// segment, so the bar never implies inactive comes after customer.
function ContactStageBar({ status }) {
 const value = String(status || "").toLowerCase();
 const isInactive = value === INACTIVE_STATUS;
 // -1 for inactive and for any status the server grows later that this file has
 // not been taught: nothing fills, rather than a wrong segment filling.
 const reached = isInactive ? -1 : CONTACT_LIFECYCLE.indexOf(value);

 return (
 <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
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
 fontSize: 10,
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

// Number first, label under. Same reasoning as the page's metric strip: the value
// is what someone is scanning for, so it leads and the label explains it after.
function DrawerMetric({ label, value }) {
 return (
 <div style={{ flex: "1 1 0", minWidth: 88, padding: "10px 12px" }}>
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 18,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1.2,
 wordBreak: "break-word",
 }}
 >
 {value}
 </div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 9, letterSpacing: "0.12em", marginTop: 4 }}>
 {label}
 </div>
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
 padding: "10px 2px",
 marginRight: 18,
 cursor: "pointer",
 fontFamily: SANS,
 fontSize: 13,
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
 padding: "16px 14px",
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 }}
 >
 {text}
 </div>
 );
}

// One deal, as it relates to this contact: what it is, what it is worth, where it
// actually is, and when it is due. Its own stage, not the contact's status.
function LinkedDealRow({ deal, stageIndex }) {
 const stage = stageIndex?.get(deal.stage_id);
 return (
 <div
 style={{
 border: "1px solid var(--cth-command-border)",
 borderRadius: 8,
 padding: "12px 14px",
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "baseline",
 justifyContent: "space-between",
 gap: 10,
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
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
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 16,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 flexShrink: 0,
 }}
 >
 {currency(deal.value_dollars || 0)}
 </div>
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 10 }}>
 <Chip tone={stage?.type === "won" ? "success" : stage?.type === "lost" ? "muted" : "default"}>
 {stage?.name || "Unassigned"}
 </Chip>
 {deal.expected_close_date && formatDate(deal.expected_close_date) ? (
 <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 {`Closes ${formatDate(deal.expected_close_date)}`}
 </span>
 ) : null}
 </div>
 </div>
 );
}

function EmailRow({ activity }) {
 return (
 <div
 style={{
 border: "1px solid var(--cth-command-border)",
 borderRadius: 8,
 padding: "12px 14px",
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {activity.subject || "No subject"}
 </div>
 {activity.details ? (
 <div
 style={{
 fontFamily: SANS,
 fontSize: 12,
 color: "var(--cth-command-muted)",
 lineHeight: 1.55,
 whiteSpace: "pre-wrap",
 marginTop: 6,
 maxHeight: 72,
 overflow: "hidden",
 }}
 >
 {activity.details}
 </div>
 ) : null}
 {activity.occurred_at && formatDate(activity.occurred_at) ? (
 <div
 style={{
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 marginTop: 8,
 }}
 >
 {formatDate(activity.occurred_at)}
 </div>
 ) : null}
 </div>
 );
}

function DetailDrawer({ drawer, contacts, deals, activities, stageIndex, onClose, onRequestDelete, onCompose }) {
 const open = Boolean(drawer);
 const record = drawer?.record;
 const type = drawer?.type;
 const recordId = record?.id;

 const [tab, setTab] = useState("overview");

 // Reopening the drawer on a different contact must not land on the tab left
 // over from the last one: the tab that was useful for the previous person is
 // not evidence about this one.
 useEffect(() => {
 setTab("overview");
 }, [recordId]);

 const contactDeals = useMemo(() => {
 if (type !== "contact" || !recordId) return [];
 return (deals || []).filter((deal) => deal.contact_id === recordId);
 }, [deals, type, recordId]);

 // The deal's Contact row, resolved off the contacts CRMSuite already fetched.
 // The row used to read contact_name || contact, and create_deal writes neither
 // field, so it had only ever rendered "Not set". contact_id is the link that
 // actually exists.
 const dealContact = useMemo(() => {
 if (type !== "deal" || !record?.contact_id) return null;
 return (contacts || []).find((item) => item.id === record.contact_id) || null;
 }, [contacts, type, record?.contact_id]);

 // Also filtered on type: crm_activities holds calls, meetings, tasks and notes
 // against the same contact_id, and this tab claims to be email. Today the only
 // contact-linked activity the app writes is the email send, so the type filter
 // changes nothing yet -- it is what keeps a logged call from appearing under
 // "Emails" the moment anything starts linking other activity types.
 const contactEmails = useMemo(() => {
 if (type !== "contact" || !recordId) return [];
 return (activities || []).filter(
 (item) =>
 item.contact_id === recordId && String(item.type || "").toLowerCase() === "email"
 );
 }, [activities, type, recordId]);

 const typeLabel = type === "deal" ? "Deal" : type === "contact" ? "Contact" : "";
 const heading = !record
 ? ""
 : type === "deal"
 ? record.title || "Untitled deal"
 : record.name || "Untitled contact";

 const isContact = type === "contact";
 const tags = Array.isArray(record?.tags) ? record.tags : [];
 const waited = isContact ? daysWaiting(record) : null;
 const score = record?.diagnostic_score;

 return (
 <>
 <div
 onClick={onClose}
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
 {record ? (
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
 {isContact ? (
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 marginTop: 6,
 lineHeight: 1.5,
 }}
 >
 {record.company ? `${record.company} · ` : ""}
 {intakeLabel(record.intake_channel)}
 </div>
 ) : null}
 </div>
 <IconButton label="Close drawer" onClick={onClose}>
 <X size={16} />
 </IconButton>
 </div>

 {isContact && tags.length ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
 {tags.map((tag) => (
 <Chip key={tag} tone="muted">
 {tag}
 </Chip>
 ))}
 </div>
 ) : null}

 {isContact ? (
 <div style={{ marginTop: 18 }}>
 <ContactStageBar status={record.status} />
 </div>
 ) : null}
 </header>

 {isContact ? (
 <>
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 borderBottom: "1px solid var(--cth-command-border)",
 padding: "4px 16px",
 }}
 >
 <DrawerMetric label="Score" value={score != null ? `${score}/60` : "-"} />
 <DrawerMetric label="Tier" value={record.recommended_tier || "-"} />
 <DrawerMetric label="Days waiting" value={waited != null ? waited : "-"} />
 <DrawerMetric
 label="Last contacted"
 value={
 record.last_contacted_at && formatDate(record.last_contacted_at)
 ? formatDate(record.last_contacted_at)
 : "Never"
 }
 />
 </div>

 <div
 role="tablist"
 style={{
 display: "flex",
 flexWrap: "wrap",
 padding: "0 28px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <TabButton
 label="Overview"
 active={tab === "overview"}
 onClick={() => setTab("overview")}
 />
 <TabButton
 label="Deals"
 count={contactDeals.length}
 active={tab === "deals"}
 onClick={() => setTab("deals")}
 />
 <TabButton
 label="Emails"
 count={contactEmails.length}
 active={tab === "emails"}
 onClick={() => setTab("emails")}
 />
 <TabButton label="Notes" active={tab === "notes"} onClick={() => setTab("notes")} />
 </div>
 </>
 ) : null}

 <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
 {type === "deal" ? (
 <>
 <DetailField label="Name">{record.title || <EmptyValue />}</DetailField>
 <DetailField label="Value">
 {record.value_dollars != null && record.value_dollars !== "" ? (
 currency(record.value_dollars)
 ) : (
 <EmptyValue />
 )}
 </DetailField>
 <DetailField label="Stage">
 {(() => {
 const stage = stageIndex?.get(record.stage_id);
 return stage ? (
 <Chip tone={stage.type === "won" ? "success" : stage.type === "lost" ? "muted" : "default"}>
 {stage.name}
 </Chip>
 ) : (
 <EmptyValue label="Unassigned" />
 );
 })()}
 </DetailField>
 <DetailField label="Company">{record.company || <EmptyValue />}</DetailField>
 <DetailField label="Contact">
 {dealContact?.name || record.contact_name || record.contact || <EmptyValue />}
 </DetailField>
 <DetailField label="Close date">
 {record.expected_close_date ? formatDate(record.expected_close_date) : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {record.created_at ? formatDate(record.created_at) : <EmptyValue />}
 </DetailField>
 </>
 ) : null}

 {isContact && tab === "overview" ? (
 <>
 <DetailField label="Name">{record.name || <EmptyValue />}</DetailField>
 <DetailField label="Email">{record.email || <EmptyValue />}</DetailField>
 <DetailField label="Phone">{record.phone || <EmptyValue />}</DetailField>
 <DetailField label="Company">{record.company || <EmptyValue />}</DetailField>
 <DetailField label="Status">
 {record.status ? <Chip>{record.status}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {record.created_at ? formatDate(record.created_at) : <EmptyValue />}
 </DetailField>
 </>
 ) : null}

 {isContact && tab === "deals" ? (
 contactDeals.length === 0 ? (
 <TabEmpty text="No deals linked to this contact yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {contactDeals.map((deal) => (
 <LinkedDealRow key={deal.id} deal={deal} stageIndex={stageIndex} />
 ))}
 </div>
 )
 ) : null}

 {isContact && tab === "emails" ? (
 contactEmails.length === 0 ? (
 <TabEmpty text="No emails sent to this contact yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {contactEmails.map((item) => (
 <EmailRow key={item.id} activity={item} />
 ))}
 </div>
 )
 ) : null}

 {isContact && tab === "notes" ? (
 record.notes ? (
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-ink)",
 lineHeight: 1.6,
 whiteSpace: "pre-wrap",
 maxHeight: 420,
 overflowY: "auto",
 }}
 >
 {record.notes}
 </div>
 ) : (
 <TabEmpty text="No notes on this contact yet." />
 )
 ) : null}
 </div>

 <footer
 style={{
 padding: "20px 28px",
 borderTop: "1px solid var(--cth-command-border)",
 display: "flex",
 flexDirection: "column",
 gap: 14,
 }}
 >
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 {isContact ? (
 <button
 type="button"
 onClick={() => onCompose(record)}
 style={PRIMARY_BUTTON_STYLE}
 >
 <Mail size={14} />
 Send email
 </button>
 ) : null}
 <button
 type="button"
 onClick={() => onRequestDelete(type, record)}
 style={DESTRUCTIVE_OUTLINE_STYLE}
 >
 <Trash2 size={14} />
 Delete {typeLabel.toLowerCase()}
 </button>
 </div>
 {isContact ? (
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: 6,
 fontFamily: SANS,
 fontSize: 12,
 color: "var(--cth-command-muted)",
 }}
 >
 <Mail size={12} />
 Inbox coming soon. Receiving replies in-app is on the roadmap.
 </div>
 ) : null}
 </footer>
 </>
 ) : null}
 </aside>
 </>
 );
}

export default DetailDrawer;
