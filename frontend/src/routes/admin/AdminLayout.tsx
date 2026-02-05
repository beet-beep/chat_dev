import { Box, alpha } from "@mui/material";
import { Outlet } from "react-router-dom";
import { AdminIconRail } from "./components/AdminIconRail";

export function AdminLayout() {
  return (
    <Box 
      sx={{ 
        height: "100dvh", 
        bgcolor: "background.default", 
        display: "grid", 
        gridTemplateColumns: "72px 1fr", 
        overflow: "hidden",
      }}
    >
      <AdminIconRail />
      <Box 
        sx={{ 
          minWidth: 0, 
          height: "100%", 
          overflow: "hidden",
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          bgcolor: "background.default",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.02)",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}


