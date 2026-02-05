import { Avatar, Box, Button, Card, CardContent, CircularProgress, Divider, FormControlLabel, Switch, TextField, Typography } from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { useEffect, useMemo, useRef, useState } from "react";

import { adminMe, adminUpdateMe, adminUploadMeAvatar } from "../../../api/support";
// AdminIconRail removed from individual page, now in AdminLayout

export function AdminProfilePage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<{ display_name: string; status_message: string; job_title: string; avatar_url: string }>({
    display_name: "",
    status_message: "",
    job_title: "",
    avatar_url: "",
  });

  // Notification sound setting
  const [notificationSound, setNotificationSound] = useState(() => {
    const stored = localStorage.getItem("admin_notification_sound");
    return stored !== "false";
  });

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError(null);
    adminMe()
      .then((u) => {
        if (cancelled) return;
        setMe(u as any);
        setDraft({
          display_name: String((u as any)?.profile?.display_name ?? ""),
          status_message: String((u as any)?.profile?.status_message ?? ""),
          job_title: String((u as any)?.profile?.job_title ?? ""),
          avatar_url: String((u as any)?.profile?.avatar_url ?? ""),
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSave = useMemo(() => !busy && Boolean(draft.display_name.trim() || draft.status_message.trim() || draft.job_title.trim() || draft.avatar_url.trim()), [busy, draft]);

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await adminUpdateMe({
        profile: {
          display_name: draft.display_name,
          status_message: draft.status_message,
          job_title: draft.job_title,
          avatar_url: draft.avatar_url,
        },
      });
      setMe(res as any);
      setDraft({
        display_name: String((res as any)?.profile?.display_name ?? ""),
        status_message: String((res as any)?.profile?.status_message ?? ""),
        job_title: String((res as any)?.profile?.job_title ?? ""),
        avatar_url: String((res as any)?.profile?.avatar_url ?? ""),
      });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const res = await adminUploadMeAvatar(file);
      setMe(res as any);
      setDraft((prev) => ({ ...prev, avatar_url: String((res as any)?.profile?.avatar_url ?? prev.avatar_url) }));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  function onToggleNotificationSound(enabled: boolean) {
    setNotificationSound(enabled);
    localStorage.setItem("admin_notification_sound", enabled ? "true" : "false");
  }

  return (
    <Box sx={{ height: "100%", display: "grid", gridTemplateColumns: "1fr", bgcolor: "background.default", overflow: "hidden" }}>
      <Box sx={{ p: 3, minWidth: 0, overflow: "auto" }}>
        <Box sx={{ maxWidth: 640, mx: "auto" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>계정 설정</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            프로필 정보와 알림 설정을 관리합니다.
          </Typography>

          {error ? (
            <Typography sx={{ color: "error.main", fontWeight: 600, mb: 2, fontSize: 14 }}>오류: {error}</Typography>
          ) : null}

          {/* Profile Card */}
          <Card sx={{ bgcolor: "background.paper", mb: 3, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>프로필</Typography>

              {!me && busy ? (
                <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <>
                  {/* Avatar Section */}
                  <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", mb: 3 }}>
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={draft.avatar_url || undefined}
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: "#3B82F6",
                          fontWeight: 700,
                          fontSize: 28,
                          border: "2px solid",
                          borderColor: "divider",
                        }}
                      >
                        {(draft.display_name || me?.email || "A").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={busy}
                        sx={{
                          position: "absolute",
                          right: -8,
                          bottom: -4,
                          borderRadius: "50%",
                          minWidth: 32,
                          width: 32,
                          height: 32,
                          p: 0,
                          bgcolor: "#3B82F6",
                          "&:hover": { bgcolor: "#2563EB" }
                        }}
                        onClick={() => fileRef.current?.click()}
                      >
                        <PhotoCameraOutlinedIcon sx={{ fontSize: 16 }} />
                      </Button>
                      <input
                        ref={fileRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.currentTarget.value = "";
                          if (f) onPickFile(f);
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, display: "grid", gap: 2 }}>
                      <TextField
                        label="표시 이름"
                        value={draft.display_name}
                        onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                        disabled={busy}
                        fullWidth
                        size="small"
                        placeholder="고객에게 표시되는 이름"
                      />
                      <TextField
                        label="직책"
                        value={draft.job_title}
                        onChange={(e) => setDraft({ ...draft, job_title: e.target.value })}
                        disabled={busy}
                        fullWidth
                        size="small"
                        placeholder="예: 고객지원팀 매니저"
                      />
                    </Box>
                  </Box>

                  <TextField
                    label="상태 메시지"
                    value={draft.status_message}
                    onChange={(e) => setDraft({ ...draft, status_message: e.target.value })}
                    disabled={busy}
                    fullWidth
                    size="small"
                    placeholder="현재 상태나 메모"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="아바타 URL (선택)"
                    value={draft.avatar_url}
                    onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })}
                    disabled={busy}
                    fullWidth
                    size="small"
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveOutlinedIcon />}
                      sx={{
                        fontWeight: 600,
                        minWidth: 120,
                        bgcolor: "#3B82F6",
                        "&:hover": { bgcolor: "#2563EB" },
                        textTransform: "none"
                      }}
                      disabled={!canSave}
                      onClick={onSave}
                    >
                      저장
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings Card */}
          <Card sx={{ bgcolor: "background.paper", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <NotificationsActiveOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 600, color: "text.primary" }}>알림 설정</Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, color: "text.primary", fontSize: 14 }}>
                    새 문의 알림음
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
                    고객이 새 문의를 보내면 알림음이 재생됩니다.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSound}
                      onChange={(e) => onToggleNotificationSound(e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Account Info */}
          {me && (
            <Card sx={{ bgcolor: "background.paper", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>계정 정보</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>이메일</Typography>
                    <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>{me.email}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>역할</Typography>
                    <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                      {me.is_superuser ? "최고 관리자" : me.is_staff ? "상담사" : "일반"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}

