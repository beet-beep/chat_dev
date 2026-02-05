import { Box, Button, Chip, Typography } from "@mui/material";
import React, { useMemo } from "react";

function isImage(f: File) {
  return String(f.type || "").startsWith("image/");
}
function isVideo(f: File) {
  return String(f.type || "").startsWith("video/");
}

export function AttachmentPreview(props: {
  files: File[];
  onRemove: (index: number) => void;
  maxThumbs?: number;
}) {
  const { files, onRemove, maxThumbs = 6 } = props;
  const thumbs = useMemo(() => {
    return files.map((f) => (isImage(f) ? URL.createObjectURL(f) : "")).map((url, idx) => ({ url, idx }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join("|")]);

  // cleanup object urls
  React.useEffect(() => {
    return () => {
      for (const t of thumbs) if (t.url) URL.revokeObjectURL(t.url);
    };
  }, [thumbs]);

  if (!files.length) return null;

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {/* thumbnails */}
      {files.some(isImage) ? (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
          {thumbs
            .filter((t) => t.url)
            .slice(0, maxThumbs)
            .map((t) => (
              <Box key={t.idx} sx={{ position: "relative", flex: "0 0 auto" }}>
                <Box
                  component="img"
                  src={t.url}
                  alt={files[t.idx]?.name || "image"}
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid rgba(17,24,39,0.12)",
                    bgcolor: "rgba(17,24,39,0.03)",
                    display: "block",
                  }}
                />
                <Button
                  size="small"
                  onClick={() => onRemove(t.idx)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 0,
                    width: 26,
                    height: 26,
                    p: 0,
                    bgcolor: "rgba(17,24,39,0.55)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(17,24,39,0.75)" },
                    borderRadius: 999,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  ×
                </Button>
              </Box>
            ))}
          {files.filter(isImage).length > maxThumbs ? (
            <Box sx={{ display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 10, border: "1px dashed rgba(17,24,39,0.20)" }}>
              <Typography variant="caption" sx={{ color: "rgba(17,24,39,0.65)", fontWeight: 900 }}>
                +{files.filter(isImage).length - maxThumbs}
              </Typography>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {/* chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {files.map((f, idx) => (
          <Chip
            key={`${f.name}-${f.size}-${idx}`}
            label={`${isVideo(f) ? "🎬 " : isImage(f) ? "🖼 " : ""}${f.name}`}
            onDelete={() => onRemove(idx)}
            sx={{ maxWidth: "100%" }}
          />
        ))}
      </Box>
    </Box>
  );
}






