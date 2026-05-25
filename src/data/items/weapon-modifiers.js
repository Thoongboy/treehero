"use strict";

export const WEAPON_STAT_VARIANCE = {
  common: { min: 0.92, max: 1.08 },
  uncommon: { min: 0.94, max: 1.12 },
  rare: { min: 0.96, max: 1.16 },
  epic: { min: 0.98, max: 1.22 }
};

export const WEAPON_MODIFIER_COUNTS = {
  common: { min: 1, max: 1, valueMult: 1.08 },
  uncommon: { min: 1, max: 2, valueMult: 1.16 },
  rare: { min: 2, max: 3, valueMult: 1.28 },
  epic: { min: 3, max: 4, valueMult: 1.46 }
};

export const WEAPON_MODIFIER_POOLS = {
  any: [
    {
      id: "sure_grip",
      name: "Sure Grip",
      weight: 7,
      effects: [{ type: "stat", stat: "crit", min: 0.015, max: 0.035, perLevel: 0.0008, format: "percent", label: "Crit" }]
    },
    {
      id: "balanced_weight",
      name: "Balanced Weight",
      weight: 6,
      effects: [{ type: "propertyMult", field: "speed", min: 0.91, max: 0.97, label: "Faster attacks", invertPercent: true }]
    },
    {
      id: "seasoned_core",
      name: "Seasoned Core",
      weight: 6,
      effects: [{ type: "valueMult", min: 1.12, max: 1.28, label: "Sell value" }]
    }
  ],
  melee: [
    {
      id: "honed_edge",
      name: "Honed Edge",
      weight: 10,
      effects: [{ type: "stat", stat: "attack", min: 2, max: 4, perLevel: 0.55, integer: true, label: "Attack" }]
    },
    {
      id: "brutal_weight",
      name: "Brutal Weight",
      weight: 7,
      effects: [{ type: "stat", stat: "str", min: 1, max: 2, perLevel: 0.12, integer: true, label: "STR" }]
    },
    {
      id: "wide_sweep",
      name: "Wide Sweep",
      weight: 5,
      effects: [{ type: "propertyAdd", field: "cleave", min: 1, max: 1, integer: true, label: "Cleave" }]
    },
    {
      id: "long_handle",
      name: "Long Handle",
      weight: 5,
      effects: [{ type: "propertyAdd", field: "range", min: 0.12, max: 0.32, precision: 2, label: "Range" }]
    },
    {
      id: "quick_cut",
      name: "Quick Cut",
      weight: 6,
      effects: [{ type: "propertyMult", field: "speed", min: 0.86, max: 0.94, label: "Faster attacks", invertPercent: true }]
    }
  ],
  ranged: [
    {
      id: "draw_weight",
      name: "Draw Weight",
      weight: 9,
      effects: [{ type: "stat", stat: "attack", min: 2, max: 4, perLevel: 0.5, integer: true, label: "Attack" }]
    },
    {
      id: "steady_sight",
      name: "Steady Sight",
      weight: 7,
      effects: [{ type: "stat", stat: "dex", min: 1, max: 2, perLevel: 0.12, integer: true, label: "DEX" }]
    },
    {
      id: "bodkin_tip",
      name: "Bodkin Tip",
      weight: 6,
      effects: [{ type: "projectileSpecial", pierce: 1, chain: 1, label: "Projectile special" }]
    },
    {
      id: "swift_flight",
      name: "Swift Flight",
      weight: 6,
      effects: [{ type: "propertyAdd", field: "projectileSpeed", min: 0.8, max: 1.8, precision: 1, label: "Projectile speed" }]
    },
    {
      id: "long_draw",
      name: "Long Draw",
      weight: 5,
      effects: [{ type: "propertyAdd", field: "range", min: 0.35, max: 0.9, precision: 2, label: "Range" }]
    }
  ],
  magic: [
    {
      id: "rune_focus",
      name: "Rune Focus",
      weight: 9,
      effects: [{ type: "stat", stat: "attack", min: 2, max: 4, perLevel: 0.48, integer: true, label: "Attack" }]
    },
    {
      id: "bright_mind",
      name: "Bright Mind",
      weight: 8,
      effects: [{ type: "stat", stat: "int", min: 1, max: 2, perLevel: 0.14, integer: true, label: "INT" }]
    },
    {
      id: "spell_reach",
      name: "Spell Reach",
      weight: 5,
      effects: [{ type: "propertyAdd", field: "range", min: 0.25, max: 0.7, precision: 2, label: "Range" }]
    },
    {
      id: "quick_cast",
      name: "Quick Cast",
      weight: 6,
      effects: [{ type: "propertyMult", field: "speed", min: 0.88, max: 0.95, label: "Faster casts", invertPercent: true }]
    },
    {
      id: "volatile_spell",
      name: "Volatile Spell",
      weight: 5,
      effects: [{ type: "elementalBoost", fireSplash: 0.24, iceChill: 0.35, lightningChain: 1, label: "Element boost" }]
    }
  ],
  guard: [
    {
      id: "iron_rim",
      name: "Iron Rim",
      weight: 9,
      effects: [{ type: "stat", stat: "defense", min: 2, max: 4, perLevel: 0.45, integer: true, label: "Defense" }]
    },
    {
      id: "root_padding",
      name: "Root Padding",
      weight: 8,
      effects: [{ type: "stat", stat: "hp", min: 5, max: 12, perLevel: 1.4, integer: true, label: "HP" }]
    },
    {
      id: "living_buckle",
      name: "Living Buckle",
      weight: 6,
      effects: [{ type: "stat", stat: "vit", min: 1, max: 2, perLevel: 0.1, integer: true, label: "VIT" }]
    },
    {
      id: "parrying_grip",
      name: "Parrying Grip",
      weight: 5,
      effects: [
        { type: "stat", stat: "defense", min: 1, max: 2, perLevel: 0.25, integer: true, label: "Defense" },
        { type: "stat", stat: "vit", min: 1, max: 1, perLevel: 0.08, integer: true, label: "VIT" }
      ]
    }
  ]
};
