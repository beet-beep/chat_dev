import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect, useState } from "react";

export type ReplyTemplate = {
  id: string;
  shortcut: string; // #으로 시작하는 단축어 (예: "인사", "확인중")
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

const TEMPLATES_KEY = "joody_admin_reply_templates_v1";

function loadTemplates(): ReplyTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return getDefaultTemplates();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultTemplates();
  } catch {
    return getDefaultTemplates();
  }
}

function saveTemplates(templates: ReplyTemplate[]) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

function getDefaultTemplates(): ReplyTemplate[] {
  const now = new Date().toISOString();
  return [
    { id: "1", shortcut: "인사", title: "기본 인사말", content: "안녕하세요, 고객님. 문의해 주셔서 감사합니다.\n\n", category: "일반", createdAt: now, updatedAt: now },
    { id: "2", shortcut: "확인중", title: "확인 중 안내", content: "해당 내용 확인 중입니다. 잠시만 기다려 주세요.", category: "일반", createdAt: now, updatedAt: now },
    { id: "3", shortcut: "처리완료", title: "처리 완료 안내", content: "요청하신 사항이 정상적으로 처리되었습니다.\n\n추가 문의사항이 있으시면 언제든 말씀해 주세요.", category: "일반", createdAt: now, updatedAt: now },
    { id: "4", shortcut: "추가정보", title: "추가 정보 요청", content: "원활한 처리를 위해 추가 정보가 필요합니다.\n\n• 계정 이메일:\n• 발생 일시:\n• 상세 내용:\n\n위 정보를 함께 보내주시면 빠르게 도움드리겠습니다.", category: "일반", createdAt: now, updatedAt: now },
    { id: "5", shortcut: "감사", title: "감사 인사", content: "문의해 주셔서 감사합니다. 다른 궁금한 점이 있으시면 언제든 문의해 주세요.\n\n좋은 하루 보내세요!", category: "일반", createdAt: now, updatedAt: now },
    { id: "6", shortcut: "환불", title: "환불 안내", content: "환불 요청이 접수되었습니다.\n\n• 환불 예정일: 영업일 기준 3-5일\n• 환불 방법: 결제 수단으로 자동 환불\n\n환불 완료 시 별도로 안내드리겠습니다.", category: "결제", createdAt: now, updatedAt: now },
    { id: "7", shortcut: "버그", title: "버그 리포트 감사", content: "버그 제보 감사합니다.\n\n해당 문제를 개발팀에 전달하여 확인 중입니다. 수정 완료되면 별도로 안내드리겠습니다.\n\n불편을 드려 죄송합니다.", category: "기술", createdAt: now, updatedAt: now },
    { id: "8", shortcut: "계정", title: "계정 확인 요청", content: "계정 확인을 위해 아래 정보가 필요합니다.\n\n• 가입 시 사용한 이메일:\n• 닉네임/유저명:\n• 가입 추정 시기:\n\n보안을 위해 본인 확인 후 처리해 드리겠습니다.", category: "계정", createdAt: now, updatedAt: now },
  ];
}

export { loadTemplates, saveTemplates };

export function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<Partial<ReplyTemplate>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const categories = Array.from(new Set(templates.map((t) => t.category))).filter(Boolean);
  const filtered = templates.filter((t) => {
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.shortcut.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
    }
    return true;
  });

  const activeTemplate = activeId ? templates.find((t) => t.id === activeId) : null;

  function openCreateDialog() {
    setDraft({ shortcut: "", title: "", content: "", category: "일반" });
    setEditMode("create");
    setDialogOpen(true);
  }

  function openEditDialog(template: ReplyTemplate) {
    setDraft({ ...template });
    setEditMode("edit");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!draft.shortcut?.trim() || !draft.content?.trim()) return;

    const now = new Date().toISOString();
    if (editMode === "create") {
      const newTemplate: ReplyTemplate = {
        id: `${Date.now()}`,
        shortcut: draft.shortcut.trim().replace(/^#/, ""),
        title: draft.title?.trim() || draft.shortcut.trim(),
        content: draft.content.trim(),
        category: draft.category?.trim() || "일반",
        createdAt: now,
        updatedAt: now,
      };
      const next = [...templates, newTemplate];
      setTemplates(next);
      saveTemplates(next);
      setActiveId(newTemplate.id);
    } else {
      const next = templates.map((t) =>
        t.id === draft.id
          ? {
              ...t,
              shortcut: draft.shortcut!.trim().replace(/^#/, ""),
              title: draft.title?.trim() || draft.shortcut!.trim(),
              content: draft.content!.trim(),
              category: draft.category?.trim() || "일반",
              updatedAt: now,
            }
          : t
      );
      setTemplates(next);
      saveTemplates(next);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    if (!window.confirm("이 템플릿을 삭제하시겠습니까?")) return;
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    saveTemplates(next);
    if (activeId === id) setActiveId(null);
  }

  function handleDuplicate(template: ReplyTemplate) {
    const now = new Date().toISOString();
    const newTemplate: ReplyTemplate = {
      ...template,
      id: `${Date.now()}`,
      shortcut: `${template.shortcut}_복사`,
      title: `${template.title} (복사본)`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [...templates, newTemplate];
    setTemplates(next);
    saveTemplates(next);
    setActiveId(newTemplate.id);
  }

  return (
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" }, bgcolor: "background.default", overflow: "hidden" }}>
      {/* 좌측: 템플릿 목록 */}
      <Box sx={{ borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>답변 템플릿</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ fontWeight: 700, borderRadius: 2 }}>
              새 템플릿
            </Button>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            <Chip
              label="전체"
              size="small"
              onClick={() => setCategoryFilter("ALL")}
              sx={{
                fontWeight: 700,
                bgcolor: categoryFilter === "ALL" ? "primary.main" : "rgba(255,255,255,0.08)",
                color: categoryFilter === "ALL" ? "#fff" : "text.secondary",
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                onClick={() => setCategoryFilter(cat)}
                sx={{
                  fontWeight: 700,
                  bgcolor: categoryFilter === cat ? "primary.main" : "rgba(255,255,255,0.08)",
                  color: categoryFilter === cat ? "#fff" : "text.secondary",
                }}
              />
            ))}
          </Box>
        </Box>

        <List sx={{ flex: 1, overflow: "auto", p: 1 }}>
          {filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography>템플릿이 없습니다</Typography>
            </Box>
          ) : (
            filtered.map((t) => (
              <ListItemButton
                key={t.id}
                selected={activeId === t.id}
                onClick={() => setActiveId(t.id)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  border: "1px solid",
                  borderColor: activeId === t.id ? "primary.main" : "transparent",
                  bgcolor: activeId === t.id ? "rgba(37,99,235,0.08)" : "transparent",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`#${t.shortcut}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontWeight: 700,
                          bgcolor: "rgba(249,115,22,0.15)",
                          color: "#F97316",
                          fontSize: "0.75rem",
                        }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>
                        {t.title}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", mt: 0.5 }} noWrap>
                      {t.content.slice(0, 60)}...
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>

        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(255,255,255,0.02)" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            💡 메시지 입력창에서 <strong>#단축어</strong>를 입력하면 템플릿을 빠르게 사용할 수 있습니다
          </Typography>
        </Box>
      </Box>

      {/* 우측: 템플릿 상세 */}
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
        {activeTemplate ? (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <Chip
                    label={`#${activeTemplate.shortcut}`}
                    sx={{
                      height: 28,
                      fontWeight: 700,
                      bgcolor: "rgba(249,115,22,0.15)",
                      color: "#F97316",
                      fontSize: "0.85rem",
                    }}
                  />
                  <Chip label={activeTemplate.category} size="small" sx={{ fontWeight: 600 }} />
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: "1.5rem" }}>{activeTemplate.title}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton onClick={() => handleDuplicate(activeTemplate)} title="복제">
                  <ContentCopyIcon />
                </IconButton>
                <IconButton onClick={() => openEditDialog(activeTemplate)} title="수정">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(activeTemplate.id)} title="삭제" sx={{ color: "error.main" }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                p: 3,
                bgcolor: "rgba(255,255,255,0.03)",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                minHeight: 200,
              }}
            >
              {activeTemplate.content}
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2, color: "text.secondary", fontSize: "0.8rem" }}>
              <Typography variant="caption">생성: {new Date(activeTemplate.createdAt).toLocaleDateString("ko-KR")}</Typography>
              <Typography variant="caption">수정: {new Date(activeTemplate.updatedAt).toLocaleDateString("ko-KR")}</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "grid", placeItems: "center", color: "text.secondary" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: "3rem", mb: 2 }}>📝</Typography>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>템플릿을 선택하세요</Typography>
              <Typography variant="body2">좌측 목록에서 템플릿을 클릭하여 내용을 확인하세요</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{editMode === "create" ? "새 템플릿 만들기" : "템플릿 수정"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="단축어"
              placeholder="인사, 확인중, 환불 등"
              value={draft.shortcut || ""}
              onChange={(e) => setDraft({ ...draft, shortcut: e.target.value })}
              helperText="#을 붙이지 않아도 됩니다"
              fullWidth
            />
            <TextField
              label="카테고리"
              placeholder="일반, 결제, 기술 등"
              value={draft.category || ""}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              fullWidth
            />
          </Box>
          <TextField
            label="제목"
            placeholder="템플릿 제목"
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            fullWidth
          />
          <TextField
            label="내용"
            placeholder="템플릿 내용을 입력하세요..."
            value={draft.content || ""}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            multiline
            minRows={6}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={!draft.shortcut?.trim() || !draft.content?.trim()}>
            {editMode === "create" ? "생성" : "저장"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
