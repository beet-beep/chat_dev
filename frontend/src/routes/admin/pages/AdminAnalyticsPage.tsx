import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimerIcon from "@mui/icons-material/Timer";
import ChatIcon from "@mui/icons-material/Chat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArticleIcon from "@mui/icons-material/Article";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGetAnalytics, type AdminAnalyticsResponse } from "../../../api/support";

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatTime(minutes: number): string {
  if (minutes < 1) return "< 1분";
  if (minutes < 60) return `${Math.round(minutes)}분`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return Math.round(((current - previous) / previous) * 100);
}

function dateStr(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toISOString().split("T")[0];
}

type Grade = { score: number; grade: string; label: string; color: string };

function computeGrade(data: AdminAnalyticsResponse): Grade {
  const t = data.tickets;
  const total = t.total || 1;
  const rt = t.avg_response_time_min;
  const rtScore = rt <= 10 ? 100 : rt <= 30 ? 85 : rt <= 60 ? 65 : rt <= 120 ? 45 : 25;
  const rrScore = t.resolution_rate;
  const uRatio = (t.unassigned / total) * 100;
  const uScore = uRatio <= 2 ? 100 : uRatio <= 5 ? 85 : uRatio <= 10 ? 65 : uRatio <= 20 ? 45 : 25;
  const pt = t.avg_processing_time_min;
  const ptScore = pt <= 30 ? 100 : pt <= 60 ? 85 : pt <= 180 ? 65 : pt <= 360 ? 45 : 25;
  const score = Math.round(rtScore * 0.3 + rrScore * 0.3 + uScore * 0.2 + ptScore * 0.2);
  if (score >= 90) return { score, grade: "A+", label: "탁월", color: "#22C55E" };
  if (score >= 80) return { score, grade: "A", label: "우수", color: "#22C55E" };
  if (score >= 70) return { score, grade: "B", label: "양호", color: "#3B82F6" };
  if (score >= 60) return { score, grade: "C", label: "보통", color: "#F97316" };
  if (score >= 50) return { score, grade: "D", label: "미흡", color: "#EF4444" };
  return { score, grade: "F", label: "개선 필요", color: "#EF4444" };
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, color, w = 64, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", opacity: 0.8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard(props: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  sparkData?: number[];
}) {
  const { title, value, change, icon, color, subtitle, sparkData } = props;
  const trendIcon =
    change === undefined ? null : change > 0 ? (
      <TrendingUpIcon sx={{ fontSize: 14 }} />
    ) : change < 0 ? (
      <TrendingDownIcon sx={{ fontSize: 14 }} />
    ) : (
      <TrendingFlatIcon sx={{ fontSize: 14 }} />
    );
  const trendColor = change === undefined ? "" : change > 0 ? "#22C55E" : change < 0 ? "#EF4444" : "#9CA3AF";

  return (
    <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${color}15`, display: "grid", placeItems: "center", color }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Chip
              size="small"
              icon={trendIcon!}
              label={`${change >= 0 ? "+" : ""}${change}%`}
              sx={{ bgcolor: `${trendColor}20`, color: trendColor, fontWeight: 700, fontSize: "0.7rem", height: 24 }}
            />
          )}
        </Box>
        <Typography
          sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600, mb: 0.25, textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "text.primary", lineHeight: 1.2 }}>{value}</Typography>
          {sparkData && <Sparkline data={sparkData} color={color} />}
        </Box>
        {subtitle && <Typography sx={{ color: "text.secondary", fontSize: "0.68rem", mt: 0.5 }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

// ─── SVG Area Chart ──────────────────────────────────────────────────────────

function AreaChart(props: {
  data: { date: string; count: number }[];
  prevData?: { date: string; count: number }[];
  title: string;
  color?: string;
  id: string;
}) {
  const { data, prevData, title, color = "#3B82F6", id } = props;

  if (data.length === 0) {
    return (
      <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>{title}</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>데이터가 없습니다</Typography>
        </CardContent>
      </Card>
    );
  }

  const W = 520,
    H = 200;
  const P = { t: 12, r: 12, b: 28, l: 42 };
  const cW = W - P.l - P.r;
  const cH = H - P.t - P.b;

  const allVals = [...data.map((d) => d.count), ...(prevData || []).map((d) => d.count)];
  const maxV = Math.max(...allVals, 1);
  const toX = (i: number, len: number) => P.l + (i / Math.max(len - 1, 1)) * cW;
  const toY = (v: number) => P.t + cH - (v / maxV) * cH;

  const linePts = data.map((d, i) => `${toX(i, data.length)},${toY(d.count)}`).join(" ");
  const areaPts = `${toX(0, data.length)},${toY(0)} ${linePts} ${toX(data.length - 1, data.length)},${toY(0)}`;

  let prevLinePts = "";
  if (prevData && prevData.length > 1) {
    prevLinePts = prevData.map((d, i) => `${toX(i, prevData.length)},${toY(d.count)}`).join(" ");
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: P.t + cH * (1 - pct),
    val: Math.round(maxV * pct),
  }));

  const step = Math.max(1, Math.ceil(data.length / 7));
  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = (total / data.length).toFixed(1);
  const peak = data.reduce((m, d) => (d.count > m.count ? d : m), data[0]);

  return (
    <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{title}</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {[
              { label: "합계", val: String(total) },
              { label: "일평균", val: avg },
              { label: "최고", val: `${peak.count} (${peak.date.slice(5)})` },
            ].map((m) => (
              <Typography key={m.label} sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                {m.label} <strong style={{ color }}>{m.val}</strong>
              </Typography>
            ))}
          </Box>
        </Box>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id={`ag_${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={P.l} y1={g.y} x2={W - P.r} y2={g.y} stroke="rgba(255,255,255,0.06)" />
              <text x={P.l - 6} y={g.y + 3} textAnchor="end" fill="#6B7280" fontSize="9">
                {g.val}
              </text>
            </g>
          ))}
          <polygon points={areaPts} fill={`url(#ag_${id})`} />
          {prevLinePts && (
            <polyline
              points={prevLinePts}
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          )}
          <polyline points={linePts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {data.length <= 35 &&
            data.map((d, i) => <circle key={i} cx={toX(i, data.length)} cy={toY(d.count)} r={2} fill={color} />)}
          {data.map((d, i) =>
            i % step === 0 || i === data.length - 1 ? (
              <text key={i} x={toX(i, data.length)} y={H - 4} textAnchor="middle" fill="#6B7280" fontSize="8.5">
                {d.date.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
        {prevData && prevData.length > 0 && (
          <Box sx={{ display: "flex", gap: 2, mt: 0.5, justifyContent: "flex-end" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 14, height: 2, bgcolor: color, borderRadius: 1 }} />
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>현재</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 14, height: 0, borderTop: "2px dashed rgba(148,163,184,0.4)" }} />
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>이전</Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart(props: { data: { label: string; value: number; color: string }[]; title: string }) {
  const { data, title } = props;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let offset = 0;
  const segs = data.map((d) => {
    const pct = (d.value / total) * 100;
    const start = offset;
    offset += pct;
    return { ...d, pct, start };
  });

  return (
    <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", height: "100%", borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>{title}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: `conic-gradient(${segs.map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(", ")})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(0,0,0,0.15)",
            }}
          >
            <Box sx={{ width: 70, height: 70, borderRadius: "50%", bgcolor: "background.paper", display: "grid", placeItems: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>{total}</Typography>
                <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>전체</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 1.5, flex: 1 }}>
            {segs.map((d, i) => (
              <Box key={i}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: d.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>{d.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    {d.value}{" "}
                    <Typography component="span" sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 500 }}>
                      ({d.pct.toFixed(1)}%)
                    </Typography>
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={d.pct}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar": { bgcolor: d.color, borderRadius: 2 },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Horizontal Bar Chart ────────────────────────────────────────────────────

function HorizBarChart(props: { data: { label: string; value: number; color?: string }[]; title: string }) {
  const { data, title } = props;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", height: "100%", borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>{title}</Typography>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {data.map((item, idx) => (
            <Box key={idx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "text.primary",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Chip
                    label={`#${idx + 1}`}
                    size="small"
                    sx={{
                      mr: 1,
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      bgcolor: `${item.color || "#8B5CF6"}20`,
                      color: item.color || "#8B5CF6",
                    }}
                  />
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: item.color || "#8B5CF6", flexShrink: 0 }}>
                  {item.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(item.value / max) * 100}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& .MuiLinearProgress-bar": { bgcolor: item.color || "#8B5CF6", borderRadius: 1 },
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ grade }: { grade: Grade }) {
  const r = 50,
    strokeW = 8;
  const w = 2 * r + strokeW;
  const vH = r + strokeW / 2 + 20;
  const cx = r + strokeW / 2;
  const cy = r + strokeW / 2;

  // Semi-circle background (upper half): left → right, clockwise large arc
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

  // Value arc
  const endAngle = Math.PI * (1 - grade.score / 100);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy - r * Math.sin(endAngle);
  const largeArc = grade.score > 50 ? 1 : 0;
  const valPath = grade.score > 0 ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}` : "";

  return (
    <Box sx={{ textAlign: "center", flexShrink: 0 }}>
      <svg width={w} height={vH} viewBox={`0 0 ${w} ${vH}`}>
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} strokeLinecap="round" />
        {valPath && <path d={valPath} fill="none" stroke={grade.color} strokeWidth={strokeW} strokeLinecap="round" />}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={grade.color} fontSize="24" fontWeight="800">
          {grade.grade}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#9CA3AF" fontSize="9">
          {grade.score}점 · {grade.label}
        </text>
      </svg>
    </Box>
  );
}

// ─── Insight Item ────────────────────────────────────────────────────────────

function InsightItem(props: { severity: "critical" | "warning" | "info" | "success"; icon: React.ReactNode; children: React.ReactNode }) {
  const { severity, icon, children } = props;
  const colors = {
    critical: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
    warning: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
    info: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
    success: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
  }[severity];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 1.5,
      }}
    >
      <Box sx={{ mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Typography sx={{ fontSize: "0.82rem", lineHeight: 1.6 }}>{children}</Typography>
    </Box>
  );
}

// ─── Range presets ───────────────────────────────────────────────────────────

const RANGES = [
  { key: "today", label: "오늘", days: 0 },
  { key: "7d", label: "7일", days: 6 },
  { key: "30d", label: "30일", days: 29 },
  { key: "90d", label: "90일", days: 89 },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [prevData, setPrevData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<string>("30d");
  const [startDate, setStartDate] = useState(dateStr(-29));
  const [endDate, setEndDate] = useState(dateStr(0));
  const [customMode, setCustomMode] = useState(false);

  const applyRange = useCallback((key: string) => {
    const found = RANGES.find((r) => r.key === key);
    if (found) {
      setStartDate(dateStr(-found.days));
      setEndDate(dateStr(0));
      setRange(key);
      setCustomMode(false);
    }
  }, []);

  // Fetch current + previous period
  useEffect(() => {
    setLoading(true);
    const durMs = new Date(endDate).getTime() - new Date(startDate).getTime() + 86400000;
    const prevEnd = new Date(new Date(startDate).getTime() - 86400000).toISOString().split("T")[0];
    const prevStart = new Date(new Date(startDate).getTime() - durMs).toISOString().split("T")[0];

    Promise.all([adminGetAnalytics(startDate, endDate), adminGetAnalytics(prevStart, prevEnd).catch(() => null)])
      .then(([cur, prev]) => {
        setData(cur);
        setPrevData(prev);
      })
      .catch(() => {
        setData(null);
        setPrevData(null);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const periodDays = useMemo(
    () => Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1),
    [startDate, endDate],
  );

  const grade = useMemo(() => (data ? computeGrade(data) : null), [data]);

  // Period-over-period changes
  const changes = useMemo(() => {
    if (!data || !prevData) return {} as Record<string, number | undefined>;
    return {
      total: pctChange(data.tickets.total, prevData.tickets.total),
      responseTime: pctChange(data.tickets.avg_response_time_min, prevData.tickets.avg_response_time_min),
      processingTime: pctChange(data.tickets.avg_processing_time_min, prevData.tickets.avg_processing_time_min),
      resolution: pctChange(data.tickets.resolution_rate, prevData.tickets.resolution_rate),
      unassigned: pctChange(data.tickets.unassigned, prevData.tickets.unassigned),
      faqViews: pctChange(data.faq.total_views, prevData.faq.total_views),
      pending: pctChange(data.tickets.pending, prevData.tickets.pending),
    };
  }, [data, prevData]);

  // Sparkline data
  const ticketSparkline = useMemo(() => data?.trends.daily_tickets.map((d) => d.count) ?? [], [data]);
  const faqSparkline = useMemo(() => data?.trends.daily_faq_views.map((d) => d.count) ?? [], [data]);

  // Status donut
  const statusData = useMemo(() => {
    if (!data) return [];
    return [
      { label: "진행중", value: data.tickets.pending, color: "#F97316" },
      { label: "보류", value: data.tickets.answered, color: "#FBBF24" },
      { label: "완료", value: data.tickets.closed, color: "#22C55E" },
    ];
  }, [data]);

  // FAQ ranking
  const faqData = useMemo(() => {
    if (!data) return [];
    return data.faq.top_faqs.slice(0, 8).map((f) => ({
      label: f.title.length > 28 ? f.title.slice(0, 28) + "…" : f.title,
      value: f.views,
      color: "#8B5CF6",
    }));
  }, [data]);

  // Self-service rate
  const selfServiceRate = useMemo(() => {
    if (!data) return 0;
    const denom = data.faq.total_views + data.tickets.total;
    return denom > 0 ? Math.round((data.faq.total_views / denom) * 100) : 0;
  }, [data]);

  // Peak day
  const peakDay = useMemo(() => {
    if (!data || data.trends.daily_tickets.length === 0) return null;
    return data.trends.daily_tickets.reduce((m, d) => (d.count > m.count ? d : m), data.trends.daily_tickets[0]);
  }, [data]);

  // Busiest day of week
  const busiestDow = useMemo(() => {
    if (!data || data.trends.daily_tickets.length === 0) return null;
    const dowTotals = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts = [0, 0, 0, 0, 0, 0, 0];
    data.trends.daily_tickets.forEach((d) => {
      const dow = new Date(d.date).getDay();
      dowTotals[dow] += d.count;
      dowCounts[dow]++;
    });
    const dowAvg = dowTotals.map((t, i) => (dowCounts[i] > 0 ? t / dowCounts[i] : 0));
    const maxIdx = dowAvg.indexOf(Math.max(...dowAvg));
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return { day: dayNames[maxIdx], avg: dowAvg[maxIdx].toFixed(1) };
  }, [data]);

  // CSV export
  const handleExport = useCallback(() => {
    if (!data) return;
    const lines = [
      "분석 대시보드 리포트",
      `기간,${startDate},~,${endDate}`,
      "",
      "=== 요약 ===",
      `총 문의,${data.tickets.total}`,
      `진행중,${data.tickets.pending}`,
      `보류,${data.tickets.answered}`,
      `완료,${data.tickets.closed}`,
      `미배정,${data.tickets.unassigned}`,
      `해결률,${data.tickets.resolution_rate}%`,
      `평균 응답 시간(분),${data.tickets.avg_response_time_min}`,
      `평균 처리 시간(분),${data.tickets.avg_processing_time_min}`,
      `FAQ 총 조회수,${data.faq.total_views}`,
      "",
      "=== 일별 데이터 ===",
      "날짜,문의 수,FAQ 조회수",
      ...data.trends.daily_tickets.map(
        (d, i) => `${d.date},${d.count},${data.trends.daily_faq_views[i]?.count ?? ""}`,
      ),
      "",
      "=== 인기 FAQ ===",
      "순위,제목,조회수",
      ...data.faq.top_faqs.map((f, i) => `${i + 1},"${f.title}",${f.views}`),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, startDate, endDate]);

  // Smart insights engine
  const insights = useMemo(() => {
    if (!data) return [];
    const list: { severity: "critical" | "warning" | "info" | "success"; icon: React.ReactNode; text: string }[] = [];
    const t = data.tickets;

    // Unassigned
    if (t.unassigned > 0 && t.unassigned / (t.total || 1) > 0.15) {
      list.push({
        severity: "critical",
        icon: <ErrorOutlineIcon sx={{ fontSize: 18, color: "#EF4444" }} />,
        text: `미배정 문의가 ${t.unassigned}건(${Math.round((t.unassigned / (t.total || 1)) * 100)}%)입니다. 담당자 배정을 즉시 진행해주세요.`,
      });
    } else if (t.unassigned > 0) {
      list.push({
        severity: "warning",
        icon: <PersonOffIcon sx={{ fontSize: 18, color: "#F97316" }} />,
        text: `${t.unassigned}건의 미배정 문의가 있습니다. 빠른 배정으로 응답 시간을 단축하세요.`,
      });
    }

    // Response time
    if (t.avg_response_time_min > 120) {
      list.push({
        severity: "critical",
        icon: <AccessTimeIcon sx={{ fontSize: 18, color: "#EF4444" }} />,
        text: `평균 응답 시간이 ${formatTime(t.avg_response_time_min)}으로 매우 깁니다. AI 자동 응답 또는 인원 보강을 검토하세요.`,
      });
    } else if (t.avg_response_time_min > 30) {
      list.push({
        severity: "warning",
        icon: <AccessTimeIcon sx={{ fontSize: 18, color: "#F97316" }} />,
        text: `평균 응답 시간 ${formatTime(t.avg_response_time_min)}. 30분 이내 첫 응답을 목표로 개선해보세요.`,
      });
    } else if (t.avg_response_time_min > 0 && t.avg_response_time_min <= 15) {
      list.push({
        severity: "success",
        icon: <AccessTimeIcon sx={{ fontSize: 18, color: "#22C55E" }} />,
        text: `평균 응답 시간 ${formatTime(t.avg_response_time_min)}으로 매우 우수한 응답 속도입니다!`,
      });
    }

    // Resolution rate
    if (t.resolution_rate >= 85) {
      list.push({
        severity: "success",
        icon: <CheckCircleIcon sx={{ fontSize: 18, color: "#22C55E" }} />,
        text: `해결률 ${t.resolution_rate}%로 뛰어난 성과입니다. 현재 수준을 유지해주세요.`,
      });
    } else if (t.resolution_rate < 50 && t.total > 0) {
      list.push({
        severity: "critical",
        icon: <WarningAmberIcon sx={{ fontSize: 18, color: "#EF4444" }} />,
        text: `해결률이 ${t.resolution_rate}%로 낮습니다. 미해결 문의를 검토하고 원인을 분석해보세요.`,
      });
    } else if (t.resolution_rate < 70 && t.total > 0) {
      list.push({
        severity: "warning",
        icon: <WarningAmberIcon sx={{ fontSize: 18, color: "#F97316" }} />,
        text: `해결률 ${t.resolution_rate}%. 70% 이상을 목표로 미해결 문의 원인을 파악해보세요.`,
      });
    }

    // Self-service
    if (selfServiceRate > 60) {
      list.push({
        severity: "success",
        icon: <ArticleIcon sx={{ fontSize: 18, color: "#22C55E" }} />,
        text: `셀프서비스 비율 ${selfServiceRate}%로 FAQ가 효과적으로 활용되고 있습니다.`,
      });
    } else if (selfServiceRate < 30 && data.faq.total_views > 0) {
      list.push({
        severity: "info",
        icon: <ArticleIcon sx={{ fontSize: 18, color: "#3B82F6" }} />,
        text: `셀프서비스 비율이 ${selfServiceRate}%로 낮습니다. FAQ 콘텐츠를 보강하면 문의량을 줄일 수 있습니다.`,
      });
    }

    // Peak day spike
    if (peakDay && peakDay.count > (t.total / periodDays) * 2) {
      list.push({
        severity: "info",
        icon: <TrendingUpIcon sx={{ fontSize: 18, color: "#3B82F6" }} />,
        text: `${peakDay.date}에 ${peakDay.count}건으로 일평균 대비 ${((peakDay.count / (t.total / periodDays)) * 100 - 100).toFixed(0)}% 급증했습니다.`,
      });
    }

    // Trend comparison
    if (changes.total !== undefined) {
      if ((changes.total as number) > 20) {
        list.push({
          severity: "warning",
          icon: <TrendingUpIcon sx={{ fontSize: 18, color: "#F97316" }} />,
          text: `이전 기간 대비 문의량이 ${changes.total}% 증가했습니다. 원인 분석이 필요합니다.`,
        });
      } else if ((changes.total as number) < -20) {
        list.push({
          severity: "success",
          icon: <TrendingDownIcon sx={{ fontSize: 18, color: "#22C55E" }} />,
          text: `이전 기간 대비 문의량이 ${Math.abs(changes.total as number)}% 감소했습니다.`,
        });
      }
    }

    // Busiest day of week
    if (busiestDow) {
      list.push({
        severity: "info",
        icon: <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3B82F6" }} />,
        text: `${busiestDow.day}요일이 가장 바쁜 요일입니다 (평균 ${busiestDow.avg}건/일). 해당 요일에 인력 배치를 강화하세요.`,
      });
    }

    // Processing speed
    if (t.avg_processing_time_min > 0 && t.avg_processing_time_min <= 30) {
      list.push({
        severity: "success",
        icon: <SpeedIcon sx={{ fontSize: 18, color: "#22C55E" }} />,
        text: `평균 처리 시간 ${formatTime(t.avg_processing_time_min)}으로 빠른 처리가 이루어지고 있습니다.`,
      });
    }

    return list;
  }, [data, selfServiceRate, peakDay, changes, busiestDow, periodDays]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <Box sx={{ height: "100%", bgcolor: "background.default", overflow: "auto", p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Skeleton variant="text" width={200} height={36} />
            <Skeleton variant="text" width={300} height={20} />
          </Box>
          <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2, mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
        <Typography color="error">데이터를 불러올 수 없습니다</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", bgcolor: "background.default", overflow: "auto", p: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", mb: 0.25 }}>분석 대시보드</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            {startDate} ~ {endDate} · {periodDays}일간 고객 지원 분석
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <ButtonGroup size="small" variant="outlined">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                onClick={() => applyRange(r.key)}
                variant={range === r.key && !customMode ? "contained" : "outlined"}
                sx={{ fontSize: "0.75rem", px: 1.5, fontWeight: 600 }}
              >
                {r.label}
              </Button>
            ))}
          </ButtonGroup>
          {customMode ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setRange("custom");
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 140, "& input": { fontSize: "0.8rem" } }}
              />
              <Typography sx={{ color: "text.secondary" }}>~</Typography>
              <TextField
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setRange("custom");
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 140, "& input": { fontSize: "0.8rem" } }}
              />
            </Box>
          ) : (
            <Button size="small" variant="text" onClick={() => setCustomMode(true)} sx={{ fontSize: "0.75rem" }}>
              기간 직접 설정
            </Button>
          )}
          <Tooltip title="CSV 내보내기">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
              onClick={handleExport}
              sx={{ fontSize: "0.75rem" }}
            >
              내보내기
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Performance Score Banner ── */}
      {grade && (
        <Card sx={{ mb: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <ScoreGauge grade={grade} />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
                종합 성과 점수
                <Chip label={grade.grade} size="small" sx={{ ml: 1, fontWeight: 800, bgcolor: `${grade.color}20`, color: grade.color }} />
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", lineHeight: 1.6 }}>
                응답 시간 · 해결률 · 배정률 · 처리 속도 기반 종합 평가입니다.
                {grade.score >= 80 && " 현재 훌륭한 고객 서비스를 제공하고 있습니다."}
                {grade.score >= 60 && grade.score < 80 && " 일부 지표 개선이 필요합니다."}
                {grade.score < 60 && " 즉각적인 개선 조치가 필요합니다."}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              {[
                { label: "응답", val: formatTime(data.tickets.avg_response_time_min), color: "#3B82F6" },
                { label: "해결", val: `${data.tickets.resolution_rate}%`, color: "#22C55E" },
                {
                  label: "배정",
                  val: `${Math.round(((data.tickets.total - data.tickets.unassigned) / (data.tickets.total || 1)) * 100)}%`,
                  color: "#F97316",
                },
                { label: "처리", val: formatTime(data.tickets.avg_processing_time_min), color: "#8B5CF6" },
              ].map((m) => (
                <Box key={m.label} sx={{ textAlign: "center", px: 1.5 }}>
                  <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.25 }}>{m.label}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: m.color }}>{m.val}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Primary KPI Cards ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="총 문의"
            value={data.tickets.total}
            change={changes.total}
            icon={<ChatIcon sx={{ fontSize: 20 }} />}
            color="#3B82F6"
            subtitle={`일 평균 ${(data.tickets.total / periodDays).toFixed(1)}건`}
            sparkData={ticketSparkline}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="평균 응답 시간"
            value={formatTime(data.tickets.avg_response_time_min)}
            change={changes.responseTime !== undefined ? -(changes.responseTime as number) : undefined}
            icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
            color="#F97316"
            subtitle="첫 답변까지"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="평균 처리 시간"
            value={formatTime(data.tickets.avg_processing_time_min)}
            change={changes.processingTime !== undefined ? -(changes.processingTime as number) : undefined}
            icon={<TimerIcon sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            subtitle="완료까지"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="해결률"
            value={`${data.tickets.resolution_rate}%`}
            change={changes.resolution}
            icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
            color="#22C55E"
            subtitle={`${data.tickets.closed}/${data.tickets.total} 완료`}
          />
        </Grid>
      </Grid>

      {/* ── Secondary KPI Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="미배정 문의"
            value={data.tickets.unassigned}
            change={changes.unassigned !== undefined ? -(changes.unassigned as number) : undefined}
            icon={<PendingIcon sx={{ fontSize: 20 }} />}
            color="#EF4444"
            subtitle="즉시 배정 필요"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="FAQ 조회수"
            value={data.faq.total_views.toLocaleString()}
            change={changes.faqViews}
            icon={<VisibilityIcon sx={{ fontSize: 20 }} />}
            color="#06B6D4"
            subtitle={`일 평균 ${(data.faq.total_views / periodDays).toFixed(1)}회`}
            sparkData={faqSparkline}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="진행중 문의"
            value={data.tickets.pending}
            change={changes.pending !== undefined ? -(changes.pending as number) : undefined}
            icon={<SupportAgentIcon sx={{ fontSize: 20 }} />}
            color="#F97316"
            subtitle="답변 대기중"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="셀프서비스율"
            value={`${selfServiceRate}%`}
            icon={<ArticleIcon sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            subtitle="FAQ로 해결된 비율 추정"
          />
        </Grid>
      </Grid>

      {/* ── Trend Charts ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <AreaChart
            data={data.trends.daily_tickets}
            prevData={prevData?.trends.daily_tickets}
            title="일별 문의 추이"
            color="#3B82F6"
            id="tickets"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DonutChart data={statusData} title="문의 상태 분포" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <AreaChart
            data={data.trends.daily_faq_views}
            prevData={prevData?.trends.daily_faq_views}
            title="일별 FAQ 조회 추이"
            color="#8B5CF6"
            id="faq"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <HorizBarChart data={faqData} title="인기 FAQ TOP 8" />
        </Grid>
      </Grid>

      {/* ── Insights ── */}
      {insights.length > 0 && (
        <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>인사이트 & 권장 사항</Typography>
              <Chip label={`${insights.length}개`} size="small" sx={{ fontSize: "0.7rem", height: 22, fontWeight: 600 }} />
            </Box>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {insights.map((ins, i) => (
                <InsightItem key={i} severity={ins.severity} icon={ins.icon}>
                  {ins.text}
                </InsightItem>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ height: 24 }} />
    </Box>
  );
}
