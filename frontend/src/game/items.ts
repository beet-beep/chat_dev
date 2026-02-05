export type Rarity = "N" | "R" | "SR" | "SSR";
export type Slot = "hat" | "face" | "body";

export type CosmeticItem = {
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  icon: string; // simple emoji/icon for MVP
  image?: string; // real thumbnail image (svg url)
};

import hatLeaf from "./assets/items/hat_leaf.svg";
import hatCrown from "./assets/items/hat_crown.svg";
import hatParty from "./assets/items/hat_party.svg";
import faceStar from "./assets/items/face_star.svg";
import faceSunglasses from "./assets/items/face_sunglasses.svg";
import bodyCape from "./assets/items/body_cape.svg";
import bodyArmor from "./assets/items/body_armor.svg";

export const COSMETICS: CosmeticItem[] = [
  { id: "hat_leaf", name: "잎사귀 모자", slot: "hat", rarity: "N", icon: "🍃", image: hatLeaf },
  { id: "hat_crown", name: "작은 왕관", slot: "hat", rarity: "SR", icon: "👑", image: hatCrown },
  { id: "hat_party", name: "파티 모자", slot: "hat", rarity: "R", icon: "🥳", image: hatParty },
  { id: "face_star", name: "반짝 스티커", slot: "face", rarity: "N", icon: "✨", image: faceStar },
  { id: "face_sunglasses", name: "선글라스", slot: "face", rarity: "SR", icon: "🕶️", image: faceSunglasses },
  { id: "body_cape", name: "망토", slot: "body", rarity: "R", icon: "🧣", image: bodyCape },
  { id: "body_armor", name: "미니 아머", slot: "body", rarity: "SSR", icon: "🛡️", image: bodyArmor },
];

export function rarityWeight(r: Rarity) {
  if (r === "SSR") return 1;
  if (r === "SR") return 6;
  if (r === "R") return 18;
  return 75;
}



