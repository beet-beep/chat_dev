import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";

type ChatAuthor = {
  id?: number | null;
  name: string;
  avatar_url?: string;
  is_staff?: boolean;
};

export type ChatMessage = {
  id?: string | number;
  kind?: "msg" | "note" | "system";
  author: ChatAuthor;
  body: string;
  created_at: string;
  attachments?: { id?: number; url: string; original_name?: string; content_type?: string }[];
  delivery?: "sending" | "failed";
  read_by_other?: boolean; // admin-only: "고객이 운영자 메시지를 읽음" 표시
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDay(d: Date) {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(d: Date) {
  return d.toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function minutesBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

export function ChatThread(props: {
  messages: ChatMessage[];
  mySide: "user" | "staff"; // which author type should be right-aligned
  dense?: boolean;
  tone?: "light" | "dark";
  showMyProfile?: boolean; // show avatar/name on my messages too (channel-talk like)
  variant?: "bubble" | "boxed" | "console"; // boxed = ticket history style, console = admin channel-talk style
}) {
  const { messages, mySide, dense, tone = "light", showMyProfile = false, variant = "bubble" } = props;
  const [viewer, setViewer] = useState<null | { url: string; kind: "image" | "video" | "file"; name: string }>(null);

  const normalized = useMemo(() => {
    const list = [...(messages ?? [])].filter(Boolean);
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return list;
  }, [messages]);

  const pad = dense ? 1 : 1.25;
  const colors =
    tone === "dark"
      ? {
          text: "rgba(255,255,255,0.90)",
          secondary: "rgba(255,255,255,0.60)",
          border: "rgba(255,255,255,0.10)",
          bubbleMine: "rgba(79,125,255,0.18)",
          bubbleOther: "rgba(255,255,255,0.06)",
          bubbleNote: "rgba(148,163,184,0.12)",
          day: "rgba(255,255,255,0.55)",
          // console: "카드 테두리 없이 배경 톤으로 구분" (ChannelTalk-like)
          // - other(회원): blue tint
          // - mine(상담원): neutral tint
          consoleBg: "rgba(64,116,137,0.55)", // user messages (teal, screenshot-like)
          consoleMineBg: "rgba(0,0,0,0.20)", // staff messages (dark)
          consoleBarUser: "rgba(180,230,255,0.90)",
          consoleBarStaff: "rgba(255,255,255,0.18)",
        }
      : {
          text: "rgba(17,24,39,0.90)",
          secondary: "rgba(17,24,39,0.60)",
          border: "rgba(17,24,39,0.10)",
          bubbleMine: "rgba(79,125,255,0.14)",
          bubbleOther: "rgba(17,24,39,0.06)",
          bubbleNote: "rgba(148,163,184,0.14)",
          day: "rgba(17,24,39,0.55)",
          consoleBg: "rgba(17,24,39,0.04)",
          consoleMineBg: "rgba(17,24,39,0.05)",
          consoleBarUser: "rgba(79,125,255,0.75)",
          consoleBarStaff: "rgba(17,24,39,0.20)",
        };

  const isBoxed = variant === "boxed";
  const isConsole = variant === "console";
  const canDownload = isConsole; // admin only

  function renderAttachmentsLocal(attachments?: ChatMessage["attachments"], isMineMsg?: boolean) {
    if (!attachments?.length) return null;
    const thumbMaxH = isConsole ? 200 : isBoxed ? 200 : 180;
    const thumbMaxW = isConsole ? 280 : isBoxed ? 360 : 300;

    const imageExt = /\.(png|jpe?g|gif|webp|bmp|avif)$/i;
    const videoExt = /\.(mp4|webm|mov|m4v)$/i;
    function isImage(a: any) {
      const url = String(a?.url || "");
      const ct = String(a?.content_type || "").toLowerCase();
      const name = String(a?.original_name || "");
      if (!url) return false;
      if (ct.startsWith("image/")) return true;
      if (!ct && (imageExt.test(url) || imageExt.test(name))) return true;
      // NOTE: attachment URLs are opaque UUIDs without extension; rely on original_name when ct missing.
      return false;
    }
    function isVideo(a: any) {
      const url = String(a?.url || "");
      const ct = String(a?.content_type || "").toLowerCase();
      const name = String(a?.original_name || "");
      if (!url) return false;
      if (ct.startsWith("video/")) return true;
      if (!ct && (videoExt.test(url) || videoExt.test(name))) return true;
      return false;
    }

    const imgs = attachments.filter((a) => isImage(a));
    const others = attachments.filter((a) => !isImage(a));

    return (
      <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75, alignItems: isMineMsg ? "flex-end" : "flex-start" }}>
        {isConsole && imgs.length ? (
          <Box sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            justifyContent: isMineMsg ? "flex-end" : "flex-start",
            maxWidth: imgs.length === 1 ? thumbMaxW : "100%",
          }}>
            {imgs.map((a, idx) => {
              const url = String(a.url || "");
              const name = a.original_name || url.split("/").pop() || "attachment";
              const singleImage = imgs.length === 1;
              return (
                <Box
                  key={a.id ?? `${url}-${idx}`}
                  onClick={() => setViewer({ url, kind: "image", name })}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "rgba(0,0,0,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    width: singleImage ? "100%" : 120,
                    maxWidth: singleImage ? thumbMaxW : 120,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={url}
                    alt={name}
                    sx={{
                      width: "100%",
                      height: singleImage ? "auto" : 90,
                      display: "block",
                      maxHeight: singleImage ? thumbMaxH : 90,
                      objectFit: "cover",
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        ) : null}

        {others.map((a, idx) => {
          const url = String(a.url || "");
          const ct = String(a.content_type || "");
          const name = a.original_name || url.split("/").pop() || "attachment";
          if (!url) return null;

          if (isImage(a)) {
            return (
              <Box key={a.id ?? `${url}-${idx}`} sx={{ maxWidth: thumbMaxW }}>
                <Box
                  component="img"
                  src={url}
                  alt={name}
                  onClick={() => setViewer({ url, kind: "image", name })}
                  sx={{
                    cursor: "pointer",
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: thumbMaxH,
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "transform 0.15s",
                    "&:hover": { transform: "scale(1.02)" },
                  }}
                />
              </Box>
            );
          }

          if (isVideo(a)) {
            return (
              <Box key={a.id ?? `${url}-${idx}`} sx={{ maxWidth: thumbMaxW }}>
                <Box
                  component="video"
                  src={url}
                  controls
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    maxHeight: thumbMaxH + 40,
                    display: "block",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </Box>
            );
          }

          return (
            <Box
              key={a.id ?? `${url}-${idx}`}
              component="a"
              href={canDownload ? `${url}${url.includes("?") ? "&" : "?"}download=1` : url}
              {...(canDownload ? {} : { target: "_blank", rel: "noreferrer" })}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.06)",
                border: "1px solid",
                borderColor: tone === "dark" ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.1)",
                textDecoration: "none",
                color: tone === "dark" ? "rgba(255,255,255,0.85)" : "rgba(17,24,39,0.85)",
                fontSize: "0.8rem",
                fontWeight: 600,
                maxWidth: "100%",
                overflow: "hidden",
                transition: "background 0.15s",
                "&:hover": {
                  bgcolor: tone === "dark" ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.1)",
                },
              }}
            >
              <span style={{ fontSize: "1rem" }}>📎</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </Box>
          );
        })}
      </Box>
    );
  }

  function renderConsoleBody(text: string) {
    const raw = String(text || "");
    const chunks = raw.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
    if (chunks.length <= 1) {
      return (
        <Typography variant="body2" sx={{ lineHeight: 1.75, pl: 0.75 }}>
          <span style={{ color: colors.text, fontSize: 15, lineHeight: "1.8", fontFamily: "inherit" }}>{raw}</span>
        </Typography>
      );
    }
    return (
      <Box sx={{ pl: 0.75, display: "grid", gap: 1 }}>
        {chunks.map((c, i) => (
          <Typography key={i} variant="body2" sx={{ lineHeight: 1.75 }}>
            <span style={{ color: colors.text, fontSize: 15, lineHeight: "1.8", fontFamily: "inherit" }}>{c}</span>
          </Typography>
        ))}
      </Box>
    );
  }

  function renderConsoleBodyWithColor(text: string, textColor: string) {
    const raw = String(text || "");
    const chunks = raw.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean);
    if (chunks.length <= 1) {
      return (
        <Typography variant="body2" sx={{ lineHeight: 1.75, pl: 0.75 }}>
          <span style={{ color: textColor, fontSize: 15, lineHeight: "1.8", fontFamily: "inherit" }}>{raw}</span>
        </Typography>
      );
    }
    return (
      <Box sx={{ pl: 0.75, display: "grid", gap: 1 }}>
        {chunks.map((c, i) => (
          <Typography key={i} variant="body2" sx={{ lineHeight: 1.75 }}>
            <span style={{ color: textColor, fontSize: 15, lineHeight: "1.8", fontFamily: "inherit" }}>{c}</span>
          </Typography>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {normalized.map((m, idx) => {
        const kind = m.kind ?? "msg";
        const d = new Date(m.created_at);
        const prev = normalized[idx - 1];
        const prevD = prev ? new Date(prev.created_at) : null;
        const showDay = !prevD || !isSameDay(prevD, d);

        const isStaff = Boolean(m.author?.is_staff);
        const isMine = mySide === (isStaff ? "staff" : "user");
        const align =
          kind === "note" || kind === "system"
            ? "center"
            : isMine
            ? "flex-end"
            : "flex-start";

        const isGrouped =
          !showDay &&
          prev &&
          (prev.kind ?? "msg") === "msg" &&
          kind === "msg" &&
          Boolean(prev.author?.is_staff) === isStaff &&
          String(prev.author?.name ?? "") === String(m.author?.name ?? "") &&
          minutesBetween(prevD!, d) <= 3;

        const canShowProfile =
          !(kind === "note" || kind === "system") && !isGrouped && (!isMine || showMyProfile || isBoxed || isConsole);
        const showAvatar = canShowProfile;
        const showName = canShowProfile;

        const bubbleBg =
          kind === "note"
            ? colors.bubbleNote
            : isConsole
            ? "transparent"
            : isMine
            ? colors.bubbleMine
            : colors.bubbleOther;
        const consoleBar = isMine ? colors.consoleBarStaff : colors.consoleBarUser;
        const hasMedia = Boolean(
          (m.attachments ?? []).some(
            (a: any) =>
              String(a?.content_type || "").startsWith("image/") || String(a?.content_type || "").startsWith("video/")
          )
        );
        const bodyRaw = typeof (m as any)?.body === "string" ? ((m as any).body as string) : String((m as any)?.body ?? "");
        // normalize newlines + strip zero-width chars that can make text "invisible"
        const bodyText = bodyRaw.replace(/\r\n/g, "\n").replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "");
        const hasText = Boolean(bodyText.trim());

        // Boxed = "문의 내역" 카드형 타임라인 (레퍼런스 스타일)
        if (isBoxed && kind === "msg") {
          const title = isMine ? "내 문의" : (m.author?.name || (isStaff ? "상담사" : "사용자"));
          const hasAny = hasText || Boolean((m.attachments ?? []).length);
          return (
            <React.Fragment key={m.id ?? idx}>
              {showDay ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colors.day, fontWeight: 900 }}>
                    {formatDay(d)}
                  </Typography>
                </Box>
              ) : null}

              <Box
                sx={{
                  border: `1px solid rgba(15,23,42,0.10)`,
                  borderRadius: 3,
                  overflow: "hidden",
                  // stronger, screenshot-like distinction (mine=blue tint / staff=purple tint)
                  bgcolor: isMine ? "rgba(37,99,235,0.10)" : "rgba(124,58,237,0.08)",
                }}
              >
                <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: "rgba(15,23,42,0.92) !important",
                      WebkitTextFillColor: "rgba(15,23,42,0.92)",
                    }}
                    noWrap
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(15,23,42,0.58) !important",
                      WebkitTextFillColor: "rgba(15,23,42,0.58)",
                      fontWeight: 900,
                    }}
                    noWrap
                  >
                    {formatDateTime(d)}
                  </Typography>
                </Box>
                <Box sx={{ height: 1, bgcolor: "rgba(15,23,42,0.10)" }} />
                <Box sx={{ px: 2, py: hasAny ? 1.5 : 1, display: "grid", gap: 1.25 }}>
                  <div
                    style={{
                      border: "1px solid rgba(15,23,42,0.18)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: 8,
                      padding: "10px 12px",
                      position: "relative",
                      zIndex: 1,
                      boxShadow: "0 1px 0 rgba(15,23,42,0.06)",
                      color: "#111111",
                      WebkitTextFillColor: "#111111",
                      fontSize: "15.5px",
                      fontWeight: 700,
                      lineHeight: "1.75",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      opacity: 1,
                    }}
                  >
                    {hasText ? bodyText : "내용 없음"}
                  </div>
                  {renderAttachmentsLocal(m.attachments, isMine)}
                </Box>
              </Box>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={m.id ?? idx}>
            {showDay ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                <Typography variant="caption" sx={{ color: colors.day, fontWeight: 900 }}>
                  {formatDay(d)}
                </Typography>
              </Box>
            ) : null}

            {isConsole && (kind === "system" || kind === "note") ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.secondary,
                    fontWeight: 800,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    border: `1px solid ${colors.border}`,
                    bgcolor: "rgba(255,255,255,0.04)",
                  }}
                >
                  {m.body}
                </Typography>
              </Box>
            ) : (
            <Box sx={{ display: "flex", justifyContent: align, mb: isGrouped ? 0.5 : 1.25, px: isConsole ? 0 : 0 }}>
              <Box sx={{
                display: "flex",
                gap: isConsole ? 1.25 : 1.5,
                maxWidth: isConsole ? "90%" : "85%",
                flexDirection: isMine ? "row-reverse" : "row",
                alignItems: "flex-start"
              }}>
                {/* avatar */}
                {showAvatar ? (
                  <Avatar
                    src={m.author?.avatar_url || undefined}
                    sx={{
                      width: isConsole ? 47 : 32,
                      height: isConsole ? 47 : 32,
                      bgcolor: tone === "dark" ? "rgba(255,255,255,0.14)" : "rgba(17,24,39,0.18)",
                      fontWeight: 800,
                      fontSize: isConsole ? "0.9rem" : "0.8rem",
                      flex: "0 0 auto",
                    }}
                  >
                    {(m.author?.name || "?").slice(0, 1)}
                  </Avatar>
                ) : (
                  <Box sx={{ width: isConsole ? 47 : 32, flex: "0 0 auto" }} />
                )}

                <Box sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                  minWidth: 0,
                  maxWidth: "100%",
                }}>
                  {showName ? (
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      mb: 0.5,
                      flexDirection: isMine ? "row-reverse" : "row"
                    }}>
                      <Typography sx={{ color: colors.text, fontWeight: 700, fontSize: "0.85rem" }}>
                        {m.author?.name}
                      </Typography>
                      {isStaff && (
                        <Typography
                          sx={{
                            color: "#3B82F6",
                            bgcolor: "rgba(59,130,246,0.12)",
                            px: 0.75,
                            py: 0.2,
                            borderRadius: 0.75,
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        >
                          상담원
                        </Typography>
                      )}
                      <Typography sx={{ color: colors.secondary, fontSize: "0.75rem" }}>
                        {formatTime(d)}
                      </Typography>
                    </Box>
                  ) : null}

                  {isConsole ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "100%" }}>
                      {hasText && (
                        <Box
                          sx={{
                            bgcolor:
                              tone === "dark"
                                ? isMine
                                  ? "rgba(59,130,246,0.25)"
                                  : "rgba(255,255,255,0.08)"
                                : isMine
                                ? "#2563EB"
                                : "#F1F5F9",
                            px: 1.5,
                            py: 1,
                            borderRadius: isMine ? "12px 3px 12px 12px" : "3px 12px 12px 12px",
                            maxWidth: "100%",
                          }}
                        >
                          <Typography
                            sx={{
                              color: tone === "dark"
                                ? "#FFFFFF"
                                : isMine
                                ? "#FFFFFF"
                                : "#1E293B",
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                              fontWeight: 500,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {bodyText}
                          </Typography>
                        </Box>
                      )}
                      {renderAttachmentsLocal(m.attachments, isMine)}
                      {(m.delivery || (m.read_by_other && isMine)) && (
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          {m.delivery === "sending" && (
                            <Typography sx={{ color: colors.secondary, fontSize: "0.7rem" }}>전송중…</Typography>
                          )}
                          {m.delivery === "failed" && (
                            <Typography sx={{ color: "#DC2626", fontSize: "0.7rem" }}>전송 실패</Typography>
                          )}
                          {m.read_by_other && isMine && (
                            <Typography sx={{ color: "#3B82F6", fontWeight: 700, fontSize: "0.7rem" }}>읽음</Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: `1px solid ${colors.border}`,
                        bgcolor: bubbleBg,
                        borderRadius: 2,
                        p: pad,
                        maxWidth: "100%",
                      }}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        <span style={{ color: colors.text }}>{bodyText}</span>
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
            )}
          </React.Fragment>
        );
      })}

                  <Dialog
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
        fullWidth
        maxWidth="md"
                    PaperProps={{ sx: { borderRadius: 0 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>{viewer?.name || "첨부 보기"}</DialogTitle>
        <DialogContent dividers sx={{ display: "grid", placeItems: "center" }}>
          {viewer?.kind === "image" ? (
            <Box
              component="img"
              src={viewer.url}
              alt={viewer.name}
              sx={{ maxWidth: "100%", maxHeight: "80dvh", objectFit: "contain", display: "block" }}
            />
          ) : viewer?.kind === "video" ? (
            <Box
              component="video"
              src={viewer.url}
              controls
              sx={{ maxWidth: "100%", maxHeight: "80dvh", display: "block" }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          {viewer && canDownload ? (
            <Button component="a" href={viewer.url} download={viewer.name} sx={{ fontWeight: 900 }}>
              다운로드
            </Button>
          ) : null}
          {viewer ? (
            <Button component="a" href={viewer.url} target="_blank" rel="noreferrer" sx={{ fontWeight: 900 }}>
              새 창
            </Button>
          ) : null}
          <Button onClick={() => setViewer(null)} sx={{ fontWeight: 900 }}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


