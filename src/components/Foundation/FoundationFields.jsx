import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAskTheHouse } from "../../context/AskTheHouseContext";
import { aiButtonLabel, alignmentPrompt, errorMessage, fieldHelpPrompt, outOfCredits } from "../../lib/foundationSections.mjs";

// Shared pieces of a Foundation section page (build reference, artboard F): field cards with one AI
// button each, list fields, and the Ask the House panel in the right column. Every control here sits
// inside the section's lock fieldset, so a locked section disables all of it at once.

// One field suggestion at a time. request(field) asks the section's existing ai-assist route (1 credit).
export function useFieldAssist(fetchSuggestion) {
  const seq = useRef(0);
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [noCredits, setNoCredits] = useState(false);
  const request = async (field) => {
    const id = ++seq.current;
    setBusy(field); setError(""); setNoCredits(false); setDraft(null);
    try {
      const text = String((await fetchSuggestion(field)) ?? "").trim();
      if (!text) throw new Error("No suggestion was returned.");
      if (id === seq.current) setDraft({ field, text });
    } catch (e) {
      if (id === seq.current) { if (outOfCredits(e)) setNoCredits(true); else setError(errorMessage(e, "The suggestion could not be created.")); }
    } finally {
      if (id === seq.current) setBusy("");
    }
  };
  return { busy, draft, error, noCredits, request, clear: () => setDraft(null) };
}

// The one AI button on a field card: a suggestion when the section has a suggestion route, otherwise
// Ask the House opened (Guide mode) with the question filled in.
export function AiButton({ value, onClick, busy }) {
  return <button className="fnd-btn-ai" type="button" onClick={onClick} disabled={busy}>{aiButtonLabel(value)}</button>;
}

export function useFieldHelp(sectionId) {
  const { open } = useAskTheHouse();
  return (label, value) => open(sectionId, fieldHelpPrompt(sectionId, label, value), "guide");
}

export function FieldCard({ id, label, hint, children, ai, wide = false }) {
  return <div className={`fnd-field${wide ? " fnd-field-wide" : ""}`}>
    <div className="fnd-fhead">{id ? <label className="fnd-lbl" htmlFor={id}>{label}</label> : <p className="fnd-lbl">{label}</p>}<span className="fnd-spacer" />{ai}</div>
    {hint && <p className="fnd-muted">{hint}</p>}
    {children}
  </div>;
}

export function TextField({ id, label, hint, value, onChange, ai, rows = 3, wide, placeholder = "Write it the way you'd say it to a client." }) {
  return <FieldCard id={id} label={label} hint={hint} ai={ai} wide={wide}>
    <textarea id={id} rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </FieldCard>;
}

// A list of short entries with + Add and ×. New rows get focus.
export function ListField({ id, label, hint, items, onChange, ai, one, addLabel, chips = false, wide }) {
  const focusNext = useRef(null);
  useEffect(() => { if (focusNext.current) { document.getElementById(focusNext.current)?.focus(); focusNext.current = null; } });
  return <FieldCard label={label} hint={hint} ai={ai} wide={wide}>
    <ul className={chips ? "fnd-chips" : "fnd-list"}>{items.map((v, i) => <li key={i}>
      <input id={`${id}-${i}`} type="text" aria-label={`${one} ${i + 1}`} value={v} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
      <button type="button" aria-label={`Remove ${one.toLowerCase()}: ${v || i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
    </li>)}</ul>
    <button className="fnd-add" type="button" onClick={() => { focusNext.current = `${id}-${items.length}`; onChange([...items, ""]); }}>{addLabel}</button>
  </FieldCard>;
}

export const toList = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.name || x?.label || "")) : typeof v === "string" ? v.split(/\n|;/).map((x) => x.trim()).filter(Boolean) : []);
export const cleanList = (a) => a.map((x) => String(x).trim()).filter(Boolean);

// Ask the House (plum panel). Guide me and Check alignment open the chat; the member sends.
// assist is a useFieldAssist() result, or null on a section without a suggestion route.
export function HousePanel({ sectionId, assist = null, nameOf = (f) => f, onUse, saving = false, align = true }) {
  const { open } = useAskTheHouse();
  const [text, setText] = useState("");
  const ask = (e) => { e.preventDefault(); open(sectionId, text.trim(), "guide"); setText(""); };
  return <section className="fnd-plum fnd-house" aria-label="Ask the House">
    <div><p className="fnd-serif fnd-house-title">ASK THE HOUSE</p><p className="fnd-house-sub">Uses your saved Foundation. 1 credit per suggestion.</p></div>
    <div className="fnd-house-modes">
      <button className="fnd-house-mode" type="button" onClick={() => open(sectionId, "", "guide")}>Guide me</button>
      {align && <button className="fnd-house-mode" type="button" onClick={() => open(sectionId, alignmentPrompt(sectionId), "review")}>Check alignment</button>}
    </div>
    {assist?.busy && <div className="fnd-suggest" aria-live="polite"><p className="fnd-lbl fnd-lbl-sm">SUGGESTED {nameOf(assist.busy).toUpperCase()}</p><p className="fnd-suggest-text">Thinking…</p></div>}
    {assist && !assist.busy && assist.draft && <div className="fnd-suggest" aria-live="polite">
      <p className="fnd-lbl fnd-lbl-sm">SUGGESTED {nameOf(assist.draft.field).toUpperCase()}, NOT APPLIED</p>
      <p className="fnd-suggest-text">{assist.draft.text}</p>
      <div className="fnd-suggest-actions"><button className="fnd-btn fnd-btn-p" type="button" onClick={onUse} disabled={saving}>Use this</button><button className="fnd-btn fnd-btn-s" type="button" onClick={() => assist.request(assist.draft.field)}>Try another</button></div>
    </div>}
    {assist && !assist.busy && assist.noCredits && <div className="fnd-suggest" role="alert"><p className="fnd-suggest-text">You've used all your AI credits. Buy more credits to keep getting suggestions.</p><Link className="fnd-btn fnd-btn-p fnd-btn-link" to="/billing">Buy credits</Link></div>}
    {assist && !assist.busy && assist.error && <p className="fnd-house-error" role="alert">{assist.error}</p>}
    <form className="fnd-house-ask" onSubmit={ask}><label className="fnd-sr" htmlFor="house-ask">Tell the House what to change</label><input id="house-ask" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell the House what to change..." /></form>
    <p className="fnd-house-foot">Suggestions stay drafts until you use them.</p>
  </section>;
}

// Loading and load-failure states for a section page body.
export function LoadState({ loading, error, onRetry, what }) {
  if (loading) return <p className="fnd-muted" aria-live="polite">Loading {what}…</p>;
  if (error) return <div role="alert"><p className="fnd-error">{error}</p><button className="fnd-btn fnd-btn-s" type="button" onClick={onRetry}>Retry</button></div>;
  return null;
}
