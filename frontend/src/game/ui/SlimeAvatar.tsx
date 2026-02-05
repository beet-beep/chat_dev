import { Box, keyframes } from "@mui/material";
import { useMemo } from "react";

const bounce = keyframes`
  0%, 100% { transform: scaleY(1) scaleX(1); }
  50% { transform: scaleY(0.9) scaleX(1.1); }
`;

const wiggle = keyframes`
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
`;

const blink = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

export type SlimeColor = "pink" | "blue" | "green" | "yellow" | "purple" | "orange" | "mint";

export interface SlimeAccessory {
  id: string;
  type: "hat" | "face" | "item";
  emoji?: string;
  name: string;
}

const SLIME_COLORS: Record<SlimeColor, { body: string; highlight: string; shadow: string; cheek: string }> = {
  pink: { body: "#FFB6C1", highlight: "#FFE4E8", shadow: "#FF8FA3", cheek: "#FF69B4" },
  blue: { body: "#87CEEB", highlight: "#E0F4FF", shadow: "#5BA3C6", cheek: "#4169E1" },
  green: { body: "#98FB98", highlight: "#E8FFE8", shadow: "#66CD66", cheek: "#32CD32" },
  yellow: { body: "#FFE66D", highlight: "#FFFACD", shadow: "#FFD700", cheek: "#FFA500" },
  purple: { body: "#DDA0DD", highlight: "#F5E6F5", shadow: "#BA55D3", cheek: "#9370DB" },
  orange: { body: "#FFAB76", highlight: "#FFE4D0", shadow: "#FF8C42", cheek: "#FF6B35" },
  mint: { body: "#98D8C8", highlight: "#E0FFF5", shadow: "#5FBDA0", cheek: "#20B2AA" },
};

export function SlimeAvatar({
  color = "pink",
  level = 1,
  exp = 0,
  maxExp = 100,
  accessories = [],
  size = 200,
  isHappy = false,
  isSleeping = false,
  onTap,
}: {
  color?: SlimeColor;
  level?: number;
  exp?: number;
  maxExp?: number;
  accessories?: SlimeAccessory[];
  size?: number;
  isHappy?: boolean;
  isSleeping?: boolean;
  onTap?: () => void;
}) {
  const colors = SLIME_COLORS[color] || SLIME_COLORS.pink;
  const hat = accessories.find((a) => a.type === "hat");
  const faceItem = accessories.find((a) => a.type === "face");

  const eyeStyle = useMemo(() => {
    if (isSleeping) return "sleeping";
    if (isHappy) return "happy";
    return "normal";
  }, [isSleeping, isHappy]);

  return (
    <Box
      onClick={onTap}
      sx={{
        width: size,
        height: size,
        position: "relative",
        cursor: onTap ? "pointer" : "default",
        userSelect: "none",
        animation: `${float} 3s ease-in-out infinite`,
        "&:active": onTap ? { transform: "scale(0.95)" } : {},
        transition: "transform 0.1s",
      }}
    >
      {/* Shadow */}
      <Box
        sx={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "12%",
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.15)",
          filter: "blur(4px)",
        }}
      />

      {/* Slime Body */}
      <svg
        viewBox="0 0 200 200"
        style={{
          width: "100%",
          height: "100%",
          animation: `${bounce} 2s ease-in-out infinite`,
        }}
      >
        <defs>
          <radialGradient id={`slimeGrad-${color}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="70%" stopColor={colors.body} />
            <stop offset="100%" stopColor={colors.shadow} />
          </radialGradient>
          <filter id="slimeShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Main body - blob shape */}
        <ellipse
          cx="100"
          cy="115"
          rx="75"
          ry="65"
          fill={`url(#slimeGrad-${color})`}
          filter="url(#slimeShadow)"
        />

        {/* Highlight */}
        <ellipse cx="70" cy="90" rx="20" ry="15" fill={colors.highlight} opacity="0.6" />

        {/* Eyes */}
        {eyeStyle === "sleeping" ? (
          <>
            <path d="M 65 110 Q 75 115 85 110" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 115 110 Q 125 115 135 110" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : eyeStyle === "happy" ? (
          <>
            <path d="M 65 115 Q 75 105 85 115" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 115 115 Q 125 105 135 115" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <g style={{ animation: `${blink} 4s ease-in-out infinite` }}>
              <ellipse cx="75" cy="110" rx="12" ry="14" fill="#333" />
              <ellipse cx="71" cy="106" rx="4" ry="5" fill="white" />
            </g>
            <g style={{ animation: `${blink} 4s ease-in-out infinite`, animationDelay: "0.1s" }}>
              <ellipse cx="125" cy="110" rx="12" ry="14" fill="#333" />
              <ellipse cx="121" cy="106" rx="4" ry="5" fill="white" />
            </g>
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="55" cy="130" rx="12" ry="8" fill={colors.cheek} opacity="0.5" />
        <ellipse cx="145" cy="130" rx="12" ry="8" fill={colors.cheek} opacity="0.5" />

        {/* Mouth */}
        {isHappy ? (
          <path d="M 85 140 Q 100 155 115 140" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <ellipse cx="100" cy="140" rx="8" ry="5" fill="#333" />
        )}
      </svg>

      {/* Hat accessory */}
      {hat && (
        <Box
          sx={{
            position: "absolute",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size * 0.3,
            animation: `${wiggle} 2s ease-in-out infinite`,
          }}
        >
          {hat.emoji || "🎩"}
        </Box>
      )}

      {/* Face accessory */}
      {faceItem && (
        <Box
          sx={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size * 0.2,
          }}
        >
          {faceItem.emoji || "👓"}
        </Box>
      )}

      {/* Level badge */}
      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          right: "5%",
          bgcolor: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          color: "#5D4037",
          fontWeight: 900,
          fontSize: size * 0.08,
          px: 1,
          py: 0.3,
          borderRadius: 2,
          border: "2px solid #E65100",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        Lv.{level}
      </Box>
    </Box>
  );
}
