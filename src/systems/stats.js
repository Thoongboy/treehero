"use strict";

import { POWER_RATING_WEIGHTS } from "../data/skills.js";

export function collectEquipmentStats(equipment = {}) {
  const equip = {};
  for (const item of Object.values(equipment)) {
    if (!item?.stats) continue;
    for (const [key, value] of Object.entries(item.stats)) {
      equip[key] = (equip[key] || 0) + value;
    }
  }
  return equip;
}

export function calculateHeroStats(hero = {}, tree = {}) {
  const equip = collectEquipmentStats(hero.equipment);
  const skillRank = (id) => tree.skills?.[id] || 0;
  const base = hero.base || {};
  const str = (base.str || 0) + (equip.str || 0);
  const dex = (base.dex || 0) + (equip.dex || 0);
  const int = (base.int || 0) + (equip.int || 0);
  const vit = (base.vit || 0) + (equip.vit || 0);
  const stats = {
    str,
    dex,
    int,
    vit,
    attack: Math.floor(7 + str * 2.2 + dex * 0.8 + int * 0.8 + (equip.attack || 0) + skillRank("sapMight") * 3),
    defense: Math.floor(2 + vit * 1.2 + dex * 0.45 + (equip.defense || 0) + skillRank("barkguard") * 2),
    maxHp: Math.floor(72 + vit * 8 + (equip.hp || 0) + skillRank("rootVitality") * 14),
    speed: 3.45 + dex * 0.035,
    crit: Math.min(0.42, 0.04 + dex * 0.008 + (equip.crit || 0)),
    loot: skillRank("luckyLeaves") * 0.1,
    xp: skillRank("quickSprout") * 0.08,
    fee: skillRank("deepRoots") * 0.12
  };
  stats.power = calculatePowerRating(stats);
  return stats;
}

export function calculatePowerRating(stats, weights = POWER_RATING_WEIGHTS) {
  return Math.max(1, Math.round(
    stats.attack * weights.attack +
    stats.defense * weights.defense +
    stats.maxHp * weights.maxHp +
    stats.crit * weights.crit +
    stats.speed * weights.speed +
    stats.loot * weights.loot
  ));
}
