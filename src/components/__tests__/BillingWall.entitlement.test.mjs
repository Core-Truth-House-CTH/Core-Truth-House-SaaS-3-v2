import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { createServer } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const vite = await createServer({ root, logLevel: "silent", define: { "import.meta.env": "{}" }, server: { middlewareMode: true }, appType: "custom" });
after(() => vite.close());
const { isWhitelisted, getBillingWallDecision } = await vite.ssrLoadModule("/src/components/BillingWall.jsx");

describe("BillingWall production decisions", () => {
  it("allows only exact canonical billing and help paths", () => {
    for (const route of ["/billing", "/billing/", "/help", "/help/", "/billing?tab=plan", "/help#top"]) {
      assert.equal(isWhitelisted(route), true, route);
    }
  });

  it("denies descendants and unapproved routes", () => {
    for (const route of [
      "/billing/success",
      "/billing/anything",
      "/help/article",
      "/help-desk",
      "/support",
      "/lock-screen",
    ]) {
      assert.equal(isWhitelisted(route), false, route);
    }
  });

  it("shows loading only for Clerk or an active authority request", () => {
    assert.equal(getBillingWallDecision({ authLoaded: false }), "loading");
    assert.equal(getBillingWallDecision({ authLoaded: true, isSignedIn: true, pathname: "/dashboard", authorityLoading: true }), "loading");
  });

  it("turns failed authority into a terminal redirect", () => {
    assert.equal(getBillingWallDecision({ authLoaded: true, isSignedIn: true, pathname: "/dashboard", authorityLoading: false, hasActivePlan: false }), "redirect");
  });

  it("preserves signed-out and exempt-route access", () => {
    assert.equal(getBillingWallDecision({ authLoaded: true, isSignedIn: false, pathname: "/dashboard" }), "content");
    assert.equal(getBillingWallDecision({ authLoaded: true, isSignedIn: true, pathname: "/billing", authorityLoading: false, hasActivePlan: false }), "content");
  });
});
