import { Box } from "@mui/material";
import type { CosmeticItem } from "../items";

export function HumanAvatar({
  hat,
  face,
  body,
  height = 220,
}: {
  hat: CosmeticItem | null;
  face: CosmeticItem | null;
  body: CosmeticItem | null;
  height?: number;
}) {
  return (
    <Box
      sx={{
        height,
        border: "2px solid rgba(122,90,62,0.30)",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(240px 180px at 50% 35%, rgba(34,197,94,0.18), rgba(34,197,94,0.0) 70%), linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.15))",
      }}
    >
      {/* Base human (simple stylized SVG for MVP) */}
      <Box sx={{ width: 170, height: 200, position: "relative" }}>
        <svg width="170" height="200" viewBox="0 0 170 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#F5D0C5" />
              <stop offset="1" stopColor="#E9B7A8" />
            </linearGradient>
            <linearGradient id="shirt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#93C5FD" />
              <stop offset="1" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          {/* head */}
          <circle cx="85" cy="52" r="34" fill="url(#skin)" stroke="rgba(62,42,29,0.22)" strokeWidth="3" />
          {/* hair */}
          <path
            d="M52 52c3-26 21-42 45-42 25 0 42 15 45 42-6-10-18-16-45-16-27 0-39 6-45 16z"
            fill="#2B1B12"
            opacity="0.55"
          />
          {/* body */}
          <path
            d="M45 94c10-14 23-22 40-22s30 8 40 22c7 10 10 23 10 41v38c0 10-8 18-18 18H53c-10 0-18-8-18-18v-38c0-18 3-31 10-41z"
            fill="url(#shirt)"
            stroke="rgba(62,42,29,0.22)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* arms */}
          <path
            d="M38 118c-10 6-16 18-16 34 0 10 4 18 12 22 6 3 14 1 18-5l9-14"
            fill="none"
            stroke="rgba(62,42,29,0.18)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M132 118c10 6 16 18 16 34 0 10-4 18-12 22-6 3-14 1-18-5l-9-14"
            fill="none"
            stroke="rgba(62,42,29,0.18)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* face minimal */}
          <circle cx="72" cy="52" r="4" fill="rgba(43,27,18,0.65)" />
          <circle cx="98" cy="52" r="4" fill="rgba(43,27,18,0.65)" />
          <path d="M74 66c8 8 14 8 22 0" stroke="rgba(43,27,18,0.45)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      </Box>

      {/* Wearables (layered) */}
      {body?.image ? (
        <img
          src={body.image}
          alt={body.name}
          style={{ position: "absolute", bottom: 6, width: 170, height: 170, objectFit: "contain", pointerEvents: "none", opacity: 0.95 }}
        />
      ) : null}
      {face?.image ? (
        <img
          src={face.image}
          alt={face.name}
          style={{ position: "absolute", top: 62, width: 160, height: 120, objectFit: "contain", pointerEvents: "none" }}
        />
      ) : null}
      {hat?.image ? (
        <img
          src={hat.image}
          alt={hat.name}
          style={{ position: "absolute", top: 10, width: 170, height: 120, objectFit: "contain", pointerEvents: "none" }}
        />
      ) : null}
    </Box>
  );
}





