import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  keyframes,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import type { GameState } from "../state";
import { canAfford, drawGacha, recordTx, spend } from "../state";
import { COSMETICS } from "../items";
import { ItemThumb } from "../ui/ItemThumb";

const shake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-15deg); }
  40% { transform: rotate(15deg); }
  60% { transform: rotate(-10deg); }
  80% { transform: rotate(10deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(124,77,255,0.3); }
  50% { box-shadow: 0 0 40px rgba(124,77,255,0.6), 0 0 60px rgba(124,77,255,0.4); }
`;

const reveal = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: "#F5F5F5", border: "#BDBDBD", text: "#757575", glow: "rgba(158,158,158,0.4)" },
  rare: { bg: "#E3F2FD", border: "#42A5F5", text: "#1976D2", glow: "rgba(66,165,245,0.4)" },
  epic: { bg: "#F3E5F5", border: "#AB47BC", text: "#7B1FA2", glow: "rgba(171,71,188,0.4)" },
  legendary: { bg: "#FFF8E1", border: "#FFB300", text: "#F57C00", glow: "rgba(255,179,0,0.6)" },
};

export function BoxPage({
  state,
  setState,
}: {
  state: GameState;
  setState: (updater: (prev: GameState) => GameState) => void;
}) {
  const nav = useNavigate();
  const cost = { gold: 100 };
  const ok = canAfford(state, cost);

  const [revealOpen, setRevealOpen] = useState(false);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const revealItem = useMemo(() => (revealId ? COSMETICS.find((x) => x.id === revealId) || null : null), [revealId]);
  const colors = revealItem ? RARITY_COLORS[revealItem.rarity] || RARITY_COLORS.common : RARITY_COLORS.common;

  const handleDraw = () => {
    if (!ok) return;

    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setState((prev) => {
        const paid = spend(prev, cost);
        const { next, item } = drawGacha(paid);
        setRevealId(item.id);
        setRevealOpen(true);
        return recordTx(next, { kind: "gacha_open", delta: { gold: -cost.gold }, meta: { item_id: item.id } });
      });
    }, 800);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #311B92 0%, #4527A0 30%, #5E35B1 70%, #7C4DFF 100%)",
        pb: 10,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 1.5,
          background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <IconButton onClick={() => nav("/home")} sx={{ color: "white" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "white" }}>🎁 뽑기</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontWeight: 900,
              fontSize: "0.85rem",
              color: "#FFD54F",
            }}
          >
            🪙 {state.currency.gold.toLocaleString()}
          </Box>
        </Box>
      </Box>

      {/* Main Box Area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
          px: 2.5,
        }}
      >
        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              left: `${15 + i * 15}%`,
              top: `${15 + (i % 3) * 10}%`,
              fontSize: "1.5rem",
              animation: `${sparkle} ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            ✨
          </Box>
        ))}

        {/* Gift Box */}
        <Box
          onClick={ok ? handleDraw : undefined}
          sx={{
            width: 180,
            height: 180,
            borderRadius: 5,
            background: "linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "5rem",
            cursor: ok ? "pointer" : "not-allowed",
            animation: isShaking ? `${shake} 0.5s ease-in-out` : `${glow} 2s ease-in-out infinite`,
            transition: "transform 0.2s",
            "&:hover": ok ? { transform: "scale(1.05)" } : {},
            "&:active": ok ? { transform: "scale(0.95)" } : {},
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            border: "4px solid rgba(255,255,255,0.3)",
          }}
        >
          🎁
        </Box>

        <Typography
          sx={{
            mt: 3,
            color: "white",
            fontWeight: 900,
            fontSize: "1.3rem",
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          아이템 뽑기
        </Typography>
        <Typography
          sx={{
            mt: 1,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          상자를 터치해서 아이템을 뽑아보세요!
        </Typography>

        {/* Cost & Button */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Chip
            label={`🪙 ${cost.gold} GOLD`}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: 800,
              fontSize: "0.9rem",
              py: 2,
              px: 1,
            }}
          />
          {!ok && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                bgcolor: "rgba(255,152,0,0.2)",
                color: "#FFB74D",
                fontWeight: 600,
                "& .MuiAlert-icon": { color: "#FFB74D" },
              }}
            >
              골드가 부족해요!
            </Alert>
          )}
        </Box>

        {/* Rates Info */}
        <Card
          sx={{
            mt: 4,
            width: "100%",
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 900, color: "white", mb: 1.5 }}>📊 확률 정보</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {[
                { rarity: "Common", rate: "60%", color: "#BDBDBD" },
                { rarity: "Rare", rate: "30%", color: "#42A5F5" },
                { rarity: "Epic", rate: "8%", color: "#AB47BC" },
                { rarity: "Legendary", rate: "2%", color: "#FFB300" },
              ].map((r) => (
                <Box
                  key={r.rarity}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <Typography sx={{ color: r.color, fontWeight: 700, fontSize: "0.8rem" }}>
                    {r.rarity}
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.8rem" }}>
                    {r.rate}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>

        {/* Recent Pulls */}
        <Card
          sx={{
            mt: 2,
            width: "100%",
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 900, color: "white", mb: 1.5 }}>🕐 최근 뽑기</Typography>
            <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
              {(state.gacha_history || [])
                .slice(-6)
                .reverse()
                .map((h) => {
                  const it = COSMETICS.find((x) => x.id === h.item_id);
                  if (!it) return null;
                  const c = RARITY_COLORS[it.rarity] || RARITY_COLORS.common;
                  return (
                    <Box
                      key={h.at}
                      sx={{
                        flexShrink: 0,
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: c.bg,
                        border: `2px solid ${c.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ItemThumb item={it} size={40} />
                    </Box>
                  );
                })}
              {(state.gacha_history || []).length === 0 && (
                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                  아직 기록이 없어요
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Reveal Dialog */}
      <Dialog
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            bgcolor: colors.bg,
            border: `3px solid ${colors.border}`,
            boxShadow: `0 0 30px ${colors.glow}`,
            overflow: "visible",
          },
        }}
      >
        <DialogContent sx={{ p: 4, textAlign: "center", position: "relative" }}>
          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                left: `${10 + (i % 4) * 25}%`,
                top: `${10 + Math.floor(i / 4) * 70}%`,
                fontSize: "1.5rem",
                animation: `${sparkle} 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              ✨
            </Box>
          ))}

          {revealItem ? (
            <Box sx={{ animation: `${reveal} 0.6s ease-out forwards` }}>
              <Typography sx={{ fontSize: "0.9rem", color: colors.text, fontWeight: 700, mb: 1 }}>
                {revealItem.rarity.toUpperCase()}
              </Typography>
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  mx: "auto",
                  borderRadius: 4,
                  bgcolor: "white",
                  border: `3px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  boxShadow: `0 4px 20px ${colors.glow}`,
                }}
              >
                <ItemThumb item={revealItem} size={100} />
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#212121", mb: 1 }}>
                {revealItem.name}
              </Typography>
              <Typography sx={{ color: "#757575", fontSize: "0.85rem", mb: 3 }}>
                인벤토리에 추가되었어요!
              </Typography>
              <Button
                fullWidth
                onClick={() => setRevealOpen(false)}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.border} 0%, ${colors.text} 100%)`,
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                }}
              >
                확인
              </Button>
            </Box>
          ) : (
            <Typography>로딩중...</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
