import React, { createContext, useContext, useState, useCallback } from "react";

const AskTheHouseContext = createContext(null);

const ROUTE_TO_SURFACE = {
  "/command-center": "command_center",
  "/brand-audit": "brand_audit",
  "/brand-foundation": "brand_foundation",
  "/brand-positioning": "brand_positioning",
  "/messaging-structure": "messaging_structure",
  "/audience": "audience",
  "/identity-studio": "identity_studio",
  "/strategic-os": "strategic_os",
  "/systems-builder": "strategic_os",
  "/customer-journey": "customer_journey",
  "/offer-builder": "offers",
  "/campaign-builder": "campaign_builder",
  "/content-studio": "content_studio",
  "/prompt-generator": "content_studio",
  "/brand-studio": "brand_studio",
  "/media-studio": "media_studio",
  "/crm": "crm",
  "/blog-cms": "blog",
  "/prompt-hub": "prompt_hub",
  "/calendar": "calendar",
  "/social-media-manager": "social_planner",
  "/launch-planner": "launch_planner",
  "/cohort-manager": "cohort_manager",
};

export function getSurfaceFromPath(pathname) {
  for (const [path, surface] of Object.entries(ROUTE_TO_SURFACE)) {
    if (pathname.startsWith(path)) return surface;
  }
  return "command_center";
}

export function AskTheHouseProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionId, setSectionId] = useState(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const setSectionContext = useCallback((id) => setSectionId(id), []);

  return (
    <AskTheHouseContext.Provider
      value={{ isOpen, open, close, toggle, sectionId, setSectionContext }}
    >
      {children}
    </AskTheHouseContext.Provider>
  );
}

export function useAskTheHouse() {
  const ctx = useContext(AskTheHouseContext);
  if (!ctx) throw new Error("useAskTheHouse must be used inside AskTheHouseProvider");
  return ctx;
}
