import { Alert, Box, Card, CardContent, Divider, Typography } from "@mui/material";
import type { Me } from "../../api/types";
import type { GameState } from "../state";
import { GameTopBar } from "../ui/GameTopBar";
import { useNavigate } from "react-router-dom";

export function BillingPage({ me, state }: { me: Me; state: GameState }) {
  const nav = useNavigate();
  const provider = me.profile?.login_provider || me.profile?.login_info?.provider || "email";
  const hasPm = Boolean(me.profile?.payment_info?.has_payment_method);

  const purchase = (state.ledger || []).filter((t) => t.kind === "shop_gem_pack").slice().reverse().slice(0, 20);

  return (
    <Box sx={{ pb: 2 }}>
      <GameTopBar title="결제 정보" onBack={() => nav(-1)} />
      <Box sx={{ px: 2.5, pt: 0.75 }}>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>계정 요약</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Row k="로그인 방식" v={String(provider)} />
          <Row k="결제수단 등록" v={hasPm ? "등록됨(요약)" : "없음"} />
          <Alert severity="info" sx={{ mt: 2 }}>
            MVP에서는 “모의 결제”로 재화만 지급돼요.
          </Alert>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>구매 내역(젬)</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            {purchase.map((p) => (
              <Box key={p.id} sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{p.meta?.product || "gems_pack"}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
                    {new Date(p.at).toLocaleString("ko-KR")}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  {p.delta.gems ? (
                    <Typography sx={{ fontWeight: 900, color: "success.main" }}>+{Number(p.delta.gems).toLocaleString()} 💎</Typography>
                  ) : null}
                  {p.meta?.price_krw ? (
                    <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>￦{Number(p.meta.price_krw).toLocaleString()}</Typography>
                  ) : null}
                </Box>
              </Box>
            ))}
            {purchase.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                아직 구매 내역이 없어요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
      <Typography sx={{ fontWeight: 900 }}>{k}</Typography>
      <Typography sx={{ color: "text.secondary" }}>{v}</Typography>
    </Box>
  );
}


