import { BottomNavigation, BottomNavigationAction, Paper, Box } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useLocation, useNavigate } from "react-router-dom";

const items = [
  { label: "홈", value: "/home", icon: <HomeRoundedIcon />, color: "#4CAF50" },
  { label: "가챠", value: "/gacha", icon: <CardGiftcardRoundedIcon />, color: "#7C4DFF" },
  { label: "광장", value: "/plaza", icon: <PublicRoundedIcon />, color: "#2196F3" },
  { label: "상점", value: "/shop", icon: <StorefrontRoundedIcon />, color: "#FF9800" },
  { label: "프로필", value: "/profile", icon: <PersonRoundedIcon />, color: "#E91E63" },
] as const;

export function GameBottomNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const value = items.some((i) => i.value === pathname) ? pathname : "/home";

  return (
    <Paper
      elevation={0}
      sx={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
        pb: "env(safe-area-inset-bottom, 0px)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,245,245,0.98) 100%)",
        borderTop: "2px solid rgba(0,0,0,0.05)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, next) => nav(next)}
        showLabels
        sx={{
          height: `calc(70px + env(safe-area-inset-bottom, 0px))`,
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            py: 1,
            color: "#BDBDBD",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              transform: "translateY(-2px)",
            },
            "& .MuiBottomNavigationAction-label": {
              fontWeight: 700,
              fontSize: "0.68rem",
              mt: 0.3,
              "&.Mui-selected": {
                fontWeight: 800,
                fontSize: "0.7rem",
              },
            },
            "& .MuiSvgIcon-root": {
              fontSize: "1.5rem",
            },
          },
        }}
      >
        {items.map((it) => (
          <BottomNavigationAction
            key={it.value}
            label={it.label}
            value={it.value}
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  bgcolor: value === it.value ? `${it.color}15` : "transparent",
                  border: value === it.value ? `2px solid ${it.color}` : "2px solid transparent",
                  transition: "all 0.2s ease",
                  "& .MuiSvgIcon-root": {
                    color: value === it.value ? it.color : "#BDBDBD",
                    transition: "color 0.2s ease",
                  },
                }}
              >
                {it.icon}
              </Box>
            }
            sx={{
              "&.Mui-selected": {
                color: it.color,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
