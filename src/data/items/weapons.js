"use strict";

export const WEAPONS = [
  { type: "Sword", class: "Sword", slot: "weapon", range: 1.62, speed: 0.42, stat: "str", mode: "melee", arc: 0.9, dropWeight: 16, rarityProfile: "balanced" },
  { type: "Bow", class: "Bow", slot: "weapon", range: 7.2, speed: 0.58, stat: "dex", mode: "ranged", projectile: "arrow", projectileSpeed: 9.5, color: "#d8b56d", size: 7, dropWeight: 12, rarityProfile: "ranged" },
  { type: "Shield", class: "Shield", slot: "offhand", range: 1, speed: 0.52, stat: "vit", mode: "guard", dropWeight: 10, rarityProfile: "shield" },
  { type: "Two-Handed Sword", class: "Greatsword", slot: "weapon", range: 2.06, speed: 0.72, stat: "str", mode: "melee", arc: 1.15, dropWeight: 8, rarityProfile: "heavy" },
  { type: "Axe", class: "Axe", slot: "weapon", range: 1.78, speed: 0.68, stat: "str", mode: "melee", arc: 1.0, dropWeight: 10, rarityProfile: "heavy" },
  { type: "Spear", class: "Spear", slot: "weapon", range: 2.7, speed: 0.54, stat: "dex", mode: "melee", arc: 0.42, dropWeight: 12, rarityProfile: "reach" },
  { type: "Crossbow", class: "Crossbow", slot: "weapon", range: 8.2, speed: 0.86, stat: "dex", mode: "ranged", projectile: "bolt", projectileSpeed: 12.5, color: "#f0d9a2", size: 8, dropWeight: 8, rarityProfile: "heavyRanged" },
  { type: "Magic Staff", class: "Staff", slot: "weapon", range: 6.8, speed: 0.66, stat: "int", mode: "magic", projectile: "orb", projectileSpeed: 7.8, color: "#8fd9ff", size: 12, pierce: 1, dropWeight: 7, rarityProfile: "staff" },
  { type: "Wand", class: "Wand", slot: "weapon", range: 5.7, speed: 0.34, stat: "int", mode: "magic", projectile: "spark", projectileSpeed: 10.8, color: "#c79cf2", size: 8, dropWeight: 9, rarityProfile: "wand" }
];

export const WEAPON_RARITY_MULTS = {
  balanced: {
    value: { common: 1, uncommon: 1.35, rare: 1.9, epic: 2.65 },
    attack: { common: 1, uncommon: 1.34, rare: 1.82, epic: 2.45 },
    stat: { common: 1, uncommon: 1.12, rare: 1.28, epic: 1.48 }
  },
  heavy: {
    value: { common: 1, uncommon: 1.42, rare: 2.05, epic: 2.9 },
    attack: { common: 1, uncommon: 1.4, rare: 1.95, epic: 2.75 },
    stat: { common: 1, uncommon: 1.1, rare: 1.24, epic: 1.42 }
  },
  reach: {
    value: { common: 1, uncommon: 1.32, rare: 1.82, epic: 2.5 },
    attack: { common: 1, uncommon: 1.3, rare: 1.72, epic: 2.28 },
    stat: { common: 1, uncommon: 1.15, rare: 1.34, epic: 1.58 }
  },
  ranged: {
    value: { common: 1, uncommon: 1.36, rare: 1.92, epic: 2.7 },
    attack: { common: 1, uncommon: 1.3, rare: 1.74, epic: 2.35 },
    stat: { common: 1, uncommon: 1.16, rare: 1.36, epic: 1.62 }
  },
  heavyRanged: {
    value: { common: 1, uncommon: 1.43, rare: 2.08, epic: 2.95 },
    attack: { common: 1, uncommon: 1.38, rare: 1.9, epic: 2.65 },
    stat: { common: 1, uncommon: 1.12, rare: 1.3, epic: 1.54 }
  },
  staff: {
    value: { common: 1, uncommon: 1.42, rare: 2.05, epic: 2.95 },
    attack: { common: 1, uncommon: 1.36, rare: 1.88, epic: 2.7 },
    stat: { common: 1, uncommon: 1.16, rare: 1.38, epic: 1.68 }
  },
  wand: {
    value: { common: 1, uncommon: 1.33, rare: 1.86, epic: 2.58 },
    attack: { common: 1, uncommon: 1.28, rare: 1.72, epic: 2.32 },
    stat: { common: 1, uncommon: 1.18, rare: 1.4, epic: 1.72 }
  },
  shield: {
    value: { common: 1, uncommon: 1.3, rare: 1.78, epic: 2.42 },
    defense: { common: 1, uncommon: 1.32, rare: 1.76, epic: 2.35 },
    hp: { common: 1, uncommon: 1.28, rare: 1.68, epic: 2.2 }
  }
};

export const ELEMENTS = {
  fire: { name: "Fire", color: "#ff7a3d", text: "Burning burst damages nearby enemies." },
  ice: { name: "Ice", color: "#8fd9ff", text: "Frost slows and briefly locks enemies." },
  lightning: { name: "Lightning", color: "#f4d86a", text: "Lightning chains between enemies." }
};
