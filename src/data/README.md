# Data File Map

Use these files when you want to tune game content without digging through `game.js`.

- `items/weapons.js`: weapon types, melee/ranged/magic mode, projectile settings, and drop weights.
- `items/armors.js`: armor types and armor trait numbers like HP, defense, avoid, reduction, and shield HP.
- `items/misc-items.js`: slots, materials, accessories, and rarities.
- `items/consumable-items.js`: fertilizers and consumables.
- `crafting.js`: crafting recipes and recipe outputs.
- `skills.js`: tree skill definitions and power rating weights.
- `enemies.js`: enemy archetypes, behavior labels, and boss data.
- `shop.js`: shop slot count, rarity boost settings, stock types, and upgrade quest data.
- `tree.js`: tree quests and tree growth settings.
- `maps.js`: dungeon room layouts, route rows, and map node variations.
- `game-config.js`: global constants like save key, map sizes, and particle limits.

System files use this data:

- `../systems/stats.js`: turns hero gear, skills, and power weights into final stats.
- `../systems/tree-growth.js`: turns tree level and skills into tree size and bend.
- `../systems/difficulty.js`: turns map data and enemy data into dungeon rooms.
