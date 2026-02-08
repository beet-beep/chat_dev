import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  Skeleton,
  Typography,
  alpha,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Ticket } from "../api/types";
import { getMe, getTicket, markTicketSeen } from "../api/support";
import { connectTicketWS, type TicketRealtimeEvent } from "../api/realtime";
import { ChatThread, type ChatMessage } from "../ui/chat/ChatThread";
import { useChatAutoScroll } from "../ui/chat/useChatAutoScroll";
import { markSeen } from "../ui/chat/seen";
import { useT, useLocale, useLanguage } from "../i18n";
import { GradientHeader } from "../ui/GradientHeader";
import { LanguageSelector } from "../i18n/LanguageSelector";
import { StatusChip } from "../ui/StatusChip";

export function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const nav = useNavigate();
  const t = useT();
  const locale = useLocale();
  const { lang } = useLanguage();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const hasToken = Boolean(localStorage.getItem("auth_token"));
  const [staffTyping, setStaffTyping] = useState<{ name: string; at: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSeenSentAt = useRef<number>(0);

  const thread = useMemo(() => {
    if (!ticket) return [];
    const myAuthor = {
      id: me?.id ?? null,
      name: me?.profile?.display_name || me?.first_name || me?.email || t("ticketDetail.me").replace(/[()（）]/g, ""),
      avatar_url: me?.profile?.avatar_url || "",
      is_staff: false,
    };
    const items: ChatMessage[] = [];
    items.push({
      kind: "msg",
      author: myAuthor,
      body: ticket.body,
      created_at: ticket.created_at,
      attachments: ticket.attachments ?? [],
    });
    for (const r of ticket.replies ?? []) {
      const isStaff = Boolean(r.author_is_staff) || r.author_name === "운영자" || Boolean(r.author?.is_staff);
      items.push({
        kind: "msg",
        author: r.author ?? { id: null, name: r.author_name, avatar_url: "", is_staff: isStaff },
        body: r.body,
        created_at: r.created_at,
        attachments: (r as any).attachments ?? [],
      });
    }
    return items;
  }, [ticket, me]);

  const chatScroll = useChatAutoScroll(thread);

  async function sendSeenIfNeeded(reason: "mount" | "update") {
    try {
      if (!ticketId) return;
      const now = Date.now();
      if (now - lastSeenSentAt.current < 2500 && reason !== "mount") return;
      lastSeenSentAt.current = now;
      await markTicketSeen(ticketId);
    } catch {
      // ignore
    }
  }

  async function refresh(opts?: { silent?: boolean }) {
    if (!opts?.silent) {
      setError(null);
    }
    const data = await getTicket(ticketId);
    setTicket(data);
  }

  useEffect(() => {
    if (!Number.isFinite(ticketId)) {
      setError(t("ticketDetail.invalidId"));
      return;
    }
    if (!hasToken) {
      setTicket(null);
      setMe(null);
      setError(t("ticketDetail.loginRequired"));
      return;
    }
    getMe().then(setMe).catch(() => setMe(null));
    refresh().catch((e) => setError(String(e?.message ?? e)));
    sendSeenIfNeeded("mount").catch(() => {});
    let ws: WebSocket | null = null;
    let poll: number | null = null;

    const startPolling = () => {
      if (poll) return;
      poll = window.setInterval(() => refresh({ silent: true }).catch(() => {}), 5000);
    };

    try {
      ws = connectTicketWS(ticketId, "auth_token");
      wsRef.current = ws;
      if (ws) {
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as TicketRealtimeEvent;
            if (msg.type === "reply" && msg.ticket_id === ticketId && msg.reply?.id) {
              setTicket((prev) => {
                if (!prev) return prev;
                const exists = (prev.replies ?? []).some((r: any) => r.id === msg.reply.id);
                if (exists) return prev;
                return { ...prev, replies: [...(prev.replies ?? []), msg.reply] } as any;
              });
              sendSeenIfNeeded("update").catch(() => {});
            }
            if (msg.type === "typing" && msg.ticket_id === ticketId) {
              const isStaff = Boolean(msg.author?.is_staff);
              if (!isStaff) return;
              if (msg.is_typing) {
                setStaffTyping({ name: msg.author?.name || t("ticketDetail.staff"), at: Date.now() });
              } else {
                setStaffTyping(null);
              }
            }
          } catch {
            // ignore
          }
        };
        ws.onclose = () => startPolling();
        ws.onerror = () => startPolling();
      } else {
        startPolling();
      }
    } catch {
      startPolling();
    }

    return () => {
      if (ws) ws.close();
      if (wsRef.current === ws) wsRef.current = null;
      if (poll) window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, hasToken]);

  useEffect(() => {
    if (!ticket) return;
    const last = thread[thread.length - 1];
    if (last?.created_at) markSeen(ticket.id, last.created_at);
  }, [ticket?.id, thread.length]);

  const statusLabels = {
    PENDING: t("tickets.status.pending"),
    ANSWERED: t("tickets.status.answered"),
    CLOSED: t("tickets.status.closed"),
  };

  return (
    <Box sx={{ bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      <GradientHeader
        title={ticket ? `#${ticket.id}` : t("ticketDetail.title")}
        subtitle={ticket?.title || ""}
        icon={<ChatBubbleOutlineIcon />}
        backTo="/tickets"
        right={<LanguageSelector />}
      />

      <Box sx={{ px: 2.5, pt: 2, pb: 2, mt: -2 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!ticket && !error ? (
        <Card sx={{ borderRadius: 2.5, p: 3 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Skeleton variant="rounded" width={50} height={24} />
            <Skeleton variant="rounded" width={70} height={24} />
          </Box>
          <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={200} />
        </Card>
      ) : null}

      {ticket ? (
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          <Card sx={{ mb: 2, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={`#${ticket.id}`}
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: "primary.main",
                    fontWeight: 700,
                    fontSize: "0.75rem"
                  }}
                />
                <StatusChip status={ticket.status} labels={statusLabels} />
                {ticket.category?.name && (
                  <Chip
                    size="small"
                    label={(lang !== "ko" && ticket.category.name_i18n?.[lang]) || ticket.category.name}
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                      color: "#1565c0",
                      fontWeight: 600,
                      fontSize: "0.75rem"
                    }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, mb: 1, color: "#202124" }}>
                {ticket.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                {new Date(ticket.created_at).toLocaleString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          </Card>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            {thread.map((msg, idx) => {
              const isStaff = msg.author.is_staff;
              const isFirst = idx === 0;

              return (
                <Card
                  key={idx}
                  sx={{
                    borderRadius: 2.5,
                    boxShadow: isStaff
                      ? "0 2px 8px rgba(25,118,210,0.12)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    border: isStaff
                      ? "1px solid rgba(25,118,210,0.15)"
                      : "1px solid #eee",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }
                  }}
                >
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <Avatar
                        src={msg.author.avatar_url || undefined}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: isStaff ? "#1976d2" : "#9e9e9e",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          flexShrink: 0
                        }}
                      >
                        {msg.author.name?.charAt(0).toUpperCase() || "?"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#333" }}>
                            {msg.author.name}
                          </Typography>
                          {isStaff && (
                            <Chip
                              label={t("ticketDetail.staff")}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                bgcolor: "#1976d2",
                                color: "white",
                                fontWeight: 600,
                                "& .MuiChip-label": { px: 1 }
                              }}
                            />
                          )}
                          {isFirst && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              {t("ticketDetail.me")}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {new Date(msg.created_at).toLocaleString(locale, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pl: 7 }}>
                      <Typography
                        sx={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          color: "#202124",
                          wordBreak: "break-word"
                        }}
                      >
                        {msg.body}
                      </Typography>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {msg.attachments.map((att: any, attIdx: number) => {
                            const isImage = att.content_type?.startsWith("image/") ||
                              /\.(png|jpe?g|gif|webp|bmp)$/i.test(att.original_name || att.url || "");
                            const isVideo = att.content_type?.startsWith("video/") ||
                              /\.(mp4|webm|mov)$/i.test(att.original_name || att.url || "");

                            if (isImage) {
                              return (
                                <Box
                                  key={attIdx}
                                  component="a"
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    display: "block",
                                    maxWidth: 280,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    border: "1px solid #e0e0e0",
                                    transition: "transform 0.15s, box-shadow 0.15s",
                                    "&:hover": {
                                      transform: "scale(1.02)",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    },
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={att.url}
                                    alt={att.original_name || ""}
                                    sx={{
                                      width: "100%",
                                      height: "auto",
                                      maxHeight: 200,
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                  />
                                </Box>
                              );
                            }

                            if (isVideo) {
                              return (
                                <Box
                                  key={attIdx}
                                  sx={{
                                    maxWidth: 320,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    border: "1px solid #e0e0e0",
                                  }}
                                >
                                  <Box
                                    component="video"
                                    src={att.url}
                                    controls
                                    sx={{
                                      width: "100%",
                                      maxHeight: 240,
                                      display: "block",
                                    }}
                                  />
                                </Box>
                              );
                            }

                            return (
                              <Box
                                key={attIdx}
                                component="a"
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  px: 1.5,
                                  py: 1,
                                  borderRadius: 1.5,
                                  bgcolor: "#f5f5f5",
                                  border: "1px solid #e0e0e0",
                                  textDecoration: "none",
                                  color: "#1976d2",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  transition: "background 0.15s",
                                  "&:hover": { bgcolor: "#eeeeee" },
                                }}
                              >
                                {att.original_name || t("ticketDetail.attachment")}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>

          {staffTyping && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {t("ticketDetail.typing", { name: staffTyping.name })}
              </Typography>
            </Box>
          )}
        </Box>
      ) : null}
      </Box>
    </Box>
  );
}
