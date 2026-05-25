"use strict";

export const ARMOR_TRAITS = {
  light: { defenseMult: 0.92, hpMult: 0.9, avoid: 0.03, reduction: 0.02, shieldHp: 0 },
  medium: { defenseMult: 1.08, hpMult: 1, avoid: 0.015, reduction: 0.04, shieldHp: 0 },
  heavy: { defenseMult: 1.25, hpMult: 1.15, avoid: 0, reduction: 0.07, shieldHp: 6 }
};

export const ARMORS = [
  { type: "Light Helm", slot: "helm", weight: "light" },
  { type: "Medium Helm", slot: "helm", weight: "medium" },
  { type: "Heavy Helm", slot: "helm", weight: "heavy" },
  { type: "Light Armor", slot: "armor", weight: "light" },
  { type: "Medium Armor", slot: "armor", weight: "medium" },
  { type: "Heavy Armor", slot: "armor", weight: "heavy" },
  { type: "Light Boots", slot: "boots", weight: "light" },
  { type: "Medium Boots", slot: "boots", weight: "medium" },
  { type: "Heavy Boots", slot: "boots", weight: "heavy" },
  { type: "Light Gloves", slot: "gloves", weight: "light" },
  { type: "Medium Gloves", slot: "gloves", weight: "medium" },
  { type: "Heavy Gloves", slot: "gloves", weight: "heavy" }
];
