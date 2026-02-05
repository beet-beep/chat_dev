import { Box, Button, Card, IconButton, LinearProgress, Typography, keyframes, Badge, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import type { FullGameState } from "../state/gameState";
import { tapSlime, feedSlime, saveGameState, checkAchievements } from "../state/gameState";
import { PixelSlime, type SlimeColor } from "../ui/PixelSlime";

const pop = keyframes`
  0% { transform: scale(0) translateY(0); opacity: 1; }
  100% { transform: scale(1.5) translateY(-60px); opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

interface FlyingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface NewHomePageProps {
  state: FullGameState;
  setState: (updater: (prev: FullGameState) => FullGameState) => void;
}

export function NewHomePage({ state, setState }: NewHomePageProps) {
  const nav = useNavigate();

  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [isHappy, setIsHappy] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [combo, setCombo] = useState(0);

  // 배고픔/행복도 감소 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        slime: {
          ...prev.slime,
          hunger: Math.max(0, prev.slime.hunger - 0.5),
          happiness: Math.max(0, prev.slime.happiness - 0.3),
        },
      }));
    }, 30000);
    return () => clearInterval(timer);
  }, [setState]);

  // 자동 저장
  useEffect(() => {
    const timer = setInterval(() => {
      saveGameState(state);
    }, 30000);
    return () => clearInterval(timer);
  }, [state]);

  const addFlyingEmoji = useCallback((emoji: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFlyingEmojis((prev) => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 800);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTapTime;

    // 콤보 계산
    if (timeDiff < 500) {
      setCombo((c) => Math.min(10, c + 1));
    } else if (timeDiff > 2000) {
      setCombo(0);
    }
    setLastTapTime(now);

    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 300);

    // 상태 업데이트
    setState((prev) => {
      const newState = tapSlime(prev);
      const checkedState = checkAchievements(newState);

      // 레벨업 체크
      if (checkedState.slime.level > prev.slime.level) {
        addFlyingEmoji("⭐", 50, 30);
        addFlyingEmoji("🎉", 70, 40);
      }

      return checkedState;
    });

    // 이모지 이펙트
    const emojis = ["💕", "✨", "💖", "🌟", "💗", combo > 5 ? "🔥" : "😊"];
    addFlyingEmoji(emojis[Math.floor(Math.random() * emojis.length)], 35 + Math.random() * 30, 20 + Math.random() * 20);

    // 콤보 보너스 이펙트
    if (combo > 0 && combo % 5 === 0) {
      addFlyingEmoji(`x${combo}!`, 50, 10);
    }
  }, [setState, addFlyingEmoji, lastTapTime, combo]);

  const handleFeed = useCallback(() => {
    if (state.currency.gold < 10) return;
    setState((prev) => feedSlime(prev, 10));
    addFlyingEmoji("🍰", 50, 40);
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 1000);
  }, [state.currency.gold, setState, addFlyingEmoji]);

  // 미완료 퀘스트 수
  const pendingQuests = useMemo(() => {
    return state.quests.filter((q) => q.completed && !q.claimed).length;
  }, [state.quests]);

  // 슬라임 표정
  const expression = useMemo(() => {
    if (isHappy || state.slime.happiness > 80) return "happy";
    if (state.slime.hunger < 20 || state.slime.happiness < 20) return "sad";
    return "normal";
  }, [isHappy, state.slime.happiness, state.slime.hunger]);

  const expPercent = (state.slime.exp / state.slime.maxExp) * 100;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)",
        pb: 12,
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
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
          borderBottom: "2px solid rgba(76,175,80,0.2)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#2E7D32" }}>
            🌱 {state.slime.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <CurrencyBadge icon="🪙" value={state.currency.gold} color="#FFF8E1" borderColor="#FFD54F" textColor="#F57F17" />
          <CurrencyBadge icon="💎" value={state.currency.gems} color="#E3F2FD" borderColor="#64B5F6" textColor="#1565C0" />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton onClick={() => nav("/notifications")} size="small">
            <Badge badgeContent={pendingQuests} color="error">
              <NotificationsIcon sx={{ color: "#558B2F" }} />
            </Badge>
          </IconButton>
          <IconButton onClick={() => nav("/settings")} size="small">
            <SettingsIcon sx={{ color: "#558B2F" }} />
          </IconButton>
        </Box>
      </Box>

      {/* Slime Area */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 2,
          pb: 1,
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
              fontWeight: 900,
            }}
          >
            {e.emoji}
          </Box>
        ))}

        {/* Combo Indicator */}
        {combo > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 20,
              bgcolor: combo > 5 ? "#FF5722" : "#4CAF50",
              color: "white",
              px: 2,
              py: 0.5,
              borderRadius: 3,
              fontWeight: 900,
              fontSize: "0.9rem",
              animation: `${pulse} 0.3s ease-in-out`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            🔥 x{combo} COMBO!
          </Box>
        )}

        {/* Pixel Slime */}
        <Box
          onClick={handleTap}
          sx={{
            cursor: "pointer",
            transition: "transform 0.1s",
            "&:active": { transform: "scale(0.95)" },
          }}
        >
          <PixelSlime
            color={state.slime.color as SlimeColor}
            size={240}
            expression={expression}
            equipped={state.slime.equipped}
            level={state.slime.level}
            animated
            onClick={handleTap}
          />
        </Box>

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
          탭해서 쓰다듬기! (총 {state.statistics.totalTaps.toLocaleString()}회)
        </Typography>
      </Box>

      {/* Stats Card */}
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
                레벨 {state.slime.level}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#689F38", fontSize: "0.85rem" }}>
                {state.slime.exp} / {state.slime.maxExp} EXP
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
            <StatBar
              label="배부름"
              value={state.slime.hunger}
              icon="🍰"
              color="#FF7043"
              bgColor="#FFCCBC"
            />
            <StatBar
              label="행복도"
              value={state.slime.happiness}
              icon="💖"
              color="#EC407A"
              bgColor="#F8BBD9"
            />
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "center" }}>
            <Chip
              label={`✨ 매력 ${state.slime.stats.charm}`}
              size="small"
              sx={{ bgcolor: "#FCE4EC", fontWeight: 700 }}
            />
            <Chip
              label={`🍀 행운 ${state.slime.stats.luck}`}
              size="small"
              sx={{ bgcolor: "#E8F5E9", fontWeight: 700 }}
            />
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
              background: state.currency.gold >= 10
                ? "linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)"
                : "#E0E0E0",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: state.currency.gold >= 10 ? "0 4px 15px rgba(255,152,0,0.4)" : "none",
              "&:disabled": { color: "#9E9E9E" },
            }}
          >
            🍰 밥주기 (10G)
          </Button>
          <Button
            onClick={() => nav("/dress")}
            sx={{
              py: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #BA68C8 0%, #9C27B0 100%)",
              color: "white",
              fontWeight: 900,
              fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(156,39,176,0.4)",
            }}
          >
            👗 코디하기
          </Button>
        </Box>
      </Box>

      {/* Quick Menu */}
      <Box sx={{ px: 2.5 }}>
        <Typography sx={{ fontWeight: 900, color: "#2E7D32", mb: 1.5, fontSize: "1rem" }}>
          🎮 메뉴
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
          {[
            { icon: "🎁", label: "가챠", color: "#7C4DFF", path: "/gacha" },
            { icon: "🏪", label: "상점", color: "#4CAF50", path: "/shop" },
            { icon: "📋", label: "퀘스트", color: "#FF9800", path: "/quests" },
            { icon: "🏠", label: "광장", color: "#2196F3", path: "/plaza" },
            { icon: "🎮", label: "오락실", color: "#E91E63", path: "/arcade" },
            { icon: "📦", label: "인벤", color: "#795548", path: "/inventory" },
            { icon: "🏆", label: "업적", color: "#FFC107", path: "/achievements" },
            { icon: "👥", label: "친구", color: "#00BCD4", path: "/friends" },
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
                boxShadow: `0 4px 12px ${item.color}30`,
                "&:hover": { bgcolor: `${item.color}10` },
              }}
            >
              <Box sx={{ fontSize: "1.5rem", mb: 0.5 }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#424242" }}>
                {item.label}
              </Typography>
            </Button>
          ))}
        </Box>
      </Box>

      {/* Daily Bonus */}
      <Box sx={{ px: 2.5, mt: 2 }}>
        <Card
          onClick={() => nav("/gacha")}
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
                🎁 오늘의 무료 가챠!
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

// 재화 뱃지 컴포넌트
function CurrencyBadge({ icon, value, color, borderColor, textColor }: {
  icon: string;
  value: number;
  color: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <Box
      sx={{
        px: 1.2,
        py: 0.4,
        borderRadius: 3,
        bgcolor: color,
        border: `2px solid ${borderColor}`,
        fontWeight: 900,
        fontSize: "0.8rem",
        color: textColor,
        display: "flex",
        alignItems: "center",
        gap: 0.3,
      }}
    >
      {icon} {value.toLocaleString()}
    </Box>
  );
}

// 스탯 바 컴포넌트
function StatBar({ label, value, icon, color, bgColor }: {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Typography sx={{ fontSize: "1rem" }}>{icon}</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: color }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", color: "#999", ml: "auto" }}>
          {Math.round(value)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 10,
          borderRadius: 2,
          bgcolor: bgColor,
          "& .MuiLinearProgress-bar": {
            borderRadius: 2,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
}
