import {
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export type FaqBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "divider" }
  | { type: "image"; url: string }
  | { type: "video"; url: string }
  | { type: "file"; url: string; name?: string };

function normalizeBlocks(blocks: any[]): FaqBlock[] {
  const out: FaqBlock[] = [];
  for (const b of Array.isArray(blocks) ? blocks : []) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "paragraph") out.push({ type: "paragraph", text: String(b.text ?? "") });
    if (b.type === "heading") out.push({ type: "heading", text: String(b.text ?? "") });
    if (b.type === "callout") out.push({ type: "callout", text: String(b.text ?? "") });
    if (b.type === "bullets") out.push({ type: "bullets", items: Array.isArray(b.items) ? b.items.map((x: any) => String(x)) : [] });
    if (b.type === "numbered") out.push({ type: "numbered", items: Array.isArray(b.items) ? b.items.map((x: any) => String(x)) : [] });
    if (b.type === "divider") out.push({ type: "divider" });
    if (b.type === "image") out.push({ type: "image", url: String(b.url ?? "") });
    if (b.type === "video") out.push({ type: "video", url: String(b.url ?? "") });
    if (b.type === "file") out.push({ type: "file", url: String(b.url ?? ""), name: b.name ? String(b.name) : undefined });
  }
  return out;
}

export function FaqBlockEditor({
  value,
  onChange,
  onUploadRequested,
  onPasteFiles,
  tone = "light",
}: {
  value: any[];
  onChange: (next: FaqBlock[]) => void;
  onUploadRequested: (kind: "image" | "video" | "file") => void;
  onPasteFiles?: (files: File[]) => void;
  tone?: "light" | "dark";
}) {
  const blocks = normalizeBlocks(value);

  function updateAt(i: number, next: FaqBlock) {
    const copy = [...blocks];
    copy[i] = next;
    onChange(copy);
  }

  function removeAt(i: number) {
    const copy = blocks.filter((_, idx) => idx !== i);
    onChange(copy);
  }

  function addParagraph() {
    onChange([...blocks, { type: "paragraph", text: "" }]);
  }

  function addHeading() {
    onChange([...blocks, { type: "heading", text: "" }]);
  }

  function addCallout() {
    onChange([...blocks, { type: "callout", text: "" }]);
  }

  function addBullets() {
    onChange([...blocks, { type: "bullets", items: [""] }]);
  }

  function addNumbered() {
    onChange([...blocks, { type: "numbered", items: [""] }]);
  }

  function addDivider() {
    onChange([...blocks, { type: "divider" }]);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    onChange(copy);
  }

  const isDark = tone === "dark";
  const panelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
  const panelBg = isDark ? "rgba(255,255,255,0.03)" : "#fff";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.03)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.92)";
  const textMuted = isDark ? "rgba(255,255,255,0.60)" : "rgba(15,23,42,0.50)";

  return (
    <Box
      onPaste={(e) => {
        if (!onPasteFiles) return;
        try {
          const items = Array.from(e.clipboardData?.items ?? []);
          const files: File[] = [];
          for (const it of items) {
            if (it.kind !== "file") continue;
            const f = it.getAsFile();
            if (!f) continue;
            const ct = String(f.type || "");
            if (ct.startsWith("image/") || ct.startsWith("video/")) files.push(f);
          }
          if (files.length) {
            e.preventDefault();
            onPasteFiles(files);
          }
        } catch {
          // ignore
        }
      }}
      sx={{ border: `1px solid ${panelBorder}`, bgcolor: panelBg }}
    >
      <Box sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ fontWeight: 900, color: textMain }}>블록</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addParagraph}>
            + 문단
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addHeading}>
            + 제목
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addCallout}>
            + 강조 박스
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addBullets}>
            + 글머리표
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addNumbered}>
            + 번호 목록
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={addDivider}>
            + 구분선
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={() => onUploadRequested("image")}>
            + 이미지
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={() => onUploadRequested("video")}>
            + 영상
          </Button>
          <Button variant="outlined" sx={{ fontWeight: 900, borderColor: panelBorder, color: textMain }} onClick={() => onUploadRequested("file")}>
            + 파일
          </Button>
        </Box>
      </Box>
      <Divider sx={{ borderColor: panelBorder }} />

      <Box sx={{ p: 1.5, display: "grid", gap: 1.25 }}>
        {blocks.length === 0 ? (
          <Typography sx={{ color: textMuted }} variant="body2">
            아직 블록이 없어요. 위 버튼으로 추가하세요.
          </Typography>
        ) : null}

        {blocks.map((b, idx) => (
          <Box key={idx} sx={{ border: `1px solid ${panelBorder}`, bgcolor: isDark ? "rgba(0,0,0,0.12)" : "rgba(15,23,42,0.02)" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1, py: 0.75 }}>
              <Typography variant="caption" sx={{ color: textMuted, fontWeight: 900 }}>
                {b.type.toUpperCase()}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <IconButton size="small" onClick={() => move(idx, -1)} sx={{ color: textMuted }}>
                  <ArrowUpwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => move(idx, +1)} sx={{ color: textMuted }}>
                  <ArrowDownwardIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => removeAt(idx)} sx={{ color: textMuted }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ borderColor: panelBorder }} />
            <Box sx={{ p: 1.25 }}>
              {b.type === "paragraph" ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="문단 내용을 입력하세요"
                  value={b.text}
                  onChange={(e) => updateAt(idx, { type: "paragraph", text: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                  }}
                />
              ) : null}

              {b.type === "heading" ? (
                <TextField
                  fullWidth
                  placeholder="제목을 입력하세요"
                  value={b.text}
                  onChange={(e) => updateAt(idx, { type: "heading", text: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                  }}
                />
              ) : null}

              {b.type === "callout" ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="중요 안내/주의사항을 입력하세요"
                  value={b.text}
                  onChange={(e) => updateAt(idx, { type: "callout", text: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                  }}
                />
              ) : null}

              {b.type === "bullets" ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder={"항목을 줄바꿈으로 입력하세요\n- 예: 첫번째\n- 예: 두번째"}
                  value={(b.items ?? []).join("\n")}
                  onChange={(e) =>
                    updateAt(idx, { type: "bullets", items: e.target.value.split("\n").map((x) => x.trim()).filter((x) => x.length > 0) })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                  }}
                />
              ) : null}

              {b.type === "numbered" ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder={"항목을 줄바꿈으로 입력하세요\n1) 첫번째\n2) 두번째"}
                  value={(b.items ?? []).join("\n")}
                  onChange={(e) =>
                    updateAt(idx, { type: "numbered", items: e.target.value.split("\n").map((x) => x.trim()).filter((x) => x.length > 0) })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                  }}
                />
              ) : null}

              {b.type === "divider" ? <Divider sx={{ borderColor: panelBorder }} /> : null}

              {b.type === "image" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="이미지 URL"
                    value={b.url}
                    onChange={(e) => updateAt(idx, { type: "image", url: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                    }}
                  />
                  {b.url ? <img src={b.url} alt="" style={{ maxWidth: "100%", height: "auto" }} /> : null}
                </Box>
              ) : null}

              {b.type === "video" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="영상 URL"
                    value={b.url}
                    onChange={(e) => updateAt(idx, { type: "video", url: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                    }}
                  />
                  {b.url ? <video src={b.url} controls style={{ maxWidth: "100%" }} /> : null}
                </Box>
              ) : null}

              {b.type === "file" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="파일 URL"
                    value={b.url}
                    onChange={(e) => updateAt(idx, { type: "file", url: e.target.value, name: b.name })}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                    }}
                  />
                  <TextField
                    fullWidth
                    placeholder="파일명(옵션)"
                    value={b.name ?? ""}
                    onChange={(e) => updateAt(idx, { type: "file", url: b.url, name: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: inputBg, color: textMain },
                    }}
                  />
                  {b.url ? (
                    <a href={b.url} target="_blank" rel="noreferrer" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(37,99,235,0.95)" }}>
                      {b.name || b.url}
                    </a>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}



