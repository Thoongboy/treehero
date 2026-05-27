"use strict";

export const ASSET_ROOT = "src/assets";

function assetPath(path) {
  return `${ASSET_ROOT}/${path}`;
}

export const imageAssets = {
  menu: {
    mainSplash: assetPath("art/main_splash.png")
  }
};

export const placeholderImagePaths = {
  "splash.main": imageAssets.menu.mainSplash,

  "character.hero": assetPath("characters/hero.png"),
  "character.inventory": assetPath("characters/inventory.png"),

  "tree.trunk": assetPath("tree/trunk.png"),
  "tree.crown": assetPath("tree/crown.png"),
  "tree.sapling": assetPath("tree/sapling.png"),

  "item.weapon.sword": assetPath("items/weapons/sword.png"),
  "item.weapon.greatsword": assetPath("items/weapons/greatsword.png"),
  "item.weapon.axe": assetPath("items/weapons/axe.png"),
  "item.weapon.spear": assetPath("items/weapons/spear.png"),
  "item.weapon.bow": assetPath("items/weapons/bow.png"),
  "item.weapon.crossbow": assetPath("items/weapons/crossbow.png"),
  "item.weapon.staff": assetPath("items/weapons/staff.png"),
  "item.weapon.wand": assetPath("items/weapons/wand.png"),
  "item.weapon.shield": assetPath("items/weapons/shield.png"),
  "item.weapon.tome": assetPath("items/weapons/tome.png"),
  "item.weapon.quiver": assetPath("items/weapons/quiver.png"),
  "item.armor": assetPath("items/armor.png"),
  "item.accessory": assetPath("items/accessory.png"),
  "item.material": assetPath("items/material.png"),
  "item.fertilizer": assetPath("items/fertilizer.png"),
  "item.consumable": assetPath("items/consumable.png"),
  "item.quest": assetPath("items/quest.png"),

  "hud.hp": assetPath("ui/hud/hp.png"),
  "hud.xp": assetPath("ui/hud/xp.png"),
  "hud.tree": assetPath("ui/hud/tree.png"),

  "effect.slash": assetPath("effects/slash.png"),
  "effect.fire": assetPath("effects/fire.png"),
  "effect.ice": assetPath("effects/ice.png"),
  "effect.lightning": assetPath("effects/lightning.png"),

  "ground.grove": assetPath("ground/grove.png"),
  "ground.dungeon": assetPath("ground/dungeon.png"),
  "ground.wall": assetPath("ground/wall.png"),

  campfire: assetPath("grove/campfire.png"),
  shop: assetPath("grove/shop.png"),

  "portal.grove": assetPath("portals/grove.png"),
  "portal.floor": assetPath("portals/floor.png"),
  "portal.return": assetPath("portals/return.png"),

  "obstacle.pillar": assetPath("obstacles/pillar.png"),
  "obstacle.crate": assetPath("obstacles/crate.png"),
  "obstacle.roots": assetPath("obstacles/roots.png"),
  "obstacle.rubble": assetPath("obstacles/rubble.png"),

  "monster.gnawer": assetPath("monsters/gnawer.png"),
  "monster.crawler": assetPath("monsters/crawler.png"),
  "monster.shade": assetPath("monsters/shade.png"),
  "monster.spitter": assetPath("monsters/spitter.png"),
  "monster.thornback": assetPath("monsters/thornback.png"),
  "monster.guardian": assetPath("monsters/guardian.png"),

  "map.node.monster": assetPath("ui/map/node_monster.png"),
  "map.node.elite": assetPath("ui/map/node_elite.png"),
  "map.node.cache": assetPath("ui/map/node_cache.png"),
  "map.node.boss": assetPath("ui/map/node_boss.png"),

  "craft.table": assetPath("crafting/table.png"),
  "craft.output": assetPath("crafting/output.png"),

  missing: assetPath("debug/missing.png")
};

export const firstImagePreloadIds = [
  "splash.main",
  "tree.trunk",
  "tree.crown",
  "tree.sapling"
];

export function createPlaceholderImageSourceMap(placeholderIds = []) {
  return Object.fromEntries(
    placeholderIds.map((id) => [id, placeholderImagePaths[id] || null])
  );
}
