import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import {
  Check,
  ChevronRight,
  Circle,
  Loader2,
  Lock,
  Pencil,
  Wand2,
} from "lucide-react";

const STAGES = [
  {
    id: "awareness",
    number: 1,
    label: "Awareness",
    subtitle: "How strangers discover you",
    description:
      "The first moment someone encounters your brand. They do not know you yet. What brings them into your world?",
    fields: [
      {
        id: "discovery_channel",
        label: "Primary discovery channel",
        type: "select",
        options: [
          "Social Media",
          "Search/SEO",
          "Referral",
          "Podcast",
          "Speaking",
          "Paid Ads",
          "Content/Blog",
          "Community",
          "Word of Mouth",
          "Other",
        ],
      },
      {
        id: "first_touchpoint",
        label: "What they see first",
        type: "text",
        placeholder:
          "The first piece of content, post, or touchpoint they encounter",
      },
      {
        id: "pattern_interrupt",
        label: "What makes them stop scrolling",
        type: "text",
        placeholder: "The hook or pattern interrupt",
      },
    ],
    narrative: {
      label: "Describe the awareness experience",
      placeholder:
        "What does a stranger experience when they first encounter your brand? What are they feeling, thinking, and looking for at this stage?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "education",
    number: 2,
    label: "Education",
    subtitle: "How they learn what you do",
    description:
      "They noticed you. Now they are trying to understand if you are relevant to them.",
    fields: [
      {
        id: "education_content_type",
        label: "Primary education content type",
        type: "select",
        options: [
          "Blog posts",
          "Video content",
          "Social media posts",
          "Email newsletter",
          "Podcast episodes",
          "Free guide or resource",
          "Webinar or training",
          "Other",
        ],
      },
      {
        id: "key_question",
        label: "Key question they are asking",
        type: "text",
        placeholder: "The main question they want answered",
      },
      {
        id: "education_where",
        label: "Where education happens",
        type: "text",
        placeholder: "Platform or channel where they consume",
      },
    ],
    narrative: {
      label: "Describe the education experience",
      placeholder:
        "How does your ideal client learn about your approach and method? What content moves them from curious to interested?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "trustBuilding",
    number: 3,
    label: "Trust Building",
    subtitle: "How they decide you are credible",
    description:
      "They understand what you do. Now they are evaluating whether to believe you.",
    fields: [
      {
        id: "trust_signal",
        label: "Primary trust signal",
        type: "select",
        options: [
          "Client testimonials",
          "Case studies",
          "Social proof numbers",
          "Credentials or awards",
          "Behind the scenes content",
          "Consistent content",
          "Free value or samples",
          "Media mentions",
          "Other",
        ],
      },
      {
        id: "biggest_objection",
        label: "Biggest objection at this stage",
        type: "text",
        placeholder: "What they are skeptical about",
      },
      {
        id: "skeptic_to_believer",
        label: "What converts skeptic to believer",
        type: "text",
        placeholder: "The moment trust tips",
      },
    ],
    narrative: {
      label: "Describe the trust-building experience",
      placeholder:
        "What does your ideal client need to see, hear, or experience before they trust you enough to take the next step?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "leadMagnet",
    number: 4,
    label: "Lead Magnet or Diagnostic",
    subtitle: "Your free entry point",
    description:
      "The first action they take with you. Low risk, high value. The bridge between interest and commitment.",
    fields: [
      {
        id: "lead_magnet_type",
        label: "Lead magnet type",
        type: "select",
        options: [
          "Free diagnostic or assessment",
          "Free guide or PDF",
          "Free training or webinar",
          "Free consultation or call",
          "Free trial or demo",
          "Quiz or scorecard",
          "Email course",
          "Community access",
          "Other",
        ],
      },
      {
        id: "lead_magnet_name",
        label: "Lead magnet name or title",
        type: "text",
        placeholder: "What it is called",
      },
      {
        id: "primary_cta",
        label: "Primary CTA text",
        type: "text",
        placeholder: "The exact words you use to invite them",
      },
    ],
    narrative: {
      label: "Describe the lead magnet experience",
      placeholder:
        "What does your ideal client receive from your free entry point? What transformation or insight does it deliver? What do they feel after completing it?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "offerRecommendation",
    number: 5,
    label: "Offer Recommendation",
    subtitle: "How they find the right offer",
    description:
      "They took the free step. Now they are evaluating your paid offer. What moves them from interested to ready to buy?",
    fields: [
      {
        id: "offer_presentation",
        label: "How offer is presented",
        type: "select",
        options: [
          "Sales page",
          "Direct message or DM",
          "Sales call",
          "Email sequence",
          "Application",
          "Checkout page",
          "Proposal",
          "Other",
        ],
      },
      {
        id: "primary_offer",
        label: "Primary offer at this stage",
        type: "text",
        placeholder: "Name and price of the main offer",
      },
      {
        id: "deciding_factor",
        label: "The deciding factor",
        type: "text",
        placeholder: "What makes them say yes",
      },
    ],
    narrative: {
      label: "Describe the offer recommendation experience",
      placeholder:
        "How does your ideal client discover and evaluate your core offer? What questions do they ask? What makes them decide to buy?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "purchase",
    number: 6,
    label: "Purchase",
    subtitle: "The moment they buy",
    description:
      "They decided. Now they need the transaction to feel as good as the decision.",
    fields: [
      {
        id: "purchase_method",
        label: "Purchase method",
        type: "select",
        options: [
          "Online checkout",
          "Invoice",
          "Application and payment",
          "Stripe link",
          "Discovery call then invoice",
          "In-person payment",
          "Other",
        ],
      },
      {
        id: "immediate_delivery",
        label: "What they receive immediately after purchase",
        type: "text",
        placeholder: "The first thing they get",
      },
      {
        id: "decision_confirmation",
        label: "How they feel confirmed in their decision",
        type: "text",
        placeholder: "What validates the purchase was right",
      },
    ],
    narrative: {
      label: "Describe the purchase experience",
      placeholder:
        "What happens the moment someone buys? What is the immediate experience? What confirmation, welcome, or first touchpoint reassures them they made the right decision?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "onboarding",
    number: 7,
    label: "Onboarding",
    subtitle: "How you welcome and activate new clients",
    description:
      "They paid. Now the real relationship begins. Onboarding sets the tone for everything that follows.",
    fields: [
      {
        id: "onboarding_format",
        label: "Onboarding format",
        type: "select",
        options: [
          "Welcome email sequence",
          "Onboarding call",
          "Welcome video",
          "Onboarding document or guide",
          "Community or portal access",
          "Project kickoff meeting",
          "Other",
        ],
      },
      {
        id: "first_win",
        label: "First win delivered",
        type: "text",
        placeholder: "The first result or milestone they hit",
      },
      {
        id: "time_to_value",
        label: "Time to first value",
        type: "text",
        placeholder: "How long until they feel the benefit",
      },
    ],
    narrative: {
      label: "Describe the onboarding experience",
      placeholder:
        "Walk through the onboarding experience from the client's perspective. What happens in the first 24 hours, first week, first month? What makes them feel they are in good hands?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "retentionReferral",
    number: 8,
    label: "Retention and Referral",
    subtitle: "How clients stay and bring others",
    description:
      "The client got results. Now what keeps them, upgrades them, and turns them into advocates?",
    fields: [
      {
        id: "retention_mechanism",
        label: "Primary retention mechanism",
        type: "select",
        options: [
          "Ongoing results and check-ins",
          "Community membership",
          "Subscription or retainer",
          "Upgrade path to next offer",
          "Content that keeps them engaged",
          "Loyalty rewards or exclusives",
          "Other",
        ],
      },
      {
        id: "upgrade_path",
        label: "How clients upgrade or continue",
        type: "text",
        placeholder: "The path from one offer to the next",
      },
      {
        id: "referral_trigger",
        label: "How referrals happen",
        type: "text",
        placeholder: "What prompts clients to recommend you",
      },
    ],
    narrative: {
      label: "Describe the retention and referral experience",
      placeholder:
        "What keeps your best clients engaged after the initial offer is complete? How do they naturally move to the next level? What makes them tell others about you?",
      minLength: 30,
      maxLength: 600,
    },
  },
];

// Presentational extras keyed by stage id — tips row + Zuri idle suggestion.
// Kept separate from STAGES so persisted field ids are never touched.
const STAGE_EXTRAS = {
  awareness: {
    tips: [
      "Lead with the problem they already feel, not your brand name",
      "Your first three seconds decide everything — earn the next three",
      "Show up where they already are, not where you wish they were",
    ],
    zuriHint:
      "“Awareness isn't about being seen — it's about being recognized by the person who's been looking for you.”",
  },
  education: {
    tips: [
      "Teach the one idea that reframes how they see their problem",
      "Make your method feel inevitable, not optional",
      "Answer the question they're too unsure to ask out loud",
    ],
    zuriHint:
      "“People don't buy what they understand — they buy from the person who helped them understand it.”",
  },
  trustBuilding: {
    tips: [
      "Proof beats promise — show the result before you describe it",
      "Name the objection before they do, then dissolve it",
      "Consistency is the trust signal no competitor can fake",
    ],
    zuriHint:
      "“Trust is built in the gap between what you said you'd do and what they watched you actually do.”",
  },
  leadMagnet: {
    tips: [
      "Make it solve one specific problem, not everything at once",
      "Name it so clearly the right person knows it is for them",
      "The CTA should feel like the obvious next step, not a sale",
    ],
    zuriHint:
      "“A strong lead magnet names the problem so precisely that your ideal client feels seen before they've even clicked.”",
  },
  offerRecommendation: {
    tips: [
      "Recommend the offer that fits where they are, not your top tier",
      "Frame the price against the cost of staying stuck",
      "Remove every decision except the one that matters",
    ],
    zuriHint:
      "“The right offer doesn't feel like a pitch — it feels like the answer to a question they were already asking.”",
  },
  purchase: {
    tips: [
      "Make buying feel as confident as the decision to buy",
      "Confirm the win immediately — silence breeds regret",
      "Every friction point is a reason to reconsider; remove them",
    ],
    zuriHint:
      "“The moment after purchase is where loyalty is won or quietly lost — make it feel like a beginning.”",
  },
  onboarding: {
    tips: [
      "Deliver a real win in the first session, not the first month",
      "Set the rhythm now — it's the hardest thing to change later",
      "Make them feel they chose well, today and out loud",
    ],
    zuriHint:
      "“Onboarding isn't orientation — it's the first proof that everything you promised was true.”",
  },
  retentionReferral: {
    tips: [
      "Keep delivering value after the result, not just during",
      "Make the next step obvious before they go looking elsewhere",
      "Referrals follow remarkable moments — engineer them on purpose",
    ],
    zuriHint:
      "“The best clients don't just stay — they bring others, because you became the story they wanted to tell.”",
  },
};

function buildEmptyData() {
  const out = {};
  for (const stage of STAGES) {
    const stageObj = { narrative: "" };
    for (const field of stage.fields) {
      stageObj[field.id] = "";
    }
    out[stage.id] = stageObj;
  }
  return out;
}

const EMPTY_DATA = buildEmptyData();

function normalizeResponse(response) {
  const source = response && typeof response === "object" ? response : {};
  const out = buildEmptyData();
  for (const stage of STAGES) {
    const incoming = source[stage.id];
    if (incoming && typeof incoming === "object") {
      out[stage.id].narrative =
        typeof incoming.narrative === "string" ? incoming.narrative : "";
      for (const field of stage.fields) {
        const val = incoming[field.id];
        out[stage.id][field.id] = typeof val === "string" ? val : "";
      }
    }
  }
  return out;
}

function buildPayload(data) {
  const out = {};
  for (const stage of STAGES) {
    const stageObj = { narrative: data[stage.id]?.narrative || "" };
    for (const field of stage.fields) {
      stageObj[field.id] = data[stage.id]?.[field.id] || "";
    }
    out[stage.id] = stageObj;
  }
  return out;
}

function getStageStatus(stageData, stage) {
  const narrative = (stageData?.narrative || "").trim();
  const structuredFilled = stage.fields.some(
    (field) => (stageData?.[field.id] || "").trim().length > 0
  );
  const hasNarrative = narrative.length >= stage.narrative.minLength;
  if (hasNarrative && structuredFilled) return "complete";
  if (narrative.length > 0 || structuredFilled) return "draft";
  return "empty";
}

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const LOCKED_PLANS = new Set(["free", "audit", "foundation"]);

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = {
  background: "#f8f4f2",
  minHeight: "100vh",
};

// Reference-matched field styling (docs/references/CTH_customer_journey.html)
const REF_INPUT_STYLE = {
  width: "100%",
  padding: "9px 12px",
  background: "#fff",
  border: "0.5px solid #d8c5c3",
  borderRadius: 8,
  fontSize: 12,
  color: "#1a0828",
  fontFamily: SANS,
  outline: "none",
};

const REF_TA_STYLE = {
  ...REF_INPUT_STYLE,
  resize: "none",
  lineHeight: 1.6,
  minHeight: 90,
};

const REF_FIELD_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#7c6576",
  fontWeight: 500,
};

function LockedView() {
  return (
    <DashboardLayout>
      <header
        className="cth-page-header"
        style={{ background: "#fff", borderBottom: "0.5px solid #e8d5d0" }}
      >
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: SERIF, fontWeight: 500, color: "#1a0828", margin: 0 }}
          >
            Customer Journey
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "#7c6576", fontFamily: SANS }}
          >
            Map how your ideal client moves from stranger to buyer to advocate.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e8d5d0",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center"
              style={{
                borderRadius: 10,
                background: "color-mix(in srgb, #5d0012 12%, transparent)",
                color: "#5d0012",
              }}
            >
              <Lock size={22} />
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#7c6576",
                margin: "18px 0 0",
              }}
            >
              Structure Plan Required
            </p>
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 26,
                fontWeight: 500,
                color: "#1a0828",
                margin: "8px 0 0",
                lineHeight: 1.2,
              }}
            >
              Customer Journey
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                lineHeight: 1.65,
                color: "#7c6576",
                margin: "14px auto 24px",
                maxWidth: 520,
              }}
            >
              Map how your ideal client moves from stranger to buyer to advocate.
              Define the touchpoints, content, and calls to action at every stage.
              Available on The Structure plan and above.
            </p>
            <a
              href="/billing"
              className="inline-flex items-center gap-2"
              style={{
                background: "#5d0012",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 22px",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Upgrade to Structure
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CustomerJourney() {
  const { currentWorkspace } = useWorkspace();
  const { plan } = usePlan();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
  const normalizedPlan = String(plan || "free").toLowerCase();
  const isLocked = LOCKED_PLANS.has(normalizedPlan);

  const [data, setData] = useState(EMPTY_DATA);
  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  const saveTimeout = useRef(null);
  const narrativeRef = useRef(null);

  const activeStage = useMemo(
    () => STAGES.find((stage) => stage.id === activeStageId) || STAGES[0],
    [activeStageId]
  );
  const activeData = data[activeStage.id] || { narrative: "" };
  const completedCount = STAGES.filter(
    (stage) => getStageStatus(data[stage.id], stage) === "complete"
  ).length;

  useEffect(() => {
    async function load() {
      if (isLocked) {
        setIsLoading(false);
        return;
      }
      if (!workspaceId) {
        setIsLoading(false);
        setLoadError("No active workspace found.");
        return;
      }
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await apiClient.get("/api/persist/customer-journey");
        setData(normalizeResponse(response));
      } catch (error) {
        console.error("Failed to load customer journey:", error);
        setLoadError(getErrorMessage(error, "Failed to load Customer Journey."));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [workspaceId, isLocked]);

  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.style.height = "auto";
      narrativeRef.current.style.height = `${Math.max(90, narrativeRef.current.scrollHeight)}px`;
    }
  }, [activeData.narrative, activeStage.id]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const persist = useCallback(async (updated) => {
    const payload = buildPayload(updated);
    await apiClient.post("/api/persist/customer-journey", payload);
  }, []);

  const scheduleSave = useCallback(
    (updated) => {
      setSaveState("saving");
      setSaveError("");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await persist(updated);
          setSaveState("saved");
          setLastSavedAt(new Date());
          setTimeout(() => {
            setSaveState((current) => (current === "saved" ? "idle" : current));
          }, 1800);
        } catch (error) {
          console.error("Save failed:", error);
          setSaveState("idle");
          setSaveError(getErrorMessage(error, "Save failed."));
        }
      }, 700);
    },
    [persist]
  );

  const handleNarrativeChange = useCallback(
    (value) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [activeStage.id]: { ...prev[activeStage.id], narrative: value },
        };
        setGeneratedPreview(null);
        scheduleSave(updated);
        return updated;
      });
    },
    [activeStage.id, scheduleSave]
  );

  const handleFieldChange = useCallback(
    (fieldId, value) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [activeStage.id]: { ...prev[activeStage.id], [fieldId]: value },
        };
        setGeneratedPreview(null);
        scheduleSave(updated);
        return updated;
      });
    },
    [activeStage.id, scheduleSave]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setSaveError("");
    try {
      const structuredInputs = {};
      for (const field of activeStage.fields) {
        structuredInputs[field.id] = activeData[field.id] || "";
      }
      const response = await apiClient.post(
        "/api/persist/customer-journey/ai-assist",
        {
          stage_id: activeStage.id,
          structured_inputs: structuredInputs,
          narrative: activeData.narrative || "",
          workspace_id: workspaceId,
        }
      );

      const narrative = stripMarkdown(
        typeof response?.narrative === "string" ? response.narrative.trim() : ""
      );
      const structuredRaw =
        response?.structured && typeof response.structured === "object"
          ? response.structured
          : {};
      const structured = {};
      for (const field of activeStage.fields) {
        const value = structuredRaw[field.id];
        structured[field.id] = typeof value === "string" ? stripMarkdown(value) : "";
      }

      if (!narrative && !Object.values(structured).some((v) => v)) {
        setSaveError("No AI draft was returned.");
      } else {
        setGeneratedPreview({ narrative, structured });
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setSaveError(getErrorMessage(error, "AI generation failed."));
    } finally {
      setIsGenerating(false);
    }
  }, [activeStage, activeData, workspaceId]);

  const handleAcceptGenerated = useCallback(() => {
    if (!generatedPreview) return;
    setData((prev) => {
      const stageData = { ...prev[activeStage.id] };
      if (generatedPreview.narrative) {
        stageData.narrative = generatedPreview.narrative;
      }
      for (const field of activeStage.fields) {
        const suggestion = generatedPreview.structured?.[field.id];
        if (typeof suggestion === "string" && suggestion.trim()) {
          stageData[field.id] = suggestion;
        }
      }
      const updated = { ...prev, [activeStage.id]: stageData };
      scheduleSave(updated);
      return updated;
    });
    setGeneratedPreview(null);
  }, [generatedPreview, activeStage, scheduleSave]);

  const performStageSwitch = useCallback((stageId) => {
    setActiveStageId(stageId);
    setGeneratedPreview(null);
    setSaveError("");
    setSaveState("idle");
  }, []);

  const handleStageSwitch = useCallback(
    (stageId) => {
      if (stageId === activeStage.id) return;
      if (
        generatedPreview &&
        !window.confirm(
          "You have an AI-generated draft that has not been accepted. Leaving this stage will discard it. Continue?"
        )
      ) {
        return;
      }
      performStageSwitch(stageId);
    },
    [generatedPreview, activeStage.id, performStageSwitch]
  );

  const stageIndex = STAGES.findIndex((stage) => stage.id === activeStage.id);
  const prevStage = stageIndex > 0 ? STAGES[stageIndex - 1] : null;
  const nextStageNav = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;

  if (isLocked) {
    return <LockedView />;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={PAGE_STYLE}>
          <div
            style={{
              fontFamily: SANS,
              color: "#7c6576",
              padding: "120px 24px",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2 size={18} className="animate-spin" />
            Loading Customer Journey...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const narrativeLength = (activeData.narrative || "").length;

  const extras = STAGE_EXTRAS[activeStage.id] || { tips: [], zuriHint: "" };
  const progressPct = Math.round((completedCount / STAGES.length) * 100);

  return (
    <DashboardLayout>
      <header
        className="cth-page-header"
        style={{ background: "#fff", borderBottom: "0.5px solid #e8d5d0" }}
      >
        <div className="min-w-0 flex-1">
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 22,
              fontWeight: 500,
              color: "#1a0828",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Customer Journey
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: SANS,
              fontSize: 11,
              color: "#7c6576",
            }}
          >
            Map how your ideal client moves from stranger to buyer across all 8 stages.
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 10,
              color: "#7c6576",
              marginBottom: 4,
            }}
          >
            {completedCount} of {STAGES.length} complete
          </div>
          <div
            style={{
              width: 110,
              height: 3,
              background: "#f0e8e5",
              borderRadius: 2,
              overflow: "hidden",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "#2d6a4f",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </header>

      <div
        className="flex-1"
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#f8f4f2",
          minHeight: 0,
        }}
        data-testid="customer-journey-page"
      >
        {loadError ? (
          <div
            style={{
              margin: "12px 24px 0",
              fontFamily: SANS,
              fontSize: 12,
              color: "var(--cth-danger)",
              background: "color-mix(in srgb, var(--cth-danger) 8%, #fff)",
              border: "0.5px solid color-mix(in srgb, var(--cth-danger) 25%, #e8d5d0)",
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            {loadError}
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "148px 1fr",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Stage nav */}
          <nav
            style={{
              borderRight: "0.5px solid #e8d5d0",
              padding: "14px 0",
              background: "#faf7f5",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 8,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#7c6576",
                fontWeight: 500,
                padding: "0 14px 8px",
              }}
            >
              Journey Stages
            </div>
            {STAGES.map((stage) => {
              const status = getStageStatus(data[stage.id], stage);
              const isActive = activeStage.id === stage.id;
              const state = isActive
                ? "active"
                : status === "complete"
                ? "done"
                : "todo";
              const iconColor =
                state === "active" ? "#5d0012" : state === "done" ? "#2d6a4f" : "#d8c5c3";
              const textColor =
                state === "active" ? "#5d0012" : state === "done" ? "#7c6576" : "#b0a0b8";
              const Icon = state === "active" ? Pencil : state === "done" ? Check : Circle;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageSwitch(stage.id)}
                  data-testid={`stage-nav-${stage.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 14px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    borderTop: "none",
                    borderRight: "none",
                    borderBottom: "none",
                    borderLeft: `2px solid ${isActive ? "#5d0012" : "transparent"}`,
                    background: isActive ? "#fff" : "transparent",
                  }}
                >
                  <Icon size={11} color={iconColor} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: isActive ? 500 : 400,
                      color: textColor,
                    }}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Field area */}
          <div
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#1a0828",
                  lineHeight: 1.2,
                }}
              >
                {activeStage.label}
              </div>
              <div
                style={{ fontFamily: SANS, fontSize: 11, color: "#7c6576", marginTop: 2 }}
              >
                {activeStage.subtitle}
              </div>
            </div>

            {/* Why this stage matters */}
            <div
              style={{
                background: "#fff",
                border: "0.5px solid #e8d5d0",
                borderRadius: 10,
                padding: "11px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#7c6576",
                  fontWeight: 500,
                  marginBottom: 5,
                }}
              >
                Why this stage matters
              </div>
              <div
                style={{ fontFamily: SANS, fontSize: 11, color: "#4a3860", lineHeight: 1.6 }}
              >
                {activeStage.description}
              </div>
            </div>

            {/* Tips row */}
            {extras.tips && extras.tips.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {extras.tips.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "0.5px solid #e8d5d0",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 8,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#7c6576",
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      Tip {i + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        color: "#3d2d4a",
                        lineHeight: 1.5,
                      }}
                    >
                      {tip}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Structured fields */}
            {activeStage.fields.map((field) => {
              const value = activeData[field.id] || "";
              return (
                <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={REF_FIELD_LABEL_STYLE}>{field.label}</div>
                  {field.type === "select" ? (
                    <select
                      value={value}
                      onChange={(event) => handleFieldChange(field.id, event.target.value)}
                      data-testid={`field-${activeStage.id}-${field.id}`}
                      style={REF_INPUT_STYLE}
                    >
                      <option value="">Select…</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(event) => handleFieldChange(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      data-testid={`field-${activeStage.id}-${field.id}`}
                      style={REF_INPUT_STYLE}
                    />
                  )}
                </div>
              );
            })}

            {/* Narrative */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={REF_FIELD_LABEL_STYLE}>Your narrative for this stage</div>
              <textarea
                ref={narrativeRef}
                value={activeData.narrative || ""}
                onChange={(event) => handleNarrativeChange(event.target.value)}
                placeholder={activeStage.narrative.placeholder}
                data-testid={`narrative-${activeStage.id}`}
                maxLength={activeStage.narrative.maxLength}
                style={REF_TA_STYLE}
              />
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  color: "#b0a0b8",
                  textAlign: "right",
                  marginTop: 2,
                }}
              >
                {narrativeLength} / {activeStage.narrative.maxLength}
              </div>
            </div>

            {saveError ? (
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "var(--cth-danger)",
                  background: "color-mix(in srgb, var(--cth-danger) 8%, #fff)",
                  border: "0.5px solid color-mix(in srgb, var(--cth-danger) 25%, #e8d5d0)",
                  borderRadius: 8,
                  padding: "9px 12px",
                }}
              >
                {saveError}
              </div>
            ) : null}

            {/* Zuri stage strategy card */}
            <div
              style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}
              data-testid="zuri-inline"
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#e04e35",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontFamily: SANS, fontSize: 8, fontWeight: 500, color: "#fff" }}>
                    Z
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 8,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#7a6090",
                  }}
                >
                  Zuri · stage strategy
                </span>
              </div>

              {isGenerating ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "#e8dff0",
                    lineHeight: 1.5,
                  }}
                >
                  <Loader2 size={13} className="animate-spin" />
                  Zuri is drafting your {activeStage.label.toLowerCase()} strategy…
                </div>
              ) : generatedPreview ? (
                <div data-testid="generated-preview">
                  {Object.values(generatedPreview.structured || {}).some((v) => v) ? (
                    <div style={{ marginBottom: 10 }}>
                      {activeStage.fields.map((field) => {
                        const suggestion = generatedPreview.structured?.[field.id] || "";
                        if (!suggestion) return null;
                        return (
                          <div
                            key={field.id}
                            style={{
                              fontFamily: SANS,
                              fontSize: 12,
                              color: "#e8dff0",
                              lineHeight: 1.5,
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ color: "#7a6090" }}>{field.label}: </span>
                            {suggestion}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {generatedPreview.narrative ? (
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 13,
                        color: "#e8dff0",
                        lineHeight: 1.5,
                        marginBottom: 10,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {generatedPreview.narrative}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={handleAcceptGenerated}
                      data-testid="accept-generated-btn"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#e04e35",
                        background: "transparent",
                        border: "0.5px solid rgba(224,78,53,0.4)",
                        borderRadius: 6,
                        padding: "5px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Use this
                    </button>
                    <button
                      onClick={handleGenerate}
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: "#7a6090",
                        background: "transparent",
                        border: "none",
                        padding: "4px 6px",
                        cursor: "pointer",
                      }}
                    >
                      Try another →
                    </button>
                    <button
                      onClick={() => setGeneratedPreview(null)}
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: "#52406a",
                        background: "transparent",
                        border: "none",
                        padding: "4px 6px",
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: "#e8dff0",
                      lineHeight: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    {extras.zuriHint}
                  </div>
                  <button
                    onClick={handleGenerate}
                    data-testid="generate-stage-strategy-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#e04e35",
                      background: "transparent",
                      border: "0.5px solid rgba(224,78,53,0.4)",
                      borderRadius: 6,
                      padding: "5px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <Wand2 size={11} />
                    Generate stage strategy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 22px",
            borderTop: "0.5px solid #e8d5d0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#faf7f5",
            flexShrink: 0,
          }}
        >
          {prevStage ? (
            <button
              onClick={() => handleStageSwitch(prevStage.id)}
              data-testid="prev-stage-btn"
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: "#7c6576",
                background: "#fff",
                border: "0.5px solid #d8c5c3",
                borderRadius: 7,
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              ← {prevStage.label}
            </button>
          ) : (
            <span />
          )}

          <span style={{ fontFamily: SANS, fontSize: 11, color: "#7c6576" }}>
            {stageIndex + 1} of {STAGES.length}
          </span>

          <button
            onClick={() => nextStageNav && handleStageSwitch(nextStageNav.id)}
            disabled={!nextStageNav}
            data-testid="next-stage-btn"
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              background: "#5d0012",
              border: "none",
              borderRadius: 7,
              padding: "7px 20px",
              cursor: nextStageNav ? "pointer" : "default",
              opacity: nextStageNav ? 1 : 0.5,
            }}
          >
            Save &amp; continue →
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
