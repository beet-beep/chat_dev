import React from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import InsertEmoticonOutlinedIcon from "@mui/icons-material/InsertEmoticonOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import TextFieldsOutlinedIcon from "@mui/icons-material/TextFieldsOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  adminAddTicketNote,
  adminGetTicket,
  adminListAgents,
  adminCreateInboxView,
  adminDeleteInboxView,
  adminDeleteTicket,
  adminGetCustomer,
  adminListInboxViews,
  adminListPresetChannels,
  adminListPresetTeams,
  adminListTicketNotes,
  adminListTickets,
  adminMe,
  adminPatchCustomer,
  adminPatchInboxView,
  adminSetTicketMeta,
  adminSetTicketStatus,
  adminBulkSetTicketStatus,
  adminStaffReplyWithFiles,
  adminMarkTicketSeen,
  adminAiGenerateReply,
  adminCreateAiLibraryItem,
  adminAiEnhanceLibraryItem,
} from "../../../api/support";
import { apiFetch } from "../../../api/client";
import { AdminInboxSidebar, type InboxSidebarPreset } from "../components/AdminInboxSidebar";
import { AdminRightSidebar } from "../components/AdminRightSidebar";
import { ChatThread, type ChatMessage } from "../../../ui/chat/ChatThread";
import { useChatAutoScroll } from "../../../ui/chat/useChatAutoScroll";
import { AttachmentPreview } from "../../../ui/chat/AttachmentPreview";
import { useDropFiles } from "../../../ui/chat/useDropFiles";
import { getSeenAt, markSeen } from "../../../ui/chat/seen";
import { connectTicketWS, connectAdminInboxWS, sendTyping, type TicketRealtimeEvent } from "../../../api/realtime";
import { loadTemplates, type ReplyTemplate } from "./AdminTemplatesPage";

type InboxView = {
  id: string; // "local_..." or "server_123"
  name: string;
  q: string;
  statusTab: "PENDING" | "ANSWERED" | "CLOSED" | "ALL";
  tagFilter: string;
  assigneeFilter: "ALL" | "UNASSIGNED" | string;
  priorityFilter: "ALL" | "LOW" | "NORMAL" | "HIGH" | "URGENT";
  channelFilter: "ALL" | string;
  entryFilter?: "ALL" | "category_guide" | "direct_compose" | "unknown" | string;
  sortBy?: "WAIT" | "UPDATED" | "CREATED";
  sortDir?: "DESC" | "ASC";
};

const INBOX_VIEWS_KEY = "joody_admin_inbox_views_v1";

function loadInboxViews(): InboxView[] {
  try {
    const raw = localStorage.getItem(INBOX_VIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInboxViews(views: InboxView[]) {
  try {
    localStorage.setItem(INBOX_VIEWS_KEY, JSON.stringify(views));
  } catch {
    // ignore
  }
}

type AdminTicket = {
  id: number;
  title: string;
  body: string;
  status: "PENDING" | "ANSWERED" | "CLOSED";
  status_label: string;
  created_at: string;
  category: { id: number; name: string; order: number } | null;
  replies: {
    id: number;
    body: string;
    author_name: string;
    author?: { id: number | null; name: string; avatar_url?: string; is_staff?: boolean };
    author_is_staff?: boolean;
    created_at: string;
    attachments?: any[];
  }[];
  attachments?: any[];
  user_email: string;
  user_name: string;
  user_id: number;
  user_uuid?: string;
  user_avatar_url?: string;
  user_seen_at?: string | null;
  staff_seen_at?: string | null;
  user_has_seen_latest_staff?: boolean;
  assignee_id?: number | null;
  priority?: string;
  tags?: string[];
  channel?: string;
  team?: string;
  entry_source?: string;
  user_device?: string;
  user_locale?: string;
  user_location?: string;
  reopened_at?: string | null;
};

export function AdminInboxPage() {
  const theme = useTheme();
  const isXl = useMediaQuery(theme.breakpoints.up("xl"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const [navOpen, setNavOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AdminTicket[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  // resizable columns (xl only)
  // Defaults requested:
  // - left sidebar: 250
  // - inbox list: 300
  // - right sidebar: 320
  const INBOX_COLS_KEY = "admin_inbox_cols_v3";
  const [colW, setColW] = useState<{ sidebar: number; list: number; right: number }>({ sidebar: 250, list: 300, right: 320 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INBOX_COLS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.sidebar === "number" && typeof parsed.list === "number" && typeof parsed.right === "number") {
        setColW({
          sidebar: Math.max(200, Math.min(420, parsed.sidebar)),
          list: Math.max(260, Math.min(560, parsed.list)),
          right: Math.max(240, Math.min(520, parsed.right)),
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(INBOX_COLS_KEY, JSON.stringify(colW));
    } catch {
      // ignore
    }
  }, [colW]);

  function startResize(which: "sidebar" | "list" | "right", e: React.MouseEvent) {
    if (!isXl) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const start = { ...colW };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (which === "sidebar") {
        setColW((prev) => ({ ...prev, sidebar: Math.max(200, Math.min(420, start.sidebar + dx)) }));
      } else if (which === "list") {
        setColW((prev) => ({ ...prev, list: Math.max(260, Math.min(560, start.list + dx)) }));
      } else {
        setColW((prev) => ({ ...prev, right: Math.max(240, Math.min(520, start.right - dx)) }));
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState<string>("");
  const [aiSource, setAiSource] = useState<"openrouter" | "gemini" | "heuristic" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"reply" | "internal">("reply");
  const [userTyping, setUserTyping] = useState<{ name: string; at: number } | null>(null);
  const wsRef = useMemo(() => ({ current: null as WebSocket | null }), []);
  const typingOffTimer = useMemo(() => ({ current: null as number | null }), []);
  const [statusTab, setStatusTab] = useState<"PENDING" | "ANSWERED" | "CLOSED" | "ALL">("PENDING");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<"ALL" | "UNASSIGNED" | string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "NORMAL" | "HIGH" | "URGENT">("ALL");
  const [channelFilter, setChannelFilter] = useState<"ALL" | string>("ALL");
  const [entryFilter, setEntryFilter] = useState<"ALL" | "category_guide" | "direct_compose" | "unknown" | string>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"WAIT" | "UPDATED" | "CREATED">("WAIT");
  const [sortDir, setSortDir] = useState<"DESC" | "ASC">("DESC");
  const [views, setViews] = useState<InboxView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>("");
  const [viewScope, setViewScope] = useState<"PERSONAL" | "TEAM">("PERSONAL");
  const [customer, setCustomer] = useState<null | {
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
  }>(null);
  const [customerDraft, setCustomerDraft] = useState<{ tagsText: string; notes: string }>({ tagsText: "", notes: "" });
  const [notes, setNotes] = useState<any[] | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [metaDraft, setMetaDraft] = useState<{ priority: string; channel: string; team: string; tagsText: string }>({
    priority: "NORMAL",
    channel: "inapp",
    team: "",
    tagsText: "",
  });
  const [agents, setAgents] = useState<{ id: number; email: string; name: string; avatar_url?: string; status_message?: string }[]>([]);
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [adminMeObj, setAdminMeObj] = useState<any | null>(null);
  const [presetTags, setPresetTags] = useState<{ id: number; name: string; color: string; is_active: boolean }[]>([]);
  const [presetChannels, setPresetChannels] = useState<{ id: number; key: string; label: string; is_active: boolean }[]>([]);
  const [presetTeams, setPresetTeams] = useState<{ id: number; key: string; label: string; is_active: boolean }[]>([]);

  // Bulk actions (multi-select)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [bulkAssignAnchor, setBulkAssignAnchor] = useState<null | HTMLElement>(null);
  const [bulkTagAnchor, setBulkTagAnchor] = useState<null | HTMLElement>(null);
  const [primaryTab, setPrimaryTab] = useState<"ALL" | "UNREAD" | "MINE">("ALL");

  // 템플릿 시스템
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateSelectedIdx, setTemplateSelectedIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [aiAutoSuggest, setAiAutoSuggest] = useState(() => localStorage.getItem("admin_ai_auto_suggest") === "true");
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const templateJustAppliedRef = useRef<boolean>(false);
  const templateApplyingRef = useRef<boolean>(false);  // 템플릿 적용 중 onChange 차단용
  const replyValueRef = useRef<string>("");  // IME 조합 중 최신 값 추적용

  // 템플릿 로드
  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // 필터된 템플릿
  const filteredTemplates = useMemo(() => {
    if (!templateQuery) return templates.slice(0, 8);
    const q = templateQuery.toLowerCase();
    return templates.filter((t) =>
      t.shortcut.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [templates, templateQuery]);

  // 알림 소리 재생 함수 (설정에서 끄면 재생하지 않음)
  const playNotificationSound = () => {
    try {
      // Check localStorage setting
      const soundEnabled = localStorage.getItem("admin_notification_sound") !== "false";
      if (!soundEnabled) return;

      // Web Audio API를 사용하여 알림음 생성
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 150);
    } catch (e) {
      // Audio not supported
    }
  };

  // 키보드 단축키 (refs 사용하여 의존성 문제 해결)
  const activeRef = useRef<AdminTicket | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const adminUserIdRef = useRef<number | null>(null);
  const filteredRef = useRef<AdminTicket[] | null>(null);

  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const currentActive = activeRef.current;
      const currentActiveId = activeIdRef.current;
      const currentAdminUserId = adminUserIdRef.current;
      const currentFiltered = filteredRef.current;

      // R: 답장 포커스
      if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setComposerMode("reply");
        replyInputRef.current?.focus();
      }
      // E: 상담 종료
      if (e.key === "e" && !e.ctrlKey && !e.metaKey && currentActive) {
        e.preventDefault();
        if (currentActive.status !== "CLOSED") {
          adminSetTicketStatus(currentActive.id, "CLOSED").then(() => refresh()).catch(() => {});
        }
      }
      // A: 나에게 배정
      if (e.key === "a" && !e.ctrlKey && !e.metaKey && currentActive && currentAdminUserId && !currentActive.assignee_id) {
        e.preventDefault();
        adminSetTicketMeta(currentActive.id, { assignee_id: currentAdminUserId }).then(() => refresh()).catch(() => {});
      }
      // J: 다음 티켓
      if (e.key === "j" && !e.ctrlKey && !e.metaKey && currentFiltered) {
        e.preventDefault();
        const idx = currentFiltered.findIndex((t) => t.id === currentActiveId);
        if (idx < currentFiltered.length - 1) {
          setActiveId(currentFiltered[idx + 1].id);
        }
      }
      // K: 이전 티켓
      if (e.key === "k" && !e.ctrlKey && !e.metaKey && currentFiltered) {
        e.preventDefault();
        const idx = currentFiltered.findIndex((t) => t.id === currentActiveId);
        if (idx > 0) {
          setActiveId(currentFiltered[idx - 1].id);
        }
      }
      // N: 내부 노트 모드
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setComposerMode("internal");
        replyInputRef.current?.focus();
      }
      // ?: 단축키 도움말 토글
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
      // Escape: 단축키 도움말 닫기
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    try {
      ws = connectAdminInboxWS();
      if (!ws) return;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "ticket_created") {
            const ticket = msg.ticket as AdminTicket;
            setItems((prev) => {
              const base = prev ?? [];
              if (base.some(t => t.id === ticket.id)) return base;
              return [ticket, ...base];
            });
            // 새 문의 알림 소리 재생
            playNotificationSound();
          } else if (msg.type === "ticket_updated") {
            const { ticket_id, delta } = msg;
            setItems((prev) => {
              if (!prev) return prev;
              return prev.map(t => t.id === ticket_id ? { ...t, ...delta } : t);
            });
          } else if (msg.type === "new_reply") {
            // 새 답변 알림 소리 재생 (고객 답변만)
            if (msg.author_type !== "staff") {
              playNotificationSound();
            }
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
    return () => {
      closed = true;
      if (ws) ws.close();
    };
  }, []);

  async function refresh() {
    setError(null);
    try {
      const res = await adminListTickets();
      const data = res.results as unknown as AdminTicket[];
      setItems(data);
      // IMPORTANT: never override user's current selection due to stale-closure polling.
      // If current selection is missing (e.g. deleted), fall back to the first ticket.
      setActiveId((prev) => {
        if (prev && data.some((t) => t.id === prev)) return prev;
        return data.length ? data[0].id : null;
      });
    } catch (e: any) {
      // 백엔드 오류/권한 오류가 나도 렌더가 죽지 않도록 안전 처리
      setError(String(e?.message ?? e));
      setItems([]);
    }
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e?.message ?? e)));
    // Realtime (WS) + fallback polling
    let poll: number | null = null;
    const startPolling = () => {
      if (poll) return;
      poll = window.setInterval(() => refresh().catch(() => {}), 8000);
    };
    // we connect WS per active ticket; list-level updates still have polling fallback
    startPolling();
    return () => {
      if (poll) window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let ws: WebSocket | null = null;
    let closed = false;
    try {
      ws = connectTicketWS(activeId, "admin_token");
      wsRef.current = ws;
      if (!ws) return;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as TicketRealtimeEvent;
          if (msg.type === "reply" && msg.ticket_id === activeId && msg.reply?.id) {
            // If user replied, refresh customer info to update cumulative spend/tags
            if (!msg.reply.author_is_staff && msg.reply.author_name !== "운영자" && active) {
              adminGetCustomer(active.user_id)
                .then((c) => setCustomer(c))
                .catch(() => {});
            }
            setItems((prev) => {
              if (!prev) return prev;
              return prev.map((t) => {
                if (t.id !== activeId) return t;
                const exists = (t.replies ?? []).some((r: any) => r.id === msg.reply.id);
                if (exists) return t;
                return { ...t, replies: [...(t.replies ?? []), msg.reply] } as any;
              });
            });
          } else if (msg.type === "reply" && msg.ticket_id && msg.reply?.id) {
            // update list item if reply belongs to another ticket
            setItems((prev) => {
              if (!prev) return prev;
              return prev.map((t) => {
                if (t.id !== msg.ticket_id) return t;
                const exists = (t.replies ?? []).some((r: any) => r.id === msg.reply.id);
                if (exists) return t;
                return { ...t, replies: [...(t.replies ?? []), msg.reply] } as any;
              });
            });
          }
          if (msg.type === "seen" && msg.ticket_id && msg.user_seen_at) {
            setItems((prev) => {
              if (!prev) return prev;
              return prev.map((t) => (t.id === msg.ticket_id ? ({ ...t, user_seen_at: msg.user_seen_at } as any) : t));
            });
          }
          if (msg.type === "typing" && msg.ticket_id === activeId) {
            const isStaff = Boolean(msg.author?.is_staff);
            // show only user typing to staff
            if (isStaff) return;
            if (msg.is_typing) setUserTyping({ name: msg.author?.name || "사용자", at: Date.now() });
            else setUserTyping(null);
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (closed) return;
      };
    } catch {
      // ignore
    }
    return () => {
      closed = true;
      if (ws) ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [activeId]);

  // typing indicator: send to user (only in reply mode)
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    if (composerMode !== "reply") {
      sendTyping(ws, false);
      return;
    }
    const hasText = reply.trim().length > 0;
    sendTyping(ws, hasText);
    if (typingOffTimer.current) window.clearTimeout(typingOffTimer.current);
    if (hasText) {
      typingOffTimer.current = window.setTimeout(() => {
        sendTyping(wsRef.current, false);
      }, 1400);
    }
  }, [reply, composerMode]);

  useEffect(() => {
    // 1) 서버 뷰 먼저 로드 (계정별)
    adminListInboxViews()
      .then((rows) => {
        const mapped: InboxView[] = rows.map((r) => {
          const cfg = r.config || {};
          return {
            id: `server_${r.id}`,
            name: r.scope === "TEAM" ? `[팀] ${r.name}` : r.name,
            q: cfg.q ?? "",
            statusTab: cfg.statusTab ?? "PENDING",
            tagFilter: cfg.tagFilter ?? "ALL",
            assigneeFilter: cfg.assigneeFilter ?? "ALL",
            priorityFilter: cfg.priorityFilter ?? "ALL",
            channelFilter: cfg.channelFilter ?? "ALL",
            entryFilter: cfg.entryFilter ?? "ALL",
            sortBy: cfg.sortBy ?? "WAIT",
            sortDir: cfg.sortDir ?? "DESC",
          };
        });
        if (mapped.length) {
          setViews(mapped);
          setActiveViewId(mapped[0].id);
          return;
        }
        // 2) 서버에 없으면 local fallback
        const local = loadInboxViews();
        if (local.length) {
          setViews(local);
          setActiveViewId(local[0]?.id ?? "");
          return;
        }
        // 3) 아무것도 없으면 기본값 생성(로컬)
        const defaults: InboxView[] = [
          { id: "local_pending", name: "진행중", q: "", statusTab: "PENDING", tagFilter: "ALL", assigneeFilter: "ALL", priorityFilter: "ALL", channelFilter: "ALL", entryFilter: "ALL", sortBy: "WAIT", sortDir: "DESC" },
          { id: "local_unassigned", name: "미배정", q: "", statusTab: "PENDING", tagFilter: "ALL", assigneeFilter: "UNASSIGNED", priorityFilter: "ALL", channelFilter: "ALL", entryFilter: "ALL", sortBy: "WAIT", sortDir: "DESC" },
          { id: "local_answered", name: "답변완료", q: "", statusTab: "ANSWERED", tagFilter: "ALL", assigneeFilter: "ALL", priorityFilter: "ALL", channelFilter: "ALL", entryFilter: "ALL", sortBy: "UPDATED", sortDir: "DESC" },
        ];
        setViews(defaults);
        setActiveViewId(defaults[0].id);
        saveInboxViews(defaults);
      })
      .catch(() => {
        const local = loadInboxViews();
        if (local.length) {
          setViews(local);
          setActiveViewId(local[0]?.id ?? "");
          return;
        }
        const defaults: InboxView[] = [
          { id: "local_pending", name: "진행중", q: "", statusTab: "PENDING", tagFilter: "ALL", assigneeFilter: "ALL", priorityFilter: "ALL", channelFilter: "ALL", entryFilter: "ALL", sortBy: "WAIT", sortDir: "DESC" },
        ];
        setViews(defaults);
        setActiveViewId(defaults[0].id);
        saveInboxViews(defaults);
      });
  }, []);

  useEffect(() => {
    adminListAgents()
      .then((a) => setAgents(a))
      .catch(() => setAgents([]));
    adminMe()
      .then((me: any) => {
        setAdminUserId(me?.id ?? null);
        setAdminMeObj(me);
      })
      .catch(() => {
        setAdminUserId(null);
        setAdminMeObj(null);
      });
    apiFetch<any[]>("/admin/ticket-tags/", {}, "admin_token")
      .then((t) => {
        // Flatten parent + children tags
        const allTags: any[] = [];
        (t ?? []).forEach((parent: any) => {
          allTags.push({ id: parent.id, name: parent.name, color: parent.color, is_active: true, order: parent.order });
          if (parent.children) {
            parent.children.forEach((child: any) => {
              allTags.push({ id: child.id, name: `${parent.name}/${child.name}`, color: child.color, is_active: true, order: child.order });
            });
          }
        });
        setPresetTags(allTags.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id));
      })
      .catch(() => setPresetTags([]));
    adminListPresetChannels()
      .then((c) => setPresetChannels((c ?? []).filter((x) => x.is_active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)))
      .catch(() => setPresetChannels([]));
    adminListPresetTeams()
      .then((t) => setPresetTeams((t ?? []).filter((x) => x.is_active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)))
      .catch(() => setPresetTeams([]));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!items) return null;
    let data = items;
    if (statusTab !== "ALL") data = data.filter((t) => t.status === statusTab);
    if (tagFilter !== "ALL") {
      if (tagFilter === "__NONE__") data = data.filter((t) => !(t.tags?.length));
      else data = data.filter((t) => (t.tags ?? []).map((x) => String(x)).includes(tagFilter));
    }
    if (assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") data = data.filter((t) => !t.assignee_id);
      else data = data.filter((t) => String(t.assignee_id ?? "") === assigneeFilter);
    }
    if (priorityFilter !== "ALL") data = data.filter((t) => String((t.priority || "NORMAL")).toUpperCase() === priorityFilter);
    if (channelFilter !== "ALL") data = data.filter((t) => String(t.channel || "inapp") === channelFilter);
    if (entryFilter !== "ALL") {
      if (entryFilter === "unknown") data = data.filter((t) => !String(t.entry_source || "").trim());
      else data = data.filter((t) => String(t.entry_source || "") === entryFilter);
    }
    if (s) data = data.filter((t) => `${t.title} ${t.user_email} ${t.user_name}`.toLowerCase().includes(s));

    // Primary tabs: ALL / UNREAD / MINE
    if (primaryTab === "UNREAD") {
      data = data.filter((t) => {
        const seenAt = getSeenAt(t.id);
        const lastAnyAt = ticketTimes(t).lastAnyAt;
        return !seenAt || lastAnyAt > new Date(seenAt).getTime();
      });
    }
    if (primaryTab === "MINE") {
      if (adminUserId) data = data.filter((t) => Number(t.assignee_id || 0) === Number(adminUserId));
      else data = [];
    }

    const dir = sortDir === "DESC" ? 1 : -1;
    const sorted = [...data].sort((a, b) => {
      const ta = ticketTimes(a);
      const tb = ticketTimes(b);
      if (sortBy === "CREATED") return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * dir;
      if (sortBy === "UPDATED") return (tb.lastAnyAt - ta.lastAnyAt) * dir;
      // WAIT: needsReply 우선 + 대기시간 큰 것부터 (새 문의는 상단에 표시)
      const aNeeds = ta.lastUserAt > ta.lastStaffAt && a.status !== "CLOSED";
      const bNeeds = tb.lastUserAt > tb.lastStaffAt && b.status !== "CLOSED";
      if (aNeeds !== bNeeds) return (aNeeds ? -1 : 1) * dir;
      // 대기 중인 티켓: 최근 생성된 것이 상단에 (새 문의 우선)
      if (aNeeds && bNeeds) {
        return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * dir;
      }
      // 답변 완료 티켓: 최근 업데이트된 것이 상단에
      return (tb.lastAnyAt - ta.lastAnyAt) * dir;
    });
    return sorted;
  }, [items, q, statusTab, tagFilter, assigneeFilter, priorityFilter, channelFilter, entryFilter, sortBy, sortDir, primaryTab, adminUserId]);

  const mineCount = useMemo(() => {
    const base = items ?? [];
    if (!adminUserId) return 0;
    // 완료(CLOSED) 제외 - 진행중인 내 상담만 카운트
    return base.filter((t) => Number(t.assignee_id || 0) === Number(adminUserId) && t.status !== "CLOSED").length;
  }, [items, adminUserId]);

  const filteredIds = useMemo(() => (filtered ?? []).map((t) => t.id), [filtered]);
  const allSelected = useMemo(() => {
    if (!selectionMode) return false;
    if (!filteredIds.length) return false;
    return filteredIds.every((id) => selectedIds.includes(id));
  }, [selectionMode, filteredIds, selectedIds]);
  const someSelected = useMemo(() => {
    if (!selectionMode) return false;
    return filteredIds.some((id) => selectedIds.includes(id));
  }, [selectionMode, filteredIds, selectedIds]);

  function toggleSelectAll() {
    if (!filteredIds.length) return;
    setSelectedIds((prev) => {
      const set = new Set(prev);
      const all = filteredIds.every((id) => set.has(id));
      if (all) {
        for (const id of filteredIds) set.delete(id);
      } else {
        for (const id of filteredIds) set.add(id);
      }
      return Array.from(set);
    });
  }

  async function bulkSetStatus(next: "PENDING" | "ANSWERED" | "CLOSED") {
    if (!selectedIds.length) return;
    // Close menu immediately for better UX (menu is already closed via onClick handler)
    setActionAnchor(null);
    setBusy(true);
    setError(null);
    try {
      await adminBulkSetTicketStatus(selectedIds, next);
      const label = next === "PENDING" ? "대기중" : next === "ANSWERED" ? "답변완료" : "종료";
      setItems((prev) => {
        if (!prev) return prev;
        const set = new Set(selectedIds);
        return prev.map((t) => (set.has(t.id) ? ({ ...t, status: next, status_label: label } as any) : t));
      });
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function bulkAssign(agentId: number | null) {
    if (!selectedIds.length) return;
    // Close menus immediately for better UX
    setBulkAssignAnchor(null);
    setActionAnchor(null);
    setBusy(true);
    setError(null);
    try {
      for (const id of selectedIds) {
        await adminSetTicketMeta(id, { assignee_id: agentId });
      }
      setItems((prev) => {
        if (!prev) return prev;
        const set = new Set(selectedIds);
        return prev.map((t) => set.has(t.id) ? ({ ...t, assignee: agentId, assignee_id: agentId } as any) : t);
      });
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function bulkAddTag(tagName: string) {
    if (!selectedIds.length) return;
    // Close menus immediately for better UX
    setBulkTagAnchor(null);
    setActionAnchor(null);
    setBusy(true);
    setError(null);
    try {
      for (const id of selectedIds) {
        const ticket = items?.find((t) => t.id === id);
        if (!ticket) continue;
        // Use tags array - the backend expects tags: string[]
        const existingTags: string[] = Array.isArray(ticket.tags) ? ticket.tags : [];
        if (!existingTags.includes(tagName)) {
          const newTags = [...existingTags, tagName];
          await adminSetTicketMeta(id, { tags: newTags });
        }
      }
      // Refresh items - adminListTickets returns { results: [...] }
      const res = await adminListTickets();
      const data = (res as any).results ?? res;
      setItems(data as AdminTicket[]);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    if (!window.confirm(`${selectedIds.length}개의 상담을 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    // Close menu immediately
    setActionAnchor(null);
    setBusy(true);
    setError(null);
    try {
      for (const id of selectedIds) {
        await adminDeleteTicket(id);
      }
      setItems((prev) => {
        if (!prev) return prev;
        const set = new Set(selectedIds);
        return prev.filter((t) => !set.has(t.id));
      });
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const channelCounts = useMemo(() => {
    const base = items ?? [];
    const map = new Map<string, number>();
    for (const t of base) {
      const k = String(t.channel || "inapp");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const entryCounts = useMemo(() => {
    const base = items ?? [];
    const map = new Map<string, number>();
    for (const t of base) {
      const k = String((t.entry_source || "").trim() || "unknown");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const formatAge = (ms: number) => {
    const m = Math.max(0, Math.floor(ms / 60000));
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}일 전`;
    return new Date(Date.now() - ms).toLocaleDateString("ko-KR");
  };

  function ticketTimes(t: AdminTicket) {
    let lastUserAt = new Date(t.created_at).getTime();
    let lastStaffAt = 0;
    let lastAnyAt = new Date(t.created_at).getTime();
    for (const r of t.replies ?? []) {
      const ts = new Date(r.created_at).getTime();
      lastAnyAt = Math.max(lastAnyAt, ts);
      if (r.author_name === "운영자") lastStaffAt = Math.max(lastStaffAt, ts);
      else lastUserAt = Math.max(lastUserAt, ts);
    }
    return { lastUserAt, lastStaffAt, lastAnyAt };
  }

  // Keep the conversation open even if current ticket is filtered out of the list.
  const active = useMemo(() => items?.find((t) => t.id === activeId) ?? null, [items, activeId]);

  // 키보드 단축키용 refs 업데이트
  useEffect(() => {
    activeRef.current = active;
    activeIdRef.current = activeId;
    adminUserIdRef.current = adminUserId;
    filteredRef.current = filtered;
  }, [active, activeId, adminUserId, filtered]);

  const thread = useMemo(() => {
    if (!active) return [];
    const out: ChatMessage[] = [];
    // Current user's avatar for staff messages
    const myAvatarUrl = adminMeObj?.profile?.avatar_url || "";
    const myName = adminMeObj?.profile?.display_name || adminMeObj?.first_name || adminMeObj?.email || "상담원";

    out.push({
      kind: "msg",
      author: { id: active.user_id, name: active.user_name, avatar_url: active.user_avatar_url || "", is_staff: false },
      body: active.body,
      created_at: active.created_at,
      attachments: active.attachments ?? [],
    });
    for (const r of active.replies ?? []) {
      const isStaff = Boolean(r.author_is_staff) || r.author_name === "운영자" || Boolean(r.author?.is_staff);
      // Use current user's avatar if this is my reply and author avatar is empty
      const isMyReply = r.author?.id === adminUserId || (r.author?.id == null && isStaff && adminUserId);
      const authorAvatar = r.author?.avatar_url || (isMyReply && isStaff ? myAvatarUrl : "");
      const authorName = r.author?.name || r.author_name || (isMyReply && isStaff ? myName : "상담원");
      out.push({
        kind: "msg",
        author: r.author ? { ...r.author, avatar_url: r.author.avatar_url || (isMyReply ? myAvatarUrl : "") } : { id: null, name: authorName, avatar_url: authorAvatar, is_staff: isStaff },
        body: r.body,
        created_at: r.created_at,
        attachments: r.attachments ?? [],
      });
    }
    for (const n of notes ?? []) {
      out.push({
        kind: "note",
        author: { id: null, name: "내부 노트", avatar_url: "", is_staff: true },
        body: String(n?.body ?? ""),
        created_at: String(n?.created_at ?? ""),
        attachments: [],
      });
    }
    out.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // read receipt (admin only): mark the latest staff message as read when user_seen_at >= message time
    try {
      const seenAt = active.user_seen_at ? new Date(active.user_seen_at).getTime() : 0;
      if (seenAt) {
        let lastStaffIdx = -1;
        let lastStaffAt = 0;
        for (let i = 0; i < out.length; i++) {
          const m = out[i];
          const isStaffMsg = Boolean(m.author?.is_staff);
          if (!isStaffMsg || (m.kind ?? "msg") !== "msg") continue;
          const ts = new Date(m.created_at).getTime();
          if (ts >= lastStaffAt) {
            lastStaffAt = ts;
            lastStaffIdx = i;
          }
        }
        if (lastStaffIdx >= 0) {
          out[lastStaffIdx].read_by_other = seenAt >= lastStaffAt;
        }
      }
    } catch {
      // ignore
    }
    return out;
  }, [active, notes, adminMeObj, adminUserId]);

  // admin-side: mark staff seen (not visible to user)
  useEffect(() => {
    if (!active?.id) return;
    adminMarkTicketSeen(active.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const chatScroll = useChatAutoScroll(thread);
  const drop = useDropFiles((list) => setReplyFiles((prev) => [...prev, ...list]));

  useEffect(() => {
    if (!active) return;
    const last = thread[thread.length - 1];
    if (last?.created_at) markSeen(active.id, last.created_at);
  }, [active?.id, thread.length]);

  // AI 자동 추천: 티켓 전환 시 답변이 필요한 경우 자동으로 AI 답변 생성
  useEffect(() => {
    if (!aiAutoSuggest || !active || aiBusy || reply.trim()) return;
    if (active.status === "CLOSED") return;
    // Only auto-suggest if last message is from user (needs reply)
    const times = ticketTimes(active);
    if (times.lastStaffAt >= times.lastUserAt) return;
    // Delay slightly to avoid rapid-fire on fast ticket switching
    const timer = setTimeout(() => {
      onAiGenerate();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, aiAutoSuggest]);

  async function onSend() {
    if (!active) return;
    // 내부 메모: 텍스트 필수 / 고객응대: 텍스트 또는 파일 있어야 함
    if (composerMode === "internal") {
      if (!reply.trim()) return;
    } else {
      if (!reply.trim() && replyFiles.length === 0) return;
    }
    setSendBusy(true);
    setError(null);
    try {
      if (composerMode === "internal") {
        await adminAddTicketNote(active.id, reply.trim());
        setReply(""); replyValueRef.current = "";
        setAiGeneratedDraft("");
        setAiSource(null);
        const n = await adminListTicketNotes(active.id);
        setNotes(n);
        setSnackMsg("내부 노트 저장됨");
      } else {
        // 텍스트 없이 파일만 보내는 경우도 허용
        await adminStaffReplyWithFiles(active.id, { body: reply.trim() || "", files: replyFiles });
        setReply(""); replyValueRef.current = "";
        setReplyFiles([]);
        setAiGeneratedDraft("");
        setAiSource(null);
        await refresh();
        setSnackMsg("메시지 전송 완료");
        // 메시지 전송 후 해당 티켓을 리스트 최상단으로 이동
        setItems((prev) => {
          if (!prev) return prev;
          const idx = prev.findIndex((t) => t.id === active.id);
          if (idx <= 0) return prev; // 이미 최상단이거나 없음
          const ticket = prev[idx];
          return [ticket, ...prev.filter((t) => t.id !== active.id)];
        });
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSendBusy(false);
    }
  }

  async function onSendAndClose() {
    if (!active) return;
    if (composerMode === "internal") {
      await onSend();
      return;
    }
    if (!reply.trim() && replyFiles.length === 0) return;
    setSendBusy(true);
    setError(null);
    try {
      await adminStaffReplyWithFiles(active.id, { body: reply.trim() || "", files: replyFiles });
      setReply(""); replyValueRef.current = "";
      setReplyFiles([]);
      setAiGeneratedDraft("");
      setAiSource(null);
      await adminSetTicketStatus(active.id, "CLOSED");
      await refresh();
      setSnackMsg("전송 & 상담 종료 완료");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSendBusy(false);
    }
  }

  async function onSetStatus(next: "PENDING" | "ANSWERED" | "CLOSED") {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await adminSetTicketStatus(active.id, next);
      await refresh();
      const label = next === "PENDING" ? "진행중" : next === "ANSWERED" ? "답변완료" : "종료";
      setSnackMsg(`상태 변경: ${label}`);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveMeta() {
    if (!active) return;
    const tags = metaDraft.tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    setError(null);
    try {
      await adminSetTicketMeta(active.id, { priority: metaDraft.priority, channel: metaDraft.channel, team: metaDraft.team, tags });
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(assigneeId: number | null) {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await adminSetTicketMeta(active.id, { assignee_id: assigneeId });
      await refresh();
      const name = assigneeId ? agents.find((a) => a.id === assigneeId)?.name || "담당자" : "미배정";
      setSnackMsg(assigneeId ? `${name}에게 배정됨` : "배정 해제됨");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onQuickMeta(input: Partial<{ priority: string; channel: string; team: string; tags: string[] }>) {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await adminSetTicketMeta(active.id, input);
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onAddNote() {
    if (!active) return;
    const body = noteDraft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      await adminAddTicketNote(active.id, body);
      setNoteDraft("");
      const n = await adminListTicketNotes(active.id);
      setNotes(n);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!active) {
      setCustomer(null);
      setNotes(null);
      return;
    }
    adminGetCustomer(active.user_id)
      .then((c) => {
        setCustomer(c);
        setCustomerDraft({
          tagsText: Array.isArray(c?.tags) ? c.tags.join(",") : "",
          notes: c?.notes ?? "",
        });
      })
      .catch(() => setCustomer(null));

    adminListTicketNotes(active.id)
      .then((n) => setNotes(n))
      .catch(() => setNotes([]));

    setMetaDraft({
      priority: active.priority || "NORMAL",
      channel: active.channel || "inapp",
      team: active.team || "",
      tagsText: Array.isArray(active.tags) ? active.tags.join(",") : "",
    });
  }, [active?.id]); // Changed from active?.user_id to active?.id

  const activeSla = useMemo(() => {
    if (!active) return null;
    const t = ticketTimes(active);
    const needsReply = t.lastUserAt > t.lastStaffAt && active.status !== "CLOSED";
    const waitMs = Date.now() - t.lastUserAt;
    const level = !needsReply ? "OK" : waitMs >= 60 * 60 * 1000 ? "DANGER" : waitMs >= 10 * 60 * 1000 ? "WARN" : "OK";
    return {
      needsReply,
      level,
      waitText: needsReply ? `미응답 ${formatAge(waitMs)}` : `마지막 활동 ${formatAge(Date.now() - t.lastAnyAt)}`,
    };
  }, [active]);

  useEffect(() => {
    if (!activeViewId) return;
    const v = views.find((x) => x.id === activeViewId);
    if (!v) return;
    setQ(v.q);
    setStatusTab(v.statusTab);
    setTagFilter(v.tagFilter);
    setAssigneeFilter(v.assigneeFilter);
    setPriorityFilter(v.priorityFilter);
    setChannelFilter(v.channelFilter);
    setEntryFilter(v.entryFilter ?? "ALL");
    if (v.sortBy) setSortBy(v.sortBy);
    if (v.sortDir) setSortDir(v.sortDir);
  }, [activeViewId]);

  async function saveCurrentView() {
    const name = window.prompt("저장할 뷰 이름을 입력해 주세요");
    if (!name) return;
    const config = { q, statusTab, tagFilter, assigneeFilter, priorityFilter, channelFilter, entryFilter, sortBy, sortDir };
    // server first
    try {
      const created = await adminCreateInboxView({ name, config, scope: viewScope });
      const id = `server_${created.id}`;
      const v: InboxView = { id, name: created.name, ...config };
      const next = [v, ...views];
      setViews(next);
      setActiveViewId(id);
      return;
    } catch {
      // local fallback
      const id = `local_${Date.now()}`;
      const next: InboxView[] = [{ id, name, ...config }, ...views];
      setViews(next);
      setActiveViewId(id);
      saveInboxViews(next);
    }
  }

  async function deleteActiveView() {
    if (!activeViewId) return;
    const v = views.find((x) => x.id === activeViewId);
    if (!v) return;
    if (!window.confirm(`뷰 "${v.name}"를 삭제할까요?`)) return;
    if (activeViewId.startsWith("server_")) {
      const idNum = Number(activeViewId.replace("server_", ""));
      try {
        await adminDeleteInboxView(idNum);
      } catch {
        // ignore
      }
    } else {
      // local only
      const nextLocal = views.filter((x) => !x.id.startsWith("server_"));
      saveInboxViews(nextLocal);
    }
    const next = views.filter((x) => x.id !== activeViewId);
    setViews(next);
    setActiveViewId(next[0]?.id ?? "");
  }

  // URL sync: state -> query
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("q", q);
    next.set("status", statusTab);
    next.set("tag", tagFilter);
    next.set("assignee", assigneeFilter);
    next.set("priority", priorityFilter);
    next.set("channel", channelFilter);
    next.set("entry", entryFilter || "ALL");
    next.set("sortBy", sortBy);
    next.set("sortDir", sortDir);
    next.set("mode", composerMode);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusTab, tagFilter, assigneeFilter, priorityFilter, channelFilter, entryFilter, sortBy, sortDir, composerMode]);

  // URL sync: query -> state (on first mount or navigation)
  useEffect(() => {
    const qp = searchParams;
    const qv = qp.get("q");
    const st = qp.get("status") as any;
    const tg = qp.get("tag");
    const asg = qp.get("assignee");
    const pr = qp.get("priority") as any;
    const ch = qp.get("channel");
    const ent = qp.get("entry");
    const sb = qp.get("sortBy") as any;
    const sd = qp.get("sortDir") as any;
    const md = qp.get("mode") as any;
    if (qv !== null) setQ(qv);
    if (st) setStatusTab(st);
    if (tg) setTagFilter(tg);
    if (asg) setAssigneeFilter(asg);
    if (pr) setPriorityFilter(pr);
    if (ch) setChannelFilter(ch);
    if (ent) setEntryFilter(ent);
    if (sb) setSortBy(sb);
    if (sd) setSortDir(sd);
    if (md) setComposerMode(md);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveCustomer() {
    if (!customer) return;
    const tags = customerDraft.tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    setError(null);
    try {
      const updated = await adminPatchCustomer(customer.id, { tags, notes: customerDraft.notes });
      setCustomer(updated);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const userHistory = useMemo(() => {
    if (!items || !active) return [];
    return items.filter((t) => t.user_email === active.user_email).slice(0, 20);
  }, [items, active?.user_email]);

  async function onAiGenerate() {
    if (!active?.id) return;
    setAiBusy(true);
    setError(null);
    setAiSource(null);
    try {
      const res = await adminAiGenerateReply(active.id);
      setReply(res.reply);
      replyValueRef.current = res.reply || "";
      setAiGeneratedDraft(res.reply || "");
      setAiSource(res.source || "heuristic");
      setComposerMode("reply");
      setSnackMsg(`AI 답변 생성 완료 (${res.source === "openrouter" ? "Gemini Pro" : res.source === "gemini" ? "Gemini" : "AI"})`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setAiBusy(false);
    }
  }

  async function onAiSaveToLibrary() {
    if (!active?.id) return;
    const finalText = reply.trim();
    if (!finalText) {
      setError("저장할 답변이 없어요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const context = `제목: ${active.title}\n\n문의 내용:\n${active.body}`;

      // AI를 활용하여 학습 데이터 정제
      let enhancedTags: string[] = [];
      try {
        const enhanceResult = await adminAiEnhanceLibraryItem({
          context,
          generated_reply: aiGeneratedDraft || "",
          final_reply: finalText,
        });
        if (enhanceResult.success && enhanceResult.enhanced?.keywords) {
          enhancedTags = enhanceResult.enhanced.keywords;
        }
      } catch {
        // Enhancement failed, continue without it
      }

      await adminCreateAiLibraryItem({
        ticket: active.id,
        title: `[티켓 #${active.id}] ${active.title}`.slice(0, 200),
        context,
        generated_reply: aiGeneratedDraft || "",
        final_reply: finalText,
        tags: enhancedTags,
      });
      setSnackMsg("AI 학습 라이브러리에 저장 완료" + (enhancedTags.length > 0 ? ` (${enhancedTags.join(", ")})` : ""));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const statusCounts = useMemo(() => {
    const base = items ?? [];
    return {
      ALL: base.length,
      PENDING: base.filter((t) => t.status === "PENDING").length,
      ANSWERED: base.filter((t) => t.status === "ANSWERED").length,
      CLOSED: base.filter((t) => t.status === "CLOSED").length,
    };
  }, [items]);

  const tagCounts = useMemo(() => {
    const base = items ?? [];
    const map = new Map<string, number>();
    for (const t of base) {
      for (const raw of (t.tags ?? []) as any[]) {
        const k = String(raw || "").trim();
        if (!k) continue;
        map.set(k, (map.get(k) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const preset: InboxSidebarPreset = useMemo(() => {
    if (statusTab === "CLOSED") return "closed";
    if (statusTab === "ANSWERED") return "answered";
    if (statusTab === "PENDING" && assigneeFilter === "UNASSIGNED") return "unassigned";
    if (statusTab === "PENDING") return "pending";
    return "all";
  }, [statusTab, assigneeFilter]);

  const sidebarCounts = useMemo(() => {
    const base = items ?? [];
    const unassigned = base.filter((t) => t.status === "PENDING" && !t.assignee_id).length;
    const unread = base.filter((t) => {
      const seenAt = getSeenAt(t.id);
      const lastAnyAt = ticketTimes(t).lastAnyAt;
      return !seenAt || lastAnyAt > new Date(seenAt).getTime();
    }).length;
    // "전체" = 진행중인 티켓만 (완료 제외)
    const activeCount = statusCounts.PENDING + statusCounts.ANSWERED;
    return {
      all: activeCount,
      pending: statusCounts.PENDING,
      answered: statusCounts.ANSWERED,
      closed: statusCounts.CLOSED,
      unassigned,
      unread,
    };
  }, [items, statusCounts]);

  function onSelectSidebarPreset(k: InboxSidebarPreset) {
    if (k === "all") {
      setStatusTab("ALL");
      setAssigneeFilter("ALL");
      return;
    }
    if (k === "pending") {
      setStatusTab("PENDING");
      setAssigneeFilter("ALL");
      return;
    }
    if (k === "answered") {
      setStatusTab("ANSWERED");
      setAssigneeFilter("ALL");
      return;
    }
    if (k === "unassigned") {
      setStatusTab("PENDING");
      setAssigneeFilter("UNASSIGNED");
      return;
    }
    if (k === "closed") {
      setStatusTab("CLOSED");
      setAssigneeFilter("ALL");
      return;
    }
  }

  // 커스텀 스크롤바 스타일
  const scrollbarStyles = {
    "&::-webkit-scrollbar": {
      width: 6,
      height: 6,
    },
    "&::-webkit-scrollbar-track": {
      bgcolor: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      bgcolor: "rgba(100, 116, 139, 0.3)",
      borderRadius: 3,
      transition: "background-color 0.2s",
      "&:hover": {
        bgcolor: "rgba(100, 116, 139, 0.5)",
      },
    },
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(100, 116, 139, 0.3) transparent",
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: isXl
          ? `${colW.sidebar}px 8px ${colW.list}px 8px minmax(520px, 1fr) 8px ${colW.right}px`
          : {
              xs: "1fr",
              md: "minmax(320px, 420px) minmax(420px, 1fr)",
              lg: "minmax(240px, 280px) minmax(320px, 420px) minmax(420px, 1fr)",
              xl: "minmax(240px, 280px) minmax(320px, 420px) minmax(420px, 1fr) minmax(350px, 390px)",
            },
        bgcolor: "background.default",
        overflow: "hidden",
        "& > *": { minWidth: 0 },
        // 전체 스크롤바 스타일 적용
        "& *": scrollbarStyles,
      }}
    >
      <Drawer
        anchor="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: "background.paper" } }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 0 }}>
          <AdminInboxSidebar
            me={adminMeObj}
            agents={agents}
            primaryTab={primaryTab}
            onSelectPrimaryTab={(t) => setPrimaryTab(t)}
            mineCount={mineCount}
            preset={preset}
            counts={sidebarCounts}
            onSelectPreset={onSelectSidebarPreset}
            searchQuery={q}
            onSearchChange={setQ}
            tagFilter={tagFilter}
            tagCounts={tagCounts}
            onSelectTag={(t) => setTagFilter(t)}
            presetTags={presetTags}
            views={views.map((v) => ({ id: v.id, name: v.name }))}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            viewScope={viewScope}
            onChangeScope={setViewScope}
            onSaveView={saveCurrentView}
            onDeleteView={deleteActiveView}
            disableDelete={
              activeViewId.startsWith("local_") &&
              (activeViewId === "local_pending" ||
                activeViewId === "local_unassigned" ||
                activeViewId === "local_answered")
            }
          />
        </Box>
      </Drawer>

      {/* sidebar: channels/tags */}
      <Box sx={{ gridColumn: isXl ? "1 / 2" : "auto", display: { xs: "none", lg: "block" } }}>
        <AdminInboxSidebar
          me={adminMeObj}
          agents={agents}
          primaryTab={primaryTab}
          onSelectPrimaryTab={(t) => setPrimaryTab(t)}
          mineCount={mineCount}
          preset={preset}
          counts={sidebarCounts}
          onSelectPreset={onSelectSidebarPreset}
          searchQuery={q}
          onSearchChange={setQ}
          tagFilter={tagFilter}
          tagCounts={tagCounts}
          onSelectTag={(t) => setTagFilter(t)}
          presetTags={presetTags}
          views={views.map((v) => ({ id: v.id, name: v.name }))}
          activeViewId={activeViewId}
          onSelectView={setActiveViewId}
          viewScope={viewScope}
          onChangeScope={setViewScope}
          onSaveView={saveCurrentView}
          onDeleteView={deleteActiveView}
          disableDelete={
            activeViewId.startsWith("local_") &&
            (activeViewId === "local_pending" ||
              activeViewId === "local_unassigned" ||
              activeViewId === "local_answered")
          }
        />
      </Box>

      {isXl ? (
        <Box
          onMouseDown={(e) => startResize("sidebar", e)}
          sx={{
            gridColumn: "2 / 3",
            cursor: "col-resize",
            bgcolor: "transparent",
            "&:hover": { bgcolor: "rgba(249,115,22,0.18)" },
          }}
        />
      ) : null}

      {/* list */}
      <Box
        sx={{
          gridColumn: isXl ? "3 / 4" : "auto",
          bgcolor: "background.paper",
          borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.06)" },
          boxShadow: { xs: "none", md: "1px 0 8px rgba(0,0,0,0.08)" },
          minWidth: 0,
          // On small screens, switch between list and conversation based on selection id (not derived active object).
          display: { xs: activeId ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box sx={{ p: 1.5, display: "grid", gap: 1.5 }}>
          {/* Selection mode header - Zendesk/Channel Talk style */}
          {selectionMode ? (
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 1.5,
              px: 1.5,
              py: 1,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={() => toggleSelectAll()}
                  sx={{ color: "#22C55E", "&.Mui-checked": { color: "#22C55E" } }}
                />
                <Typography sx={{ fontWeight: 900, fontSize: "0.9rem", color: "#22C55E" }}>
                  {selectedIds.length}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={(e) => setActionAnchor(e.currentTarget)}
                  sx={{
                    bgcolor: "#22C55E",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    borderRadius: 1,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#16A34A" }
                  }}
                >
                  액션
                </Button>
              </Box>
              <Button
                size="small"
                onClick={() => { setSelectionMode(false); setSelectedIds([]); }}
                sx={{ color: "text.secondary", fontWeight: 900, fontSize: "0.8rem", minWidth: 0 }}
              >
                취소
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: "1rem" }}>수신함</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", fontWeight: 900 }}>
                  {filtered ? filtered.length : 0}
                </Typography>
                {filtered && (() => {
                  const unreadCount = filtered.filter((t) => {
                    const seenAt = getSeenAt(t.id);
                    let lastAnyAt = new Date(t.created_at).toISOString();
                    for (const r of t.replies ?? []) {
                      if (new Date(r.created_at).toISOString() > lastAnyAt) lastAnyAt = new Date(r.created_at).toISOString();
                    }
                    return !seenAt || new Date(lastAnyAt).getTime() > new Date(seenAt).getTime();
                  }).length;
                  return unreadCount > 0 ? (
                    <Chip
                      label={`안읽음 ${unreadCount}`}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: "#EF4444",
                        color: "#fff",
                        fontWeight: 900,
                        fontSize: "0.75rem",
                        "& .MuiChip-label": { px: 1 }
                      }}
                    />
                  ) : null;
                })()}
              </Box>
              <Button
                size="small"
                variant="text"
                sx={{ fontWeight: 900, color: "text.secondary", fontSize: "0.85rem" }}
                onClick={() => setSelectionMode(true)}
              >
                선택
              </Button>
            </Box>
          )}

          {/* Bulk Action Menu - Enhanced */}
          <Menu
            anchorEl={actionAnchor}
            open={Boolean(actionAnchor)}
            onClose={() => setActionAnchor(null)}
            PaperProps={{ sx: { borderRadius: 2, minWidth: 220, p: 0.5 } }}
          >
            {/* 담당자 배정 */}
            <MenuItem
              onClick={(e) => { setBulkAssignAnchor(e.currentTarget); }}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1.25, display: "flex", justifyContent: "space-between" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <PersonOutlineOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                담당자 배정
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "text.secondary", transform: "rotate(-90deg)" }} />
            </MenuItem>

            {/* 태그 수정 */}
            <MenuItem
              onClick={(e) => { setBulkTagAnchor(e.currentTarget); }}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1.25, display: "flex", justifyContent: "space-between" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "text.secondary" }} />
                </Box>
                상담 태그 수정
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "text.secondary", transform: "rotate(-90deg)" }} />
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            {/* 상태 변경 */}
            <MenuItem
              onClick={() => { bulkSetStatus("ANSWERED"); setActionAnchor(null); }}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1.25 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                </Box>
                상담 보류
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => { bulkSetStatus("CLOSED"); setActionAnchor(null); }}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1.25 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22C55E" }} />
                </Box>
                상담 종료
              </Box>
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => bulkDelete()}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1.25, color: "#EF4444" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                  🗑️
                </Box>
                상담 영구 삭제
              </Box>
            </MenuItem>
          </Menu>

          {/* 담당자 배정 서브메뉴 */}
          <Menu
            anchorEl={bulkAssignAnchor}
            open={Boolean(bulkAssignAnchor)}
            onClose={() => setBulkAssignAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{ sx: { borderRadius: 2, minWidth: 200, p: 0.5, ml: 0.5 } }}
          >
            <MenuItem
              onClick={() => bulkAssign(null)}
              sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1 }}
            >
              담당자 없음
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            {agents.map((agent) => (
              <MenuItem
                key={agent.id}
                onClick={() => bulkAssign(agent.id)}
                sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar src={agent.avatar_url} sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                    {(agent.name || agent.email || "A").slice(0, 1)}
                  </Avatar>
                  {agent.name || agent.email}
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* 태그 추가 서브메뉴 */}
          <Menu
            anchorEl={bulkTagAnchor}
            open={Boolean(bulkTagAnchor)}
            onClose={() => setBulkTagAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{ sx: { borderRadius: 2, minWidth: 180, p: 0.5, ml: 0.5, maxHeight: 300 } }}
          >
            {presetTags.filter(t => t.is_active).map((tag) => (
              <MenuItem
                key={tag.id}
                onClick={() => bulkAddTag(tag.name)}
                sx={{ fontWeight: 600, fontSize: "0.9rem", borderRadius: 1, py: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: tag.color || "#888" }} />
                  {tag.name}
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* Tabs at the top */}
          <Box sx={{ display: "flex", gap: 0.5, bgcolor: "rgba(255,255,255,0.04)", p: 0.5, borderRadius: 1.5 }}>
            {([
              { k: "pending", label: "진행중", count: sidebarCounts.pending },
              { k: "answered", label: "보류", count: sidebarCounts.answered },
              { k: "closed", label: "완료", count: sidebarCounts.closed },
            ] as const).map((it) => (
              <Button
                key={it.k}
                fullWidth
                size="small"
                onClick={() => onSelectSidebarPreset(it.k as any)}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: preset === it.k ? "rgba(59,130,246,0.2)" : "transparent",
                  color: preset === it.k ? "#93C5FD" : "text.secondary",
                  boxShadow: preset === it.k ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                  "&:hover": { bgcolor: preset === it.k ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.06)" }
                }}
              >
                {it.label} {it.count}
              </Button>
            ))}
          </Box>

          {/* Filter summary chips (only if filters active) */}
          {(tagFilter !== "ALL" || assigneeFilter !== "ALL" || priorityFilter !== "ALL" || channelFilter !== "ALL" || entryFilter !== "ALL") && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
              {tagFilter !== "ALL" && (
                <Chip size="small" label={tagFilter} onDelete={() => setTagFilter("ALL")} sx={{ height: 22, fontSize: 11, fontWeight: 900 }} />
              )}
              {assigneeFilter !== "ALL" && (
                <Chip size="small" label="담당자 필터" onDelete={() => setAssigneeFilter("ALL")} sx={{ height: 22, fontSize: 11, fontWeight: 900 }} />
              )}
              <Button size="small" variant="text" sx={{ fontSize: 11, fontWeight: 900, minWidth: 0, p: 0 }} onClick={() => {
                setTagFilter("ALL"); setAssigneeFilter("ALL"); setPriorityFilter("ALL"); setChannelFilter("ALL"); setEntryFilter("ALL");
              }}>초기화</Button>
            </Box>
          )}
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
        <List dense sx={{ overflow: "auto", flex: 1, minHeight: 0, p: 1.5, pt: 1 }}>
          {!filtered ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>불러오는 중…</Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>결과가 없어요.</Box>
          ) : (
            filtered.map((t) => {
              const selected = t.id === activeId;
              const isChecked = selectedIds.includes(t.id);
              const last = t.replies && t.replies.length ? t.replies[t.replies.length - 1]?.body : t.body;
              const pri = (t.priority || "NORMAL").toUpperCase();
              const priColor =
                pri === "URGENT"
                  ? "#DC2626"
                  : pri === "HIGH"
                  ? "#B45309"
                  : pri === "LOW"
                  ? "#64748B"
                  : "rgba(255,255,255,0.7)";
              const lastUserAt = (() => {
                let ts = new Date(t.created_at).getTime();
                for (const r of t.replies ?? []) {
                  if (r.author_name !== "운영자") ts = Math.max(ts, new Date(r.created_at).getTime());
                }
                return ts;
              })();
              const lastStaffAt = (() => {
                let ts = 0;
                for (const r of t.replies ?? []) {
                  if (r.author_name === "운영자") ts = Math.max(ts, new Date(r.created_at).getTime());
                }
                return ts;
              })();
              const seenAt = getSeenAt(t.id);
              const lastAnyAt = (() => {
                let ts = new Date(t.created_at).toISOString();
                for (const r of t.replies ?? []) {
                  if (new Date(r.created_at).toISOString() > ts) ts = new Date(r.created_at).toISOString();
                }
                return ts;
              })();
              const isUnread = !seenAt || new Date(lastAnyAt).getTime() > new Date(seenAt).getTime();
              const tag = t.category?.name ?? "문의";
              // 상담 태그 (첫번째만)
              const ticketTag = (t.tags && t.tags.length > 0) ? String(t.tags[0]) : null;
              const ticketTagColor = ticketTag ? (presetTags.find((pt) => pt.name === ticketTag)?.color || "") : "";

              return (
                <Box key={t.id} sx={{ mb: 0.75, position: "relative" }}>
                  {/* 우선순위 좌측 인디케이터 */}
                  {(pri === "URGENT" || pri === "HIGH") && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 4,
                        bottom: 4,
                        width: 4,
                        borderRadius: "4px 0 0 4px",
                        bgcolor: pri === "URGENT" ? "#DC2626" : "#F97316",
                        animation: pri === "URGENT" ? "pulse-bar 1.5s ease-in-out infinite" : "none",
                        "@keyframes pulse-bar": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.5 }
                        },
                        zIndex: 1,
                      }}
                    />
                  )}
                  <ListItemButton
                    selected={selected}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelected(t.id);
                        return;
                      }
                      setActiveId(t.id);
                    }}
                    sx={{
                      alignItems: "flex-start",
                      border: "1px solid",
                      borderColor: selected ? "rgba(59,130,246,0.4)" : isChecked ? "rgba(249,115,22,0.35)" : pri === "URGENT" ? "rgba(220,38,38,0.3)" : pri === "HIGH" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      bgcolor: selected ? "rgba(59,130,246,0.12)" : isChecked ? "rgba(249,115,22,0.08)" : pri === "URGENT" ? "rgba(220,38,38,0.06)" : pri === "HIGH" ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.02)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: selected ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
                        borderColor: selected ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.12)",
                        transform: "translateX(2px)",
                      },
                      py: 1.25,
                      px: 1.5,
                      pl: (pri === "URGENT" || pri === "HIGH") ? 2 : 1.5,
                      gap: 1.5,
                    }}
                  >
                    {selectionMode ? (
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleSelected(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ mr: 0.5, mt: 0.25, p: 0 }}
                        size="small"
                      />
                    ) : null}
                    {/* 썸네일 좌측 */}
                    <Avatar
                      src={t.user_avatar_url || undefined}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: "rgba(37,99,235,0.08)",
                        color: "#2563EB",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {t.user_name?.slice(0, 1) || "U"}
                    </Avatar>
                    <ListItemText
                      sx={{ m: 0, minWidth: 0 }}
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", mb: 0.25 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                            {isUnread && (
                              <Box sx={{ width: 7, height: 7, bgcolor: "#EF4444", borderRadius: "50%", flexShrink: 0 }} />
                            )}
                            <Typography sx={{ fontWeight: isUnread ? 700 : 600, fontSize: "0.9rem", color: "#FAFAFA" }} noWrap>
                              {t.user_name}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 500, flexShrink: 0 }} noWrap>
                            {formatAge(Date.now() - new Date(t.created_at).getTime())}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "grid", gap: 0.5 }}>
                          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.4 }} noWrap>
                            {last || "내용 없음"}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                            {/* 카테고리 */}
                            <Chip
                              size="small"
                              label={tag}
                              sx={{
                                height: 18,
                                fontWeight: 600,
                                bgcolor: "rgba(37,99,235,0.12)",
                                color: "#60A5FA",
                                fontSize: "0.7rem",
                                borderRadius: 0.75,
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                            {/* 상담 태그 (색상 적용) */}
                            {ticketTag && (
                              <Chip
                                size="small"
                                label={ticketTag}
                                sx={{
                                  height: 18,
                                  fontWeight: 600,
                                  bgcolor: ticketTagColor || "rgba(168,85,250,0.15)",
                                  color: ticketTagColor ? "#fff" : "#A855F7",
                                  fontSize: "0.7rem",
                                  borderRadius: 0.75,
                                  "& .MuiChip-label": { px: 0.75 },
                                }}
                              />
                            )}
                            {/* 우선순위 표시 */}
                            {pri !== "NORMAL" && (
                              <Chip
                                size="small"
                                label={pri === "URGENT" ? "긴급" : pri === "HIGH" ? "높음" : "낮음"}
                                sx={{
                                  height: 18,
                                  fontWeight: 700,
                                  bgcolor: pri === "URGENT" ? "rgba(220,38,38,0.15)" : pri === "HIGH" ? "rgba(249,115,22,0.12)" : "rgba(100,116,139,0.1)",
                                  color: pri === "URGENT" ? "#DC2626" : pri === "HIGH" ? "#F97316" : "#64748B",
                                  fontSize: "0.65rem",
                                  borderRadius: 0.75,
                                  "& .MuiChip-label": { px: 0.5 },
                                }}
                              />
                            )}
                            {isUnread ? (
                              <Chip
                                size="small"
                                label="NEW"
                                sx={{
                                  height: 18,
                                  fontWeight: 700,
                                  bgcolor: "#EF4444",
                                  color: "#fff",
                                  fontSize: "0.65rem",
                                  borderRadius: 0.75,
                                  "& .MuiChip-label": { px: 0.5 },
                                }}
                              />
                            ) : null}
                            {t.reopened_at ? (
                              <Chip
                                size="small"
                                label="재오픈"
                                sx={{
                                  height: 18,
                                  fontWeight: 700,
                                  bgcolor: "rgba(251,146,60,0.2)",
                                  color: "#FB923C",
                                  fontSize: "0.65rem",
                                  borderRadius: 0.75,
                                  "& .MuiChip-label": { px: 0.5 },
                                }}
                              />
                            ) : null}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </Box>
              );
            })
          )}
        </List>
      </Box>

      {isXl ? (
        <Box
          onMouseDown={(e) => startResize("list", e)}
          sx={{
            gridColumn: "4 / 5",
            cursor: "col-resize",
            bgcolor: "transparent",
            "&:hover": { bgcolor: "rgba(249,115,22,0.18)" },
          }}
        />
      ) : null}

      {/* center: conversation */}
      <Box
        sx={{
          gridColumn: isXl ? "5 / 6" : "auto",
          bgcolor: "background.default",
          // Use activeId so the composer/header can render immediately (prevents "input missing" while active object is loading).
          display: { xs: activeId ? "flex" : "none", md: "flex" },
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(37,99,235,0.02)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", minHeight: 40 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setNavOpen(true)}
                sx={{ display: { xs: "inline-flex", md: "none" } }}
                aria-label="menu"
              >
                <MenuIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setActiveId(null)}
                sx={{ display: { xs: active ? "inline-flex" : "none", md: "none" } }}
                aria-label="back"
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              maxWidth: "60%",
              width: "100%",
              pointerEvents: "none",
            }}>
              <Typography sx={{ fontWeight: 900, color: "#2563EB", fontSize: "1.05rem" }} noWrap>
                {active ? active.title : "대화"}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setFiltersOpen(true)}
                sx={{ display: { xs: "inline-flex", lg: "none" } }}
                aria-label="filters"
                title="필터"
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setCustomerOpen(true)}
                sx={{ display: { xs: "inline-flex", xl: "none" } }}
                aria-label="customer"
                title="고객 정보"
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {active ? (
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              {/* 티켓 ID와 상태 */}
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                <Chip
                  size="small"
                  label={`#${active.id}`}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                  }}
                />
                {userTyping ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "rgba(37,99,235,0.1)", px: 1.5, py: 0.5, borderRadius: 2 }}>
                    <Box sx={{
                      width: 8, height: 8, bgcolor: "#2563EB", borderRadius: "50%",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.4 }
                      }
                    }} />
                    <Typography variant="caption" sx={{ color: "#2563EB", fontWeight: 900 }}>
                      {userTyping.name} 님이 입력중…
                    </Typography>
                  </Box>
                ) : null}
                {/* 우선순위 표시 */}
                {active.priority && active.priority !== "NORMAL" && (
                  <Chip
                    size="small"
                    icon={<PriorityHighIcon sx={{ fontSize: 14 }} />}
                    label={active.priority === "URGENT" ? "긴급" : active.priority === "HIGH" ? "높음" : "낮음"}
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      bgcolor: active.priority === "URGENT" ? "rgba(220,38,38,0.15)" : active.priority === "HIGH" ? "rgba(249,115,22,0.15)" : "rgba(100,116,139,0.15)",
                      color: active.priority === "URGENT" ? "#DC2626" : active.priority === "HIGH" ? "#F97316" : "#64748B",
                      border: "1px solid",
                      borderColor: active.priority === "URGENT" ? "rgba(220,38,38,0.3)" : active.priority === "HIGH" ? "rgba(249,115,22,0.3)" : "rgba(100,116,139,0.3)",
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                )}
              </Box>

            </Box>
          ) : null}
          {error ? (
            <Typography sx={{ mt: 1, color: "#FCA5A5", textAlign: "center" }} variant="body2">
              {error}
            </Typography>
          ) : null}
        </Box>

        {/* body: message scroller + composer (composer must never disappear) */}
        <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 1, minHeight: 0, overflow: "hidden" }}>
          {!active ? (
            <Typography sx={{ color: "text.secondary" }}>
              {activeId ? "불러오는 중…" : "선택된 티켓이 없어요."}
            </Typography>
          ) : (
            <React.Fragment>
              <Box sx={{ position: "relative", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {!chatScroll.isAtBottom && chatScroll.unread > 0 ? (
                <Button
                  size="small"
                  variant="contained"
                  sx={{ position: "absolute", right: 0, top: -8, zIndex: 2, fontWeight: 900 }}
                  onClick={chatScroll.scrollToBottom}
                >
                  새 메시지 {chatScroll.unread}개
                </Button>
              ) : null}
              <Box
                ref={chatScroll.scrollerRef}
                sx={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  flex: 1,
                  minHeight: 0,
                  pr: 0.5,
                  outline: drop.isDragging ? "2px solid rgba(37,99,235,0.45)" : "none",
                }}
                {...drop.handlers}
              >
                <ChatThread messages={thread} mySide="staff" tone="dark" showMyProfile variant="console" />
                <div ref={chatScroll.endRef} />
              </Box>
            </Box>
            </React.Fragment>
          )}
        </Box>

        {/* Bottom area: either assign banner OR composer */}
        {active && !active.assignee_id ? (
          /* 미배정 시: 담당자 배정 배너 (하단) */
          <Box
            sx={{
              p: 2.5,
              borderTop: "1px solid",
              borderColor: "rgba(59,130,246,0.2)",
              flex: "0 0 auto",
              background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.06) 100%)",
              pb: { xs: "calc(20px + env(safe-area-inset-bottom))", md: 2.5 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: "rgba(59,130,246,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontSize: "1.25rem",
                    }}
                  >
                    💬
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", mb: 0.25 }}>
                    아직 담당자가 없어요
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    배정 후 고객에게 메시지를 보낼 수 있어요
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => adminUserId && onAssign(adminUserId)}
                  disabled={busy || !adminUserId}
                  sx={{
                    bgcolor: "#10B981",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    py: 1,
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    fontSize: "0.9rem",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                    "&:hover": { bgcolor: "#059669", boxShadow: "0 4px 12px rgba(16,185,129,0.35)" },
                    "&:disabled": { bgcolor: "action.disabledBackground" },
                  }}
                >
                  나에게 배정
                </Button>
                <Tooltip title="배정 후 바로 답변 입력 (A → R)">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        if (!adminUserId) return;
                        await onAssign(adminUserId);
                        setTimeout(() => {
                          setComposerMode("reply");
                          replyInputRef.current?.focus();
                        }, 300);
                      }}
                      disabled={busy || !adminUserId}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        whiteSpace: "nowrap",
                        textTransform: "none",
                        fontSize: "0.85rem",
                        borderColor: "rgba(59,130,246,0.4)",
                        color: "#60A5FA",
                        "&:hover": { bgcolor: "rgba(59,130,246,0.08)", borderColor: "#3B82F6" },
                      }}
                    >
                      배정&답변
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        ) : (
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
            display: "grid",
            gap: 1,
            flex: "0 0 auto",
            bgcolor: "background.default",
            pb: { xs: "calc(16px + env(safe-area-inset-bottom))", md: 2 },
          }}
        >
          {/* tabs */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant={composerMode === "reply" ? "contained" : "outlined"}
              onClick={() => setComposerMode("reply")}
              disabled={busy}
              sx={{
                fontWeight: 900,
                textTransform: "none",
                borderRadius: 999,
                px: 2,
              }}
            >
              고객응대
            </Button>
            <Button
              variant={composerMode === "internal" ? "contained" : "outlined"}
              onClick={() => setComposerMode("internal")}
              disabled={busy}
              sx={{
                fontWeight: 900,
                textTransform: "none",
                borderRadius: 999,
                px: 2,
              }}
            >
              내부대화
            </Button>
            <Button
              variant="outlined"
              startIcon={aiBusy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon fontSize="small" />}
              onClick={onAiGenerate}
              disabled={aiBusy || !active}
              sx={{
                fontWeight: 700,
                ml: "auto",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontSize: "0.85rem",
                borderColor: "rgba(147,51,234,0.4)",
                color: "#A855F7",
                background: "linear-gradient(135deg, rgba(147,51,234,0.08) 0%, rgba(236,72,153,0.08) 100%)",
                "&:hover": {
                  borderColor: "rgba(147,51,234,0.6)",
                  background: "linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(236,72,153,0.15) 100%)",
                },
                "&:disabled": {
                  borderColor: "rgba(147,51,234,0.2)",
                  color: "rgba(168,85,247,0.4)",
                },
              }}
            >
              {aiBusy ? "생성중..." : "AI 답변"}
            </Button>
            <Tooltip title={aiAutoSuggest ? "AI 자동 추천 켜짐 (클릭하여 끄기)" : "AI 자동 추천 꺼짐 (클릭하여 켜기)"}>
              <Chip
                label={aiAutoSuggest ? "자동" : "수동"}
                size="small"
                onClick={() => {
                  const next = !aiAutoSuggest;
                  setAiAutoSuggest(next);
                  localStorage.setItem("admin_ai_auto_suggest", String(next));
                  setSnackMsg(next ? "AI 자동 추천 활성화" : "AI 자동 추천 비활성화");
                }}
                sx={{
                  height: 22,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  bgcolor: aiAutoSuggest ? "rgba(147,51,234,0.15)" : "rgba(255,255,255,0.06)",
                  color: aiAutoSuggest ? "#A855F7" : "text.secondary",
                  border: "1px solid",
                  borderColor: aiAutoSuggest ? "rgba(147,51,234,0.3)" : "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: aiAutoSuggest ? "rgba(147,51,234,0.25)" : "rgba(255,255,255,0.1)" },
                }}
              />
            </Tooltip>
          </Box>

          {/* closed hint */}
          {active && active.status === "CLOSED" ? (
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.85rem" }}>
              종료된 상담이에요. 메시지를 보내면 다시 열립니다.
            </Typography>
          ) : null}

          {/* 입력창 영역 */}
          <Box sx={{ position: "relative" }}>
            {/* 템플릿 자동완성 드롭다운 */}
            {showTemplates && filteredTemplates.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  right: 0,
                  mb: 0.5,
                  bgcolor: "background.paper",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 2.5,
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
                  maxHeight: 280,
                  overflow: "auto",
                  zIndex: 10,
                  backdropFilter: "blur(8px)",
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
                    #{templateQuery || "템플릿"} · ↑↓ 선택 · Enter 적용 · ESC 닫기
                  </Typography>
                </Box>
                {filteredTemplates.map((t, idx) => (
                  <Box
                    key={t.id}
                    onMouseDown={(e) => {
                      // 클릭 시작할 때 템플릿 적용 모드 활성화 (onChange 차단)
                      e.preventDefault();  // 입력 필드 blur 방지
                      templateApplyingRef.current = true;

                      // # 이전 텍스트 + 템플릿 내용
                      const currentValue = replyInputRef.current?.value ?? replyValueRef.current ?? reply;
                      const hashIdx = currentValue.lastIndexOf("#");
                      const before = hashIdx >= 0 ? currentValue.slice(0, hashIdx) : "";
                      const newValue = before + t.content;

                      // 입력 필드 값을 직접 설정
                      if (replyInputRef.current) {
                        replyInputRef.current.value = newValue;
                      }
                      setReply(newValue);
                      replyValueRef.current = newValue;
                      setShowTemplates(false);
                      setTemplateQuery("");

                      // 템플릿 적용 직후 Enter로 바로 전송되지 않도록 플래그 설정
                      templateJustAppliedRef.current = true;
                      setTimeout(() => {
                        templateJustAppliedRef.current = false;
                        templateApplyingRef.current = false;
                      }, 100);

                      replyInputRef.current?.focus();
                    }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      bgcolor: idx === templateSelectedIdx ? "rgba(37,99,235,0.1)" : "transparent",
                      borderLeft: idx === templateSelectedIdx ? "3px solid #2563EB" : "3px solid transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Chip
                        label={`#${t.shortcut}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontWeight: 700,
                          bgcolor: "rgba(249,115,22,0.15)",
                          color: "#F97316",
                          fontSize: "0.7rem",
                        }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{t.title}</Typography>
                      <Chip label={t.category} size="small" sx={{ height: 18, fontSize: "0.65rem", ml: "auto" }} />
                    </Box>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }} noWrap>
                      {t.content.slice(0, 80)}...
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ px: 2, py: 1, borderTop: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)" }}>
                  <Typography
                    component="a"
                    href="/admin/templates"
                    sx={{ fontSize: "0.75rem", color: "#60A5FA", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                  >
                    템플릿 관리 →
                  </Typography>
                </Box>
              </Box>
            )}

            <Box
              sx={{
                border: "1px solid",
                borderColor: showTemplates ? "#2563EB" : "rgba(255,255,255,0.1)",
                borderRadius: 2.5,
                bgcolor: "background.paper",
                overflow: "hidden",
                transition: "all 0.2s ease",
                boxShadow: showTemplates ? "0 0 0 3px rgba(37,99,235,0.15)" : "0 2px 8px rgba(0,0,0,0.08)",
                "&:focus-within": {
                  borderColor: "#2563EB",
                  boxShadow: "0 0 0 3px rgba(37,99,235,0.15)",
                },
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                placeholder={
                  !active
                    ? "티켓을 선택하세요."
                    : composerMode === "internal"
                    ? "내부 메모 입력… (고객에게 보이지 않음)"
                    : "#을 입력하면 템플릿 사용 가능"
                }
                value={reply}
                disabled={busy || sendBusy || !activeId}
                onChange={(e) => {
                  // 템플릿 적용 중에는 onChange 무시 (IME 커밋으로 인한 덮어쓰기 방지)
                  if (templateApplyingRef.current) {
                    return;
                  }
                  const val = e.target.value;
                  setReply(val);
                  replyValueRef.current = val;  // ref도 동기화

                  // AI 생성 텍스트와 다르면 AI 상태 초기화
                  if (val !== aiGeneratedDraft) {
                    setAiSource(null);
                  }

                  // # 감지하여 템플릿 자동완성 표시
                  const lastHash = val.lastIndexOf("#");
                  if (lastHash >= 0) {
                    const afterHash = val.slice(lastHash + 1);
                    // 공백이나 줄바꿈 없으면 템플릿 검색
                    if (!/[\s\n]/.test(afterHash)) {
                      setTemplateQuery(afterHash);
                      setShowTemplates(true);
                      setTemplateSelectedIdx(0);
                      return;
                    }
                  }
                  setShowTemplates(false);
                }}
                onKeyDown={(e) => {
                  // 템플릿 선택 중일 때
                  if (showTemplates && filteredTemplates.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setTemplateSelectedIdx((prev) => Math.min(prev + 1, filteredTemplates.length - 1));
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setTemplateSelectedIdx((prev) => Math.max(prev - 1, 0));
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tpl = filteredTemplates[templateSelectedIdx];
                      if (tpl) {
                        // onChange 차단
                        templateApplyingRef.current = true;

                        // # 이전 텍스트 + 템플릿 내용
                        const currentValue = replyInputRef.current?.value ?? replyValueRef.current ?? reply;
                        const hashIdx = currentValue.lastIndexOf("#");
                        const before = hashIdx >= 0 ? currentValue.slice(0, hashIdx) : "";
                        const newValue = before + tpl.content;

                        // 입력 필드 값을 직접 설정
                        if (replyInputRef.current) {
                          replyInputRef.current.value = newValue;
                        }
                        setReply(newValue);
                        replyValueRef.current = newValue;

                        // 플래그 해제
                        templateJustAppliedRef.current = true;
                        setTimeout(() => {
                          templateJustAppliedRef.current = false;
                          templateApplyingRef.current = false;
                        }, 100);
                      }
                      setShowTemplates(false);
                      setTemplateQuery("");
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowTemplates(false);
                      return;
                    }
                  }

                  // 템플릿 적용 직후에는 전송하지 않음
                  if (templateJustAppliedRef.current) {
                    return;
                  }
                  // Ctrl+Enter: 전송 & 종료
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !showTemplates) {
                    e.preventDefault();
                    onSendAndClose();
                    return;
                  }
                  // 일반 Enter: 전송
                  if (e.key === "Enter" && !e.shiftKey && !showTemplates) {
                    e.preventDefault();
                    (document.getElementById("admin-send-btn") as HTMLButtonElement | null)?.click();
                  }
                }}
                onBlur={() => {
                  // 약간의 딜레이 후 닫기 (클릭 이벤트 처리를 위해)
                  setTimeout(() => setShowTemplates(false), 200);
                }}
                inputRef={replyInputRef}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "transparent",
                    "& fieldset": { border: "none" },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                  },
                }}
              />
              <Divider />
              <Box sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {/* 파일 첨부 */}
                  <IconButton
                    component="label"
                    size="small"
                    disabled={composerMode === "internal"}
                    title="파일 첨부"
                    sx={{ color: "text.secondary", cursor: composerMode === "internal" ? "not-allowed" : "pointer" }}
                  >
                    <AddIcon fontSize="small" />
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const list = Array.from(e.target.files ?? []);
                        setReplyFiles((prev) => [...prev, ...list]);
                        e.currentTarget.value = "";
                      }}
                    />
                  </IconButton>
                  {/* 템플릿 버튼 */}
                  <Button
                    size="small"
                    onClick={() => {
                      setReply((prev) => {
                        const newVal = prev + "#";
                        replyValueRef.current = newVal;
                        return newVal;
                      });
                      setShowTemplates(true);
                      setTemplateQuery("");
                      replyInputRef.current?.focus();
                    }}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.5,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "text.secondary",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    # 템플릿
                  </Button>

                  {/* AI 생성 인디케이터 */}
                  {aiGeneratedDraft && reply === aiGeneratedDraft && (
                    <>
                      <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important" }} />}
                        label={aiSource === "openrouter" ? "Gemini 2.5 Pro" : aiSource === "gemini" ? "Gemini AI" : "AI 추천"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          ml: 1,
                          background: "linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(236,72,153,0.15) 100%)",
                          color: "#A855F7",
                          border: "1px solid rgba(147,51,234,0.3)",
                          "& .MuiChip-icon": { color: "#A855F7" },
                        }}
                      />
                      <Button
                        size="small"
                        onClick={onAiSaveToLibrary}
                        disabled={busy}
                        sx={{
                          minWidth: 0,
                          px: 1,
                          py: 0.25,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#10B981",
                          "&:hover": { bgcolor: "rgba(16,185,129,0.1)" },
                        }}
                      >
                        학습 저장
                      </Button>
                      <Button
                        size="small"
                        onClick={onAiGenerate}
                        disabled={aiBusy}
                        sx={{
                          minWidth: 0,
                          px: 1,
                          py: 0.25,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#A855F7",
                          "&:hover": { bgcolor: "rgba(168,85,247,0.1)" },
                        }}
                      >
                        재생성
                      </Button>
                    </>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {replyFiles.length > 0 && (
                    <Chip
                      label={`${replyFiles.length}개 첨부`}
                      size="small"
                      onDelete={() => setReplyFiles([])}
                      sx={{ height: 24, fontSize: "0.75rem" }}
                    />
                  )}
                  <Button
                    id="admin-send-btn"
                    variant="contained"
                    disabled={!active || busy || sendBusy || (!reply.trim() && replyFiles.length === 0)}
                    onClick={onSend}
                    sx={{
                      fontWeight: 700,
                      borderRadius: 1.5,
                      minWidth: 80,
                      px: 2,
                      py: 0.75,
                      fontSize: "0.9rem",
                    }}
                  >
                    {sendBusy ? "전송중…" : "전송"}
                  </Button>
                  {composerMode === "reply" && (
                    <Tooltip title="전송 후 상담 종료 (Ctrl+Enter)">
                      <span>
                        <Button
                          variant="outlined"
                          disabled={!active || busy || sendBusy || (!reply.trim() && replyFiles.length === 0)}
                          onClick={onSendAndClose}
                          sx={{
                            fontWeight: 700,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.75,
                            fontSize: "0.8rem",
                            minWidth: 0,
                            borderColor: "#22C55E",
                            color: "#22C55E",
                            "&:hover": { bgcolor: "rgba(34,197,94,0.08)", borderColor: "#16A34A" },
                          }}
                        >
                          전송&종료
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 첨부 파일 미리보기 */}
          {composerMode !== "internal" && replyFiles.length > 0 ? (
            <AttachmentPreview
              files={replyFiles}
              onRemove={(idx) => setReplyFiles((prev) => prev.filter((_, i) => i !== idx))}
            />
          ) : null}
        </Box>
        )}
      </Box>

      {isXl ? (
        <Box
          onMouseDown={(e) => startResize("right", e)}
          sx={{
            gridColumn: "6 / 7",
            cursor: "col-resize",
            bgcolor: "transparent",
            "&:hover": { bgcolor: "rgba(249,115,22,0.18)" },
          }}
        />
      ) : null}

      {/* right: customer panel */}
      <Box
        sx={{
          gridColumn: isXl ? "7 / 8" : "auto",
          bgcolor: "background.paper",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-1px 0 8px rgba(0,0,0,0.08)",
          p: 2,
          minWidth: 0,
          minHeight: 0,
          overflow: "auto",
          display: { xs: "none", xl: "block" },
        }}
      >
        <AdminRightSidebar
          active={active}
          busy={busy}
          adminUserId={adminUserId}
          agents={agents}
          customer={customer}
          customerDraft={customerDraft}
          setCustomerDraft={setCustomerDraft}
          onSaveCustomer={onSaveCustomer}
          notes={notes}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          onAddNote={onAddNote}
          metaDraft={metaDraft}
          setMetaDraft={setMetaDraft}
          onSaveMeta={onSaveMeta}
          onSetStatus={onSetStatus}
          onAssign={onAssign}
          onQuickMeta={onQuickMeta}
          presetTags={presetTags}
          presetChannels={presetChannels}
          presetTeams={presetTeams}
          userHistory={userHistory}
          onSelectTicket={(id) => setActiveId(id)}
        />
      </Box>

      {/* drawers for small screens */}
      <Drawer
        anchor="left"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{ sx: { width: 320, maxWidth: "85vw", bgcolor: "background.paper", borderRadius: 0 } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 900 }}>필터</Typography>
            <Button variant="outlined" sx={{ fontWeight: 900 }} onClick={() => setFiltersOpen(false)}>
              닫기
            </Button>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {/* reuse the same sidebar content by rendering it once more in drawer */}
            <Box sx={{ p: 2, display: "grid", gap: 2 }}>
              <TextField
                fullWidth
                placeholder="검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  저장된 뷰
                </Typography>
                <TextField select fullWidth value={activeViewId} onChange={(e) => setActiveViewId(e.target.value)}>
                  {views.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  상담 태그
                </Typography>
                <TextField select fullWidth value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="__NONE__">없음</MenuItem>
                  {tagCounts.map(([name, cnt]) => (
                    <MenuItem key={name} value={name}>
                      {name} ({cnt})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  담당자
                </Typography>
                <TextField select fullWidth value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value as any)}>
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="UNASSIGNED">미배정</MenuItem>
                  {agents.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>
                      {a.name || a.email} (#{a.id})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  우선순위
                </Typography>
                <TextField select fullWidth value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="URGENT">URGENT</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="NORMAL">NORMAL</MenuItem>
                  <MenuItem value="LOW">LOW</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  채널
                </Typography>
                <TextField select fullWidth value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as any)}>
                  <MenuItem value="ALL">전체</MenuItem>
                  {channelCounts.map(([k, cnt]) => (
                    <MenuItem key={k} value={k}>
                      {k} ({cnt})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  유입 경로
                </Typography>
                <TextField select fullWidth value={entryFilter} onChange={(e) => setEntryFilter(e.target.value as any)}>
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="category_guide">문의 유형 안내 페이지</MenuItem>
                  <MenuItem value="direct_compose">작성 화면 직접 진입</MenuItem>
                  <MenuItem value="unknown">기타/미상</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
                  상태
                </Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {([
                    { k: "PENDING", label: "진행중" },
                    { k: "ANSWERED", label: "보류중(답변완료)" },
                    { k: "CLOSED", label: "종료됨" },
                    { k: "ALL", label: "전체" },
                  ] as const).map((it) => (
                    <Button
                      key={it.k}
                      onClick={() => setStatusTab(it.k)}
                      variant="text"
                      sx={{
                        justifyContent: "space-between",
                        fontWeight: 900,
                        color: "text.primary",
                        bgcolor: statusTab === it.k ? "rgba(79,125,255,0.20)" : "rgba(255,255,255,0.03)",
                        border: "1px solid",
                        borderColor: "divider",
                        px: 1.25,
                        py: 1,
                      }}
                    >
                      <span>{it.label}</span>
                      <span style={{ opacity: 0.75 }}>{(statusCounts as any)[it.k]}</span>
                    </Button>
                  ))}
                </Box>
              </Box>
              <Button onClick={() => refresh()} sx={{ fontWeight: 900 }} fullWidth>
                새로고침
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        PaperProps={{ sx: { width: 360, maxWidth: "90vw", bgcolor: "background.paper", borderRadius: 0 } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 900 }}>고객 정보</Typography>
            <Button variant="outlined" sx={{ fontWeight: 900 }} onClick={() => setCustomerOpen(false)}>
              닫기
            </Button>
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <AdminRightSidebar
              active={active}
              busy={busy}
              adminUserId={adminUserId}
              agents={agents}
              customer={customer}
              customerDraft={customerDraft}
              setCustomerDraft={setCustomerDraft}
              onSaveCustomer={onSaveCustomer}
              notes={notes}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              onAddNote={onAddNote}
              metaDraft={metaDraft}
              setMetaDraft={setMetaDraft}
              onSaveMeta={onSaveMeta}
              onSetStatus={onSetStatus}
              onAssign={onAssign}
              presetTags={presetTags}
              presetChannels={presetChannels}
              presetTeams={presetTeams}
              userHistory={userHistory}
              onSelectTicket={(id) => {
                setActiveId(id);
                setCustomerOpen(false);
              }}
            />
          </Box>
        </Box>
      </Drawer>

      {/* 성공 스낵바 */}
      <Snackbar
        open={!!snackMsg}
        autoHideDuration={2500}
        onClose={() => setSnackMsg(null)}
        message={snackMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{
          sx: {
            bgcolor: "#1E293B",
            color: "#F0FDF4",
            fontWeight: 600,
            borderRadius: 2,
            border: "1px solid rgba(34,197,94,0.3)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          },
        }}
      />

      {/* 키보드 단축키 도움말 다이얼로그 */}
      <Dialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0F172A",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#0F172A", color: "#FAFAFA" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <KeyboardIcon sx={{ color: "#60A5FA" }} />
            <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>키보드 단축키</Typography>
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>ESC 로 닫기</Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#0F172A", pt: 2 }}>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {[
              { key: "R", desc: "답장 입력창으로 포커스" },
              { key: "N", desc: "내부 노트 모드로 전환" },
              { key: "E", desc: "현재 상담 종료" },
              { key: "A", desc: "나에게 배정 (미배정 시)" },
              { key: "J", desc: "다음 티켓으로 이동" },
              { key: "K", desc: "이전 티켓으로 이동" },
              { key: "?", desc: "이 도움말 열기/닫기" },
              { key: "Enter", desc: "메시지 전송 (입력창에서)" },
              { key: "Ctrl+Enter", desc: "전송 & 상담 종료 (입력창에서)" },
              { key: "Shift+Enter", desc: "줄바꿈 (입력창에서)" },
              { key: "#", desc: "템플릿 자동완성 (입력창에서)" },
            ].map((shortcut) => (
              <Box
                key={shortcut.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.25,
                  px: 1.5,
                  bgcolor: "rgba(255,255,255,0.03)",
                  borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>{shortcut.desc}</Typography>
                <Box
                  sx={{
                    bgcolor: "rgba(96,165,250,0.15)",
                    color: "#60A5FA",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                    border: "1px solid rgba(96,165,250,0.3)",
                  }}
                >
                  {shortcut.key}
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(249,115,22,0.1)", borderRadius: 1, border: "1px solid rgba(249,115,22,0.2)" }}>
            <Typography sx={{ color: "#FB923C", fontSize: "0.85rem", fontWeight: 600 }}>
              💡 입력창에 포커스가 있을 때는 단축키가 비활성화됩니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#0F172A", p: 2 }}>
          <Button
            onClick={() => setShowShortcuts(false)}
            variant="contained"
            sx={{
              bgcolor: "#2563EB",
              fontWeight: 700,
              borderRadius: 1.5,
              px: 3,
              "&:hover": { bgcolor: "#1D4ED8" }
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


