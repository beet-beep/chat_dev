import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

import { adminMe } from "../../api/support";

export function AdminGuard() {
  const loc = useLocation();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setOk(false);
      return;
    }
    adminMe()
      .then((me) => {
        if (cancelled) return;
        setOk(Boolean(me.is_staff));
      })
      .catch(() => {
        if (cancelled) return;
        setOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ok === null)
    return (
      <Box sx={{ height: "100dvh", bgcolor: "background.default", display: "grid", placeItems: "center" }}>
        <Box sx={{ display: "grid", placeItems: "center", gap: 1 }}>
          <CircularProgress />
          <Typography sx={{ color: "text.secondary" }} variant="body2">
            관리자 인증 확인 중…
          </Typography>
        </Box>
      </Box>
    );
  if (!ok) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}


