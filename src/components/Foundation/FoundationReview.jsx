import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import {
  changesRequested, errorMessage, openedForEdits, memberActions, memberPath, noteRequired, queueKey, requiredLeft, requiredLine,
  reviewCard, reviewerActions, reviewerPath, shortDate, statusLabel, validateNote, MAX_NOTE, SECTION_IDS,
} from "../../lib/foundationSections.mjs";

// ------------------------------------------------------------------ data

// The loader lives with Foundation Home's progress hook; re-exported here for the section pages.
export { useFoundationSections } from "../../hooks/useFoundationProgress";

// Drawn as SVG: the "✓" character is missing from some fonts and showed as an empty box.
function CheckIcon() {
  return <svg className="fnd-check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function StatusBadge({ status }) {
  return <span className={`fv3-badge fv3-badge-${status || "draft"}`}>{statusLabel(status)}</span>;
}

function NoteBox({ id, action, value, onChange, label }) {
  return <label className="fv3-note" htmlFor={id}>
    <span>{label}{noteRequired(action) ? " (required)" : " (optional)"}</span>
    <textarea id={id} rows={3} maxLength={MAX_NOTE} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>;
}

// ------------------------------------------------------------------ member: "Your Review" card for one section

// sectionsState is the useFoundationSections() result owned by the section layout, which also
// uses it to lock the fields (one load, one source for the card and the lock). onSaveDraft is the
// page's own save; the card reloads the section status after it so the required-fields line is current.
export function SectionStatusCard({ sectionId, sectionsState, onSaveDraft = null, saving = false }) {
  const { sections, loading, error, reload } = sectionsState;
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  if (!SECTION_IDS.includes(sectionId)) return null;
  const section = sections.find((s) => s.section_id === sectionId);

  const run = async (action, body) => {
    setBusy(action); setFailure(""); setMessage("");
    try {
      await apiClient.post(memberPath(sectionId, action), body || {});
      setMessage(action === "submit" ? "Submitted for review." : action === "withdraw" ? "Withdrawn. You can edit again." : "Unlock requested.");
      setAsking(false); setNote("");
      await reload();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy("");
    }
  };

  const saveDraft = async () => {
    setFailure(""); setMessage("");
    if ((await onSaveDraft()) !== false) { setMessage("Draft saved."); await reload(); }
  };

  const askForUnlock = () => {
    const problem = validateNote("request-unlock", note);
    if (problem) { setFailure(problem); return; }
    run("request-unlock", { note });
  };

  if (loading && !section) return <section className="fnd-card fnd-review fv3-status" aria-live="polite"><p className="fnd-muted">Loading section status…</p></section>;
  if (error && !section) return <section className="fnd-card fnd-review fv3-status" role="alert"><p>{error}</p><button className="fnd-btn fnd-btn-s" type="button" onClick={reload}>Retry</button></section>;
  if (!section) return null;

  const can = memberActions(section);
  const card = reviewCard(section);
  const sentBack = changesRequested(section) || openedForEdits(section);
  const left = requiredLeft(section);

  return <section className="fnd-card fnd-review fv3-status" aria-label="Your review" data-status={section.status}>
    <p className="fnd-lbl">YOUR REVIEW</p>
    <p className="fnd-serif fnd-review-heading">{card.heading}</p>
    {sentBack && <div className="fnd-note fv3-review-note" role="note"><span className="fnd-av" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg></span><div><p className="fnd-muted fnd-note-meta">{["Reviewer's note", shortDate(section.review_note_at)].filter(Boolean).join(", ")}</p><p className="fnd-note-text">{section.review_note}</p></div></div>}
    {card.text && <p className="fnd-muted">{card.text}</p>}
    {card.edit && <p className={`fnd-required${left ? " is-missing" : ""}`}>{left ? requiredLine(section) : <><CheckIcon />{requiredLine(section)}</>}</p>}
    {card.edit && <div className="fnd-review-actions">
      {onSaveDraft && <button className="fnd-btn fnd-btn-s fnd-btn-save" type="button" disabled={saving || Boolean(busy)} onClick={saveDraft}>{saving ? "Saving…" : "Save draft"}</button>}
      <button className="fnd-btn fnd-btn-p fnd-btn-submit" type="button" disabled={!can.submit || saving || Boolean(busy)} onClick={() => run("submit")}>{busy === "submit" ? "Submitting…" : "Submit for review"}</button>
    </div>}
    {sentBack && <p className="fnd-muted fnd-small">You can keep working on other sections while this one is reviewed.</p>}
    {can.withdraw && <div className="fnd-review-actions"><button className="fnd-btn fnd-btn-s" type="button" disabled={Boolean(busy)} onClick={() => run("withdraw")}>{busy === "withdraw" ? "Withdrawing…" : "Withdraw"}</button></div>}
    {can.requestUnlock && !asking && <div className="fnd-review-actions"><button className="fnd-btn fnd-btn-s" type="button" onClick={() => { setAsking(true); setFailure(""); }}>Request unlock</button></div>}
    {can.unlockRequested && <p className="fnd-muted">Unlock requested. A reviewer will respond.</p>}
    {asking && <div className="fv3-ask">
      <NoteBox id={`unlock-note-${sectionId}`} action="request-unlock" value={note} onChange={setNote} label="Why does this section need to change?" />
      <div className="fnd-review-actions">
        <button className="fnd-btn fnd-btn-p" type="button" disabled={Boolean(busy)} onClick={askForUnlock}>Send request</button>
        <button className="fnd-btn fnd-btn-s" type="button" onClick={() => { setAsking(false); setNote(""); setFailure(""); }}>Cancel</button>
      </div>
    </div>}
    <div aria-live="polite">{message && <p className="fp-success">{message}</p>}{failure && <p className="fv3-error" role="alert">{failure}</p>}</div>
  </section>;
}

// ------------------------------------------------------------------ reviewer: the queue, with Request changes

function ReviewRow({ row, onDone }) {
  const [mode, setMode] = useState("");   // "", "request-changes", "unlock", "approve"
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const can = reviewerActions(row);
  const send = async (action, withNote) => {
    const problem = validateNote(action, withNote);
    if (problem) { setFailure(problem); return; }
    setBusy(true); setFailure("");
    try {
      await apiClient.post(reviewerPath(row.workspace_id, row.section_id, action), withNote ? { note: withNote } : {});
      setMode(""); setNote("");
      await onDone();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const id = `rv-${queueKey(row).replace(/[^a-z0-9]/gi, "-")}`;
  return <li className="fv3-queue-row">
    <div className="fv3-queue-head"><b>{row.label}</b><StatusBadge status={row.status} /><small>Workspace {row.workspace_id} · version {row.version}</small></div>
    {row.status === "locked" && row.unlock_request_note && <div className="fv3-review-note" role="note"><b>Unlock requested</b><p>{row.unlock_request_note}</p></div>}
    <div className="fnd-review-actions fv3-actions">
      {can.startReview && <button className="fnd-btn fnd-btn-s" type="button" disabled={busy} onClick={() => send("start-review")}>Start review</button>}
      {can.approve && <button className="fnd-btn fnd-btn-p" type="button" disabled={busy} onClick={() => send("approve", note)}>Approve and lock</button>}
      {can.requestChanges && <button className="fnd-btn fnd-btn-s" type="button" disabled={busy} onClick={() => { setMode("request-changes"); setFailure(""); }}>Request changes</button>}
      {can.unlock && <button className="fnd-btn fnd-btn-s" type="button" disabled={busy} onClick={() => { setMode("unlock"); setFailure(""); }}>Unlock</button>}
    </div>
    {(mode === "request-changes" || mode === "unlock") && <div className="fv3-ask">
      <NoteBox id={id} action={mode} value={note} onChange={setNote} label={mode === "unlock" ? "Reason for unlocking" : "What needs to change?"} />
      <div className="fnd-review-actions fv3-actions">
        <button className="fnd-btn fnd-btn-p" type="button" disabled={busy} onClick={() => send(mode, note)}>{mode === "unlock" ? "Unlock section" : "Send back to draft"}</button>
        <button className="fnd-btn fnd-btn-s" type="button" onClick={() => { setMode(""); setNote(""); setFailure(""); }}>Cancel</button>
      </div>
    </div>}
    {failure && <p className="fv3-error" role="alert">{failure}</p>}
  </li>;
}

export function ReviewerQueue() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const r = await apiClient.get("/api/foundation/review/queue");
      setRows(r?.queue || []);
    } catch (e) {
      if (e?.status === 403) setForbidden(true); else setError(errorMessage(e, "The review queue could not be loaded."));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (forbidden) return null;     // not a reviewer: show nothing
  if (error) return <section className="fnd-card fv3-queue" role="alert"><p>{error}</p><button className="fnd-btn fnd-btn-s" type="button" onClick={load}>Retry</button></section>;
  if (rows === null) return <section className="fnd-card fv3-queue"><p className="fnd-muted">Loading the review queue…</p></section>;
  return <section className="fnd-card fv3-queue" aria-label="Reviewer queue">
    <div className="fnd-queue-head"><h2 className="fnd-lbl">REVIEW QUEUE</h2><span className="fnd-muted fnd-small">{rows.length} waiting</span></div>
    {rows.length === 0 ? <p className="fnd-muted">Nothing is waiting for review.</p>
      : <ul className="fv3-queue-list">{rows.map((row) => <ReviewRow key={queueKey(row)} row={row} onDone={load} />)}</ul>}
  </section>;
}
