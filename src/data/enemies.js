"use strict";

export const MONSTER_ARCHETYPES = [
  { id: "gnawer", name: "Gnawer", asset: "monster.gnawer", hp: 0.95, attack: 1, defense: 0.85, speed: 2.05, range: 1.05, radius: 0.42, attackType: "melee", behavior: "chase", weight: 4 },
  { id: "crawler", name: "Moss Crawler", asset: "monster.crawler", hp: 0.78, attack: 0.86, defense: 0.7, speed: 2.55, range: 0.95, radius: 0.38, attackType: "melee", behavior: "rush", weight: 3 },
  { id: "shade", name: "Root Shade", asset: "monster.shade", hp: 0.9, attack: 1.18, defense: 0.75, speed: 2.2, range: 1.15, radius: 0.42, attackType: "melee", behavior: "flank", weight: 2 },
  { id: "spitter", name: "Spore Imp", asset: "monster.spitter", hp: 0.74, attack: 0.92, defense: 0.7, speed: 1.55, range: 4.4, radius: 0.4, attackType: "ranged", behavior: "kite", effect: "spore", weight: 2 },
  { id: "thornback", name: "Thornback", asset: "monster.thornback", hp: 1.35, attack: 0.95, defense: 1.45, speed: 1.35, range: 1.25, radius: 0.52, attackType: "melee", behavior: "tank", weight: 1 }
];

export const BOSS_ARCHETYPE = {
  id: "guardian",
  name: "Root-Eater Guardian",
  asset: "monster.guardian",
  hp: 5.8,
  attack: 1.95,
  defense: 1.9,
  speed: 1.12,
  range: 1.7,
  radius: 0.74,
  attackType: "melee",
  behavior: "boss"
};

export const ENEMY_SCALING = {
  hpBase: 36,
  hpPerThreat: 15,
  attackBase: 7,
  attackPerThreat: 1.95,
  defenseBase: 2,
  defensePerThreat: 1.05,
  normalAttackMult: 1,
  eliteAttackMult: 1.14,
  bossAttackMult: 0.94,
  eliteDefenseMult: 1.16,
  eliteHpMult: 1.34,
  eliteSpeedMult: 1.06,
  eliteRadiusMult: 1.12,
  heroDefenseDamageReduction: 0.72,
  meleeDamageVariance: 3,
  rangedDamageVariance: 2,
  minimumDamage: 1
};
