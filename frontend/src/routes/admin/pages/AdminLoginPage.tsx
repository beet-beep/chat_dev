import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { adminMe, adminTestLogin, login } from "../../../api/support";

export function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin1234!");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await login({ email, password });
      localStorage.setItem("admin_token", res.token);
      // validate admin
      const me = await adminMe();
      if (!me.is_staff) {
        localStorage.removeItem("admin_token");
        setError("관리자 계정이 아닙니다.");
        return;
      }
      nav("/admin/inbox", { replace: true });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onDevLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await adminTestLogin({ email, password, nickname: "Admin" });
      localStorage.setItem("admin_token", res.token);
      const me = await adminMe();
      if (!me.is_staff) {
        localStorage.removeItem("admin_token");
        setError("관리자 계정이 아닙니다.");
        return;
      }
      nav("/admin/inbox", { replace: true });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        height: "100dvh",
        bgcolor: "background.default",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Joody Admin</Typography>
        <Typography sx={{ color: "text.secondary", mb: 2 }} variant="body2">
          관리자 전용 로그인
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Card>
          <CardContent>
            <TextField
              fullWidth
              label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" sx={{ fontWeight: 900 }} disabled={busy} onClick={onLogin}>
              {busy ? "로그인 중..." : "로그인"}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ fontWeight: 900, mt: 1.25 }}
              disabled={busy}
              onClick={onDevLogin}
            >
              테스트로 바로 로그인(계정 자동 생성)
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}



