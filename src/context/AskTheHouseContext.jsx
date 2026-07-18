import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AskTheHouseContext = createContext(null);

const PATH_TO_SURFACE = {
  "/command-center": "command_center",
  "/brand-foundation": "brand_foundation",
  "/brand-memory": "brand_foundation",
  "/brand-positioning": "brand_positioning",
  "/messaging-structure": "messaging_structure",
  "/audience": "audience",
  "/identity-studio": "identity_studio",
  "/strategic-os": "strategic_os",
  "/systems-builder": "strategic_os",
  "/offer-builder": "offers",
  "/campaign-builder": "campaign_builder",
  "/campaign-setup": "campaign_builder",
  "/first-campaign": "campaign_builder",
  "/content-studio": "content_studio",
  "/prompt-generator": "content_studio",
  "/customer-journey": "customer_journey",
  "/social-media-manager": "social_composer",
};

const FALLBACK_SURFACE = "command_center";

// Human-readable label shown in the Ask the House header. This is DISPLAY ONLY
// and is intentionally decoupled from PATH_TO_SURFACE: the surface key above is
// what the backend understands (and gates plans on), while the label below is
// what the user sees. Two routes can share one backend surface yet show
// different labels — e.g. /systems-builder ("Structure") and /strategic-os
// ("Strategic OS") both resolve to the strategic_os surface.
const PATH_TO_LABEL = {
  "/command-center": "Command Center",
  "/brand-foundation": "Foundation",
  "/brand-memory": "Foundation",
  "/brand-positioning": "Brand Positioning",
  "/messaging-structure": "Messaging",
  "/audience": "Audience",
  "/identity-studio": "Identity Studio",
  "/strategic-os": "Strategic OS",
  "/systems-builder": "Structure",
  "/offer-builder": "Offers",
  "/campaign-builder": "Campaign Builder",
  "/campaign-setup": "Campaign Builder",
  "/first-campaign": "Campaign Builder",
  "/content-studio": "Content Studio",
  "/prompt-generator": "Content Studio",
  "/customer-journey": "Customer Journey",
  "/signal-inbox": "Signal Inbox",
  "/social-media-manager": "Social Planner",
};

const FALLBACK_LABEL = "Command Center";

export function getSurfaceFromPath(pathname) {
  if (!pathname) return FALLBACK_SURFACE;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PATH_TO_SURFACE[normalized]) return PATH_TO_SURFACE[normalized];
  const firstSegment = "/" + normalized.split("/").filter(Boolean)[0];
  return PATH_TO_SURFACE[firstSegment] || FALLBACK_SURFACE;
}

export function getSurfaceLabelFromPath(pathname) {
  if (!pathname) return FALLBACK_LABEL;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PATH_TO_LABEL[normalized]) return PATH_TO_LABEL[normalized];
  const firstSegment = "/" + normalized.split("/").filter(Boolean)[0];
  return PATH_TO_LABEL[firstSegment] || FALLBACK_LABEL;
}

export function AskTheHouseProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionId, setSectionId] = useState(null);

  const open = useCallback((section) => {
    if (section !== undefined) setSectionId(section || null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, sectionId, setSectionId }),
    [isOpen, open, close, toggle, sectionId]
  );

  return (
    <AskTheHouseContext.Provider value={value}>
      {children}
    </AskTheHouseContext.Provider>
  );
}

export function useAskTheHouse() {
  const ctx = useContext(AskTheHouseContext);
  if (!ctx) {
    throw new Error("useAskTheHouse must be used within an AskTheHouseProvider");
  }
  return ctx;
}
