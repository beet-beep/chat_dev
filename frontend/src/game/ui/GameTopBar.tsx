import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { ReactNode } from "react";

export function GameTopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        px: 1.5,
        pt: 1.25,
        pb: 1.25,
        background: "linear-gradient(180deg, rgba(17,20,16,0.85), rgba(17,20,16,0.0))",
        backdropFilter: "blur(6px)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 18,
          px: 1.25,
          py: 1,
          background: "linear-gradient(180deg, #C99762 0%, #A67644 100%)",
          border: "3px solid rgba(62,42,29,0.55)",
          boxShadow: "0 10px 18px rgba(0,0,0,0.25)",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            left: -10,
            top: -14,
            width: 120,
            height: 46,
            borderRadius: 999,
            background: "radial-gradient(circle at 30% 50%, rgba(34,197,94,0.65), rgba(34,197,94,0.0) 70%)",
            transform: "rotate(-8deg)",
          },
          "&:after": {
            content: '""',
            position: "absolute",
            right: -18,
            top: -16,
            width: 140,
            height: 52,
            borderRadius: 999,
            background: "radial-gradient(circle at 60% 50%, rgba(34,197,94,0.55), rgba(34,197,94,0.0) 70%)",
            transform: "rotate(10deg)",
          },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ width: 44 }}>
            {onBack ? (
              <IconButton onClick={onBack} size="small" sx={{ color: "#2F1F14" }}>
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
          <Typography
            sx={{
              fontWeight: 900,
              color: "#2F1F14",
              textAlign: "center",
              fontSize: "1.05rem",
              letterSpacing: -0.3,
              textShadow: "0 1px 0 rgba(255,255,255,0.35)",
              flex: 1,
            }}
            noWrap
          >
            {title}
          </Typography>
          <Box sx={{ width: 96, display: "flex", justifyContent: "flex-end", gap: 0.5 }}>{right}</Box>
        </Box>
      </Box>
    </Box>
  );
}






