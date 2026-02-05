import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Link,
  TextField,
  Typography,
  alpha,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PrivacyTipOutlinedIcon from "@mui/icons-material/PrivacyTipOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { GradientHeader } from "../ui/GradientHeader";
import { useEffect, useState } from "react";
import { getMe, login } from "../api/support";
import type { Me } from "../api/types";
import { apiFetch } from "../api/client";
import { useT } from "../i18n";
import { LanguageSelector } from "../i18n/LanguageSelector";

type AppSettings = {
  policy_terms: string;
  policy_privacy: string;
  policy_marketing: string;
  policy_rules: string;
};

export function MePage() {
  const t = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    policy_terms: "",
    policy_privacy: "",
    policy_marketing: "",
    policy_rules: "",
  });

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setMe(null);

    const load = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const data = await getMe();
      if (!cancelled) {
        setMe(data);
      }
    };

    const loadSettings = async () => {
      try {
        const data = await apiFetch<any[]>("/settings/");
        if (!cancelled && Array.isArray(data)) {
          const settingsMap: any = {};
          data.forEach((item) => {
            settingsMap[item.key] = item.value || "";
          });
          setSettings(settingsMap);
        }
      } catch {
        // ignore
      }
    };

    load().catch((e) => {
      if (!cancelled) setError(String(e?.message ?? e));
    });
    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasToken = Boolean(localStorage.getItem("auth_token"));

  async function doLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await login({ email: authEmail.trim(), password: authPassword.trim() });
      localStorage.setItem("auth_token", res.token);
      const data = await getMe();
      setMe(data);
    } catch (e: any) {
      setError(t("me.login.error"));
    } finally {
      setBusy(false);
    }
  }

  function PolicyRow({
    icon,
    title,
    url,
  }: {
    icon: React.ReactNode;
    title: string;
    url: string;
  }) {
    if (!url) return null;

    return (
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          p: 2,
          borderRadius: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            transform: "translateX(4px)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>{title}</Typography>
          </Box>
          <ChevronRightIcon sx={{ color: "text.secondary", fontSize: 20, opacity: 0.5 }} />
        </Box>
      </Link>
    );
  }

  return (
    <Box>
      <GradientHeader
        title={t("me.header.title")}
        subtitle={t("me.header.subtitle")}
        icon={<PersonOutlineIcon />}
        right={<LanguageSelector />}
      />
      <Box sx={{ px: 2.5, pt: 2, pb: 4, bgcolor: "#fff" }}>
        {!me && !error && hasToken ? (
          <Card sx={{ py: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary" sx={{ mt: 2, fontSize: "0.875rem" }}>
              {t("me.loading")}
            </Typography>
          </Card>
        ) : null}

        {error ? (
          <Card
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
              border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
            }}
          >
            <Typography color="error" sx={{ fontWeight: 500 }}>
              {error}
            </Typography>
          </Card>
        ) : null}

        {!hasToken ? (
          <Card
            sx={{
              borderRadius: 2.5,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <CardContent sx={{ p: 3, display: "grid", gap: 2.5 }}>
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 4,
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    display: "grid",
                    placeItems: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
                  }}
                >
                  <PersonOutlineIcon sx={{ fontSize: 36, color: "white" }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", mb: 0.5 }}>
                  {t("me.login.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {t("me.login.desc")}
                </Typography>
              </Box>

              <TextField
                label={t("me.login.email")}
                placeholder={t("me.login.emailPlaceholder")}
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                disabled={busy}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "text.secondary", opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label={t("me.login.password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("me.login.passwordPlaceholder")}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                disabled={busy}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "text.secondary", opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && authEmail.trim() && authPassword.trim() && !busy) {
                    doLogin();
                  }
                }}
              />
              <Button
                variant="contained"
                size="large"
                sx={{
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: "1rem",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
                }}
                disabled={!authEmail.trim() || !authPassword.trim() || busy}
                onClick={doLogin}
              >
                {busy ? <CircularProgress size={24} color="inherit" /> : t("me.login.submit")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card
              sx={{
                borderRadius: 2.5,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                mb: 2.5,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <Avatar
                    sx={{
                      width: 72,
                      height: 72,
                      background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      boxShadow: "0 6px 20px rgba(249,115,22,0.3)",
                    }}
                  >
                    {(me?.profile?.display_name || me?.email || "U").charAt(0).toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", mb: 0.25 }}>
                      {me?.profile?.display_name || me?.first_name || t("me.user.default")}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                      {me?.email || "-"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        display: "grid",
                        placeItems: "center",
                        color: "primary.main",
                      }}
                    >
                      <BadgeOutlinedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                        {t("me.nickname")}
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {me?.profile?.display_name || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                        display: "grid",
                        placeItems: "center",
                        color: "info.main",
                      }}
                    >
                      <EmailOutlinedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                        {t("me.email")}
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {me?.email || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  {me?.profile?.phone_number && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                          display: "grid",
                          placeItems: "center",
                          color: "success.main",
                        }}
                      >
                        📱
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                          {t("me.phone")}
                        </Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          {me?.profile?.phone_number}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                        display: "grid",
                        placeItems: "center",
                        color: "secondary.main",
                      }}
                    >
                      🎮
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                        {t("me.gameId")}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontFamily: "monospace", letterSpacing: "0.5px" }}>
                        {me?.id ? `#${String(me.id).padStart(8, '0')}` : "-"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.08),
                        fontSize: "0.65rem",
                        color: "text.secondary",
                        fontWeight: 600,
                      }}
                    >
                      {t("me.gameId.readonly")}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                    borderRadius: 2,
                    border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {t("me.profile.hint")}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  startIcon={<LogoutOutlinedIcon />}
                  sx={{
                    mt: 2.5,
                    py: 1.25,
                    color: "text.secondary",
                    borderColor: (theme) => alpha(theme.palette.text.primary, 0.12),
                    "&:hover": {
                      borderColor: (theme) => alpha(theme.palette.error.main, 0.5),
                      color: "error.main",
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                    },
                  }}
                  onClick={() => {
                    localStorage.removeItem("auth_token");
                    setMe(null);
                    setAuthEmail("");
                    setAuthPassword("");
                  }}
                >
                  {t("me.logout")}
                </Button>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 2.5,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 1.5, px: 0.5 }}>
                  {t("me.policy.title")}
                </Typography>
                <Box sx={{ display: "grid", gap: 0.5 }}>
                  <PolicyRow
                    icon={<PrivacyTipOutlinedIcon />}
                    title={t("me.policy.privacy")}
                    url={settings.policy_privacy || "https://example.com/privacy"}
                  />
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}
