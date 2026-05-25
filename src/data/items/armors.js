"use strict";

export const ARMOR_TRAITS = {
  light: { defenseMult: 0.92, hpMult: 0.9, avoid: 0.03, reduction: 0.02, shieldHp: 0 },
  medium: { defenseMult: 1.08, hpMult: 1, avoid: 0.015, reduction: 0.04, shieldHp: 0 },
  heavy: { defenseMult: 1.25, hpMult: 1.15, avoid: 0, reduction: 0.07, shieldHp: 6 }
};

export const ARMORS = [
  { type: "Light Helm", slot: "helm", weight: "light", rarityProfile: "light" },
  { type: "Medium Helm", slot: "helm", weight: "medium", rarityProfile: "medium" },
  { type: "Heavy Helm", slot: "helm", weight: "heavy", rarityProfile: "heavy" },
  { type: "Light Armor", slot: "armor", weight: "light", rarityProfile: "light" },
  { type: "Medium Armor", slot: "armor", weight: "medium", rarityProfile: "medium" },
  { type: "Heavy Armor", slot: "armor", weight: "heavy", rarityProfile: "heavy" },
  { type: "Light Boots", slot: "boots", weight: "light", rarityProfile: "light" },
  { type: "Medium Boots", slot: "boots", weight: "medium", rarityProfile: "medium" },
  { type: "Heavy Boots", slot: "boots", weight: "heavy", rarityProfile: "heavy" },
  { type: "Light Gloves", slot: "gloves", weight: "light", rarityProfile: "light" },
  { type: "Medium Gloves", slot: "gloves", weight: "medium", rarityProfile: "medium" },
  { type: "Heavy Gloves", slot: "gloves", weight: "heavy", rarityProfile: "heavy" }
];

export const ARMOR_RARITY_MULTS = {
  light: {
    value: { common: 1, uncommon: 1.28, rare: 1.72, epic: 2.35 },
    defense: { common: 1, uncommon: 1.22, rare: 1.58, epic: 2.05 },
    hp: { common: 1, uncommon: 1.18, rare: 1.48, epic: 1.9 }
  },
  medium: {
    value: { common: 1, uncommon: 1.34, rare: 1.86, epic: 2.58 },
    defense: { common: 1, uncommon: 1.3, rare: 1.76, epic: 2.35 },
    hp: { common: 1, uncommon: 1.24, rare: 1.62, epic: 2.12 }
  },
  heavy: {
    value: { common: 1, uncommon: 1.42, rare: 2.04, epic: 2.9 },
    defense: { common: 1, uncommon: 1.38, rare: 1.92, epic: 2.68 },
    hp: { common: 1, uncommon: 1.32, rare: 1.78, epic: 2.42 }
  }
};
