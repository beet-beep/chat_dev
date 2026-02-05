import { Alert, Avatar, Box, Button, Card, CardContent, Divider, TextField, Typography } from "@mui/material";
import type { Me } from "../../api/types";
import type { GameState } from "../state";
import { uploadMeAvatar, updateMe } from "../../api/support";
import { useEffect, useState } from "react";

export function ProfilePage({
  me,
  state,
  onRefreshMe,
  onLogout,
  onOpenSettings,
}: {
  me: Me;
  state: GameState;
  onRefreshMe: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}) {
  const p = me.profile || ({} as any);
  const uuid = p.game_uuid || me.username || "-";
  const memberCode = p.member_code || "-";
  const provider = p.login_provider || p.login_info?.provider || "email";
  const [nick, setNick] = useState<string>(p.display_name || me.first_name || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setNick(p.display_name || me.first_name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, p.display_name]);

  return (
    <Box sx={{ px: 2.5, pt: 2.5 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>프로필</Typography>
      <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: "0.9rem" }}>
        계정 정보를 확인하고, 설정에서 더 많은 기능을 관리할 수 있어요.
      </Typography>

      {msg ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {msg}
        </Alert>
      ) : null}

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={p.avatar_url || undefined} sx={{ width: 56, height: 56, bgcolor: "primary.main", fontWeight: 900 }}>
            {(p.display_name || me.email || "U").slice(0, 1)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900 }} noWrap>
              {p.display_name || me.first_name || "사용자"}
            </Typography>
            <Typography sx={{ color: "text.secondary" }} noWrap>
              {me.email}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
              {p.phone_number || "-"}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={onOpenSettings} sx={{ fontWeight: 900 }}>
            설정
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>프로필 수정</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            <TextField
              label="게임 닉네임"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 24 }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Button
                variant="contained"
                disabled={busy || !nick.trim()}
                sx={{ fontWeight: 900 }}
                onClick={async () => {
                  setBusy(true);
                  setMsg(null);
                  try {
                    await updateMe({ profile: { display_name: nick.trim() } });
                    setMsg("닉네임이 저장됐어요. (문의/어드민에도 자동 반영)");
                    onRefreshMe();
                  } catch (e: any) {
                    setMsg(String(e?.payload?.detail || e?.message || e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "저장 중..." : "닉네임 저장"}
              </Button>
              <Button
                component="label"
                variant="outlined"
                disabled={busy}
                sx={{ fontWeight: 900 }}
              >
                프로필 사진 업로드
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.currentTarget.value = "";
                    if (!f) return;
                    setBusy(true);
                    setMsg(null);
                    try {
                      await uploadMeAvatar(f);
                      setMsg("프로필 사진이 업로드됐어요. (문의/어드민에 자동 반영)");
                      onRefreshMe();
                    } catch (err: any) {
                      setMsg(String(err?.payload?.detail || err?.message || err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>계정 정보</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Row k="닉네임" v={p.display_name || "-"} />
            <Row k="이메일" v={me.email || "-"} />
            <Row k="UUID" v={uuid} mono />
            <Row k="휴대폰 번호" v={p.phone_number || "-"} />
            <Row k="회원 코드" v={memberCode} mono />
            <Row k="로그인 정보" v={String(provider)} />
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            결제 정보/영수증/소셜 연결은 보안 이슈가 있어서 “요약 정보”만 노출하고, 민감정보는 서버에 저장하지 않아요.
          </Alert>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>게임 정보</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Row k="골드" v={state.currency.gold.toLocaleString()} mono />
            <Row k="젬" v={state.currency.gems.toLocaleString()} mono />
            <Row k="장착(모자)" v={state.equipped.hat || "-"} mono />
            <Row k="장착(얼굴)" v={state.equipped.face || "-"} mono />
            <Row k="장착(의상)" v={state.equipped.body || "-"} mono />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
        <Button variant="contained" onClick={onLogout} sx={{ fontWeight: 900, py: 1.15 }}>
          로그아웃
        </Button>
      </Box>
    </Box>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography sx={{ fontWeight: 900 }}>{k}</Typography>
      <Typography
        sx={{
          color: "text.secondary",
          textAlign: "right",
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' : undefined,
          fontSize: mono ? "0.85rem" : undefined,
        }}
      >
        {v}
      </Typography>
    </Box>
  );
}


