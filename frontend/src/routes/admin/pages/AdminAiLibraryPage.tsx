import { Box, Button, Divider, List, ListItemButton, ListItemText, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { adminCreateAiLibraryItem, adminDeleteAiLibraryItem, adminListAiLibrary, type AiLibraryItem } from "../../../api/support";
// AdminIconRail removed from individual page, now in AdminLayout

export function AdminAiLibraryPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AiLibraryItem[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [active, setActive] = useState<AiLibraryItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await adminListAiLibrary(q.trim() || undefined);
    setItems(data);
    if (!activeId && data.length) setActiveId(data[0].id);
  }

  useEffect(() => {
    refresh().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const it = (items ?? []).find((x) => x.id === activeId) ?? null;
    setActive(it);
  }, [items, activeId]);

  const filtered = useMemo(() => items ?? [], [items]);

  async function onDelete() {
    if (!active) return;
    if (!window.confirm("삭제할까요?")) return;
    setBusy(true);
    try {
      await adminDeleteAiLibraryItem(active.id);
      await refresh();
      setActiveId(null);
      setActive(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "360px 1fr", bgcolor: "background.default" }}>
      {/* left list */}
      <Box sx={{ bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, color: "text.primary", mb: 1 }}>AI 학습 라이브러리</Typography>
          <TextField
            fullWidth
            placeholder="제목/내용 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
          />
          <Button sx={{ mt: 1.25, fontWeight: 900 }} onClick={() => refresh()}>
            검색
          </Button>
        </Box>
        <Divider />
        <List dense sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
          {items === null ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>불러오는 중…</Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>저장된 학습 데이터가 없어요.</Box>
          ) : (
            filtered.map((r) => (
              <Box key={r.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <ListItemButton selected={r.id === activeId} onClick={() => setActiveId(r.id)} sx={{ "&.Mui-selected": { bgcolor: "rgba(37,99,235,0.08)" } }}>
                  <ListItemText
                    primary={<Typography sx={{ color: "text.primary", fontWeight: 900 }} noWrap>{r.title || `#${r.id}`}</Typography>}
                    secondary={
                      <Typography sx={{ color: "text.secondary" }} noWrap>
                        {r.created_by_name} · {new Date(r.created_at).toLocaleDateString("ko-KR")}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </Box>
            ))
          )}
        </List>
      </Box>

      {/* right detail */}
      <Box sx={{ bgcolor: "background.default", p: 2, overflow: "auto" }}>
        {!active ? (
          <Typography sx={{ color: "text.secondary" }}>좌측에서 항목을 선택하세요.</Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 2, maxWidth: 880 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "text.primary" }}>{active.title || `학습 데이터 #${active.id}`}</Typography>
              <Typography sx={{ color: "text.secondary", fontWeight: 900 }} variant="body2">
                작성자: {active.created_by_name} · 생성: {new Date(active.created_at).toLocaleString("ko-KR")}
              </Typography>
              {active.ticket ? (
                <Typography sx={{ color: "text.secondary" }} variant="body2">
                  연결 티켓: #{active.ticket}
                </Typography>
              ) : null}
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 900, color: "text.secondary", mb: 0.75 }}>컨텍스트</Typography>
              <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 1.25 }}>
                <Typography sx={{ color: "text.primary", whiteSpace: "pre-wrap" }} variant="body2">
                  {active.context || "-"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 900, color: "text.secondary", mb: 0.75 }}>AI 생성 답변</Typography>
              <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 1.25 }}>
                <Typography sx={{ color: "text.primary", whiteSpace: "pre-wrap" }} variant="body2">
                  {active.generated_reply || "-"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 900, color: "text.secondary", mb: 0.75 }}>최종 답변(상담사)</Typography>
              <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 1.25 }}>
                <Typography sx={{ color: "text.primary", whiteSpace: "pre-wrap" }} variant="body2">
                  {active.final_reply || "-"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" color="error" sx={{ fontWeight: 900 }} disabled={busy} onClick={onDelete}>
                삭제
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}


