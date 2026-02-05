import { createTheme, alpha } from "@mui/material/styles";

// Joody Admin Console Theme - Dark Mode Professional Theme
// Focus on clarity, efficiency, and modern aesthetics

const primaryBlue = "#3B82F6";
const primaryBlueDark = "#2563EB";
const accentOrange = "#F97316";
const successGreen = "#22C55E";
const warningYellow = "#FACC15";
const errorRed = "#EF4444";
const infoBlue = "#60A5FA";

// Dark theme neutral colors
const neutral = {
  50: "#18181B",
  100: "#1D1D20",
  200: "#27272A",
  300: "#3F3F46",
  400: "#52525B",
  500: "#71717A",
  600: "#A1A1AA",
  700: "#D4D4D8",
  800: "#E4E4E7",
  900: "#FAFAFA",
};

export const adminTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: primaryBlue,
      dark: primaryBlueDark,
      light: "#60A5FA",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: accentOrange,
      dark: "#EA580C",
      light: "#FB923C",
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
      dark: "#3B82F6",
    },
    background: {
      default: "#1D1D20",
      paper: "#27272A",
    },
    text: {
      primary: "#FAFAFA",
      secondary: "#A1A1AA",
    },
    divider: alpha("#FFFFFF", 0.08),
    action: {
      hover: alpha(primaryBlue, 0.08),
      selected: alpha(primaryBlue, 0.12),
      focus: alpha(primaryBlue, 0.16),
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.3,
      color: "#FAFAFA",
    },
    h2: {
      fontSize: "1.375rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1.35,
      color: "#FAFAFA",
    },
    h3: {
      fontSize: "1.125rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.4,
      color: "#FAFAFA",
    },
    h4: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "0.9375rem",
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
      fontSize: "0.9375rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.8125rem",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      lineHeight: 1.5,
      color: "#A1A1AA",
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      letterSpacing: "-0.005em",
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.55,
      letterSpacing: "-0.005em",
      color: "#A1A1AA",
    },
    caption: {
      fontSize: "0.6875rem",
      lineHeight: 1.4,
      letterSpacing: "0em",
      color: "#71717A",
    },
    button: {
      fontSize: "0.8125rem",
      fontWeight: 700,
      letterSpacing: "-0.005em",
      textTransform: "none" as const,
    },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.03)",
    "0 1px 3px rgba(0,0,0,0.04)",
    "0 2px 6px rgba(0,0,0,0.04)",
    "0 4px 10px rgba(0,0,0,0.05)",
    "0 6px 14px rgba(0,0,0,0.05)",
    "0 8px 20px rgba(0,0,0,0.06)",
    "0 12px 28px rgba(0,0,0,0.06)",
    "0 16px 36px rgba(0,0,0,0.07)",
    "0 20px 44px rgba(0,0,0,0.07)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
    "0 24px 52px rgba(0,0,0,0.08)",
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
        },
        body: {
          backgroundColor: "#1D1D20",
          minHeight: "100dvh",
          color: "#FAFAFA",
        },
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(4px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes slideIn": {
          from: { opacity: 0, transform: "translateX(-8px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
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
          backgroundColor: "#27272A",
          border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        },
        elevation1: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        },
        elevation2: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        },
        elevation3: {
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: "#27272A",
          border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            borderColor: alpha(primaryBlue, 0.3),
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 16,
          "&:last-child": { paddingBottom: 16 },
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
          padding: "8px 16px",
          transition: "all 0.15s ease",
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        contained: {
          boxShadow: `0 1px 3px ${alpha(primaryBlue, 0.2)}`,
          "&:hover": {
            boxShadow: `0 3px 8px ${alpha(primaryBlue, 0.25)}`,
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryBlue} 0%, ${primaryBlueDark} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${primaryBlueDark} 0%, #1E40AF 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${accentOrange} 0%, #EA580C 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, #EA580C 0%, #C2410C 100%)`,
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
            backgroundColor: alpha(primaryBlue, 0.04),
          },
        },
        text: {
          "&:hover": {
            backgroundColor: alpha(primaryBlue, 0.06),
          },
        },
        sizeLarge: {
          padding: "12px 24px",
          fontSize: "0.875rem",
        },
        sizeSmall: {
          padding: "5px 12px",
          fontSize: "0.75rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: alpha(primaryBlue, 0.06),
          },
          "&:active": {
            transform: "scale(0.92)",
          },
        },
        sizeSmall: {
          padding: 6,
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
          backgroundColor: "#18181B",
          fontSize: "0.875rem",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(primaryBlue, 0.5),
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 2px ${alpha(primaryBlue, 0.2)}`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: primaryBlue,
            borderWidth: 1.5,
          },
        },
        notchedOutline: {
          borderColor: alpha("#FFFFFF", 0.15),
          transition: "border-color 0.15s ease",
        },
        sizeSmall: {
          padding: "0px",
        },
        input: {
          padding: "10px 14px",
          color: "#FAFAFA",
          "&::placeholder": {
            color: "#71717A",
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "#A1A1AA",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          height: 24,
          fontSize: "0.6875rem",
          transition: "all 0.15s ease",
        },
        filled: {
          "&:hover": {
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          },
        },
        colorPrimary: {
          background: alpha(primaryBlue, 0.2),
          color: "#93C5FD",
        },
        colorSecondary: {
          background: alpha(accentOrange, 0.2),
          color: "#FB923C",
        },
        colorSuccess: {
          background: alpha(successGreen, 0.2),
          color: "#86EFAC",
        },
        colorError: {
          background: alpha(errorRed, 0.2),
          color: "#FCA5A5",
        },
        colorWarning: {
          background: alpha(warningYellow, 0.2),
          color: "#FDE047",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "0.75rem",
        },
        colorDefault: {
          background: `linear-gradient(135deg, ${primaryBlue} 0%, #3B82F6 100%)`,
          color: "#FFFFFF",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 2,
          borderRadius: 2,
          backgroundColor: primaryBlue,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.8125rem",
          letterSpacing: "-0.01em",
          minHeight: 40,
          padding: "10px 16px",
          color: "#71717A",
          transition: "all 0.15s ease",
          "&.Mui-selected": {
            color: "#60A5FA",
            fontWeight: 700,
          },
          "&:hover": {
            color: "#93C5FD",
            backgroundColor: alpha(primaryBlue, 0.08),
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha("#FFFFFF", 0.08),
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
          fontSize: "0.625rem",
          minWidth: 16,
          height: 16,
          padding: "0 4px",
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: primaryBlue,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          height: 4,
          backgroundColor: alpha(primaryBlue, 0.1),
        },
        bar: {
          borderRadius: 3,
          background: `linear-gradient(90deg, ${primaryBlue} 0%, #3B82F6 100%)`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#FFFFFF", 0.08),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#3F3F46",
          fontSize: "0.6875rem",
          fontWeight: 500,
          padding: "6px 10px",
          borderRadius: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          color: "#FAFAFA",
        },
        arrow: {
          color: "#3F3F46",
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiPaper-root": {
            borderRadius: 10,
            boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
          fontSize: "0.8125rem",
        },
        standardSuccess: {
          backgroundColor: alpha(successGreen, 0.15),
          color: "#86EFAC",
          border: `1px solid ${alpha(successGreen, 0.3)}`,
        },
        standardError: {
          backgroundColor: alpha(errorRed, 0.15),
          color: "#FCA5A5",
          border: `1px solid ${alpha(errorRed, 0.3)}`,
        },
        standardWarning: {
          backgroundColor: alpha(warningYellow, 0.15),
          color: "#FDE047",
          border: `1px solid ${alpha(warningYellow, 0.3)}`,
        },
        standardInfo: {
          backgroundColor: alpha(infoBlue, 0.15),
          color: "#93C5FD",
          border: `1px solid ${alpha(infoBlue, 0.3)}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 48px rgba(0,0,0,0.4)",
          backgroundColor: "#27272A",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
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
          borderRadius: 10,
          boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
          border: `1px solid ${alpha("#FFFFFF", 0.1)}`,
          backgroundColor: "#27272A",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 6px",
          padding: "8px 12px",
          fontSize: "0.8125rem",
          color: "#FAFAFA",
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: alpha(primaryBlue, 0.12),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(primaryBlue, 0.15),
            "&:hover": {
              backgroundColor: alpha(primaryBlue, 0.2),
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: alpha(primaryBlue, 0.1),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(primaryBlue, 0.15),
            "&:hover": {
              backgroundColor: alpha(primaryBlue, 0.2),
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: "#A1A1AA",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 500,
          fontSize: "0.875rem",
        },
        secondary: {
          fontSize: "0.75rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha("#FFFFFF", 0.08),
          padding: "12px 16px",
          color: "#FAFAFA",
        },
        head: {
          fontWeight: 700,
          fontSize: "0.75rem",
          color: "#A1A1AA",
          backgroundColor: "#18181B",
          textTransform: "uppercase" as const,
          letterSpacing: "0.03em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.1s ease",
          "&:hover": {
            backgroundColor: alpha(primaryBlue, 0.06),
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          backgroundColor: "#1D1D20",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        track: {
          borderRadius: 12,
          backgroundColor: "#52525B",
        },
        thumb: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          backgroundColor: "#FAFAFA",
        },
        switchBase: {
          "&.Mui-checked": {
            "& + .MuiSwitch-track": {
              backgroundColor: successGreen,
              opacity: 1,
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#52525B",
          "&.Mui-checked": {
            color: primaryBlue,
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#52525B",
          "&.Mui-checked": {
            color: primaryBlue,
          },
        },
      },
    },
  },
});

// Admin-specific utilities
export const adminUtils = {
  animations: {
    fadeIn: "fadeIn 0.2s ease forwards",
    slideIn: "slideIn 0.25s ease forwards",
    pulse: "pulse 1.5s ease-in-out infinite",
  },
  gradients: {
    primary: `linear-gradient(135deg, ${primaryBlue} 0%, ${primaryBlueDark} 100%)`,
    accent: `linear-gradient(135deg, ${accentOrange} 0%, #EA580C 100%)`,
    success: `linear-gradient(135deg, ${successGreen} 0%, #16A34A 100%)`,
    header: `linear-gradient(135deg, ${primaryBlue} 0%, #1E40AF 100%)`,
  },
  status: {
    open: { bg: alpha(successGreen, 0.2), color: "#86EFAC", label: "진행중" },
    pending: { bg: alpha(warningYellow, 0.2), color: "#FDE047", label: "대기중" },
    closed: { bg: alpha("#71717A", 0.2), color: "#A1A1AA", label: "완료" },
    urgent: { bg: alpha(errorRed, 0.2), color: "#FCA5A5", label: "긴급" },
  },
};


