import { Box, keyframes } from "@mui/material";
import { useMemo } from "react";
import type { GameItem, ItemCategory } from "../items/itemDatabase";
import { getItemById, CATEGORY_CONFIG } from "../items/itemDatabase";

// 애니메이션
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const wiggle = keyframes`
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
`;

const blink = keyframes`
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`;

// 슬라임 색상 팔레트
export type SlimeColor = "pink" | "blue" | "green" | "yellow" | "purple" | "orange" | "mint" | "white" | "black" | "rainbow";

const SLIME_PALETTES: Record<SlimeColor, { body: string; light: string; dark: string; eye: string; cheek: string }> = {
  pink: { body: "#FFB6C1", light: "#FFE4E8", dark: "#FF8FA3", eye: "#333", cheek: "#FF69B4" },
  blue: { body: "#87CEEB", light: "#E0F4FF", dark: "#5BA3C6", eye: "#333", cheek: "#4169E1" },
  green: { body: "#98FB98", light: "#E8FFE8", dark: "#66CD66", eye: "#333", cheek: "#32CD32" },
  yellow: { body: "#FFE66D", light: "#FFFACD", dark: "#FFD700", eye: "#333", cheek: "#FFA500" },
  purple: { body: "#DDA0DD", light: "#F5E6F5", dark: "#BA55D3", eye: "#333", cheek: "#9370DB" },
  orange: { body: "#FFAB76", light: "#FFE4D0", dark: "#FF8C42", eye: "#333", cheek: "#FF6B35" },
  mint: { body: "#98D8C8", light: "#E0FFF5", dark: "#5FBDA0", eye: "#333", cheek: "#20B2AA" },
  white: { body: "#FAFAFA", light: "#FFFFFF", dark: "#E0E0E0", eye: "#333", cheek: "#FFCDD2" },
  black: { body: "#424242", light: "#616161", dark: "#212121", eye: "#FFF", cheek: "#757575" },
  rainbow: { body: "#FFB6C1", light: "#E0F4FF", dark: "#BA55D3", eye: "#333", cheek: "#FFD700" },
};

// 슬라임 도트 아트 (16x16 기반)
function createSlimePixels(palette: typeof SLIME_PALETTES.pink, expression: "normal" | "happy" | "sad" | "sleep" = "normal"): string {
  const { body, light, dark, eye, cheek } = palette;

  // 기본 슬라임 형태
  let svg = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">`;

  // 그림자
  svg += `<ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(0,0,0,0.2)"/>`;

  // 몸통 (둥근 슬라임 형태)
  const bodyPixels = [
    "........BBBBBBBB........",
    "......BBBBBBBBBBBB......",
    ".....BBBBBBBBBBBBBB.....",
    "....BBBBLLLLLLBBBBBB....",
    "...BBBBLLLLLLLLLBBBBB...",
    "...BBBLLLLLLLLLLBBBBBB..",
    "..BBBBLLLLLLLLLLLBBBBB..",
    "..BBBBLLLLLLLLLLLLBBBB..",
    "..BBBBLLLLLLLLLLLBBBBB..",
    ".BBBBBLLLLLLLLLLLLBBBB..",
    ".BBBBBLLLLLLLLLLLBBBBB..",
    ".BBBBBLLLLLLLLLLBBBBBB..",
    ".BBBBBBLLLLLLLLBBBBBBB..",
    "..BBBBBBBBBBBBBBBBBBB...",
    "...BBBBBBBBBBBBBBBBB....",
    "....DDDDDDDDDDDDDDD.....",
  ];

  bodyPixels.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      if (char === "B") svg += `<rect x="${x + 4}" y="${y + 8}" width="1" height="1" fill="${body}"/>`;
      if (char === "L") svg += `<rect x="${x + 4}" y="${y + 8}" width="1" height="1" fill="${light}"/>`;
      if (char === "D") svg += `<rect x="${x + 4}" y="${y + 8}" width="1" height="1" fill="${dark}"/>`;
    });
  });

  // 눈
  if (expression === "normal" || expression === "happy") {
    // 왼쪽 눈
    svg += `<rect x="11" y="16" width="2" height="3" fill="${eye}"/>`;
    svg += `<rect x="11" y="16" width="1" height="1" fill="white"/>`;
    // 오른쪽 눈
    svg += `<rect x="19" y="16" width="2" height="3" fill="${eye}"/>`;
    svg += `<rect x="19" y="16" width="1" height="1" fill="white"/>`;
  } else if (expression === "sleep") {
    // 감은 눈 (-)
    svg += `<rect x="10" y="17" width="4" height="1" fill="${eye}"/>`;
    svg += `<rect x="18" y="17" width="4" height="1" fill="${eye}"/>`;
  } else if (expression === "sad") {
    // 슬픈 눈
    svg += `<rect x="11" y="17" width="2" height="2" fill="${eye}"/>`;
    svg += `<rect x="19" y="17" width="2" height="2" fill="${eye}"/>`;
  }

  // 볼터치
  svg += `<rect x="8" y="19" width="2" height="1" fill="${cheek}" opacity="0.6"/>`;
  svg += `<rect x="22" y="19" width="2" height="1" fill="${cheek}" opacity="0.6"/>`;

  // 입
  if (expression === "happy") {
    svg += `<rect x="14" y="21" width="4" height="1" fill="${eye}"/>`;
    svg += `<rect x="13" y="20" width="1" height="1" fill="${eye}"/>`;
    svg += `<rect x="18" y="20" width="1" height="1" fill="${eye}"/>`;
  } else if (expression === "sad") {
    svg += `<rect x="14" y="21" width="4" height="1" fill="${eye}"/>`;
    svg += `<rect x="13" y="22" width="1" height="1" fill="${eye}"/>`;
    svg += `<rect x="18" y="22" width="1" height="1" fill="${eye}"/>`;
  } else {
    svg += `<rect x="15" y="20" width="2" height="2" fill="${eye}"/>`;
  }

  svg += "</svg>";
  return svg;
}

export interface EquippedItems {
  hat?: string;
  hair?: string;
  face?: string;
  eyes?: string;
  mouth?: string;
  accessory?: string;
  clothes?: string;
  shoes?: string;
  background?: string;
  effect?: string;
  pet?: string;
}

interface PixelSlimeProps {
  color?: SlimeColor;
  size?: number;
  expression?: "normal" | "happy" | "sad" | "sleep";
  equipped?: EquippedItems;
  level?: number;
  onClick?: () => void;
  animated?: boolean;
  showLevel?: boolean;
}

export function PixelSlime({
  color = "pink",
  size = 200,
  expression = "normal",
  equipped = {},
  level = 1,
  onClick,
  animated = true,
  showLevel = true,
}: PixelSlimeProps) {
  const palette = SLIME_PALETTES[color];
  const slimeSvg = useMemo(() => createSlimePixels(palette, expression), [palette, expression]);

  // 장착된 아이템들 가져오기
  const equippedItems = useMemo(() => {
    const items: { item: GameItem; category: ItemCategory }[] = [];
    Object.entries(equipped).forEach(([cat, itemId]) => {
      if (itemId) {
        const item = getItemById(itemId);
        if (item) items.push({ item, category: cat as ItemCategory });
      }
    });
    return items.sort((a, b) => (a.item.zIndex || 0) - (b.item.zIndex || 0));
  }, [equipped]);

  // 배경 아이템
  const bgItem = equippedItems.find((e) => e.category === "background");

  // 이펙트 아이템
  const effectItem = equippedItems.find((e) => e.category === "effect");

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        width: size,
        height: size,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        // 배경
        background: bgItem ? bgItem.item.pixelArt : "transparent",
        borderRadius: 4,
        overflow: "hidden",
        "&:active": onClick ? { transform: "scale(0.95)" } : {},
        transition: "transform 0.1s",
      }}
    >
      {/* 이펙트 레이어 (뒤) */}
      {effectItem && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.5,
            opacity: 0.3,
            animation: `${sparkle} 2s ease-in-out infinite`,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {effectItem.item.pixelArt}
        </Box>
      )}

      {/* 펫 */}
      {equippedItems
        .filter((e) => e.category === "pet")
        .map((e) => (
          <Box
            key={e.item.id}
            sx={{
              position: "absolute",
              left: `calc(50% + ${e.item.position.x * (size / 200)}px)`,
              top: `calc(50% + ${e.item.position.y * (size / 200)}px)`,
              transform: "translate(-50%, -50%)",
              width: size * 0.3 * e.item.scale,
              height: size * 0.3 * e.item.scale,
              zIndex: e.item.zIndex,
              animation: animated ? `${wiggle} 2s ease-in-out infinite` : "none",
              "& svg": {
                width: "100%",
                height: "100%",
              },
            }}
            dangerouslySetInnerHTML={{ __html: e.item.pixelArt }}
          />
        ))}

      {/* 슬라임 본체 */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.8,
          height: size * 0.8,
          animation: animated ? `${bounce} 2s ease-in-out infinite` : "none",
          zIndex: 50,
          "& svg": {
            width: "100%",
            height: "100%",
          },
        }}
        dangerouslySetInnerHTML={{ __html: slimeSvg }}
      />

      {/* 의상 아이템들 (슬라임 위에) */}
      {equippedItems
        .filter((e) => !["background", "effect", "pet"].includes(e.category))
        .map((e) => {
          const config = CATEGORY_CONFIG[e.category];
          const posX = e.item.position.x || config.defaultPosition.x;
          const posY = e.item.position.y || config.defaultPosition.y;
          const itemSize = size * 0.4 * e.item.scale;

          return (
            <Box
              key={e.item.id}
              sx={{
                position: "absolute",
                left: `calc(50% + ${posX * (size / 200)}px)`,
                top: `calc(50% + ${posY * (size / 200)}px)`,
                transform: "translate(-50%, -50%)",
                width: itemSize,
                height: itemSize,
                zIndex: e.item.zIndex || config.defaultZIndex,
                animation: e.category === "hat" && animated ? `${wiggle} 3s ease-in-out infinite` : "none",
                "& svg": {
                  width: "100%",
                  height: "100%",
                },
              }}
              dangerouslySetInnerHTML={{ __html: e.item.pixelArt }}
            />
          );
        })}

      {/* 이펙트 레이어 (앞) */}
      {effectItem && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: "10%",
              left: "20%",
              fontSize: size * 0.12,
              animation: `${sparkle} 1.5s ease-in-out infinite`,
              animationDelay: "0s",
              zIndex: 200,
            }}
          >
            {effectItem.item.pixelArt}
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: "15%",
              right: "25%",
              fontSize: size * 0.1,
              animation: `${sparkle} 1.5s ease-in-out infinite`,
              animationDelay: "0.5s",
              zIndex: 200,
            }}
          >
            {effectItem.item.pixelArt}
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: "30%",
              left: "15%",
              fontSize: size * 0.08,
              animation: `${sparkle} 1.5s ease-in-out infinite`,
              animationDelay: "1s",
              zIndex: 200,
            }}
          >
            {effectItem.item.pixelArt}
          </Box>
        </>
      )}

      {/* 레벨 뱃지 */}
      {showLevel && (
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            color: "#5D4037",
            fontWeight: 900,
            fontSize: size * 0.07,
            px: 1,
            py: 0.3,
            borderRadius: 1,
            border: "2px solid #E65100",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            fontFamily: "'Press Start 2P', monospace",
            zIndex: 300,
          }}
        >
          Lv.{level}
        </Box>
      )}
    </Box>
  );
}

// 슬라임 색상 선택기 컴포넌트
export function SlimeColorPicker({
  value,
  onChange,
  size = 40,
}: {
  value: SlimeColor;
  onChange: (color: SlimeColor) => void;
  size?: number;
}) {
  const colors: SlimeColor[] = ["pink", "blue", "green", "yellow", "purple", "orange", "mint", "white", "black"];

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {colors.map((color) => (
        <Box
          key={color}
          onClick={() => onChange(color)}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            bgcolor: SLIME_PALETTES[color].body,
            border: value === color ? "3px solid #333" : "2px solid #E0E0E0",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.1)" },
            boxShadow: value === color ? "0 0 10px rgba(0,0,0,0.3)" : "none",
          }}
        />
      ))}
    </Box>
  );
}
