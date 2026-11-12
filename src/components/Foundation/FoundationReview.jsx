import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import {
  errorMessage, memberActions, memberPath, missingText, noteRequired, queueKey, reviewerActions, reviewerPath,
  scoreNote, statusLabel, STATUS_HELP, validateNote, MAX_NOTE, SECTION_IDS,
} from "../../lib/foundationSections.mjs";

// ------------------------------------------------------------------ data

export function useFoundationSections() {
  const [state, setState] = useState({ sections: [], reviewer: false, loading: true, error: "" });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const r = await apiClient.get("/api/foundation/sections");
      setState({ sections: r?.sections || [], reviewer: Boolean(r?.reviewer), loading: false, error: "" });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(e, "Section status could not be loaded.") }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
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

// ------------------------------------------------------------------ member: one section's status and submit

export function SectionStatusCard({ sectionId, readinessSection = null, onChanged }) {
  const { sections, loading, error, reload } = useFoundationSections();
  const [ownReadiness, setOwnReadiness] = useState(null);
  const loadReadiness = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/foundation/readiness");
      setOwnReadiness((r?.sections || []).find((x) => x.id === sectionId) || null);
    } catch { setOwnReadiness(null); }          // the score line is a nicety; the card works without it
  }, [sectionId]);
  useEffect(() => { loadReadiness(); }, [loadReadiness]);
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
      await Promise.all([reload(), loadReadiness()]);
      if (onChanged) onChanged();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy("");
    }
  };

  const askForUnlock = () => {
    const problem = validateNote("request-unlock", note);
    if (problem) { setFailure(problem); return; }
    run("request-unlock", { note });
  };

  if (loading && !section) return <section className="foundation-card fv3-status" aria-live="polite"><p className="foundation-muted">Loading section status…</p></section>;
  if (error && !section) return <section className="foundation-card fv3-status" role="alert"><p>{error}</p><button className="foundation-button foundation-button-secondary" type="button" onClick={reload}>Retry</button></section>;
  if (!section) return null;

  const can = memberActions(section);
  const missing = missingText(section);
  const line = scoreNote(readinessSection || ownReadiness);

  return <section className="foundation-card fv3-status" aria-label="Section review status" data-status={section.status}>
    <div className="fv3-status-head">
      <div><span className="fp-eyebrow">REVIEW STATUS</span><StatusBadge status={section.status} /></div>
      {section.version ? <small>Version {section.version}</small> : null}
    </div>
    <p>{STATUS_HELP[section.status] || STATUS_HELP.draft}</p>
    {section.review_note && section.status === "draft" && <div className="fv3-review-note" role="note"><b>Changes requested</b><p>{section.review_note}</p></div>}
    {section.review_note && section.status === "draft" && section.unlocked_at && <small>This section was unlocked for editing.</small>}
    {can.submitBlocked && <p className="foundation-muted">To submit, still needed: {missing || "the required fields"}.</p>}
    {line && <p className="foundation-muted">{line}</p>}
    {can.unlockRequested && <p className="foundation-muted">Unlock requested. A reviewer will respond.</p>}
    <div className="fv3-actions">
      {(can.submit || can.submitBlocked) && <button className="foundation-button foundation-button-primary" type="button" disabled={!can.submit || Boolean(busy)} onClick={() => run("submit")}>{busy === "submit" ? "Submitting…" : "Submit for review"}</button>}
      {can.withdraw && <button className="foundation-button foundation-button-secondary" type="button" disabled={Boolean(busy)} onClick={() => run("withdraw")}>{busy === "withdraw" ? "Withdrawing…" : "Withdraw to keep editing"}</button>}
      {can.requestUnlock && !asking && <button className="foundation-button foundation-button-secondary" type="button" onClick={() => { setAsking(true); setFailure(""); }}>Request unlock</button>}
    </div>
    {asking && <div className="fv3-ask">
      <NoteBox id={`unlock-note-${sectionId}`} action="request-unlock" value={note} onChange={setNote} label="Why does this section need to change?" />
      <div className="fv3-actions">
        <button className="foundation-button foundation-button-primary" type="button" disabled={Boolean(busy)} onClick={askForUnlock}>Send request</button>
        <button className="foundation-button foundation-button-secondary" type="button" onClick={() => { setAsking(false); setNote(""); setFailure(""); }}>Cancel</button>
      </div>
    </div>}
    <div aria-live="polite">{message && <p className="fp-success">{message}</p>}{failure && <p className="fv3-error" role="alert">{failure}</p>}</div>
  </section>;
}

// ------------------------------------------------------------------ member: all six sections at a glance (Review and Lock)

export function SectionStatusTable({ readinessSections = [] }) {
  const { sections, loading, error, reload } = useFoundationSections();
  if (loading && !sections.length) return <p className="foundation-muted" aria-live="polite">Loading section status…</p>;
  if (error && !sections.length) return <div role="alert"><p>{error}</p><button className="foundation-button foundation-button-secondary" type="button" onClick={reload}>Retry</button></div>;
  const locked = sections.filter((s) => s.status === "locked").length;
  return <section className="foundation-card fv3-table" aria-label="Section review status">
    <div className="fp-card-title"><h2>SECTION STATUS</h2><span>{locked} of {SECTION_IDS.length} locked</span></div>
    <table>
      <thead><tr><th>Section</th><th>Status</th><th>Readiness</th><th>Next step</th></tr></thead>
      <tbody>{sections.map((s) => {
        const r = readinessSections.find((x) => x.id === s.section_id);
        const can = memberActions(s);
        const next = s.status === "locked" ? "Approved" : s.status === "in_review" ? "A reviewer is looking at it" : s.status === "submitted" ? "Waiting for review"
          : s.review_note ? "Changes requested: " + s.review_note : can.submit ? "Ready to submit" : (missingText(s) ? "Needs: " + missingText(s) : "Keep editing");
        return <tr key={s.section_id}><td>{s.label}</td><td><StatusBadge status={s.status} /></td><td>{r ? `${r.score}%` : "—"}</td><td>{next}</td></tr>;
      })}</tbody>
    </table>
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
    <div className="fv3-actions">
      {can.startReview && <button className="foundation-button foundation-button-secondary" type="button" disabled={busy} onClick={() => send("start-review")}>Start review</button>}
      {can.approve && <button className="foundation-button foundation-button-primary" type="button" disabled={busy} onClick={() => send("approve", note)}>Approve and lock</button>}
      {can.requestChanges && <button className="foundation-button foundation-button-secondary" type="button" disabled={busy} onClick={() => { setMode("request-changes"); setFailure(""); }}>Request changes</button>}
      {can.unlock && <button className="foundation-button foundation-button-secondary" type="button" disabled={busy} onClick={() => { setMode("unlock"); setFailure(""); }}>Unlock</button>}
    </div>
    {(mode === "request-changes" || mode === "unlock") && <div className="fv3-ask">
      <NoteBox id={id} action={mode} value={note} onChange={setNote} label={mode === "unlock" ? "Reason for unlocking" : "What needs to change?"} />
      <div className="fv3-actions">
        <button className="foundation-button foundation-button-primary" type="button" disabled={busy} onClick={() => send(mode, note)}>{mode === "unlock" ? "Unlock section" : "Send back to draft"}</button>
        <button className="foundation-button foundation-button-secondary" type="button" onClick={() => { setMode(""); setNote(""); setFailure(""); }}>Cancel</button>
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
  if (error) return <section className="foundation-card fv3-queue" role="alert"><p>{error}</p><button className="foundation-button foundation-button-secondary" type="button" onClick={load}>Retry</button></section>;
  if (rows === null) return <section className="foundation-card fv3-queue"><p className="foundation-muted">Loading the review queue…</p></section>;
  return <section className="foundation-card fv3-queue" aria-label="Reviewer queue">
    <div className="fp-card-title"><h2>REVIEW QUEUE</h2><span>{rows.length} waiting</span></div>
    {rows.length === 0 ? <p className="foundation-muted">Nothing is waiting for review.</p>
      : <ul className="fv3-queue-list">{rows.map((row) => <ReviewRow key={queueKey(row)} row={row} onDone={load} />)}</ul>}
  </section>;
}

// ------------------------------------------------------------------ section 1: Diagnostic Insight

export function DiagnosticInsightCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setData(await apiClient.get("/api/foundation/diagnostic-insight")); }
    catch (e) { setError(errorMessage(e, "Diagnostic Insight could not be loaded.")); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <section className="foundation-card fv3-insight" role="alert"><p>{error}</p><button className="foundation-button foundation-button-secondary" type="button" onClick={load}>Retry</button></section>;
  if (!data) return <section className="foundation-card fv3-insight"><p className="foundation-muted">Loading Diagnostic Insight…</p></section>;
  if (!data.available) {
    return <section className="foundation-card fv3-insight">
      <div className="fp-card-title"><h2>DIAGNOSTIC INSIGHT</h2></div>
      <p>{data.completed ? "This workspace has an earlier Brand Audit, but no Brand Diagnostic result yet." : "No Brand Diagnostic has been completed for this workspace yet."}</p>
      <a className="foundation-button foundation-button-primary" href="/brand-diagnostic">Start the Brand Diagnostic</a>
    </section>;
  }
  const r = data.result || {};
  const gaps = Array.isArray(r.top_gaps) ? r.top_gaps : [];
  const actions = Array.isArray(r.interpretation?.priority_actions) ? r.interpretation.priority_actions.slice(0, 3) : [];
  return <section className="foundation-card fv3-insight" aria-label="Diagnostic Insight">
    <div className="fp-card-title"><h2>DIAGNOSTIC INSIGHT</h2><span>{r.taken_by_me ? "Taken by you" : "Taken by a teammate"}</span></div>
    <div className="fv3-insight-score"><b>{r.score ?? "—"}</b><small>/ 60</small><span>{r.score_range || ""}</span></div>
    {r.recommended_tier && <p>Recommended starting point: <b>{r.recommended_tier}</b></p>}
    {gaps.length > 0 && <><h3>Biggest gaps</h3><ul>{gaps.map((g) => <li key={g}>{g}</li>)}</ul></>}
    {actions.length > 0 && <><h3>First actions</h3><ol>{actions.map((a) => <li key={a.priority}><b>{a.category}:</b> {a.action}</li>)}</ol></>}
    {r.interpretation?.scope_note && <small className="foundation-muted">{r.interpretation.scope_note}</small>}
  </section>;
}
