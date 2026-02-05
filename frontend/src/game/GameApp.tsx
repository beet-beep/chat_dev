import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, CircularProgress, Alert, Button } from "@mui/material";
import { GameShell } from "./ui/GameShell";
import { GameBottomNav } from "./GameBottomNav";

// Auth & State
import { AuthPage } from "./pages/AuthPage";
import { loadGameState, saveGameState, type FullGameState, createDefaultGameState } from "./state/gameState";

// Pages
import { NewHomePage } from "./pages/NewHomePage";
import { DressPage } from "./pages/DressPage";
import { NewGachaPage } from "./pages/NewGachaPage";
import { PlazaPage } from "./pages/PlazaPage";
import { ArcadePage } from "./pages/ArcadePage";
import { TapTapGamePage } from "./pages/TapTapGamePage";
import { MissionsPage } from "./pages/MissionsPage";
import { CommunityPage } from "./pages/CommunityPage";
import { ShopPage } from "./pages/ShopPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { WalletPage } from "./pages/WalletPage";
import { BillingPage } from "./pages/BillingPage";
import { BoxPage } from "./pages/BoxPage";
import { MarketPage } from "./pages/MarketPage";

// API
import { getMe } from "../api/support";
import type { Me } from "../api/types";
import { ApiError } from "../api/client";

function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const isGuest = typeof window !== "undefined" ? localStorage.getItem("is_guest") === "true" : false;
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(Boolean(token && !isGuest));
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    // 게스트 모드면 API 호출 안함
    if (isGuest) {
      setLoading(false);
      return;
    }

    if (!token) {
      setMe(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMe()
      .then((u) => {
        if (!cancelled) setMe(u as any);
        if (!cancelled) setError(null);
      })
      .catch((e) => {
        const status = e instanceof ApiError ? e.status : undefined;
        if (status === 401 || status === 403) {
          try {
            localStorage.removeItem("auth_token");
          } catch {}
          if (!cancelled) setMe(null);
          if (!cancelled) setError(null);
          return;
        }
        if (!cancelled) {
          setMe(null);
          // 게스트 모드로 폴백
          setError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, isGuest, retryKey]);

  const isAuthenticated = Boolean(token) || isGuest;

  return {
    me,
    loading,
    error,
    isAuthenticated,
    isGuest,
    retry: () => setRetryKey((x) => x + 1),
  };
}

function useGameState(userId?: string) {
  const userKey = userId || "guest";
  const [state, setState0] = useState<FullGameState>(() => loadGameState());

  useEffect(() => {
    setState0(loadGameState());
  }, [userKey]);

  const setState = useCallback((updater: (prev: FullGameState) => FullGameState) => {
    setState0((prev) => {
      const next = updater(prev);
      try {
        saveGameState(next);
      } catch {}
      return next;
    });
  }, []);

  return { state, setState };
}

function GameAuthed({ me, isGuest, onRefreshMe }: { me: Me | null; isGuest: boolean; onRefreshMe: () => void }) {
  const nav = useNavigate();
  const userId = me?.profile?.game_uuid || me?.id?.toString() || "guest";
  const { state, setState } = useGameState(userId);

  // 레거시 state 어댑터 (기존 페이지 호환용)
  const legacyState = useMemo(() => ({
    currency: state.currency,
    equipped: state.slime.equipped,
    owned: Object.fromEntries(
      Object.entries(state.inventory).map(([id, item]) => [id, item.quantity])
    ),
    gacha_history: state.gachaHistory.map((h) => ({
      item_id: h.itemId,
      at: h.timestamp,
    })),
    ledger: [],
  }), [state]);

  const legacySetState = useCallback((updater: (prev: any) => any) => {
    // 레거시 업데이트 처리
    setState((prev) => {
      const legacy = {
        currency: prev.currency,
        equipped: prev.slime.equipped,
        owned: Object.fromEntries(
          Object.entries(prev.inventory).map(([id, item]) => [id, item.quantity])
        ),
      };
      const updated = updater(legacy);
      return {
        ...prev,
        currency: updated.currency || prev.currency,
        slime: {
          ...prev.slime,
          equipped: updated.equipped || prev.slime.equipped,
        },
        inventory: Object.fromEntries(
          Object.entries(updated.owned || {}).map(([id, qty]) => [
            id,
            prev.inventory[id] || { itemId: id, quantity: qty as number, acquiredAt: new Date().toISOString(), source: "shop" as const },
          ])
        ),
      };
    });
  }, [setState]);

  // 지원 문의
  function onSupport() {
    try {
      const snapshot = {
        source: "game",
        at: new Date().toISOString(),
        profile: {
          nickname: me?.profile?.display_name || me?.first_name || "게스트",
          email: me?.email || "",
          uuid: userId,
        },
        game: {
          currency: state.currency,
          level: state.slime.level,
          equipped: state.slime.equipped,
        },
        entry_path: "/game",
      };
      localStorage.setItem("joody_game_context_v1", JSON.stringify(snapshot));
    } catch {}
    window.location.href = `/faq?from=game`;
  }

  const displayName = me?.profile?.display_name || me?.first_name || "게스트";

  return (
    <GameShell bottomNav={<GameBottomNav />}>
      <Routes>
        {/* 메인 */}
        <Route path="/home" element={<NewHomePage state={state} setState={setState} />} />

        {/* 코디 */}
        <Route path="/dress" element={<DressPage state={state} setState={setState} />} />

        {/* 가챠 */}
        <Route path="/gacha" element={<NewGachaPage state={state} setState={setState} />} />

        {/* 광장 */}
        <Route path="/plaza" element={<PlazaPage state={state} setState={setState} />} />

        {/* 오락실 */}
        <Route path="/arcade" element={<ArcadePage state={legacyState as any} />} />
        <Route path="/arcade/tap_tap" element={<TapTapGamePage state={legacyState as any} setState={legacySetState} />} />

        {/* 미션/퀘스트 */}
        <Route path="/quests" element={<MissionsPage state={legacyState as any} setState={legacySetState} />} />
        <Route path="/missions" element={<MissionsPage state={legacyState as any} setState={legacySetState} />} />

        {/* 상점 (레거시) */}
        <Route path="/shop" element={<ShopPage state={legacyState as any} setState={legacySetState} />} />

        {/* 인벤토리 (레거시) */}
        <Route
          path="/inventory"
          element={
            <InventoryPage
              state={legacyState as any}
              onEquip={(slot, itemId) =>
                legacySetState((prev: any) => ({
                  ...prev,
                  equipped: { ...prev.equipped, [slot]: itemId },
                }))
              }
            />
          }
        />

        {/* 뽑기 (레거시) */}
        <Route path="/box" element={<BoxPage state={legacyState as any} setState={legacySetState} />} />

        {/* 커뮤니티 */}
        <Route path="/community" element={<CommunityPage author={displayName} />} />

        {/* 마켓 (레거시) */}
        <Route
          path="/market"
          element={
            <MarketPage
              state={legacyState as any}
              setState={legacySetState}
              sellerName={displayName}
              sellerKey={userId}
            />
          }
        />

        {/* 지갑 (레거시) */}
        <Route path="/wallet" element={<WalletPage state={legacyState as any} />} />

        {/* 결제 (레거시) */}
        <Route path="/billing" element={me ? <BillingPage me={me} state={legacyState as any} /> : <Navigate to="/home" />} />

        {/* 설정 */}
        <Route
          path="/settings"
          element={
            <SettingsPage
              me={me as any}
              onGo={(p) => nav(p)}
              onSupport={onSupport}
              onLogout={() => {
                try {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("is_guest");
                } catch {}
                nav("/login");
                window.location.reload();
              }}
            />
          }
        />

        {/* 프로필 */}
        <Route
          path="/profile"
          element={
            <ProfilePage
              me={me as any}
              state={legacyState as any}
              onRefreshMe={onRefreshMe}
              onOpenSettings={() => nav("/settings")}
              onLogout={() => {
                try {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("is_guest");
                } catch {}
                nav("/login");
                window.location.reload();
              }}
            />
          }
        />

        {/* 업적/친구 (placeholder) */}
        <Route path="/achievements" element={<MissionsPage state={legacyState as any} setState={legacySetState} />} />
        <Route path="/friends" element={<PlazaPage state={state} setState={setState} />} />
        <Route path="/notifications" element={<MissionsPage state={legacyState as any} setState={legacySetState} />} />

        {/* 기본 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </GameShell>
  );
}

export function GameApp() {
  const { me, loading, error, isAuthenticated, isGuest, retry } = useAuth();

  return (
    <HashRouter>
      <Routes>
        {/* 로그인/회원가입 */}
        <Route
          path="/login"
          element={
            <AuthPage
              onAuthSuccess={() => {
                window.location.replace("/game.html#/home");
              }}
            />
          }
        />

        {/* 메인 라우트 */}
        <Route
          path="/*"
          element={
            loading ? (
              <GameShell bottomNav={<Box />}>
                <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
                  <CircularProgress />
                </Box>
              </GameShell>
            ) : isAuthenticated ? (
              <GameAuthed me={me} isGuest={isGuest} onRefreshMe={retry} />
            ) : error ? (
              <GameShell bottomNav={<Box />}>
                <Box sx={{ px: 2.5, pt: 3 }}>
                  <Alert severity="warning">{error}</Alert>
                  <Button sx={{ mt: 2, fontWeight: 900 }} variant="contained" onClick={retry} fullWidth>
                    다시 시도
                  </Button>
                  <Button
                    sx={{ mt: 1, fontWeight: 900 }}
                    variant="outlined"
                    onClick={() => window.location.replace("/game.html#/login")}
                    fullWidth
                  >
                    로그인 화면으로
                  </Button>
                </Box>
              </GameShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </HashRouter>
  );
}
