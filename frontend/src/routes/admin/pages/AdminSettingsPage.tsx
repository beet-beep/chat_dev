import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/client";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import LanguageIcon from "@mui/icons-material/Language";
import PersonIcon from "@mui/icons-material/Person";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";

type Setting = {
  key: string;
  value: string;
  description: string;
};

type AdminProfile = {
  email: string;
  display_name: string;
  phone_number: string;
  language: string;
  mfa_enabled: boolean;
  marketing_sms: boolean;
  marketing_push: boolean;
  marketing_email: boolean;
  night_push_mute: boolean;
  multi_channel: boolean;
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"account" | "policy">("account");
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Account settings state
  const [profile, setProfile] = useState<AdminProfile>({
    email: "",
    display_name: "",
    phone_number: "",
    language: "ko",
    mfa_enabled: false,
    marketing_sms: false,
    marketing_push: false,
    marketing_email: false,
    night_push_mute: false,
    multi_channel: false,
  });

  const [editingEmail, setEditingEmail] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");

  useEffect(() => {
    refresh();
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const me = await apiFetch<any>("/admin/me/", {}, "admin_token");
      setProfile({
        email: me?.email || "",
        display_name: me?.profile?.display_name || me?.first_name || "",
        phone_number: me?.profile?.phone_number || "",
        language: "ko",
        mfa_enabled: false,
        marketing_sms: false,
        marketing_push: false,
        marketing_email: false,
        night_push_mute: false,
        multi_channel: false,
      });
      setDraftEmail(me?.email || "");
      setDraftName(me?.profile?.display_name || me?.first_name || "");
      setDraftPhone(me?.profile?.phone_number || "");
    } catch (e) {
      console.error(e);
    }
  }

  async function refresh() {
    try {
      const data = await apiFetch<Setting[]>("/admin/settings/", {}, "admin_token");
      setSettings(data || []);
    } catch (e) {
      console.error(e);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSave(key: string, value: string) {
    setBusy(true);
    try {
      await apiFetch(
        `/admin/settings/${key}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        },
        "admin_token"
      );
      setToast("저장되었습니다");
      await refresh();
    } catch (e: any) {
      setToast("저장 실패: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileField(field: string, value: string) {
    setBusy(true);
    try {
      await apiFetch(
        "/admin/me/",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: { [field]: value } }),
        },
        "admin_token"
      );
      setToast("저장되었습니다");
      await loadProfile();
    } catch (e: any) {
      setToast("저장 실패: " + (e?.message || e));
    } finally {
      setBusy(false);
      setEditingEmail(false);
      setEditingName(false);
      setEditingPhone(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const policySettings = settings.filter((s) => s.key.startsWith("policy_"));

  // Settings Row Component
  function SettingsRow({
    label,
    children,
    icon,
    noDivider,
  }: {
    label: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    noDivider?: boolean;
  }) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2.5,
            px: 3,
            gap: 3,
            minHeight: 72,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180 }}>
            {icon && (
              <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
            )}
            <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "text.primary" }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, justifyContent: "flex-start" }}>
            {children}
          </Box>
        </Box>
        {!noDivider && <Divider />}
      </>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            계정 설정
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            계정 정보 및 알림 설정을 관리합니다
          </Typography>
        </Box>
      </Box>

      {/* Tab Switcher */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <Button
          variant={activeTab === "account" ? "contained" : "outlined"}
          onClick={() => setActiveTab("account")}
          startIcon={<AccountCircleIcon />}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          계정 관리
        </Button>
        <Button
          variant={activeTab === "policy" ? "contained" : "outlined"}
          onClick={() => setActiveTab("policy")}
          startIcon={<LinkIcon />}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          정책 링크
        </Button>
      </Box>

      {activeTab === "account" ? (
        <Box sx={{ display: "grid", gap: 3 }}>
          {/* 로그인 계정 */}
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" />
                로그인 계정
              </Typography>
            </Box>
            <Divider />
            <SettingsRow label="로그인 계정" icon={<EmailIcon fontSize="small" />}>
              {editingEmail ? (
                <>
                  <TextField
                    size="small"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    placeholder="이메일을 입력해 주세요."
                    sx={{ minWidth: 280 }}
                    disabled={busy}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={busy}
                    onClick={() => saveProfileField("email", draftEmail)}
                    sx={{ fontWeight: 700 }}
                  >
                    인증 후 저장
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEditingEmail(false);
                      setDraftEmail(profile.email);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Typography sx={{ color: "text.secondary" }}>{profile.email || "미설정"}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setEditingEmail(true)}
                    sx={{ fontWeight: 700 }}
                  >
                    변경
                  </Button>
                </>
              )}
            </SettingsRow>

            <SettingsRow label="언어" icon={<LanguageIcon fontSize="small" />}>
              <Select
                size="small"
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="ko">한국어</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
              </Select>
            </SettingsRow>

            <SettingsRow label="비밀번호" icon={<VpnKeyIcon fontSize="small" />}>
              <Button variant="outlined" size="small" sx={{ fontWeight: 700 }}>
                비밀번호 변경
              </Button>
            </SettingsRow>

            <SettingsRow label="이름" icon={<PersonIcon fontSize="small" />}>
              {editingName ? (
                <>
                  <TextField
                    size="small"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="이름을 입력해 주세요"
                    sx={{ minWidth: 200 }}
                    disabled={busy}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={busy}
                    onClick={() => saveProfileField("display_name", draftName)}
                    sx={{ fontWeight: 700 }}
                  >
                    저장
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEditingName(false);
                      setDraftName(profile.display_name);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Typography sx={{ color: "text.secondary" }}>{profile.display_name || "미설정"}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setEditingName(true)}
                    sx={{ fontWeight: 700 }}
                  >
                    변경
                  </Button>
                </>
              )}
            </SettingsRow>

            <SettingsRow label="휴대폰 번호" icon={<PhoneIcon fontSize="small" />} noDivider>
              {editingPhone ? (
                <>
                  <Select size="small" value="+82" sx={{ minWidth: 90 }}>
                    <MenuItem value="+82">🇰🇷 +82</MenuItem>
                    <MenuItem value="+1">🇺🇸 +1</MenuItem>
                    <MenuItem value="+81">🇯🇵 +81</MenuItem>
                    <MenuItem value="+86">🇨🇳 +86</MenuItem>
                  </Select>
                  <TextField
                    size="small"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    placeholder="휴대폰 번호를 입력해 주세요"
                    sx={{ minWidth: 180 }}
                    disabled={busy}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={busy}
                    onClick={() => saveProfileField("phone_number", draftPhone)}
                    sx={{ fontWeight: 700 }}
                  >
                    저장
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEditingPhone(false);
                      setDraftPhone(profile.phone_number);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Typography sx={{ color: "text.secondary" }}>{profile.phone_number || "미설정"}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setEditingPhone(true)}
                    sx={{ fontWeight: 700 }}
                  >
                    변경
                  </Button>
                </>
              )}
            </SettingsRow>
          </Card>

          {/* 보안 설정 */}
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <SecurityIcon fontSize="small" />
                보안 설정
              </Typography>
            </Box>
            <Divider />
            <SettingsRow label="다중 인증" icon={<SecurityIcon fontSize="small" />} noDivider>
              <Button variant="outlined" size="small" sx={{ fontWeight: 700 }}>
                다중 인증 설정
              </Button>
              <Chip
                icon={<WarningAmberIcon />}
                label="인증 필요"
                size="small"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15),
                  color: "warning.dark",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "warning.main" },
                }}
              />
            </SettingsRow>
          </Card>

          {/* 알림 설정 */}
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.info.main, 0.06) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <NotificationsActiveIcon fontSize="small" />
                알림 설정
              </Typography>
            </Box>
            <Divider />
            <SettingsRow label="마케팅 정보 알림 설정" icon={<NotificationsActiveIcon fontSize="small" />}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.marketing_sms}
                    onChange={(e) => setProfile({ ...profile, marketing_sms: e.target.checked })}
                  />
                }
                label="문자(SMS)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.marketing_push}
                    onChange={(e) => setProfile({ ...profile, marketing_push: e.target.checked })}
                  />
                }
                label="앱 푸시 알림"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.marketing_email}
                    onChange={(e) => setProfile({ ...profile, marketing_email: e.target.checked })}
                  />
                }
                label="이메일"
              />
            </SettingsRow>

            <SettingsRow label="야간 푸시 소리 끔" noDivider>
              <Switch
                checked={profile.night_push_mute}
                onChange={(e) => setProfile({ ...profile, night_push_mute: e.target.checked })}
              />
              <Tooltip title="21:00 ~ 08:00 사이에는 푸시 알림 소리가 울리지 않습니다.">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </SettingsRow>
          </Card>

          {/* 멀티 채널 */}
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.success.main, 0.06) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <HeadsetMicIcon fontSize="small" />
                상담 설정
              </Typography>
            </Box>
            <Divider />
            <SettingsRow label="멀티 채널 응대" icon={<HeadsetMicIcon fontSize="small" />} noDivider>
              <Button variant="outlined" size="small" sx={{ fontWeight: 700 }}>
                설정
              </Button>
            </SettingsRow>
          </Card>

          {/* 계정 관리 */}
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.error.main, 0.06) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
                <AccountCircleIcon fontSize="small" />
                계정 관리
              </Typography>
            </Box>
            <Divider />
            <SettingsRow label="계정 관리" noDivider>
              <Button
                variant="contained"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ fontWeight: 700 }}
              >
                로그아웃
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={() => setDeleteDialog(true)}
                sx={{ fontWeight: 700 }}
              >
                계정 삭제
              </Button>
            </SettingsRow>
          </Card>
        </Box>
      ) : (
        /* 정책 링크 탭 */
        <Box sx={{ display: "grid", gap: 3 }}>
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
              <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <LinkIcon fontSize="small" />
                정책 링크 관리
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                각 정책별 링크(URL)를 등록하세요. 유저 화면에서 그대로 열립니다.
              </Typography>
            </Box>
            <Divider />
            {policySettings.map((setting, idx) => (
              <Box key={setting.key}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.25 }}>
                        {setting.description}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        키: {setting.key}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                        disabled={!setting.value || busy}
                        onClick={() => window.open(setting.value, "_blank", "noreferrer")}
                      >
                        열기
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ fontWeight: 700 }}
                        disabled={busy}
                        onClick={() => onSave(setting.key, setting.value)}
                      >
                        저장
                      </Button>
                    </Box>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    type="url"
                    value={setting.value}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev.map((s) => (s.key === setting.key ? { ...s, value: e.target.value } : s))
                      )
                    }
                    placeholder="https://example.com/policy"
                    disabled={busy}
                    helperText="유저 화면에서 링크로 열립니다."
                  />
                </Box>
                {idx < policySettings.length - 1 && <Divider />}
              </Box>
            ))}
          </Card>
        </Box>
      )}

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>계정 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => {
              setToast("계정 삭제 기능은 관리자에게 문의하세요.");
              setDeleteDialog(false);
            }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
