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
  "/brand-studio": "content_studio",
  "/media-studio": "content_studio",
  "/prompt-generator": "content_studio",
  "/customer-journey": "customer_journey",
};

const FALLBACK_SURFACE = "command_center";

export function getSurfaceFromPath(pathname) {
  if (!pathname) return FALLBACK_SURFACE;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (PATH_TO_SURFACE[normalized]) return PATH_TO_SURFACE[normalized];
  const firstSegment = "/" + normalized.split("/").filter(Boolean)[0];
  return PATH_TO_SURFACE[firstSegment] || FALLBACK_SURFACE;
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
