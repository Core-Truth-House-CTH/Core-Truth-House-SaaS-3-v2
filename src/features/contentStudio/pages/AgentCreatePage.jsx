import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import EstateGate from "../components/EstateGate";
import { Field, PageHeader } from "../components/Primitives";
import { ErrorState } from "../components/States";
import { useMutation } from "../hooks/useAsyncResource";
import { createCustomAgent } from "../api/contentStudioApi";
import { AGENT_CATEGORIES, agentCreateSchema, validate } from "../schemas/contentStudioSchemas";
import { useContentStudio } from "../context/ContentStudioProvider";

/** Approved screen 5 — Create Custom Agent (Estate tier only). */

const STEPS = [
  { key: "basic", label: "Basic Information" },
  { key: "knowledge", label: "Knowledge Sources" },
  { key: "instructions", label: "Instructions" },
  { key: "tools", label: "Tools & Actions" },
  { key: "outputs", label: "Outputs" },
  { key: "review", label: "Review & Create" },
];

const TOOL_OPTIONS = ["search", "brand_memory", "media_library", "analytics", "calendar", "email"];
const OUTPUT_OPTIONS = ["caption", "email", "script", "outline", "headline", "post"];

const EMPTY = {
  name: "",
  description: "",
  category: "",
  instructions: "",
  knowledge_source_ids: [],
  tools: [],
  output_types: [],
};

function TierPanel() {
  const { isEstate, trialActive, addOnActive, daysRemaining, entitlement } = useContentStudio();
  const rows = [
    { label: "Estate Plan", value: isEstate ? "Active" : "Required" },
    {
      label: "Agents & Automations Add-On",
      value: addOnActive ? "Active" : trialActive ? "Active Trial" : "Required",
    },
  ];
  if (entitlement?.trial_ends_at && trialActive) {
    rows.push({ label: "Trial days left", value: `${daysRemaining} days` });
  }

  return (
    <aside className="cs-card cs-card-pad cs-triple-aside" aria-labelledby="cs-tier-heading">
      <h2 id="cs-tier-heading" className="cs-h3" style={{ marginBottom: 14 }}>
        Tier &amp; Access
      </h2>
      <dl style={{ margin: 0, display: "grid", gap: 11 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <dt style={{ fontSize: 12, color: "var(--cs-ruby)" }}>{row.label}</dt>
            <dd style={{ fontSize: 12, margin: 0, color: "var(--cs-ink)", fontWeight: 500 }}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p style={{ fontSize: 11, color: "var(--cs-tuscany)", marginTop: 14, lineHeight: 1.5 }}>
        Billed monthly. Cancel anytime.
      </p>
    </aside>
  );
}

function CheckboxList({ options, selected, onToggle, name }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="sr-only">{name}</legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <label
              key={option}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 12px",
                minHeight: 36,
                borderRadius: "var(--cs-radius-pill)",
                border: `1px solid ${active ? "var(--cs-crimson)" : "var(--cs-border)"}`,
                background: active ? "var(--cs-crimson-soft)" : "var(--cs-panel)",
                fontSize: 12,
                color: active ? "var(--cs-crimson)" : "var(--cs-ruby)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onToggle(option)}
                style={{ width: 13, height: 13, accentColor: "var(--cs-crimson)" }}
              />
              {option.replace(/_/g, " ")}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function AgentCreateInner() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const creation = useMutation((payload) => createCustomAgent(payload));

  const step = STEPS[stepIndex];
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggle = (key, option) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(option) ? prev[key].filter((v) => v !== option) : [...prev[key], option],
    }));

  const validateBasics = () => {
    const result = validate(agentCreateSchema, form);
    setErrors(result.errors);
    return result;
  };

  const next = () => {
    if (step.key === "basic") {
      const result = validate(agentCreateSchema.pick({ name: true, description: true, category: true }), form);
      setErrors(result.errors);
      if (!result.ok) return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = validateBasics();
    if (!result.ok) {
      setStepIndex(0);
      return;
    }
    const outcome = await creation.mutate(result.data);
    if (outcome.ok) {
      navigate(`/content-studio/agents/${encodeURIComponent(outcome.data.id)}`, { replace: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Link to="/content-studio/agents" className="cs-btn cs-btn-ghost" style={{ marginBottom: 12 }}>
        <ChevronLeft size={14} aria-hidden="true" />
        All agents
      </Link>

      <PageHeader
        title="Create Custom Agent"
        subtitle="Train an agent on your brand voice, knowledge, and output style."
        eyebrow="Estate tier only"
      />

      <div className="cs-triple">
        {/* Step rail */}
        <nav aria-label="Agent setup steps">
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
            {STEPS.map((item, index) => {
              const active = index === stepIndex;
              const done = index < stepIndex;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setStepIndex(index)}
                    aria-current={active ? "step" : undefined}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      minHeight: 42,
                      borderRadius: "var(--cs-radius)",
                      border: 0,
                      background: active ? "var(--cs-crimson-soft)" : "transparent",
                      color: active ? "var(--cs-crimson)" : "var(--cs-ruby)",
                      fontSize: 12.5,
                      fontFamily: "var(--cs-sans)",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        flexShrink: 0,
                        background: active || done ? "var(--cs-crimson)" : "var(--cs-blush)",
                        color: active || done ? "#fff" : "var(--cs-ruby)",
                      }}
                    >
                      {index + 1}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step body */}
        <section className="cs-card cs-card-pad" aria-labelledby="cs-step-heading">
          <h2 id="cs-step-heading" className="cs-h2" style={{ fontSize: 18, marginBottom: 16 }}>
            {step.label}
          </h2>

          {step.key === "basic" ? (
            <>
              <Field label="Agent name" error={errors.name} required>
                <input
                  className="cs-input"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. My Brand Strategist"
                />
              </Field>
              <Field label="Description" error={errors.description} required>
                <textarea
                  className="cs-textarea"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="What will this agent do?"
                />
              </Field>
              <Field label="Category" error={errors.category} required>
                <select
                  className="cs-select"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  <option value="">Select a category</option>
                  {AGENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}

          {step.key === "knowledge" ? (
            <Field
              label="Knowledge source IDs"
              hint="Comma separated. Leave blank to use workspace brand memory only."
              error={errors.knowledge_source_ids}
            >
              <input
                className="cs-input"
                value={form.knowledge_source_ids.join(", ")}
                onChange={(e) =>
                  setField(
                    "knowledge_source_ids",
                    e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                  )
                }
              />
            </Field>
          ) : null}

          {step.key === "instructions" ? (
            <Field
              label="Instructions"
              hint={`${form.instructions.length} / 12000 characters`}
              error={errors.instructions}
            >
              <textarea
                className="cs-textarea"
                style={{ minHeight: 200 }}
                value={form.instructions}
                onChange={(e) => setField("instructions", e.target.value)}
                placeholder="How should this agent think, speak, and decide?"
              />
            </Field>
          ) : null}

          {step.key === "tools" ? (
            <CheckboxList
              name="Tools"
              options={TOOL_OPTIONS}
              selected={form.tools}
              onToggle={(o) => toggle("tools", o)}
            />
          ) : null}

          {step.key === "outputs" ? (
            <CheckboxList
              name="Output types"
              options={OUTPUT_OPTIONS}
              selected={form.output_types}
              onToggle={(o) => toggle("output_types", o)}
            />
          ) : null}

          {step.key === "review" ? (
            <dl style={{ margin: 0, display: "grid", gap: 12 }}>
              {[
                ["Name", form.name || "—"],
                ["Category", form.category || "—"],
                ["Description", form.description || "—"],
                ["Tools", form.tools.join(", ") || "None"],
                ["Outputs", form.output_types.join(", ") || "None"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="cs-h3" style={{ marginBottom: 3 }}>{label}</dt>
                  <dd style={{ margin: 0, fontSize: 13, color: "var(--cs-ink)" }}>{value}</dd>
                </div>
              ))}
              <p style={{ fontSize: 12, color: "var(--cs-ruby)", margin: 0 }}>
                New agents are created as a draft. You can activate the agent after reviewing it.
              </p>
            </dl>
          ) : null}

          {creation.error ? (
            <div style={{ marginTop: 16 }}>
              <ErrorState error={creation.error} compact />
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            {stepIndex > 0 ? (
              <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </button>
            ) : (
              <Link to="/content-studio/agents" className="cs-btn cs-btn-secondary">
                Cancel
              </Link>
            )}

            {stepIndex < STEPS.length - 1 ? (
              <button type="button" className="cs-btn cs-btn-primary" onClick={next}>
                Next
              </button>
            ) : (
              <button type="submit" className="cs-btn cs-btn-primary" disabled={creation.busy}>
                {creation.busy ? "Creating…" : "Create agent"}
              </button>
            )}
          </div>
        </section>

        <TierPanel />
      </div>
    </form>
  );
}

/**
 * EstateGate renders its children when the workspace is entitled, and the
 * plan/add-on explanation otherwise — so the wizard and the gate panel are
 * never both on screen.
 */
function GatedAgentCreate() {
  return (
    <EstateGate feature="Creating a custom agent" mode="block">
      <AgentCreateInner />
    </EstateGate>
  );
}

export default function AgentCreatePage() {
  return (
    <ContentStudioShell title="Create custom agent">
      <div className="cs-page">
        <GatedAgentCreate />
      </div>
    </ContentStudioShell>
  );
}
