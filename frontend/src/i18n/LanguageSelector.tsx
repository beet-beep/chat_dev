import { useState } from "react";
import { Button, Menu, MenuItem, Typography, Box, alpha } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useLanguage, type Lang } from "./index";

const options: { code: Lang; label: string; short: string }[] = [
  { code: "ko", label: "한국어", short: "KO" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "zh-TW", label: "繁體中文", short: "ZH" },
];

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const current = options.find((o) => o.code === lang) ?? options[0];

  return (
    <>
      <Button
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          minWidth: 0,
          px: 1,
          py: 0.5,
          color: "inherit",
          bgcolor: alpha("#FFFFFF", 0.2),
          backdropFilter: "blur(8px)",
          borderRadius: 1.5,
          "&:hover": { bgcolor: alpha("#FFFFFF", 0.3) },
          gap: 0.5,
        }}
      >
        <LanguageIcon sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em" }}>
          {current.short}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 140,
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        {options.map((o) => (
          <MenuItem
            key={o.code}
            selected={o.code === lang}
            onClick={() => {
              setLang(o.code);
              setAnchor(null);
            }}
            sx={{ py: 1, px: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
              <Typography sx={{ fontWeight: o.code === lang ? 700 : 500, fontSize: "0.875rem", flex: 1 }}>
                {o.label}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary" }}>
                {o.short}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
