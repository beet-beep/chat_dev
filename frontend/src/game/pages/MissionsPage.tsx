import { Box, Card, Typography, IconButton, Button, LinearProgress, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { GameState } from "../state";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "daily" | "weekly" | "achievement";
  progress: number;
  goal: number;
  rewards: { gold?: number; gems?: number; exp?: number };
  claimed: boolean;
}

export function MissionsPage({
  state,
  setState,
}: {
  state: GameState;
  setState: (updater: (prev: GameState) => GameState) => void;
}) {
  const nav = useNavigate();

  // Load missions state from localStorage
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem("game_missions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default missions
    return [
      {
        id: "daily_login",
        title: "매일 출석하기",
        description: "게임에 접속하세요",
        icon: "📅",
        type: "daily",
        progress: 1,
        goal: 1,
        rewards: { gold: 50 },
        claimed: false,
      },
      {
        id: "daily_tap",
        title: "슬라임 쓰다듬기",
        description: "슬라임을 10번 탭하세요",
        icon: "👆",
        type: "daily",
        progress: 0,
        goal: 10,
        rewards: { gold: 30, exp: 20 },
        claimed: false,
      },
      {
        id: "daily_feed",
        title: "슬라임 밥주기",
        description: "슬라임에게 밥을 1번 주세요",
        icon: "🍰",
        type: "daily",
        progress: 0,
        goal: 1,
        rewards: { gold: 20 },
        claimed: false,
      },
      {
        id: "daily_game",
        title: "미니게임 플레이",
        description: "미니게임을 1번 플레이하세요",
        icon: "🎮",
        type: "daily",
        progress: 0,
        goal: 1,
        rewards: { gold: 40, exp: 30 },
        claimed: false,
      },
      {
        id: "weekly_tap100",
        title: "열정 탭퍼",
        description: "슬라임을 100번 탭하세요",
        icon: "⭐",
        type: "weekly",
        progress: 0,
        goal: 100,
        rewards: { gold: 200, gems: 5 },
        claimed: false,
      },
      {
        id: "weekly_level",
        title: "레벨업 마스터",
        description: "슬라임 레벨을 3번 올리세요",
        icon: "📈",
        type: "weekly",
        progress: 0,
        goal: 3,
        rewards: { gold: 300, gems: 10 },
        claimed: false,
      },
      {
        id: "achieve_first",
        title: "첫 발자국",
        description: "게임을 처음 시작하세요",
        icon: "🎉",
        type: "achievement",
        progress: 1,
        goal: 1,
        rewards: { gold: 100, gems: 20 },
        claimed: false,
      },
      {
        id: "achieve_collector",
        title: "아이템 수집가",
        description: "아이템을 5개 모으세요",
        icon: "🎁",
        type: "achievement",
        progress: Object.keys(state.owned || {}).length,
        goal: 5,
        rewards: { gold: 500, gems: 50 },
        claimed: false,
      },
    ];
  });

  const claimMission = useCallback(
    (missionId: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission || mission.claimed || mission.progress < mission.goal) return;

      // Update state with rewards
      setState((prev) => ({
        ...prev,
        currency: {
          ...prev.currency,
          gold: prev.currency.gold + (mission.rewards.gold || 0),
          gems: prev.currency.gems + (mission.rewards.gems || 0),
        },
      }));

      // Mark as claimed
      const newMissions = missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
      setMissions(newMissions);
      localStorage.setItem("game_missions", JSON.stringify(newMissions));
    },
    [missions, setState]
  );

  const dailyMissions = missions.filter((m) => m.type === "daily");
  const weeklyMissions = missions.filter((m) => m.type === "weekly");
  const achievements = missions.filter((m) => m.type === "achievement");

  const renderMission = (mission: Mission) => {
    const isCompleted = mission.progress >= mission.goal;
    const isClaimed = mission.claimed;
    const progressPercent = Math.min(100, (mission.progress / mission.goal) * 100);

    return (
      <Card
        key={mission.id}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: isClaimed ? "rgba(76,175,80,0.1)" : "white",
          border: isCompleted && !isClaimed ? "2px solid #4CAF50" : "1px solid #E0E0E0",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          {/* Icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: isClaimed ? "#E8F5E9" : "#F5F5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {isClaimed ? <CheckCircleIcon sx={{ color: "#4CAF50", fontSize: 28 }} /> : mission.icon}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: isClaimed ? "#9E9E9E" : "#212121",
                textDecoration: isClaimed ? "line-through" : "none",
              }}
            >
              {mission.title}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#757575", mb: 1 }}>
              {mission.description}
            </Typography>

            {/* Progress */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: "#E0E0E0",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 1,
                    bgcolor: isCompleted ? "#4CAF50" : "#FFB74D",
                  },
                }}
              />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#757575", minWidth: 50 }}>
                {mission.progress}/{mission.goal}
              </Typography>
            </Box>

            {/* Rewards */}
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {mission.rewards.gold && (
                <Chip
                  label={`🪙 ${mission.rewards.gold}`}
                  size="small"
                  sx={{ bgcolor: "#FFF8E1", fontWeight: 700, fontSize: "0.7rem" }}
                />
              )}
              {mission.rewards.gems && (
                <Chip
                  label={`💎 ${mission.rewards.gems}`}
                  size="small"
                  sx={{ bgcolor: "#E3F2FD", fontWeight: 700, fontSize: "0.7rem" }}
                />
              )}
              {mission.rewards.exp && (
                <Chip
                  label={`⭐ ${mission.rewards.exp}`}
                  size="small"
                  sx={{ bgcolor: "#E8F5E9", fontWeight: 700, fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Box>

          {/* Claim Button */}
          {isCompleted && !isClaimed && (
            <Button
              onClick={() => claimMission(mission.id)}
              size="small"
              sx={{
                minWidth: 60,
                py: 0.8,
                borderRadius: 2,
                background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
                color: "white",
                fontWeight: 800,
                fontSize: "0.75rem",
              }}
            >
              받기
            </Button>
          )}
        </Box>
      </Card>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF8E1 0%, #FFECB3 50%, #FFE082 100%)",
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
          borderBottom: "2px solid rgba(255,193,7,0.3)",
        }}
      >
        <IconButton onClick={() => nav("/home")} sx={{ color: "#F57C00" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <EmojiEventsIcon sx={{ color: "#F57C00", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#E65100" }}>미션</Typography>
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

      {/* Daily Missions */}
      <Box sx={{ px: 2.5, pt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#E65100" }}>📅 일일 미션</Typography>
          <Chip
            label={`${dailyMissions.filter((m) => m.claimed).length}/${dailyMissions.length}`}
            size="small"
            sx={{ bgcolor: "#FFE082", fontWeight: 700 }}
          />
        </Box>
        {dailyMissions.map(renderMission)}
      </Box>

      {/* Weekly Missions */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#E65100" }}>📆 주간 미션</Typography>
          <Chip
            label={`${weeklyMissions.filter((m) => m.claimed).length}/${weeklyMissions.length}`}
            size="small"
            sx={{ bgcolor: "#FFE082", fontWeight: 700 }}
          />
        </Box>
        {weeklyMissions.map(renderMission)}
      </Box>

      {/* Achievements */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#E65100" }}>🏆 업적</Typography>
          <Chip
            label={`${achievements.filter((m) => m.claimed).length}/${achievements.length}`}
            size="small"
            sx={{ bgcolor: "#FFE082", fontWeight: 700 }}
          />
        </Box>
        {achievements.map(renderMission)}
      </Box>
    </Box>
  );
}
