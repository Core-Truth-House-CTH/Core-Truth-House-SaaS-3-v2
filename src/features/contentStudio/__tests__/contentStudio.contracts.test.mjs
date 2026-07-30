/**
 * Schema, route-registration and integration-surface tests.
 *
 * The route tests parse the registry sources as text rather than importing
 * them, because those modules pull in JSX and lucide-react and cannot be
 * loaded by the bare Node runner. Static assertions still catch the failure
 * that matters: a route that exists in one registry but not the other.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it } from "node:test";

import {
  agentCreateSchema,
  automationCreateSchema,
  editRequestCreateSchema,
  storyboardCreateSchema,
  validate,
} from "../schemas/contentStudioSchemas.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../../..");
const read = (rel) => readFileSync(path.join(SRC, rel), "utf8");

const registry = read("navigation/pageRegistry.jsx");
const appRoutes = read("config/appRoutes.js");
const api = read("features/contentStudio/api/contentStudioApi.js");

const EXPECTED_ROUTES = [
  "/content-studio",
  "/content-studio/composer",
  "/content-studio/agents",
  "/content-studio/agents/:agentId",
  "/content-studio/agents/new",
  "/content-studio/automations",
  "/content-studio/images/generate",
  "/content-studio/media",
  "/content-studio/media/:mediaId",
  "/content-studio/storyboards",
  "/content-studio/edit-requests/new",
  "/content-studio/media/upload",
];

describe("route registration", () => {
  for (const route of EXPECTED_ROUTES) {
    it(`registers ${route} in pageRegistry`, () => {
      assert.ok(registry.includes(`"${route}"`), `pageRegistry is missing ${route}`);
    });

    it(`registers ${route} in appRoutes`, () => {
      assert.ok(appRoutes.includes(`"${route}"`), `appRoutes is missing ${route}`);
    });
  }

  it("registers a controlled Content Studio fallback", () => {
    assert.ok(registry.includes('"/content-studio/*"'));
    assert.ok(appRoutes.includes('"/content-studio/*"'));
  });

  it("preserves the legacy prompt generator instead of deleting it", () => {
    assert.ok(registry.includes('"/content-studio/prompt-generator": ContentStudio'));
    assert.ok(registry.includes('import("../pages/ContentStudio")'));
  });

  it("leaves the platform automations route intact and separate", () => {
    assert.ok(appRoutes.includes('"/automations"'), "platform /automations must remain registered");
    assert.ok(
      registry.includes('"/content-studio/automations"'),
      "Content Studio automations must be a distinct route",
    );
  });
});

describe("backend integration surface", () => {
  const ENDPOINTS = [
    "/entitlement",
    "/trial",
    "/agents/official",
    "/agents",
    "/storyboards",
    "/edit-requests",
    "/automations",
  ];

  for (const endpoint of ENDPOINTS) {
    it(`calls ${endpoint}`, () => {
      assert.ok(api.includes(endpoint), `contentStudioApi is missing ${endpoint}`);
    });
  }

  it("targets the content-studio automations surface, never /api/automations", () => {
    assert.ok(api.includes("/api/content-studio"));
    assert.ok(
      !/["'`]\/api\/automations/.test(api),
      "Content Studio must not call the platform automations API",
    );
  });

  it("exports one function per backend endpoint (19 total)", () => {
    const exported = api.match(/^export function /gm) || [];
    assert.equal(exported.length, 19, `expected 19 endpoint functions, found ${exported.length}`);
  });
});

describe("schema validation mirrors backend bounds", () => {
  it("rejects an agent name below the backend minimum of 2", () => {
    const result = validate(agentCreateSchema, { name: "A", description: "ok enough", category: "content" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.name);
  });

  it("accepts a valid agent and applies array defaults", () => {
    const result = validate(agentCreateSchema, {
      name: "Tone Coach",
      description: "Keeps copy on voice",
      category: "content",
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.tools, []);
    assert.deepEqual(result.data.output_types, []);
    assert.equal(result.data.instructions, "");
  });

  it("rejects an unapproved storyboard format", () => {
    const result = validate(storyboardCreateSchema, { title: "Film", format: "21:9" });
    assert.equal(result.ok, false);
  });

  it("enforces the scene duration range of 0.1 to 600", () => {
    const tooShort = validate(storyboardCreateSchema, {
      title: "Film",
      scenes: [{ duration_seconds: 0 }],
    });
    assert.equal(tooShort.ok, false);

    const tooLong = validate(storyboardCreateSchema, {
      title: "Film",
      scenes: [{ duration_seconds: 601 }],
    });
    assert.equal(tooLong.ok, false);
  });

  it("requires an automation trigger", () => {
    const missing = validate(automationCreateSchema, { name: "Weekly Digest", trigger: {} });
    assert.equal(missing.ok, false);

    const present = validate(automationCreateSchema, {
      name: "Weekly Digest",
      trigger: { type: "schedule" },
    });
    assert.equal(present.ok, true);
  });

  it("does not accept a client-supplied automation status", () => {
    // The backend always persists new automations as draft, so the create
    // schema must not carry status through and offer a false affordance.
    const result = validate(automationCreateSchema, {
      name: "Weekly Digest",
      trigger: { type: "schedule" },
      status: "active",
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.status, undefined, "status must be stripped from automation creation");
  });

  it("requires media id and instructions on an edit request", () => {
    assert.equal(validate(editRequestCreateSchema, { instructions: "Brighten it" }).ok, false);
    assert.equal(validate(editRequestCreateSchema, { media_id: "m-1", instructions: "x" }).ok, false);

    const good = validate(editRequestCreateSchema, { media_id: "m-1", instructions: "Brighten it" });
    assert.equal(good.ok, true);
    assert.equal(good.data.priority, "standard");
    assert.equal(good.data.style_preference, "natural");
  });
});

describe("design token compliance", () => {
  const raw = read("features/contentStudio/styles/contentStudio.css");
  // Assertions target declarations, not prose. The file's header comment
  // deliberately names the rejected values to explain why tokens are scoped,
  // so comments are stripped before checking.
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  it("uses the approved crimson", () => {
    assert.ok(css.includes("#af0024"));
  });

  it("does not declare the rejected crimson values", () => {
    assert.ok(!css.includes("#af002a"), "#AF002A is not the approved crimson");
    assert.ok(!css.includes("#5d0012"), "#5D0012 is from the stale reference and must not appear");
  });

  it("carries the approved light grounds and text tones", () => {
    for (const token of ["#f8f1ec", "#efe3df", "#fffaf5", "#33033c", "#763b5b", "#c7a09d"]) {
      assert.ok(css.includes(token), `missing approved token ${token}`);
    }
  });

  it("scopes tokens rather than rewriting the shared command palette", () => {
    assert.ok(css.includes(".cth-cs"));
    assert.ok(
      !/--cth-command-[a-z-]+\s*:/.test(css),
      "must not redefine shared command-center tokens",
    );
  });

  it("does not introduce arbitrary blue or gray branding", () => {
    const declaredColors = css.match(/#[0-9a-f]{6}/g) || [];
    const APPROVED = new Set([
      "#af0024", "#33033c", "#0d0010", "#c4a95b", "#e04e35",
      "#f8f1ec", "#efe3df", "#fffaf5", "#763b5b", "#c7a09d",
      "#8e001d", "#7a6320", // derived hover / gold-on-light text
      "#2d6a4f", "#9a6a1f", "#a4232c", // semantic status, accessibility only
      "#ffffff",
    ]);
    const unexpected = declaredColors.filter((c) => !APPROVED.has(c));
    assert.deepEqual(unexpected, [], `unapproved colors: ${unexpected.join(", ")}`);
  });
});
