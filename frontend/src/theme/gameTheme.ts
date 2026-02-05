import { createTheme } from "@mui/material/styles";

// Game UI skin (wood + parchment). Does NOT affect support/admin because only used in game entry.
export const gameTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#D39A2D" }, // warm gold
    secondary: { main: "#2E7D32" }, // vine green accent
    background: {
      default: "#111410", // outer background (forest)
      paper: "#F7E7CD", // parchment
    },
    text: {
      primary: "#3E2A1D",
      secondary: "#7A5A3E",
    },
    divider: "rgba(122,90,62,0.35)",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily:
      'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif',
    fontSize: 15,
    h6: { fontWeight: 900, letterSpacing: -0.3 },
    subtitle1: { fontWeight: 900, letterSpacing: -0.2 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          backgroundColor: "#111410",
          backgroundImage:
            "radial-gradient(900px 520px at 15% -10%, rgba(34,197,94,0.22), rgba(34,197,94,0) 60%), radial-gradient(900px 520px at 110% 5%, rgba(34,197,94,0.12), rgba(34,197,94,0) 55%), radial-gradient(1200px 650px at 50% 120%, rgba(211,154,45,0.18), rgba(211,154,45,0) 55%)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.0) 22%), radial-gradient(900px 700px at 20% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "2px solid rgba(122,90,62,0.45)",
          boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
          backgroundColor: "#F7E7CD",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(122,90,62,0.28)" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 900,
          borderRadius: 14,
        },
        contained: {
          background: "linear-gradient(180deg, #F3B83E 0%, #D39A2D 100%)",
          color: "#2F1F14",
          boxShadow: "0 8px 0 rgba(122,90,62,0.35)",
        },
        outlined: {
          borderWidth: 2,
          borderColor: "rgba(122,90,62,0.45)",
          background: "rgba(255,255,255,0.40)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          background: "rgba(255,255,255,0.55)",
        },
        notchedOutline: {
          borderWidth: 2,
          borderColor: "rgba(122,90,62,0.35)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          margin: "8px 12px",
          border: "2px solid rgba(122,90,62,0.35)",
          background: "rgba(255,255,255,0.35)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: "#F7E7CD",
          borderTop: "2px solid rgba(122,90,62,0.35)",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: "rgba(62,42,29,0.65)",
          "&.Mui-selected": {
            color: "#D39A2D",
          },
        },
        label: { fontWeight: 900 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.35)",
          border: "2px solid rgba(122,90,62,0.35)",
          borderRadius: 14,
          padding: 2,
        },
        indicator: { height: 0 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 12,
          fontWeight: 900,
          color: "rgba(62,42,29,0.75)",
          "&.Mui-selected": {
            color: "#2F1F14",
            background: "linear-gradient(180deg, rgba(243,184,62,0.7), rgba(211,154,45,0.55))",
            border: "2px solid rgba(122,90,62,0.22)",
          },
        },
      },
    },
  },
});






