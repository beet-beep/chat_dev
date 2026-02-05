import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TableChartIcon from "@mui/icons-material/TableChart";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TranslateButton } from "../components/TranslationProvider";

import {
  adminCreateFaq,
  adminCreateFaqCategory,
  adminDeleteFaq,
  adminDeleteFaqCategory,
  adminListFaqCategories,
  adminListFaqs,
  adminPatchFaq,
  adminPatchFaqCategory,
  adminUploadFaqFiles,
} from "../../../api/support";

type AdminFaq = any;
type AdminCategory = any;

const I18N_LANGS = ["en", "ja", "zh-TW"] as const;
const LANG_LABELS: Record<string, string> = { ko: "한국어", en: "English", ja: "日本語", "zh-TW": "繁體中文" };

function looksLikeHtml(s: any) {
  const t = String(s || "").trim();
  if (!t) return false;
  return /<\/?[a-z][\s\S]*>/i.test(t);
}

function escapeHtml(s: string) {
  const t = String(s || "");
  return t
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;")
    .split("'")
    .join("&#039;");
}

function blocksToHtml(blocks: any[]): string {
  const b = Array.isArray(blocks) ? blocks : [];
  const out: string[] = [];
  for (const it of b) {
    const type = String(it?.type || "");
    if (type === "paragraph") out.push(`<p>${escapeHtml(String(it?.text || ""))}</p>`);
    else if (type === "heading") out.push(`<h3>${escapeHtml(String(it?.text || ""))}</h3>`);
    else if (type === "callout") out.push(`<blockquote>${escapeHtml(String(it?.text || ""))}</blockquote>`);
    else if (type === "bullets") {
      const items = Array.isArray(it?.items) ? it.items : [];
      out.push(`<ul>${items.map((x: any) => `<li>${escapeHtml(String(x || ""))}</li>`).join("")}</ul>`);
    } else if (type === "numbered") {
      const items = Array.isArray(it?.items) ? it.items : [];
      out.push(`<ol>${items.map((x: any) => `<li>${escapeHtml(String(x || ""))}</li>`).join("")}</ol>`);
    } else if (type === "divider") out.push("<hr/>");
    else if (type === "image") out.push(`<p><img src="${escapeHtml(String(it?.url || ""))}" /></p>`);
    else if (type === "video") out.push(`<p><video controls src="${escapeHtml(String(it?.url || ""))}"></video></p>`);
    else if (type === "file") {
      const url = String(it?.url || "");
      const name = String(it?.name || url);
      out.push(`<p><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a></p>`);
    }
  }
  const html = out.join("");
  return html || "<p></p>";
}

export function AdminFaqPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [faqs, setFaqs] = useState<AdminFaq[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  // right sidebar state
  const [newCatName, setNewCatName] = useState("");
  const [newCatUrl, setNewCatUrl] = useState("");
  const [newCatIsGuide, setNewCatIsGuide] = useState(false);
  const [newCatOrder, setNewCatOrder] = useState<number>(0);

  // Draft state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState<number | "">("");
  const [draftPopular, setDraftPopular] = useState(false);
  const [draftHidden, setDraftHidden] = useState(false);
  const [draftTitleI18n, setDraftTitleI18n] = useState<Record<string, string>>({});
  const [draftBodyI18n, setDraftBodyI18n] = useState<Record<string, string>>({});
  const [bodyLangTab, setBodyLangTab] = useState<string>("ko");
  const draftInitForId = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<"html" | "preview">("html");

  const guideCats = useMemo(() => {
    const list = categories ?? [];
    return [...list]
      .filter((c: any) => Boolean(c.is_guide_link) || c.kind === "GUIDE")
      .sort((a: any, b: any) => (Number(a.order ?? 0) - Number(b.order ?? 0)) || (a.id - b.id));
  }, [categories]);

  const mainCats = useMemo(() => {
    const list = categories ?? [];
    return [...list]
      .filter((c: any) => !(Boolean(c.is_guide_link) || c.kind === "GUIDE"))
      .sort((a: any, b: any) => (Number(a.order ?? 0) - Number(b.order ?? 0)) || (a.id - b.id));
  }, [categories]);

  async function refresh() {
    setError(null);
    try {
      const [cats, docs] = await Promise.all([adminListFaqCategories(), adminListFaqs()]);
      setCategories(cats);
      setFaqs(docs);

      const faqIdFromUrl = searchParams.get("faq");
      const faqIdNum = faqIdFromUrl ? Number(faqIdFromUrl) : null;

      if (faqIdNum && docs.some((d: any) => d.id === faqIdNum)) {
        setActiveId(faqIdNum);
      } else {
        setActiveId((prev) => {
          if (prev && docs.some((d: any) => d.id === prev)) return prev;
          const firstId = docs.length ? docs[0].id : null;
          if (firstId) {
            setSearchParams({ faq: String(firstId) }, { replace: true });
          }
          return firstId;
        });
      }
    } catch (e: any) {
      setCategories([]);
      setFaqs([]);
      setError(String(e?.payload?.detail || e?.message || e));
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!faqs) return null;
    if (!Array.isArray(faqs)) return [];
    if (!s) return faqs;
    return faqs.filter((f: any) => `${f.title} ${f.body}`.toLowerCase().includes(s));
  }, [faqs, q]);

  const active = useMemo(() => (Array.isArray(faqs) ? faqs.find((f: any) => f.id === activeId) : null) ?? null, [faqs, activeId]);

  useEffect(() => {
    if (!active) return;
    if (draftInitForId.current === active.id) return;
    draftInitForId.current = active.id;

    const body =
      looksLikeHtml(active.body)
        ? String(active.body || "")
        : Array.isArray(active.blocks) && active.blocks.length
        ? blocksToHtml(active.blocks)
        : String(active.body || "");

    setDraftTitle(String(active.title || ""));
    setDraftBody(body || "<p></p>");
    setDraftCategoryId(active.category?.id ?? "");
    setDraftPopular(Boolean(active.is_popular));
    setDraftHidden(Boolean(active.is_hidden));
    setDraftTitleI18n(active.title_i18n || {});
    setDraftBodyI18n(active.body_i18n || {});
    setBodyLangTab("ko");
    setViewMode("html");
  }, [activeId, active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!draftCategoryId) return;
    if (!mainCats.length) return;
    if (mainCats.some((c) => c.id === Number(draftCategoryId))) return;
    setDraftCategoryId("");
  }, [draftCategoryId, mainCats]);

  async function onCreateCategory() {
    if (!newCatName.trim()) return;
    setBusy(true);
    try {
      await adminCreateFaqCategory({
        name: newCatName.trim(),
        guide_url: newCatIsGuide ? newCatUrl.trim() || "" : "",
        kind: newCatIsGuide ? "GUIDE" : "GENERAL",
        is_guide_link: newCatIsGuide,
        order: Number(newCatOrder ?? 0),
      } as any);
      setNewCatName("");
      setNewCatUrl("");
      setNewCatIsGuide(false);
      setNewCatOrder(0);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function updateCategory(catId: number, patch: Record<string, any>) {
    setCategories((prev) =>
      (prev ?? []).map((c: any) => (c.id === catId ? { ...c, ...patch } : c))
    );
  }

  async function onSaveCategory(cat: any) {
    setBusy(true);
    try {
      const saved = await adminPatchFaqCategory(cat.id, {
        guide_url: cat.is_guide_link ? cat.guide_url || "" : "",
        name: cat.name,
        name_i18n: cat.name_i18n || {},
        order: Number(cat.order ?? 0),
        kind: cat.is_guide_link ? "GUIDE" : "GENERAL",
        is_guide_link: Boolean(cat.is_guide_link),
      } as any);
      updateCategory(cat.id, saved);
      setToast({ open: true, severity: "success", message: "카테고리 저장 완료" });
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

  async function onCreateFaq() {
    setBusy(true);
    setError(null);
    try {
      const firstMain = mainCats[0];
      const doc = await adminCreateFaq({
        category_id: firstMain?.id ?? null,
        title: "새 FAQ",
        body: "",
        blocks: [],
        is_popular: false,
        is_hidden: false,
        order: 0,
      });
      await refresh();
      setActiveId(doc.id);
      setSearchParams({ faq: String(doc.id) }, { replace: true });
      setToast({ open: true, severity: "success", message: "새 FAQ를 생성했어요." });
    } catch (e: any) {
      const msg = String(e?.payload?.detail || e?.message || e);
      setError(msg);
      setToast({ open: true, severity: "error", message: `FAQ 생성 실패: ${msg}` });
    } finally {
      setBusy(false);
    }
  }

  async function onSaveFaq() {
    if (!active) return;
    const bodyToSave = String(draftBody || "");
    const catId = draftCategoryId === "" ? null : Number(draftCategoryId);

    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        title: String(draftTitle || "").trim() || "제목 없음",
        title_i18n: draftTitleI18n,
        body: bodyToSave,
        body_i18n: draftBodyI18n,
        blocks: [],
        is_popular: Boolean(draftPopular),
        is_hidden: Boolean(draftHidden),
        order: Number(active.order ?? 0),
      };
      if (catId !== null) {
        payload.category_id = catId;
      }

      await adminPatchFaq(active.id, payload);
      setFaqs((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((f: any) =>
          f.id !== active.id
            ? f
            : {
                ...f,
                title: payload.title,
                title_i18n: draftTitleI18n,
                body: bodyToSave,
                body_i18n: draftBodyI18n,
                is_popular: Boolean(draftPopular),
                is_hidden: Boolean(draftHidden),
                category:
                  catId === null
                    ? f.category
                    : (categories ?? []).find((c: any) => c.id === catId) ?? f.category,
              }
        );
      });
      setToast({ open: true, severity: "success", message: "FAQ 저장 완료" });
    } catch (e: any) {
      const msg = String(e?.payload?.detail || e?.message || e);
      setError(msg);
      setToast({ open: true, severity: "error", message: `저장 실패: ${msg}` });
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteActiveFaq() {
    if (!active?.id) return;
    const ok = window.confirm("이 FAQ를 삭제할까요? (복구 불가)");
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await adminDeleteFaq(active.id);
      const next = (faqs ?? []).filter((f: any) => f.id !== active.id);
      setFaqs(next);
      setActiveId(next[0]?.id ?? null);
      setToast({ open: true, severity: "success", message: "FAQ를 삭제했어요." });
    } catch (e: any) {
      const msg = String(e?.payload?.detail || e?.message || e);
      setError(msg);
      setToast({ open: true, severity: "error", message: `삭제 실패: ${msg}` });
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteCategory(cat: any) {
    if (!cat?.id) return;
    const ok = window.confirm(`'${cat.name}' 카테고리를 삭제할까요? 이 카테고리에 속한 문서들의 카테고리가 해제됩니다.`);
    if (!ok) return;
    setBusy(true);
    try {
      await adminDeleteFaqCategory(cat.id);
      await refresh();
    } catch (e: any) {
      setError(String(e?.payload?.detail || e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function onUploadMedia(files: File[]) {
    if (!active || !files.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminUploadFaqFiles(active.id, files);
      const attachments = res.attachments ?? [];

      let insertHtml = "";
      for (const a of attachments) {
        const ct = String(a.content_type || "");
        if (ct.startsWith("image/")) {
          insertHtml += `<p><img src="${a.url}" alt="${a.original_name || ''}" style="max-width: 100%;" /></p>\n`;
        } else if (ct.startsWith("video/")) {
          insertHtml += `<p><video controls src="${a.url}" style="max-width: 100%;"></video></p>\n`;
        } else {
          insertHtml += `<p><a href="${a.url}" target="_blank" rel="noreferrer">${a.original_name || a.url}</a></p>\n`;
        }
      }

      if (bodyLangTab === "ko") {
        setDraftBody((prev) => prev + "\n" + insertHtml);
      } else {
        setDraftBodyI18n((prev) => ({ ...prev, [bodyLangTab]: (prev[bodyLangTab] || "") + "\n" + insertHtml }));
      }

      setToast({ open: true, severity: "success", message: "미디어를 삽입했어요. 저장을 눌러 반영하세요." });
    } catch (e: any) {
      const msg = String(e?.payload?.detail || e?.message || e);
      setError(msg);
      setToast({ open: true, severity: "error", message: `업로드 실패: ${msg}` });
    } finally {
      setBusy(false);
    }
  }

  function insertDivider() {
    if (bodyLangTab === "ko") {
      setDraftBody((prev) => prev + "\n<hr />\n");
    } else {
      setDraftBodyI18n((prev) => ({ ...prev, [bodyLangTab]: (prev[bodyLangTab] || "") + "\n<hr />\n" }));
    }
    setToast({ open: true, severity: "info", message: "구분선을 삽입했어요." });
  }

  function insertToggle() {
    const title = window.prompt("토글 제목을 입력하세요:");
    if (!title) return;
    const content = window.prompt("토글 내용을 입력하세요:");
    if (!content) return;
    const toggleHtml = `
<details style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0;">
  <summary style="cursor: pointer; font-weight: 700; list-style: none; display: flex; align-items: center;">
    <span style="margin-right: 8px;">▶</span> ${title}
  </summary>
  <div style="margin-top: 12px; padding-left: 24px;">
    ${content}
  </div>
</details>
`;
    if (bodyLangTab === "ko") {
      setDraftBody((prev) => prev + "\n" + toggleHtml);
    } else {
      setDraftBodyI18n((prev) => ({ ...prev, [bodyLangTab]: (prev[bodyLangTab] || "") + "\n" + toggleHtml }));
    }
    setToast({ open: true, severity: "info", message: "토글을 삽입했어요." });
  }

  function insertTable() {
    const cols = window.prompt("열 개수:", "3");
    const rows = window.prompt("행 개수:", "3");
    if (!cols || !rows) return;
    const c = parseInt(cols);
    const r = parseInt(rows);
    if (isNaN(c) || isNaN(r) || c < 1 || r < 1) return;
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 1em 0; border: 1px solid #d1d5db;"><tbody>';
    for (let i = 0; i < r; i++) {
      tableHtml += "<tr>";
      for (let j = 0; j < c; j++) {
        tableHtml += '<td style="border: 1px solid #d1d5db; padding: 10px 12px;"><br></td>';
      }
      tableHtml += "</tr>";
    }
    tableHtml += "</tbody></table><p><br></p>";
    if (bodyLangTab === "ko") {
      setDraftBody((prev) => prev + "\n" + tableHtml);
    } else {
      setDraftBodyI18n((prev) => ({ ...prev, [bodyLangTab]: (prev[bodyLangTab] || "") + "\n" + tableHtml }));
    }
    setToast({ open: true, severity: "info", message: "표를 삽입했어요." });
  }

  // Current body value for the active body tab
  const currentBodyValue = bodyLangTab === "ko" ? draftBody : (draftBodyI18n[bodyLangTab] || "");
  const setCurrentBodyValue = (val: string) => {
    if (bodyLangTab === "ko") {
      setDraftBody(val);
    } else {
      setDraftBodyI18n((prev) => ({ ...prev, [bodyLangTab]: val }));
    }
  };

  // Translation status chips
  const i18nStatus = I18N_LANGS.map((lk) => ({
    lang: lk,
    hasTitle: Boolean((draftTitleI18n[lk] || "").trim()),
    hasBody: Boolean((draftBodyI18n[lk] || "").trim()),
  }));

  return (
    <>
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "300px 1fr 380px", overflow: "hidden" }}>
      {/* left: document list */}
      <Box sx={{ bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1.5 }}>FAQ CMS</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="문서 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5, bgcolor: "rgba(15,23,42,0.02)" }
            }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 1.5, fontWeight: 900, borderRadius: 1.5 }}
            onClick={onCreateFaq}
          >
            + 새 FAQ 작성
          </Button>
        </Box>
        <Divider />
        <List dense sx={{ overflow: "auto", flex: 1 }}>
          {!filtered ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>불러오는 중…</Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 2, color: "text.secondary" }}>문서가 없어요.</Box>
          ) : (
            filtered.map((f: any) => {
              const hasTrans = I18N_LANGS.some((lk) => (f.title_i18n?.[lk] || "").trim() || (f.body_i18n?.[lk] || "").trim());
              return (
                <Box key={f.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                  <ListItemButton
                    selected={f.id === activeId}
                    onClick={() => {
                      setActiveId(f.id);
                      setSearchParams({ faq: String(f.id) }, { replace: true });
                    }}
                    sx={{
                      py: 1.5,
                      "&.Mui-selected": { bgcolor: "rgba(37,99,235,0.08)" },
                      "&:hover": { bgcolor: "rgba(37,99,235,0.04)" }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {hasTrans && <Chip label="i18n" size="small" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 18, bgcolor: "rgba(34,197,94,0.15)", color: "#16A34A" }} />}
                          <Typography sx={{ color: "text.primary", fontWeight: 900, fontSize: "0.95rem", flex: 1 }} noWrap>
                            {f.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", mt: 0.25 }} noWrap>
                          {(f.is_hidden ? "숨김 · " : "") + (f.category?.name ?? "미지정")}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </Box>
              );
            })
          )}
        </List>
      </Box>

      {/* center: editor area */}
      <Box sx={{ bgcolor: "background.default", p: 3, overflow: "auto", display: "flex", justifyContent: "center", minHeight: 0 }}>
        <Box sx={{ width: "100%", maxWidth: 920 }}>
          {error ? (
            <Box sx={{ mb: 3, border: "1px solid", borderColor: "#FECACA", bgcolor: "#FEF2F2", p: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, color: "#DC2626" }}>오류 발생: {error}</Typography>
            </Box>
          ) : null}

          {!active ? (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center", opacity: 0.5 }}>
              <Typography sx={{ fontWeight: 900 }}>좌측에서 관리할 문서를 선택해 주세요.</Typography>
            </Box>
          ) : (
            <Box key={active.id} sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>FAQ 문서 편집</Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {i18nStatus.map((s) => (
                    <Chip
                      key={s.lang}
                      label={s.lang.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: "0.65rem", height: 20,
                        bgcolor: s.hasTitle && s.hasBody ? "rgba(34,197,94,0.15)" : s.hasTitle || s.hasBody ? "rgba(251,146,60,0.15)" : "rgba(15,23,42,0.06)",
                        color: s.hasTitle && s.hasBody ? "#16A34A" : s.hasTitle || s.hasBody ? "#F97316" : "text.disabled",
                      }}
                    />
                  ))}
                  <Button variant="outlined" color="error" size="small" disabled={busy} onClick={onDeleteActiveFaq} sx={{ fontWeight: 900, ml: 1 }}>
                    삭제
                  </Button>
                </Box>
              </Box>

              {/* 제목 섹션 */}
              <TextField
                label="제목 (KO)"
                fullWidth
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                InputProps={{ sx: { fontWeight: 900, fontSize: "1.1rem" } }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, flex: 1 }}>
                  {I18N_LANGS.map((lk) => (
                    <TextField
                      key={lk}
                      size="small"
                      label={`제목 (${lk.toUpperCase()})`}
                      placeholder={draftTitle}
                      value={draftTitleI18n[lk] || ""}
                      onChange={(e) => setDraftTitleI18n((prev) => ({ ...prev, [lk]: e.target.value }))}
                      InputProps={{ sx: { fontSize: "0.85rem" } }}
                      InputLabelProps={{ sx: { fontSize: "0.8rem" } }}
                    />
                  ))}
                </Box>
                <TranslateButton
                  label="FAQ 제목"
                  items={[{ key: "title", text: draftTitle }]}
                  onComplete={(results) => {
                    const t = results.title;
                    if (t) setDraftTitleI18n((prev) => ({ ...prev, ...t }));
                  }}
                />
              </Box>

              {/* 카테고리 + 옵션 */}
              <TextField
                select
                fullWidth
                label="카테고리"
                value={draftCategoryId}
                onChange={(e) => {
                  const v = e.target.value === "" ? "" : Number(e.target.value);
                  setDraftCategoryId(v as any);
                }}
              >
                {mainCats.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControlLabel
                  control={<Checkbox checked={Boolean(draftPopular)} onChange={(e) => setDraftPopular(e.target.checked)} />}
                  label={<Typography sx={{ fontWeight: 900 }}>인기 문서</Typography>}
                />
                <FormControlLabel
                  control={<Checkbox checked={Boolean(draftHidden)} onChange={(e) => setDraftHidden(e.target.checked)} />}
                  label={<Typography sx={{ fontWeight: 900 }}>숨김 처리</Typography>}
                />
              </Box>

              {/* 본문 섹션 - 언어별 탭 */}
              <Box sx={{ display: "grid", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>본문</Typography>
                    <ToggleButtonGroup
                      value={bodyLangTab}
                      exclusive
                      onChange={(_, v) => { if (v !== null) { setBodyLangTab(v); setViewMode("html"); } }}
                      size="small"
                      sx={{ "& .MuiToggleButton-root": { fontWeight: 700, fontSize: "0.75rem", py: 0.25, px: 1.5 } }}
                    >
                      <ToggleButton value="ko">KO</ToggleButton>
                      <ToggleButton value="en">EN</ToggleButton>
                      <ToggleButton value="ja">JA</ToggleButton>
                      <ToggleButton value="zh-TW">ZH-TW</ToggleButton>
                    </ToggleButtonGroup>
                    <TranslateButton
                      label="FAQ 본문"
                      items={[
                        { key: "title", text: draftTitle },
                        { key: "body", text: draftBody, is_html: true },
                      ]}
                      onComplete={(results) => {
                        if (results.title) setDraftTitleI18n((prev) => ({ ...prev, ...results.title }));
                        if (results.body) setDraftBodyI18n((prev) => ({ ...prev, ...results.body }));
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      size="small"
                      variant={viewMode === "html" ? "contained" : "outlined"}
                      onClick={() => setViewMode("html")}
                      sx={{ fontWeight: 900, minWidth: 60, fontSize: "0.75rem" }}
                    >
                      HTML
                    </Button>
                    <Button
                      size="small"
                      variant={viewMode === "preview" ? "contained" : "outlined"}
                      onClick={() => setViewMode("preview")}
                      sx={{ fontWeight: 900, minWidth: 70, fontSize: "0.75rem" }}
                    >
                      미리보기
                    </Button>
                  </Box>
                </Box>

                {bodyLangTab !== "ko" && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {LANG_LABELS[bodyLangTab]} 본문을 작성하세요. 비워두면 KO 본문이 표시됩니다.
                  </Typography>
                )}

                {viewMode === "html" ? (
                  <TextField
                    label={`HTML (${bodyLangTab.toUpperCase()})`}
                    multiline
                    fullWidth
                    rows={bodyLangTab === "ko" ? 20 : 16}
                    value={currentBodyValue}
                    onChange={(e) => setCurrentBodyValue(e.target.value)}
                    InputProps={{
                      sx: { fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.6 },
                    }}
                    helperText={bodyLangTab === "ko" ? "HTML 코드를 직접 작성하세요." : `KO 본문을 참고하여 ${LANG_LABELS[bodyLangTab]} 번역을 작성하세요.`}
                  />
                ) : null}

                {viewMode === "preview" ? (
                  <Box
                    sx={{
                      border: "1px solid", borderColor: "divider", borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.03)", p: 3, minHeight: 400, overflow: "auto",
                      "& img": { maxWidth: "100%", height: "auto", borderRadius: 1, cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: "0 0 0 2px #2563eb" } },
                      "& video": { maxWidth: "100%", height: "auto", borderRadius: 1 },
                      "& p": { margin: "0.75em 0" },
                      "& h1, & h2, & h3": { marginTop: "1em", marginBottom: "0.5em", fontWeight: 900 },
                      "& ul, & ol": { paddingLeft: "1.5em", margin: "0.75em 0" },
                      "& hr": { margin: "1.5em 0", border: "none", borderTop: "1px solid #e5e7eb" },
                      "& a": { color: "#2563eb", textDecoration: "underline" },
                      "& blockquote": { borderLeft: "4px solid #e5e7eb", paddingLeft: "1em", margin: "1em 0", color: "#64748b" },
                      "& table": { borderCollapse: "collapse", width: "100%", margin: "1em 0", border: "1px solid rgba(255,255,255,0.1)", "& td, & th": { border: "1px solid rgba(255,255,255,0.1)", padding: "10px 12px", verticalAlign: "top" }, "& th": { bgcolor: "rgba(255,255,255,0.05)", fontWeight: 700 } },
                    }}
                    dangerouslySetInnerHTML={{ __html: currentBodyValue || "<p style='color: #94a3b8;'>본문 내용이 없습니다.</p>" }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === "IMG") {
                        const imgSrc = (target as HTMLImageElement).src;
                        const action = window.confirm("이미지 작업을 선택하세요:\n\n확인 = 삭제\n취소 = 크기 변경");
                        if (action) {
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(currentBodyValue, "text/html");
                          doc.querySelectorAll("img").forEach((img) => { if (img.src === imgSrc) img.remove(); });
                          setCurrentBodyValue(doc.body.innerHTML);
                          setToast({ open: true, severity: "success", message: "이미지를 삭제했어요." });
                        } else {
                          const newWidth = window.prompt("이미지 너비를 입력하세요 (예: 300px, 50%, 100%):", "100%");
                          if (newWidth) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(currentBodyValue, "text/html");
                            doc.querySelectorAll("img").forEach((img) => { if (img.src === imgSrc) { img.style.width = newWidth; img.style.maxWidth = "100%"; img.style.height = "auto"; } });
                            setCurrentBodyValue(doc.body.innerHTML);
                            setToast({ open: true, severity: "success", message: "이미지 크기를 변경했어요." });
                          }
                        }
                      }
                    }}
                  />
                ) : null}

                {/* 도구 버튼 */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button variant="outlined" size="small" startIcon={<TableChartIcon />} sx={{ fontWeight: 900 }} onClick={insertTable}>표</Button>
                  <Button variant="outlined" size="small" startIcon={<ImageIcon />} sx={{ fontWeight: 900 }} disabled={busy} onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = true; i.onchange = () => { const f = Array.from(i.files || []); if (f.length) onUploadMedia(f); }; i.click(); }}>이미지</Button>
                  <Button variant="outlined" size="small" startIcon={<VideoLibraryIcon />} sx={{ fontWeight: 900 }} disabled={busy} onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "video/*"; i.onchange = () => { const f = Array.from(i.files || []); if (f.length) onUploadMedia(f); }; i.click(); }}>영상</Button>
                  <Button variant="outlined" size="small" startIcon={<HorizontalRuleIcon />} sx={{ fontWeight: 900 }} onClick={insertDivider}>구분선</Button>
                  <Button variant="outlined" size="small" startIcon={<ExpandMoreIcon />} sx={{ fontWeight: 900 }} onClick={insertToggle}>토글</Button>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                sx={{ fontWeight: 900, py: 1.5, borderRadius: 2 }}
                disabled={busy}
                onClick={onSaveFaq}
              >
                {busy ? "저장 중..." : "FAQ 저장하기"}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* right: categories and links */}
      <Box sx={{ bgcolor: "background.paper", borderLeft: "1px solid", borderColor: "divider", overflow: "auto", p: 2, minHeight: 0 }}>
        <Box sx={{ display: "grid", gap: 3 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, mb: 1.5 }}>주디 가이드 링크 (선택)</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {guideCats.map((c: any) => (
                  <Box key={c.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "rgba(15,23,42,0.02)" }}>
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <TextField label="가이드 이름" size="small" fullWidth value={c.name} onChange={(e) => updateCategory(c.id, { name: e.target.value })} />
                      <TextField label="순서(order)" size="small" type="number" fullWidth value={Number(c.order ?? 0)} onChange={(e) => updateCategory(c.id, { order: Number(e.target.value || 0) })} />
                      <TextField label="연결 URL" size="small" fullWidth value={c.guide_url ?? ""} onChange={(e) => updateCategory(c.id, { guide_url: e.target.value, is_guide_link: true })} />
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Button variant="contained" size="small" sx={{ fontWeight: 900, flex: 1 }} disabled={busy} onClick={() => onSaveCategory(c)}>저장</Button>
                        <Button variant="outlined" color="error" size="small" sx={{ fontWeight: 900 }} disabled={busy} onClick={() => onDeleteCategory(c)}>삭제</Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              {guideCats.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  사용하지 않으셔도 괜찮아요.
                </Typography>
              ) : null}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography sx={{ fontWeight: 900, mb: 1.5 }}>FAQ 대분류 카테고리</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {mainCats.map((c: any) => (
                <Box key={c.id} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, display: "grid", gap: 0.75 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 96px 40px 40px", gap: 1, alignItems: "center" }}>
                    <TextField size="small" fullWidth label="이름 (KO)" value={c.name} onChange={(e) => updateCategory(c.id, { name: e.target.value })} />
                    <TextField size="small" type="number" value={Number(c.order ?? 0)} onChange={(e) => updateCategory(c.id, { order: Number(e.target.value || 0) })} />
                    <Button variant="text" size="small" disabled={busy} onClick={() => onSaveCategory(c)} title="저장" sx={{ minWidth: 0, p: 0.75 }}>
                      <SaveOutlinedIcon fontSize="small" />
                    </Button>
                    <Button variant="text" size="small" disabled={busy} onClick={() => onDeleteCategory(c)} title="삭제" sx={{ minWidth: 0, p: 0.75, color: "#DC2626" }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.5, flex: 1 }}>
                      {I18N_LANGS.map((lk) => (
                        <TextField
                          key={lk}
                          size="small"
                          label={lk.toUpperCase()}
                          placeholder={c.name}
                          value={(c.name_i18n || {})[lk] || ""}
                          onChange={(e) => updateCategory(c.id, { name_i18n: { ...(c.name_i18n || {}), [lk]: e.target.value } })}
                          InputProps={{ sx: { fontSize: "0.8rem" } }}
                          InputLabelProps={{ sx: { fontSize: "0.75rem" } }}
                        />
                      ))}
                    </Box>
                    <TranslateButton
                      label={c.name}
                      items={[{ key: "name", text: c.name }]}
                      onComplete={(results) => {
                        if (results.name) updateCategory(c.id, { name_i18n: { ...(c.name_i18n || {}), ...results.name } });
                      }}
                    />
                  </Box>
                </Box>
              ))}

              <Box sx={{ p: 1.5, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 900, mb: 1, fontSize: "0.85rem" }}>새 카테고리 추가</Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="이름" value={newCatIsGuide ? "" : newCatName} onChange={(e) => { setNewCatIsGuide(false); setNewCatName(e.target.value); }} />
                  <TextField size="small" type="number" placeholder="order" value={newCatIsGuide ? 0 : Number(newCatOrder ?? 0)} onChange={(e) => { setNewCatIsGuide(false); setNewCatOrder(Number(e.target.value || 0)); }} />
                  <Button variant="contained" size="small" sx={{ fontWeight: 900 }} disabled={busy} onClick={onCreateCategory}>추가</Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
    <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
      <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} variant="filled" sx={{ fontWeight: 900 }}>
        {toast.message}
      </Alert>
    </Snackbar>
    </>
  );
}
