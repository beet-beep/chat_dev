import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useMemo, useState } from "react";

import { adminGetCustomer, adminListCustomers, adminPatchCustomer } from "../../../api/support";
// AdminIconRail removed from individual page, now in AdminLayout

type Customer = {
  id: number;
  email: string;
  name: string;
  uuid: string;
  display_name: string;
  member_code: string;
  game_uuid: string;
  login_provider: string;
  avatar_url: string;
  phone_number: string;
  is_vip: boolean;
  tags: string[];
  notes: string;
  total_spend_krw: number;
  ticket_count: number;
  joined_at: string;
  last_ticket_at: string;
  last_channel: string;
  last_entry_source: string;
  device: string;
  locale: string;
  location: string;
  last_purchase_at: string;
};

export function AdminCustomersPage() {
  const PASS_KEY = "joody_admin_customers_pin_ok_v1";
  const [pinOpen, setPinOpen] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [list, setList] = useState<Customer[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [active, setActive] = useState<Customer | null>(null);
  const [busy, setBusy] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // DB page passcode gate (test): 4 digits "1234"
  useEffect(() => {
    try {
      const ok = sessionStorage.getItem(PASS_KEY) === "1";
      setPinOpen(!ok);
    } catch {
      setPinOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const data = await adminListCustomers(q.trim() || undefined);
    setList(data);
    if (!activeId && data.length) setActiveId(data[0].id);
  }

  useEffect(() => {
    if (pinOpen) return;
    refresh().catch(() => setList([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinOpen]);

  useEffect(() => {
    if (!activeId) return;
    if (pinOpen) return;
    adminGetCustomer(activeId).then(setActive).catch(() => setActive(null));
  }, [activeId, pinOpen]);

  const filtered = useMemo(() => list ?? [], [list]);

  async function onSave() {
    if (!active) return;
    setBusy(true);
    try {
      const updated = await adminPatchCustomer(active.id, {
        phone_number: active.phone_number,
        is_vip: active.is_vip,
        tags: active.tags,
        notes: active.notes,
      });
      setActive(updated);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || !active) return;
    if (active.tags.includes(t)) return;
    setActive({ ...active, tags: [...active.tags, t] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    if (!active) return;
    setActive({ ...active, tags: active.tags.filter((x) => x !== tag) });
  }

  function tryUnlock() {
    const p = pin.trim();
    if (p === "1234") {
      try {
        sessionStorage.setItem(PASS_KEY, "1");
      } catch {
        // ignore
      }
      setPin("");
      setPinError(null);
      setPinOpen(false);
      return;
    }
    setPinError("비밀번호가 올바르지 않습니다. (테스트: 1234)");
  }

  return (
    <>
      <Dialog open={pinOpen} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>고객 DB 접근</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            테스트용 비밀번호를 입력해 주세요.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="4자리 비밀번호"
            value={pin}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(next);
              setPinError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") tryUnlock();
            }}
            error={Boolean(pinError)}
            helperText={pinError || " "}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 }}
            type="password"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="contained" sx={{ fontWeight: 900 }} onClick={tryUnlock} disabled={pin.trim().length !== 4}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "360px 1fr", bgcolor: "background.default", "& .Mui-disabled": { WebkitTextFillColor: "rgba(15,23,42,0.85)", opacity: 1 } }}>
      {/* left list */}
      <Box sx={{ bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, color: "text.primary", mb: 1 }}>고객 DB</Typography>
          <TextField
            fullWidth
            placeholder="이메일/이름 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button sx={{ mt: 1.25, fontWeight: 900 }} onClick={() => refresh()}>
            검색
          </Button>
        </Box>
        <Divider />
        <List dense sx={{ overflow: "auto", height: "calc(100% - 122px)" }}>
          {list === null ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>불러오는 중…</Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>고객이 없어요.</Box>
          ) : (
            filtered.map((c) => (
              <Box key={c.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <ListItemButton
                  selected={c.id === activeId}
                  onClick={() => setActiveId(c.id)}
                  sx={{ "&.Mui-selected": { bgcolor: "rgba(37,99,235,0.08)" } }}
                >
                  <ListItemText
                    primary={<Typography sx={{ color: "text.primary", fontWeight: 900 }}>{c.name}</Typography>}
                    secondary={<Typography sx={{ color: "text.secondary" }}>{c.email}</Typography>}
                  />
                </ListItemButton>
              </Box>
            ))
          )}
        </List>
      </Box>

      {/* right editor */}
      <Box sx={{ bgcolor: "background.default", p: 2, overflow: "auto" }}>
        {!active ? (
          <Typography sx={{ color: "text.secondary" }}>좌측에서 고객을 선택하세요.</Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 2, maxWidth: 720 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  src={active.avatar_url || undefined}
                  sx={{ width: 44, height: 44, bgcolor: "rgba(15,23,42,0.06)", color: "text.primary", fontWeight: 900 }}
                >
                  {(active.display_name || active.name || active.email || "U").slice(0, 1)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, color: "text.primary" }} noWrap>
                    {active.display_name || active.name}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }} noWrap>
                    {active.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>유저 정보</Typography>
              <TextField
                label="UUID"
                value={active.uuid || "-"}
                disabled
              />
              <TextField
                label="회원 코드"
                value={active.member_code || "-"}
                disabled
              />
              <TextField
                label="누적 결제액 (KRW)"
                value={String(active.total_spend_krw ?? 0)}
                disabled
              />
              <TextField
                label="문의 횟수"
                value={String(active.ticket_count ?? 0)}
                disabled
              />
              <TextField
                label="전화번호"
                value={active.phone_number}
                onChange={(e) => setActive({ ...active, phone_number: e.target.value })}
              />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ color: "text.secondary", fontWeight: 900 }}>VIP</Typography>
                <Switch
                  checked={active.is_vip}
                  onChange={(e) => setActive({ ...active, is_vip: e.target.checked })}
                />
              </Box>
              <TextField
                label="마지막 문의"
                value={active.last_ticket_at ? new Date(active.last_ticket_at).toLocaleString("ko-KR") : "-"}
                disabled
              />
              <TextField
                label="마지막 결제"
                value={active.last_purchase_at || "-"}
                disabled
              />
              <TextField
                label="기기"
                value={active.device || "-"}
                disabled
              />
              <TextField
                label="위치/언어"
                value={`${active.location || "-"}${active.locale ? ` · ${active.locale}` : ""}`}
                disabled
              />
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>태그</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  placeholder="태그 입력 후 Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                  }}
                  sx={{
                    flex: 1,
                  }}
                />
                <Button variant="contained" sx={{ fontWeight: 900 }} onClick={addTag}>
                  추가
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {active.tags.map((t) => (
                  <Button
                    key={t}
                    size="small"
                    variant="outlined"
                    onClick={() => removeTag(t)}
                    sx={{ borderColor: "rgba(15,23,42,0.18)", color: "text.primary", fontWeight: 900 }}
                  >
                    ✕ {t}
                  </Button>
                ))}
                {active.tags.length === 0 ? (
                  <Typography sx={{ color: "text.secondary" }} variant="body2">
                    태그가 없어요.
                  </Typography>
                ) : null}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "text.secondary" }}>메모</Typography>
              <TextField
                multiline
                minRows={6}
                value={active.notes}
                onChange={(e) => setActive({ ...active, notes: e.target.value })}
              />
            </Box>

            <Button variant="contained" sx={{ fontWeight: 900 }} disabled={busy} onClick={onSave}>
              {busy ? "저장 중..." : "저장"}
            </Button>
          </Box>
        )}
      </Box>
      </Box>
    </>
  );
}


