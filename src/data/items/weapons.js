"use strict";

export const WEAPONS = [
  { type: "Sword", class: "Sword", slot: "weapon", range: 1.62, speed: 0.42, stat: "str", mode: "melee", arc: 0.9, dropWeight: 16 },
  { type: "Bow", class: "Bow", slot: "weapon", range: 7.2, speed: 0.58, stat: "dex", mode: "ranged", projectile: "arrow", projectileSpeed: 9.5, color: "#d8b56d", size: 7, dropWeight: 12 },
  { type: "Shield", class: "Shield", slot: "offhand", range: 1, speed: 0.52, stat: "vit", mode: "guard", dropWeight: 10 },
  { type: "Two-Handed Sword", class: "Greatsword", slot: "weapon", range: 2.06, speed: 0.72, stat: "str", mode: "melee", arc: 1.15, dropWeight: 8 },
  { type: "Axe", class: "Axe", slot: "weapon", range: 1.78, speed: 0.68, stat: "str", mode: "melee", arc: 1.0, dropWeight: 10 },
  { type: "Spear", class: "Spear", slot: "weapon", range: 2.7, speed: 0.54, stat: "dex", mode: "melee", arc: 0.42, dropWeight: 12 },
  { type: "Crossbow", class: "Crossbow", slot: "weapon", range: 8.2, speed: 0.86, stat: "dex", mode: "ranged", projectile: "bolt", projectileSpeed: 12.5, color: "#f0d9a2", size: 8, dropWeight: 8 },
  { type: "Magic Staff", class: "Staff", slot: "weapon", range: 6.8, speed: 0.66, stat: "int", mode: "magic", projectile: "orb", projectileSpeed: 7.8, color: "#8fd9ff", size: 12, pierce: 1, dropWeight: 7 },
  { type: "Wand", class: "Wand", slot: "weapon", range: 5.7, speed: 0.34, stat: "int", mode: "magic", projectile: "spark", projectileSpeed: 10.8, color: "#c79cf2", size: 8, dropWeight: 9 }
];

export const ELEMENTS = {
  fire: { name: "Fire", color: "#ff7a3d", text: "Burning burst damages nearby enemies." },
  ice: { name: "Ice", color: "#8fd9ff", text: "Frost slows and briefly locks enemies." },
  lightning: { name: "Lightning", color: "#f4d86a", text: "Lightning chains between enemies." }
};
