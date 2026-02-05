import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { AdminGuard } from "./AdminGuard";
import { AdminLayout } from "./AdminLayout";
import { adminTheme } from "../../theme/adminTheme";
import { TranslationProvider } from "./components/TranslationProvider";

const AdminInboxPage = lazy(() => import("./pages/AdminInboxPage").then((m) => ({ default: m.AdminInboxPage })));
const AdminFaqPage = lazy(() => import("./pages/AdminFaqPage").then((m) => ({ default: m.AdminFaqPage })));
const AdminCustomersPage = lazy(() => import("./pages/AdminCustomersPage").then((m) => ({ default: m.AdminCustomersPage })));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })));
const AdminPresetsPage = lazy(() => import("./pages/AdminPresetsPage").then((m) => ({ default: m.AdminPresetsPage })));
const AdminProfilePage = lazy(() => import("./pages/AdminProfilePage").then((m) => ({ default: m.AdminProfilePage })));
const AdminTicketTypesPage = lazy(() => import("./pages/AdminTicketTypesPage").then((m) => ({ default: m.AdminTicketTypesPage })));
const AdminAiLibraryPage = lazy(() => import("./pages/AdminAiLibraryPage").then((m) => ({ default: m.AdminAiLibraryPage })));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })));
const AdminTagsPage = lazy(() => import("./pages/AdminTagsPage").then((m) => ({ default: m.AdminTagsPage })));
const AdminTemplatesPage = lazy(() => import("./pages/AdminTemplatesPage").then((m) => ({ default: m.AdminTemplatesPage })));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage").then((m) => ({ default: m.AdminAnalyticsPage })));
const AdminVocPage = lazy(() => import("./pages/AdminVocPage").then((m) => ({ default: m.AdminVocPage })));

function RouteLoading() {
  return (
    <Box sx={{ minHeight: "40dvh", display: "grid", placeItems: "center", p: 3 }}>
      <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>로딩 중…</Typography>
    </Box>
  );
}

export function AdminApp() {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <TranslationProvider>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/inbox" replace />} />
              <Route path="/admin/inbox" element={<AdminInboxPage />} />
              <Route path="/admin/faq" element={<AdminFaqPage />} />
              <Route path="/admin/customers" element={<AdminCustomersPage />} />
              <Route path="/admin/ai-library" element={<AdminAiLibraryPage />} />
              <Route path="/admin/presets" element={<AdminPresetsPage />} />
              <Route path="/admin/ticket-types" element={<AdminTicketTypesPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/tags" element={<AdminTagsPage />} />
              <Route path="/admin/templates" element={<AdminTemplatesPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/voc" element={<AdminVocPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </TranslationProvider>
    </ThemeProvider>
  );
}


