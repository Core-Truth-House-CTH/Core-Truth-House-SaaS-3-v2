import React, { useState } from "react";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import API_PATHS from "../lib/apiPaths";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://api.coretruthhouse.com"
).replace(/\/$/, "");

// 12-question brand positioning diagnostic. Answer order is index 0-3;
// scoring (including the inverted question) is handled server-side.
const QUESTIONS = [
  {
    q: `If a stranger asked what you do, which is closest to what would come out of your mouth?`,
    answers: [
      `I help [broad audience] with [broad outcome].`,
      `I help [specific audience] with [specific outcome].`,
      `I help [specific audience] struggling with [specific problem] get to [specific outcome].`,
      `I have a trained one-sentence answer that makes people ask a follow-up every time.`,
    ],
  },
  {
    q: `When someone says 'tell me about your client,' how specific can you get in 30 seconds?`,
    answers: [
      `I describe a demographic: age, gender, industry.`,
      `I describe a situation they are in.`,
      `I describe their internal experience and what keeps them up at night.`,
      `I can name three clients who fit the exact same pattern and know why they picked me.`,
    ],
  },
  {
    q: `What do most paying clients say right before they decide to hire you?`,
    answers: [
      `I don't know. It varies.`,
      `Something about price or timing.`,
      `"You get it" or "You're speaking directly to me."`,
      `I've heard the same specific phrase from at least three clients. I can quote it.`,
    ],
  },
  {
    q: `What's the most common objection right before someone doesn't buy?`,
    answers: [
      `"I need to think about it."`,
      `"It's not the right time."`,
      `"It's outside my budget."`,
      `I rarely get objections. People either buy or self-select out before the conversation.`,
    ],
  },
  {
    q: `How do most new clients find you?`,
    answers: [
      `I'm not consistently attracting new clients right now.`,
      `Networking, events, or outbound outreach.`,
      `Social media content I post consistently.`,
      `Referrals from past clients or word of mouth.`,
    ],
  },
  {
    q: `When you look at three direct competitors, how would you describe the difference?`,
    answers: [
      `I'm not sure who my real competitors are.`,
      `I do similar work, but my personality is different.`,
      `I have a different methodology or framework I can name.`,
      `I serve a specific slice of the market my competitors don't, and I can articulate why.`,
    ],
  },
  {
    q: `How often do you rewrite your bio, about page, or intro?`,
    answers: [
      `Every few months. I'm always tweaking it.`,
      `Once or twice a year.`,
      `It's been stable for over a year and I don't question it.`,
      `It's stable because it works. I can point to specific proof.`,
    ],
  },
  {
    q: `What happens when you post content?`,
    answers: [
      `Crickets. Low engagement.`,
      `Engagement from peers or people who won't buy.`,
      `Engagement from ideal clients, but it rarely converts to inquiries.`,
      `Engagement from ideal clients, and a predictable portion turns into inquiries or sales.`,
    ],
  },
  {
    q: `How do you feel about your current pricing?`,
    answers: [
      `I lower it more often than I want to admit.`,
      `I hold the price, but I apologize for it internally.`,
      `I hold the price and feel solid about it most of the time.`,
      `I've raised my price in the last 12 months and conversion didn't drop.`,
    ],
  },
  {
    q: `When a right-fit client books a call, what's your conversion rate to a paid engagement?`,
    answers: [
      `Under 25%.`,
      `25 to 50%.`,
      `50 to 75%.`,
      `Over 75%.`,
    ],
  },
  {
    q: `If you had to describe the core transformation your brand promises in one sentence, could you?`,
    answers: [
      `Not confidently.`,
      `Yes, but it sounds generic when I say it out loud.`,
      `Yes, and it sounds specific.`,
      `Yes, and I've tested it. I know which version lands.`,
    ],
  },
  {
    q: `What would need to be true to double your revenue in the next 12 months without doubling your hours?`,
    answers: [
      `I need more traffic.`,
      `I need a better offer.`,
      `I need to raise prices and convert at a higher rate.`,
      `I need to stop chasing the wrong clients. My positioning needs to do more work before the call.`,
    ],
  },
];

const TOTAL = QUESTIONS.length;

const BANDS = {
  operator: {
    title: "The Operator",
    message:
      "Your positioning is doing most of what positioning is supposed to do. The Core Truth Cohort is not the right fit right now. It is built for founders who need positioning repair, and you do not. What you need is ongoing brand operations.",
    ctaLabel: "Explore Core Truth House OS",
    ctaHref: "/tiers",
    emphasis: false,
  },
  stuck: {
    title: "The Stuck Specialist",
    message:
      "You know who you are and what you do. But somewhere between your first sentence and the sale, clarity leaks out. The Core Truth Cohort was built exactly for this.",
    ctaLabel: "Apply for The Core Truth Cohort",
    ctaHref: "/cohort/apply",
    emphasis: true,
  },
  foundation: {
    title: "The Foundation Builder",
    message:
      "The work ahead of you is foundational. Trying to sprint through positioning in 14 days would skip the layers that need to come first. Start with the Foundation tier of Core Truth House OS.",
    ctaLabel: "Start with Foundation",
    ctaHref: "/tiers",
    emphasis: false,
  },
  pre_brand: {
    title: "The Pre-Brand Founder",
    message:
      "You are earlier in the journey than this diagnostic is built for. The most useful thing right now is building the raw material a brand gets made from.",
    ctaLabel: "Explore Free Resources",
    ctaHref: "/field-notes",
    emphasis: false,
  },
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ScorecardPage() {
  const [phase, setPhase] = useState("intro"); // intro | questions | results
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null));
  const [advancing, setAdvancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const trimmedName = firstName.trim();
  const trimmedEmail = email.trim();
  const canStart = trimmedName.length > 0 && EMAIL_RE.test(trimmedEmail);

  function handleStart(event) {
    event.preventDefault();
    if (!canStart) {
      setError("Add your first name and a valid email to begin.");
      return;
    }
    setError("");
    setCurrent(0);
    setPhase("questions");
  }

  async function submitAnswers(finalAnswers) {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${API_PATHS.scorecard.submit}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          first_name: trimmedName,
          answers: finalAnswers,
        }),
      });
      if (!response.ok) {
        throw new Error(`Scorecard submit failed (${response.status})`);
      }
      const data = await response.json();
      setResult(data);
      setPhase("results");
    } catch (err) {
      setError("Something went wrong scoring your answers. Please try again.");
    } finally {
      setSubmitting(false);
      setAdvancing(false);
    }
  }

  function handleSelect(answerIndex) {
    if (advancing || submitting) return;
    const next = answers.slice();
    next[current] = answerIndex;
    setAnswers(next);
    setAdvancing(true);
    window.setTimeout(() => {
      if (current < TOTAL - 1) {
        setCurrent(current + 1);
        setAdvancing(false);
      } else {
        submitAnswers(next);
      }
    }, 240);
  }

  function goBack() {
    if (submitting || advancing) return;
    setError("");
    if (current === 0) {
      setPhase("intro");
    } else {
      setCurrent(current - 1);
    }
  }

  const progressPct = Math.round(((current + 1) / TOTAL) * 100);
  const submitFailed = Boolean(error) && phase === "questions" && current === TOTAL - 1;

  return (
    <main className="sc-page">
      <PublicHeader />

      <section className="sc-stage">
        <div className="sc-shell">
          {submitting ? (
            <div className="sc-block sc-center" key="loading">
              <div className="sc-spinner" aria-hidden="true" />
              <p className="sc-loading-text">Scoring your answers...</p>
            </div>
          ) : phase === "results" && result ? (
            <Results result={result} />
          ) : phase === "questions" ? (
            <div className="sc-block" key={`q-${current}`}>
              <div className="sc-progress">
                <span className="sc-counter">
                  Question {current + 1} <span className="sc-counter-of">/ {TOTAL}</span>
                </span>
                <div className="sc-track">
                  <div className="sc-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <h2 className="sc-question">{QUESTIONS[current].q}</h2>

              <div className="sc-answers">
                {QUESTIONS[current].answers.map((answer, index) => (
                  <button
                    type="button"
                    key={index}
                    className={
                      "sc-answer" + (answers[current] === index ? " is-selected" : "")
                    }
                    style={{ animationDelay: `${index * 70}ms` }}
                    onClick={() => handleSelect(index)}
                    disabled={advancing}
                  >
                    <span className="sc-marker">{String.fromCharCode(65 + index)}</span>
                    <span className="sc-answer-text">{answer}</span>
                  </button>
                ))}
              </div>

              {submitFailed && (
                <div className="sc-retry">
                  <p className="sc-error">{error}</p>
                  <button
                    type="button"
                    className="sc-btn sc-btn-primary"
                    onClick={() => submitAnswers(answers)}
                  >
                    Try again
                  </button>
                </div>
              )}

              <button type="button" className="sc-back" onClick={goBack}>
                &larr; Back
              </button>
            </div>
          ) : (
            <div className="sc-block sc-intro" key="intro">
              <p className="sc-eyebrow">Core Truth House</p>
              <h1 className="sc-headline">
                Find the sentence in your brand that's costing you conversions.
              </h1>
              <p className="sc-sub">
                12 questions. One score. The positioning gap your revenue already
                knows about.
              </p>

              <form className="sc-form" onSubmit={handleStart} noValidate>
                <div className="sc-field">
                  <label htmlFor="sc-first">First name</label>
                  <input
                    id="sc-first"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                  />
                </div>
                <div className="sc-field">
                  <label htmlFor="sc-email">Email</label>
                  <input
                    id="sc-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbrand.com"
                  />
                </div>

                {error && <p className="sc-error">{error}</p>}

                <button type="submit" className="sc-btn sc-btn-primary sc-btn-full">
                  Start the Scorecard
                </button>
              </form>

              <p className="sc-fineprint">Takes under 4 minutes. Free.</p>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
      <ScorecardStyles />
    </main>
  );
}

function Results({ result }) {
  const band = BANDS[result.band] || BANDS.pre_brand;
  const maxScore = result.max_score || 48;

  return (
    <div className="sc-block sc-results" key="results">
      <p className="sc-eyebrow">Your Result</p>

      <div className="sc-score">
        <span className="sc-score-num">{result.score}</span>
        <span className="sc-score-max">/ {maxScore}</span>
      </div>

      <h1 className="sc-result-title">{result.band_label || band.title}</h1>
      <p className="sc-result-message">{band.message}</p>

      <a
        href={band.ctaHref}
        className={"sc-btn " + (band.emphasis ? "sc-btn-primary" : "sc-btn-dark")}
      >
        {band.ctaLabel}
      </a>

      <p className="sc-fineprint">
        Check your email. Your full score report is on its way.
      </p>
    </div>
  );
}

function ScorecardStyles() {
  return (
    <style>{`
      .sc-page {
        min-height: 100vh;
        color: #2b1040;
        font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        background:
          radial-gradient(circle at 82% 4%, rgba(175, 0, 36, .07), transparent 42%),
          radial-gradient(circle at 6% 96%, rgba(43, 16, 64, .06), transparent 38%),
          linear-gradient(168deg, #f3ece7 0%, #efe7e3 56%, #e7dcd5 100%);
        background-attachment: fixed;
      }

      .sc-stage {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 76px 0 104px;
      }

      .sc-shell {
        width: min(720px, calc(100vw - 48px));
        margin: 0 auto;
      }

      .sc-block {
        animation: scFade .46s cubic-bezier(.22, .61, .36, 1) both;
      }

      .sc-center {
        text-align: center;
        padding: 80px 0;
      }

      @keyframes scFade {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .sc-eyebrow {
        margin: 0 0 18px;
        color: #af0024;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .22em;
      }

      .sc-headline {
        margin: 0;
        font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        font-size: clamp(34px, 5vw, 54px);
        line-height: 1.06;
        letter-spacing: -.03em;
        color: #2b1040;
      }

      .sc-sub {
        margin: 22px 0 0;
        max-width: 540px;
        color: #6b5d6a;
        font-size: 17px;
        line-height: 1.7;
      }

      /* ---- Intro form ---- */
      .sc-form {
        margin: 38px 0 0;
        display: grid;
        gap: 18px;
      }

      .sc-field {
        display: grid;
        gap: 8px;
      }

      .sc-field label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .14em;
        color: #8a7d88;
      }

      .sc-field input {
        width: 100%;
        box-sizing: border-box;
        padding: 15px 18px;
        font-family: inherit;
        font-size: 16px;
        color: #2b1040;
        background: #fdfbf9;
        border: 1px solid rgba(43, 16, 64, .16);
        border-radius: 4px;
        outline: none;
        transition: border-color .18s ease, box-shadow .18s ease;
      }

      .sc-field input::placeholder { color: #b3a8b0; }

      .sc-field input:focus {
        border-color: #af0024;
        box-shadow: 0 0 0 3px rgba(175, 0, 36, .12);
      }

      /* ---- Buttons ---- */
      .sc-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 54px;
        padding: 0 32px;
        border: none;
        border-radius: 4px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .12em;
        text-decoration: none;
        cursor: pointer;
        transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
      }

      .sc-btn-full { width: 100%; }

      .sc-btn-primary {
        color: #fff;
        background: #af0024;
        box-shadow: 0 16px 32px rgba(175, 0, 36, .22);
      }

      .sc-btn-primary:hover {
        background: #8a001d;
        transform: translateY(-2px);
        box-shadow: 0 20px 38px rgba(175, 0, 36, .28);
      }

      .sc-btn-dark {
        color: #fff;
        background: #2b1040;
        box-shadow: 0 16px 32px rgba(43, 16, 64, .2);
      }

      .sc-btn-dark:hover {
        background: #3a1856;
        transform: translateY(-2px);
        box-shadow: 0 20px 38px rgba(43, 16, 64, .26);
      }

      .sc-fineprint {
        margin: 20px 0 0;
        color: #948896;
        font-size: 13px;
        letter-spacing: .01em;
      }

      .sc-error {
        margin: 0;
        color: #af0024;
        font-size: 14px;
        font-weight: 600;
      }

      /* ---- Progress ---- */
      .sc-progress {
        margin-bottom: 34px;
      }

      .sc-counter {
        display: block;
        margin-bottom: 12px;
        color: #c4a95b;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .2em;
      }

      .sc-counter-of { color: #bdae8e; }

      .sc-track {
        height: 3px;
        width: 100%;
        background: rgba(43, 16, 64, .12);
        border-radius: 999px;
        overflow: hidden;
      }

      .sc-fill {
        height: 100%;
        background: linear-gradient(90deg, #af0024, #d1452c);
        border-radius: 999px;
        transition: width .55s cubic-bezier(.4, 0, .2, 1);
      }

      /* ---- Question ---- */
      .sc-question {
        margin: 0 0 30px;
        font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        font-size: clamp(25px, 3.4vw, 36px);
        line-height: 1.18;
        letter-spacing: -.02em;
        color: #2b1040;
      }

      .sc-answers {
        display: grid;
        gap: 12px;
      }

      .sc-answer {
        display: flex;
        align-items: center;
        gap: 18px;
        width: 100%;
        text-align: left;
        padding: 20px 22px;
        background: #fdfbf9;
        border: 1px solid rgba(43, 16, 64, .12);
        border-left: 3px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        animation: scFade .5s cubic-bezier(.22, .61, .36, 1) both;
        transition: border-color .16s ease, transform .16s ease,
          box-shadow .16s ease, background .16s ease;
      }

      .sc-answer:hover {
        background: #fff;
        border-left-color: #af0024;
        transform: translateX(3px);
        box-shadow: 0 14px 30px rgba(43, 16, 64, .1);
      }

      .sc-answer.is-selected {
        background: #fff;
        border-color: rgba(175, 0, 36, .4);
        border-left-color: #af0024;
      }

      .sc-answer:disabled { cursor: default; }

      .sc-marker {
        flex: none;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: #f0e7e1;
        color: #8a7d88;
        font-size: 13px;
        font-weight: 800;
        transition: background .16s ease, color .16s ease;
      }

      .sc-answer:hover .sc-marker,
      .sc-answer.is-selected .sc-marker {
        background: #af0024;
        color: #fff;
      }

      .sc-answer-text {
        font-size: 16px;
        line-height: 1.5;
        color: #3a2b40;
      }

      .sc-retry {
        margin-top: 24px;
        display: grid;
        gap: 14px;
        justify-items: start;
      }

      .sc-back {
        margin-top: 28px;
        padding: 8px 0;
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .14em;
        color: #948896;
        transition: color .16s ease;
      }

      .sc-back:hover { color: #af0024; }

      /* ---- Loading ---- */
      .sc-spinner {
        width: 38px;
        height: 38px;
        margin: 0 auto 22px;
        border: 3px solid rgba(43, 16, 64, .14);
        border-top-color: #af0024;
        border-radius: 999px;
        animation: scSpin .8s linear infinite;
      }

      @keyframes scSpin { to { transform: rotate(360deg); } }

      .sc-loading-text {
        margin: 0;
        color: #6b5d6a;
        font-size: 15px;
        letter-spacing: .04em;
      }

      /* ---- Results ---- */
      .sc-results { text-align: left; }

      .sc-score {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin: 6px 0 14px;
      }

      .sc-score-num {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: clamp(76px, 12vw, 124px);
        line-height: .9;
        font-weight: 600;
        color: #af0024;
      }

      .sc-score-max {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: clamp(26px, 4vw, 40px);
        color: #c0b1bd;
      }

      .sc-result-title {
        margin: 0;
        font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        font-size: clamp(32px, 4.6vw, 50px);
        line-height: 1.06;
        letter-spacing: -.03em;
        color: #2b1040;
      }

      .sc-result-message {
        margin: 20px 0 32px;
        max-width: 560px;
        color: #5e5364;
        font-size: 17px;
        line-height: 1.74;
      }

      @media (max-width: 600px) {
        .sc-stage { padding: 52px 0 76px; }
        .sc-answer { padding: 17px 18px; gap: 14px; }
        .sc-btn { width: 100%; }
      }
    `}</style>
  );
}
