// Estate concept — CONTACT. "Ask the question. Start with structure."
// Content tracks the live Contact page; the form is preview-only here.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import apiClient from "../../lib/apiClient";
import { getStoredAttribution } from "../../lib/utmCapture";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  company: "",
  inquiry_type: "",
  message: "",
  consent: false,
};

const INQUIRY_OPTIONS = [
  "Brand Diagnostic question",
  "Platform or pricing question",
  "Customer support",
  "Partnerships and press",
];

const STATS = [
  ["Email", "hello@coretruthhouse.com"],
  ["Phone", "(205) 555-0196"],
  ["Location", "Birmingham, AL"],
  ["Response time", "Within 1-2 business days"],
];

const SIDECARDS = [
  {
    title: "Start With the Diagnostic",
    body: "Get a clear read on your brand gaps before deciding what support or system you need next.",
    cta: "Start Diagnostic",
    to: "/brand-diagnostic/",
  },
  {
    title: "Customer Support",
    body: "Need help with your account or platform? Our support team is here to assist you promptly and personally.",
    cta: "Get Support",
    to: "mailto:hello@coretruthhouse.com",
  },
  {
    title: "Partnerships & Press",
    body: "We're always open to meaningful partnerships and press inquiries that align with our mission and values.",
    cta: "Reach Out",
    to: "mailto:hello@coretruthhouse.com",
  },
];

const FAQS = [
  { q: "How quickly will we hear back?", a: "We reply within 1-2 business days — usually sooner." },
  { q: "Do you offer demos?", a: "The Brand Diagnostic is the best first walkthrough: it reads your brand's structure and shows you the system in action. Reach out if you would like a guided tour after that." },
  { q: "Where is Core Truth House based?", a: "Birmingham, Alabama — building for founders everywhere." },
  { q: "Can I contact support directly?", a: "Yes — email hello@coretruthhouse.com and the support team will take it from there." },
];

export default function EstateContactPage() {
  const rootRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const update = (key) => (e) => {
    const value = key === "consent" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* Posts to the same /api/contact endpoint the production contact page uses,
     with the identical payload shape so CRM capture behaves unchanged. */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ state: "error", message: "Please fill in your name, email, and message." });
      return;
    }
    if (!form.inquiry_type) {
      setStatus({ state: "error", message: "Please choose a reason for your inquiry." });
      return;
    }
    if (!form.consent) {
      setStatus({ state: "error", message: "Please tick the consent box so we know we can reply to you." });
      return;
    }

    setStatus({ state: "submitting", message: "" });
    try {
      await apiClient.post("/api/contact", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || null,
        inquiry_type: form.inquiry_type,
        message: form.message.trim(),
        consent: form.consent,
        source: "contact_page",
        // First-touch UTM/referrer/landing set captured at app entry.
        ...getStoredAttribution(),
      });
      setForm(EMPTY_FORM);
      setStatus({
        state: "success",
        message:
          "Message sent. A confirmation is on its way to your inbox — we reply within 1-2 business days.",
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);
      const serverMessage = typeof error?.message === "string" ? error.message.trim() : "";
      const usable =
        serverMessage &&
        !serverMessage.startsWith("Request failed with status") &&
        !/^failed to fetch$/i.test(serverMessage);
      setStatus({
        state: "error",
        message: usable
          ? serverMessage
          : "Could not send your message. Please try again, or email hello@coretruthhouse.com directly.",
      });
    }
  }

  useEffect(() => {
    document.title = "Contact — Core Truth House";
  }, []);

  useEffect(() => {
    document.querySelector(".ec-nav")?.classList.add("is-solid");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".ec-subhero .ec-h1", { type: "lines", mask: "lines", linesClass: "ec-line" });
      gsap.from(split.lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".ec-subhero .ec-eyebrow, .ec-subhero .ec-lede", {
        opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.6,
      });
      document.querySelector(".ec-nav")?.classList.add("is-solid");
      gsap.utils.toArray(".ec-reveal").forEach((el) => {
        gsap.from(el.children, {
          opacity: 0, y: 32, duration: 1, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
      return () => split.revert();
    }, rootRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <section className="ec-subhero" aria-label="Contact Core Truth House">
        <div className="ec-subhero-bg">
          <img src="/estate-assets/contact-hero.webp" alt="" style={{ objectPosition: "right center" }} />
        </div>
        <div className="ec-subhero-copy">
          <span className="ec-eyebrow">Contact</span>
          <h1 className="ec-h1">
            Ask the question. <em>Start with structure.</em>
          </h1>
          <p className="ec-lede">
            Reach out for support, partnerships, or account questions. If you are trying to
            understand why your brand feels scattered, start with the Brand Diagnostic first.
          </p>
        </div>
      </section>

      <div className="ec-sheet" style={{ padding: "56px 32px 0" }}>
        <div className="ec-stats-row ec-reveal">
          {STATS.map(([label, value]) => (
            <div className="ec-stat" key={label}>
              <span className="ec-stat-label">{label}</span>
              <span className="ec-stat-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ec-sheet">
        <div className="ec-contact-grid">
          <form className="ec-form ec-reveal" onSubmit={handleSubmit} noValidate>
            <span className="ec-form-title">Send us a message</span>
            <span className="ec-form-sub">We'll get back to you within 1-2 business days.</span>
            <div className="ec-form-row">
              <div className="ec-field">
                <label htmlFor="ec-first">First name *</label>
                <input id="ec-first" name="first_name" value={form.first_name} onChange={update("first_name")} autoComplete="given-name" required />
              </div>
              <div className="ec-field">
                <label htmlFor="ec-last">Last name *</label>
                <input id="ec-last" name="last_name" value={form.last_name} onChange={update("last_name")} autoComplete="family-name" />
              </div>
            </div>
            <div className="ec-form-row">
              <div className="ec-field">
                <label htmlFor="ec-email">Email address *</label>
                <input id="ec-email" name="email" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
              </div>
              <div className="ec-field">
                <label htmlFor="ec-company">Company</label>
                <input id="ec-company" name="company" value={form.company} onChange={update("company")} autoComplete="organization" />
              </div>
            </div>
            <div className="ec-field">
              <label htmlFor="ec-reason">Reason for inquiry *</label>
              <select id="ec-reason" name="inquiry_type" value={form.inquiry_type} onChange={update("inquiry_type")} required>
                <option value="" disabled>
                  Choose one
                </option>
                {INQUIRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="ec-field">
              <label htmlFor="ec-message">Message *</label>
              <textarea
                id="ec-message"
                name="message"
                rows={5}
                value={form.message}
                onChange={update("message")}
                required
                placeholder="Tell us what you are trying to clarify, fix, or understand."
              />
            </div>
            <label className="ec-form-consent">
              <input type="checkbox" checked={form.consent} onChange={update("consent")} required />
              <span>
                I agree to Core Truth House storing these details and contacting me about this
                message. *
              </span>
            </label>
            {status.state === "success" ? (
              <div className="ec-form-success" role="status">
                {status.message}
              </div>
            ) : (
              <>
                {status.state === "error" && (
                  <div className="ec-form-error" role="alert">
                    {status.message}
                  </div>
                )}
                <button
                  type="submit"
                  className="ec-btn ec-btn-crimson"
                  style={{ alignSelf: "flex-start" }}
                  disabled={status.state === "submitting"}
                >
                  {status.state === "submitting" ? "Sending…" : "Send Message"}{" "}
                  <span className="ec-btn-arrow">→</span>
                </button>
              </>
            )}
            <span className="ec-form-note">🔒 Your information is secure and will never be shared.</span>
          </form>

          <div className="ec-sidecards ec-reveal">
            {SIDECARDS.map((c) => (
              <div className="ec-sidecard" key={c.title}>
                <span className="ec-sidecard-title">{c.title}</span>
                <span className="ec-sidecard-body">{c.body}</span>
                {c.to.startsWith("mailto:") ? (
                  <a href={c.to} className="ec-btn ec-btn-ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
                    {c.cta}
                  </a>
                ) : (
                  <Link to={c.to} className="ec-btn ec-btn-ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
                    {c.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="ec-faq" aria-label="Quick answers">
        <div className="ec-faq-inner ec-reveal">
          <div className="ec-faq-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet C-100</span>
              <span>Quick answers</span>
            </div>
            <h2 className="ec-h2">
              Frequently asked <em>questions</em>.
            </h2>
          </div>
          <div className="ec-faq-list">
            {FAQS.map((f) => (
              <details className="ec-faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <div className="ec-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-commission" aria-label="Not sure what your brand needs next">
        <div className="ec-commission-copy ec-reveal">
          <span className="ec-commission-handnote">not sure what your brand needs next?</span>
          <h2 className="ec-h2">
            Start with the <em>Brand Diagnostic</em>.
          </h2>
          <p className="ec-commission-note">
            It will show your top structural gaps and point you toward the right next step.
          </p>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
            Start Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
