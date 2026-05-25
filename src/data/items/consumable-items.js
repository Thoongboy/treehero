"use strict";

export const FERTILIZERS = [
  { name: "Faint Fertilizer", xp: 18, value: 22, rarityProfile: "faint" },
  { name: "Rich Fertilizer", xp: 48, value: 55, rarityProfile: "rich" },
  { name: "Radiant Fertilizer", xp: 120, value: 130, rarityProfile: "radiant" }
];

export const CONSUMABLES = [
  { name: "Recovery Potion", value: 28, rarityProfile: "potion" },
  { name: "Ironbark Stew", value: 36, rarityProfile: "food" },
  { name: "Moon Sap Tonic", value: 48, rarityProfile: "tonic" },
  { name: "Secret Seed", value: 120, rarityProfile: "seed" }
];

export const FERTILIZER_RARITY_MULTS = {
  faint: {
    value: { common: 1, uncommon: 1.18, rare: 1.45, epic: 1.8 },
    treeXp: { common: 1, uncommon: 1.16, rare: 1.38, epic: 1.68 }
  },
  rich: {
    value: { common: 1, uncommon: 1.22, rare: 1.58, epic: 2.05 },
    treeXp: { common: 1, uncommon: 1.18, rare: 1.46, epic: 1.86 }
  },
  radiant: {
    value: { common: 1, uncommon: 1.3, rare: 1.82, epic: 2.55 },
    treeXp: { common: 1, uncommon: 1.22, rare: 1.58, epic: 2.12 }
  }
};

export const CONSUMABLE_RARITY_MULTS = {
  potion: {
    value: { common: 1, uncommon: 1.2, rare: 1.48, epic: 1.84 },
    use: { common: 1, uncommon: 1.18, rare: 1.42, epic: 1.72 }
  },
  food: {
    value: { common: 1, uncommon: 1.24, rare: 1.58, epic: 2.02 },
    use: { common: 1, uncommon: 1.15, rare: 1.34, epic: 1.62 }
  },
  tonic: {
    value: { common: 1, uncommon: 1.28, rare: 1.72, epic: 2.32 },
    use: { common: 1, uncommon: 1.18, rare: 1.45, epic: 1.84 }
  },
  seed: {
    value: { common: 1, uncommon: 1.5, rare: 2.25, epic: 3.4 },
    use: { common: 1, uncommon: 1, rare: 2, epic: 2 }
  }
};
