"use strict";

export const CRAFTING_RECIPES = [
  {
    id: "fertilizer",
    name: "Rich Fertilizer",
    need: { "Root Resin": 2, "Glowcap Fiber": 1 },
    output: { kind: "fertilizer", level: 5 }
  },
  {
    id: "weapon",
    name: "Dungeon Weapon",
    need: { "Ironwood Scrap": 3, "Monster Fang": 2 },
    output: { kind: "weapon", levelOffset: 1, boost: 0.25 }
  },
  {
    id: "armor",
    name: "Bark Armor",
    need: { "Ancient Bark": 2, "Glowcap Fiber": 2 },
    output: { kind: "armor", levelOffset: 1, boost: 0.2 }
  },
  {
    id: "table",
    name: "Enhance Table Upgrade",
    need: { "Rune Dust": 3, "Root Resin": 2 },
    upgrade: "enhance"
  }
];
