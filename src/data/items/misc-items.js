"use strict";

export const MATERIALS = [
  { name: "Ironwood Scrap", rarityProfile: "commonMaterial" },
  { name: "Monster Fang", rarityProfile: "monsterPart" },
  { name: "Glowcap Fiber", rarityProfile: "plantFiber" },
  { name: "Rune Dust", rarityProfile: "magicMaterial" },
  { name: "Root Resin", rarityProfile: "plantResin" },
  { name: "Ancient Bark", rarityProfile: "ancientMaterial" }
];

export const ACCESSORIES = [
  { type: "Ring", slot: "ring", rarityProfile: "ring" },
  { type: "Amulet", slot: "amulet", rarityProfile: "amulet" },
  { type: "Belt", slot: "belt", rarityProfile: "belt" }
];

export const RARITIES = [
  { name: "common", mult: 1, color: "#2c1a0f" },
  { name: "uncommon", mult: 1.35, color: "#2f6b2f" },
  { name: "rare", mult: 1.8, color: "#1f527d" },
  { name: "epic", mult: 2.35, color: "#6f348a" }
];

export const MATERIAL_RARITY_MULTS = {
  commonMaterial: { value: { common: 1, uncommon: 1.18, rare: 1.42, epic: 1.75 } },
  monsterPart: { value: { common: 1, uncommon: 1.24, rare: 1.56, epic: 1.95 } },
  plantFiber: { value: { common: 1, uncommon: 1.2, rare: 1.48, epic: 1.84 } },
  magicMaterial: { value: { common: 1, uncommon: 1.35, rare: 1.85, epic: 2.55 } },
  plantResin: { value: { common: 1, uncommon: 1.26, rare: 1.62, epic: 2.08 } },
  ancientMaterial: { value: { common: 1, uncommon: 1.38, rare: 1.96, epic: 2.78 } }
};

export const ACCESSORY_RARITY_MULTS = {
  ring: {
    value: { common: 1, uncommon: 1.3, rare: 1.82, epic: 2.52 },
    stat: { common: 1, uncommon: 1.22, rare: 1.56, epic: 2.02 },
    crit: { common: 1, uncommon: 1.18, rare: 1.46, epic: 1.85 }
  },
  amulet: {
    value: { common: 1, uncommon: 1.36, rare: 1.94, epic: 2.78 },
    stat: { common: 1, uncommon: 1.26, rare: 1.68, epic: 2.22 },
    crit: { common: 1, uncommon: 1.16, rare: 1.42, epic: 1.78 }
  },
  belt: {
    value: { common: 1, uncommon: 1.28, rare: 1.78, epic: 2.48 },
    stat: { common: 1, uncommon: 1.18, rare: 1.48, epic: 1.9 },
    crit: { common: 1, uncommon: 1.12, rare: 1.34, epic: 1.62 },
    slots: { common: 1, uncommon: 1.35, rare: 1.75, epic: 2.25 }
  }
};
