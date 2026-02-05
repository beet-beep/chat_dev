import { useLocation, useNavigate } from "react-router-dom";
import { Badge, BottomNavigation, BottomNavigationAction, Paper, Box, alpha } from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useT } from "../i18n";

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const t = useT();

  const items = [
    { label: t("nav.faq"), value: "/faq", icon: <MenuBookOutlinedIcon /> },
    { label: t("nav.new"), value: "/new", icon: <AddBoxOutlinedIcon /> },
    { label: t("nav.tickets"), value: "/tickets", icon: <ListAltOutlinedIcon /> },
    { label: t("nav.me"), value: "/me", icon: <PersonOutlineOutlinedIcon /> },
  ] as const;

  const value = items.some((i) => i.value === pathname) ? pathname : "/faq";

  return (
    <Paper
      elevation={0}
      sx={{
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: "hidden",
        borderTop: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, next) => navigate(next)}
        showLabels
        sx={{
          height: 72,
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 72,
            py: 1.5,
            gap: 0.5,
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              "& .MuiSvgIcon-root": {
                transform: "scale(1.1)",
              },
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
              it.value === "/tickets" ? (
                <Badge
                  color="error"
                  variant="dot"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-dot": {
                      top: 2,
                      right: 2,
                      boxShadow: "0 0 0 2px white",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    {it.icon}
                  </Box>
                </Badge>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {it.icon}
                </Box>
              )
            }
            sx={{
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.65rem",
                fontWeight: 600,
                mt: 0.5,
                opacity: 0.7,
                transition: "all 0.2s ease",
                "&.Mui-selected": {
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  opacity: 1,
                },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
