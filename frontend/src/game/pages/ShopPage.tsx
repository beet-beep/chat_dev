import { Box, Button, Card, Chip, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import StoreIcon from "@mui/icons-material/Store";
import type { GameState } from "../state";
import { grant, normalize, recordTx } from "../state";
import { COSMETICS } from "../items";
import { ItemThumb } from "../ui/ItemThumb";

const GEM_PACKAGES = [
  { krw: 1100, gems: 50, id: "gems_50", bonus: 0 },
  { krw: 2900, gems: 120, id: "gems_120", bonus: 10 },
  { krw: 9900, gems: 450, id: "gems_450", bonus: 50 },
  { krw: 30000, gems: 1500, id: "gems_1500", bonus: 200 },
  { krw: 50000, gems: 2600, id: "gems_2600", bonus: 400 },
  { krw: 99000, gems: 5500, id: "gems_5500", bonus: 1000, popular: true },
];

export function ShopPage({
  state,
  setState,
}: {
  state: GameState;
  setState: (updater: (prev: GameState) => GameState) => void;
}) {
  const nav = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)",
        pb: 10,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 1.5,
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          borderBottom: "2px solid rgba(76,175,80,0.2)",
        }}
      >
        <IconButton onClick={() => nav("/home")} sx={{ color: "#2E7D32" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <StoreIcon sx={{ color: "#2E7D32", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#2E7D32" }}>상점</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 3,
              bgcolor: "#FFF8E1",
              border: "2px solid #FFD54F",
              fontWeight: 900,
              fontSize: "0.85rem",
              color: "#F57F17",
            }}
          >
            🪙 {state.currency.gold.toLocaleString()}
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 3,
              bgcolor: "#E3F2FD",
              border: "2px solid #64B5F6",
              fontWeight: 900,
              fontSize: "0.85rem",
              color: "#1565C0",
            }}
          >
            💎 {state.currency.gems.toLocaleString()}
          </Box>
        </Box>
      </Box>

      {/* Gem Packages */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#2E7D32", mb: 2 }}>
          💎 젬 패키지
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {GEM_PACKAGES.map((p) => (
            <Card
              key={p.id}
              onClick={() =>
                setState((prev) =>
                  recordTx(
                    normalize({ ...prev, currency: { ...prev.currency, gems: (prev.currency.gems || 0) + p.gems + p.bonus } }),
                    { kind: "shop_gem_pack", delta: { gems: +(p.gems + p.bonus) }, meta: { price_krw: p.krw, product: p.id } }
                  )
                )
              }
              sx={{
                position: "relative",
                p: 2,
                borderRadius: 4,
                bgcolor: "white",
                border: p.popular ? "3px solid #FFD54F" : "2px solid #E0E0E0",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
                boxShadow: p.popular ? "0 4px 20px rgba(255,193,7,0.3)" : "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              {p.popular && (
                <Chip
                  label="BEST"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: 10,
                    bgcolor: "#FF5722",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.65rem",
                  }}
                />
              )}
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>💎</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#1565C0" }}>
                  {p.gems.toLocaleString()}
                </Typography>
                {p.bonus > 0 && (
                  <Typography sx={{ fontSize: "0.7rem", color: "#FF5722", fontWeight: 700 }}>
                    +{p.bonus} 보너스!
                  </Typography>
                )}
                <Box
                  sx={{
                    mt: 1.5,
                    py: 0.8,
                    borderRadius: 2,
                    bgcolor: "#4CAF50",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                  }}
                >
                  ₩{p.krw.toLocaleString()}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Gold Exchange */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#2E7D32", mb: 2 }}>
          🔄 골드 교환
        </Typography>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "white",
            border: "2px solid #FFD54F",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontSize: "2rem" }}>💎</Typography>
              <Typography sx={{ fontWeight: 800, color: "#666" }}>→</Typography>
              <Typography sx={{ fontSize: "2rem" }}>🪙</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontWeight: 700, color: "#666", fontSize: "0.8rem" }}>
                젬 1개 = 골드 500개
              </Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            disabled={(state.currency.gems || 0) < 1}
            onClick={() =>
              setState((prev) =>
                recordTx(
                  normalize({
                    ...prev,
                    currency: { gold: (prev.currency.gold || 0) + 500, gems: (prev.currency.gems || 0) - 1 },
                  }),
                  { kind: "exchange_gem_to_gold", delta: { gems: -1, gold: +500 } }
                )
              )
            }
            sx={{
              mt: 2,
              py: 1.2,
              borderRadius: 3,
              background:
                (state.currency.gems || 0) >= 1
                  ? "linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)"
                  : "#E0E0E0",
              color: "white",
              fontWeight: 900,
              boxShadow: (state.currency.gems || 0) >= 1 ? "0 4px 15px rgba(255,152,0,0.4)" : "none",
              "&:disabled": { color: "#9E9E9E" },
            }}
          >
            교환하기
          </Button>
        </Card>
      </Box>

      {/* Item Shop */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#2E7D32", mb: 2 }}>
          🎁 아이템 상점
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
          {COSMETICS.slice(0, 9).map((it, idx) => {
            const price = 3 + (idx % 4) * 2;
            const can = (state.currency.gems || 0) >= price;
            const rarityColors: Record<string, string> = {
              common: "#BDBDBD",
              rare: "#42A5F5",
              epic: "#AB47BC",
              legendary: "#FFB300",
            };
            return (
              <Card
                key={it.id}
                onClick={() => {
                  if (!can) return;
                  setState((prev) =>
                    recordTx(
                      normalize({
                        ...grant(prev, it.id, 1),
                        currency: { ...prev.currency, gems: (prev.currency.gems || 0) - price },
                      }),
                      { kind: "shop_item_buy", delta: { gems: -price }, meta: { item_id: it.id, price_gems: price } }
                    )
                  );
                }}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: can ? "white" : "#F5F5F5",
                  border: `2px solid ${rarityColors[it.rarity] || "#E0E0E0"}`,
                  cursor: can ? "pointer" : "not-allowed",
                  opacity: can ? 1 : 0.6,
                  transition: "transform 0.2s",
                  "&:hover": can ? { transform: "scale(1.05)" } : {},
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                  <ItemThumb item={it} size={45} />
                </Box>
                <Typography
                  sx={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    color: "#424242",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.name}
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: can ? "#E3F2FD" : "#EEEEEE",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#1565C0" }}>
                    💎 {price}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
