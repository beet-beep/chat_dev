import { Avatar, Box, Tooltip, alpha, Badge } from "@mui/material";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminMe } from "../../../api/support";

const items = [
  { key: "inbox", title: "수신함", path: "/admin/inbox", icon: <ForumOutlinedIcon />, badge: true },
  { key: "analytics", title: "분석", path: "/admin/analytics", icon: <BarChartIcon /> },
  { key: "templates", title: "템플릿", path: "/admin/templates", icon: <DescriptionOutlinedIcon /> },
  { key: "faq", title: "FAQ 관리", path: "/admin/faq", icon: <MenuBookOutlinedIcon /> },
  { key: "customers", title: "고객 DB", path: "/admin/customers", icon: <PeopleAltOutlinedIcon /> },
  { key: "voc", title: "VOC 스튜디오", path: "/admin/voc", icon: <RecordVoiceOverOutlinedIcon /> },
  { key: "ai_library", title: "AI 학습", path: "/admin/ai-library", icon: <AutoAwesomeIcon /> },
  { key: "ticket_types", title: "문의 유형", path: "/admin/ticket-types", icon: <CategoryOutlinedIcon /> },
  { key: "tags", title: "태그 관리", path: "/admin/tags", icon: <LabelOutlinedIcon /> },
  { key: "presets", title: "프리셋", path: "/admin/presets", icon: <TuneOutlinedIcon /> },
  { key: "settings", title: "설정", path: "/admin/settings", icon: <SettingsOutlinedIcon /> },
] as const;

export function AdminIconRail() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [me, setMe] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((u) => {
        if (!cancelled) setMe(u as any);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box 
      sx={{ 
        bgcolor: "#1E293B", 
        p: 1.5, 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 로고 영역 */}
      <Box 
        sx={{ 
          width: 44, 
          height: 44, 
          borderRadius: 3,
          background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
          display: "grid", 
          placeItems: "center", 
          color: "white", 
          fontWeight: 800,
          fontSize: "1.25rem",
          mb: 2,
          boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
        onClick={() => nav("/admin/inbox")}
      >
        J
      </Box>

      {/* 네비게이션 아이템 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
        {items.map((it, idx) => {
          const active = pathname.startsWith(it.path);
          return (
            <Tooltip key={it.key} title={it.title} placement="right" arrow>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => nav(it.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") nav(it.path);
                }}
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  color: active ? "#FFFFFF" : alpha("#FFFFFF", 0.5),
                  bgcolor: active ? alpha("#FFFFFF", 0.12) : "transparent",
                  borderRadius: 2.5,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all 0.15s ease",
                  position: "relative",
                  mx: "auto",
                  "&::before": active ? {
                    content: '""',
                    position: "absolute",
                    left: -12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    borderRadius: 4,
                    bgcolor: "#F97316",
                  } : {},
                  "&:hover": { 
                    bgcolor: alpha("#FFFFFF", active ? 0.16 : 0.08),
                    color: "#FFFFFF",
                  },
                  "& svg": {
                    fontSize: 22,
                    transition: "transform 0.15s ease",
                  },
                  "&:active svg": {
                    transform: "scale(0.9)",
                  },
                }}
              >
                {it.badge ? (
                  <Badge 
                    color="error" 
                    variant="dot"
                    sx={{
                      "& .MuiBadge-dot": {
                        top: 2,
                        right: 2,
                        width: 8,
                        height: 8,
                        border: "2px solid #1E293B",
                      },
                    }}
                  >
                    {it.icon}
                  </Badge>
                ) : (
                  it.icon
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* 스페이서 */}
      <Box sx={{ flex: 1 }} />

      {/* 프로필 아바타 */}
      <Tooltip title="내 프로필" placement="right" arrow>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => nav("/admin/profile")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") nav("/admin/profile");
          }}
          sx={{
            mt: 2,
            cursor: "pointer",
            userSelect: "none",
            transition: "transform 0.15s ease",
            "&:hover": { 
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <Avatar
            src={me?.profile?.avatar_url || undefined}
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: alpha("#FFFFFF", 0.15), 
              color: "#FFFFFF", 
              fontWeight: 700,
              fontSize: "0.875rem",
              border: `2px solid ${alpha("#FFFFFF", 0.2)}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {(me?.profile?.display_name || me?.email || "A").slice(0, 1).toUpperCase()}
          </Avatar>
        </Box>
      </Tooltip>
    </Box>
  );
}



