import { Box, Card, Typography, IconButton, Chip, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import CatchingPokemonIcon from "@mui/icons-material/CatchingPokemon";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import type { GameState } from "../state";

interface MiniGame {
  id: string;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  color: string;
  bgGradient: string;
  rewards: { gold?: number; exp?: number };
  status: "available" | "coming_soon" | "locked";
}

const MINI_GAMES: MiniGame[] = [
  {
    id: "train_rush",
    name: "폭주기관",
    description: "달리는 기차에서 장애물을 피해요!",
    icon: "🚂",
    color: "#FF6B6B",
    bgGradient: "linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)",
    rewards: { gold: 50, exp: 30 },
    status: "coming_soon",
  },
  {
    id: "sing_joody",
    name: "노래해주디",
    description: "리듬에 맞춰 노트를 터치해요!",
    icon: <MusicNoteIcon sx={{ fontSize: 40 }} />,
    color: "#FFE66D",
    bgGradient: "linear-gradient(135deg, #FFE66D 0%, #FFD93D 100%)",
    rewards: { gold: 40, exp: 25 },
    status: "coming_soon",
  },
  {
    id: "plogging",
    name: "플로깅주디",
    description: "쓰레기를 주우며 달리자!",
    icon: <DirectionsRunIcon sx={{ fontSize: 40 }} />,
    color: "#4ECDC4",
    bgGradient: "linear-gradient(135deg, #4ECDC4 0%, #44A3AA 100%)",
    rewards: { gold: 60, exp: 40 },
    status: "coming_soon",
  },
  {
    id: "slime_stack",
    name: "슬라임쌓기",
    description: "떨어지는 슬라임을 쌓아요!",
    icon: <StackedBarChartIcon sx={{ fontSize: 40 }} />,
    color: "#A8E6CF",
    bgGradient: "linear-gradient(135deg, #A8E6CF 0%, #88D4AB 100%)",
    rewards: { gold: 45, exp: 35 },
    status: "coming_soon",
  },
  {
    id: "tag_game",
    name: "술래잡기",
    description: "술래를 피해 도망가요!",
    icon: <CatchingPokemonIcon sx={{ fontSize: 40 }} />,
    color: "#DDA0DD",
    bgGradient: "linear-gradient(135deg, #DDA0DD 0%, #CC88CC 100%)",
    rewards: { gold: 55, exp: 45 },
    status: "coming_soon",
  },
  {
    id: "tap_tap",
    name: "탭탭슬라임",
    description: "빠르게 탭해서 점수를 얻어요!",
    icon: "👆",
    color: "#87CEEB",
    bgGradient: "linear-gradient(135deg, #87CEEB 0%, #6BB3D9 100%)",
    rewards: { gold: 30, exp: 20 },
    status: "available",
  },
];

export function ArcadePage({ state }: { state: GameState }) {
  const nav = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)",
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
          borderBottom: "2px solid rgba(33,150,243,0.2)",
        }}
      >
        <IconButton onClick={() => nav("/home")} sx={{ color: "#1976D2" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <SportsEsportsIcon sx={{ color: "#1976D2", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#1976D2" }}>
            오락실
          </Typography>
        </Box>
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
      </Box>

      {/* Daily Bonus */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            background: "linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)",
            border: "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ color: "white", fontWeight: 900, fontSize: "1rem" }}>
                🎮 오늘의 보너스!
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem", mt: 0.5 }}>
                게임을 플레이하고 추가 보상을 받으세요
              </Typography>
            </Box>
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                fontWeight: 900,
                color: "white",
                fontSize: "0.85rem",
              }}
            >
              +50% 보너스
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Games Grid */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#1565C0", mb: 2 }}>
          🕹️ 미니게임
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {MINI_GAMES.map((game) => (
            <Card
              key={game.id}
              onClick={() => {
                if (game.status === "available") {
                  nav(`/arcade/${game.id}`);
                }
              }}
              sx={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                cursor: game.status === "available" ? "pointer" : "default",
                opacity: game.status === "coming_soon" ? 0.7 : 1,
                transition: "transform 0.2s",
                "&:hover": game.status === "available" ? { transform: "scale(1.02)" } : {},
                boxShadow: `0 4px 20px ${game.color}40`,
              }}
            >
              {/* Background */}
              <Box
                sx={{
                  background: game.bgGradient,
                  p: 2,
                  pb: 1.5,
                }}
              >
                {/* Status badge */}
                {game.status === "coming_soon" && (
                  <Chip
                    label="SOON"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.6rem",
                    }}
                  />
                )}

                {/* Icon */}
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    mb: 1.5,
                    mx: "auto",
                    color: "white",
                  }}
                >
                  {game.icon}
                </Box>

                {/* Name */}
                <Typography
                  sx={{
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: "1rem",
                    color: "white",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {game.name}
                </Typography>
              </Box>

              {/* Info */}
              <Box sx={{ bgcolor: "white", p: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#666",
                    textAlign: "center",
                    mb: 1,
                    minHeight: 32,
                  }}
                >
                  {game.description}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                  {game.rewards.gold && (
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#F57F17" }}>
                      🪙 {game.rewards.gold}
                    </Typography>
                  )}
                  {game.rewards.exp && (
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#2E7D32" }}>
                      ⭐ {game.rewards.exp}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Tips */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.9)",
            border: "2px solid rgba(33,150,243,0.2)",
          }}
        >
          <Typography sx={{ fontWeight: 900, color: "#1565C0", mb: 1 }}>💡 꿀팁!</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6 }}>
            • 매일 첫 플레이는 보너스 골드 +50%
            <br />
            • 연속 플레이 시 콤보 보너스!
            <br />• 새 게임이 곧 추가될 예정이에요
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
