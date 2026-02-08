import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Typography,
  alpha,
  Skeleton,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { listTicketCategories } from "../api/support";
import { apiFetch } from "../api/client";
import type { TicketCategory } from "../api/types";
import { useT, useLanguage } from "../i18n";
import { LanguageSelector } from "../i18n/LanguageSelector";

type AppSetting = { key: string; value: string };

function categorySnippet(c: TicketCategory, fallback: string, lang: string) {
  // 현재 언어에 맞는 bot_blocks_i18n 우선 사용
  let blocks: any[] = [];
  if (lang !== "ko" && Array.isArray(c.bot_blocks_i18n?.[lang]) && c.bot_blocks_i18n[lang].length > 0) {
    blocks = c.bot_blocks_i18n[lang];
  } else {
    blocks = Array.isArray(c.bot_blocks) ? c.bot_blocks : [];
  }
  const first = blocks.find((b: any) => b && b.type === "paragraph" && String(b.text || "").trim());
  const t = String(first?.text ?? "").replace(/\s+/g, " ").trim();
  return t ? (t.length > 54 ? `${t.slice(0, 54)}…` : t) : fallback;
}

const categoryColors = [
  { bg: "#FFF7ED", border: "#FDBA74", icon: "#EA580C" },
  { bg: "#EFF6FF", border: "#93C5FD", icon: "#2563EB" },
  { bg: "#F0FDF4", border: "#86EFAC", icon: "#16A34A" },
  { bg: "#FEF3C7", border: "#FCD34D", icon: "#CA8A04" },
  { bg: "#FDF2F8", border: "#F9A8D4", icon: "#DB2777" },
  { bg: "#F5F3FF", border: "#C4B5FD", icon: "#7C3AED" },
];

export function NewTicketStartPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const t = useT();
  const { lang } = useLanguage();

  const [cats, setCats] = useState<TicketCategory[] | null>(null);
  const [settings, setSettings] = useState<AppSetting[]>([]);

  // Helper to get notice value from settings with language suffix
  const getNotice = (base: string): string => {
    const suffix = lang === "ko" ? "" : `_${lang}`;
    const key = `notice_${base}${suffix}`;
    const found = settings.find((s) => s.key === key);
    if (found?.value) return found.value;
    // Fallback to Korean if no translation
    const koKey = `notice_${base}`;
    const koFound = settings.find((s) => s.key === koKey);
    if (koFound?.value) return koFound.value;
    // Ultimate fallback to i18n
    return t(`newStart.notice.${base}` as any);
  };

  useEffect(() => {
    const mode = sp.get("mode");
    const ticketId = sp.get("ticketId");
    if (mode === "reply" || ticketId) {
      nav(`/new/compose?${sp.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCats(null);
    listTicketCategories()
      .then((d) => {
        if (!cancelled) setCats(d);
      })
      .catch(() => {
        if (!cancelled) setCats([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch app settings for notice
  useEffect(() => {
    apiFetch<AppSetting[]>("/settings/")
      .then((data) => {
        if (Array.isArray(data)) setSettings(data);
      })
      .catch(() => {});
  }, []);

  return (
    <Box>
      <Box
        sx={{
          px: 2.5,
          pt: 4,
          pb: 6,
          color: "common.white",
          background: "linear-gradient(180deg, #FF8C42 0%, #FFAB6B 40%, #FFC89E 80%, rgba(255,200,158,0.0) 100%)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 100% 0%, ${alpha("#FFFFFF", 0.2)} 0%, transparent 50%)`,
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.3,
                textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                animation: "fadeIn 0.4s ease forwards",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(6px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {t("newStart.greeting")}
              <br />
              {t("newStart.question")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                opacity: 0.95,
                lineHeight: 1.5,
                fontWeight: 500,
                animation: "fadeIn 0.5s ease forwards",
                animationDelay: "0.1s",
              }}
            >
              {t("newStart.subtext1")}
              <br />
              {t("newStart.subtext2")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flex: "0 0 auto" }}>
            <LanguageSelector />
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 4,
                background: alpha("#FFFFFF", 0.2),
                backdropFilter: "blur(8px)",
                display: "grid",
                placeItems: "center",
                boxShadow: `0 4px 20px ${alpha("#000", 0.1)}`,
                animation: "fadeIn 0.4s ease forwards",
              }}
            >
              <SupportAgentOutlinedIcon sx={{ fontSize: 40, opacity: 0.95 }} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: -3, px: 2.5, pb: 2 }}>
        <Card
          sx={{
            mb: 2.5,
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(12px)",
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            boxShadow: "0 12px 32px rgba(249,115,22,0.12)",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 20, color: "info.main" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 0.75, fontSize: "0.9375rem" }}>{getNotice("title")}</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
                      {getNotice("hours")}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5, fontSize: "0.75rem" }}>
                    {getNotice("extra")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{t("newStart.category.title")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {cats ? t("newStart.category.count", { count: cats.length }) : ""}
          </Typography>
        </Box>

        {!cats ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ minHeight: 100 }}>
                  <Skeleton variant="rounded" width={36} height={36} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="50%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : cats.length === 0 ? (
          <Card sx={{ textAlign: "center", py: 4, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
              {t("newStart.category.empty")}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {cats.map((c, idx) => {
              const color = categoryColors[idx % categoryColors.length];
              const categoryEmoji = c.name.includes("결제") ? "💳"
                : c.name.includes("계정") ? "👤"
                : c.name.includes("버그") || c.name.includes("오류") ? "🐛"
                : c.name.includes("건의") || c.name.includes("제안") ? "💡"
                : c.name.includes("환불") ? "💰"
                : c.name.includes("이벤트") ? "🎉"
                : "📋";
              return (
                <Card
                  key={c.id}
                  sx={{
                    overflow: "hidden",
                    borderRadius: 2,
                    border: `1px solid ${alpha(color.border, 0.4)}`,
                    transition: "all 0.2s ease",
                    animation: "fadeIn 0.3s ease forwards",
                    animationDelay: `${idx * 0.05}s`,
                    opacity: 0,
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateY(8px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 24px ${alpha(color.icon, 0.15)}`,
                      borderColor: color.border,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => {
                      nav(`/new/category/${c.id}`);
                    }}
                  >
                    <CardContent sx={{ minHeight: 100, display: "flex", flexDirection: "column", p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: color.bg,
                            display: "grid",
                            placeItems: "center",
                            fontSize: "1rem",
                            flexShrink: 0,
                          }}
                        >
                          {categoryEmoji}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }} noWrap>
                          {(lang !== "ko" && c.name_i18n?.[lang]) || c.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          flex: 1,
                          fontSize: "0.6875rem",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mb: 0.5,
                        }}
                      >
                        {categorySnippet(c, t("newStart.category.snippet.default"), lang)}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: color.icon,
                            fontWeight: 600,
                            fontSize: "0.6875rem",
                          }}
                        >
                          {t("newStart.category.select")}
                        </Typography>
                        <ChevronRightIcon sx={{ color: color.icon, fontSize: 14 }} />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
