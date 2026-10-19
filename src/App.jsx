// frontend/src/App.jsx

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./index.css";

import { Toaster } from "./components/ui/toaster";
import ScrollToTop from "./components/ScrollToTop";

const ProtectedApp = lazy(() => import("./ProtectedApp"));

// Approved architectural-editorial marketing site (shared shell + pages)
const EstateShell = lazy(() => import("./pages/estate/EstateShell"));
const EstateHome = lazy(() => import("./pages/estate/EstateHome"));
const EstateMethodologyPage = lazy(() => import("./pages/estate/EstateMethodologyPage"));
const EstateAboutPage = lazy(() => import("./pages/estate/EstateAboutPage"));
const EstateTiersPage = lazy(() => import("./pages/estate/EstateTiersPage"));
const EstateContactPage = lazy(() => import("./pages/estate/EstateContactPage"));
const EstateCohortPage = lazy(() => import("./pages/estate/EstateCohortPage"));
const EstateStorePage = lazy(() => import("./pages/estate/EstateStorePage"));

// Functional public pages (auth, lead funnel, cohort flow, legal, content) — unchanged
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const BlogJournalPage = lazy(() => import("./pages/BlogJournalPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PublicBrandDiagnosticRoute = lazy(() => import("./components/PublicBrandDiagnosticRoute"));
const PrivateDiagnosticReportRoute = lazy(() => import("./components/PrivateDiagnosticReportRoute"));
const PublicDiagnosticResults = lazy(() => import("./pages/PublicDiagnosticResults"));
const PublicOfferPage = lazy(() => import("./pages/PublicOfferPage"));
const ScorecardPage = lazy(() => import("./pages/ScorecardPage"));
const CohortApplyPage = lazy(() => import("./pages/CohortApplyPage"));
const CohortWelcomePage = lazy(() => import("./pages/CohortWelcomePage"));
const CohortJoinPage = lazy(() => import("./pages/CohortJoinPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#efe7e3] px-6 py-12 text-[#2b1040]">
      Loading Core Truth House...
    </div>
  );
}

function PublicRoutes() {
  return (
    <>
      <Routes>
        {/* Approved marketing site — shared cinematic shell (nav, footer, transitions) */}
        <Route element={<EstateShell />}>
          <Route path="/" element={<EstateHome />} />
          <Route path="/methodology" element={<EstateMethodologyPage />} />
          <Route path="/methodology/*" element={<EstateMethodologyPage />} />
          <Route path="/tiers" element={<EstateTiersPage />} />
          <Route path="/pricing" element={<EstateTiersPage />} />
          <Route path="/about" element={<EstateAboutPage />} />
          <Route path="/contact" element={<EstateContactPage />} />
          <Route path="/cohort" element={<EstateCohortPage />} />
          <Route path="/store" element={<EstateStorePage />} />
        </Route>

        {/* Functional public routes — auth handled by ProtectedApp catch-all below */}
        <Route path="/brand-diagnostic" element={<PublicBrandDiagnosticRoute />} />
        <Route path="/brand-diagnostic/" element={<PublicBrandDiagnosticRoute />} />
        <Route path="/brand-diagnostic/report/:resultId" element={<PrivateDiagnosticReportRoute />} />
        <Route path="/diagnostic-results/:token" element={<PublicDiagnosticResults />} />
        <Route path="/offers/:workspaceSlug/:offerSlug" element={<PublicOfferPage />} />
        {/* Subdomain mode: {slug}.coretruthhouse.com/offers/:offerSlug — workspace resolved from hostname */}
        <Route path="/offers/:offerSlug" element={<PublicOfferPage />} />
        <Route path="/scorecard" element={<ScorecardPage />} />
        <Route path="/scorecard/" element={<ScorecardPage />} />
        <Route path="/cohort/apply" element={<CohortApplyPage />} />
        <Route path="/cohort/welcome" element={<CohortWelcomePage />} />
        <Route path="/cohort/join/:token" element={<CohortJoinPage />} />
        <Route path="/blog" element={<BlogJournalPage />} />
        <Route path="/blog/:slug" element={<BlogJournalPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedApp />
            </Suspense>
          }
        />
      </Routes>

      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <PublicRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
