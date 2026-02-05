import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import { BottomNav } from "../ui/BottomNav";
import { MobileShell } from "../ui/MobileShell";
import { useT } from "../i18n";

const FaqPage = lazy(() => import("./FaqPage").then((m) => ({ default: m.FaqPage })));
const FaqDetailPage = lazy(() => import("./FaqDetailPage").then((m) => ({ default: m.FaqDetailPage })));
const NewTicketStartPage = lazy(() => import("./NewTicketStartPage").then((m) => ({ default: m.NewTicketStartPage })));
const NewTicketCategoryGuidePage = lazy(() =>
  import("./NewTicketCategoryGuidePage").then((m) => ({ default: m.NewTicketCategoryGuidePage }))
);
const NewTicketPage = lazy(() => import("./NewTicketPage").then((m) => ({ default: m.NewTicketPage })));
const TicketsPage = lazy(() => import("./TicketsPage").then((m) => ({ default: m.TicketsPage })));
const TicketDetailPage = lazy(() => import("./TicketDetailPage").then((m) => ({ default: m.TicketDetailPage })));
const MePage = lazy(() => import("./MePage").then((m) => ({ default: m.MePage })));
const AdminApp = lazy(() => import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })));

function RouteLoading() {
  const t = useT();
  return (
    <Box sx={{ minHeight: "40dvh", display: "grid", placeItems: "center", p: 3 }}>
      <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>{t("app.loading")}</Typography>
    </Box>
  );
}

export function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <MobileShell bottomNav={<BottomNav />}>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/faq" replace />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/faq/:id" element={<FaqDetailPage />} />
          <Route path="/new" element={<NewTicketStartPage />} />
          <Route path="/new/category/:id" element={<NewTicketCategoryGuidePage />} />
          <Route path="/new/compose" element={<NewTicketPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/me" element={<MePage />} />
        </Routes>
      </Suspense>
    </MobileShell>
  );
}


