import { Box, Button, Card, TextField, Typography, Alert, IconButton, InputAdornment, Divider, CircularProgress } from "@mui/material";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import AppleIcon from "@mui/icons-material/Apple";
import { PixelSlime } from "../ui/PixelSlime";

// API 호출 함수들 (실제 백엔드 연동 시 수정)
async function loginApi(email: string, password: string): Promise<{ token: string; user: any }> {
  // 실제 API 호출
  const response = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "로그인에 실패했습니다.");
  }

  return response.json();
}

async function signupApi(data: { email: string; password: string; username: string; displayName: string }): Promise<{ token: string; user: any }> {
  const response = await fetch("/api/auth/signup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || "회원가입에 실패했습니다.");
  }

  return response.json();
}

type AuthMode = "login" | "signup" | "forgot";

export function AuthPage({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const nav = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = useCallback(async () => {
    setError(null);

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginApi(email, password);
      localStorage.setItem("auth_token", result.token);
      setSuccess("로그인 성공!");
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (e: any) {
      setError(e.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [email, password, onAuthSuccess]);

  const handleSignup = useCallback(async () => {
    setError(null);

    if (!email || !password || !username || !displayName) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("아이디는 3-20자 사이여야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const result = await signupApi({ email, password, username, displayName });
      localStorage.setItem("auth_token", result.token);
      setSuccess("회원가입 성공! 환영합니다!");
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (e: any) {
      setError(e.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, username, displayName, onAuthSuccess]);

  const handleGuestLogin = useCallback(() => {
    // 게스트 로그인 (로컬 스토리지만 사용)
    const guestId = `guest_${Date.now()}`;
    localStorage.setItem("auth_token", `guest_${guestId}`);
    localStorage.setItem("is_guest", "true");
    onAuthSuccess();
  }, [onAuthSuccess]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {/* 로고 & 슬라임 */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <PixelSlime
          color="pink"
          size={120}
          expression="happy"
          animated
          showLevel={false}
        />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "1.8rem",
            color: "#2E7D32",
            mt: 2,
            fontFamily: "'Noto Sans KR', sans-serif",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          🌱 주디 슬라임
        </Typography>
        <Typography sx={{ color: "#558B2F", fontWeight: 600, fontSize: "0.9rem" }}>
          나만의 귀여운 슬라임을 키워보세요!
        </Typography>
      </Box>

      {/* 인증 카드 */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          p: 3,
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(76,175,80,0.2)",
          border: "2px solid rgba(76,175,80,0.1)",
        }}
      >
        {/* 탭 */}
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <Button
            fullWidth
            onClick={() => { setMode("login"); setError(null); }}
            sx={{
              py: 1.2,
              borderRadius: 2,
              fontWeight: 800,
              bgcolor: mode === "login" ? "#4CAF50" : "transparent",
              color: mode === "login" ? "white" : "#4CAF50",
              border: mode === "login" ? "none" : "2px solid #4CAF50",
              "&:hover": {
                bgcolor: mode === "login" ? "#43A047" : "rgba(76,175,80,0.1)",
              },
            }}
          >
            로그인
          </Button>
          <Button
            fullWidth
            onClick={() => { setMode("signup"); setError(null); }}
            sx={{
              py: 1.2,
              borderRadius: 2,
              fontWeight: 800,
              bgcolor: mode === "signup" ? "#4CAF50" : "transparent",
              color: mode === "signup" ? "white" : "#4CAF50",
              border: mode === "signup" ? "none" : "2px solid #4CAF50",
              "&:hover": {
                bgcolor: mode === "signup" ? "#43A047" : "rgba(76,175,80,0.1)",
              },
            }}
          >
            회원가입
          </Button>
        </Box>

        {/* 에러/성공 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* 로그인 폼 */}
        {mode === "login" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: "1rem",
                boxShadow: "0 4px 15px rgba(67,160,71,0.4)",
                "&:disabled": {
                  background: "#E0E0E0",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "로그인"}
            </Button>
            <Button
              onClick={() => setMode("forgot")}
              sx={{ color: "#757575", fontWeight: 600, textDecoration: "underline" }}
            >
              비밀번호를 잊으셨나요?
            </Button>
          </Box>
        )}

        {/* 회원가입 폼 */}
        {mode === "signup" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="아이디 (3-20자)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              disabled={loading}
              helperText="영문 소문자, 숫자, 밑줄(_)만 사용 가능"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="닉네임"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              helperText="게임에서 표시될 이름"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="비밀번호 (6자 이상)"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="비밀번호 확인"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={confirmPassword !== "" && password !== confirmPassword}
              helperText={confirmPassword !== "" && password !== confirmPassword ? "비밀번호가 일치하지 않습니다" : ""}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Button
              fullWidth
              onClick={handleSignup}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: "1rem",
                boxShadow: "0 4px 15px rgba(67,160,71,0.4)",
                "&:disabled": {
                  background: "#E0E0E0",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "회원가입"}
            </Button>
          </Box>
        )}

        {/* 비밀번호 찾기 */}
        {mode === "forgot" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ color: "#666", mb: 1 }}>
              가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
            </Typography>
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Button
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
                color: "white",
                fontWeight: 900,
              }}
            >
              재설정 링크 보내기
            </Button>
            <Button
              onClick={() => setMode("login")}
              sx={{ color: "#757575", fontWeight: 600 }}
            >
              로그인으로 돌아가기
            </Button>
          </Box>
        )}

        {/* 소셜 로그인 */}
        {mode !== "forgot" && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography sx={{ color: "#9E9E9E", fontSize: "0.85rem" }}>또는</Typography>
            </Divider>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Button
                fullWidth
                startIcon={<GoogleIcon />}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  bgcolor: "#FAFAFA",
                  color: "#333",
                  border: "1px solid #E0E0E0",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#F5F5F5" },
                }}
              >
                Google로 계속하기
              </Button>
              <Button
                fullWidth
                startIcon={<AppleIcon />}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  bgcolor: "#000",
                  color: "#FFF",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                Apple로 계속하기
              </Button>
            </Box>
          </>
        )}
      </Card>

      {/* 게스트 로그인 */}
      <Button
        onClick={handleGuestLogin}
        sx={{
          mt: 3,
          color: "#558B2F",
          fontWeight: 700,
          textDecoration: "underline",
        }}
      >
        🎮 게스트로 체험하기
      </Button>

      {/* 약관 */}
      <Typography sx={{ mt: 2, color: "#9E9E9E", fontSize: "0.75rem", textAlign: "center" }}>
        계속 진행하면{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>이용약관</span> 및{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>개인정보처리방침</span>에
        동의하는 것으로 간주됩니다.
      </Typography>
    </Box>
  );
}
