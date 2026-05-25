"use strict";

export const PLAYER_DEFAULTS = {
  name: "Ash",
  origin: "Forager",
  level: 1,
  xp: 0,
  gold: 80,
  hp: 120,
  base: { str: 5, dex: 5, int: 5, vit: 6 },
  points: 0,
  startPosition: { x: 8.5, y: 11.5, dir: 0, moveDir: 0, attackCd: 0, attackT: 0, invuln: 0 }
};

export const SLOTS = ["weapon", "offhand", "helm", "armor", "boots", "gloves", "ring", "amulet", "belt"];

export const HERO_PROGRESSION = {
  statPointsPerLevel: 3,
  hpGainWhenAllocatingVit: 8,
  secretSeedStats: ["str", "dex", "int", "vit"]
};

export const ORIGIN_STARTS = {
  Forager: {
    base: { str: 4, dex: 6, int: 5, vit: 6 },
    gold: 95,
    message: "You wake as a root-forager: spear, pouch, and mulch ready. The tree asks for fertilizer first.",
    equipment: [
      { kind: "weapon", type: "Spear", options: { name: "Rootfork Spear", stats: { attack: 8, dex: 1 }, cleave: 2, value: 42 } },
      { kind: "armor", type: "Light Armor", options: { name: "Patchwork Jerkin", stats: { defense: 4, hp: 8 }, value: 32 } },
      { kind: "accessory", type: "Belt", options: { name: "Forager Pouch", stats: { dex: 1 }, slots: 12, value: 48 } }
    ],
    inventory: [
      { kind: "fertilizer", qty: 1 },
      { kind: "material", name: "Root Resin", qty: 1 },
      { kind: "material", name: "Glowcap Fiber", qty: 1 },
      { kind: "consumable", name: "Recovery Potion", qty: 2 },
      { kind: "consumable", name: "Ironbark Stew", qty: 1 }
    ]
  },
  Soldier: {
    base: { str: 7, dex: 4, int: 3, vit: 7 },
    gold: 65,
    message: "You arrive as a root-soldier: mail, sword, and buckler. The tree wants fangs from the first tunnel.",
    equipment: [
      { kind: "weapon", type: "Sword", options: { name: "Militia Sword", stats: { attack: 10, str: 1 }, cleave: 2, value: 44 } },
      { kind: "weapon", type: "Shield", options: { name: "Oath Buckler", stats: { defense: 7, hp: 10 }, value: 42 } },
      { kind: "armor", type: "Heavy Armor", options: { name: "Dented Mail", stats: { defense: 8, hp: 18 }, value: 52 } }
    ],
    inventory: [
      { kind: "material", name: "Monster Fang", qty: 1 },
      { kind: "consumable", name: "Recovery Potion", qty: 2 }
    ]
  },
  Hunter: {
    base: { str: 4, dex: 8, int: 4, vit: 5 },
    gold: 75,
    message: "You step in as a tunnel-hunter: crossbow loaded, boots quiet. Bring back dungeon scraps for the tree's map.",
    equipment: [
      { kind: "weapon", type: "Crossbow", options: { name: "Yew Crossbow", stats: { attack: 9, dex: 2 }, effect: "pierce", pierce: 1, value: 48 } },
      { kind: "armor", type: "Light Armor", options: { name: "Stalker Leathers", stats: { defense: 4, dex: 1, hp: 6 }, value: 38 } },
      { kind: "armor", type: "Light Boots", options: { name: "Trail Boots", stats: { defense: 2, dex: 1 }, value: 28 } }
    ],
    inventory: [
      { kind: "material", name: "Monster Fang", qty: 1 },
      { kind: "material", name: "Ironwood Scrap", qty: 1 },
      { kind: "consumable", name: "Recovery Potion", qty: 2 },
      { kind: "consumable", name: "Ironbark Stew", qty: 1 }
    ]
  },
  Apprentice: {
    base: { str: 3, dex: 5, int: 8, vit: 5 },
    gold: 85,
    message: "You begin as a sap-apprentice: wand crackling with lightning. The tree asks for rune dust.",
    equipment: [
      { kind: "weapon", type: "Wand", options: { name: "Spark-Twig Wand", stats: { attack: 7, int: 2 }, element: "lightning", chain: 2, chainRange: 2.85, chainDamage: 0.62, value: 50 } },
      { kind: "armor", type: "Medium Armor", options: { name: "Padded Robe", stats: { defense: 3, int: 1, hp: 8 }, value: 36 } },
      { kind: "accessory", type: "Amulet", options: { name: "Apprentice Charm", stats: { int: 1 }, value: 34 } }
    ],
    inventory: [
      { kind: "material", name: "Rune Dust", qty: 1 },
      { kind: "consumable", name: "Recovery Potion", qty: 1 },
      { kind: "consumable", name: "Moon Sap Tonic", qty: 1 }
    ]
  }
};
