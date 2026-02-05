import { Box, Card, CardContent, Typography } from "@mui/material";
import { GameTopBar } from "../ui/GameTopBar";
import { useNavigate } from "react-router-dom";

export function PlaceholderPage({ title, desc }: { title: string; desc?: string }) {
  const nav = useNavigate();
  return (
    <Box sx={{ pb: 2 }}>
      <GameTopBar title={title} onBack={() => nav(-1)} />
      <Box sx={{ px: 2.5, pt: 1 }}>
        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 900 }}>준비중</Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{desc || "테스트용 MVP에서는 이 기능을 생략했어요."}</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}






