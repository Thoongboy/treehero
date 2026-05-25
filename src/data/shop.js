"use strict";

export const SHOP_SETTINGS = {
  baseSlots: 4,
  slotsPerUpgrade: 1,
  maxSlots: 7,
  rarityBoostPerUpgrade: 0.08
};

export const SHOP_STOCK = [
  { kind: "weapon", boost: 0.12 },
  { kind: "armor", boost: 0.12 },
  { kind: "accessory", boost: 0.18 },
  { kind: "consumable", boost: 0 }
];

export const SHOP_UPGRADE_QUESTS = [
  {
    level: 1,
    title: "Better Grove Wares",
    need: { "Rune Dust": 2, "Ancient Bark": 2 },
    reward: { slots: 1, rarityBoost: 0.08 }
  }
];
