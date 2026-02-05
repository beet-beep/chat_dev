import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { gameTheme } from "./theme/gameTheme";
import { GameApp } from "./game/GameApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={gameTheme}>
      <CssBaseline />
      <GameApp />
    </ThemeProvider>
  </React.StrictMode>
);


