import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from "react";
import { Snackbar, Alert, Box, Typography, LinearProgress, alpha, Chip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { adminTranslate, type TranslateItem, type TranslateResult } from "../../../api/support";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TranslationJob = {
  id: string;
  label: string;
  items: TranslateItem[];
  targetLangs: string[];
  status: "pending" | "running" | "done" | "error";
  results?: TranslateResult;
  error?: string;
  onComplete?: (results: TranslateResult) => void;
};

type TranslationContextValue = {
  requestTranslation: (opts: {
    label: string;
    items: TranslateItem[];
    targetLangs?: string[];
    onComplete?: (results: TranslateResult) => void;
  }) => string;
  isTranslating: boolean;
  activeJobs: number;
};

const TranslationContext = createContext<TranslationContextValue>({
  requestTranslation: () => "",
  isTranslating: false,
  activeJobs: 0,
});

export function useTranslation() {
  return useContext(TranslationContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
let jobCounter = 0;

export function TranslationProvider({ children }: { children: ReactNode }) {
  const jobsRef = useRef<Map<string, TranslationJob>>(new Map());
  const [activeJobs, setActiveJobs] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; severity: "success" | "error" | "info"; message: string }>({ open: false, severity: "success", message: "" });

  const processJob = useCallback(async (job: TranslationJob) => {
    job.status = "running";
    setActiveJobs((n) => n + 1);

    try {
      const resp = await adminTranslate(job.items, job.targetLangs);
      job.status = "done";
      job.results = resp.results;

      // Call the callback if component is still interested
      if (job.onComplete && resp.results) {
        try {
          job.onComplete(resp.results);
        } catch {
          // callback may fail if component unmounted; that's ok
        }
      }

      setToast({ open: true, severity: "success", message: `"${job.label}" 번역 완료` });
    } catch (e: any) {
      job.status = "error";
      job.error = String(e?.message || e);
      setToast({ open: true, severity: "error", message: `번역 실패: ${job.error}` });
    } finally {
      setActiveJobs((n) => Math.max(0, n - 1));
      // Cleanup after a delay
      setTimeout(() => {
        jobsRef.current.delete(job.id);
      }, 30000);
    }
  }, []);

  const requestTranslation = useCallback(
    (opts: { label: string; items: TranslateItem[]; targetLangs?: string[]; onComplete?: (results: TranslateResult) => void }) => {
      const id = `tr_${++jobCounter}_${Date.now()}`;
      const job: TranslationJob = {
        id,
        label: opts.label,
        items: opts.items.filter((i) => i.text.trim()),
        targetLangs: opts.targetLangs || ["en", "ja", "zh-TW"],
        status: "pending",
        onComplete: opts.onComplete,
      };

      if (job.items.length === 0) {
        setToast({ open: true, severity: "info", message: "번역할 한국어 텍스트가 없습니다." });
        return id;
      }

      jobsRef.current.set(id, job);
      setToast({ open: true, severity: "info", message: `"${job.label}" 번역 시작...` });
      processJob(job);
      return id;
    },
    [processJob]
  );

  return (
    <TranslationContext.Provider value={{ requestTranslation, isTranslating: activeJobs > 0, activeJobs }}>
      {children}

      {/* Floating translation indicator */}
      {activeJobs > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            border: "1px solid",
            borderColor: "divider",
            px: 3,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 280,
          }}
        >
          <TranslateIcon sx={{ color: "primary.main", animation: "spin 2s linear infinite", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
              번역 중... ({activeJobs}건)
            </Typography>
            <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />
          </Box>
        </Box>
      )}

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          sx={{ fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          icon={<TranslateIcon />}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </TranslationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Reusable translate button component
// ---------------------------------------------------------------------------
export function TranslateButton({
  label,
  items,
  targetLangs,
  onComplete,
  size = "small",
  variant = "chip",
}: {
  label: string;
  items: TranslateItem[];
  targetLangs?: string[];
  onComplete: (results: TranslateResult) => void;
  size?: "small" | "medium";
  variant?: "chip" | "button";
}) {
  const { requestTranslation, isTranslating } = useTranslation();

  const handleClick = () => {
    requestTranslation({ label, items, targetLangs, onComplete });
  };

  if (variant === "chip") {
    return (
      <Chip
        icon={<TranslateIcon sx={{ fontSize: 14 }} />}
        label="AI 번역"
        size={size}
        onClick={handleClick}
        disabled={false}
        sx={{
          fontWeight: 700,
          fontSize: "0.7rem",
          cursor: "pointer",
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
          color: "info.dark",
          border: "1px solid",
          borderColor: (theme) => alpha(theme.palette.info.main, 0.3),
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.2),
            transform: "scale(1.05)",
          },
          transition: "all 0.15s ease",
        }}
      />
    );
  }

  return null;
}
