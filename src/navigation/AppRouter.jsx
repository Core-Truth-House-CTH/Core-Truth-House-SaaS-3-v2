import React, { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "../components/Auth";
import { PlanGate } from "../components/PlanGate";
import BillingWall from "../components/BillingWall";
import CohortClaimEntry from "../pages/CohortClaimEntry";
import { APP_ROUTES } from "../config/appRoutes";
import { ADMIN_ROUTES } from "../config/adminRoutes";
import { REDIRECT_ROUTES } from "../config/redirectRoutes";
import { getPageComponent } from "./pageRegistry";

const StudioAccess = lazy(() => import("../pages/StudioAccess"));
const TrainingVideos = lazy(() => import("../pages/TrainingVideos"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const AdminRouter = lazy(() => import("../admin/AdminRouter"));

const SuspenseFallback = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--cth-command-blush, #efe7e3)",
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: "3px solid var(--cth-command-border, #d8c5c3)",
        borderTopColor: "var(--cth-command-crimson, #af0024)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  </div>
);

function PaidPage({ route, PageComponent }) {
  const location = useLocation();
  if (location.pathname === "/command-center" && new URLSearchParams(location.search).has("cohort_token")) {
    return <CohortClaimEntry />;
  }
  return <ProtectedRoute><BillingWall><PlanGate route={route.path}><PageComponent /></PlanGate></BillingWall></ProtectedRoute>;
}

function buildRouteElement(route) {
  const PageComponent = getPageComponent(route?.path);

  if (!PageComponent) {
    return <Navigate to="/command-center" replace />;
  }

  return (
    <PaidPage route={route} PageComponent={PageComponent} />
  );
}

export default function AppRouter() {
  const protectedRouteItems = [...ADMIN_ROUTES, ...APP_ROUTES].filter(
    (route) => route?.path
  );

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Suspense fallback={SuspenseFallback}>
      <Routes>
        <Route path="/cohort/claim" element={<CohortClaimEntry />} />
        <Route path="/studio/:token" element={<StudioAccess />} />
        <Route path="/help" element={<TrainingVideos />} />
        <Route path="/admin/*" element={<AdminRouter />} />

        {REDIRECT_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<Navigate to={route.redirectTo} replace />}
          />
        ))}

        {protectedRouteItems.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={buildRouteElement(route)}
          />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
