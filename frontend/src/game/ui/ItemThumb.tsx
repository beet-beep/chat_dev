import { Box } from "@mui/material";
import type { CosmeticItem } from "../items";

export function ItemThumb({ item, size = 36 }: { item: CosmeticItem; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: "hidden",
        border: "2px solid rgba(122,90,62,0.35)",
        bgcolor: "rgba(255,255,255,0.55)",
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: Math.max(16, Math.floor(size * 0.55)) }}>{item.icon}</span>
      )}
    </Box>
  );
}





