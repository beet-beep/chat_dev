import type { CosmeticItem, Slot } from "./items";
import { COSMETICS, rarityWeight } from "./items";
import { clampInt, safeJsonParse } from "./utils";

export type Currency = { gold: number; gems: number };

export type TxKind =
  | "gacha_open"
  | "shop_gem_pack"
  | "shop_item_buy"
  | "exchange_gem_to_gold"
  | "market_list"
  | "market_sale"
  | "market_cancel"
  | "market_buy"
  | "equip_change"
  | "bot_trade"
  | "mission_reward";

export type Tx = {
  id: string;
  at: string;
  kind: TxKind;
  delta: Partial<Currency>; // +/- changes applied
  meta?: any;
};

export type GameState = {
  currency: Currency;
  owned: Record<string, number>; // itemId -> count
  equipped: Record<Slot, string | null>;
  gacha_history: { at: string; item_id: string }[];
  ledger: Tx[];
  mission_claimed: Record<string, string>; // missionId -> YYYY-MM-DD last claimed
  updated_at: string;
};

export function gameKey(userKey: string) {
  return `joody_game_state_v1:${userKey}`;
}

export function loadGameState(userKey: string): GameState {
  const raw = localStorage.getItem(gameKey(userKey));
  const parsed = safeJsonParse<GameState>(raw);
  if (parsed && typeof parsed === "object") return normalize(parsed);
  const now = new Date().toISOString();
  return {
    currency: { gold: 250, gems: 10 },
    owned: {},
    equipped: { hat: null, face: null, body: null },
    gacha_history: [],
    ledger: [],
    mission_claimed: {},
    updated_at: now,
  };
}

export function saveGameState(userKey: string, next: GameState) {
  localStorage.setItem(gameKey(userKey), JSON.stringify(normalize(next)));
}

export function normalize(s: GameState): GameState {
  const now = new Date().toISOString();
  const currency = {
    gold: clampInt(s.currency?.gold, 0, 1_000_000_000),
    gems: clampInt(s.currency?.gems, 0, 1_000_000_000),
  };
  const owned: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.owned || {})) {
    const n = clampInt(v, 0, 9999);
    if (n > 0) owned[k] = n;
  }
  const equipped = {
    hat: (s.equipped?.hat as any) || null,
    face: (s.equipped?.face as any) || null,
    body: (s.equipped?.body as any) || null,
  } as GameState["equipped"];
  const mission_claimed: Record<string, string> =
    s && typeof (s as any).mission_claimed === "object" && (s as any).mission_claimed
      ? { ...(s as any).mission_claimed }
      : {};

  return {
    currency,
    owned,
    equipped,
    gacha_history: Array.isArray(s.gacha_history) ? s.gacha_history.slice(-50) : [],
    ledger: Array.isArray((s as any).ledger) ? ((s as any).ledger as Tx[]).slice(-200) : [],
    mission_claimed,
    updated_at: now,
  };
}

export function getOwnedItems(state: GameState): CosmeticItem[] {
  const ids = Object.keys(state.owned || {});
  return COSMETICS.filter((c) => ids.includes(c.id));
}

export function canAfford(state: GameState, cost: Partial<Currency>) {
  return (state.currency.gold ?? 0) >= (cost.gold ?? 0) && (state.currency.gems ?? 0) >= (cost.gems ?? 0);
}

export function spend(state: GameState, cost: Partial<Currency>): GameState {
  return normalize({
    ...state,
    currency: {
      gold: (state.currency.gold ?? 0) - (cost.gold ?? 0),
      gems: (state.currency.gems ?? 0) - (cost.gems ?? 0),
    },
  });
}

export function recordTx(state: GameState, tx: Omit<Tx, "id" | "at"> & Partial<Pick<Tx, "id" | "at">>): GameState {
  const id = tx.id || String(Date.now());
  const at = tx.at || new Date().toISOString();
  const next = { id, at, kind: tx.kind, delta: tx.delta || {}, meta: tx.meta };
  return normalize({ ...state, ledger: [...(state.ledger || []), next].slice(-200) });
}

export function grant(state: GameState, itemId: string, count = 1): GameState {
  const owned = { ...(state.owned || {}) };
  owned[itemId] = (owned[itemId] || 0) + Math.max(1, count);
  return normalize({ ...state, owned });
}

export function take(state: GameState, itemId: string, count = 1): GameState {
  const owned = { ...(state.owned || {}) };
  const cur = owned[itemId] || 0;
  const next = Math.max(0, cur - Math.max(1, count));
  if (next <= 0) delete owned[itemId];
  else owned[itemId] = next;
  return normalize({ ...state, owned });
}

export function equip(state: GameState, slot: Slot, itemId: string | null): GameState {
  return normalize({ ...state, equipped: { ...state.equipped, [slot]: itemId } as any });
}

export function equipWithTx(state: GameState, slot: Slot, itemId: string | null): GameState {
  const next = equip(state, slot, itemId);
  return recordTx(next, { kind: "equip_change", delta: {}, meta: { slot, item_id: itemId } });
}

export function drawGacha(state: GameState): { next: GameState; item: CosmeticItem } {
  // Weighted by rarity; pick one cosmetic
  const pool = COSMETICS;
  const total = pool.reduce((sum, it) => sum + rarityWeight(it.rarity), 0);
  let r = Math.random() * total;
  let pick = pool[0];
  for (const it of pool) {
    r -= rarityWeight(it.rarity);
    if (r <= 0) {
      pick = it;
      break;
    }
  }
  const next = normalize({
    ...grant(state, pick.id, 1),
    gacha_history: [...(state.gacha_history || []), { at: new Date().toISOString(), item_id: pick.id }].slice(-50),
  });
  return { next, item: pick };
}


