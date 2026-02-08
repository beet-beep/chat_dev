import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  TextField,
  Button,
  Pagination,
  Typography,
  alpha,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTickets } from "../api/support";
import type { Ticket } from "../api/types";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import { useT, useLocale, useLanguage } from "../i18n";
import { GradientHeader } from "../ui/GradientHeader";
import { LanguageSelector } from "../i18n/LanguageSelector";
import { StatusChip, CategoryChip } from "../ui/StatusChip";
import { EmptyState } from "../ui/EmptyState";

export function TicketsPage() {
  const nav = useNavigate();
  const t = useT();
  const locale = useLocale();
  const { lang } = useLanguage();
  const [data, setData] = useState<{ count: number; results: Ticket[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finder, setFinder] = useState("");
  const [finderMsg, setFinderMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const hasToken = Boolean(localStorage.getItem("auth_token"));

  const statusLabels = {
    PENDING: t("tickets.status.pending"),
    ANSWERED: t("tickets.status.answered"),
    CLOSED: t("tickets.status.closed"),
  };

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setData(null);
    if (!hasToken) {
      setError(t("tickets.loginRequired"));
      return () => {
        cancelled = true;
      };
    }
    listTickets({ page, page_size: 10 })
      .then((res) => {
        if (cancelled) return;
        setData({ count: res.count, results: res.results });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [page, hasToken]);

  return (
    <Box>
      <GradientHeader
        title={t("tickets.header")}
        subtitle={t("tickets.count", { count: data ? String(data.count) : "-" }).replace(/<[^>]*>/g, "")}
        icon={<InboxOutlinedIcon />}
        right={<LanguageSelector />}
      />

      <Box sx={{ px: 2.5, pt: 2, pb: 2, mt: -2 }}>

      <Card
        sx={{
          mb: 3,
          p: 0.5,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, p: 1.5 }}>
          <TextField
            fullWidth
            placeholder={t("tickets.finder.placeholder")}
            value={finder}
            onChange={(e) => setFinder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (document.getElementById("ticket-finder-btn") as HTMLButtonElement | null)?.click();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", opacity: 0.5 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: (theme) => alpha(theme.palette.text.primary, 0.03),
                "& fieldset": { border: "none" },
              },
            }}
          />
          <Button
            id="ticket-finder-btn"
            variant="contained"
            sx={{
              fontWeight: 700,
              minWidth: 72,
              px: 2.5,
              boxShadow: "0 2px 8px rgba(249,115,22,0.25)",
            }}
            onClick={() => {
              const raw = finder.trim();
              const n = Number(raw.replace("#", ""));
              if (!Number.isFinite(n) || n <= 0) {
                setFinderMsg(t("tickets.finder.error"));
                return;
              }
              setFinderMsg(null);
              nav(`/tickets/${n}`);
            }}
          >
            {t("tickets.finder.btn")}
          </Button>
        </Box>
        {finderMsg ? (
          <Typography variant="caption" sx={{ color: "warning.dark", display: "block", px: 2, pb: 1.5 }}>
            {finderMsg}
          </Typography>
        ) : null}
      </Card>

      {!data && !error ? (
        <Card>
          {[1, 2, 3].map((i) => (
            <Box key={i}>
              {i > 1 && <Divider />}
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <Skeleton variant="rounded" width={50} height={24} />
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
              </CardContent>
            </Box>
          ))}
        </Card>
      ) : null}

      {error ? (
        <Card
          sx={{
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
            border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error" sx={{ fontWeight: 500 }}>
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {data?.results.length === 0 ? (
        <EmptyState
          icon={<InboxOutlinedIcon />}
          title={t("tickets.empty")}
          description={t("tickets.emptyDesc") || undefined}
          action={t("tickets.emptyAction")}
          onAction={() => nav("/new")}
        />
      ) : null}

      {data?.results && data.results.length > 0 ? (
        <Card sx={{ borderRadius: 2.5, overflow: "hidden" }}>
          {data.results.map((tk, idx) => (
            <Box
              key={tk.id}
              id={`ticket-${tk.id}`}
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
                onClick={() => nav(`/tickets/${tk.id}`)}
                sx={{
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1 }}>
                        <Chip
                          size="small"
                          label={`#${tk.id}`}
                          sx={{
                            fontWeight: 700,
                            height: 24,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                          }}
                        />
                        <StatusChip status={tk.status} labels={statusLabels} />
                        <Chip
                          size="small"
                          label={(lang !== "ko" && tk.category?.name_i18n?.[lang]) || (tk.category?.name ?? t("nav.new"))}
                          sx={{
                            height: 24,
                            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                          }}
                        />
                      </Box>

                      <Typography sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.9375rem" }} noWrap>
                        {tk.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          overflow: "hidden",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {tk.body}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.6 }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(tk.created_at).toLocaleString(locale)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.6 }} />
                          <Typography variant="caption" color="text.secondary">
                            {t("tickets.replies", { count: tk.replies?.length ?? 0 })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <ChevronRightIcon sx={{ color: "text.secondary", opacity: 0.4, mt: 0.5 }} />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Box>
          ))}
        </Card>
      ) : null}

      {data && data.count > 10 ? (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.max(1, Math.ceil(data.count / 10))}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: 600,
              },
            }}
          />
        </Box>
      ) : null}
      </Box>
    </Box>
  );
}
