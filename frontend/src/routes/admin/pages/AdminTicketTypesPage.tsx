import { Box, Button, Checkbox, Chip, Collapse, Divider, FormControlLabel, IconButton, List, ListItemButton, ListItemText, MenuItem, Snackbar, Alert, TextField, Typography, alpha } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useEffect, useMemo, useState } from "react";

import { adminCreateTicketCategory, adminDeleteTicketCategory, adminListTicketCategories, adminPatchTicketCategory } from "../../../api/support";
import { FaqBlockEditor } from "../components/FaqBlockEditor";
import { TranslateButton } from "../components/TranslationProvider";

const I18N_LANGS = ["en", "ja", "zh-TW"] as const;
const LANG_LABELS: Record<string, string> = { ko: "한국어", en: "English", ja: "日本語", "zh-TW": "繁體中文" };

// ---------------------------------------------------------------------------
// i18n Section wrapper
// ---------------------------------------------------------------------------
function I18nSection({
  title,
  translateLabel,
  items,
  onComplete,
  children,
  defaultOpen = false,
}: {
  title: string;
  translateLabel: string;
  items: { key: string; text: string }[];
  onComplete: (results: Record<string, Record<string, string>>) => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette.info.main, 0.02),
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: (theme) => alpha(theme.palette.info.main, 0.05) },
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "info.dark" }}>{title}</Typography>
          {!open && (
            <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>
              (클릭하여 열기)
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <TranslateButton label={translateLabel} items={items} onComplete={onComplete} />
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type CatDraft = {
  name: string;
  name_i18n: Record<string, string>;
  order: number;
  platform: string;
  bot_enabled: boolean;
  bot_title: string;
  bot_title_i18n: Record<string, string>;
  bot_blocks: any[];
  bot_blocks_i18n: Record<string, any[]>;
  form_enabled: boolean;
  form_button_label: string;
  form_button_label_i18n: Record<string, string>;
  form_template: string;
  form_template_i18n: Record<string, string>;
  form_title_template: string;
  form_title_template_i18n: Record<string, string>;
  form_checklist_text: string;
  form_checklist_i18n_text: Record<string, string>; // stored as text, converted to arrays on save
  form_checklist_required: boolean;
  guide_description: string;
  guide_description_i18n: Record<string, string>;
};

function initDraft(): CatDraft {
  return {
    name: "",
    name_i18n: {},
    order: 0,
    platform: "ALL",
    guide_description: "아래 안내를 확인하고 문의를 접수하면 더 빠르게 도와드릴 수 있어요.",
    guide_description_i18n: {},
    bot_enabled: false,
    bot_title: "주디 서포트봇",
    bot_title_i18n: {},
    bot_blocks: [{ type: "paragraph", text: "" }],
    bot_blocks_i18n: {},
    form_enabled: false,
    form_button_label: "기본 양식 넣기",
    form_button_label_i18n: {},
    form_template: "",
    form_template_i18n: {},
    form_title_template: "",
    form_title_template_i18n: {},
    form_checklist_text: "",
    form_checklist_i18n_text: {},
    form_checklist_required: false,
  };
}

function loadDraft(cat: any): CatDraft {
  const toObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? { ...v } : {});
  const toArr = (v: any) => (Array.isArray(v) ? v : []);
  // Convert checklist arrays to text
  const checklistTextI18n: Record<string, string> = {};
  const cli18n = toObj(cat.form_checklist_i18n);
  for (const lk of I18N_LANGS) {
    const arr = toArr(cli18n[lk]);
    if (arr.length) checklistTextI18n[lk] = arr.map(String).join("\n");
  }
  return {
    name: cat.name ?? "",
    name_i18n: toObj(cat.name_i18n),
    order: Number(cat.order ?? 0),
    platform: String(cat.platform ?? "ALL"),
    guide_description: String(cat.guide_description ?? "아래 안내를 확인하고 문의를 접수하면 더 빠르게 도와드릴 수 있어요."),
    guide_description_i18n: toObj(cat.guide_description_i18n),
    bot_enabled: Boolean(cat.bot_enabled ?? false),
    bot_title: String(cat.bot_title ?? "주디 서포트봇"),
    bot_title_i18n: toObj(cat.bot_title_i18n),
    bot_blocks: toArr(cat.bot_blocks).length ? toArr(cat.bot_blocks) : [{ type: "paragraph", text: "" }],
    bot_blocks_i18n: toObj(cat.bot_blocks_i18n),
    form_enabled: Boolean(cat.form_enabled ?? false),
    form_button_label: String(cat.form_button_label ?? "기본 양식 넣기"),
    form_button_label_i18n: toObj(cat.form_button_label_i18n),
    form_template: String(cat.form_template ?? ""),
    form_template_i18n: toObj(cat.form_template_i18n),
    form_title_template: String(cat.form_title_template ?? ""),
    form_title_template_i18n: toObj(cat.form_title_template_i18n),
    form_checklist_text: toArr(cat.form_checklist).map(String).join("\n"),
    form_checklist_i18n_text: checklistTextI18n,
    form_checklist_required: Boolean(cat.form_checklist_required ?? false),
  };
}

export function AdminTicketTypesPage() {
  const [ticketCats, setTicketCats] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState<number>(0);
  const [newCatBotText, setNewCatBotText] = useState("어떤 자료를 첨부해 주세요?\n- 스크린샷/영상\n- 발생 시간\n- 재현 방법");
  const [toast, setToast] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({ open: false, severity: "success", message: "" });
  const [catDraft, setCatDraft] = useState<CatDraft>(initDraft());

  async function refresh() {
    const tc = await adminListTicketCategories();
    setTicketCats(tc ?? []);
  }

  useEffect(() => {
    refresh().catch(() => setTicketCats([]));
  }, []);

  const sortedCats = useMemo(() => [...ticketCats].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id), [ticketCats]);
  const activeCat = useMemo(() => (activeCatId ? ticketCats.find((t) => t.id === activeCatId) : null) ?? null, [ticketCats, activeCatId]);

  useEffect(() => {
    if (!activeCat) return;
    setCatDraft(loadDraft(activeCat));
  }, [activeCatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasI18n = I18N_LANGS.some((lk) => (catDraft.name_i18n[lk] || "").trim());

  // Save handler
  async function handleSave() {
    if (!activeCat) return;
    setBusy(true);
    try {
      // Convert checklist text to arrays
      const form_checklist = catDraft.form_checklist_text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const form_checklist_i18n: Record<string, string[]> = {};
      for (const lk of I18N_LANGS) {
        const txt = catDraft.form_checklist_i18n_text[lk] || "";
        if (txt.trim()) {
          form_checklist_i18n[lk] = txt
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      await adminPatchTicketCategory(activeCat.id, {
        name: catDraft.name,
        name_i18n: catDraft.name_i18n,
        order: catDraft.order,
        platform: catDraft.platform,
        guide_description: catDraft.guide_description,
        guide_description_i18n: catDraft.guide_description_i18n,
        bot_enabled: catDraft.bot_enabled,
        bot_title: catDraft.bot_title,
        bot_title_i18n: catDraft.bot_title_i18n,
        bot_blocks: catDraft.bot_blocks,
        bot_blocks_i18n: catDraft.bot_blocks_i18n,
        form_enabled: catDraft.form_enabled,
        form_button_label: catDraft.form_button_label,
        form_button_label_i18n: catDraft.form_button_label_i18n,
        form_template: catDraft.form_template,
        form_template_i18n: catDraft.form_template_i18n,
        form_title_template: catDraft.form_title_template,
        form_title_template_i18n: catDraft.form_title_template_i18n,
        form_checklist,
        form_checklist_i18n,
        form_checklist_required: catDraft.form_checklist_required,
      } as any);
      await refresh();
      setToast({ open: true, severity: "success", message: "저장되었습니다." });
    } catch (e: any) {
      let detail = String(e?.message || e);
      if (e?.payload && typeof e.payload === "object") {
        const parts = Object.entries(e.payload).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
        if (parts.length) detail = parts.join("; ");
      }
      setToast({ open: true, severity: "error", message: `저장 실패: ${detail}` });
    } finally {
      setBusy(false);
    }
  }

  // Helper: get all text blocks from bot_blocks as single string (for translation)
  function blocksToText(blocks: any[]): string {
    return (Array.isArray(blocks) ? blocks : [])
      .filter((b: any) => b.type === "paragraph" && b.text)
      .map((b: any) => b.text)
      .join("\n\n");
  }

  return (
    <>
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "320px 1fr", bgcolor: "background.default", overflow: "hidden" }}>
      {/* left list */}
      <Box sx={{ bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>문의 유형 관리</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            유저 문의하기에 노출되는 카테고리와 서포트봇 안내를 관리합니다.
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="새 유형 이름 (예: 이벤트 문의)"
            />
            <TextField
              size="small"
              fullWidth
              value={newCatOrder}
              onChange={(e) => setNewCatOrder(Number(e.target.value || 0))}
              placeholder="순서 (order)"
            />
            <TextField
              size="small"
              fullWidth
              multiline
              rows={3}
              value={newCatBotText}
              onChange={(e) => setNewCatBotText(e.target.value)}
              placeholder="초기 안내 문구"
              helperText="새 유형 생성 시 서포트봇 안내로 사용됩니다"
            />
            <Button
              variant="contained"
              fullWidth
              sx={{ fontWeight: 900, borderRadius: 1.5, mt: 0.5 }}
              disabled={busy || !newCatName.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  await adminCreateTicketCategory({
                    name: newCatName.trim(),
                    order: Number(newCatOrder ?? 0),
                    bot_enabled: true,
                    bot_title: "주디 서포트봇",
                    bot_blocks: [{ type: "paragraph", text: newCatBotText }],
                  });
                  setNewCatName("");
                  setNewCatOrder(0);
                  setNewCatBotText("어떤 자료를 첨부해 주세요?\n- 스크린샷/영상\n- 발생 시간\n- 재현 방법");
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              + 문의 유형 추가
            </Button>
          </Box>
        </Box>
        <Divider />
        <List dense sx={{ overflow: "auto", flex: 1 }}>
          {sortedCats.map((c) => {
            const hasTrans = I18N_LANGS.some((lk) => (c.name_i18n?.[lk] || "").trim());
            return (
              <ListItemButton
                key={c.id}
                selected={activeCatId === c.id}
                onClick={() => setActiveCatId(c.id)}
                sx={{
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&.Mui-selected": { bgcolor: "rgba(37,99,235,0.08)" }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      {hasTrans && <Chip label="i18n" size="small" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 18, bgcolor: "rgba(34,197,94,0.15)", color: "#16A34A" }} />}
                      <Typography sx={{ fontWeight: 900, flex: 1 }} noWrap>{c.name}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                      순서: {c.order ?? 0} · 플랫폼: {c.platform === "ANDROID" ? "안드로이드" : c.platform === "IOS" ? "iOS" : "전체"} · 봇: {c.bot_enabled ? "ON" : "OFF"}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
          {sortedCats.length === 0 ? <Box sx={{ p: 2, color: "text.secondary" }}>문의 유형이 없습니다.</Box> : null}
        </List>
      </Box>

      {/* editor */}
      <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeCat ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center", opacity: 0.5 }}>
            <Typography sx={{ fontWeight: 900 }}>좌측에서 관리할 문의 유형을 선택해 주세요.</Typography>
          </Box>
        ) : (
          <>
            {/* Header with save/delete buttons */}
            <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>문의 유형: {activeCat.name}</Typography>
                {hasI18n && <Chip label="i18n" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20, bgcolor: "rgba(34,197,94,0.15)", color: "#16A34A" }} />}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ fontWeight: 900, px: 4 }}
                  disabled={busy}
                  onClick={handleSave}
                >
                  저장하기
                </Button>
                <Button
                  variant="outlined"
                  color="error"
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
            </Box>

            {/* Scrollable content */}
            <Box sx={{ p: 3, overflow: "auto", flex: 1, display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 900, display: "grid", gap: 2.5, py: 2 }}>

                {/* ============================================ */}
                {/* Basic Info */}
                {/* ============================================ */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 900, color: "text.secondary" }}>기본 정보</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: 2 }}>
                    <TextField
                      label="유형 이름 (KO)"
                      fullWidth
                      value={catDraft.name}
                      onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })}
                      InputProps={{ sx: { fontWeight: 900 } }}
                    />
                    <TextField
                      select
                      label="플랫폼"
                      value={catDraft.platform}
                      onChange={(e) => setCatDraft({ ...catDraft, platform: e.target.value })}
                      InputProps={{ sx: { fontWeight: 900 } }}
                    >
                      <MenuItem value="ALL">전체</MenuItem>
                      <MenuItem value="ANDROID">안드로이드</MenuItem>
                      <MenuItem value="IOS">iOS</MenuItem>
                    </TextField>
                    <TextField
                      label="정렬 순서"
                      value={catDraft.order}
                      onChange={(e) => setCatDraft({ ...catDraft, order: Number(e.target.value || 0) })}
                    />
                  </Box>

                  {/* i18n name */}
                  <I18nSection
                    title="다국어 유형 이름"
                    translateLabel={catDraft.name || "유형 이름"}
                    items={[{ key: "name", text: catDraft.name }]}
                    onComplete={(r) => {
                      if (r.name) setCatDraft((p) => ({ ...p, name_i18n: { ...p.name_i18n, ...r.name } }));
                    }}
                  >
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                      {I18N_LANGS.map((lk) => (
                        <TextField
                          key={lk}
                          size="small"
                          label={LANG_LABELS[lk]}
                          placeholder={catDraft.name}
                          value={catDraft.name_i18n[lk] || ""}
                          onChange={(e) => setCatDraft((p) => ({ ...p, name_i18n: { ...p.name_i18n, [lk]: e.target.value } }))}
                          InputProps={{ sx: { fontSize: "0.85rem" } }}
                          InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                        />
                      ))}
                    </Box>
                  </I18nSection>

                  <TextField
                    fullWidth
                    label="유저 안내 문구 (KO)"
                    multiline
                    rows={2}
                    value={catDraft.guide_description}
                    onChange={(e) => setCatDraft({ ...catDraft, guide_description: e.target.value })}
                    placeholder="아래 안내를 확인하고 문의를 접수하면 더 빠르게 도와드릴 수 있어요."
                    helperText="문의 유형 안내 페이지 상단에 표시됩니다"
                  />

                  {/* i18n guide_description */}
                  <I18nSection
                    title="다국어 안내 문구"
                    translateLabel={catDraft.name || "안내 문구"}
                    items={[
                      { key: "name", text: catDraft.name },
                      { key: "guide_description", text: catDraft.guide_description },
                    ]}
                    onComplete={(r) => {
                      if (r.name) setCatDraft((p) => ({ ...p, name_i18n: { ...p.name_i18n, ...r.name } }));
                      if (r.guide_description) setCatDraft((p) => ({ ...p, guide_description_i18n: { ...p.guide_description_i18n, ...r.guide_description } }));
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      {I18N_LANGS.map((lk) => (
                        <TextField
                          key={lk}
                          size="small"
                          label={`${LANG_LABELS[lk]} 안내 문구`}
                          placeholder={catDraft.guide_description}
                          value={catDraft.guide_description_i18n[lk] || ""}
                          onChange={(e) => setCatDraft((p) => ({ ...p, guide_description_i18n: { ...p.guide_description_i18n, [lk]: e.target.value } }))}
                          multiline
                          rows={2}
                          InputProps={{ sx: { fontSize: "0.85rem" } }}
                          InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                        />
                      ))}
                    </Box>
                  </I18nSection>
                </Box>

                <Divider />

                {/* ============================================ */}
                {/* Support Bot Section */}
                {/* ============================================ */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 900, color: "text.secondary" }}>서포트봇 자동 안내</Typography>
                    <FormControlLabel
                      control={<Checkbox checked={catDraft.bot_enabled} onChange={(e) => setCatDraft({ ...catDraft, bot_enabled: e.target.checked })} />}
                      label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>활성화</Typography>}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="안내 제목 (KO)"
                    size="small"
                    value={catDraft.bot_title}
                    onChange={(e) => setCatDraft({ ...catDraft, bot_title: e.target.value })}
                  />

                  {/* i18n bot_title */}
                  <I18nSection
                    title="다국어 안내 제목"
                    translateLabel="안내 제목"
                    items={[{ key: "bot_title", text: catDraft.bot_title }]}
                    onComplete={(r) => {
                      if (r.bot_title) setCatDraft((p) => ({ ...p, bot_title_i18n: { ...p.bot_title_i18n, ...r.bot_title } }));
                    }}
                  >
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                      {I18N_LANGS.map((lk) => (
                        <TextField
                          key={lk}
                          size="small"
                          label={LANG_LABELS[lk]}
                          placeholder={catDraft.bot_title}
                          value={catDraft.bot_title_i18n[lk] || ""}
                          onChange={(e) => setCatDraft((p) => ({ ...p, bot_title_i18n: { ...p.bot_title_i18n, [lk]: e.target.value } }))}
                          InputProps={{ sx: { fontSize: "0.85rem" } }}
                          InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                        />
                      ))}
                    </Box>
                  </I18nSection>

                  <Box sx={{ bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 1, p: 2 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900, mb: 1.5, display: "block" }}>
                      안내 본문 (KO)
                    </Typography>
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
                      tone="dark"
                    />
                  </Box>

                  {/* i18n bot_blocks - translate text blocks, per-language block editors */}
                  <I18nSection
                    title="다국어 안내 본문"
                    translateLabel="안내 본문"
                    items={(() => {
                      // Collect all paragraph texts from bot_blocks
                      const texts = (Array.isArray(catDraft.bot_blocks) ? catDraft.bot_blocks : [])
                        .filter((b: any) => b.type === "paragraph" && b.text)
                        .map((b: any, i: number) => ({ key: `bot_block_${i}`, text: b.text }));
                      return texts.length ? texts : [{ key: "bot_block_0", text: blocksToText(catDraft.bot_blocks) }];
                    })()}
                    onComplete={(results) => {
                      // Merge translated blocks into bot_blocks_i18n
                      const paragraphs = (Array.isArray(catDraft.bot_blocks) ? catDraft.bot_blocks : []).filter((b: any) => b.type === "paragraph" && b.text);
                      setCatDraft((prev) => {
                        const newI18n = { ...prev.bot_blocks_i18n };
                        for (const lk of I18N_LANGS) {
                          // Build translated blocks array
                          const existing = Array.isArray(newI18n[lk]) ? [...newI18n[lk]] : [];
                          if (existing.length === 0) {
                            // Initialize from Korean blocks with translated text
                            const translated = (Array.isArray(prev.bot_blocks) ? prev.bot_blocks : []).map((b: any, i: number) => {
                              if (b.type === "paragraph") {
                                const key = `bot_block_${paragraphs.indexOf(b) >= 0 ? paragraphs.indexOf(b) : i}`;
                                return { ...b, text: results[key]?.[lk] || b.text };
                              }
                              return { ...b };
                            });
                            newI18n[lk] = translated;
                          } else {
                            // Update existing paragraph blocks
                            let pIdx = 0;
                            for (let j = 0; j < existing.length; j++) {
                              if (existing[j].type === "paragraph") {
                                const key = `bot_block_${pIdx}`;
                                if (results[key]?.[lk]) {
                                  existing[j] = { ...existing[j], text: results[key][lk] };
                                }
                                pIdx++;
                              }
                            }
                            newI18n[lk] = existing;
                          }
                        }
                        return { ...prev, bot_blocks_i18n: newI18n };
                      });
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 2 }}>
                      {I18N_LANGS.map((lk) => (
                        <Box key={lk}>
                          <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: "block", color: "info.dark" }}>
                            {LANG_LABELS[lk]} 안내 본문
                          </Typography>
                          <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                            <FaqBlockEditor
                              value={Array.isArray(catDraft.bot_blocks_i18n[lk]) ? catDraft.bot_blocks_i18n[lk] : []}
                              onChange={(next) =>
                                setCatDraft((p) => ({
                                  ...p,
                                  bot_blocks_i18n: { ...p.bot_blocks_i18n, [lk]: next as any },
                                }))
                              }
                              onUploadRequested={(kind) => {
                                const url = window.prompt(`${kind.toUpperCase()} URL을 입력해 주세요`);
                                if (!url) return;
                                const arr = Array.isArray(catDraft.bot_blocks_i18n[lk]) ? [...catDraft.bot_blocks_i18n[lk]] : [];
                                if (kind === "image") arr.push({ type: "image", url });
                                else if (kind === "video") arr.push({ type: "video", url });
                                else arr.push({ type: "file", url, name: "" });
                                setCatDraft((p) => ({ ...p, bot_blocks_i18n: { ...p.bot_blocks_i18n, [lk]: arr } }));
                              }}
                              tone="dark"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </I18nSection>
                </Box>

                <Divider />

                {/* ============================================ */}
                {/* Form Template Section */}
                {/* ============================================ */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 900, color: "text.secondary" }}>문의 양식 템플릿</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={catDraft.form_enabled}
                          onChange={(e) => setCatDraft({ ...catDraft, form_enabled: e.target.checked })}
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>양식 버튼 노출</Typography>}
                    />
                  </Box>

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <TextField
                      label="버튼 문구 (KO)"
                      size="small"
                      value={catDraft.form_button_label}
                      onChange={(e) => setCatDraft({ ...catDraft, form_button_label: e.target.value })}
                    />

                    {/* i18n form_button_label */}
                    <I18nSection
                      title="다국어 버튼 문구"
                      translateLabel="버튼 문구"
                      items={[{ key: "form_button_label", text: catDraft.form_button_label }]}
                      onComplete={(r) => {
                        if (r.form_button_label) setCatDraft((p) => ({ ...p, form_button_label_i18n: { ...p.form_button_label_i18n, ...r.form_button_label } }));
                      }}
                    >
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                        {I18N_LANGS.map((lk) => (
                          <TextField
                            key={lk}
                            size="small"
                            label={LANG_LABELS[lk]}
                            placeholder={catDraft.form_button_label}
                            value={catDraft.form_button_label_i18n[lk] || ""}
                            onChange={(e) => setCatDraft((p) => ({ ...p, form_button_label_i18n: { ...p.form_button_label_i18n, [lk]: e.target.value } }))}
                            InputProps={{ sx: { fontSize: "0.85rem" } }}
                            InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                          />
                        ))}
                      </Box>
                    </I18nSection>

                    <TextField
                      label="제목 템플릿 (KO)"
                      size="small"
                      value={catDraft.form_title_template}
                      onChange={(e) => setCatDraft({ ...catDraft, form_title_template: e.target.value })}
                      placeholder="예: [{{uuid}}] 결제 오류 확인 요청"
                    />

                    {/* i18n form_title_template */}
                    <I18nSection
                      title="다국어 제목 템플릿"
                      translateLabel="제목 템플릿"
                      items={[{ key: "form_title_template", text: catDraft.form_title_template }]}
                      onComplete={(r) => {
                        if (r.form_title_template) setCatDraft((p) => ({ ...p, form_title_template_i18n: { ...p.form_title_template_i18n, ...r.form_title_template } }));
                      }}
                    >
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                        {I18N_LANGS.map((lk) => (
                          <TextField
                            key={lk}
                            size="small"
                            label={LANG_LABELS[lk]}
                            placeholder={catDraft.form_title_template}
                            value={catDraft.form_title_template_i18n[lk] || ""}
                            onChange={(e) => setCatDraft((p) => ({ ...p, form_title_template_i18n: { ...p.form_title_template_i18n, [lk]: e.target.value } }))}
                            InputProps={{ sx: { fontSize: "0.85rem" } }}
                            InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                          />
                        ))}
                      </Box>
                    </I18nSection>

                    <TextField
                      label="본문 템플릿 (KO)"
                      value={catDraft.form_template}
                      onChange={(e) => setCatDraft({ ...catDraft, form_template: e.target.value })}
                      multiline
                      minRows={5}
                      placeholder={"예:\n\n문의 내용:\n\n발생 시각:\n\n유저 ID: {{uuid}}\n이메일: {{email}}"}
                      InputProps={{ sx: { fontSize: "0.9rem" } }}
                    />

                    {/* i18n form_template */}
                    <I18nSection
                      title="다국어 본문 템플릿"
                      translateLabel="본문 템플릿"
                      items={[{ key: "form_template", text: catDraft.form_template }]}
                      onComplete={(r) => {
                        if (r.form_template) setCatDraft((p) => ({ ...p, form_template_i18n: { ...p.form_template_i18n, ...r.form_template } }));
                      }}
                    >
                      <Box sx={{ display: "grid", gap: 1.5 }}>
                        {I18N_LANGS.map((lk) => (
                          <TextField
                            key={lk}
                            size="small"
                            label={`${LANG_LABELS[lk]} 본문 템플릿`}
                            placeholder={catDraft.form_template}
                            value={catDraft.form_template_i18n[lk] || ""}
                            onChange={(e) => setCatDraft((p) => ({ ...p, form_template_i18n: { ...p.form_template_i18n, [lk]: e.target.value } }))}
                            multiline
                            minRows={4}
                            InputProps={{ sx: { fontSize: "0.85rem" } }}
                            InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                          />
                        ))}
                      </Box>
                    </I18nSection>
                  </Box>
                </Box>

                <Divider />

                {/* ============================================ */}
                {/* Checklist Section */}
                {/* ============================================ */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 900, color: "text.secondary" }}>제출 전 체크리스트</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={catDraft.form_checklist_required}
                          onChange={(e) => setCatDraft({ ...catDraft, form_checklist_required: e.target.checked })}
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 900 }}>모두 체크 필수</Typography>}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="체크 항목 (KO, 줄바꿈으로 구분)"
                    value={catDraft.form_checklist_text}
                    onChange={(e) => setCatDraft({ ...catDraft, form_checklist_text: e.target.value })}
                    multiline
                    minRows={4}
                    placeholder={"예:\n스크린샷 또는 영상을 첨부했습니다\n문제 발생 시각을 기재했습니다\n재현 방법을 설명했습니다"}
                  />

                  {/* i18n checklist */}
                  <I18nSection
                    title="다국어 체크리스트"
                    translateLabel="체크리스트"
                    items={
                      catDraft.form_checklist_text
                        .split("\n")
                        .filter((s) => s.trim())
                        .map((s, i) => ({ key: `checklist_${i}`, text: s.trim() }))
                    }
                    onComplete={(results) => {
                      setCatDraft((prev) => {
                        const newTexts = { ...prev.form_checklist_i18n_text };
                        for (const lk of I18N_LANGS) {
                          const lines: string[] = [];
                          const items = prev.form_checklist_text.split("\n").filter((s) => s.trim());
                          items.forEach((_, i) => {
                            const key = `checklist_${i}`;
                            if (results[key]?.[lk]) lines.push(results[key][lk]);
                          });
                          if (lines.length) newTexts[lk] = lines.join("\n");
                        }
                        return { ...prev, form_checklist_i18n_text: newTexts };
                      });
                    }}
                  >
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      {I18N_LANGS.map((lk) => (
                        <TextField
                          key={lk}
                          size="small"
                          label={`${LANG_LABELS[lk]} 체크 항목 (줄바꿈으로 구분)`}
                          placeholder={catDraft.form_checklist_text}
                          value={catDraft.form_checklist_i18n_text[lk] || ""}
                          onChange={(e) => setCatDraft((p) => ({ ...p, form_checklist_i18n_text: { ...p.form_checklist_i18n_text, [lk]: e.target.value } }))}
                          multiline
                          minRows={3}
                          InputProps={{ sx: { fontSize: "0.85rem" } }}
                          InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                        />
                      ))}
                    </Box>
                  </I18nSection>
                </Box>

                {/* Footer */}
                <Box sx={{
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "2px solid",
                  borderColor: "divider",
                  mt: 3,
                  opacity: 0.3
                }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    모든 설정 완료 · 상단 저장 버튼을 눌러주세요
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>

    <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} sx={{ fontWeight: 700 }}>{toast.message}</Alert>
    </Snackbar>
    </>
  );
}
