import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { getStaticT } from "../i18n";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: unknown }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const t = getStaticT();
    const err = this.state.error;
    const message =
      err instanceof Error ? `${err.name}: ${err.message}` : typeof err === "string" ? err : JSON.stringify(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 3, bgcolor: "#F6F7F9" }}>
        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            {t("error.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("error.description")}
          </Typography>
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "rgba(17,24,39,0.04)",
              border: "1px solid rgba(17,24,39,0.10)",
              maxHeight: 220,
              overflow: "auto",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
            {stack ? `\n\n${stack}` : ""}
          </Box>
          <Button variant="contained" sx={{ fontWeight: 900 }} onClick={() => window.location.reload()}>
            {t("error.reload")}
          </Button>
        </Box>
      </Box>
    );
  }
}
