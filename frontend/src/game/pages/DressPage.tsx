import { Box, Button, Card, IconButton, Typography, Tabs, Tab, Chip, Badge } from "@mui/material";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { FullGameState } from "../state/gameState";
import { equipItem, saveGameState } from "../state/gameState";
import { PixelSlime, SlimeColorPicker, type SlimeColor } from "../ui/PixelSlime";
import { ITEMS_DATABASE, CATEGORY_CONFIG, RARITY_CONFIG, type ItemCategory, type GameItem } from "../items/itemDatabase";

interface DressPageProps {
  state: FullGameState;
  setState: (updater: (prev: FullGameState) => FullGameState) => void;
}

const DRESS_CATEGORIES: { category: ItemCategory; label: string; icon: string }[] = [
  { category: "hat", label: "모자", icon: "🎩" },
  { category: "hair", label: "헤어", icon: "💇" },
  { category: "face", label: "얼굴", icon: "😊" },
  { category: "accessory", label: "악세", icon: "💎" },
  { category: "clothes", label: "의상", icon: "👕" },
  { category: "pet", label: "펫", icon: "🐾" },
  { category: "background", label: "배경", icon: "🖼️" },
  { category: "effect", label: "효과", icon: "✨" },
];

export function DressPage({ state, setState }: DressPageProps) {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const activeCategory = DRESS_CATEGORIES[activeTab].category;

  // 현재 카테고리의 소유 아이템
  const ownedItems = useMemo(() => {
    return ITEMS_DATABASE
      .filter((item) => item.category === activeCategory)
      .filter((item) => state.inventory[item.id]?.quantity > 0)
      .sort((a, b) => {
        const rarityOrder = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      });
  }, [activeCategory, state.inventory]);

  // 현재 장착된 아이템
  const equippedItemId = useMemo(() => {
    const equipped = state.slime.equipped;
    switch (activeCategory) {
      case "hat": return equipped.hat;
      case "hair": return equipped.hair;
      case "face": return equipped.face;
      case "accessory": return equipped.accessory;
      case "clothes": return equipped.clothes;
      case "pet": return equipped.pet;
      case "background": return equipped.background;
      case "effect": return equipped.effect;
      default: return undefined;
    }
  }, [activeCategory, state.slime.equipped]);

  const handleEquip = (itemId: string | null) => {
    setState((prev) => {
      const newState = equipItem(prev, activeCategory, itemId);
      saveGameState(newState);
      return newState;
    });
  };

  const handleColorChange = (color: SlimeColor) => {
    setState((prev) => {
      const newState = {
        ...prev,
        slime: { ...prev.slime, color },
      };
      saveGameState(newState);
      return newState;
    });
  };

  // 총 장착 아이템 수
  const equippedCount = useMemo(() => {
    return Object.values(state.slime.equipped).filter(Boolean).length;
  }, [state.slime.equipped]);

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
          justifyContent: "space-between",
          px: 1,
          py: 1.5,
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          borderBottom: "2px solid rgba(156,39,176,0.2)",
        }}
      >
        <IconButton onClick={() => nav(-1)} sx={{ color: "#7B1FA2" }}>
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#7B1FA2" }}>
          👗 코디하기
        </Typography>
        <Chip
          label={`${equippedCount}개 착용중`}
          size="small"
          sx={{ bgcolor: "#E1BEE7", fontWeight: 700 }}
        />
      </Box>

      {/* Slime Preview */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
          bgcolor: "rgba(255,255,255,0.5)",
        }}
      >
        <PixelSlime
          color={state.slime.color as SlimeColor}
          size={180}
          expression="happy"
          equipped={state.slime.equipped}
          level={state.slime.level}
          animated
        />

        {/* Color Picker Toggle */}
        <Button
          onClick={() => setShowColorPicker(!showColorPicker)}
          size="small"
          sx={{
            mt: 1,
            borderRadius: 2,
            bgcolor: "white",
            color: "#7B1FA2",
            fontWeight: 700,
            "&:hover": { bgcolor: "#F3E5F5" },
          }}
        >
          🎨 색상 변경
        </Button>

        {/* Color Picker */}
        {showColorPicker && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <SlimeColorPicker
              value={state.slime.color as SlimeColor}
              onChange={handleColorChange}
              size={35}
            />
          </Box>
        )}
      </Box>

      {/* Category Tabs */}
      <Box sx={{ bgcolor: "white", borderRadius: "20px 20px 0 0", pt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            "& .MuiTab-root": {
              minWidth: "auto",
              px: 2,
              fontWeight: 700,
              fontSize: "0.8rem",
            },
            "& .Mui-selected": {
              color: "#7B1FA2",
            },
            "& .MuiTabs-indicator": {
              bgcolor: "#7B1FA2",
            },
          }}
        >
          {DRESS_CATEGORIES.map((cat, i) => (
            <Tab
              key={cat.category}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {state.slime.equipped[cat.category as keyof typeof state.slime.equipped] && (
                    <CheckCircleIcon sx={{ fontSize: 14, color: "#4CAF50" }} />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Items Grid */}
      <Box sx={{ bgcolor: "white", minHeight: 300, px: 2, pt: 2, pb: 4 }}>
        {/* Unequip Button */}
        {equippedItemId && (
          <Button
            fullWidth
            onClick={() => handleEquip(null)}
            sx={{
              mb: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: "#FFCDD2",
              color: "#C62828",
              fontWeight: 800,
              "&:hover": { bgcolor: "#EF9A9A" },
            }}
          >
            ❌ 장착 해제
          </Button>
        )}

        {ownedItems.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ fontSize: "3rem", mb: 2 }}>📦</Typography>
            <Typography sx={{ color: "#9E9E9E", fontWeight: 600, mb: 2 }}>
              보유한 {DRESS_CATEGORIES[activeTab].label} 아이템이 없어요
            </Typography>
            <Button
              onClick={() => nav("/gacha")}
              sx={{
                borderRadius: 3,
                bgcolor: "#7C4DFF",
                color: "white",
                fontWeight: 800,
                px: 3,
                "&:hover": { bgcolor: "#651FFF" },
              }}
            >
              🎁 가챠에서 뽑기
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
            {ownedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                quantity={state.inventory[item.id]?.quantity || 0}
                isEquipped={equippedItemId === item.id}
                onClick={() => handleEquip(item.id)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// 아이템 카드 컴포넌트
function ItemCard({
  item,
  quantity,
  isEquipped,
  onClick,
}: {
  item: GameItem;
  quantity: number;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const rarityConfig = RARITY_CONFIG[item.rarity];

  return (
    <Card
      onClick={onClick}
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.2s",
        border: isEquipped ? `3px solid ${rarityConfig.color}` : "2px solid #E0E0E0",
        boxShadow: isEquipped ? `0 4px 15px ${rarityConfig.glow}` : "none",
        bgcolor: isEquipped ? `${rarityConfig.color}10` : "white",
        "&:hover": {
          transform: "scale(1.03)",
          borderColor: rarityConfig.color,
        },
      }}
    >
      {/* Equipped Badge */}
      {isEquipped && (
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "#4CAF50",
            color: "white",
            fontSize: "0.6rem",
            fontWeight: 800,
            px: 0.8,
            py: 0.3,
            borderRadius: 2,
            zIndex: 10,
          }}
        >
          착용중
        </Box>
      )}

      {/* Quantity Badge */}
      <Box
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          fontSize: "0.6rem",
          fontWeight: 800,
          px: 0.6,
          py: 0.2,
          borderRadius: 1,
        }}
      >
        x{quantity}
      </Box>

      {/* Item Preview */}
      <Box
        sx={{
          width: "100%",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
          "& svg": {
            width: 50,
            height: 50,
          },
        }}
        dangerouslySetInnerHTML={{
          __html: item.pixelArt.startsWith("<svg") || item.pixelArt.startsWith("linear")
            ? item.pixelArt.startsWith("linear")
              ? `<div style="width:50px;height:50px;border-radius:8px;background:${item.pixelArt}"></div>`
              : item.pixelArt
            : `<span style="font-size:2.5rem">${item.pixelArt}</span>`,
        }}
      />

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
          mb: 0.5,
        }}
      >
        {item.name}
      </Typography>

      {/* Rarity Badge */}
      <Box
        sx={{
          textAlign: "center",
        }}
      >
        <Chip
          label={item.rarity.toUpperCase()}
          size="small"
          sx={{
            height: 18,
            fontSize: "0.55rem",
            fontWeight: 800,
            bgcolor: `${rarityConfig.color}20`,
            color: rarityConfig.color,
            border: `1px solid ${rarityConfig.color}`,
          }}
        />
      </Box>

      {/* Stats */}
      {item.stats && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mt: 0.5 }}>
          {item.stats.charm && (
            <Typography sx={{ fontSize: "0.55rem", color: "#E91E63" }}>
              ✨{item.stats.charm}
            </Typography>
          )}
          {item.stats.luck && (
            <Typography sx={{ fontSize: "0.55rem", color: "#4CAF50" }}>
              🍀{item.stats.luck}
            </Typography>
          )}
        </Box>
      )}
    </Card>
  );
}
