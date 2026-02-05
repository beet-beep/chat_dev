import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BugReportIcon from "@mui/icons-material/BugReport";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import { useEffect, useMemo, useState } from "react";
import {
  adminListVoc,
  adminPatchVoc,
  adminDeleteVoc,
  adminAnalyzeVoc,
  adminVocDashboard,
  type VocEntry,
  type VocDashboard,
} from "../../../api/support";

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BUG: { label: "버그", color: "#EF4444", icon: <BugReportIcon sx={{ fontSize: 18 }} /> },
  SUGGESTION: { label: "건의사항", color: "#3B82F6", icon: <LightbulbIcon sx={{ fontSize: 18 }} /> },
  COMPLAINT: { label: "불만", color: "#F59E0B", icon: <SentimentDissatisfiedIcon sx={{ fontSize: 18 }} /> },
  PRAISE: { label: "칭찬", color: "#22C55E", icon: <ThumbUpAltIcon sx={{ fontSize: 18 }} /> },
  OTHER: { label: "기타", color: "#64748B", icon: <CategoryIcon sx={{ fontSize: 18 }} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "신규", color: "#3B82F6" },
  REVIEWING: { label: "검토중", color: "#F59E0B" },
  PLANNED: { label: "반영예정", color: "#8B5CF6" },
  DONE: { label: "반영완료", color: "#22C55E" },
  REJECTED: { label: "반려", color: "#64748B" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "낮음", color: "#64748B" },
  MEDIUM: { label: "보통", color: "#F59E0B" },
  HIGH: { label: "높음", color: "#F97316" },
  CRITICAL: { label: "긴급", color: "#EF4444" },
};

function sentimentColor(s: string) {
  if (s === "positive") return "#22C55E";
  if (s === "negative") return "#EF4444";
  if (s === "mixed") return "#F59E0B";
  return "#64748B";
}

function sentimentLabel(s: string) {
  if (s === "positive") return "긍정";
  if (s === "negative") return "부정";
  if (s === "mixed") return "혼합";
  if (s === "neutral") return "중립";
  return s;
}

function StatCard(p: { label: string; value: string | number; color: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Box sx={{ textAlign: "center", flex: 1, minWidth: 0 }}>
      {p.icon && <Box sx={{ mb: 0.5, color: p.color, opacity: 0.7 }}>{p.icon}</Box>}
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: p.color, lineHeight: 1.1 }}>{p.value}</Typography>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mt: 0.5 }}>{p.label}</Typography>
      {p.sub && <Typography sx={{ fontSize: "0.6rem", color: "text.disabled" }}>{p.sub}</Typography>}
    </Box>
  );
}

function DistributionBar(p: { data: Record<string, number>; config: Record<string, { label: string; color: string }> }) {
  const total = Object.values(p.data).reduce((a, b) => a + b, 0) || 1;
  return (
    <Box sx={{ display: "flex", gap: 0.5, height: 10, borderRadius: 1, overflow: "hidden", bgcolor: "rgba(255,255,255,0.05)" }}>
      {Object.entries(p.config).map(([k, cfg]) => {
        const v = p.data[k] || 0;
        if (!v) return null;
        return (
          <Tooltip key={k} title={`${cfg.label}: ${v}건 (${Math.round((v / total) * 100)}%)`} arrow>
            <Box sx={{ width: `${(v / total) * 100}%`, bgcolor: cfg.color, borderRadius: 0.5, minWidth: 4, transition: "width 0.3s" }} />
          </Tooltip>
        );
      })}
    </Box>
  );
}

export function AdminVocPage() {
  const [dash, setDash] = useState<VocDashboard | null>(null);
  const [entries, setEntries] = useState<VocEntry[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [activeEntry, setActiveEntry] = useState<VocEntry | null>(null);
  const [editNote, setEditNote] = useState("");
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [days, setDays] = useState(30);

  async function refresh() {
    setBusy(true);
    try {
      const params: any = {};
      if (typeFilter !== "all") params.voc_type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (severityFilter !== "all") params.severity = severityFilter;
      if (q.trim()) params.q = q.trim();
      const [d, e] = await Promise.all([adminVocDashboard(days), adminListVoc(params)]);
      setDash(d);
      setEntries(e);
    } catch {
      setEntries([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { refresh(); }, [typeFilter, statusFilter, severityFilter, days]); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!entries) return null;
    const s = q.trim().toLowerCase();
    let list = entries;
    if (s) {
      list = list.filter((e) => `${e.summary} ${e.ticket_title} ${e.keywords.join(" ")} ${e.category}`.toLowerCase().includes(s));
    }
    // Sort
    if (sortBy === "impact") list = [...list].sort((a, b) => b.impact_score - a.impact_score);
    else if (sortBy === "sentiment") list = [...list].sort((a, b) => a.sentiment_score - b.sentiment_score);
    else if (sortBy === "oldest") list = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [entries, q, sortBy]);

  // Priority queue: unanalyzed + high impact
  const priorityItems = useMemo(() => {
    if (!entries) return [];
    return entries
      .filter((e) => e.status === "NEW" && (!e.summary || e.impact_score >= 7 || e.severity === "CRITICAL" || e.severity === "HIGH"))
      .sort((a, b) => b.impact_score - a.impact_score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [entries]);

  async function onAnalyze(entry: VocEntry) {
    setBusy(true);
    try {
      const res = await adminAnalyzeVoc(entry.id);
      if (res.success) {
        setToast({ open: true, message: "AI 분석 완료!", severity: "success" });
        await refresh();
        // Refresh active entry if open
        if (activeEntry?.id === entry.id) {
          const updated = (entries ?? []).find((e) => e.id === entry.id);
          if (updated) setActiveEntry({ ...updated, ...res.analysis });
        }
      } else {
        setToast({ open: true, message: "분석 실패", severity: "error" });
      }
    } catch {
      setToast({ open: true, message: "분석 오류", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function onBulkAnalyze() {
    const unanalyzed = (entries ?? []).filter((e) => !e.summary || e.keywords.length === 0);
    if (!unanalyzed.length) {
      setToast({ open: true, message: "분석할 VOC가 없습니다.", severity: "info" });
      return;
    }
    if (!window.confirm(`${unanalyzed.length}건의 VOC를 일괄 분석하시겠습니까?`)) return;
    setBulkAnalyzing(true);
    let success = 0;
    let fail = 0;
    for (const entry of unanalyzed) {
      try {
        const res = await adminAnalyzeVoc(entry.id);
        if (res.success) success++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setBulkAnalyzing(false);
    setToast({ open: true, message: `일괄 분석 완료: 성공 ${success}건, 실패 ${fail}건`, severity: success > 0 ? "success" : "error" });
    await refresh();
  }

  async function onStatusChange(entry: VocEntry, newStatus: string) {
    try {
      await adminPatchVoc(entry.id, { status: newStatus as any });
      setEntries((prev) => prev?.map((e) => e.id === entry.id ? { ...e, status: newStatus as any, status_label: STATUS_CONFIG[newStatus]?.label || newStatus } : e) ?? null);
      if (activeEntry?.id === entry.id) setActiveEntry({ ...activeEntry, status: newStatus as any });
      setToast({ open: true, message: "상태 변경 완료", severity: "success" });
    } catch {
      setToast({ open: true, message: "상태 변경 실패", severity: "error" });
    }
  }

  async function onSaveNote(entry: VocEntry) {
    try {
      await adminPatchVoc(entry.id, { admin_note: editNote } as any);
      setEntries((prev) => prev?.map((e) => e.id === entry.id ? { ...e, admin_note: editNote } : e) ?? null);
      if (activeEntry?.id === entry.id) setActiveEntry({ ...activeEntry, admin_note: editNote });
      setToast({ open: true, message: "메모 저장 완료", severity: "success" });
    } catch {
      setToast({ open: true, message: "메모 저장 실패", severity: "error" });
    }
  }

  async function onDelete(entry: VocEntry) {
    if (!window.confirm("이 VOC를 삭제할까요?")) return;
    try {
      await adminDeleteVoc(entry.id);
      setEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
      if (activeEntry?.id === entry.id) setActiveEntry(null);
      setToast({ open: true, message: "삭제 완료", severity: "success" });
    } catch {
      setToast({ open: true, message: "삭제 실패", severity: "error" });
    }
  }

  function exportCsv() {
    if (!filtered?.length) return;
    const headers = ["ID", "유형", "상태", "심각도", "요약", "키워드", "감성", "감성점수", "영향도", "카테고리", "티켓", "고객", "생성일", "메모"];
    const rows = filtered.map((e) => [
      e.id, TYPE_CONFIG[e.voc_type]?.label || e.voc_type, STATUS_CONFIG[e.status]?.label || e.status,
      SEVERITY_CONFIG[e.severity]?.label || e.severity, `"${(e.summary || "").replace(/"/g, '""')}"`,
      `"${e.keywords.join(", ")}"`, sentimentLabel(e.sentiment), e.sentiment_score, e.impact_score,
      e.category, e.ticket, e.user_name || "", new Date(e.created_at).toLocaleDateString("ko-KR"),
      `"${(e.admin_note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voc_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ open: true, message: "CSV 내보내기 완료", severity: "success" });
  }

  // Stats derived from dashboard
  const resolvedRate = dash ? Math.round(((dash.by_status["DONE"] || 0) / Math.max(dash.total, 1)) * 100) : 0;
  const criticalCount = dash ? (dash.by_severity?.["CRITICAL"] || 0) + (dash.by_severity?.["HIGH"] || 0) : 0;
  const unanalyzedCount = (entries ?? []).filter((e) => !e.summary || e.keywords.length === 0).length;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ p: 2.5, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(139,92,246,0.3)" }}>
            <AutoAwesomeIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem" }}>VOC 스튜디오</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>고객의 소리를 AI로 분석하고 제품을 개선하세요</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!filtered?.length} sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
            CSV
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={onBulkAnalyze}
            disabled={bulkAnalyzing || unanalyzedCount === 0}
            sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#8B5CF6", "&:hover": { bgcolor: "#7C3AED" } }}
          >
            {bulkAnalyzing ? "분석 중..." : `일괄 분석 (${unanalyzedCount})`}
          </Button>
          <TextField select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))} sx={{ width: 110, "& .MuiInputBase-root": { fontWeight: 700, fontSize: "0.75rem" } }}>
            <MenuItem value={7}>7일</MenuItem>
            <MenuItem value={14}>14일</MenuItem>
            <MenuItem value={30}>30일</MenuItem>
            <MenuItem value={90}>90일</MenuItem>
          </TextField>
          <IconButton onClick={refresh} disabled={busy} size="small"><RefreshIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      {(busy || bulkAnalyzing) && <LinearProgress sx={{ flexShrink: 0 }} />}

      <Box sx={{ flex: 1, overflow: "auto", px: 2.5, pb: 2.5 }}>
        {/* Dashboard */}
        {dash && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1.5, mb: 2 }}>
            {/* Overview Card */}
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>요약</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  <StatCard label="전체" value={dash.total} color="#8B5CF6" />
                  <StatCard label="해결률" value={`${resolvedRate}%`} color={resolvedRate >= 70 ? "#22C55E" : resolvedRate >= 40 ? "#F59E0B" : "#EF4444"} />
                  <StatCard label="긴급/높음" value={criticalCount} color={criticalCount > 0 ? "#EF4444" : "#64748B"} />
                </Box>
              </CardContent>
            </Card>

            {/* Impact & Sentiment */}
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>감성 & 영향도</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  <StatCard label="평균 영향도" value={dash.avg_impact} color="#F97316" sub="/10" />
                  <StatCard label="감성 점수" value={dash.avg_sentiment > 0 ? `+${dash.avg_sentiment}` : String(dash.avg_sentiment)} color={dash.avg_sentiment >= 0 ? "#22C55E" : "#EF4444"} />
                </Box>
                {dash.sentiment_dist && Object.keys(dash.sentiment_dist).length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, mt: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
                    {Object.entries(dash.sentiment_dist).map(([k, v]) => (
                      <Chip key={k} size="small" label={`${sentimentLabel(k)} ${v}`} sx={{ height: 20, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${sentimentColor(k)}20`, color: sentimentColor(k) }} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>유형별</Typography>
                <DistributionBar data={dash.by_type} config={TYPE_CONFIG} />
                <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                  {Object.entries(TYPE_CONFIG).map(([k, cfg]) => {
                    const v = dash.by_type[k] || 0;
                    if (!v) return null;
                    return <Chip key={k} size="small" label={`${cfg.label} ${v}`} sx={{ fontWeight: 700, fontSize: "0.6rem", bgcolor: `${cfg.color}20`, color: cfg.color, height: 20 }} />;
                  })}
                </Box>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>처리 현황</Typography>
                <DistributionBar data={dash.by_status} config={STATUS_CONFIG} />
                <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                  {Object.entries(STATUS_CONFIG).map(([k, cfg]) => {
                    const v = dash.by_status[k] || 0;
                    if (!v) return null;
                    return <Chip key={k} size="small" label={`${cfg.label} ${v}`} sx={{ fontWeight: 700, fontSize: "0.6rem", bgcolor: `${cfg.color}20`, color: cfg.color, height: 20 }} />;
                  })}
                </Box>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>핫 키워드</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {(dash.top_keywords || []).slice(0, 12).map((kw, i) => (
                    <Chip key={kw.keyword} size="small" label={`${kw.keyword} ${kw.count}`}
                      sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, bgcolor: i < 3 ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)", color: i < 3 ? "#A78BFA" : "text.secondary" }}
                      onClick={() => { setQ(kw.keyword); }}
                    />
                  ))}
                  {(!dash.top_keywords || dash.top_keywords.length === 0) && (
                    <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>AI 분석 후 키워드가 표시됩니다</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            {dash.top_categories && Object.keys(dash.top_categories).length > 0 && (
              <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>카테고리</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {Object.entries(dash.top_categories).map(([cat, count]) => (
                      <Chip key={cat} size="small" label={`${cat} ${count}`} sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, bgcolor: "rgba(59,130,246,0.12)", color: "#3B82F6" }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Daily Trend - full width */}
            {dash.daily_trend.length > 1 && (
              <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5, gridColumn: "1 / -1" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>일별 추이</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 72 }}>
                    {(() => {
                      const max = Math.max(...dash.daily_trend.map((d) => d.count), 1);
                      return dash.daily_trend.map((d) => (
                        <Tooltip key={d.date} title={`${d.date}: ${d.count}건`} arrow>
                          <Box sx={{
                            flex: 1, minWidth: 3, maxWidth: 24,
                            height: `${Math.max((d.count / max) * 100, 6)}%`,
                            bgcolor: "#8B5CF6", borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s, background-color 0.15s",
                            "&:hover": { bgcolor: "#A78BFA" },
                          }} />
                        </Tooltip>
                      ));
                    })()}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography sx={{ fontSize: "0.6rem", color: "text.disabled" }}>{dash.daily_trend[0]?.date}</Typography>
                    <Typography sx={{ fontSize: "0.6rem", color: "text.disabled" }}>{dash.daily_trend[dash.daily_trend.length - 1]?.date}</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Priority Queue */}
        {priorityItems.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <PriorityHighIcon sx={{ fontSize: 18, color: "#EF4444" }} />
              <Typography sx={{ fontWeight: 900, fontSize: "0.85rem", color: "#EF4444" }}>우선 처리 필요</Typography>
              <Chip label={priorityItems.length} size="small" sx={{ height: 20, fontWeight: 700, fontSize: "0.65rem", bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 } }}>
              {priorityItems.map((entry) => {
                const tc = TYPE_CONFIG[entry.voc_type] || TYPE_CONFIG.OTHER;
                return (
                  <Card
                    key={entry.id}
                    sx={{ minWidth: 240, maxWidth: 300, flexShrink: 0, bgcolor: "background.paper", border: "1px solid", borderColor: "rgba(239,68,68,0.3)", borderRadius: 2, cursor: "pointer", "&:hover": { borderColor: "#EF4444" } }}
                    onClick={() => { setActiveEntry(entry); setEditNote(entry.admin_note || ""); }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                        <Chip size="small" label={tc.label} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${tc.color}20`, color: tc.color }} />
                        <Chip size="small" label={`영향 ${entry.impact_score}`} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444" }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", mb: 0.25 }} noWrap>{entry.summary || entry.ticket_title}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }} noWrap>#{entry.ticket} · {entry.user_name || "고객"}</Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="VOC 검색..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") refresh(); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment>,
              sx: { borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.03)", width: 220, fontSize: "0.8rem" },
            }}
          />
          <ToggleButtonGroup value={typeFilter} exclusive onChange={(_, v) => { if (v !== null) setTypeFilter(v); }} size="small" sx={{ "& .MuiToggleButton-root": { fontWeight: 700, fontSize: "0.7rem", py: 0.25, px: 1 } }}>
            <ToggleButton value="all">전체</ToggleButton>
            <ToggleButton value="BUG">버그</ToggleButton>
            <ToggleButton value="SUGGESTION">건의</ToggleButton>
            <ToggleButton value="COMPLAINT">불만</ToggleButton>
            <ToggleButton value="PRAISE">칭찬</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => { if (v !== null) setStatusFilter(v); }} size="small" sx={{ "& .MuiToggleButton-root": { fontWeight: 700, fontSize: "0.7rem", py: 0.25, px: 1 } }}>
            <ToggleButton value="all">전체</ToggleButton>
            <ToggleButton value="NEW">신규</ToggleButton>
            <ToggleButton value="REVIEWING">검토</ToggleButton>
            <ToggleButton value="PLANNED">예정</ToggleButton>
            <ToggleButton value="DONE">완료</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={severityFilter} exclusive onChange={(_, v) => { if (v !== null) setSeverityFilter(v); }} size="small" sx={{ "& .MuiToggleButton-root": { fontWeight: 700, fontSize: "0.7rem", py: 0.25, px: 1 } }}>
            <ToggleButton value="all">전체</ToggleButton>
            <ToggleButton value="CRITICAL">긴급</ToggleButton>
            <ToggleButton value="HIGH">높음</ToggleButton>
          </ToggleButtonGroup>
          <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ width: 120, "& .MuiInputBase-root": { fontWeight: 700, fontSize: "0.75rem" } }}>
            <MenuItem value="newest">최신순</MenuItem>
            <MenuItem value="oldest">오래된순</MenuItem>
            <MenuItem value="impact">영향도순</MenuItem>
            <MenuItem value="sentiment">감성순</MenuItem>
          </TextField>
          {filtered && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", ml: "auto" }}>{filtered.length}건</Typography>}
        </Box>

        {/* VOC List */}
        <Box sx={{ display: "grid", gap: 1 }}>
          {!filtered ? (
            <Typography sx={{ color: "text.secondary", p: 3, textAlign: "center" }}>불러오는 중…</Typography>
          ) : filtered.length === 0 ? (
            <Card sx={{ textAlign: "center", py: 6, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: "text.secondary" }}>VOC가 없습니다</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", mt: 0.5 }}>
                티켓에 "버그" 또는 "건의사항" 태그를 추가하면 자동으로 수집됩니다
              </Typography>
            </Card>
          ) : (
            filtered.map((entry) => {
              const tc = TYPE_CONFIG[entry.voc_type] || TYPE_CONFIG.OTHER;
              const sc = STATUS_CONFIG[entry.status] || STATUS_CONFIG.NEW;
              const sev = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.MEDIUM;
              const isAnalyzed = Boolean(entry.summary && entry.keywords.length > 0);
              return (
                <Card
                  key={entry.id}
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: entry.severity === "CRITICAL" ? "rgba(239,68,68,0.3)" : activeEntry?.id === entry.id ? "rgba(139,92,246,0.4)" : "divider",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: "rgba(139,92,246,0.3)", bgcolor: "rgba(139,92,246,0.02)" },
                    borderLeft: entry.severity === "CRITICAL" ? "3px solid #EF4444" : entry.severity === "HIGH" ? "3px solid #F97316" : undefined,
                  }}
                  onClick={() => { setActiveEntry(entry); setEditNote(entry.admin_note || ""); }}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: `${tc.color}12`, display: "grid", placeItems: "center", color: tc.color, flexShrink: 0, mt: 0.25 }}>
                        {tc.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25, flexWrap: "wrap" }}>
                          <Chip size="small" label={tc.label} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${tc.color}15`, color: tc.color }} />
                          <Chip size="small" label={sc.label} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${sc.color}15`, color: sc.color }} />
                          <Chip size="small" label={sev.label} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${sev.color}15`, color: sev.color }} />
                          {entry.sentiment && <Chip size="small" label={sentimentLabel(entry.sentiment)} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: `${sentimentColor(entry.sentiment)}15`, color: sentimentColor(entry.sentiment) }} />}
                          {entry.impact_score >= 7 && <Chip size="small" label={`영향 ${entry.impact_score}`} sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: "rgba(239,68,68,0.12)", color: "#EF4444" }} />}
                          {entry.category && <Chip size="small" label={entry.category} variant="outlined" sx={{ height: 18, fontWeight: 600, fontSize: "0.6rem", borderColor: "rgba(255,255,255,0.08)" }} />}
                          {!isAnalyzed && <Chip size="small" label="미분석" sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem", bgcolor: "rgba(255,255,255,0.04)", color: "text.disabled" }} />}
                          {entry.admin_note && <EditNoteIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 0.25 }} noWrap>{entry.summary || entry.ticket_title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
                          #{entry.ticket} · {entry.user_name || "고객"} · {new Date(entry.created_at).toLocaleDateString("ko-KR")}
                        </Typography>
                        {entry.keywords.length > 0 && (
                          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                            {entry.keywords.slice(0, 6).map((kw) => (
                              <Chip key={kw} size="small" label={kw} variant="outlined" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 600, borderColor: "rgba(255,255,255,0.08)" }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, flexShrink: 0 }}>
                        <Tooltip title="AI 분석"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onAnalyze(entry); }} disabled={busy}><AutoAwesomeIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="티켓"><IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`/admin/inbox?ticket=${entry.ticket}`, "_blank"); }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="삭제"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(entry); }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Box>

      {/* Detail Dialog */}
      <Dialog open={!!activeEntry} onClose={() => setActiveEntry(null)} maxWidth="md" fullWidth>
        {activeEntry && (() => {
          const tc = TYPE_CONFIG[activeEntry.voc_type] || TYPE_CONFIG.OTHER;
          const analysis = activeEntry.ai_analysis || {};
          const isAnalyzed = Boolean(activeEntry.summary && activeEntry.keywords.length > 0);
          return (
            <>
              <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${tc.color}12`, display: "grid", placeItems: "center", color: tc.color }}>
                  {tc.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>VOC #{activeEntry.id}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>#{activeEntry.ticket} · {activeEntry.ticket_title}</Typography>
                </Box>
                {!isAnalyzed && <Chip label="미분석" size="small" sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.06)", color: "text.disabled" }} />}
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: "grid", gap: 2 }}>
                  {/* Meta chips */}
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    <Chip label={tc.label} size="small" sx={{ fontWeight: 700, bgcolor: `${tc.color}15`, color: tc.color }} />
                    <Chip label={SEVERITY_CONFIG[activeEntry.severity]?.label || activeEntry.severity} size="small" sx={{ fontWeight: 700, bgcolor: `${(SEVERITY_CONFIG[activeEntry.severity]?.color || "#64748B")}15`, color: SEVERITY_CONFIG[activeEntry.severity]?.color || "#64748B" }} />
                    {activeEntry.category && <Chip label={activeEntry.category} size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
                    {activeEntry.sentiment && <Chip label={`${sentimentLabel(activeEntry.sentiment)} (${activeEntry.sentiment_score > 0 ? "+" : ""}${activeEntry.sentiment_score})`} size="small" sx={{ fontWeight: 700, bgcolor: `${sentimentColor(activeEntry.sentiment)}15`, color: sentimentColor(activeEntry.sentiment) }} />}
                    <Chip label={`영향도 ${activeEntry.impact_score}/10`} size="small" sx={{ fontWeight: 700, bgcolor: activeEntry.impact_score >= 7 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)", color: activeEntry.impact_score >= 7 ? "#EF4444" : "text.secondary" }} />
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", ml: "auto", alignSelf: "center" }}>
                      {activeEntry.user_name || "고객"} · {new Date(activeEntry.created_at).toLocaleString("ko-KR")}
                    </Typography>
                  </Box>

                  {/* Summary */}
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.8rem", mb: 0.5, color: "text.secondary" }}>요약</Typography>
                    <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{activeEntry.summary || "AI 분석을 실행하면 요약이 생성됩니다."}</Typography>
                  </Box>

                  {/* Keywords */}
                  {activeEntry.keywords.length > 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: "0.8rem", mb: 0.5, color: "text.secondary" }}>키워드</Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {activeEntry.keywords.map((kw) => <Chip key={kw} label={kw} size="small" sx={{ fontWeight: 700 }} />)}
                      </Box>
                    </Box>
                  )}

                  {/* Action Items */}
                  {activeEntry.action_items.length > 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: "0.8rem", mb: 0.5, color: "text.secondary" }}>조치 사항</Typography>
                      <Box sx={{ display: "grid", gap: 0.5 }}>
                        {activeEntry.action_items.map((item, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 1, bgcolor: "rgba(139,92,246,0.05)", borderRadius: 1.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: "#8B5CF6", mt: 0.25 }} />
                            <Typography sx={{ fontSize: "0.85rem" }}>{item}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Root cause & emotion */}
                  {(analysis.root_cause || analysis.user_emotion) && (
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      {analysis.root_cause && (
                        <Box sx={{ p: 1.5, bgcolor: "rgba(239,68,68,0.04)", borderRadius: 1.5, border: "1px solid rgba(239,68,68,0.1)" }}>
                          <Typography sx={{ fontWeight: 900, fontSize: "0.75rem", mb: 0.5, color: "#EF4444" }}>근본 원인</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{analysis.root_cause}</Typography>
                        </Box>
                      )}
                      {analysis.user_emotion && (
                        <Box sx={{ p: 1.5, bgcolor: "rgba(59,130,246,0.04)", borderRadius: 1.5, border: "1px solid rgba(59,130,246,0.1)" }}>
                          <Typography sx={{ fontWeight: 900, fontSize: "0.75rem", mb: 0.5, color: "#3B82F6" }}>고객 감정</Typography>
                          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{analysis.user_emotion}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Divider />

                  {/* Status change */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.8rem" }}>상태:</Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <Chip
                          key={k}
                          label={v.label}
                          size="small"
                          onClick={() => { onStatusChange(activeEntry, k); }}
                          sx={{
                            fontWeight: 700, fontSize: "0.7rem", cursor: "pointer",
                            bgcolor: activeEntry.status === k ? `${v.color}25` : "rgba(255,255,255,0.04)",
                            color: activeEntry.status === k ? v.color : "text.secondary",
                            border: activeEntry.status === k ? `1px solid ${v.color}` : "1px solid transparent",
                            "&:hover": { bgcolor: `${v.color}15` },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Admin note */}
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.8rem", mb: 0.5, color: "text.secondary" }}>관리자 메모</Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="내부 메모를 작성하세요..."
                        InputProps={{ sx: { fontSize: "0.85rem" } }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onSaveNote(activeEntry)}
                        sx={{ fontWeight: 700, whiteSpace: "nowrap", mt: 0.5 }}
                      >
                        저장
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
                <Button
                  onClick={() => window.open(`/admin/inbox?ticket=${activeEntry.ticket}`, "_blank")}
                  startIcon={<OpenInNewIcon />}
                  size="small"
                  sx={{ fontWeight: 700 }}
                >
                  티켓 보기
                </Button>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={() => { onAnalyze(activeEntry); }}
                    disabled={busy}
                    startIcon={<AutoAwesomeIcon />}
                    variant="contained"
                    sx={{ fontWeight: 900, bgcolor: "#8B5CF6", "&:hover": { bgcolor: "#7C3AED" } }}
                  >
                    {isAnalyzed ? "재분석" : "AI 분석"}
                  </Button>
                  <Button onClick={() => setActiveEntry(null)} sx={{ fontWeight: 700 }}>닫기</Button>
                </Box>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} variant="filled" sx={{ fontWeight: 900 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
