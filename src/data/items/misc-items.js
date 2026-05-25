"use strict";

export const SLOTS = ["weapon", "offhand", "helm", "armor", "boots", "gloves", "ring", "amulet", "belt"];

export const MATERIALS = [
  "Ironwood Scrap",
  "Monster Fang",
  "Glowcap Fiber",
  "Rune Dust",
  "Root Resin",
  "Ancient Bark"
];

export const ACCESSORIES = [
  { type: "Ring", slot: "ring" },
  { type: "Amulet", slot: "amulet" },
  { type: "Belt", slot: "belt" }
];

export const RARITIES = [
  { name: "common", mult: 1, color: "#2c1a0f" },
  { name: "uncommon", mult: 1.35, color: "#2f6b2f" },
  { name: "rare", mult: 1.8, color: "#1f527d" },
  { name: "epic", mult: 2.35, color: "#6f348a" }
];
