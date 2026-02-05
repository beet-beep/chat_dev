import { Box, Button, Card, IconButton, Typography, keyframes } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import type { GameState } from "../state";
import { SlimeAvatar, type SlimeColor } from "../ui/SlimeAvatar";

const pop = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2) translateY(-30px); opacity: 0; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

interface FlyingScore {
  id: number;
  score: number;
  x: number;
  y: number;
}

export function TapTapGamePage({
  state,
  setState,
}: {
  state: GameState;
  setState: (updater: (prev: GameState) => GameState) => void;
}) {
  const nav = useNavigate();

  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [flyingScores, setFlyingScores] = useState<FlyingScore[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem("tap_tap_best") || 0));
  const [slimeColor] = useState<SlimeColor>(() => {
    const colors: SlimeColor[] = ["pink", "blue", "green", "yellow", "purple", "orange", "mint"];
    const saved = localStorage.getItem("slime_color");
    if (saved && colors.includes(saved as SlimeColor)) return saved as SlimeColor;
    return colors[Math.floor(Math.random() * colors.length)];
  });

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Combo decay
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setCombo((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const addFlyingScore = useCallback((points: number, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFlyingScores((prev) => [...prev, { id, score: points, x, y }]);
    setTimeout(() => {
      setFlyingScores((prev) => prev.filter((f) => f.id !== id));
    }, 600);
  }, []);

  const handleTap = useCallback(() => {
    if (gameState !== "playing") return;

    const comboMultiplier = Math.min(5, 1 + Math.floor(combo / 5) * 0.5);
    const baseScore = 1;
    const points = Math.floor(baseScore * comboMultiplier);

    setScore((prev) => prev + points);
    setCombo((prev) => prev + 1);

    // Random position for flying score
    const x = 30 + Math.random() * 40;
    const y = 20 + Math.random() * 30;
    addFlyingScore(points, x, y);
  }, [gameState, combo, addFlyingScore]);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(15);
    setCombo(0);
    setGameState("playing");
  }, []);

  const claimReward = useCallback(() => {
    const goldReward = Math.floor(score / 10) * 5;
    const expReward = Math.floor(score / 5);

    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("tap_tap_best", String(score));
    }

    if (goldReward > 0 || expReward > 0) {
      setState((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          gold: prev.currency.gold + goldReward,
        },
      }));
    }

    nav("/arcade");
  }, [score, bestScore, setState, nav]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #87CEEB 0%, #6BB3D9 50%, #5BA3C9 100%)",
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
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          borderBottom: "2px solid rgba(33,150,243,0.2)",
        }}
      >
        <IconButton onClick={() => nav("/arcade")} sx={{ color: "#1976D2" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#1976D2" }}>
          👆 탭탭슬라임
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Game Area */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        {/* Stats */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Card
            sx={{
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", color: "#666" }}>점수</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#1976D2" }}>
              {score}
            </Typography>
          </Card>
          <Card
            sx={{
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: gameState === "playing" && timeLeft <= 5 ? "#FFCDD2" : "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              animation: gameState === "playing" && timeLeft <= 5 ? `${shake} 0.5s ease-in-out infinite` : "none",
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", color: "#666" }}>시간</Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1.5rem",
                color: timeLeft <= 5 ? "#D32F2F" : "#F57C00",
              }}
            >
              {timeLeft}초
            </Typography>
          </Card>
          <Card
            sx={{
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: combo > 0 ? "#E8F5E9" : "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", color: "#666" }}>콤보</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#2E7D32" }}>
              x{Math.min(5, 1 + Math.floor(combo / 5) * 0.5).toFixed(1)}
            </Typography>
          </Card>
        </Box>

        {/* Tap Area */}
        <Card
          sx={{
            position: "relative",
            borderRadius: 5,
            p: 4,
            bgcolor: "rgba(255,255,255,0.9)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            minHeight: 350,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Flying Scores */}
          {flyingScores.map((f) => (
            <Box
              key={f.id}
              sx={{
                position: "absolute",
                left: `${f.x}%`,
                top: `${f.y}%`,
                fontSize: "1.5rem",
                fontWeight: 900,
                color: f.score > 1 ? "#FFD700" : "#1976D2",
                pointerEvents: "none",
                animation: `${pop} 0.6s ease-out forwards`,
                zIndex: 10,
              }}
            >
              +{f.score}
            </Box>
          ))}

          {gameState === "ready" && (
            <>
              <SlimeAvatar color={slimeColor} level={1} size={150} isHappy />
              <Typography
                sx={{
                  mt: 3,
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  color: "#1976D2",
                  textAlign: "center",
                }}
              >
                15초 동안 최대한 많이 탭하세요!
              </Typography>
              <Typography sx={{ mt: 1, color: "#666", textAlign: "center", fontSize: "0.85rem" }}>
                연속 탭 시 콤보 보너스!
              </Typography>
              <Button
                onClick={startGame}
                sx={{
                  mt: 3,
                  px: 6,
                  py: 1.5,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  boxShadow: "0 4px 15px rgba(41,182,246,0.4)",
                }}
              >
                게임 시작!
              </Button>
            </>
          )}

          {gameState === "playing" && (
            <Box
              onClick={handleTap}
              sx={{
                cursor: "pointer",
                userSelect: "none",
                transition: "transform 0.05s",
                "&:active": { transform: "scale(0.9)" },
              }}
            >
              <SlimeAvatar color={slimeColor} level={1} size={200} isHappy={combo > 5} onTap={handleTap} />
              <Typography
                sx={{
                  mt: 2,
                  fontWeight: 800,
                  color: "#1976D2",
                  textAlign: "center",
                  fontSize: "1rem",
                  animation: combo > 10 ? `${shake} 0.2s ease-in-out infinite` : "none",
                }}
              >
                {combo > 20 ? "🔥 미쳤다!!" : combo > 10 ? "⚡ 대단해요!" : combo > 5 ? "✨ 좋아요!" : "탭탭!"}
              </Typography>
            </Box>
          )}

          {gameState === "finished" && (
            <>
              <Typography sx={{ fontSize: "3rem", mb: 2 }}>
                {score > bestScore ? "🎉" : "👏"}
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: "#1976D2" }}>
                게임 종료!
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: "2.5rem", color: "#F57C00", my: 2 }}>
                {score}점
              </Typography>
              {score > bestScore && (
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "#D32F2F",
                    mb: 2,
                  }}
                >
                  🏆 새로운 기록!
                </Typography>
              )}
              <Typography sx={{ color: "#666", mb: 1 }}>최고 기록: {Math.max(score, bestScore)}점</Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>획득 골드</Typography>
                  <Typography sx={{ fontWeight: 900, color: "#F57F17" }}>
                    🪙 +{Math.floor(score / 10) * 5}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>획득 경험치</Typography>
                  <Typography sx={{ fontWeight: 900, color: "#2E7D32" }}>
                    ⭐ +{Math.floor(score / 5)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
                <Button
                  onClick={startGame}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 3,
                    bgcolor: "#E0E0E0",
                    color: "#424242",
                    fontWeight: 800,
                  }}
                >
                  다시하기
                </Button>
                <Button
                  onClick={claimReward}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
                    color: "white",
                    fontWeight: 800,
                    boxShadow: "0 4px 15px rgba(67,160,71,0.4)",
                  }}
                >
                  보상 받기
                </Button>
              </Box>
            </>
          )}
        </Card>

        {/* Best Score */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
            🏆 최고 기록: {bestScore}점
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
