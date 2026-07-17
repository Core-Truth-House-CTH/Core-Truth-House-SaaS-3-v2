/**
 * CRM record drawer.
 *
 * Pure move out of CRMSuite.jsx: the component body below is unchanged.
 */

import React from "react";
import { Mail, Trash2, X } from "lucide-react";

import {
 SANS,
 SERIF,
 EYEBROW_STYLE,
 PRIMARY_BUTTON_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 currency,
 formatDate,
 EmptyValue,
 Chip,
 IconButton,
} from "./crmUi";

function DetailField({ label, children }) {
 return (
 <div style={{ marginBottom: 18 }}>
 <div style={{ ...EYEBROW_STYLE, marginBottom: 6 }}>{label}</div>
 <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-ink)", lineHeight: 1.5 }}>
 {children}
 </div>
 </div>
 );
}

function DetailDrawer({ drawer, onClose, onRequestDelete, onCompose }) {
 const open = Boolean(drawer);
 const record = drawer?.record;
 const type = drawer?.type;

 const typeLabel = type === "deal" ? "Deal" : type === "contact" ? "Contact" : "";
 const heading = !record
 ? ""
 : type === "deal"
 ? record.title || "Untitled deal"
 : record.name || "Untitled contact";

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
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 padding: "24px 28px",
 borderBottom: "1px solid var(--cth-command-border)",
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
 <IconButton label="Close drawer" onClick={onClose}>
 <X size={16} />
 </IconButton>
 </header>

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
 {record.stage ? <Chip>{record.stage}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Status">
 {record.status ? <Chip tone="muted">{record.status}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Company">{record.company || <EmptyValue />}</DetailField>
 <DetailField label="Contact">
 {record.contact_name || record.contact || <EmptyValue />}
 </DetailField>
 <DetailField label="Close date">
 {record.expected_close_date ? formatDate(record.expected_close_date) : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {record.created_at ? formatDate(record.created_at) : <EmptyValue />}
 </DetailField>
 </>
 ) : (
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
 )}
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
 {type === "contact" ? (
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
 {type === "contact" ? (
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
