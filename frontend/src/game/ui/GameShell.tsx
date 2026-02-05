import { Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode } from "react";

const NAV_HEIGHT = 72;

export function GameShell({
  children,
  bottomNav,
}: {
  children: ReactNode;
  bottomNav: ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: isMobile ? "background.paper" : "background.default",
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: isMobile ? "flex-start" : "center",
        px: isMobile ? 0 : 2,
        py: isMobile ? 0 : 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 430,
          height: isMobile ? "100dvh" : "min(900px, calc(100dvh - 48px))",
          borderRadius: 0, // no rounding (match request)
          overflow: "hidden",
          position: "relative",
          bgcolor: "background.paper",
          border: "none",
          boxShadow: isMobile ? "none" : "0 12px 30px rgba(0,0,0,0.18)",
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            // Reserve space for bottom nav + iOS safe area.
            pb: `calc(${NAV_HEIGHT + 18}px + env(safe-area-inset-bottom, 0px))`,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            pb: "env(safe-area-inset-bottom, 0px)",
            bgcolor: "background.paper",
          }}
        >
          {bottomNav}
        </Box>
      </Paper>
    </Box>
  );
}


