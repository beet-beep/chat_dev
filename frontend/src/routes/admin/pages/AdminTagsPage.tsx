import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  Typography,
  IconButton,
  Collapse,
} from "@mui/material";
import { useEffect, useState, useCallback, useRef } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiFetch } from "../../../api/client";

type TicketTag = {
  id: number;
  name: string;
  color: string;
  parent: number | null;
  order: number;
  children?: TicketTag[];
};

export function AdminTagsPage() {
  const [tags, setTags] = useState<TicketTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());
  // Debounce updates to avoid lag
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    refresh();
    return () => {
      // Cleanup timers
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  async function refresh() {
    try {
      const data = await apiFetch<TicketTag[]>("/admin/ticket-tags/", {}, "admin_token");
      setTags(data || []);
      const allIds = new Set(data.map((t) => t.id));
      setExpandedTags(allIds);
    } catch (e) {
      console.error(e);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(tagId: number) {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  // Debounced update to avoid lag on every keystroke
  const handleUpdateTag = useCallback((tag: TicketTag, updates: Partial<TicketTag>) => {
    // Clear existing timer for this tag
    const existingTimer = debounceTimers.current.get(tag.id);
    if (existingTimer) clearTimeout(existingTimer);

    // Update local state immediately for responsiveness
    setTags((prev) => {
      const updateInList = (list: TicketTag[]): TicketTag[] =>
        list.map((t) => {
          if (t.id === tag.id) return { ...t, ...updates };
          if (t.children) return { ...t, children: updateInList(t.children) };
          return t;
        });
      return updateInList(prev);
    });

    // Debounce API call
    const timer = setTimeout(async () => {
      try {
        await apiFetch(
          `/admin/ticket-tags/${tag.id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
          "admin_token"
        );
      } catch (e: any) {
        console.error("Update failed:", e);
      }
      debounceTimers.current.delete(tag.id);
    }, 500);

    debounceTimers.current.set(tag.id, timer);
  }, []);

  async function handleDeleteTag(tagId: number) {
    if (!confirm("이 태그를 삭제하시겠습니까? (하위 태그도 모두 삭제됩니다)")) return;
    try {
      await apiFetch(
        `/admin/ticket-tags/${tagId}/`,
        { method: "DELETE" },
        "admin_token"
      );
      await refresh();
    } catch (e: any) {
      alert("삭제 실패: " + (e?.message || e));
    }
  }

  async function handleAddChild(parentTag: TicketTag) {
    const name = prompt("새 하위 태그 이름:");
    if (!name || !name.trim()) return;

    try {
      await apiFetch(
        `/admin/ticket-tags/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            color: parentTag.color,
            parent: parentTag.id,
            order: (parentTag.children?.length || 0) + 1,
          }),
        },
        "admin_token"
      );
      await refresh();
    } catch (e: any) {
      alert("추가 실패: " + (e?.message || e));
    }
  }

  async function handleAddParent() {
    const name = prompt("새 상위 카테고리 이름:");
    if (!name || !name.trim()) return;

    const color = prompt("색상 코드 (예: #3B82F6):", "#6B7280");
    if (!color) return;

    try {
      await apiFetch(
        `/admin/ticket-tags/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            color: color.trim(),
            parent: null,
            order: tags.length + 1,
          }),
        },
        "admin_token"
      );
      await refresh();
    } catch (e: any) {
      alert("추가 실패: " + (e?.message || e));
    }
  }

  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", bgcolor: "background.default", overflow: "auto" }}>
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              문의 태그 관리
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              문의 티켓에 적용할 태그를 계층 구조로 관리합니다.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ fontWeight: 700 }}
            onClick={handleAddParent}
          >
            상위 카테고리 추가
          </Button>
        </Box>

        <Box sx={{ display: "grid", gap: 2 }}>
          {tags.map((tag) => (
            <Card key={tag.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
                  <IconButton size="small" onClick={() => toggleExpand(tag.id)}>
                    {expandedTags.has(tag.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>

                  <Chip
                    label={tag.name}
                    sx={{
                      bgcolor: tag.color,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  />

                  <Box sx={{ flex: 1 }} />

                  <TextField
                    size="small"
                    label="순서"
                    type="number"
                    value={tag.order}
                    onChange={(e) => handleUpdateTag(tag, { order: parseInt(e.target.value) || 0 })}
                    sx={{ width: 80 }}
                  />

                  <TextField
                    size="small"
                    label="색상"
                    value={tag.color}
                    onChange={(e) => handleUpdateTag(tag, { color: e.target.value })}
                    sx={{ width: 100 }}
                  />

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddChild(tag)}
                  >
                    하위 추가
                  </Button>

                  <IconButton color="error" onClick={() => handleDeleteTag(tag.id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>

                <Collapse in={expandedTags.has(tag.id)}>
                  {tag.children && tag.children.length > 0 ? (
                    <Box sx={{ pl: 5, mt: 2, display: "grid", gap: 1 }}>
                      {tag.children.map((child) => (
                        <Box
                          key={child.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 1.5,
                            bgcolor: "rgba(255,255,255,0.03)",
                            borderRadius: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={child.name}
                            size="small"
                            sx={{
                              bgcolor: child.color,
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />

                          <Box sx={{ flex: 1 }} />

                          <TextField
                            size="small"
                            label="이름"
                            value={child.name}
                            onChange={(e) => handleUpdateTag(child, { name: e.target.value })}
                            sx={{ width: 160 }}
                          />

                          <TextField
                            size="small"
                            label="순서"
                            type="number"
                            value={child.order}
                            onChange={(e) =>
                              handleUpdateTag(child, { order: parseInt(e.target.value) || 0 })
                            }
                            sx={{ width: 70 }}
                          />

                          <IconButton size="small" color="error" onClick={() => handleDeleteTag(child.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{ pl: 5, mt: 1, display: "block", color: "text.secondary" }}
                    >
                      하위 태그 없음
                    </Typography>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
