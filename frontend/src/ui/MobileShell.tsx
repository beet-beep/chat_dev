import { Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode } from "react";

const NAV_HEIGHT = 72;

export function MobileShell({
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
        bgcolor: isMobile ? "background.default" : "#EEF1F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: isMobile ? 0 : 2,
        py: isMobile ? 0 : 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 430,
          height: isMobile ? "100dvh" : "min(860px, calc(100dvh - 48px))",
          borderRadius: 0,
          overflow: "hidden",
          position: "relative",
          bgcolor: "background.default",
          border: isMobile ? "none" : "1px solid rgba(17,24,39,0.12)",
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            pb: `${NAV_HEIGHT + 16}px`,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Box>

        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>{bottomNav}</Box>
      </Paper>
    </Box>
  );
}


