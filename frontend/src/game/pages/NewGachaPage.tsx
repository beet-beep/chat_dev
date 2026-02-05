import { Box, Button, Card, IconButton, Typography, Dialog, DialogContent, keyframes, Chip } from "@mui/material";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import type { FullGameState } from "../state/gameState";
import { openGacha, saveGameState } from "../state/gameState";
import { RARITY_CONFIG, type GameItem } from "../items/itemDatabase";

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

const rainbow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

interface NewGachaPageProps {
  state: FullGameState;
  setState: (updater: (prev: FullGameState) => FullGameState) => void;
}

type GachaType = "normal" | "premium" | "event";

const GACHA_CONFIG: Record<GachaType, {
  name: string;
  cost: { gold?: number; gems?: number };
  icon: string;
  gradient: string;
  description: string;
}> = {
  normal: {
    name: "일반 가챠",
    cost: { gold: 100 },
    icon: "🎁",
    gradient: "linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)",
    description: "기본 아이템을 뽑을 수 있어요",
  },
  premium: {
    name: "프리미엄 가챠",
    cost: { gems: 10 },
    icon: "💎",
    gradient: "linear-gradient(135deg, #E91E63 0%, #C2185B 100%)",
    description: "레어 이상 아이템 확률 UP!",
  },
  event: {
    name: "이벤트 가챠",
    cost: { gold: 200 },
    icon: "🌟",
    gradient: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
    description: "한정 이벤트 아이템!",
  },
};

export function NewGachaPage({ state, setState }: NewGachaPageProps) {
  const nav = useNavigate();

  const [selectedGacha, setSelectedGacha] = useState<GachaType>("normal");
  const [isShaking, setIsShaking] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealItem, setRevealItem] = useState<GameItem | null>(null);
  const [multiResults, setMultiResults] = useState<GameItem[]>([]);
  const [showMultiResults, setShowMultiResults] = useState(false);

  const gachaConfig = GACHA_CONFIG[selectedGacha];

  const canAfford = useMemo(() => {
    if (gachaConfig.cost.gold && state.currency.gold < gachaConfig.cost.gold) return false;
    if (gachaConfig.cost.gems && state.currency.gems < gachaConfig.cost.gems) return false;
    return true;
  }, [state.currency, gachaConfig.cost]);

  const canAfford10 = useMemo(() => {
    const cost10 = {
      gold: (gachaConfig.cost.gold || 0) * 10,
      gems: (gachaConfig.cost.gems || 0) * 10,
    };
    if (cost10.gold && state.currency.gold < cost10.gold) return false;
    if (cost10.gems && state.currency.gems < cost10.gems) return false;
    return true;
  }, [state.currency, gachaConfig.cost]);

  const handleSingleDraw = useCallback(() => {
    if (!canAfford) return;

    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      const result = openGacha(state, gachaConfig.cost);
      if (result) {
        setState(() => {
          saveGameState(result.state);
          return result.state;
        });
        setRevealItem(result.item);
        setRevealOpen(true);
      }
    }, 800);
  }, [canAfford, state, gachaConfig.cost, setState]);

  const handleMultiDraw = useCallback(() => {
    if (!canAfford10) return;

    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);

      const items: GameItem[] = [];
      let currentState = state;

      for (let i = 0; i < 10; i++) {
        const result = openGacha(currentState, gachaConfig.cost);
        if (result) {
          currentState = result.state;
          items.push(result.item);
        }
      }

      setState(() => {
        saveGameState(currentState);
        return currentState;
      });

      setMultiResults(items);
      setShowMultiResults(true);
    }, 1200);
  }, [canAfford10, state, gachaConfig.cost, setState]);

  const rarityColors = revealItem ? RARITY_CONFIG[revealItem.rarity] : RARITY_CONFIG.common;

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
        <IconButton onClick={() => nav(-1)} sx={{ color: "white" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "white" }}>
          🎰 가챠
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Chip
            label={`🪙 ${state.currency.gold.toLocaleString()}`}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#FFD54F", fontWeight: 800 }}
          />
          <Chip
            label={`💎 ${state.currency.gems.toLocaleString()}`}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#B3E5FC", fontWeight: 800 }}
          />
        </Box>
      </Box>

      {/* Gacha Type Selection */}
      <Box sx={{ display: "flex", gap: 1, px: 2, pt: 2, overflowX: "auto" }}>
        {(Object.keys(GACHA_CONFIG) as GachaType[]).map((type) => {
          const config = GACHA_CONFIG[type];
          const isSelected = selectedGacha === type;
          return (
            <Card
              key={type}
              onClick={() => setSelectedGacha(type)}
              sx={{
                flex: "0 0 auto",
                minWidth: 100,
                p: 1.5,
                borderRadius: 3,
                background: isSelected ? config.gradient : "rgba(255,255,255,0.1)",
                border: isSelected ? "2px solid white" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "2rem" }}>{config.icon}</Typography>
                <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.8rem" }}>
                  {config.name}
                </Typography>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Main Gacha Box */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
          px: 2.5,
        }}
      >
        {/* Sparkles */}
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 8}%`,
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
          onClick={canAfford ? handleSingleDraw : undefined}
          sx={{
            width: 180,
            height: 180,
            borderRadius: 5,
            background: gachaConfig.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "5rem",
            cursor: canAfford ? "pointer" : "not-allowed",
            animation: isShaking ? `${shake} 0.5s ease-in-out` : `${glow} 2s ease-in-out infinite`,
            transition: "transform 0.2s",
            "&:hover": canAfford ? { transform: "scale(1.05)" } : {},
            "&:active": canAfford ? { transform: "scale(0.95)" } : {},
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            border: "4px solid rgba(255,255,255,0.3)",
            opacity: canAfford ? 1 : 0.5,
          }}
        >
          {gachaConfig.icon}
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
          {gachaConfig.name}
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          {gachaConfig.description}
        </Typography>

        {/* Draw Buttons */}
        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          <Button
            onClick={handleSingleDraw}
            disabled={!canAfford || isShaking}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              background: canAfford
                ? "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)"
                : "#9E9E9E",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: canAfford ? "0 4px 15px rgba(67,160,71,0.4)" : "none",
              "&:disabled": { color: "#E0E0E0" },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontWeight: 900 }}>1회 뽑기</Typography>
              <Typography sx={{ fontSize: "0.75rem", opacity: 0.9 }}>
                {gachaConfig.cost.gold ? `🪙 ${gachaConfig.cost.gold}` : `💎 ${gachaConfig.cost.gems}`}
              </Typography>
            </Box>
          </Button>
          <Button
            onClick={handleMultiDraw}
            disabled={!canAfford10 || isShaking}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              background: canAfford10
                ? "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
                : "#9E9E9E",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: canAfford10 ? "0 4px 15px rgba(255,152,0,0.4)" : "none",
              "&:disabled": { color: "#E0E0E0" },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontWeight: 900 }}>10회 뽑기</Typography>
              <Typography sx={{ fontSize: "0.75rem", opacity: 0.9 }}>
                {gachaConfig.cost.gold
                  ? `🪙 ${(gachaConfig.cost.gold * 10).toLocaleString()}`
                  : `💎 ${(gachaConfig.cost.gems! * 10).toLocaleString()}`}
              </Typography>
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Drop Rates */}
      <Box sx={{ px: 2.5, pt: 4 }}>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "white", mb: 1.5 }}>📊 확률 정보</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {(["common", "rare", "epic", "legendary", "mythic"] as const).map((rarity) => {
              const config = RARITY_CONFIG[rarity];
              return (
                <Box
                  key={rarity}
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
                  <Typography sx={{ color: config.color, fontWeight: 700, fontSize: "0.8rem" }}>
                    {rarity.toUpperCase()}
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.8rem" }}>
                    {config.dropRate}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      </Box>

      {/* Recent Pulls */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "white", mb: 1.5 }}>
            🕐 최근 뽑기 ({state.statistics.totalGachaOpened}회)
          </Typography>
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
            {state.gachaHistory.slice(-8).reverse().map((h, i) => {
              const config = RARITY_CONFIG[h.rarity];
              return (
                <Box
                  key={i}
                  sx={{
                    flexShrink: 0,
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: `${config.color}30`,
                    border: `2px solid ${config.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: config.color,
                    fontWeight: 800,
                  }}
                >
                  {h.rarity.slice(0, 3).toUpperCase()}
                </Box>
              );
            })}
            {state.gachaHistory.length === 0 && (
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                아직 기록이 없어요
              </Typography>
            )}
          </Box>
        </Card>
      </Box>

      {/* Single Result Dialog */}
      <Dialog
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            bgcolor: "#1A1A2E",
            border: `3px solid ${rarityColors.color}`,
            boxShadow: `0 0 50px ${rarityColors.glow}`,
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

          {revealItem && (
            <Box sx={{ animation: `${reveal} 0.6s ease-out forwards` }}>
              {/* Rarity */}
              <Typography
                sx={{
                  fontSize: "1rem",
                  color: rarityColors.color,
                  fontWeight: 900,
                  mb: 2,
                  textTransform: "uppercase",
                  textShadow: `0 0 20px ${rarityColors.glow}`,
                }}
              >
                ★ {revealItem.rarity} ★
              </Typography>

              {/* Item Preview */}
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  mx: "auto",
                  borderRadius: 4,
                  bgcolor: "white",
                  border: `3px solid ${rarityColors.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  boxShadow: `0 4px 30px ${rarityColors.glow}`,
                  "& svg": { width: 80, height: 80 },
                }}
                dangerouslySetInnerHTML={{
                  __html: revealItem.pixelArt.startsWith("<svg") || revealItem.pixelArt.startsWith("linear")
                    ? revealItem.pixelArt.startsWith("linear")
                      ? `<div style="width:80px;height:80px;border-radius:12px;background:${revealItem.pixelArt}"></div>`
                      : revealItem.pixelArt
                    : `<span style="font-size:4rem">${revealItem.pixelArt}</span>`,
                }}
              />

              {/* Item Name */}
              <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", color: "white", mb: 1 }}>
                {revealItem.name}
              </Typography>

              {/* Item Description */}
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", mb: 2 }}>
                {revealItem.description}
              </Typography>

              {/* Stats */}
              {revealItem.stats && (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
                  {revealItem.stats.charm && (
                    <Chip label={`✨ 매력 +${revealItem.stats.charm}`} sx={{ bgcolor: "#FCE4EC", fontWeight: 700 }} />
                  )}
                  {revealItem.stats.luck && (
                    <Chip label={`🍀 행운 +${revealItem.stats.luck}`} sx={{ bgcolor: "#E8F5E9", fontWeight: 700 }} />
                  )}
                </Box>
              )}

              <Button
                fullWidth
                onClick={() => setRevealOpen(false)}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${rarityColors.color} 0%, ${rarityColors.color}CC 100%)`,
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                }}
              >
                확인
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Multi Result Dialog */}
      <Dialog
        open={showMultiResults}
        onClose={() => setShowMultiResults(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            bgcolor: "#1A1A2E",
            border: "3px solid #7C4DFF",
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", color: "white", textAlign: "center", mb: 3 }}>
            🎉 10연차 결과!
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
            {multiResults.map((item, i) => {
              const config = RARITY_CONFIG[item.rarity];
              return (
                <Box
                  key={i}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${config.color}20`,
                    border: `2px solid ${config.color}`,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      mx: "auto",
                      mb: 0.5,
                      "& svg": { width: "100%", height: "100%" },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.pixelArt.startsWith("<svg")
                        ? item.pixelArt
                        : `<span style="font-size:1.5rem">${item.pixelArt}</span>`,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      color: "white",
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.5rem", color: config.color, fontWeight: 800 }}>
                    {item.rarity.toUpperCase()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Button
            fullWidth
            onClick={() => setShowMultiResults(false)}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)",
              color: "white",
              fontWeight: 900,
            }}
          >
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
