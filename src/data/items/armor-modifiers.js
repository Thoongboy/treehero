"use strict";

export const ARMOR_STAT_VARIANCE = {
  common: { min: 0.94, max: 1.08 },
  uncommon: { min: 0.96, max: 1.12 },
  rare: { min: 0.98, max: 1.16 },
  epic: { min: 1, max: 1.22 }
};

export const ARMOR_MODIFIER_COUNTS = {
  common: { min: 1, max: 1, valueMult: 1.06 },
  uncommon: { min: 1, max: 2, valueMult: 1.14 },
  rare: { min: 2, max: 3, valueMult: 1.25 },
  epic: { min: 3, max: 4, valueMult: 1.42 }
};

export const ARMOR_MODIFIER_POOLS = {
  any: [
    {
      id: "reinforced_seams",
      name: "Reinforced Seams",
      weight: 9,
      effects: [{ type: "stat", stat: "defense", min: 1, max: 3, perLevel: 0.35, integer: true, label: "Defense" }]
    },
    {
      id: "root_lining",
      name: "Root Lining",
      weight: 8,
      effects: [{ type: "stat", stat: "hp", min: 4, max: 10, perLevel: 1.2, integer: true, label: "HP" }]
    },
    {
      id: "well_fitted",
      name: "Well Fitted",
      weight: 7,
      effects: [{ type: "stat", stat: "vit", min: 1, max: 2, perLevel: 0.1, integer: true, label: "VIT" }]
    },
    {
      id: "keeper_mark",
      name: "Keeper Mark",
      weight: 5,
      effects: [{ type: "valueMult", min: 1.1, max: 1.24, label: "Sell value" }]
    }
  ],
  light: [
    {
      id: "nimble_cut",
      name: "Nimble Cut",
      weight: 9,
      effects: [{ type: "stat", stat: "dex", min: 1, max: 2, perLevel: 0.14, integer: true, label: "DEX" }]
    },
    {
      id: "soft_padding",
      name: "Soft Padding",
      weight: 6,
      effects: [{ type: "stat", stat: "crit", min: 0.012, max: 0.026, perLevel: 0.0006, format: "percent", label: "Crit" }]
    }
  ],
  medium: [
    {
      id: "balanced_layers",
      name: "Balanced Layers",
      weight: 8,
      effects: [
        { type: "stat", stat: "defense", min: 1, max: 2, perLevel: 0.25, integer: true, label: "Defense" },
        { type: "stat", stat: "hp", min: 3, max: 7, perLevel: 0.9, integer: true, label: "HP" }
      ]
    },
    {
      id: "flexible_hide",
      name: "Flexible Hide",
      weight: 7,
      effects: [{ type: "stat", stat: "dex", min: 1, max: 1, perLevel: 0.1, integer: true, label: "DEX" }]
    }
  ],
  heavy: [
    {
      id: "ironbark_plate",
      name: "Ironbark Plate",
      weight: 10,
      effects: [{ type: "stat", stat: "defense", min: 2, max: 4, perLevel: 0.45, integer: true, label: "Defense" }]
    },
    {
      id: "deep_padding",
      name: "Deep Padding",
      weight: 8,
      effects: [{ type: "stat", stat: "hp", min: 7, max: 14, perLevel: 1.6, integer: true, label: "HP" }]
    },
    {
      id: "bracing_weight",
      name: "Bracing Weight",
      weight: 5,
      effects: [{ type: "stat", stat: "str", min: 1, max: 2, perLevel: 0.1, integer: true, label: "STR" }]
    }
  ],
  helm: [
    {
      id: "clear_brow",
      name: "Clear Brow",
      weight: 6,
      effects: [{ type: "stat", stat: "int", min: 1, max: 2, perLevel: 0.12, integer: true, label: "INT" }]
    }
  ],
  armor: [
    {
      id: "heartwood_core",
      name: "Heartwood Core",
      weight: 8,
      effects: [{ type: "stat", stat: "hp", min: 8, max: 18, perLevel: 1.8, integer: true, label: "HP" }]
    }
  ],
  boots: [
    {
      id: "trail_tread",
      name: "Trail Tread",
      weight: 8,
      effects: [{ type: "stat", stat: "dex", min: 1, max: 2, perLevel: 0.12, integer: true, label: "DEX" }]
    }
  ],
  gloves: [
    {
      id: "strikers_grip",
      name: "Striker's Grip",
      weight: 8,
      effects: [{ type: "stat", stat: "attack", min: 1, max: 3, perLevel: 0.35, integer: true, label: "Attack" }]
    }
  ]
};
