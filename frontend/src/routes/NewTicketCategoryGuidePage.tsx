import { Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { listTicketCategories } from "../api/support";
import type { TicketCategory } from "../api/types";
import { useT, useLanguage } from "../i18n";

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
    <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => nav("/new")} sx={{ fontWeight: 900 }}>
          {t("categoryGuide.back")}
        </Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          {t("categoryGuide.title")}
        </Typography>
        <Box sx={{ width: 72 }} />
      </Box>

      {!cats ? (
        <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : null}

      {cats && !cat ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          {t("categoryGuide.notFound")}
        </Typography>
      ) : null}

      {cat ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Card sx={{ bgcolor: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)" }}>
            <CardContent>
              <Typography sx={{ fontWeight: 900, mb: 0.25 }}>
                {(lang !== "ko" && cat.bot_title_i18n?.[lang]) || cat.bot_title || t("categoryGuide.defaultBot")} · {(lang !== "ko" && cat.name_i18n?.[lang]) || cat.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(lang !== "ko" && cat.guide_description_i18n?.[lang]) || cat.guide_description || t("categoryGuide.defaultDesc")}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>{t("categoryGuide.checkTitle")}</Typography>
              <Box sx={{ display: "grid", gap: 1.25 }}>
                {botBlocks.length ? (
                  botBlocks.map((b: any, idx: number) => {
                    if (b.type === "paragraph")
                      return (
                        <Typography key={idx} variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                          {b.text}
                        </Typography>
                      );
                    if (b.type === "image") return <img key={idx} src={b.url} alt="" style={{ maxWidth: "100%", height: "auto" }} />;
                    if (b.type === "video") return <video key={idx} src={b.url} controls style={{ maxWidth: "100%" }} />;
                    if (b.type === "file")
                      return (
                        <a key={idx} href={b.url} target="_blank" rel="noreferrer">
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
            sx={{ py: 1.5, fontWeight: 900 }}
            component={RouterLink}
            to={`/new/compose?catId=${encodeURIComponent(String(cat.id))}&entry=category_guide`}
          >
            {t("categoryGuide.submit")}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
