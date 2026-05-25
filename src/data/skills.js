"use strict";

export const TREE_SKILLS = [
  { id: "sapMight", name: "Sap Might", max: 5, cost: 1, text: "+3 attack", stat: "attack", amount: 3 },
  { id: "barkguard", name: "Barkguard", max: 5, cost: 1, text: "+2 defense", stat: "defense", amount: 2 },
  { id: "rootVitality", name: "Root Vitality", max: 5, cost: 1, text: "+14 max HP", stat: "hp", amount: 14 },
  { id: "luckyLeaves", name: "Lucky Leaves", max: 4, cost: 2, text: "+10% loot luck", stat: "loot", amount: 0.1 },
  { id: "quickSprout", name: "Quick Sprout", max: 3, cost: 2, text: "+8% XP", stat: "xp", amount: 0.08 },
  { id: "deepRoots", name: "Deep Roots", max: 3, cost: 2, text: "Lower death fee", stat: "fee", amount: 0.12 }
];

export const POWER_RATING_WEIGHTS = {
  attack: 1.65,
  defense: 1.25,
  maxHp: 0.26,
  crit: 120,
  speed: 18,
  loot: 22
};
