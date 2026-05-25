"use strict";

export const QUESTS = [
  { id: "origin_forager", origin: "Forager", title: "Forager's First Mulch", text: "The tree trusts your satchel. Feed it once before the roots darken.", need: { kind: "fertilizer", qty: 1 }, reward: { gold: 45, xp: 25, treeXp: 60 } },
  { id: "origin_soldier", origin: "Soldier", title: "Soldier's Tally", text: "Bring proof that the first tunnel is held by your blade and shield.", need: { name: "Monster Fang", qty: 3 }, reward: { gold: 75, xp: 55, treeXp: 35 } },
  { id: "origin_hunter", origin: "Hunter", title: "Hunter's Mark", text: "Mark the den by returning with enough scraps to read its trail.", need: { kind: "material", qty: 3 }, reward: { gold: 65, xp: 50, treeXp: 40 } },
  { id: "origin_apprentice", origin: "Apprentice", title: "Apprentice's Glyph", text: "The sapling wants old dust for its first spell-ring.", need: { name: "Rune Dust", qty: 2 }, reward: { gold: 55, xp: 50, treeXp: 55 } },
  { id: "fertilizer", title: "Feed the First Roots", need: { kind: "fertilizer", qty: 2 }, reward: { gold: 60, xp: 40, treeXp: 35 } },
  { id: "fangs", title: "Bring Monster Fangs", need: { name: "Monster Fang", qty: 5 }, reward: { gold: 85, xp: 75, treeXp: 40 } },
  { id: "core", title: "Mycelium Heart", need: { name: "Deep Mycelium Core", qty: 1 }, reward: { gold: 180, xp: 140, treeXp: 130 } }
];

export const TREE_GROWTH = {
  levelsPerStage: 2,
  maxStage: 5,
  scaleBase: 0.38,
  scalePerStage: 0.12,
  trunkHeightBase: 58,
  trunkHeightPerStage: 16,
  crownWidthBase: 46,
  crownWidthPerStage: 24,
  crownHeightBase: 34,
  crownHeightPerStage: 15,
  skillBend: {
    rootVitality: 4,
    barkguard: 1.5,
    sapMight: -1.5,
    luckyLeaves: 0.7,
    quickSprout: -0.7
  }
};
