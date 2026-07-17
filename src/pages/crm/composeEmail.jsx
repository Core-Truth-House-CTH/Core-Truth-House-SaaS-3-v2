/**
 * Shared "send email to a contact" flow.
 *
 * Extracted verbatim from CRMSuite so that CRMSuite and the contact record page
 * run the ONE flow, not two copies. The validation and send logic here is the
 * kind that drifts when duplicated -- the "no email address", "subject required",
 * "write a body" guards and the post-send refresh are exactly what would fork
 * across two pages otherwise.
 *
 * A hook owns the state and the send; the modal is a dumb render of what the hook
 * exposes. Each consumer supplies two things the flow cannot know for itself:
 *   notify(message) -- how this surface shows a line of text (a toast, usually).
 *   onSent()        -- what to refresh after a successful send (each page owns
 *                      its own data, so each reloads differently).
 */

import React, { useState } from "react";
import { Loader2, Send } from "lucide-react";

import {
 SANS,
 SERIF,
 INPUT_STYLE,
 PRIMARY_BUTTON_STYLE,
 SECONDARY_BUTTON_STYLE,
 FieldLabel,
} from "./crmUi";
import apiClient from "../../lib/apiClient";

export function useComposeEmail({ notify, onSent } = {}) {
 const [target, setTarget] = useState(null);
 const [subject, setSubject] = useState("");
 const [body, setBody] = useState("");
 const [busy, setBusy] = useState(false);

 const emit = (message) => {
 if (typeof notify === "function") notify(message);
 };

 const open = (contact) => {
 if (!contact) return;
 if (!contact.email) {
 emit("This contact has no email address.");
 return;
 }
 setSubject("");
 setBody("");
 setTarget(contact);
 };

 const cancel = () => {
 if (busy) return;
 setTarget(null);
 };

 const send = async () => {
 if (!target) return;
 const trimmedSubject = subject.trim();
 const trimmedBody = body.trim();
 if (!trimmedSubject) {
 emit("Subject is required.");
 return;
 }
 if (!trimmedBody) {
 emit("Write a message body.");
 return;
 }

 setBusy(true);
 try {
 await apiClient.post(
 `/api/crm/contacts/${encodeURIComponent(target.id)}/send-email`,
 { subject: trimmedSubject, body: trimmedBody }
 );
 setTarget(null);
 emit("Email sent");
 if (typeof onSent === "function") await onSent();
 } catch (error) {
 console.error("Failed to send email", error);
 emit(error?.message || "Failed to send email.");
 } finally {
 setBusy(false);
 }
 };

 return { target, subject, body, busy, open, cancel, send, setSubject, setBody };
}

export function ComposeEmailModal({ compose }) {
 const { target: contact, subject, body, busy, cancel, send, setSubject, setBody } =
 compose || {};
 if (!contact) return null;
 return (
 <div
 role="presentation"
 onClick={cancel}
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
 onChange={(e) => setSubject(e.target.value)}
 placeholder="Subject"
 style={INPUT_STYLE}
 />
 </div>
 <div>
 <FieldLabel>Message</FieldLabel>
 <textarea
 value={body}
 onChange={(e) => setBody(e.target.value)}
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
 <button type="button" onClick={cancel} disabled={busy} style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}>
 Cancel
 </button>
 <button
 type="button"
 onClick={send}
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
