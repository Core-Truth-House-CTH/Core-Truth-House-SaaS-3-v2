import React, { useState } from "react";
import apiClient from "../../lib/apiClient.js";
import { WAITLIST_TIERS, WAITLIST_YEARS, waitlistPayload } from "../../lib/cohortWaitlist.mjs";

// Public Founding Cohort waitlist. No sign-in and no intake check: this is
// where interest goes while new applications are closed.
export default function CohortWaitlistForm({ source = "direct", recommendedTier = null }) {
  const tier = WAITLIST_TIERS.includes(recommendedTier) ? recommendedTier : null;
  const [form, setForm] = useState({ name: "", email: "", businessName: "", yearsInBusiness: "", usResident: "", hp: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = waitlistPayload(form, { source, recommendedTier: tier });
    if (!payload.ok) {
      setError(payload.error);
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const response = await fetch(apiClient.buildApiUrl("/api/cohort/waitlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload.body),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setStatus("idle");
        setError("Too many attempts. Please try again later.");
        return;
      }
      if (!response.ok || data.success !== true) throw new Error("save failed");
      setResult({ eligible: data.eligible === true, message: data.message });
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("We could not save your spot. Please try again.");
    }
  }

  if (status === "done" && result) {
    return (
      <section className="cth-waitlist" aria-live="polite" data-waitlist-state={result.eligible ? "eligible" : "ineligible"}>
        <h2>{result.eligible ? "You're on the list." : "Thank you."}</h2>
        <p>{result.message}</p>
        {result.eligible ? <p>We will reach out when Founding seats open.</p> : null}
        <WaitlistStyles />
      </section>
    );
  }

  return (
    <section className="cth-waitlist" id="waitlist" aria-labelledby="cth-waitlist-title">
      <p className="cth-waitlist-eyebrow">Founding Cohort waitlist</p>
      <h2 id="cth-waitlist-title">Join the waitlist</h2>
      <p className="cth-waitlist-sub">New applications are not open right now. Leave your details and we will reach out when Founding seats open.</p>
      {tier ? (
        <p className="cth-waitlist-tier" data-testid="waitlist-tier">
          Where you'd start: <strong>{tier}</strong>
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="cth-waitlist-hp" aria-hidden="true">
          <label>
            Leave this field empty
            <input
              type="text"
              name="cth_hp_field"
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              value={form.hp}
              onChange={set("hp")}
            />
          </label>
        </div>
        <label className="cth-waitlist-field">
          <span>Name *</span>
          <input type="text" autoComplete="name" maxLength={200} value={form.name} onChange={set("name")} required />
        </label>
        <label className="cth-waitlist-field">
          <span>Email *</span>
          <input type="email" autoComplete="email" maxLength={320} value={form.email} onChange={set("email")} required />
        </label>
        <label className="cth-waitlist-field">
          <span>Business name *</span>
          <input type="text" autoComplete="organization" maxLength={160} value={form.businessName} onChange={set("businessName")} required />
        </label>
        <label className="cth-waitlist-field">
          <span>Years in business *</span>
          <select value={form.yearsInBusiness} onChange={set("yearsInBusiness")} required>
            <option value="" disabled>Select one</option>
            {WAITLIST_YEARS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <fieldset className="cth-waitlist-field">
          <legend>Are you a US resident? *</legend>
          <div className="cth-waitlist-choices">
            {["yes", "no"].map((value) => (
              <label key={value} className={form.usResident === value ? "checked" : ""}>
                <input type="radio" name="cth-waitlist-us" value={value} checked={form.usResident === value} onChange={set("usResident")} />
                <span>{value === "yes" ? "Yes" : "No"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <p className="cth-waitlist-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Saving your spot..." : "Join the waitlist"}
        </button>
      </form>
      <WaitlistStyles />
    </section>
  );
}

function WaitlistStyles() {
  return (
    <style>{`
      .cth-waitlist {
        margin: 32px 0 0;
        padding: 32px;
        background: #fff;
        border: 1px solid rgba(216, 197, 195, 0.9);
        border-top: 3px solid var(--cth-gold, #c4a95b);
        border-radius: 4px;
        color: var(--cth-purple-deep, #33033c);
        text-align: left;
      }
      .cth-waitlist h2 {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: clamp(1.6rem, 3vw, 2rem);
        margin: 0 0 10px;
      }
      .cth-waitlist-eyebrow {
        margin: 0 0 10px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--cth-crimson, #af0024);
      }
      .cth-waitlist-sub { margin: 0 0 18px; line-height: 1.6; color: #4a3b4a; }
      .cth-waitlist-tier {
        margin: 0 0 22px;
        padding: 12px 14px;
        background: #f8f4f2;
        border-left: 3px solid var(--cth-gold, #c4a95b);
      }
      .cth-waitlist-field { display: block; margin: 0 0 18px; padding: 0; border: 0; }
      .cth-waitlist-field > span, .cth-waitlist-field legend {
        display: block; margin-bottom: 8px; font-size: 14px; font-weight: 700;
      }
      .cth-waitlist-field input[type="text"], .cth-waitlist-field input[type="email"], .cth-waitlist-field select {
        width: 100%; min-height: 46px; padding: 12px 14px; box-sizing: border-box;
        border: 1px solid rgba(216, 197, 195, 0.9); border-radius: 4px;
        background: #fff; color: inherit; font: inherit; font-size: 15px;
      }
      .cth-waitlist-field input:focus, .cth-waitlist-field select:focus {
        outline: 2px solid var(--cth-gold, #c4a95b); outline-offset: 1px;
      }
      .cth-waitlist-choices { display: flex; gap: 12px; flex-wrap: wrap; }
      .cth-waitlist-choices label {
        display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
        border: 1px solid rgba(216, 197, 195, 0.9); border-radius: 4px; cursor: pointer;
      }
      .cth-waitlist-choices label.checked { border-color: var(--cth-crimson, #af0024); }
      .cth-waitlist-error { color: var(--cth-crimson, #af0024); margin: 0 0 14px; }
      .cth-waitlist-hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
      .cth-waitlist button {
        width: 100%; min-height: 50px; border: 0; border-radius: 4px; cursor: pointer;
        background: var(--cth-crimson, #af0024); color: #fff;
        font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; font-size: 13px;
      }
      .cth-waitlist button:disabled { opacity: 0.7; cursor: not-allowed; }
      @media (max-width: 480px) { .cth-waitlist { padding: 22px 18px; } }
    `}</style>
  );
}
