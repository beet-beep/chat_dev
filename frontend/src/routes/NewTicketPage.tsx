import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import { addTicketReply, createTicketWithFiles, getMe, listTicketCategories, listTickets } from "../api/support";
import type { Ticket, TicketCategory } from "../api/types";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { GradientHeader } from "../ui/GradientHeader";
import { AttachmentPreview } from "../ui/chat/AttachmentPreview";
import { apiFetch } from "../api/client";
import { useT, useLanguage } from "../i18n";
import { LanguageSelector } from "../i18n/LanguageSelector";

export function NewTicketPage() {
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const nav = useNavigate();
  const t = useT();
  const { lang } = useLanguage();

  const draftKey = "joody_newticket_draft_v2";
  const draftSavedAt = useRef<number>(0);

  const [categories, setCategories] = useState<TicketCategory[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [catId, setCatId] = useState<number | "">("");
  const [mode, setMode] = useState<"new" | "reply">(
    qs.get("mode") === "reply" ? "reply" : "new"
  );
  const [targetTicketId, setTargetTicketId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<number | null>(null);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [settings, setSettings] = useState<any[]>([]);
  const activeCategory = useMemo(() => {
    if (!categories) return null;
    const id = catId === "" ? null : Number(catId);
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  }, [categories, catId]);

  const checklistItems = useMemo(() => {
    // Use localized checklist if available
    if (lang !== "ko" && activeCategory?.form_checklist_i18n) {
      const i18nList = (activeCategory.form_checklist_i18n as any)?.[lang];
      if (Array.isArray(i18nList) && i18nList.length > 0) {
        return i18nList.map((x: any) => String(x)).filter((x: string) => x.trim().length > 0).slice(0, 12);
      }
    }
    const list = Array.isArray(activeCategory?.form_checklist) ? (activeCategory!.form_checklist as any[]) : [];
    return list.map((x) => String(x)).filter((x) => x.trim().length > 0).slice(0, 12);
  }, [activeCategory?.id, lang]);
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const it of checklistItems) next[it] = false;
    setCheckState(next);
  }, [activeCategory?.id, checklistItems.length]);
  const checklistRequired = Boolean(activeCategory?.form_checklist_required);
  const checklistOk = !checklistItems.length || !checklistRequired || checklistItems.every((it) => Boolean(checkState[it]));

  const canSubmit = useMemo(() => {
    if (mode === "reply") return targetTicketId !== "" && body.trim().length > 0;
    const basicValid = title.trim().length > 0 && body.trim().length > 0 && checklistOk;
    return basicValid && privacyAgreed;
  }, [mode, targetTicketId, title, body, checklistOk, privacyAgreed]);

  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  function applyTemplate(raw: string) {
    const tpl = String(raw || "");
    const email = String(me?.email || "");
    const uuid = String(me?.profile?.game_uuid || me?.profile?.uuid || "");
    const member = String(me?.profile?.member_code || "");
    return tpl
      .split("{{email}}").join(email)
      .split("{{uuid}}").join(uuid)
      .split("{{member_code}}").join(member);
  }

  function onInsertCategoryTemplate() {
    if (!activeCategory?.form_enabled) return;
    // Use localized templates if available
    const rawTitleTpl = (lang !== "ko" && (activeCategory.form_title_template_i18n as any)?.[lang]) || activeCategory.form_title_template || "";
    const rawBodyTpl = (lang !== "ko" && (activeCategory.form_template_i18n as any)?.[lang]) || activeCategory.form_template || "";
    const titleTpl = applyTemplate(String(rawTitleTpl)).trim();
    if (!title.trim() && titleTpl) setTitle(titleTpl);
    const template = applyTemplate(String(rawBodyTpl));
    if (!template.trim()) return;
    setBody((prev) => {
      const p = String(prev || "");
      if (!p.trim()) return template;
      if (p.includes(template.trim())) return p;
      return `${p.trimEnd()}\n\n${template}`;
    });
  }

  const entrySource = useMemo(() => (qs.get("entry") || "").trim(), [search]);
  const fromGame = useMemo(() => {
    const f = (qs.get("from") || "").trim().toLowerCase();
    return f === "game" || entrySource === "game";
  }, [search, entrySource]);
  const [gameMeta, setGameMeta] = useState<any | null>(null);
  const hasToken = Boolean(localStorage.getItem("auth_token"));
  const [me, setMe] = useState<any | null>(null);
  const rCard = 2;
  const rInput = 1.5;
  const rBtn = 1.5;

  // Draft restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d !== "object") return;
      if ((title || body) && mode === "new") return;
      if ((body || targetTicketId !== "") && mode === "reply") return;
      if (d.mode === "new") {
        setMode("new");
        if (typeof d.catId === "number") setCatId(d.catId);
        if (typeof d.title === "string") setTitle(d.title);
        if (typeof d.body === "string") setBody(d.body);
        setDraftNotice(t("newTicket.draft.restored.new"));
      } else if (d.mode === "reply") {
        setMode("reply");
        if (typeof d.targetTicketId === "number") setTargetTicketId(d.targetTicketId);
        if (typeof d.body === "string") setBody(d.body);
        setDraftNotice(t("newTicket.draft.restored.reply"));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const qCat = qs.get("catId");
    if (!qCat) return;
    const n = Number(qCat);
    if (!Number.isFinite(n) || n <= 0) return;
    setCatId(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft autosave
  useEffect(() => {
    const now = Date.now();
    if (now - draftSavedAt.current < 500) return;
    const timer = window.setTimeout(() => {
      try {
        const payload =
          mode === "new"
            ? { mode, catId: catId === "" ? null : Number(catId), title, body, savedAt: Date.now() }
            : { mode, targetTicketId: targetTicketId === "" ? null : Number(targetTicketId), body, savedAt: Date.now() };
        const hasText = Boolean(String(payload.body || "").trim()) || (mode === "new" && Boolean(String(payload.title || "").trim()));
        if (!hasText) return;
        localStorage.setItem(draftKey, JSON.stringify(payload));
        draftSavedAt.current = Date.now();
      } catch {
        // ignore
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [mode, catId, targetTicketId, title, body]);

  useEffect(() => {
    let cancelled = false;
    setCategories(null);
    listTicketCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasToken) {
      setMe(null);
      return;
    }
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setMe(u as any);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });

    apiFetch<any[]>("/settings/")
      .then((data: any) => {
        if (!cancelled && Array.isArray(data)) {
          setSettings(data);
          const privacyItem = data.find((item: any) => item.key === "policy_privacy");
          if (privacyItem) {
            setPrivacyPolicyUrl(String(privacyItem.value || ""));
          }
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("joody_game_context_v1");
      if (!raw) {
        setGameMeta(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setGameMeta(parsed && typeof parsed === "object" ? parsed : null);
    } catch {
      setGameMeta(null);
    }
  }, [search]);

  useEffect(() => {
    if (mode !== "reply") return;
    if (!hasToken) {
      setTickets([]);
      return;
    }
    let cancelled = false;
    setTickets(null);
    listTickets({ page: 1, page_size: 200 })
      .then((res) => {
        if (!cancelled) setTickets(res.results);
      })
      .catch(() => {
        if (!cancelled) setTickets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const tid = qs.get("ticketId");
    if (tid && mode === "reply") {
      const n = Number(tid);
      if (Number.isFinite(n)) setTargetTicketId(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    if (mode === "new" && !confirmDialogOpen) {
      setConfirmDialogOpen(true);
      return;
    }
    setConfirmDialogOpen(false);
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      if (!hasToken) {
        setError(t("newTicket.error.loginRequired"));
        return;
      }

      if (mode === "reply") {
        const tid = Number(targetTicketId);
        let clientMeta: any | undefined = undefined;
        try {
          const raw = localStorage.getItem("joody_game_context_v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              clientMeta = parsed;
            }
          }
        } catch {
          // ignore
        }
        await addTicketReply(tid, { body: body.trim(), files, client_meta: clientMeta });
        setBody("");
        setTargetTicketId("");
        setFiles([]);
        setSuccess(t("newTicket.success.reply"));
        setSuccessTicketId(tid);
        setSuccessOpen(true);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        if (clientMeta) {
          try {
            localStorage.removeItem("joody_game_context_v1");
          } catch {}
        }
      } else {
        let clientMeta: any | undefined = undefined;
        try {
          const raw = localStorage.getItem("joody_game_context_v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              clientMeta = parsed;
            }
          }
        } catch {
          // ignore
        }
        const inferredFromGame = fromGame || Boolean(clientMeta);
        const created = await createTicketWithFiles({
          category_id: catId === "" ? null : catId,
          title: title.trim(),
          body: body.trim(),
          files,
          entry_source: entrySource || (inferredFromGame ? "game" : "direct_compose"),
          client_meta: clientMeta,
        });
        setTitle("");
        setBody("");
        setCatId("");
        setFiles([]);
        setSuccess(t("newTicket.success.new"));
        setSuccessTicketId((created as any)?.id ?? null);
        setSuccessOpen(true);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        if (clientMeta) {
          try {
            localStorage.removeItem("joody_game_context_v1");
          } catch {}
        }
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <GradientHeader
        title={t("newTicket.header.title")}
        subtitle={t("newTicket.header.subtitle")}
        gradient="linear-gradient(180deg, #F97316 0%, #FDBA74 58%, rgba(253,186,116,0.0) 100%)"
        right={<LanguageSelector />}
      />
      <Box sx={{ mt: -5.5, px: 2.5, pt: 1.25, pb: 2 }}>
        {!hasToken ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t("newTicket.loginRequired")} <br />
            <Button size="small" sx={{ fontWeight: 900, px: 0 }} onClick={() => nav("/me")}>
              {t("newTicket.loginLink")}
            </Button>
          </Alert>
        ) : null}

        {hasToken ? (
          <Card sx={{ mb: 2, borderRadius: 2.5, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start", p: 2.5 }}>
              <Avatar
                src={me?.profile?.avatar_url || undefined}
                sx={{ width: 56, height: 56, bgcolor: "primary.main", color: "white", fontWeight: 700, boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }}
              >
                {(me?.profile?.display_name || me?.email || "U").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem" }} noWrap>
                  {me?.profile?.display_name || me?.first_name || t("newTicket.user.default")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.8125rem" }} noWrap>
                  {me?.email || "-"}
                </Typography>
                <Box sx={{ mt: 1, display: "grid", gap: 0.75, bgcolor: "rgba(15,23,42,0.02)", borderRadius: 1.5, p: 1.5 }}>
                  {me?.profile?.phone_number && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>{t("newTicket.phone")}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                        {me?.profile?.phone_number}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>UUID</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                      {me?.profile?.game_uuid || "-"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>{t("newTicket.memberCode")}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {me?.profile?.member_code || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : null}

        {hasToken && (fromGame || Boolean(gameMeta)) ? (
          <Card sx={{ mb: 2, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "none" }}>
            <CardContent>
              <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{t("newTicket.gameInfo.title")}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: "0.85rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                {t("newTicket.gameInfo.desc")}
              </Typography>
              {gameMeta?.purchases?.recent?.length ? (
                <Typography sx={{ mt: 1.25, fontWeight: 900, fontSize: "0.9rem", color: "primary.main" }}>
                  {t("newTicket.gameInfo.purchases", { count: gameMeta.purchases.recent.length })}
                </Typography>
              ) : (
                <Typography sx={{ mt: 1.25, color: "text.secondary", fontSize: "0.85rem" }}>
                  {t("newTicket.gameInfo.noPurchases")}
                </Typography>
              )}
            </CardContent>
          </Card>
        ) : null}

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v)}
        fullWidth
        sx={{
          mb: 2,
          bgcolor: "#fff",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 1.5,
          "& .MuiToggleButton-root": {
            border: "none",
            py: 1,
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "text.secondary",
            "&.Mui-selected": {
              bgcolor: "rgba(15,23,42,0.05)",
              color: "text.primary",
              "&:hover": { bgcolor: "rgba(15,23,42,0.08)" }
            }
          }
        }}
      >
        <ToggleButton value="new">{t("newTicket.mode.new")}</ToggleButton>
        <ToggleButton value="reply">{t("newTicket.mode.reply")}</ToggleButton>
      </ToggleButtonGroup>

      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} PaperProps={{ sx: { borderRadius: rCard } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{t("newTicket.success.dialog.title")}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontWeight: 900 }}>{success || t("newTicket.success.dialog.ok")}</Typography>
          {successTicketId ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              #{successTicketId}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSuccessOpen(false);
              nav("/tickets");
            }}
            sx={{ fontWeight: 900 }}
          >
            {t("newTicket.success.dialog.viewTickets")}
          </Button>
          <Button variant="contained" onClick={() => setSuccessOpen(false)} sx={{ fontWeight: 900 }}>
            {t("newTicket.success.dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {draftNotice ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {draftNotice}
        </Alert>
      ) : null}

      {mode === "new" ? (
        <Card sx={{ mb: 1.5, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "none" }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.75, fontSize: "0.8rem", color: "text.secondary" }}>{t("newTicket.category.label")}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {(lang !== "ko" && activeCategory?.name_i18n?.[lang]) || (activeCategory?.name ?? t("newTicket.category.placeholder"))}
              </Typography>
              <Button
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", minWidth: "auto", px: 1 }}
                onClick={() => nav("/new")}
              >
                {t("newTicket.category.change")}
              </Button>
            </Box>
            {activeCategory ? (
              <Button
                variant="text"
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.75rem", p: 0, mt: 0.5, color: "primary.main" }}
                onClick={() => nav(`/new/category/${activeCategory.id}`)}
              >
                {t("newTicket.category.viewGuide")}
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: "0.75rem" }}>
                {t("newTicket.category.selectFirst")}
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 2, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "none" }}>
          <CardContent>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>{t("newTicket.existingTicket.title")}</Typography>
            {!tickets ? (
              <Box sx={{ py: 1, display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                <CircularProgress size={18} /> {t("newTicket.existingTicket.loading")}
              </Box>
            ) : (
              <TextField
                fullWidth
                select
                value={targetTicketId}
                onChange={(e) => setTargetTicketId(e.target.value === "" ? "" : Number(e.target.value))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: rInput } }}
              >
                <MenuItem value="">{t("newTicket.existingTicket.placeholder")}</MenuItem>
                {tickets.map((tk) => (
                  <MenuItem key={tk.id} value={tk.id}>
                    #{tk.id} · {tk.title}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </CardContent>
        </Card>
      )}

      {mode === "new" ? (
        <Card sx={{ mb: 1.5, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "none" }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: "0.8rem", color: "text.secondary" }}>
              {t("newTicket.title.label")} <span style={{ color: "#DC2626" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder={t("newTicket.title.placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: rInput } }}
              required
            />
          </CardContent>
        </Card>
      ) : null}

      <Card sx={{ mb: 1.5, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "none" }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: "0.8rem", color: "text.secondary" }}>
            {mode === "reply" ? t("newTicket.body.label.reply") : t("newTicket.body.label.new")} <span style={{ color: "#DC2626" }}>*</span>
          </Typography>
          {mode === "new" && activeCategory?.form_enabled ? (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={onInsertCategoryTemplate}
              sx={{
                mb: 1,
                fontWeight: 600,
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                fontSize: "0.8rem",
                boxShadow: "0 2px 6px rgba(249,115,22,0.2)",
              }}
            >
              {(lang !== "ko" && (activeCategory.form_button_label_i18n as any)?.[lang]) || activeCategory.form_button_label || t("newTicket.title.placeholder")}
            </Button>
          ) : null}
          {mode === "new" && checklistItems.length ? (
            <Box sx={{ mb: 1, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "rgba(15,23,42,0.02)", p: 1, borderRadius: rInput }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: "0.8rem" }}>
                {t("newTicket.checklist.title")}
                {checklistRequired ? (
                  <span style={{ marginLeft: 6, color: "#DC2626", fontWeight: 600, fontSize: "0.75rem" }}>{t("newTicket.checklist.required")}</span>
                ) : null}
              </Typography>
              <Box sx={{ display: "grid", gap: 0.25 }}>
                {checklistItems.map((it) => (
                  <Box key={it} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Checkbox
                      size="small"
                      checked={Boolean(checkState[it])}
                      onChange={(e) => setCheckState((prev) => ({ ...prev, [it]: e.target.checked }))}
                      sx={{ p: 0.25 }}
                    />
                    <Typography sx={{ fontWeight: 500, color: "text.primary", fontSize: "0.8rem" }}>{it}</Typography>
                  </Box>
                ))}
              </Box>
              {checklistRequired && !checklistOk ? (
                <Typography sx={{ mt: 0.5, color: "#DC2626", fontWeight: 600, fontSize: "0.75rem" }}>
                  {t("newTicket.checklist.error")}
                </Typography>
              ) : null}
            </Box>
          ) : null}
          <TextField
            fullWidth
            multiline
            minRows={20}
            placeholder={mode === "reply" ? t("newTicket.body.placeholder.reply") : t("newTicket.body.placeholder.new")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: rInput, fontSize: "0.9rem" } }}
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 1.5, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "none" }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Button
            component="label"
            fullWidth
            variant="outlined"
            sx={{ borderStyle: "dashed", py: 1.5, fontWeight: 600, borderRadius: rBtn, color: "text.secondary", borderColor: "rgba(15,23,42,0.12)", fontSize: "0.85rem" }}
          >
            {t("newTicket.attach", { count: files.length })}
            <input
              hidden
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...list]);
                e.currentTarget.value = "";
              }}
            />
          </Button>
          <Box sx={{ mt: 1 }}>
            <AttachmentPreview files={files} onRemove={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))} />
          </Box>
        </CardContent>
      </Card>

      {mode === "new" && (
        <Card sx={{ mb: 2, borderRadius: rCard, overflow: "hidden", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "none", bgcolor: "#fafafa" }}>
          <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 1.5, px: 2 }}>
            <Checkbox
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              size="small"
              sx={{ p: 0.25 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5, fontSize: "0.8rem" }}>
                <Button
                  variant="text"
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "inherit",
                    textDecoration: "underline",
                    "&:hover": {
                      textDecoration: "underline",
                      bgcolor: "transparent"
                    }
                  }}
                  onClick={() => {
                    if (privacyPolicyUrl) {
                      window.open(privacyPolicyUrl, "_blank", "noreferrer");
                      return;
                    }
                    setPrivacyDialogOpen(true);
                  }}
                >
                  {t("newTicket.privacy.link")}
                </Button>
                {t("newTicket.privacy.agree")}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={privacyDialogOpen}
        onClose={() => setPrivacyDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "80vh"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {t("newTicket.privacy.dialog.title")}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4, whiteSpace: "pre-line" }}>
            {t("newTicket.privacy.dialog.empty")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button
            onClick={() => setPrivacyDialogOpen(false)}
            variant="contained"
            size="large"
            sx={{ fontWeight: 700, px: 4 }}
          >
            {t("newTicket.privacy.dialog.close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 360,
            mx: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: "center", pt: 3, pb: 1 }}>
          {t("newTicket.confirm.title")}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography sx={{ color: "text.secondary", textAlign: "center", fontSize: "0.9rem", whiteSpace: "pre-line" }}>
            {t("newTicket.confirm.desc")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, justifyContent: "center" }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            size="large"
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            {t("newTicket.confirm.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            size="large"
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
            disabled={busy}
          >
            {busy ? t("newTicket.confirm.submitting") : t("newTicket.confirm.submit")}
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        fullWidth
        size="large"
        variant="contained"
        startIcon={<SendOutlinedIcon />}
        sx={{ py: 1.6, fontWeight: 900, borderRadius: rBtn }}
        disabled={!canSubmit || busy}
        onClick={onSubmit}
      >
        {busy ? t("newTicket.submit.busy") : mode === "reply" ? t("newTicket.submit.reply") : t("newTicket.submit.new")}
      </Button>
      </Box>
    </Box>
  );
}
