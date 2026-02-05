import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getFaq, trackFaqView } from "../api/support";
import type { Faq } from "../api/types";
import DOMPurify from "dompurify";
import { useT, useLocale, useLanguage } from "../i18n";

// Generate a session ID for anonymous view tracking
function getSessionId() {
  let sid = localStorage.getItem("faq_session_id");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("faq_session_id", sid);
  }
  return sid;
}

export function FaqDetailPage() {
  const { id } = useParams();
  const faqId = Number(id);
  const nav = useNavigate();
  const t = useT();
  const locale = useLocale();
  const { lang } = useLanguage();

  const [faq, setFaq] = useState<Faq | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(faqId)) {
      setError(t("faqDetail.invalidId"));
      return;
    }
    let cancelled = false;
    setError(null);
    setFaq(null);
    getFaq(faqId)
      .then((d) => {
        if (!cancelled) {
          setFaq(d);
          trackFaqView(faqId, getSessionId()).catch(() => {});
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [faqId]);

  const blocks = useMemo(() => {
    if (!faq) return [];
    const b = Array.isArray(faq.blocks) ? faq.blocks : [];
    if (b.length) return b;
    const localizedBody = (lang !== "ko" && faq.body_i18n?.[lang]) || faq.body;
    return localizedBody ? [{ type: "paragraph", text: localizedBody }] : [];
  }, [faq, lang]);

  const htmlBody = useMemo(() => {
    if (!faq) return "";
    const localizedBody = (lang !== "ko" && faq.body_i18n?.[lang]) || faq.body;
    const txt = String(localizedBody || "").trim();
    if (!txt) return "";
    if (!/<\/?[a-z][\s\S]*>/i.test(txt)) return "";
    return DOMPurify.sanitize(txt, {
      USE_PROFILES: { html: true },
    });
  }, [faq, lang]);

  function isImage(a: any) {
    const ct = String(a?.content_type || "").toLowerCase();
    const name = String(a?.original_name || a?.url || "");
    return ct.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(name);
  }
  function isVideo(a: any) {
    const ct = String(a?.content_type || "").toLowerCase();
    const name = String(a?.original_name || a?.url || "");
    return ct.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(name);
  }

  return (
    <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => nav("/faq")} sx={{ fontWeight: 900 }}>
          {t("faqDetail.back")}
        </Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
          {t("faqDetail.title")}
        </Typography>
        <Box sx={{ width: 72 }} />
      </Box>

      {!faq && !error ? (
        <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : null}

      {error ? (
        <Typography color="error" sx={{ py: 2 }}>
          {error}
        </Typography>
      ) : null}

      {faq ? (
        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 900, mb: 0.5, fontSize: "1.05rem" }}>{(lang !== "ko" && faq.title_i18n?.[lang]) || faq.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              {(lang !== "ko" && faq.category?.name_i18n?.[lang]) || (faq.category?.name ?? "FAQ")} · {new Date(faq.created_at).toLocaleDateString(locale)}
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "grid", gap: 1.25 }}>
              {htmlBody ? (
                <Box
                  sx={{
                    "& img": { maxWidth: "100%", height: "auto", display: "block", margin: "8px auto" },
                    "& video": { maxWidth: "100%", display: "block", margin: "8px auto" },
                    "& p": { margin: 0, whiteSpace: "normal", lineHeight: 1.75, fontSize: "0.95rem" },
                    "& h1, & h2, & h3": { margin: "10px 0 6px", fontWeight: 900 },
                    "& ul, & ol": { paddingLeft: "1.25rem", margin: "6px 0" },
                    "& blockquote": {
                      margin: "10px 0",
                      padding: "10px 12px",
                      borderLeft: "4px solid rgba(249,115,22,0.35)",
                      background: "rgba(254,243,199,0.35)",
                      fontWeight: 700,
                    },
                    "& a": { color: "#2563EB" },
                    "& hr": { border: "none", borderTop: "1px solid rgba(15,23,42,0.10)", margin: "14px 0" },
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlBody }}
                />
              ) : null}

              {blocks.map((b: any, idx: number) => {
                if (htmlBody) return null;
                if (b.type === "paragraph")
                  return (
                    <Typography key={idx} sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.925rem" }}>
                      {b.text}
                    </Typography>
                  );
                if (b.type === "heading")
                  return (
                    <Typography key={idx} sx={{ fontWeight: 900, fontSize: "1.05rem", mt: idx === 0 ? 0 : 1 }}>
                      {b.text}
                    </Typography>
                  );
                if (b.type === "callout")
                  return (
                    <Box
                      key={idx}
                      sx={{
                        border: "1px solid rgba(249,115,22,0.25)",
                        bgcolor: "rgba(254,243,199,0.45)",
                        p: 1.25,
                        borderRadius: 1,
                      }}
                    >
                      <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.925rem", fontWeight: 900, color: "rgba(15,23,42,0.86)" }}>
                        {b.text}
                      </Typography>
                    </Box>
                  );
                if (b.type === "bullets")
                  return (
                    <Box key={idx} component="ul" sx={{ pl: 2.5, m: 0, display: "grid", gap: 0.5 }}>
                      {(Array.isArray(b.items) ? b.items : []).map((it: any, i: number) => (
                        <Typography key={i} component="li" sx={{ lineHeight: 1.6, fontSize: "0.925rem" }}>
                          {String(it)}
                        </Typography>
                      ))}
                    </Box>
                  );
                if (b.type === "numbered")
                  return (
                    <Box key={idx} component="ol" sx={{ pl: 2.5, m: 0, display: "grid", gap: 0.5 }}>
                      {(Array.isArray(b.items) ? b.items : []).map((it: any, i: number) => (
                        <Typography key={i} component="li" sx={{ lineHeight: 1.6, fontSize: "0.925rem" }}>
                          {String(it)}
                        </Typography>
                      ))}
                    </Box>
                  );
                if (b.type === "divider") return <Divider key={idx} sx={{ my: 1.5 }} />;
                if (b.type === "image")
                  return (
                    <img
                      key={idx}
                      src={b.url}
                      alt=""
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        maxHeight: "320px",
                        objectFit: "contain",
                        borderRadius: 10,
                        display: "block",
                        margin: "0 auto",
                        boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                      }}
                    />
                  );
                if (b.type === "video")
                  return <video key={idx} src={b.url} controls style={{ width: "100%", borderRadius: 10, display: "block" }} />;
                if (b.type === "file")
                  return (
                    <a key={idx} href={b.url} target="_blank" rel="noreferrer">
                      {b.name || b.url}
                    </a>
                  );
                return null;
              })}

              {faq.attachments?.length ? (
                <Box sx={{ display: "grid", gap: 1.25 }}>
                  <Divider sx={{ my: 2 }} />
                  {faq.attachments.some(isImage) ? (
                    <Box sx={{ display: "grid", gap: 1 }}>
                      {faq.attachments.filter(isImage).map((a) => (
                        <img
                          key={a.id}
                          src={a.url}
                          alt={a.original_name || ""}
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            maxHeight: "320px",
                            objectFit: "contain",
                            borderRadius: 10,
                            display: "block",
                            margin: "0 auto",
                            boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                          }}
                        />
                      ))}
                    </Box>
                  ) : null}
                  {faq.attachments.some(isVideo) ? (
                    <Box sx={{ display: "grid", gap: 1 }}>
                      {faq.attachments.filter(isVideo).map((a) => (
                        <video key={a.id} src={a.url} controls style={{ width: "100%", borderRadius: 10, display: "block" }} />
                      ))}
                    </Box>
                  ) : null}
                  {faq.attachments.filter((a) => !isImage(a) && !isVideo(a)).length ? (
                    <Box>
                      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{t("faqDetail.attachment")}</Typography>
                      <Box sx={{ display: "grid", gap: 0.75 }}>
                        {faq.attachments
                          .filter((a) => !isImage(a) && !isVideo(a))
                          .map((a) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                              {a.original_name || a.url}
                            </a>
                          ))}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
