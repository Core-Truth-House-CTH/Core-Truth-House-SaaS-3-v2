import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const doorwayAsset = "/cohort-assets/cth-cohort-hero-doorway.png";

const styles = {
  page: {
    background: "#EFE7E3",
    color: "#2B1040",
    minHeight: "100vh",
    overflowX: "hidden",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  wrap: {
    width: "min(1200px, calc(100% - 48px))",
    margin: "0 auto",
  },
  eyebrow: {
    display: "inline-block",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#C4A95B",
  },
  hero: {
    position: "relative",
    isolation: "isolate",
    color: "#fff",
    background:
      "radial-gradient(circle at 76% 48%, rgba(224, 78, 53, 0.22), transparent 34%), linear-gradient(90deg, rgba(15, 8, 29, 0.98) 0%, rgba(15, 8, 29, 0.94) 48%, rgba(15, 8, 29, 0.86) 100%), #140f2b",
    borderBottom: "1px solid rgba(196, 169, 91, 0.16)",
  },
  blueprintOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(196, 169, 91, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(196, 169, 91, 0.08) 1px, transparent 1px)",
    backgroundSize: "74px 74px",
    opacity: 0.22,
    pointerEvents: "none",
    zIndex: -1,
  },
  heroInner: {
    width: "min(1200px, calc(100% - 48px))",
    margin: "0 auto",
    padding: "72px 0 48px",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "48px",
    alignItems: "center",
    minHeight: "720px",
  },
  heroCopy: {
    maxWidth: "620px",
  },
  h1: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "clamp(3.6rem, 8vw, 6.3rem)",
    lineHeight: 0.92,
    fontWeight: 600,
    margin: "14px 0 18px",
    letterSpacing: "-0.03em",
  },
  heroLead: {
    fontSize: "1.24rem",
    color: "rgba(255,255,255,0.88)",
    margin: "0 0 18px",
    maxWidth: "580px",
  },
  heroBody: {
    color: "rgba(255,255,255,0.75)",
    maxWidth: "580px",
    fontSize: "1.02rem",
    margin: "0 0 30px",
  },
  btnRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    minHeight: "52px",
    padding: "0 26px",
    borderRadius: "999px",
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #AF0024, #E04E35)",
    color: "#fff",
    border: "1px solid transparent",
    boxShadow: "0 12px 28px rgba(175, 0, 36, 0.24)",
  },
  btnSecondary: {
    background: "rgba(255, 255, 255, 0.06)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    backdropFilter: "blur(6px)",
  },
  heroMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px 18px",
    marginTop: "22px",
    color: "rgba(255,255,255,0.76)",
    fontSize: "0.92rem",
  },
  heroVisual: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "560px",
    background: "#0d0010",
    borderRadius: "12px",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(224, 78, 53, 0.22), transparent 70%)",
    filter: "blur(12px)",
    zIndex: 0,
  },
  doorway: {
    position: "relative",
    zIndex: 1,
    width: "min(100%, 520px)",
    filter: "drop-shadow(0 26px 45px rgba(0,0,0,0.34))",
    mixBlendMode: "multiply",
    backgroundColor: "transparent",
  },
  featureStrip: {
    marginTop: "-34px",
    position: "relative",
    zIndex: 5,
  },
  featureWrap: {
    width: "min(1200px, calc(100% - 48px))",
    margin: "0 auto",
    background: "rgba(248, 244, 242, 0.96)",
    border: "1px solid #D8C5C3",
    borderRadius: "22px",
    boxShadow: "0 18px 48px rgba(30, 10, 40, 0.14)",
    overflow: "hidden",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
  },
  featureItem: {
    padding: "26px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minHeight: "118px",
    borderRight: "1px solid rgba(216, 197, 195, 0.7)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.96))",
  },
  featureIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    border: "1px solid rgba(196, 169, 91, 0.55)",
    display: "grid",
    placeItems: "center",
    color: "#C4A95B",
    background: "#fff",
    fontSize: "1.15rem",
    flexShrink: 0,
  },
  featureText: {
    display: "block",
    fontSize: "0.9rem",
    lineHeight: 1.25,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#2B1040",
    fontWeight: 800,
  },
  lightSection: {
    position: "relative",
    padding: "92px 0",
    background: "radial-gradient(circle at top right, rgba(196,169,91,0.06), transparent 24%), #EFE7E3",
  },
  sectionTag: {
    textAlign: "center",
    marginBottom: "10px",
  },
  sectionTitle: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "clamp(2.2rem, 5vw, 4rem)",
    lineHeight: 0.95,
    margin: "0 0 18px",
    letterSpacing: "-0.02em",
    textAlign: "center",
    color: "#2B1040",
  },
  sectionCopy: {
    maxWidth: "720px",
    color: "#7C6576",
    fontSize: "1.05rem",
    margin: "0 auto",
    textAlign: "center",
  },
  audienceGrid: {
    marginTop: "42px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  audienceCard: {
    background: "rgba(255,255,255,0.74)",
    border: "1px solid rgba(216, 197, 195, 0.8)",
    borderRadius: "20px",
    padding: "26px 22px",
    boxShadow: "0 10px 24px rgba(43, 16, 64, 0.06)",
  },
  cardIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "rgba(196,169,91,0.1)",
    color: "#C4A95B",
    border: "1px solid rgba(196,169,91,0.25)",
    marginBottom: "18px",
    fontSize: "1.1rem",
  },
  cardTitle: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "1.6rem",
    lineHeight: 1,
    margin: "0 0 10px",
    color: "#2B1040",
  },
  cardText: {
    margin: 0,
    color: "#7C6576",
    fontSize: "0.98rem",
  },
  stepsSection: {
    padding: "28px 0 48px",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "26px",
    marginTop: "32px",
  },
  stepNumber: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    color: "#AF0024",
    fontSize: "clamp(3rem, 6vw, 4.4rem)",
    lineHeight: 0.9,
    marginBottom: "10px",
  },
  stepTitle: {
    margin: "0 0 8px",
    fontSize: "1rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#2B1040",
  },
  pricingSection: {
    padding: "32px 0 92px",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "28px",
    marginTop: "32px",
  },
  priceCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "26px",
    padding: "34px 30px 28px",
    color: "#fff",
    boxShadow: "0 20px 44px rgba(43,16,64,0.18)",
    border: "1px solid rgba(196,169,91,0.22)",
  },
  foundingCard: {
    background: "linear-gradient(160deg, #6b001c 0%, #8d1026 28%, #4c0727 100%)",
  },
  standardCard: {
    background: "linear-gradient(160deg, #1b1029 0%, #260d38 48%, #3d0a35 100%)",
  },
  priceLabel: {
    display: "inline-block",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "10px",
  },
  priceTitle: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "2.2rem",
    margin: 0,
    lineHeight: 1,
    color: "#fff",
  },
  priceLine: {
    display: "flex",
    alignItems: "end",
    gap: "10px",
    margin: "16px 0 14px",
    flexWrap: "wrap",
  },
  priceValue: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "clamp(3rem, 6vw, 4.6rem)",
    lineHeight: 0.9,
    color: "#C4A95B",
  },
  priceNote: {
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    paddingBottom: "10px",
  },
  priceDescription: {
    color: "rgba(255,255,255,0.82)",
    margin: "0 0 18px",
  },
  priceList: {
    listStyle: "none",
    margin: "0 0 28px",
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  cardFootnote: {
    marginTop: "16px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "0.88rem",
  },
  outcomesSection: {
    padding: "0 0 84px",
  },
  outcomesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginTop: "26px",
  },
  outcomeCard: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(216, 197, 195, 0.82)",
    borderRadius: "18px",
    padding: "24px 18px",
    minHeight: "150px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    justifyContent: "center",
  },
  faqSection: {
    padding: "0 0 92px",
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "18px 24px",
    marginTop: "30px",
  },
  faqItem: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid rgba(216,197,195,0.88)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(43,16,64,0.04)",
  },
  faqQuestion: {
    margin: "0 0 8px",
    fontWeight: 800,
    color: "#2B1040",
  },
  faqAnswer: {
    margin: 0,
    color: "#7C6576",
    fontSize: "0.97rem",
  },
  ctaBand: {
    color: "#fff",
    background:
      "radial-gradient(circle at 90% 30%, rgba(224,78,53,0.18), transparent 32%), linear-gradient(90deg, rgba(27,16,41,0.98), rgba(58,11,52,0.94)), #140f2b",
    position: "relative",
    overflow: "hidden",
  },
  ctaInner: {
    width: "min(1200px, calc(100% - 48px))",
    margin: "0 auto",
    padding: "78px 0",
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "30px",
    alignItems: "center",
  },
  ctaTitle: {
    fontFamily: '"Playfair Display", Georgia, Cambria, "Times New Roman", serif',
    fontSize: "clamp(2.3rem, 5vw, 4rem)",
    lineHeight: 0.95,
    margin: "0 0 14px",
  },
  ctaCopy: {
    margin: 0,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "650px",
    fontSize: "1.05rem",
  },
};

const benefits = [
  { icon: "◷", label: "4 Live Sessions" },
  { icon: "⌘", label: "Async Work Inside Core Truth House OS" },
  { icon: "◌", label: "Core Truth Profile" },
  { icon: "✓", label: "90-Day Brand Operations Plan" },
];

const audience = [
  {
    icon: "◎",
    title: "Showing Up Without Sales",
    text: "You're consistent. People see you. The results still are not matching the effort.",
  },
  {
    icon: "✦",
    title: "Scattered Messaging",
    text: "Your brand has strong parts, but they are not locking together into a sentence that converts.",
  },
  {
    icon: "║",
    title: "3 to 10 Years In",
    text: "You've built a real business. Now you need positioning that carries the weight of it.",
  },
  {
    icon: "◎",
    title: "Ready for Repair",
    text: "This is for founders ready to fix the sentence costing them conversions.",
  },
];

const steps = [
  {
    number: "01",
    title: "Clarify",
    text: "We uncover your Core Truth and the real reason prospects are not converting.",
  },
  {
    number: "02",
    title: "Position",
    text: "We architect a positioning statement that makes your value easier to understand and trust.",
  },
  {
    number: "03",
    title: "Convert",
    text: "We build a conversion path that moves the right people from interest to yes.",
  },
  {
    number: "04",
    title: "Operationalize",
    text: "We install your 90-day Brand Operations Plan so clarity turns into consistent action.",
  },
];

const seatOptions = [
  {
    type: "founding",
    label: "Founding Seat",
    title: "The Founding Seat",
    price: "$497",
    note: "",
    description: "Founding seat in The Core Truth Cohort.",
    href: "/cohort/apply?seat=founding",
    cta: "Claim Founding Seat",
    footnote: "This pricing and lifetime access do not carry to Cohort 02.",
    bullets: [
      "14-day positioning sprint",
      "Four live sessions",
      "Async work inside Core Truth House OS",
      "Core Truth Profile",
      "90-day Brand Operations Plan",
      "Lifetime Estate tier access to the OS",
    ],
  },
  {
    type: "standard",
    label: "Standard Seat",
    title: "The Standard Seat",
    price: "$997",
    note: "One-time",
    description: "Seat in The Core Truth Cohort.",
    href: "/cohort/apply?seat=standard",
    cta: "Apply for Standard Seat",
    footnote: "Includes alumni access to The Core Truth House Residency upon completion.",
    bullets: [
      "14-day positioning sprint",
      "Four live sessions",
      "Async work inside Core Truth House OS",
      "Core Truth Profile",
      "90-day Brand Operations Plan",
      "12-month Estate tier access to Core Truth House OS",
      "Alumni access to The Core Truth House Residency upon completion",
    ],
  },
];

const outcomes = [
  { icon: "✦", text: "A sharper one-sentence positioning statement." },
  { icon: "⌒", text: "A clearer conversion path from first sentence to sale." },
  { icon: "◌", text: "A Core Truth Profile and messaging clarity." },
  { icon: "✓", text: "A 90-day Brand Operations Plan." },
];

const faqs = [
  {
    q: "Who is the cohort for?",
    a: "Solo service-based founders 3 to 10 years in who are showing up consistently but not converting. You have the skills. Your brand is not translating them into revenue.",
  },
  {
    q: "Do I get access to Core Truth House OS?",
    a: "Yes. Founding members receive lifetime Estate access. Standard members receive 12 months of Estate tier access.",
  },
  {
    q: "What if I need more foundational work?",
    a: "Take the Core Truth Scorecard first. If your score puts you in the Foundation Builder band, we will point you to the right entry point before the cohort. We do not admit founders who are not ready.",
  },
  {
    q: "What happens after the cohort ends?",
    a: "Founding members retain lifetime Estate access and join The Core Truth House Residency. Standard members retain 12-month access. After 12 months, alumni pricing on Structure tier locks in at $67 per month.",
  },
  {
    q: "What is the difference between Founding and Standard?",
    a: "Founding seats are $497 and include lifetime Estate tier access to Core Truth House OS. Standard seats are $997 and include 12-month Estate access. Founding pricing closes when Cohort 01 fills.",
  },
];

function Bullet({ children }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "rgba(255,255,255,0.86)", fontSize: "0.98rem" }}>
      <span style={{ color: "#C4A95B", fontWeight: 800, marginTop: 1 }}>✓</span>
      <span>{children}</span>
    </li>
  );
}

export default function CoreTruthCohortPage() {
  useEffect(() => {
    document.title = "Core Truth Cohort | Core Truth House";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "The Core Truth Cohort is a 14-day positioning sprint for solo founders who are consistent but not converting.");
  }, []);

  return (
    <>
      <PublicHeader active="cohort" />
      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.blueprintOverlay} aria-hidden="true" />
          <div style={styles.heroInner} className="cth-cohort-hero-inner">
            <div style={styles.heroCopy}>
              <span style={styles.eyebrow}>Core Truth House</span>
              <h1 style={styles.h1}>
                The Core Truth <span style={{ color: "#C4A95B" }}>Cohort</span>
              </h1>
              <p style={styles.heroLead}>
                A 14-day positioning sprint for solo founders who are{" "}
                <span style={{ color: "#C4A95B", fontWeight: 700 }}>
                  consistent but not converting
                </span>.
              </p>
              <p style={styles.heroBody}>
                You're showing up. You have depth, skill, and experience. But your positioning,
                messaging, or conversion path is leaking clarity. The Core Truth Cohort is a focused,
                high-touch sprint to repair what's costing you conversions and build a brand that finally performs.
              </p>
              <div style={styles.btnRow}>
                <Link to="/cohort/apply" style={{ ...styles.btn, ...styles.btnPrimary }}>
                  Apply for Cohort
                </Link>
                <a href="#seat-options" style={{ ...styles.btn, ...styles.btnSecondary }}>
                  View Seat Options
                </a>
              </div>
              <div style={styles.heroMeta}>
                <span>• Four live sessions</span>
                <span>• Async work inside the OS</span>
                <span>• Core Truth Profile</span>
                <span>• 90-day Brand Operations Plan</span>
              </div>
            </div>
            <div style={styles.heroVisual}>
              <div style={styles.heroGlow} aria-hidden="true" />
              <img
                src={doorwayAsset}
                alt="Arched architectural doorway with an open red door"
                style={styles.doorway}
              />
            </div>
          </div>
        </section>

        <section style={styles.featureStrip} aria-label="Cohort highlights">
          <div style={styles.featureWrap}>
            <div style={styles.featureGrid} className="cth-cohort-feature-grid">
              {benefits.map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    ...styles.featureItem,
                    borderRight: index === benefits.length - 1 ? "none" : styles.featureItem.borderRight,
                  }}
                >
                  <div style={styles.featureIcon}>{item.icon}</div>
                  <strong style={styles.featureText}>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.lightSection}>
          <div style={styles.wrap}>
            <div style={styles.sectionTag}>
              <span style={styles.eyebrow}>Who This Is For</span>
            </div>
            <h2 style={styles.sectionTitle}>Built for Solo Founders Ready to Convert</h2>
            <p style={styles.sectionCopy}>
              This is for founders with real expertise who are visible enough to know the problem is not effort.
              The repair happens in clarity, positioning, and conversion architecture.
            </p>
            <div style={styles.audienceGrid} className="cth-cohort-four-grid">
              {audience.map((item) => (
                <article key={item.title} style={styles.audienceCard}>
                  <div style={styles.cardIcon}>{item.icon}</div>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardText}>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.stepsSection}>
          <div style={styles.wrap}>
            <div style={styles.sectionTag}>
              <span style={styles.eyebrow}>What Happens in the Sprint</span>
            </div>
            <div style={styles.stepsGrid} className="cth-cohort-four-grid">
              {steps.map((step) => (
                <article key={step.number}>
                  <div style={styles.stepNumber}>{step.number}</div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.cardText}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.pricingSection} id="seat-options">
          <div style={styles.wrap}>
            <div style={styles.sectionTag}>
              <span style={styles.eyebrow}>Choose Your Seat</span>
            </div>
            <div style={styles.pricingGrid} className="cth-cohort-two-grid">
              {seatOptions.map((seat) => (
                <article
                  key={seat.type}
                  style={{
                    ...styles.priceCard,
                    ...(seat.type === "founding" ? styles.foundingCard : styles.standardCard),
                  }}
                >
                  <span style={styles.priceLabel}>{seat.label}</span>
                  <h3 style={styles.priceTitle}>{seat.title}</h3>
                  <div style={styles.priceLine}>
                    <div style={styles.priceValue}>{seat.price}</div>
                    {seat.note ? <div style={styles.priceNote}>{seat.note}</div> : null}
                  </div>
                  <p style={styles.priceDescription}>{seat.description}</p>
                  <ul style={styles.priceList}>
                    {seat.bullets.map((bullet) => (
                      <Bullet key={bullet}>{bullet}</Bullet>
                    ))}
                  </ul>
                  <Link to={seat.href} style={{ ...styles.btn, ...styles.btnPrimary }}>
                    {seat.cta}
                  </Link>
                  <p style={styles.cardFootnote}>{seat.footnote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.outcomesSection}>
          <div style={styles.wrap}>
            <div style={styles.sectionTag}>
              <span style={styles.eyebrow}>What You Leave With</span>
            </div>
            <div style={styles.outcomesGrid} className="cth-cohort-four-grid">
              {outcomes.map((item) => (
                <article key={item.text} style={styles.outcomeCard}>
                  <div style={styles.cardIcon}>{item.icon}</div>
                  <p style={{ margin: 0, fontSize: "0.98rem", color: "#2B1040" }}>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.faqSection}>
          <div style={styles.wrap}>
            <div style={styles.sectionTag}>
              <span style={styles.eyebrow}>Frequently Asked Questions</span>
            </div>
            <div style={styles.faqGrid} className="cth-cohort-two-grid">
              {faqs.map((faq) => (
                <article key={faq.q} style={styles.faqItem}>
                  <h3 style={styles.faqQuestion}>{faq.q}</h3>
                  <p style={styles.faqAnswer}>{faq.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.ctaBand}>
          <div style={styles.blueprintOverlay} aria-hidden="true" />
          <div style={styles.ctaInner} className="cth-cohort-cta-inner">
            <div>
              <span style={styles.eyebrow}>Core Truth House</span>
              <h2 style={styles.ctaTitle}>The sentence costing you conversions can be repaired.</h2>
              <p style={styles.ctaCopy}>
                Join a focused group of founders for a 14-day sprint to clarify, position, and convert with confidence.
              </p>
            </div>
            <Link to="/cohort/apply" style={{ ...styles.btn, ...styles.btnPrimary }}>
              Apply for Cohort
            </Link>
          </div>
        </section>

        <style>{`
          @media (max-width: 1120px) {
            .cth-cohort-hero-inner,
            .cth-cohort-cta-inner {
              grid-template-columns: 1fr !important;
            }
            .cth-cohort-feature-grid,
            .cth-cohort-four-grid,
            .cth-cohort-two-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 760px) {
            .cth-cohort-hero-inner {
              width: min(100% - 28px, 100%) !important;
              padding: 52px 0 36px !important;
              min-height: auto !important;
              gap: 28px !important;
            }
            .cth-cohort-cta-inner {
              width: min(100% - 28px, 100%) !important;
              padding: 64px 0 !important;
            }
            .cth-cohort-feature-grid,
            .cth-cohort-four-grid,
            .cth-cohort-two-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
      <PublicFooter />
    </>
  );
}
