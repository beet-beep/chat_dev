import { Box, Button, Card, IconButton, LinearProgress, Typography, keyframes } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import type { Me } from "../../api/types";
import type { GameState } from "../state";
import { SlimeAvatar, type SlimeColor } from "../ui/SlimeAvatar";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StoreIcon from "@mui/icons-material/Store";
import FavoriteIcon from "@mui/icons-material/Favorite";

const pop = keyframes`
  0% { transform: scale(0) translateY(0); opacity: 1; }
  100% { transform: scale(1.5) translateY(-60px); opacity: 0; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

interface FlyingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export function HomePage({
  me,
  state,
  onEquip,
}: {
  me: Me;
  state: GameState;
  onEquip: (slot: "hat" | "face" | "body", itemId: string | null) => void;
}) {
  const nav = useNavigate();

  // Slime state
  const [slimeColor] = useState<SlimeColor>(() => {
    const colors: SlimeColor[] = ["pink", "blue", "green", "yellow", "purple", "orange", "mint"];
    const saved = localStorage.getItem("slime_color");
    if (saved && colors.includes(saved as SlimeColor)) return saved as SlimeColor;
    const random = colors[Math.floor(Math.random() * colors.length)];
    localStorage.setItem("slime_color", random);
    return random;
  });

  const [level, setLevel] = useState(() => Number(localStorage.getItem("slime_level") || 1));
  const [exp, setExp] = useState(() => Number(localStorage.getItem("slime_exp") || 0));
  const [hunger, setHunger] = useState(() => Number(localStorage.getItem("slime_hunger") || 100));
  const [happiness, setHappiness] = useState(() => Number(localStorage.getItem("slime_happiness") || 100));
  const [isHappy, setIsHappy] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const maxExp = level * 100;
  const expPercent = (exp / maxExp) * 100;

  // Save state
  useEffect(() => {
    localStorage.setItem("slime_level", String(level));
    localStorage.setItem("slime_exp", String(exp));
    localStorage.setItem("slime_hunger", String(hunger));
    localStorage.setItem("slime_happiness", String(happiness));
  }, [level, exp, hunger, happiness]);

  // Decrease hunger/happiness over time
  useEffect(() => {
    const timer = setInterval(() => {
      setHunger((h) => Math.max(0, h - 1));
      setHappiness((h) => Math.max(0, h - 0.5));
    }, 30000); // Every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const addFlyingEmoji = useCallback((emoji: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFlyingEmojis((prev) => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 800);
  }, []);

  const handleTap = useCallback(() => {
    setTapCount((c) => c + 1);
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 500);

    // Add exp
    const expGain = 1 + Math.floor(Math.random() * 3);
    setExp((prev) => {
      const newExp = prev + expGain;
      if (newExp >= maxExp) {
        // Level up!
        setLevel((l) => l + 1);
        addFlyingEmoji("⭐", 50, 30);
        addFlyingEmoji("🎉", 70, 40);
        return newExp - maxExp;
      }
      return newExp;
    });

    // Random emoji
    const emojis = ["💕", "✨", "💖", "🌟", "💗", "😊"];
    addFlyingEmoji(emojis[Math.floor(Math.random() * emojis.length)], 40 + Math.random() * 20, 30 + Math.random() * 20);

    // Increase happiness
    setHappiness((h) => Math.min(100, h + 2));
  }, [maxExp, addFlyingEmoji]);

  const handleFeed = useCallback(() => {
    if (state.currency.gold < 10) return;
    setHunger((h) => Math.min(100, h + 30));
    setExp((prev) => {
      const newExp = prev + 10;
      if (newExp >= maxExp) {
        setLevel((l) => l + 1);
        return newExp - maxExp;
      }
      return newExp;
    });
    addFlyingEmoji("🍰", 50, 40);
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 1000);
  }, [state.currency.gold, maxExp, addFlyingEmoji]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)",
        pb: 10,
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
          borderBottom: "2px solid rgba(76,175,80,0.3)",
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#2E7D32" }}>
          🌱 {me.profile?.display_name || me.first_name || "주디"}의 슬라임
        </Typography>
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
              display: "flex",
              alignItems: "center",
              gap: 0.5,
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
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            💎 {state.currency.gems.toLocaleString()}
          </Box>
        </Box>
      </Box>

      {/* Slime Area */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 3,
          pb: 2,
        }}
      >
        {/* Flying Emojis */}
        {flyingEmojis.map((e) => (
          <Box
            key={e.id}
            sx={{
              position: "absolute",
              left: `${e.x}%`,
              top: `${e.y}%`,
              fontSize: "2rem",
              pointerEvents: "none",
              animation: `${pop} 0.8s ease-out forwards`,
              zIndex: 10,
            }}
          >
            {e.emoji}
          </Box>
        ))}

        {/* Sparkles */}
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 20}%`,
              fontSize: "1.5rem",
              animation: `${sparkle} ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0,
            }}
          >
            ✨
          </Box>
        ))}

        <SlimeAvatar
          color={slimeColor}
          level={level}
          exp={exp}
          maxExp={maxExp}
          size={220}
          isHappy={isHappy || happiness > 80}
          onTap={handleTap}
        />

        {/* Tap hint */}
        <Typography
          sx={{
            mt: 1,
            color: "#558B2F",
            fontWeight: 700,
            fontSize: "0.85rem",
            opacity: 0.8,
          }}
        >
          탭해서 쓰다듬기! (탭 {tapCount}회)
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Card
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.95)",
            boxShadow: "0 4px 20px rgba(76,175,80,0.15)",
            border: "2px solid rgba(76,175,80,0.2)",
          }}
        >
          {/* Level & EXP */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontWeight: 900, color: "#2E7D32" }}>
                레벨 {level}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#689F38", fontSize: "0.85rem" }}>
                {exp} / {maxExp} EXP
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={expPercent}
              sx={{
                height: 12,
                borderRadius: 2,
                bgcolor: "#E8F5E9",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #66BB6A 0%, #43A047 100%)",
                },
              }}
            />
          </Box>

          {/* Hunger & Happiness */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <RestaurantIcon sx={{ fontSize: 18, color: "#FF7043" }} />
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#BF360C" }}>
                  배부름
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={hunger}
                sx={{
                  height: 10,
                  borderRadius: 2,
                  bgcolor: "#FFCCBC",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    bgcolor: "#FF7043",
                  },
                }}
              />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <FavoriteIcon sx={{ fontSize: 18, color: "#EC407A" }} />
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#AD1457" }}>
                  행복도
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={happiness}
                sx={{
                  height: 10,
                  borderRadius: 2,
                  bgcolor: "#F8BBD9",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    bgcolor: "#EC407A",
                  },
                }}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <Button
            onClick={handleFeed}
            disabled={state.currency.gold < 10}
            sx={{
              py: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(255,152,0,0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)",
              },
              "&:disabled": {
                background: "#E0E0E0",
                color: "#9E9E9E",
              },
            }}
          >
            🍰 밥주기 (10G)
          </Button>
          <Button
            onClick={() => nav("/inventory")}
            sx={{
              py: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%)",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(156,39,176,0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)",
              },
            }}
          >
            <CheckroomIcon sx={{ mr: 0.5 }} /> 꾸미기
          </Button>
        </Box>
      </Box>

      {/* Quick Menu */}
      <Box sx={{ px: 2.5 }}>
        <Typography sx={{ fontWeight: 900, color: "#2E7D32", mb: 1.5, fontSize: "1rem" }}>
          🎮 즐길거리
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
          {[
            { icon: <SportsEsportsIcon />, label: "오락실", color: "#4FC3F7", path: "/arcade" },
            { icon: <StoreIcon />, label: "상점", color: "#81C784", path: "/shop" },
            { icon: <EmojiEventsIcon />, label: "미션", color: "#FFD54F", path: "/missions" },
            { icon: "🎁", label: "뽑기", color: "#F48FB1", path: "/box" },
          ].map((item) => (
            <Button
              key={item.label}
              onClick={() => nav(item.path)}
              sx={{
                flexDirection: "column",
                py: 1.5,
                borderRadius: 3,
                bgcolor: "white",
                border: `2px solid ${item.color}`,
                boxShadow: `0 4px 12px ${item.color}40`,
                "&:hover": {
                  bgcolor: `${item.color}15`,
                },
              }}
            >
              <Box sx={{ fontSize: "1.5rem", color: item.color, mb: 0.5 }}>
                {typeof item.icon === "string" ? item.icon : item.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#424242" }}>
                {item.label}
              </Typography>
            </Button>
          ))}
        </Box>
      </Box>

      {/* Daily Bonus Card */}
      <Box sx={{ px: 2.5, mt: 2 }}>
        <Card
          onClick={() => nav("/box")}
          sx={{
            p: 2,
            borderRadius: 4,
            background: "linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ color: "white", fontWeight: 900, fontSize: "1.1rem" }}>
                🎁 오늘의 무료 뽑기!
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "0.85rem" }}>
                매일 무료로 아이템을 뽑아보세요
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 50,
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              🎰
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
