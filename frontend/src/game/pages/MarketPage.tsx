import { Alert, Box, Button, Card, CardContent, Chip, Divider, MenuItem, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { GameState } from "../state";
import { grant, normalize, take } from "../state";
import { recordTx } from "../state";
import { COSMETICS } from "../items";
import { loadOffers, loadPayouts, saveOffers, savePayouts, type Offer } from "../market";
import { GameTopBar } from "../ui/GameTopBar";

export function MarketPage({
  state,
  setState,
  sellerName,
  sellerKey,
}: {
  state: GameState;
  setState: (updater: (prev: GameState) => GameState) => void;
  sellerName: string;
  sellerKey: string;
}) {
  const ownedIds = Object.keys(state.owned || {});
  const owned = COSMETICS.filter((c) => ownedIds.includes(c.id));
  const [offers, setOffers] = useState<Offer[]>(() => loadOffers());
  const [sellItemId, setSellItemId] = useState<string>("");
  const [priceGold, setPriceGold] = useState<number>(200);
  const [notice, setNotice] = useState<string | null>(null);

  const sellCandidates = useMemo(
    () => owned.filter((it) => (state.owned?.[it.id] || 0) > 0),
    [owned, state.owned]
  );

  const myOffers = useMemo(() => offers.filter((o) => o.seller_key === sellerKey), [offers, sellerKey]);

  return (
    <Box sx={{ pb: 2 }}>
      <GameTopBar title="단골 마켓" />
      <Box sx={{ px: 2.5, pt: 0.5 }}>

      {notice ? (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: "grid", gap: 1 }}>
          <Typography sx={{ fontWeight: 900 }}>판매 등록</Typography>
          <Divider />
          <TextField
            select
            label="아이템"
            value={sellItemId}
            onChange={(e) => setSellItemId(String(e.target.value))}
            fullWidth
          >
            <MenuItem value="">판매할 아이템을 선택하세요</MenuItem>
            {sellCandidates.map((it) => (
              <MenuItem key={it.id} value={it.id}>
                {it.icon} {it.name} (x{state.owned?.[it.id] || 0})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="가격 (골드)"
            type="number"
            value={priceGold}
            onChange={(e) => setPriceGold(Math.max(1, Number(e.target.value) || 1))}
            fullWidth
          />
          <Button
            variant="contained"
            sx={{ fontWeight: 900, py: 1.1 }}
            disabled={!sellItemId}
            onClick={() => {
              const it = COSMETICS.find((x) => x.id === sellItemId);
              if (!it) return;
              const count = state.owned?.[sellItemId] || 0;
              if (count <= 0) return;
              // Take item from seller inventory and create offer
              setState((prev) =>
                recordTx(take(prev, sellItemId, 1), {
                  kind: "market_list",
                  delta: {},
                  meta: { item_id: sellItemId, price_gold: Math.max(1, priceGold) },
                })
              );
              const nextOffers = [
                ...offers,
                {
                  id: String(Date.now()),
                  seller_key: sellerKey,
                  seller_name: sellerName,
                  item_id: sellItemId,
                  price_gold: Math.max(1, priceGold),
                  created_at: new Date().toISOString(),
                },
              ];
              setOffers(nextOffers);
              saveOffers(nextOffers);
              setSellItemId("");
              setNotice("판매 등록이 완료됐어요.");
            }}
          >
            판매 등록하기
          </Button>
          <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>
            등록하면 아이템 1개가 인벤토리에서 빠지고, 다른 유저가 구매하면 골드가 지급돼요. (MVP: 로컬)
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>내 인벤토리</Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            {owned.map((it) => (
              <Box key={it.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>
                  {it.icon} {it.name}
                </Typography>
                <Chip label={`x${state.owned[it.id] || 0}`} />
              </Box>
            ))}
            {owned.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                아직 아이템이 없어요. 상자에서 뽑아보세요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>거래소</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            {offers
              .slice()
              .reverse()
              .slice(0, 30)
              .map((o) => {
                const it = COSMETICS.find((x) => x.id === o.item_id);
                const canBuy = (state.currency.gold || 0) >= o.price_gold;
                const isMine = o.seller_key === sellerKey;
                return (
                  <Box key={o.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {it ? `${it.icon} ${it.name}` : o.item_id}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
                        판매자 {o.seller_name} · {new Date(o.created_at).toLocaleString("ko-KR")}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!canBuy || isMine}
                      sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
                      onClick={() => {
                        // spend gold & grant item, remove offer
                        if (!canBuy || isMine) return;
                        setState((prev) =>
                          recordTx(
                            normalize({
                              ...grant(prev, o.item_id, 1),
                              currency: { ...prev.currency, gold: (prev.currency.gold || 0) - o.price_gold },
                            }),
                            { kind: "market_buy", delta: { gold: -o.price_gold }, meta: { offer_id: o.id, item_id: o.item_id } }
                          )
                        );
                        // credit seller payout (pending)
                        try {
                          const payouts = loadPayouts();
                          payouts[o.seller_key] = (payouts[o.seller_key] || 0) + Number(o.price_gold || 0);
                          savePayouts(payouts);
                        } catch {
                          // ignore
                        }
                        const next = offers.filter((x) => x.id !== o.id);
                        setOffers(next);
                        saveOffers(next);
                        setNotice(`구매 완료! (-${o.price_gold} GOLD)`);
                      }}
                    >
                      {isMine ? "내 상품" : `${o.price_gold} GOLD 구매`}
                    </Button>
                  </Box>
                );
              })}
            {offers.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                아직 등록된 상품이 없어요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>내 판매</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            {myOffers
              .slice()
              .reverse()
              .slice(0, 20)
              .map((o) => {
                const it = COSMETICS.find((x) => x.id === o.item_id);
                return (
                  <Box key={o.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {it ? `${it.icon} ${it.name}` : o.item_id}
                      </Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
                        {o.price_gold} GOLD · {new Date(o.created_at).toLocaleString("ko-KR")}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
                      onClick={() => {
                        // cancel listing: return item to seller inventory and remove offer
                        setState((prev) =>
                          recordTx(grant(prev, o.item_id, 1), {
                            kind: "market_cancel",
                            delta: {},
                            meta: { offer_id: o.id, item_id: o.item_id },
                          })
                        );
                        const next = offers.filter((x) => x.id !== o.id);
                        setOffers(next);
                        saveOffers(next);
                        setNotice("판매를 취소했어요. 아이템이 인벤토리로 돌아갔어요.");
                      }}
                    >
                      취소
                    </Button>
                  </Box>
                );
              })}
            {myOffers.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                등록한 상품이 없어요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}


