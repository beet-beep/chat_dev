import { Box, Button, Card, IconButton, Typography, Avatar, Chip, Tab, Tabs, TextField, Badge } from "@mui/material";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ShareIcon from "@mui/icons-material/Share";
import AddIcon from "@mui/icons-material/Add";
import type { FullGameState } from "../state/gameState";
import { PixelSlime, type SlimeColor } from "../ui/PixelSlime";

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    level: number;
    slimeColor: SlimeColor;
  };
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
}

interface PlazaPageProps {
  state: FullGameState;
  setState: (updater: (prev: FullGameState) => FullGameState) => void;
}

export function PlazaPage({ state }: PlazaPageProps) {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // 샘플 포스트 데이터
  const [posts] = useState<Post[]>([
    {
      id: "1",
      author: { id: "user1", name: "슬라임마스터", level: 25, slimeColor: "pink" },
      content: "드디어 레전더리 왕관을 뽑았어요! 🎉👑 행운이 따르네요~",
      likes: 128,
      comments: 24,
      createdAt: "2시간 전",
      isLiked: false,
    },
    {
      id: "2",
      author: { id: "user2", name: "귀요미슬라임", level: 18, slimeColor: "blue" },
      content: "오늘의 코디! 어때요? 파란색 슬라임에 눈꽃 이펙트 조합 💙❄️",
      likes: 89,
      comments: 15,
      createdAt: "3시간 전",
      isLiked: true,
    },
    {
      id: "3",
      author: { id: "user3", name: "초보슬라이머", level: 5, slimeColor: "green" },
      content: "이 게임 처음인데 너무 재밌어요! 추천 아이템 있나요?",
      likes: 45,
      comments: 32,
      createdAt: "5시간 전",
      isLiked: false,
    },
    {
      id: "4",
      author: { id: "user4", name: "가챠의신", level: 42, slimeColor: "purple" },
      content: "10연차 3번 만에 미씩 유니콘 펫 GET! 확률 어떻게 뚫은거지 ㅋㅋ",
      likes: 256,
      comments: 48,
      createdAt: "6시간 전",
      isLiked: false,
    },
    {
      id: "5",
      author: { id: "user5", name: "디자이너님", level: 30, slimeColor: "mint" },
      content: "민트색 슬라임 + 천사 세트 조합 추천드려요! 완전 힐링~",
      likes: 167,
      comments: 28,
      createdAt: "8시간 전",
      isLiked: true,
    },
  ]);

  // 실시간 접속자 (샘플)
  const onlineUsers = useMemo(() => [
    { id: "1", name: "슬라임마스터", level: 25, color: "pink" as SlimeColor },
    { id: "2", name: "귀요미슬라임", level: 18, color: "blue" as SlimeColor },
    { id: "3", name: "초보슬라이머", level: 5, color: "green" as SlimeColor },
    { id: "4", name: "가챠의신", level: 42, color: "purple" as SlimeColor },
    { id: "5", name: "디자이너님", level: 30, color: "mint" as SlimeColor },
  ], []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)",
        pb: 12,
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
        <IconButton onClick={() => nav(-1)} sx={{ color: "#1976D2" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#1976D2" }}>
          🏠 광장
        </Typography>
        <Badge badgeContent={onlineUsers.length} color="success">
          <Chip
            label="접속중"
            size="small"
            sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}
          />
        </Badge>
      </Box>

      {/* Online Users */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: "white",
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1976D2", mb: 1 }}>
          👥 접속중인 슬라이머 ({onlineUsers.length})
        </Typography>
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
          {onlineUsers.map((user) => (
            <Box
              key={user.id}
              sx={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Box sx={{ position: "relative" }}>
                <PixelSlime
                  color={user.color}
                  size={50}
                  expression="happy"
                  animated={false}
                  showLevel={false}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "#4CAF50",
                    border: "2px solid white",
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#424242", mt: 0.5 }}>
                {user.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "white" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": { fontWeight: 800, fontSize: "0.9rem" },
            "& .Mui-selected": { color: "#1976D2" },
            "& .MuiTabs-indicator": { bgcolor: "#1976D2" },
          }}
          centered
        >
          <Tab label="🔥 인기" />
          <Tab label="⏰ 최신" />
          <Tab label="👗 코디" />
        </Tabs>
      </Box>

      {/* Posts */}
      <Box sx={{ px: 2, pt: 2 }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </Box>

      {/* Floating Action Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
        }}
      >
        <Button
          sx={{
            width: 56,
            height: 56,
            minWidth: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
            boxShadow: "0 4px 20px rgba(33,150,243,0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
            },
          }}
        >
          <AddIcon sx={{ color: "white", fontSize: 28 }} />
        </Button>
      </Box>
    </Box>
  );
}

// 포스트 카드 컴포넌트
function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <Card
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 4,
        bgcolor: "white",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <PixelSlime
          color={post.author.slimeColor}
          size={45}
          expression="happy"
          animated={false}
          showLevel={false}
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#212121" }}>
              {post.author.name}
            </Typography>
            <Chip
              label={`Lv.${post.author.level}`}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 800,
                bgcolor: "#FFF8E1",
                color: "#F57C00",
              }}
            />
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: "#9E9E9E" }}>
            {post.createdAt}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Typography sx={{ fontSize: "0.95rem", color: "#424242", lineHeight: 1.6, mb: 2 }}>
        {post.content}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 2, borderTop: "1px solid #F5F5F5", pt: 1.5 }}>
        <Button
          size="small"
          onClick={handleLike}
          sx={{
            color: liked ? "#E91E63" : "#9E9E9E",
            fontWeight: 700,
            "&:hover": { bgcolor: "#FCE4EC" },
          }}
          startIcon={<FavoriteIcon sx={{ fontSize: 18 }} />}
        >
          {likes}
        </Button>
        <Button
          size="small"
          sx={{
            color: "#9E9E9E",
            fontWeight: 700,
            "&:hover": { bgcolor: "#E3F2FD" },
          }}
          startIcon={<ChatBubbleIcon sx={{ fontSize: 18 }} />}
        >
          {post.comments}
        </Button>
        <Button
          size="small"
          sx={{
            color: "#9E9E9E",
            fontWeight: 700,
            "&:hover": { bgcolor: "#F3E5F5" },
          }}
          startIcon={<ShareIcon sx={{ fontSize: 18 }} />}
        >
          공유
        </Button>
      </Box>
    </Card>
  );
}
