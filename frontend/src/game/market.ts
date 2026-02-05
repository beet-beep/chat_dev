import { safeJsonParse } from "./utils";

export type Offer = {
  id: string;
  seller_key: string;
  seller_name: string;
  item_id: string;
  price_gold: number;
  created_at: string;
};

const KEY = "joody_game_market_offers_v1";
const PAYOUTS_KEY = "joody_game_market_payouts_v1"; // seller_key -> pending gold

export function loadOffers(): Offer[] {
  const parsed = safeJsonParse<Offer[]>(localStorage.getItem(KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveOffers(offers: Offer[]) {
  localStorage.setItem(KEY, JSON.stringify(offers.slice(-200)));
}

export function loadPayouts(): Record<string, number> {
  const parsed = safeJsonParse<Record<string, number>>(localStorage.getItem(PAYOUTS_KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function savePayouts(payouts: Record<string, number>) {
  localStorage.setItem(PAYOUTS_KEY, JSON.stringify(payouts));
}


