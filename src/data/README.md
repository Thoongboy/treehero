# Data File Map

Use these files when you want to tune game content without digging through `game.js`.

- `items/weapons.js`: weapon types, melee/ranged/magic mode, projectile settings, drop weights, and weapon rarity multipliers.
- `items/armors.js`: armor types, armor trait numbers, and armor rarity multipliers.
- `items/misc-items.js`: materials, accessories, rarities, material rarity multipliers, and accessory rarity multipliers.
- `items/consumable-items.js`: fertilizers, consumables, fertilizer rarity multipliers, and consumable rarity multipliers.
- `player.js`: hero default stats, player start position, stat point rules, origins, and starting equipment/inventory.
- `crafting.js`: crafting recipes and recipe outputs.
- `skills.js`: tree skill definitions and power rating weights.
- `enemies.js`: enemy archetypes, behavior labels, boss data, and monster damage/scaling numbers.
- `shop.js`: shop slot count, rarity boost settings, stock types, and upgrade quest data.
- `tree.js`: tree quests and tree growth settings.
- `maps.js`: dungeon room layouts, route rows, and map node variations.
- `game-config.js`: global constants like save key, map sizes, and particle limits.

System files use this data:

- `../systems/stats.js`: turns hero gear, skills, and power weights into final stats.
- `../systems/tree-growth.js`: turns tree level and skills into tree size and bend.
- `../systems/difficulty.js`: turns map data and enemy data into dungeon rooms.
