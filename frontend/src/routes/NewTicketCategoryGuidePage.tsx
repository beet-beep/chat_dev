import { Box, Button, Card, CardContent, Skeleton, Typography, alpha } from "@mui/material";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { listTicketCategories } from "../api/support";
import type { TicketCategory } from "../api/types";
import { useT, useLanguage } from "../i18n";
import { GradientHeader } from "../ui/GradientHeader";
import { LanguageSelector } from "../i18n/LanguageSelector";

export function NewTicketCategoryGuidePage() {
  const nav = useNavigate();
  const { id } = useParams();
  const catId = Number(id);
  const t = useT();
  const { lang } = useLanguage();

  const [cats, setCats] = useState<TicketCategory[] | null>(null);

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

  const cat = useMemo(() => {
    if (!cats || !Number.isFinite(catId)) return null;
    return cats.find((c) => c.id === catId) ?? null;
  }, [cats, catId]);

  const botBlocks = useMemo(() => {
    if (!cat) return [];
    if (lang !== "ko" && Array.isArray(cat.bot_blocks_i18n?.[lang]) && cat.bot_blocks_i18n[lang].length > 0) {
      return cat.bot_blocks_i18n[lang];
    }
    return Array.isArray(cat.bot_blocks) ? cat.bot_blocks : [];
  }, [cat, lang]);

  return (
    <Box>
      <GradientHeader
        title={cat ? ((lang !== "ko" && cat.name_i18n?.[lang]) || cat.name) : t("categoryGuide.title")}
        subtitle={(cat && ((lang !== "ko" && cat.guide_description_i18n?.[lang]) || cat.guide_description)) || ""}
        icon={<SupportAgentOutlinedIcon />}
        backTo="/new"
        right={<LanguageSelector />}
      />

      <Box sx={{ px: 2.5, pt: 2, pb: 2, mt: -2 }}>
      {!cats ? (
        <Card sx={{ borderRadius: 2.5, p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} />
        </Card>
      ) : null}

      {cats && !cat ? (
        <Card sx={{ textAlign: "center", py: 4, borderRadius: 2.5 }}>
          <Typography color="text.secondary">
            {t("categoryGuide.notFound")}
          </Typography>
        </Card>
      ) : null}

      {cat ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Card sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            borderRadius: 2.5,
          }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: "1rem" }}>
                {(lang !== "ko" && cat.bot_title_i18n?.[lang]) || cat.bot_title || t("categoryGuide.defaultBot")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {(lang !== "ko" && cat.guide_description_i18n?.[lang]) || cat.guide_description || t("categoryGuide.defaultDesc")}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: "0.9375rem" }}>{t("categoryGuide.checkTitle")}</Typography>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {botBlocks.length ? (
                  botBlocks.map((b: any, idx: number) => {
                    if (b.type === "paragraph")
                      return (
                        <Typography key={idx} variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.secondary" }}>
                          {b.text}
                        </Typography>
                      );
                    if (b.type === "image") return (
                      <Box key={idx} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <img src={b.url} alt="" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                      </Box>
                    );
                    if (b.type === "video") return (
                      <Box key={idx} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <video src={b.url} controls style={{ maxWidth: "100%", display: "block" }} />
                      </Box>
                    );
                    if (b.type === "file")
                      return (
                        <a key={idx} href={b.url} target="_blank" rel="noreferrer" style={{ color: "#2563EB" }}>
                          {b.name || b.url}
                        </a>
                      );
                    return null;
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("categoryGuide.noContent")}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<SendIcon />}
            sx={{
              py: 1.5,
              fontWeight: 800,
              borderRadius: 2,
              boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
              }
            }}
            component={RouterLink}
            to={`/new/compose?catId=${encodeURIComponent(String(cat.id))}&entry=category_guide`}
          >
            {t("categoryGuide.submit")}
          </Button>
        </Box>
      ) : null}
      </Box>
    </Box>
  );
}
