import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  InputAdornment,
  Chip,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import { GradientHeader } from "../ui/GradientHeader";
import { listFaqCategories, listFaqs } from "../api/support";
import type { Faq, FaqCategory } from "../api/types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT, useLanguage } from "../i18n";
import { LanguageSelector } from "../i18n/LanguageSelector";

export function FaqPage() {
  const nav = useNavigate();
  const t = useT();
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>("popular");
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [cats, setCats] = useState<FaqCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useMemo(() => query.trim(), [query]);

  const guideUrl = useMemo(() => {
    const list = cats ?? [];
    const g = list.find((c) => (c as any).is_guide_link) ?? list.find((c) => c.kind === "GUIDE");
    return g?.guide_url || "";
  }, [cats]);

  const faqCats = useMemo(() => {
    const list = cats ?? [];
    const filtered = list.filter((c) => !(c as any).is_guide_link && c.kind !== "GUIDE");
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
  }, [cats]);

  useEffect(() => {
    if (!tab || tab === "") {
      setTab("popular");
    }
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFaqs(null);
    const params: any = { q: search || undefined };

    if (tab === "popular") {
      params.is_popular = true;
    } else if (tab.startsWith("cat_")) {
      const id = Number(tab.replace("cat_", ""));
      if (Number.isFinite(id)) params.category_id = id;
    }

    listFaqs(params)
      .then((data) => {
        if (cancelled) return;
        setFaqs(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [tab, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    listFaqCategories()
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

  const faqsSorted = useMemo(() => {
    const list = faqs ?? [];
    const sorted = [...list];
    sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
    if (!search) return sorted;
    return sorted;
  }, [faqs, search]);

  return (
    <Box>
      <GradientHeader
        title={t("faq.header.title")}
        subtitle={t("faq.header.subtitle")}
        gradient="linear-gradient(180deg, #FF8C42 0%, #FFAB6B 40%, #FFC89E 80%, rgba(255,200,158,0.0) 100%)"
        icon={<AutoAwesomeOutlinedIcon />}
        right={<LanguageSelector />}
      />

      <Box sx={{ px: 2.5, pt: 2, pb: 3, bgcolor: "#fff" }}>
        <Card
          sx={{
            mb: 2,
            overflow: "visible",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "none",
            bgcolor: "#fff",
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder={t("faq.search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "primary.main", opacity: 0.7 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  "& fieldset": { border: "none" },
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  },
                  "&.Mui-focused": {
                    bgcolor: "white",
                    boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 2,
            background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            },
          }}
        >
          <CardActionArea
            onClick={() => {
              if (guideUrl) window.open(guideUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                }}
              >
                <MenuBookOutlinedIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "text.primary" }}>
                  {t("faq.guide.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem", mt: 0.25 }}>
                  {guideUrl ? t("faq.guide.hasUrl") : t("faq.guide.noUrl")}
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "text.secondary", fontSize: "1.25rem" }} />
            </CardContent>
          </CardActionArea>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                minHeight: 44,
                px: 2,
                fontSize: "0.8125rem",
                borderRadius: 2,
                mr: 0.5,
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                },
                "&.Mui-selected": {
                  fontWeight: 700,
                },
              },
              "& .MuiTabs-indicator": {
                borderRadius: 999,
                height: 3,
              },
            }}
          >
            <Tab
              value="popular"
              label={t("faq.tab.popular")}
              icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />

            {faqCats.slice(0, 12).map((c) => (
              <Tab key={c.id} value={`cat_${c.id}`} label={c.name_i18n?.[lang] || c.name} />
            ))}

            <Tab value="all" label={t("faq.tab.all")} />
          </Tabs>
          <Divider sx={{ mt: 0.5 }} />
        </Box>

        <Box sx={{ mt: 2 }}>
          {!faqs && !error ? (
            <Card>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i}>
                  {i > 1 && <Divider />}
                  <CardContent sx={{ py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton variant="rounded" width={36} height={24} />
                    <Skeleton variant="text" sx={{ flex: 1 }} />
                  </CardContent>
                </Box>
              ))}
            </Card>
          ) : null}
          {error ? (
            <Card sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.05), border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
              <CardContent>
                <Typography color="error" sx={{ fontWeight: 500 }}>
                  {t("faq.error.load", { error })}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
          {faqs && faqs.length === 0 ? (
            <Card sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary" sx={{ fontSize: "0.9375rem" }}>
                {t("faq.empty")}
              </Typography>
            </Card>
          ) : null}
          {faqs && faqs.length > 0 ? (
            <Card>
              {faqsSorted.map((f, idx) => {
                const qNo = idx + 1;
                return (
                <Box
                  key={f.id}
                  sx={{
                    animation: "fadeIn 0.3s ease forwards",
                    animationDelay: `${idx * 0.03}s`,
                    opacity: 0,
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateY(4px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  {idx === 0 ? null : <Divider />}
                  <CardActionArea
                    onClick={() => nav(`/faq/${f.id}`)}
                    sx={{
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                      },
                    }}
                  >
                    <CardContent sx={{ py: 1.75, display: "flex", alignItems: "center", gap: 2 }}>
                      <Chip
                        label={`Q${qNo}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          height: 26,
                          minWidth: 42,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: "primary.dark",
                        }}
                      />
                      <Typography sx={{ fontWeight: 600, flex: 1, fontSize: "0.9rem", color: "text.primary" }} noWrap>
                        {(lang !== "ko" && f.title_i18n?.[lang]) || f.title}
                      </Typography>
                      <ChevronRightIcon sx={{ color: "text.secondary", fontSize: "1.25rem", opacity: 0.5 }} />
                    </CardContent>
                  </CardActionArea>
                </Box>
              );
              })}
            </Card>
          ) : null}
        </Box>

        <Box sx={{ mt: 3, mb: 2 }} />
      </Box>
    </Box>
  );
}
