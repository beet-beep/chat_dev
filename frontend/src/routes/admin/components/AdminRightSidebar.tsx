import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useMemo, useState } from "react";

async function copyToClipboard(text: string) {
  if (!text || text === "-") return;
  try {
    // navigator.clipboard.writeText sometimes fails in insecure contexts
    // provide a robust fallback or at least clear check
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert("복사되었습니다.");
    } else {
      // Fallback for older browsers or non-secure contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert("복사되었습니다.");
    }
  } catch (err) {
    console.error("Copy failed", err);
  }
}

function translateLocation(loc: string) {
  const l = String(loc || "").trim().toLowerCase();
  if (!l || l === "-") return "-";
  if (l.includes("kr") || l.includes("korea")) return "대한민국";
  if (l.includes("us") || l.includes("united states")) return "미국";
  if (l.includes("jp") || l.includes("japan")) return "일본";
  if (l.includes("cn") || l.includes("china")) return "중국";
  return loc;
}

function parseTags(input: any): string[] {
  if (Array.isArray(input)) return input.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof input === "string")
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function timeAgo(iso?: string) {
  try {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const m = Math.max(0, Math.floor(diff / 60000));
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  } catch {
    return "";
  }
}

function Row(props: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  onCopy?: string;
}) {
  const { icon, label, value, right, onClick, onCopy } = props;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "24px 72px 1fr auto",
        alignItems: "center",
        gap: 1,
        py: 0.6,
        px: 0.75,
        borderRadius: 1,
        "&:hover": onClick || onCopy ? { bgcolor: "rgba(255,255,255,0.05)" } : undefined,
      }}
    >
      <Box sx={{ color: "#94A3B8", display: "grid", placeItems: "center", fontSize: "1rem" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: "#94A3B8", fontSize: "0.78rem" }} noWrap>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {value ? (
          typeof value === "string" || typeof value === "number" ? (
            <Typography sx={{ color: "#F1F5F9", fontWeight: 600, fontSize: "0.85rem" }} noWrap>
              {value}
            </Typography>
          ) : (
            value
          )
        ) : (
          <Typography sx={{ color: "#64748B", fontSize: "0.85rem" }}>-</Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {onCopy && onCopy !== "-" && (
          <IconButton size="small" onClick={() => copyToClipboard(onCopy)} sx={{ color: "#94A3B8", p: 0.25, "&:hover": { color: "#E2E8F0" } }}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {right}
      </Box>
    </Box>
  );
}

function CardSection(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  const { title, right, children } = props;
  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        bgcolor: "#0F172A",
        borderRadius: 2,
        overflow: "hidden",
        mb: 1.5,
      }}
    >
      <Box sx={{ px: 1.5, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#1E293B" }}>
        <Typography sx={{ fontWeight: 700, color: "#E2E8F0", fontSize: "0.85rem", letterSpacing: "-0.01em" }}>{title}</Typography>
        {right}
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );
}

export function AdminRightSidebar(props: {
  active: any | null;
  busy: boolean;
  adminUserId: number | null;
  agents: { id: number; email: string; name: string }[];
  customer: null | {
    id: number;
    email: string;
    name: string;
    uuid: string;
    phone_number: string;
    is_vip: boolean;
    tags: string[];
    notes: string;
    total_spend_krw: number;
    ticket_count: number;
    joined_at: string;
  };
  customerDraft: { tagsText: string; notes: string };
  setCustomerDraft: (next: { tagsText: string; notes: string }) => void;
  onSaveCustomer: () => void;
  notes: any[] | null;
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  onAddNote: () => void;
  metaDraft: { priority: string; channel: string; team: string; tagsText: string };
  setMetaDraft: (next: { priority: string; channel: string; team: string; tagsText: string }) => void;
  onSaveMeta: () => void;
  onSetStatus: (s: "PENDING" | "ANSWERED" | "CLOSED") => void;
  onAssign: (assigneeId: number | null) => void;
  onQuickMeta?: (input: Partial<{ priority: string; channel: string; team: string; tags: string[] }>) => void;
  presetTags: { id: number; name: string; color: string; is_active: boolean }[];
  presetChannels: { id: number; key: string; label: string; is_active: boolean }[];
  presetTeams: { id: number; key: string; label: string; is_active: boolean }[];
  userHistory: any[];
  onSelectTicket?: (id: number) => void;
}) {
  const {
    active,
    busy,
    adminUserId,
    agents,
    customer,
    customerDraft,
    setCustomerDraft,
    onSaveCustomer,
    notes,
    noteDraft,
    setNoteDraft,
    onAddNote,
    metaDraft,
    setMetaDraft,
    onSaveMeta,
    onSetStatus,
    onAssign,
    onQuickMeta,
    presetTags,
    presetChannels,
    presetTeams,
    userHistory,
    onSelectTicket,
  } = props;

  const [more, setMore] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);

  const gameNick = String(active?.user_name || customer?.name || "-");
  const accountEmail = String(customer?.email || active?.user_email || "-");
  const uuid = String(customer?.uuid || active?.user_uuid || active?.user_id || "-");
  const displayPhone = String(customer?.phone_number || "-");
  const totalSpend = Number(customer?.total_spend_krw || 0);
  const isVip = Boolean(customer?.is_vip) || Boolean((customer?.tags || []).includes("VIP")) || totalSpend >= 1_000_000;
  const ticketCount = Number(customer?.ticket_count || 0);
  const joinedAt = String(customer?.joined_at || "");
  const device = String(active?.user_device || "").trim() || "-";
  const locale = String(active?.user_locale || "").trim() || "-";
  const location = String(active?.user_location || "").trim() || "-";
  const selectedTags = useMemo(() => parseTags(metaDraft.tagsText || active?.tags), [metaDraft.tagsText, active?.id]);
  const presetTagNames = useMemo(() => presetTags.map((t) => t.name), [presetTags]);
  const tagColor = (name: string) => presetTags.find((t) => t.name === name)?.color || "";
  const joinedLabel = joinedAt ? new Date(joinedAt).toLocaleDateString("ko-KR") : "-";

  return (
    <Box sx={{ color: "rgba(255,255,255,0.92)", display: "grid", gap: 0, minWidth: 0, bgcolor: "#111827", borderRadius: 2, p: 1 }}>
      {/* activity stats */}
      <CardSection title="활동 통계" right={null}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
          <Box
            sx={{
              borderRadius: 1.5,
              bgcolor: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.25)",
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#60A5FA" }}>{ticketCount}</Typography>
            <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.7rem" }}>문의 횟수</Typography>
          </Box>
          <Box
            sx={{
              borderRadius: 1.5,
              bgcolor: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.25)",
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#4ADE80" }}>{totalSpend.toLocaleString("ko-KR")}</Typography>
            <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.7rem" }}>누적 결제</Typography>
          </Box>
          <Box
            sx={{
              borderRadius: 1.5,
              bgcolor: isVip ? "rgba(249,115,22,0.15)" : "rgba(100,116,139,0.15)",
              border: isVip ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(100,116,139,0.25)",
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: isVip ? "#FB923C" : "#94A3B8" }}>{isVip ? "VIP" : "일반"}</Typography>
            <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.7rem" }}>유저 등급</Typography>
          </Box>
        </Box>
      </CardSection>

      {/* customer info */}
      <CardSection title="고객 정보" right={null}>
        {active ? (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Avatar
                src={active.user_avatar_url || undefined}
                sx={{ width: 52, height: 52, bgcolor: "rgba(59,130,246,0.2)", color: "#60A5FA", fontWeight: 800, fontSize: "1.25rem" }}
              >
                {(gameNick || "U").slice(0, 1)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#FFFFFF" }} noWrap>
                    {gameNick}
                  </Typography>
                  {isVip && (
                    <Chip
                      size="small"
                      label="VIP"
                      sx={{
                        height: 20,
                        fontWeight: 700,
                        bgcolor: "rgba(249,115,22,0.2)",
                        color: "#FB923C",
                        fontSize: "0.7rem",
                        border: "1px solid rgba(249,115,22,0.3)",
                      }}
                    />
                  )}
                </Box>
                <Typography sx={{ color: "#CBD5E1", mt: 0.5, fontSize: "0.85rem" }} noWrap>
                  {accountEmail}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 0.5 }}>
              <Row icon={<InfoOutlinedIcon fontSize="small" />} label="이메일" value={accountEmail} onCopy={accountEmail} />
              <Row icon={<BadgeOutlinedIcon fontSize="small" />} label="UUID" value={uuid} onCopy={uuid} />
              <Row
                icon={<PhoneIphoneOutlinedIcon fontSize="small" />}
                label="전화번호"
                value={displayPhone}
                onCopy={displayPhone}
                right={customer?.phone_number && customer.phone_number !== "-" ? <CheckCircleRoundedIcon sx={{ color: "#22C55E", fontSize: 14 }} /> : null}
              />
              <Row icon={<DevicesOutlinedIcon fontSize="small" />} label="기기" value={device} />
              <Row icon={<PlaceOutlinedIcon fontSize="small" />} label="위치" value={`${translateLocation(location)}${locale !== "-" ? ` · ${locale}` : ""}`} />
              <Row icon={<BadgeOutlinedIcon fontSize="small" />} label="가입일" value={joinedLabel} />
            </Box>
          </Box>
        ) : (
          <Typography sx={{ color: "#64748B", textAlign: "center", py: 2 }}>티켓을 선택하세요.</Typography>
        )}
      </CardSection>

      {/* 상담 태그 */}
      <CardSection
        title="상담 태그"
        right={
          <Button
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 700,
              color: "#60A5FA",
              fontSize: "0.75rem",
              borderColor: "rgba(96,165,250,0.3)",
              borderRadius: 1,
              px: 1,
              py: 0.25,
              "&:hover": { bgcolor: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.5)" },
            }}
            disabled={!active}
            onClick={() => setTagOpen(true)}
          >
            + 추가
          </Button>
        }
      >
        {selectedTags.length ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {selectedTags.slice(0, 12).map((t) => {
              const color = tagColor(t);
              return (
                <Chip
                  key={t}
                  size="small"
                  label={t}
                  onDelete={async () => {
                    if (!active) return;
                    const newTags = selectedTags.filter((tag) => tag !== t);
                    setMetaDraft({ ...metaDraft, tagsText: newTags.join(",") });
                    if (onQuickMeta) {
                      try {
                        await onQuickMeta({ tags: newTags });
                      } catch (e) {
                        console.error("Failed to delete tag:", e);
                      }
                    }
                  }}
                  sx={{
                    height: 26,
                    fontWeight: 600,
                    bgcolor: color || "rgba(168,85,247,0.15)",
                    color: color ? "#FFFFFF" : "#A855F7",
                    border: color ? "none" : "1px solid rgba(168,85,247,0.3)",
                    fontSize: "0.8rem",
                    borderRadius: 1.5,
                    "& .MuiChip-deleteIcon": {
                      color: color ? "rgba(255,255,255,0.8)" : "rgba(168,85,247,0.6)",
                      fontSize: 16,
                      "&:hover": { color: color ? "#FFFFFF" : "#A855F7" },
                    },
                  }}
                />
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ color: "#64748B", fontSize: "0.85rem" }}>
              태그가 없어요
            </Typography>
          </Box>
        )}
      </CardSection>

      {/* 고객 메모 */}
      <CardSection
        title="고객 메모"
        right={
          <Button
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 700,
              color: "#FBBF24",
              fontSize: "0.75rem",
              borderColor: "rgba(251,191,36,0.3)",
              borderRadius: 1,
              px: 1,
              py: 0.25,
              "&:hover": { bgcolor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.5)" },
            }}
            disabled={!active}
            onClick={() => setMemoOpen((v) => !v)}
          >
            {memoOpen ? "닫기" : "+ 추가"}
          </Button>
        }
      >
        {memoOpen ? (
          <Box sx={{ display: "grid", gap: 1.5, mb: 1.5 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="고객 메모를 입력하세요 (운영자만 보임)"
              disabled={busy}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&.Mui-focused fieldset": { borderColor: "#FBBF24" },
                },
                "& .MuiInputBase-input": { color: "#FFFFFF" },
              }}
            />
            <Button
              variant="contained"
              disabled={busy || !noteDraft.trim()}
              onClick={onAddNote}
              sx={{ fontWeight: 700, bgcolor: "#FBBF24", color: "#000", "&:hover": { bgcolor: "#F59E0B" } }}
            >
              저장
            </Button>
          </Box>
        ) : null}

        <Box sx={{ display: "grid", gap: 1 }}>
          {notes === null ? (
            <Typography sx={{ color: "#64748B", textAlign: "center", py: 1 }}>불러오는 중…</Typography>
          ) : notes.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography sx={{ color: "#64748B", fontSize: "0.85rem" }}>메모가 없어요</Typography>
            </Box>
          ) : (
            notes.slice(0, 3).map((n: any) => (
              <Box
                key={n.id}
                sx={{
                  borderRadius: 1.5,
                  border: "1px solid rgba(251,191,36,0.25)",
                  bgcolor: "rgba(251,191,36,0.08)",
                  p: 1.5,
                }}
              >
                <Typography sx={{ whiteSpace: "pre-wrap", fontWeight: 500, color: "#FFFFFF", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {n.body}
                </Typography>
                <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>
                    {n.author_name || "관리자"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                    {timeAgo(n.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </CardSection>

      {/* 상담 정보 */}
      <CardSection title="상담 정보" right={null}>
        <Row
          icon={<LinkOutlinedIcon fontSize="small" />}
          label="유입 채널"
          value={
            <Chip
              size="small"
              label={active ? String(active.channel || "inapp") : "-"}
              sx={{
                height: 24,
                fontWeight: 600,
                bgcolor: "rgba(59,130,246,0.15)",
                borderRadius: 1,
                color: "#60A5FA",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            />
          }
        />
      </CardSection>

      {/* 이전 문의 내역 */}
      <CardSection title="이전 문의 내역" right={null}>
        {userHistory.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography sx={{ color: "#64748B", fontSize: "0.85rem" }}>이전 문의가 없어요</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            {userHistory.map((h) => (
              <Box
                key={h.id}
                onClick={() => onSelectTicket?.(h.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  p: 1.25,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)", transform: "translateX(2px)" },
                  border: h.id === active?.id ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  bgcolor: h.id === active?.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: h.id === active?.id ? "#60A5FA" : "#FFFFFF" }} noWrap>
                    {h.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B", ml: 1, flexShrink: 0 }}>
                    {new Date(h.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>
                    #{h.id}
                  </Typography>
                  <Chip
                    size="small"
                    label={h.status_label || h.status}
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      bgcolor: h.status === "CLOSED" ? "rgba(100,116,139,0.2)" : h.status === "PENDING" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)",
                      color: h.status === "CLOSED" ? "#94A3B8" : h.status === "PENDING" ? "#FB923C" : "#4ADE80",
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardSection>

      {/* tag dialog (dark, like screenshot) */}
      <Dialog open={tagOpen} onClose={() => setTagOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            bgcolor: "#111827",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocalOfferOutlinedIcon fontSize="small" />
            상담 태그
          </Box>
          <IconButton size="small" onClick={() => setTagOpen(false)} sx={{ color: "rgba(255,255,255,0.70)" }}>
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#111827", pt: 2 }}>
          <Autocomplete
            multiple
            freeSolo
            options={presetTagNames}
            value={selectedTags}
            groupBy={(opt) => {
              const s = String(opt || "");
              const g = s.includes("/") ? s.split("/")[0] : "기타";
              return g;
            }}
            onChange={(_, value) => setMetaDraft({ ...metaDraft, tagsText: (value ?? []).join(",") })}
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  {...getTagProps({ index })}
                  key={`${option}-${index}`}
                  label={option}
                  sx={{
                    bgcolor: "rgba(249,115,22,0.18)",
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 900,
                    borderRadius: 2,
                    border: "1px solid rgba(249,115,22,0.25)",
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="입력해 주세요"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.92)",
                    borderRadius: 2,
                  },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
                  "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.45)" },
                }}
              />
            )}
          />

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              disabled={busy || !active}
              onClick={async () => {
                await onSaveMeta();
                setTagOpen(false);
              }}
              sx={{ fontWeight: 900, bgcolor: "#4F7DFF", px: 4, py: 1.1, borderRadius: 2 }}
              fullWidth
            >
              적용
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* keep legacy details (optional) */}
      {more && active ? (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <CardSection title="고객 태그/노트(레거시)" right={null}>
            <TextField
              value={customerDraft.tagsText}
              onChange={(e) => setCustomerDraft({ ...customerDraft, tagsText: e.target.value })}
              placeholder="tags (comma separated)"
              disabled={busy}
              fullWidth
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={customerDraft.notes}
              onChange={(e) => setCustomerDraft({ ...customerDraft, notes: e.target.value })}
              placeholder="고객 노트"
              sx={{ mt: 1 }}
              disabled={busy}
            />
            <Button fullWidth variant="outlined" sx={{ mt: 1, fontWeight: 900 }} disabled={busy || !customer} onClick={onSaveCustomer}>
              고객 저장
            </Button>
          </CardSection>
        </Box>
      ) : null}
    </Box>
  );
}


