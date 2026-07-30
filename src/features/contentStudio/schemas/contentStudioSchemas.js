/**
 * Zod schemas mirroring the backend Pydantic models exactly, so the UI can
 * reject invalid input before a round trip and surface the same limits the
 * server enforces. Bounds copied from backend/routes/content_studio.py and
 * backend/routes/content_studio_automations.py.
 */
import { z } from "zod";

/* ---------------- Agents ---------------- */

export const agentCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the agent a name (2+ characters).").max(120),
  description: z
    .string()
    .trim()
    .min(2, "Describe what this agent does.")
    .max(2000, "Keep the description under 2000 characters."),
  category: z.string().trim().min(2, "Choose a category.").max(80),
  instructions: z.string().max(12000, "Instructions are limited to 12000 characters.").default(""),
  knowledge_source_ids: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  output_types: z.array(z.string()).default([]),
});

export const agentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(2).max(2000).optional(),
  category: z.string().trim().optional(),
  instructions: z.string().max(12000).optional(),
  knowledge_source_ids: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  output_types: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
});

export const AGENT_CATEGORIES = [
  "content",
  "strategy",
  "conversion",
  "research",
  "visual",
  "analysis",
];

/* ---------------- Storyboards ---------------- */

export const STORYBOARD_FORMATS = ["9:16", "16:9", "1:1", "4:5"];

export const storyboardSceneSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().default(0),
  title: z.string().max(160).default("Untitled Scene"),
  media_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  direction: z.string().max(3000).default(""),
  voiceover: z.string().max(5000).default(""),
  duration_seconds: z
    .number()
    .min(0.1, "Scenes must run at least 0.1 seconds.")
    .max(600, "Scenes cannot exceed 600 seconds."),
});

export const storyboardCreateSchema = z.object({
  title: z.string().trim().min(2, "Give the storyboard a title.").max(160),
  project_id: z.string().nullable().optional(),
  format: z.enum(["9:16", "16:9", "1:1", "4:5"]).default("9:16"),
  scenes: z.array(storyboardSceneSchema).default([]),
});

export const storyboardUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  project_id: z.string().nullable().optional(),
  format: z.enum(["9:16", "16:9", "1:1", "4:5"]).optional(),
  scenes: z.array(storyboardSceneSchema).optional(),
  status: z.enum(["draft", "ready", "exported"]).optional(),
});

/* ---------------- Edit requests ---------------- */

export const editRequestCreateSchema = z.object({
  media_id: z.string().trim().min(1, "Choose the media you want edited."),
  instructions: z
    .string()
    .trim()
    .min(2, "Describe the edit you need.")
    .max(6000, "Keep instructions under 6000 characters."),
  style_preference: z.string().max(80).default("natural"),
  priority: z.enum(["standard", "priority"]).default("standard"),
});

export const EDIT_STYLE_PREFERENCES = ["natural", "editorial", "cinematic", "bright", "moody"];

/* ---------------- Automations ---------------- */

export const AUTOMATION_STEP_TYPES = ["condition", "action", "agent", "approval", "delay"];

export const automationStepSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["condition", "action", "agent", "approval", "delay"]),
  config: z.record(z.any()).default({}),
  order: z.number().int().default(0),
});

export const automationCreateSchema = z.object({
  name: z.string().trim().min(2, "Name the automation.").max(160),
  description: z.string().max(2000).default(""),
  trigger: z.record(z.any()).refine((v) => v && Object.keys(v).length > 0, {
    message: "Choose a trigger for this automation.",
  }),
  steps: z.array(automationStepSchema).default([]),
  // status is intentionally omitted: the backend always persists new
  // automations as draft, so offering it here would be a false affordance.
});

export const automationUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(2000).optional(),
  trigger: z.record(z.any()).optional(),
  steps: z.array(automationStepSchema).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
});

export const AUTOMATION_TRIGGER_TYPES = [
  { value: "schedule", label: "Schedule" },
  { value: "form_submitted", label: "Form Submitted" },
  { value: "new_media", label: "New Media" },
  { value: "tag_added", label: "Tag Added" },
  { value: "no_activity", label: "No Activity" },
];

/**
 * Flatten a ZodError into { field: message } for inline form display.
 */
export function formatZodErrors(error) {
  const out = {};
  if (!error?.issues) return out;
  error.issues.forEach((issue) => {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  });
  return out;
}

/**
 * Validate and return { ok, data, errors }. Never throws.
 */
export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  return { ok: false, data: null, errors: formatZodErrors(result.error) };
}
