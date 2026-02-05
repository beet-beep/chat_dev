import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { adminListTickets, adminSetTicketStatus, adminStaffReply, login } from "../api/support";

type AdminTicket = {
  id: number;
  title: string;
  body: string;
  status: "PENDING" | "ANSWERED" | "CLOSED";
  status_label: string;
  created_at: string;
  category: { id: number; name: string; order: number } | null;
  replies: { id: number; body: string; author_name: string; created_at: string }[];
  user_email: string;
  user_name: string;
};

function statusColor(status: AdminTicket["status"]) {
  if (status === "ANSWERED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "default" as const;
}

export function AdminPage() {
  const [data, setData] = useState<AdminTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useMemo(() => data?.find((t) => t.id === activeId) ?? null, [data, activeId]);

  async function ensureAdminToken() {
    if (localStorage.getItem("auth_token")) return;
    const res = await login({ email: "admin@joody.local", password: "password1234" });
    localStorage.setItem("auth_token", res.token);
  }

  async function refresh() {
    setError(null);
    setSuccess(null);
    setData(null);
    await ensureAdminToken();
    const res = await adminListTickets();
    setData(res.results as AdminTicket[]);
    if (!activeId && res.results.length) setActiveId(res.results[0].id);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSetStatus(next: AdminTicket["status"]) {
    if (!active) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await adminSetTicketStatus(active.id, next);
      setSuccess("상태가 변경됐어요.");
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onReply() {
    if (!active) return;
    if (!replyBody.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await adminStaffReply(active.id, { body: replyBody.trim() });
      setReplyBody("");
      setSuccess("운영자 답변이 등록됐어요.");
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ px: 2.5, pt: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 900, textAlign: "center", mb: 2 }}>
        관리자 · 문의 관리
      </Typography>

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!data ? (
        <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 900 }}>티켓 선택</Typography>
              <Button onClick={() => refresh()} disabled={busy} sx={{ fontWeight: 900 }}>
                새로고침
              </Button>
            </CardContent>
            <Divider />
            {data.slice(0, 20).map((t) => (
              <Box key={t.id}>
                <CardActionArea onClick={() => setActiveId(t.id)}>
                  <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip size="small" label={`#${t.id}`} variant="outlined" />
                    <Chip size="small" label={t.status_label} color={statusColor(t.status)} variant="outlined" />
                    <Typography sx={{ fontWeight: 900, flex: 1 }} noWrap>
                      {t.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <Divider />
              </Box>
            ))}
          </Card>

          {active ? (
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>
                      #{active.id} · {active.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {active.user_name} · {active.user_email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(active.created_at).toLocaleString("ko-KR")}
                    </Typography>
                  </Box>
                  <TextField
                    select
                    size="small"
                    value={active.status}
                    disabled={busy}
                    onChange={(e) => onSetStatus(e.target.value as AdminTicket["status"])}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="PENDING">대기중</MenuItem>
                    <MenuItem value="ANSWERED">답변완료</MenuItem>
                    <MenuItem value="CLOSED">종료</MenuItem>
                  </TextField>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ whiteSpace: "pre-wrap" }}>{active.body}</Typography>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: 900, mb: 1 }}>답변</Typography>
                {active.replies.length === 0 ? (
                  <Typography color="text.secondary">아직 답변이 없어요.</Typography>
                ) : (
                  active.replies.map((r) => (
                    <Box key={r.id} sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {r.author_name} · {new Date(r.created_at).toLocaleString("ko-KR")}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{r.body}</Typography>
                    </Box>
                  ))
                )}

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: 900, mb: 1 }}>운영자 답변 등록</Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="고객에게 보낼 답변을 작성하세요"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 1.5, fontWeight: 900 }}
                  disabled={busy || !replyBody.trim()}
                  onClick={onReply}
                >
                  답변 등록
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </Box>
      )}
    </Box>
  );
}







