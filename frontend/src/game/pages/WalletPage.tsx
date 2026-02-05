import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import type { GameState } from "../state";

export function WalletPage({ state }: { state: GameState }) {
  return (
    <Box sx={{ px: 2.5, pt: 2.5 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>지갑</Typography>
      <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: "0.9rem" }}>
        재화와 내역을 확인할 수 있어요.
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900 }}>보유 재화</Typography>
          <Divider sx={{ my: 1.25 }} />
          <Row k="골드" v={state.currency.gold.toLocaleString()} />
          <Row k="젬" v={state.currency.gems.toLocaleString()} />
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900 }}>내역</Typography>
          <Divider sx={{ my: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            {(state.ledger || [])
              .slice()
              .reverse()
              .slice(0, 20)
              .map((tx) => (
                <Box key={tx.id} sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{label(tx.kind)}</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
                      {new Date(tx.at).toLocaleString("ko-KR")}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    {tx.delta.gold ? (
                      <Typography sx={{ fontWeight: 900, color: tx.delta.gold > 0 ? "success.main" : "text.primary" }}>
                        {fmt(tx.delta.gold)} GOLD
                      </Typography>
                    ) : null}
                    {tx.delta.gems ? (
                      <Typography sx={{ fontWeight: 900, color: tx.delta.gems > 0 ? "success.main" : "text.primary" }}>
                        {fmt(tx.delta.gems)} 💎
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              ))}
            {(state.ledger || []).length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                아직 내역이 없어요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
      <Typography sx={{ fontWeight: 900 }}>{k}</Typography>
      <Typography sx={{ color: "text.secondary", fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' }}>
        {v}
      </Typography>
    </Box>
  );
}

function label(kind: string) {
  if (kind === "gacha_open") return "상자 뽑기";
  if (kind === "shop_gem_pack") return "젬 구매(모의)";
  if (kind === "shop_item_buy") return "아이템 구매";
  if (kind === "exchange_gem_to_gold") return "젬 → 골드 교환";
  if (kind === "market_list") return "거래 등록";
  if (kind === "market_sale") return "판매 정산";
  if (kind === "market_cancel") return "판매 취소";
  if (kind === "market_buy") return "거래 구매";
  return kind;
}

function fmt(n: number) {
  const s = Math.abs(n).toLocaleString();
  return n > 0 ? `+${s}` : `-${s}`;
}


