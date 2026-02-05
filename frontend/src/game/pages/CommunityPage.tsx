import { Box, Button, Card, CardContent, Chip, Divider, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { safeJsonParse } from "../utils";
import { GameTopBar } from "../ui/GameTopBar";

type Post = { id: string; author: string; body: string; created_at: string; likes?: number; category?: "자랑" | "질문" | "잡담" };

function key() {
  return "joody_game_community_v1";
}

function load(): Post[] {
  const parsed = safeJsonParse<Post[]>(localStorage.getItem(key()));
  return Array.isArray(parsed) ? parsed : [];
}

function save(posts: Post[]) {
  localStorage.setItem(key(), JSON.stringify(posts.slice(-50)));
}

export function CommunityPage({ author }: { author: string }) {
  const [posts, setPosts] = useState<Post[]>(() => load());
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Post["category"]>("잡담");
  const canPost = useMemo(() => body.trim().length >= 2, [body]);

  return (
    <Box sx={{ pb: 2 }}>
      <GameTopBar title="커뮤니티" />
      <Box sx={{ px: 2.5, pt: 0.5 }}>

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: "grid", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {(["자랑", "질문", "잡담"] as const).map((c) => (
              <Chip
                key={c}
                label={c}
                color={category === c ? "primary" : "default"}
                variant={category === c ? "filled" : "outlined"}
                onClick={() => setCategory(c)}
              />
            ))}
          </Box>
          <TextField
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="슬라임 자랑, 아이템 자랑, 질문을 남겨보세요!"
            multiline
            minRows={3}
            fullWidth
          />
          <Button
            variant="contained"
            disabled={!canPost}
            sx={{ fontWeight: 900 }}
            onClick={() => {
              const p: Post = {
                id: String(Date.now()),
                author,
                body: body.trim(),
                created_at: new Date().toISOString(),
                likes: 0,
                category,
              };
              const next = [...posts, p];
              setPosts(next);
              save(next);
              setBody("");
            }}
          >
            글 올리기
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>피드</Typography>
          <Divider sx={{ mb: 1.25 }} />
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {posts.slice().reverse().map((p) => (
              <Box key={p.id} sx={{ py: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 900 }}>
                    {p.category ? `[${p.category}] ` : ""}
                    {p.author}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
                    onClick={() => {
                      const next = posts.map((x) => (x.id === p.id ? { ...x, likes: (x.likes || 0) + 1 } : x));
                      setPosts(next);
                      save(next);
                    }}
                  >
                    👍 {p.likes || 0}
                  </Button>
                </Box>
                <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.25 }}>{p.body}</Typography>
                <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: "0.85rem" }}>
                  {new Date(p.created_at).toLocaleString("ko-KR")}
                </Typography>
                <Divider sx={{ mt: 1.25 }} />
              </Box>
            ))}
            {posts.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                아직 글이 없어요.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}


