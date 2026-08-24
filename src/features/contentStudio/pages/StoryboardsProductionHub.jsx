import React from "react";
import { useSearchParams } from "react-router-dom";

import StoryboardsPage from "./StoryboardsPage";
import ProductionPage from "./ProductionPage";

export default function StoryboardsProductionHub() {
  const [searchParams] = useSearchParams();
  return searchParams.get("mode") === "production" ? <ProductionPage /> : <StoryboardsPage />;
}
