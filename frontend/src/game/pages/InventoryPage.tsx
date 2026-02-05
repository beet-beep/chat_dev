import { Box, Button, Card, CardContent, Divider, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import type { GameState } from "../state";
import type { CosmeticItem, Slot } from "../items";
import { COSMETICS } from "../items";
import { ItemThumb } from "../ui/ItemThumb";
import { SlimeAvatar, type SlimeColor, type SlimeAccessory } from "../ui/SlimeAvatar";

function itemsBySlot(slot: Slot) {
  return COSMETICS.filter((c) => c.slot === slot);
}

function ownedCount(state: GameState, itemId: string) {
  return Number(state.owned?.[itemId] || 0);
}

const SLOT_ICONS: Record<Slot, string> = {
  hat: "🎩",
  face: "👓",
  body: "👕",
};

const SLOT_NAMES: Record<Slot, string> = {
  hat: "모자",
  face: "얼굴",
  body: "의상",
};

export function InventoryPage({
  state,
  onEquip,
}: {
  state: GameState;
  onEquip: (slot: Slot, itemId: string | null) => void;
}) {
  const nav = useNavigate();
  const [activeSlot, setActiveSlot] = useState<Slot>("hat");

  const [slimeColor] = useState<SlimeColor>(() => {
    const colors: SlimeColor[] = ["pink", "blue", "green", "yellow", "purple", "orange", "mint"];
    const saved = localStorage.getItem("slime_color");
    if (saved && colors.includes(saved as SlimeColor)) return saved as SlimeColor;
    return "pink";
  });

  // Build accessories from equipped items
  const accessories: SlimeAccessory[] = [];
  if (state.equipped?.hat) {
    const item = COSMETICS.find((c) => c.id === state.equipped.hat);
    if (item) accessories.push({ id: item.id, type: "hat", emoji: item.emoji, name: item.name });
  }
  if (state.equipped?.face) {
    const item = COSMETICS.find((c) => c.id === state.equipped.face);
    if (item) accessories.push({ id: item.id, type: "face", emoji: item.emoji, name: item.name });
  }

  const slotItems = itemsBySlot(activeSlot);
  const ownedItems = slotItems.filter((it) => ownedCount(state, it.id) > 0);
  const equipped = state.equipped?.[activeSlot] || null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 50%, #CE93D8 100%)",
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
          borderBottom: "2px solid rgba(156,39,176,0.2)",
        }}
      >
        <IconButton onClick={() => nav("/home")} sx={{ color: "#7B1FA2" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <CheckroomIcon sx={{ color: "#7B1FA2", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#7B1FA2" }}>꾸미기</Typography>
        </Box>
      </Box>

      {/* Slime Preview */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 2,
          bgcolor: "rgba(255,255,255,0.5)",
        }}
      >
        <SlimeAvatar color={slimeColor} level={1} size={150} accessories={accessories} isHappy />
      </Box>

      {/* Slot Tabs */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, py: 2, px: 2 }}>
        {(["hat", "face", "body"] as Slot[]).map((slot) => (
          <Button
            key={slot}
            onClick={() => setActiveSlot(slot)}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: 3,
              bgcolor: activeSlot === slot ? "white" : "rgba(255,255,255,0.5)",
              border: activeSlot === slot ? "2px solid #9C27B0" : "2px solid transparent",
              boxShadow: activeSlot === slot ? "0 4px 15px rgba(156,39,176,0.3)" : "none",
              fontWeight: 800,
              color: activeSlot === slot ? "#7B1FA2" : "#666",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{SLOT_ICONS[slot]}</span>
            <span style={{ fontSize: "0.75rem" }}>{SLOT_NAMES[slot]}</span>
          </Button>
        ))}
      </Box>

      {/* Items Grid */}
      <Box sx={{ px: 2.5, pt: 1 }}>
        <Card
          sx={{
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.95)",
            boxShadow: "0 4px 20px rgba(156,39,176,0.15)",
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontWeight: 900, color: "#7B1FA2" }}>
                {SLOT_ICONS[activeSlot]} {SLOT_NAMES[activeSlot]} 아이템
              </Typography>
              {equipped && (
                <Button
                  size="small"
                  onClick={() => onEquip(activeSlot, null)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFCDD2",
                    color: "#C62828",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    "&:hover": { bgcolor: "#EF9A9A" },
                  }}
                >
                  장착 해제
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {ownedItems.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "2rem", mb: 1 }}>📦</Typography>
                <Typography sx={{ color: "#9E9E9E", fontWeight: 600 }}>
                  보유한 아이템이 없어요
                </Typography>
                <Button
                  onClick={() => nav("/box")}
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    bgcolor: "#7C4DFF",
                    color: "white",
                    fontWeight: 800,
                    px: 3,
                    "&:hover": { bgcolor: "#651FFF" },
                  }}
                >
                  🎁 뽑기하러 가기
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                {ownedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    count={ownedCount(state, item.id)}
                    active={equipped === item.id}
                    onClick={() => onEquip(activeSlot, item.id)}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function ItemCard({
  item,
  count,
  active,
  onClick,
}: {
  item: CosmeticItem;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
    common: { bg: "#F5F5F5", border: "#BDBDBD", text: "#757575" },
    rare: { bg: "#E3F2FD", border: "#64B5F6", text: "#1976D2" },
    epic: { bg: "#F3E5F5", border: "#BA68C8", text: "#7B1FA2" },
    legendary: { bg: "#FFF8E1", border: "#FFD54F", text: "#F57C00" },
  };
  const colors = rarityColors[item.rarity] || rarityColors.common;

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 3,
        bgcolor: active ? colors.bg : "white",
        border: `2px solid ${active ? colors.border : "#E0E0E0"}`,
        boxShadow: active ? `0 4px 15px ${colors.border}40` : "none",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: colors.border,
          transform: "scale(1.02)",
        },
      }}
    >
      {/* Equipped badge */}
      {active && (
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "#4CAF50",
            color: "white",
            fontSize: "0.6rem",
            fontWeight: 800,
            px: 1,
            py: 0.3,
            borderRadius: 2,
          }}
        >
          착용중
        </Box>
      )}

      {/* Count badge */}
      <Box
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          fontSize: "0.65rem",
          fontWeight: 800,
          px: 0.8,
          py: 0.2,
          borderRadius: 1,
        }}
      >
        x{count}
      </Box>

      {/* Item Icon */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <ItemThumb item={item} size={50} />
      </Box>

      {/* Item Name */}
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "0.7rem",
          color: "#424242",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </Typography>

      {/* Rarity */}
      <Typography
        sx={{
          textAlign: "center",
          fontSize: "0.6rem",
          fontWeight: 700,
          color: colors.text,
          textTransform: "uppercase",
        }}
      >
        {item.rarity}
      </Typography>
    </Box>
  );
}
