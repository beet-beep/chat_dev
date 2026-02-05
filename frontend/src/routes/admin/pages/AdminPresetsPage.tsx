import { Box, Button, Checkbox, Divider, FormControlLabel, List, ListItemButton, ListItemText, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  adminCreatePresetChannel,
  adminCreateTicketCategory,
  adminDeletePresetChannel,
  adminDeleteTicketCategory,
  adminListTicketCategories,
  adminPatchTicketCategory,
  adminListPresetChannels,
  adminPatchPresetChannel,
} from "../../../api/support";
import { apiFetch } from "../../../api/client";
// AdminIconRail removed from individual page, now in AdminLayout
import { FaqBlockEditor } from "../components/FaqBlockEditor";

type TicketTag = {
  id: number;
  name: string;
  color: string;
  parent: number | null;
  order: number;
  children?: TicketTag[];
};

export function AdminPresetsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [ticketCats, setTicketCats] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newChannelKey, setNewChannelKey] = useState("");
  const [newChannelLabel, setNewChannelLabel] = useState("");
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState<number>(0);
  const [tagDraft, setTagDraft] = useState<{ name: string; color: string; order: number; is_active: boolean }>({
    name: "",
    color: "",
    order: 0,
    is_active: true,
  });
  const [channelDraft, setChannelDraft] = useState<{ key: string; label: string; order: number; is_active: boolean }>({
    key: "",
    label: "",
    order: 0,
    is_active: true,
  });

  async function refresh() {
    const [t, c, tc] = await Promise.all([
      apiFetch<TicketTag[]>("/admin/ticket-tags/", {}, "admin_token"),
      adminListPresetChannels(),
      adminListTicketCategories()
    ]);
    // Flatten all tags (parent + children)
    const allTags: any[] = [];
    (t ?? []).forEach((parent) => {
      allTags.push({ ...parent, displayName: parent.name });
      if (parent.children) {
        parent.children.forEach((child) => {
          allTags.push({ ...child, displayName: `${parent.name} > ${child.name}` });
        });
      }
    });
    setTags(allTags);
    setChannels(c ?? []);
    setTicketCats(tc ?? []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const sortedTags = useMemo(() => [...tags].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id), [tags]);
  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id),
    [channels]
  );

  const activeTag = useMemo(() => (activeTagId ? tags.find((t) => t.id === activeTagId) : null) ?? null, [tags, activeTagId]);
  const activeChannel = useMemo(
    () => (activeChannelId ? channels.find((c) => c.id === activeChannelId) : null) ?? null,
    [channels, activeChannelId]
  );

  const sortedCats = useMemo(() => [...ticketCats].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id), [ticketCats]);
  const activeCat = useMemo(() => (activeCatId ? ticketCats.find((t) => t.id === activeCatId) : null) ?? null, [ticketCats, activeCatId]);
  const [catDraft, setCatDraft] = useState<{ name: string; order: number; bot_enabled: boolean; bot_title: string; bot_blocks: any[] }>({
    name: "",
    order: 0,
    bot_enabled: false,
    bot_title: "주디 서포트봇",
    bot_blocks: [{ type: "paragraph", text: "" }],
  });

  useEffect(() => {
    if (!activeCat) return;
    setCatDraft({
      name: activeCat.name ?? "",
      order: Number(activeCat.order ?? 0),
      bot_enabled: Boolean(activeCat.bot_enabled ?? false),
      bot_title: String(activeCat.bot_title ?? "주디 서포트봇"),
      bot_blocks: Array.isArray(activeCat.bot_blocks) ? activeCat.bot_blocks : [{ type: "paragraph", text: "" }],
    });
  }, [activeCatId]);

  useEffect(() => {
    if (!activeTag) return;
    setTagDraft({
      name: activeTag.name ?? "",
      color: activeTag.color ?? "",
      order: Number(activeTag.order ?? 0),
      is_active: Boolean(activeTag.is_active ?? true),
    });
  }, [activeTagId]);

  useEffect(() => {
    if (!activeChannel) return;
    setChannelDraft({
      key: activeChannel.key ?? "",
      label: activeChannel.label ?? "",
      order: Number(activeChannel.order ?? 0),
      is_active: Boolean(activeChannel.is_active ?? true),
    });
  }, [activeChannelId]);

  return (
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "1fr", bgcolor: "background.default", overflow: "auto" }}>
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1.5 }}>프리셋 관리</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 900 }}>태그</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                인박스 태그 자동완성/추천에 사용됩니다.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <TextField
                  fullWidth
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="새 태그 이름"
                  disabled
                  helperText="태그는 '태그 관리' 페이지에서 관리하세요"
                />
                <Button
                  variant="outlined"
                  sx={{ fontWeight: 900, minWidth: 120 }}
                  onClick={() => window.location.href = "/admin/tags"}
                >
                  태그 관리
                </Button>
              </Box>
              {activeTag ? (
                <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900, display: "block", mb: 1 }}>
                    선택된 태그: {activeTag.displayName || activeTag.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    색상: {activeTag.color} · 순서: {activeTag.order}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                    태그 수정은 '태그 관리' 페이지에서 하세요.
                  </Typography>
                </Box>
              ) : null}
            </Box>
            <Divider />
            <List dense sx={{ maxHeight: "70vh", overflow: "auto" }}>
              {sortedTags.map((t) => (
                <ListItemButton
                  key={t.id}
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                  selected={activeTagId === t.id}
                  onClick={() => setActiveTagId(t.id)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: "50%", 
                            bgcolor: t.color,
                            border: "1px solid rgba(0,0,0,0.1)"
                          }} 
                        />
                        <Typography sx={{ fontWeight: 900 }}>{t.displayName || t.name}</Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        order {t.order ?? 0} · {t.parent ? "하위 태그" : "상위 태그"}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
              {sortedTags.length === 0 ? (
                <Box sx={{ p: 2, color: "text.secondary" }}>태그가 없습니다. '태그 관리' 페이지에서 추가하세요.</Box>
              ) : null}
            </List>
          </Box>

          <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 900 }}>채널</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                인박스 채널 select에 사용됩니다. (key 예: inapp/email/chat)
              </Typography>
              <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
                <TextField
                  fullWidth
                  value={newChannelKey}
                  onChange={(e) => setNewChannelKey(e.target.value)}
                  placeholder="key (예: inapp)"
                />
                <TextField
                  fullWidth
                  value={newChannelLabel}
                  onChange={(e) => setNewChannelLabel(e.target.value)}
                  placeholder="label (예: 앱 문의)"
                />
                <Button
                  variant="contained"
                  sx={{ fontWeight: 900 }}
                  disabled={busy || !newChannelKey.trim()}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await adminCreatePresetChannel({ key: newChannelKey.trim(), label: newChannelLabel.trim() });
                      setNewChannelKey("");
                      setNewChannelLabel("");
                      await refresh();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  채널 추가
                </Button>
              </Box>
              {activeChannel ? (
                <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900 }}>
                    선택된 채널 편집
                  </Typography>
                  <TextField
                    value={channelDraft.key}
                    onChange={(e) => setChannelDraft({ ...channelDraft, key: e.target.value })}
                    placeholder="key"
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      value={channelDraft.label}
                      onChange={(e) => setChannelDraft({ ...channelDraft, label: e.target.value })}
                      placeholder="label"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      value={channelDraft.order}
                      onChange={(e) => setChannelDraft({ ...channelDraft, order: Number(e.target.value || 0) })}
                      placeholder="order"
                      sx={{ width: 120 }}
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={channelDraft.is_active}
                        onChange={(e) => setChannelDraft({ ...channelDraft, is_active: e.target.checked })}
                      />
                    }
                    label={<Typography sx={{ color: "text.secondary" }}>활성</Typography>}
                  />
                  <Button
                    variant="contained"
                    sx={{ fontWeight: 900 }}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await adminPatchPresetChannel(activeChannel.id, channelDraft);
                        await refresh();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    저장
                  </Button>
                </Box>
              ) : null}
            </Box>
            <Divider />
            <List dense sx={{ maxHeight: "70vh", overflow: "auto" }}>
              {sortedChannels.map((c) => (
                <ListItemButton
                  key={c.id}
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                  selected={activeChannelId === c.id}
                  onClick={() => setActiveChannelId(c.id)}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 900 }}>
                        {c.label || c.key}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        key: {c.key} · order {c.order ?? 0} · {c.is_active ? "active" : "inactive"} · 삭제는 우측 버튼
                      </Typography>
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 900 }}
                    disabled={busy}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`채널 "${c.label || c.key}"를 삭제할까요?`)) return;
                      setBusy(true);
                      try {
                        await adminDeletePresetChannel(c.id);
                        if (activeChannelId === c.id) setActiveChannelId(null);
                        await refresh();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    삭제
                  </Button>
                </ListItemButton>
              ))}
              {sortedChannels.length === 0 ? (
                <Box sx={{ p: 2, color: "text.secondary" }}>채널이 없습니다.</Box>
              ) : null}
            </List>
          </Box>

          <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 900 }}>문의 유형 · 서포트봇</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                유저가 문의 유형을 선택할 때, 서포트봇 안내(텍스트/이미지/영상/링크)를 자동 표시합니다.
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "grid", gap: 1.25, mb: 2 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900 }}>
                  새 문의 유형 만들기
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="문의 유형 이름 (예: 결제 문의)"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(Number(e.target.value || 0))}
                    placeholder="order"
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="contained"
                    sx={{ fontWeight: 900, minWidth: 120 }}
                    disabled={busy || !newCatName.trim()}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await adminCreateTicketCategory({
                          name: newCatName.trim(),
                          order: Number(newCatOrder ?? 0),
                          bot_enabled: true,
                          bot_title: "주디 서포트봇",
                          bot_blocks: [
                            { type: "paragraph", text: "어떤 자료를 첨부해 주세요?\n- 스크린샷/영상\n- 발생 시간\n- 재현 방법" },
                          ],
                        });
                        setNewCatName("");
                        setNewCatOrder(0);
                        await refresh();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    추가
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
                <Box sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.default", overflow: "hidden" }}>
                  <List dense sx={{ maxHeight: 400, overflow: "auto" }}>
                    {sortedCats.map((c) => (
                      <ListItemButton
                        key={c.id}
                        selected={activeCatId === c.id}
                        onClick={() => setActiveCatId(c.id)}
                        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                      >
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 900 }}>{c.name}</Typography>}
                          secondary={
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              order {c.order ?? 0} · bot {c.bot_enabled ? "on" : "off"}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                    {sortedCats.length === 0 ? <Box sx={{ p: 2, color: "text.secondary" }}>카테고리가 없습니다.</Box> : null}
                  </List>
                </Box>

                {activeCat ? (
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        value={catDraft.name}
                        onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })}
                        placeholder="카테고리명"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        value={catDraft.order}
                        onChange={(e) => setCatDraft({ ...catDraft, order: Number(e.target.value || 0) })}
                        placeholder="order"
                        sx={{ width: 120 }}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={catDraft.bot_enabled}
                          onChange={(e) => setCatDraft({ ...catDraft, bot_enabled: e.target.checked })}
                        />
                      }
                      label={<Typography sx={{ fontWeight: 900 }}>서포트봇 활성</Typography>}
                    />
                    <TextField
                      value={catDraft.bot_title}
                      onChange={(e) => setCatDraft({ ...catDraft, bot_title: e.target.value })}
                      placeholder="서포트봇 제목"
                    />

                    <FaqBlockEditor
                      value={catDraft.bot_blocks}
                      onChange={(next) => setCatDraft({ ...catDraft, bot_blocks: next as any })}
                      onUploadRequested={(kind) => {
                        const url = window.prompt(`${kind.toUpperCase()} URL을 입력해 주세요`);
                        if (!url) return;
                        const next = Array.isArray(catDraft.bot_blocks) ? [...catDraft.bot_blocks] : [];
                        if (kind === "image") next.push({ type: "image", url });
                        else if (kind === "video") next.push({ type: "video", url });
                        else next.push({ type: "file", url, name: "" });
                        setCatDraft({ ...catDraft, bot_blocks: next });
                      }}
                    />

                    <Button
                      variant="contained"
                      sx={{ fontWeight: 900 }}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await adminPatchTicketCategory(activeCat.id, {
                            name: catDraft.name,
                            order: catDraft.order,
                            bot_enabled: catDraft.bot_enabled,
                            bot_title: catDraft.bot_title,
                            bot_blocks: catDraft.bot_blocks,
                          });
                          await refresh();
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      저장
                    </Button>

                    <Button
                      variant="outlined"
                      sx={{ fontWeight: 900 }}
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`문의 유형 "${activeCat.name}"를 삭제할까요?`)) return;
                        setBusy(true);
                        try {
                          await adminDeleteTicketCategory(activeCat.id);
                          setActiveCatId(null);
                          await refresh();
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ color: "text.secondary", p: 2 }}>좌측에서 카테고리를 선택하세요.</Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


