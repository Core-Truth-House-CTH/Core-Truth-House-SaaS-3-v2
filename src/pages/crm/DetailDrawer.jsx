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
 */

import React, { useMemo } from "react";
import { Trash2, X } from "lucide-react";

import {
 SERIF,
 EYEBROW_STYLE,
 DESTRUCTIVE_OUTLINE_STYLE,
 currency,
 formatDate,
 EmptyValue,
 DetailField,
 Chip,
 IconButton,
} from "./crmUi";

function DetailDrawer({ drawer, contacts, stageIndex, onClose, onRequestDelete }) {
 const open = Boolean(drawer);
 const record = drawer?.record;
 const type = drawer?.type;

 // The deal's Contact row, resolved off the contacts CRMSuite already fetched.
 // The row used to read contact_name || contact, and create_deal writes neither
 // field, so it had only ever rendered "Not set". contact_id is the link that
 // actually exists.
 const dealContact = useMemo(() => {
 if (!record?.contact_id) return null;
 return (contacts || []).find((item) => item.id === record.contact_id) || null;
 }, [contacts, record?.contact_id]);

 const typeLabel = "Deal";
 const heading = record?.title || "Untitled deal";

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
 </div>
 <IconButton label="Close drawer" onClick={onClose}>
 <X size={16} />
 </IconButton>
 </div>
 </header>

 <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
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
 <button
 type="button"
 onClick={() => onRequestDelete(type, record)}
 style={DESTRUCTIVE_OUTLINE_STYLE}
 >
 <Trash2 size={14} />
 Delete {typeLabel.toLowerCase()}
 </button>
 </footer>
 </>
 ) : null}
 </aside>
 </>
 );
}

export default DetailDrawer;
