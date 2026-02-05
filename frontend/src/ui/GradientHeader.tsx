import { Box, Typography, alpha } from "@mui/material";
import { ReactNode } from "react";

export function GradientHeader({
  title,
  subtitle,
  right,
  // Modern gradient with depth
  gradient = "linear-gradient(180deg, #FF8C42 0%, #FFAB6B 40%, #FFC89E 80%, rgba(255,200,158,0.0) 100%)",
  icon,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  gradient?: string;
  icon?: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        px: 2.5,
        pt: 4,
        pb: 3,
        color: "common.white",
        background: gradient,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 0% 0%, ${alpha("#FFFFFF", 0.15)} 0%, transparent 50%)`,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -20,
          right: -20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: alpha("#FFFFFF", 0.08),
          pointerEvents: "none",
        },
      }}
    >
      <Box 
        sx={{ 
          position: "relative",
          zIndex: 1,
          display: "flex", 
          alignItems: "flex-start", 
          justifyContent: "space-between", 
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {icon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: alpha("#FFFFFF", 0.2),
                backdropFilter: "blur(8px)",
                "& svg": {
                  fontSize: 22,
                },
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: "-0.02em", 
                fontSize: "1.25rem",
                textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                animation: "fadeIn 0.3s ease forwards",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(4px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography 
                sx={{ 
                  mt: 0.5, 
                  opacity: 0.92, 
                  lineHeight: 1.4, 
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  animation: "fadeIn 0.4s ease forwards",
                  animationDelay: "0.05s",
                  "@keyframes fadeIn": {
                    from: { opacity: 0, transform: "translateY(4px)" },
                    to: { opacity: 0.92, transform: "translateY(0)" },
                  },
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {right && (
          <Box
            sx={{
              animation: "fadeIn 0.3s ease forwards",
              "@keyframes fadeIn": {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            {right}
          </Box>
        )}
      </Box>
    </Box>
  );
}


