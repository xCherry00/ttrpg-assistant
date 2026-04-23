import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicShell from "./components/PublicShell";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./auth/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GlossaryPage = lazy(() => import("./pages/GlossaryPage"));
const RulesPage = lazy(() => import("./pages/RulesPage"));
const DicePage = lazy(() => import("./pages/DicePage"));
const InitiativePage = lazy(() => import("./pages/InitiativePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GeneratorsPage = lazy(() => import("./pages/GeneratorsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const CampaignDetailsPage = lazy(() => import("./pages/CampaignDetailsPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const PublicUserPage = lazy(() => import("./pages/PublicUserPage"));
const CharactersPage = lazy(() => import("./pages/CharactersPage"));

function PageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "var(--text)",
        padding: "24px",
      }}
    >
      <div className="panel-soft" style={{ padding: "18px 22px" }}>
        Ładowanie widoku...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* PUBLIC */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* PRIVATE */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/rules/dnd" element={<Navigate to="/rules" replace />} />
            <Route path="/dice" element={<DicePage />} />
            <Route path="/initiative" element={<InitiativePage />} />
            <Route path="/generators" element={<GeneratorsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/users/:handle" element={<PublicUserPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
