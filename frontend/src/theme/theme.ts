import { createTheme, alpha } from "@mui/material/styles";

// Joody Customer Support Theme - Modern, Friendly, Professional
// Inspired by Zendesk & Channel Talk's best practices

const primaryOrange = "#F97316";
const primaryOrangeDark = "#EA580C";
const secondaryPeach = "#FDBA74";
const successGreen = "#22C55E";
const warningYellow = "#FACC15";
const errorRed = "#EF4444";
const infoBlue = "#3B82F6";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: primaryOrange,
      dark: primaryOrangeDark,
      light: "#FB923C",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: secondaryPeach,
      dark: "#F97316",
      light: "#FED7AA",
    },
    success: {
      main: successGreen,
      light: "#86EFAC",
      dark: "#16A34A",
    },
    warning: {
      main: warningYellow,
      light: "#FDE047",
      dark: "#CA8A04",
    },
    error: {
      main: errorRed,
      light: "#FCA5A5",
      dark: "#DC2626",
    },
    info: {
      main: infoBlue,
      light: "#93C5FD",
      dark: "#2563EB",
    },
    background: {
      default: "#FFFBF7",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F2937",
      secondary: "#6B7280",
    },
    divider: alpha("#1F2937", 0.08),
    action: {
      hover: alpha(primaryOrange, 0.04),
      selected: alpha(primaryOrange, 0.08),
      focus: alpha(primaryOrange, 0.12),
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontSize: "2rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.3,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.35,
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.125rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "0.875rem",
      fontWeight: 700,
      letterSpacing: "-0.005em",
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.65,
      letterSpacing: "-0.005em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      letterSpacing: "-0.005em",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
      letterSpacing: "0em",
      color: "#6B7280",
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 700,
      letterSpacing: "-0.005em",
      textTransform: "none" as const,
    },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.04)",
    "0 2px 4px rgba(0,0,0,0.04)",
    "0 4px 8px rgba(0,0,0,0.04)",
    "0 6px 12px rgba(0,0,0,0.05)",
    "0 8px 16px rgba(0,0,0,0.05)",
    "0 12px 24px rgba(0,0,0,0.06)",
    "0 16px 32px rgba(0,0,0,0.06)",
    "0 20px 40px rgba(0,0,0,0.07)",
    "0 24px 48px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
    "0 32px 64px rgba(0,0,0,0.08)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          scrollBehavior: "smooth",
        },
        body: {
          background: `linear-gradient(135deg, ${alpha(primaryOrange, 0.03)} 0%, ${alpha("#FFFFFF", 1)} 50%, ${alpha(successGreen, 0.02)} 100%)`,
          minHeight: "100dvh",
        },
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes slideUp": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
        "@keyframes shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${alpha("#1F2937", 0.06)}`,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        },
        elevation2: {
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
        elevation3: {
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${alpha("#1F2937", 0.08)}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            borderColor: alpha(primaryOrange, 0.2),
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          "&:last-child": { paddingBottom: 20 },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
          "&:hover": {
            backgroundColor: alpha(primaryOrange, 0.03),
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontWeight: 700,
          padding: "10px 20px",
          transition: "all 0.2s ease",
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        contained: {
          boxShadow: "0 2px 8px rgba(249,115,22,0.25)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryOrange} 0%, ${primaryOrangeDark} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${primaryOrangeDark} 0%, #C2410C 100%)`,
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
            backgroundColor: alpha(primaryOrange, 0.04),
          },
        },
        text: {
          "&:hover": {
            backgroundColor: alpha(primaryOrange, 0.06),
          },
        },
        sizeLarge: {
          padding: "14px 28px",
          fontSize: "1rem",
        },
        sizeSmall: {
          padding: "6px 14px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: alpha(primaryOrange, 0.08),
          },
          "&:active": {
            transform: "scale(0.92)",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(primaryOrange, 0.4),
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${alpha(primaryOrange, 0.12)}`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: primaryOrange,
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: alpha("#1F2937", 0.15),
          transition: "border-color 0.2s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          height: 28,
          transition: "all 0.15s ease",
        },
        filled: {
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          },
        },
        colorPrimary: {
          background: `linear-gradient(135deg, ${alpha(primaryOrange, 0.12)} 0%, ${alpha(primaryOrange, 0.18)} 100%)`,
          color: primaryOrangeDark,
        },
        colorSuccess: {
          background: `linear-gradient(135deg, ${alpha(successGreen, 0.12)} 0%, ${alpha(successGreen, 0.18)} 100%)`,
          color: "#16A34A",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `2px solid ${alpha("#FFFFFF", 0.8)}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
        colorDefault: {
          background: `linear-gradient(135deg, ${primaryOrange} 0%, ${secondaryPeach} 100%)`,
          color: "#FFFFFF",
          fontWeight: 700,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderTop: `1px solid ${alpha("#1F2937", 0.08)}`,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
          height: 72,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: "#9CA3AF",
          transition: "all 0.2s ease",
          "&.Mui-selected": {
            color: primaryOrange,
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.7rem",
            fontWeight: 600,
            marginTop: 4,
            "&.Mui-selected": {
              fontSize: "0.7rem",
              fontWeight: 700,
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundColor: primaryOrange,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: "-0.01em",
          minHeight: 48,
          padding: "12px 20px",
          color: "#6B7280",
          transition: "all 0.2s ease",
          "&.Mui-selected": {
            color: primaryOrange,
            fontWeight: 700,
          },
          "&:hover": {
            color: primaryOrangeDark,
            backgroundColor: alpha(primaryOrange, 0.04),
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha("#1F2937", 0.06),
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
          fontSize: "0.65rem",
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: primaryOrange,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: alpha(primaryOrange, 0.12),
        },
        bar: {
          borderRadius: 4,
          background: `linear-gradient(90deg, ${primaryOrange} 0%, ${secondaryPeach} 100%)`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#1F2937", 0.06),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1F2937",
          fontSize: "0.75rem",
          fontWeight: 500,
          padding: "8px 12px",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        },
        arrow: {
          color: "#1F2937",
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiPaper-root": {
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
        standardSuccess: {
          backgroundColor: alpha(successGreen, 0.1),
          color: "#166534",
        },
        standardError: {
          backgroundColor: alpha(errorRed, 0.1),
          color: "#991B1B",
        },
        standardWarning: {
          backgroundColor: alpha(warningYellow, 0.15),
          color: "#92400E",
        },
        standardInfo: {
          backgroundColor: alpha(infoBlue, 0.1),
          color: "#1E40AF",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.125rem",
          fontWeight: 700,
          padding: "20px 24px 12px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
          gap: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: `1px solid ${alpha("#1F2937", 0.08)}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 6px",
          padding: "10px 14px",
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: alpha(primaryOrange, 0.06),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(primaryOrange, 0.1),
            "&:hover": {
              backgroundColor: alpha(primaryOrange, 0.14),
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: alpha(primaryOrange, 0.04),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(primaryOrange, 0.08),
            "&:hover": {
              backgroundColor: alpha(primaryOrange, 0.12),
            },
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha("#1F2937", 0.08)}`,
          boxShadow: "none",
          "&:before": {
            display: "none",
          },
          "&.Mui-expanded": {
            margin: 0,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          minHeight: 56,
          "&.Mui-expanded": {
            minHeight: 56,
          },
        },
      },
    },
  },
});

// Animation utilities for use in components
export const animations = {
  fadeIn: "fadeIn 0.3s ease forwards",
  slideUp: "slideUp 0.4s ease forwards",
  pulse: "pulse 2s ease-in-out infinite",
  shimmer: "shimmer 2s linear infinite",
};

// Gradient utilities
export const gradients = {
  primary: `linear-gradient(135deg, ${primaryOrange} 0%, ${primaryOrangeDark} 100%)`,
  secondary: `linear-gradient(135deg, ${secondaryPeach} 0%, ${primaryOrange} 100%)`,
  success: `linear-gradient(135deg, ${successGreen} 0%, #16A34A 100%)`,
  warm: `linear-gradient(135deg, #FFE4D6 0%, #FFECD6 100%)`,
  cool: `linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%)`,
  sunset: `linear-gradient(135deg, ${primaryOrange} 0%, #EC4899 100%)`,
  header: "linear-gradient(180deg, #FFB35C 0%, #FFCA85 60%, rgba(255,202,133,0) 100%)",
};


