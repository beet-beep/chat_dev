import { Alert, Box, Button, Card, CardContent, Divider, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { login, register, testLogin } from "../../api/support";

export function GameLoginPage({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTestCred, setLastTestCred] = useState<{ email: string; password: string } | null>(null);

  function formatErr(e: any) {
    const payload = e?.payload;
    if (payload) {
      if (typeof payload === "string") return payload;
      if (typeof payload?.detail === "string") return payload.detail;
      if (typeof payload === "object") {
        // DRF field errors: {email:["..."]} or {email:"..."}
        const firstKey = Object.keys(payload)[0];
        const v = (payload as any)[firstKey];
        if (Array.isArray(v)) return String(v[0]);
        if (typeof v === "string") return v;
      }
    }
    return String(e?.message || e);
  }

  async function doLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await login({ email, password });
      localStorage.setItem("auth_token", res.token);
      onDone();
    } catch (e: any) {
      setError(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRegister() {
    setBusy(true);
    setError(null);
    try {
      const res = await register({ email, password, name: nickname.trim() || "주디 유저" });
      localStorage.setItem("auth_token", res.token);
      onDone();
    } catch (e: any) {
      setError(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function doTestLogin() {
    setBusy(true);
    setError(null);
    setLastTestCred(null);
    try {
      const res = await testLogin({});
      localStorage.setItem("auth_token", res.token);
      if (res.credentials?.email && res.credentials?.password) setLastTestCred(res.credentials);
      onDone();
    } catch (e: any) {
      setError(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ px: 2.5, pt: 3 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>주디 - 슬라임 키우기</Typography>
      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.9rem" }}>
        테스트 계정으로 바로 들어가거나, 이메일로 로그인할 수 있어요.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}

      {lastTestCred ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          테스트 계정이 생성됐어요. (디버그용) <br />
          email: {lastTestCred.email} <br />
          password: {lastTestCred.password}
        </Alert>
      ) : null}

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: "grid", gap: 1.25 }}>
          <Button variant="contained" onClick={doTestLogin} disabled={busy} sx={{ fontWeight: 900, py: 1.1 }}>
            {busy ? "처리 중..." : "테스트 계정으로 시작"}
          </Button>
          <Divider />
          <TextField label="닉네임 (선택)" value={nickname} onChange={(e) => setNickname(e.target.value)} fullWidth />
          <TextField label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Button variant="outlined" onClick={doLogin} disabled={busy} sx={{ fontWeight: 900 }}>
              로그인
            </Button>
            <Button variant="outlined" onClick={doRegister} disabled={busy} sx={{ fontWeight: 900 }}>
              회원가입
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


