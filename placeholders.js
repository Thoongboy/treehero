"use strict";

(function initTreeHeroPlaceholders() {
  const ASSETS = {
    "splash.main": { label: "Main menu splash art - tree, hero, dungeon gate", category: "menu", shape: "splash", fill: "#2d6d3d", stroke: "#8ecf74", glyph: "TREE'S HERO" },
    "character.hero": { label: "Playable hero in dungeon", category: "character", shape: "hero", fill: "#80a9c8", stroke: "#24150c", glyph: "H" },
    "character.inventory": { label: "Character paper doll in inventory", category: "character", shape: "paperHero", fill: "#72578d", stroke: "#4b2f1d", glyph: "H" },
    "tree.trunk": { label: "Tree trunk placeholder", category: "tree", shape: "trunk", fill: "#8a562c", stroke: "#4b2f1d", glyph: "TRK" },
    "tree.crown": { label: "Tree leaf crown placeholder", category: "tree", shape: "crown", fill: "#4faf58", stroke: "#2d6229", glyph: "LEAF" },
    "tree.sapling": { label: "Young sapling placeholder", category: "tree", shape: "sapling", fill: "#5ba94d", stroke: "#2d6229", glyph: "SAP" },
    "item.weapon.sword": { label: "Sword icon", category: "item.weapon", shape: "blade", fill: "#d8d4c5", stroke: "#24150c", glyph: "SWD" },
    "item.weapon.greatsword": { label: "Two-handed sword icon", category: "item.weapon", shape: "blade", fill: "#d8d4c5", stroke: "#24150c", glyph: "2HS" },
    "item.weapon.axe": { label: "Axe icon", category: "item.weapon", shape: "axe", fill: "#c8c2b2", stroke: "#24150c", glyph: "AXE" },
    "item.weapon.spear": { label: "Spear icon", category: "item.weapon", shape: "spear", fill: "#d8d4c5", stroke: "#24150c", glyph: "SPR" },
    "item.weapon.bow": { label: "Bow icon", category: "item.weapon", shape: "bow", fill: "#b8793e", stroke: "#24150c", glyph: "BOW" },
    "item.weapon.crossbow": { label: "Crossbow icon", category: "item.weapon", shape: "crossbow", fill: "#c89545", stroke: "#24150c", glyph: "XBW" },
    "item.weapon.staff": { label: "Magic staff icon", category: "item.weapon", shape: "staff", fill: "#8fd9ff", stroke: "#24150c", glyph: "STF" },
    "item.weapon.wand": { label: "Wand icon", category: "item.weapon", shape: "wand", fill: "#f4d86a", stroke: "#24150c", glyph: "WND" },
    "item.weapon.shield": { label: "Shield icon", category: "item.weapon", shape: "shield", fill: "#9d8b6d", stroke: "#24150c", glyph: "SHD" },
    "item.weapon.tome": { label: "Tome icon", category: "item.weapon", shape: "rune", fill: "#8fd9ff", stroke: "#24150c", glyph: "TOM" },
    "item.weapon.quiver": { label: "Quiver icon", category: "item.weapon", shape: "bow", fill: "#d8b56d", stroke: "#24150c", glyph: "QVR" },
    "item.armor": { label: "Armor icon", category: "item.armor", shape: "shield", fill: "#8f988f", stroke: "#24150c", glyph: "ARM" },
    "item.accessory": { label: "Accessory icon", category: "item.accessory", shape: "ring", fill: "#d7a84f", stroke: "#24150c", glyph: "ACC" },
    "item.material": { label: "Crafting material icon", category: "item.material", shape: "rock", fill: "#b68955", stroke: "#24150c", glyph: "MAT" },
    "item.fertilizer": { label: "Fertilizer icon", category: "item.fertilizer", shape: "leaf", fill: "#77b86b", stroke: "#24150c", glyph: "FER" },
    "item.consumable": { label: "Consumable potion or food icon", category: "item.consumable", shape: "potion", fill: "#d86a5f", stroke: "#24150c", glyph: "CON" },
    "item.quest": { label: "Quest item icon", category: "item.quest", shape: "rune", fill: "#c79cf2", stroke: "#24150c", glyph: "QST" },
    "hud.hp": { label: "HUD HP meter icon", category: "hud", shape: "bar", fill: "#d86a5f", stroke: "#24150c", glyph: "HP" },
    "hud.xp": { label: "HUD XP meter icon", category: "hud", shape: "bar", fill: "#7fc1ee", stroke: "#24150c", glyph: "XP" },
    "hud.tree": { label: "HUD tree meter icon", category: "hud", shape: "bar", fill: "#77b86b", stroke: "#24150c", glyph: "TREE" },
    "effect.slash": { label: "Melee cleave arc effect", category: "effect.attack", shape: "arc", fill: "#d7a84f", stroke: "#fff0b0", glyph: "SLASH" },
    "effect.fire": { label: "Fire blast area effect", category: "effect.attack", shape: "burst", fill: "#ff7a3d", stroke: "#ffd36c", glyph: "FIRE" },
    "effect.ice": { label: "Ice blast ring effect", category: "effect.attack", shape: "burst", fill: "#8fd9ff", stroke: "#ddf7ff", glyph: "ICE" },
    "effect.lightning": { label: "Lightning chain effect", category: "effect.attack", shape: "bolt", fill: "#f4d86a", stroke: "#fff0b0", glyph: "ZAP" },
    "ground.grove": { label: "Rest grove ground tile", category: "ground", shape: "diamond", fill: "#1d3323", stroke: "#28412b", glyph: "GRV" },
    "ground.dungeon": { label: "Dungeon floor tile", category: "ground", shape: "diamond", fill: "#20202a", stroke: "#2b2b38", glyph: "DNG" },
    "ground.wall": { label: "Dungeon edge wall tile", category: "ground", shape: "diamond", fill: "#272733", stroke: "#36364a", glyph: "WALL" },
    "campfire": { label: "Rest grove campfire", category: "grove", shape: "fire", fill: "#ff7a3d", stroke: "#ffd36c", glyph: "FIRE" },
    "shop": { label: "Grove shop keeper stall", category: "grove", shape: "shop", fill: "#c94f4b", stroke: "#4b2f1d", glyph: "SHOP" },
    "portal.grove": { label: "Grove dungeon entrance portal", category: "portal", shape: "portal", fill: "#7fc1ee", stroke: "#d9f2ff", glyph: "GATE" },
    "portal.floor": { label: "Floor clear next-path portal", category: "portal", shape: "portal", fill: "#7fc1ee", stroke: "#d9f2ff", glyph: "NEXT" },
    "portal.return": { label: "Return-to-grove portal", category: "portal", shape: "portal", fill: "#77b86b", stroke: "#d7ffd0", glyph: "HOME" },
    "obstacle.pillar": { label: "Stone pillar obstacle", category: "obstacle", shape: "pillar", fill: "#44445a", stroke: "#242431", glyph: "PIL" },
    "obstacle.crate": { label: "Breakable cache crate", category: "obstacle", shape: "square", fill: "#9d6a3d", stroke: "#4b2f1d", glyph: "BOX" },
    "obstacle.roots": { label: "Tangled root obstacle", category: "obstacle", shape: "roots", fill: "#6d4328", stroke: "#2b1a11", glyph: "ROOT" },
    "obstacle.rubble": { label: "Rubble obstacle", category: "obstacle", shape: "rock", fill: "#787069", stroke: "#302d2a", glyph: "RUB" },
    "monster.gnawer": { label: "Gnawer melee monster", category: "monster", shape: "monster", fill: "#6e3635", stroke: "#2b1717", glyph: "GNA" },
    "monster.crawler": { label: "Moss crawler fast monster", category: "monster", shape: "monster", fill: "#506f39", stroke: "#1d2b16", glyph: "MOS" },
    "monster.shade": { label: "Root shade evasive monster", category: "monster", shape: "monster", fill: "#44395c", stroke: "#191520", glyph: "SHD" },
    "monster.spitter": { label: "Spore imp ranged monster", category: "monster", shape: "monster", fill: "#8b6d38", stroke: "#2b2113", glyph: "IMP" },
    "monster.thornback": { label: "Thornback armored monster", category: "monster", shape: "monster", fill: "#8f4e62", stroke: "#2d1720", glyph: "THN" },
    "monster.guardian": { label: "Root-Eater boss monster", category: "monster", shape: "monster", fill: "#743447", stroke: "#2b111a", glyph: "BOSS" },
    "map.node.monster": { label: "Map monster node", category: "map", shape: "mapNode", fill: "#9a7357", stroke: "#4b2f1d", glyph: "M" },
    "map.node.elite": { label: "Map elite node", category: "map", shape: "mapNode", fill: "#875662", stroke: "#4b2f1d", glyph: "E" },
    "map.node.cache": { label: "Map cache node", category: "map", shape: "mapNode", fill: "#b58a3e", stroke: "#4b2f1d", glyph: "C" },
    "map.node.boss": { label: "Map boss node", category: "map", shape: "mapNode", fill: "#7a1718", stroke: "#4b2f1d", glyph: "B" },
    "craft.table": { label: "Crafting table station", category: "crafting", shape: "table", fill: "#9d6a3d", stroke: "#4b2f1d", glyph: "CRFT" },
    "craft.output": { label: "Crafting output icon", category: "crafting", shape: "rune", fill: "#d7a84f", stroke: "#24150c", glyph: "OUT" },
    missing: { label: "Missing placeholder asset", category: "debug", shape: "square", fill: "#ff4f4f", stroke: "#24150c", glyph: "MISS" }
  };

  const ANIMATIONS = {
    "character.hero.idle": { label: "Hero idle animation", asset: "character.hero", frames: 4, fps: 5 },
    "character.hero.attack": { label: "Hero attack animation", asset: "character.hero", frames: 3, fps: 12 },
    "character.hero.walk": { label: "Hero walk animation", asset: "character.hero", frames: 4, fps: 8 },
    "character.hero.roll": { label: "Hero dodge roll animation", asset: "character.hero", frames: 4, fps: 14 },
    "character.hero.dash": { label: "Hero dash animation", asset: "character.hero", frames: 4, fps: 14 },
    "monster.idle": { label: "Monster idle animation", asset: "monster.gnawer", frames: 4, fps: 4 },
    "monster.walk": { label: "Monster bob/walk animation", asset: "monster.gnawer", frames: 4, fps: 6 },
    "monster.attack": { label: "Monster attack animation", asset: "monster.gnawer", frames: 3, fps: 9 },
    "monster.dash": { label: "Monster dash animation", asset: "monster.gnawer", frames: 4, fps: 12 },
    "effect.portal": { label: "Portal pulse animation", asset: "portal.floor", frames: 6, fps: 8 },
    "effect.campfire": { label: "Campfire flicker animation", asset: "campfire", frames: 5, fps: 10 },
    "effect.slash": { label: "Melee slash animation", asset: "effect.slash", frames: 4, fps: 14 }
  };
  for (const direction of ["up", "down", "left", "right"]) {
    for (const state of ["idle", "walk", "attack", "roll", "dash"]) {
      const base = ANIMATIONS[`character.hero.${state}`] || ANIMATIONS["character.hero.idle"];
      ANIMATIONS[`character.hero.${state}.${direction}`] = { ...base, label: `${base.label} ${direction}` };
    }
    for (const state of ["idle", "walk", "attack", "dash"]) {
      const base = ANIMATIONS[`monster.${state}`] || ANIMATIONS["monster.walk"];
      ANIMATIONS[`monster.${state}.${direction}`] = { ...base, label: `${base.label} ${direction}` };
    }
  }

  const imageSources = new Map();
  const imageCache = new Map();
  const imageQueue = [];
  const MAX_IMAGE_LOADS = 2;
  let activeImageLoads = 0;

  function getAsset(key) {
    return ASSETS[key] || ASSETS.missing;
  }

  function draw(ctx, key, x, y, options = {}) {
    const asset = getAsset(key);
    const scale = options.scale || 1;
    const w = (options.w || 48) * scale;
    const h = (options.h || 48) * scale;
    const fill = options.fill || asset.fill;
    const stroke = options.stroke || asset.stroke;
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.lineWidth = Math.max(1, options.lineWidth || 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    if (drawImage(ctx, key, x, y, w, h, options)) {
      ctx.restore();
      return true;
    }
    drawShape(ctx, asset.shape, x, y, w, h, asset, options);
    if (options.label !== false) drawGlyph(ctx, options.glyph || asset.glyph, x, y, w, options);
    ctx.restore();
    return false;
  }

  function drawAnimation(ctx, key, x, y, time, options = {}) {
    const animation = ANIMATIONS[key] || ANIMATIONS["character.hero.idle"];
    const frame = Math.floor((time || 0) / 1000 * animation.fps) % animation.frames;
    return draw(ctx, options.asset || animation.asset, x, y + Math.sin(frame / animation.frames * Math.PI * 2) * (options.bob || 2), {
      ...options,
      frame,
      scale: (options.scale || 1) * (1 + Math.sin(frame / animation.frames * Math.PI * 2) * 0.025)
    });
  }

  function drawShape(ctx, shape, x, y, w, h, asset, options) {
    if (shape === "diamond") return diamond(ctx, x, y, w, h);
    if (shape === "hero" || shape === "paperHero") return hero(ctx, x, y, w, h, asset, options);
    if (shape === "monster") return monster(ctx, x, y, w, h, asset, options);
    if (shape === "portal") return portal(ctx, x, y, w, h, options);
    if (shape === "fire") return fire(ctx, x, y, w, h);
    if (shape === "shop") return shop(ctx, x, y, w, h);
    if (shape === "table") return table(ctx, x, y, w, h);
    if (shape === "pillar") return pillar(ctx, x, y, w, h);
    if (shape === "roots") return roots(ctx, x, y, w, h);
    if (shape === "blade") return blade(ctx, x, y, w, h);
    if (shape === "axe") return axe(ctx, x, y, w, h);
    if (shape === "spear") return spear(ctx, x, y, w, h);
    if (shape === "bow") return bow(ctx, x, y, w, h);
    if (shape === "crossbow") return crossbow(ctx, x, y, w, h);
    if (shape === "staff" || shape === "wand") return staff(ctx, x, y, w, h, shape === "wand");
    if (shape === "shield") return shield(ctx, x, y, w, h);
    if (shape === "ring") return ring(ctx, x, y, w, h);
    if (shape === "potion") return potion(ctx, x, y, w, h);
    if (shape === "leaf" || shape === "crown") return leaf(ctx, x, y, w, h);
    if (shape === "sapling") return sapling(ctx, x, y, w, h);
    if (shape === "trunk") return trunk(ctx, x, y, w, h);
    if (shape === "rock") return rock(ctx, x, y, w, h);
    if (shape === "rune" || shape === "mapNode") return rune(ctx, x, y, w, h);
    if (shape === "bar") return bar(ctx, x, y, w, h);
    if (shape === "arc") return arc(ctx, x, y, w, h);
    if (shape === "burst") return burst(ctx, x, y, w, h);
    if (shape === "bolt") return bolt(ctx, x, y, w, h);
    if (shape === "splash") return splash(ctx, x, y, w, h);
    square(ctx, x, y, w, h);
  }

  function setImageSources(sources = {}) {
    for (const [key, source] of Object.entries(sources)) {
      if (!ASSETS[key]) continue;
      if (source) {
        const normalized = String(source);
        if (imageSources.get(key) !== normalized) {
          imageSources.set(key, normalized);
          imageCache.delete(key);
        }
      } else {
        imageSources.delete(key);
        imageCache.delete(key);
      }
    }
  }

  function preload(keys = []) {
    for (const key of keys) getImageRecord(key);
    pumpImageQueue();
  }

  function getImageRecord(key) {
    const source = imageSources.get(key);
    if (!source || typeof Image !== "function") return null;
    const existing = imageCache.get(key);
    if (existing?.src === source) return existing;
    const record = { key, src: source, image: null, status: "queued", error: null };
    imageCache.set(key, record);
    imageQueue.push(key);
    pumpImageQueue();
    return record;
  }

  function pumpImageQueue() {
    if (typeof Image !== "function") return;
    while (activeImageLoads < MAX_IMAGE_LOADS && imageQueue.length) {
      const key = imageQueue.shift();
      const record = imageCache.get(key);
      if (!record || record.status !== "queued") continue;
      activeImageLoads += 1;
      record.status = "loading";
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const finish = () => {
          record.image = image;
          record.status = "loaded";
          activeImageLoads = Math.max(0, activeImageLoads - 1);
          pumpImageQueue();
        };
        if (image.decode) image.decode().then(finish).catch(finish);
        else finish();
      };
      image.onerror = () => {
        record.status = "error";
        record.error = `Failed to load ${record.src}`;
        activeImageLoads = Math.max(0, activeImageLoads - 1);
        pumpImageQueue();
      };
      image.src = record.src;
    }
  }

  function drawImage(ctx, key, x, y, w, h, options) {
    const record = getImageRecord(options.imageAsset || key);
    if (!record || record.status !== "loaded" || !record.image) return false;
    const image = record.image;
    const fit = options.imageFit || "contain";
    const scale = fit === "cover"
      ? Math.max(w / image.naturalWidth, h / image.naturalHeight)
      : Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    ctx.save();
    if (fit === "cover") {
      ctx.beginPath();
      ctx.rect(x - w / 2, y - h / 2, w, h);
      ctx.clip();
    }
    ctx.drawImage(image, x - drawW / 2, y - drawH / 2, drawW, drawH);
    ctx.restore();
    return true;
  }

  function drawGlyph(ctx, text, x, y, w, options) {
    if (!text || options.label === false) return;
    ctx.fillStyle = options.textColor || "#24150c";
    ctx.font = `${Math.max(9, Math.min(18, w / 4.4))}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function square(ctx, x, y, w, h) {
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  }

  function diamond(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x - w / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function ellipse(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function hero(ctx, x, y, w, h, asset, options) {
    ellipse(ctx, x, y + h * 0.34, w * 0.65, h * 0.18);
    ctx.fillStyle = options.body || asset.fill;
    rounded(ctx, x - w * 0.22, y - h * 0.18, w * 0.44, h * 0.56, w * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8c990";
    ellipse(ctx, x, y - h * 0.32, w * 0.32, h * 0.28);
  }

  function monster(ctx, x, y, w, h) {
    ellipse(ctx, x, y + h * 0.26, w * 0.82, h * 0.22);
    ellipse(ctx, x, y - h * 0.12, w * 0.72, h * 0.72);
    ctx.fillStyle = "#181016";
    ellipse(ctx, x - w * 0.16, y - h * 0.2, w * 0.08, h * 0.08);
    ellipse(ctx, x + w * 0.16, y - h * 0.2, w * 0.08, h * 0.08);
  }

  function portal(ctx, x, y, w, h, options) {
    ctx.lineWidth = Math.max(3, w * 0.08);
    ctx.beginPath();
    ctx.arc(x, y - h * 0.12, w * 0.38, Math.PI, Math.PI * 2);
    ctx.lineTo(x + w * 0.38, y + h * 0.32);
    ctx.moveTo(x - w * 0.38, y - h * 0.12);
    ctx.lineTo(x - w * 0.38, y + h * 0.32);
    ctx.stroke();
    ctx.globalAlpha *= 0.35 + Math.sin((options.frame || 0) + 1) * 0.08;
    ellipse(ctx, x, y + h * 0.12, w * 0.42, h * 0.66);
  }

  function fire(ctx, x, y, w, h) {
    diamond(ctx, x, y + h * 0.22, w * 0.88, h * 0.34);
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.5);
    ctx.lineTo(x - w * 0.22, y + h * 0.22);
    ctx.lineTo(x + w * 0.22, y + h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function shop(ctx, x, y, w, h) {
    diamond(ctx, x, y + h * 0.24, w, h * 0.38);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.48, y - h * 0.08);
    ctx.lineTo(x, y - h * 0.52);
    ctx.lineTo(x + w * 0.48, y - h * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function table(ctx, x, y, w, h) {
    diamond(ctx, x, y + h * 0.18, w, h * 0.42);
    rounded(ctx, x - w * 0.45, y - h * 0.26, w * 0.9, h * 0.28, 4);
    ctx.fill();
    ctx.stroke();
  }

  function pillar(ctx, x, y, w, h) {
    ellipse(ctx, x, y + h * 0.42, w * 0.72, h * 0.18);
    rounded(ctx, x - w * 0.18, y - h * 0.48, w * 0.36, h * 0.82, 5);
    ctx.fill();
    ctx.stroke();
  }

  function roots(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.45, y + h * 0.18);
    ctx.bezierCurveTo(x - w * 0.18, y - h * 0.2, x + w * 0.12, y + h * 0.3, x + w * 0.46, y - h * 0.12);
    ctx.moveTo(x - w * 0.35, y - h * 0.08);
    ctx.bezierCurveTo(x - w * 0.08, y + h * 0.18, x + w * 0.18, y - h * 0.26, x + w * 0.4, y + h * 0.2);
    ctx.stroke();
  }

  function blade(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.32, y - h * 0.46);
    ctx.lineTo(x + w * 0.1, y + h * 0.12);
    ctx.lineTo(x - w * 0.06, y + h * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - w * 0.3, y + h * 0.22, w * 0.44, h * 0.08);
  }

  function axe(ctx, x, y, w, h) {
    ctx.fillRect(x - w * 0.05, y - h * 0.42, w * 0.1, h * 0.78);
    ctx.strokeRect(x - w * 0.05, y - h * 0.42, w * 0.1, h * 0.78);
    ellipse(ctx, x + w * 0.13, y - h * 0.22, w * 0.38, h * 0.3);
  }

  function spear(ctx, x, y, w, h) {
    ctx.fillRect(x - w * 0.03, y - h * 0.3, w * 0.06, h * 0.72);
    ctx.strokeRect(x - w * 0.03, y - h * 0.3, w * 0.06, h * 0.72);
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.52);
    ctx.lineTo(x - w * 0.12, y - h * 0.28);
    ctx.lineTo(x + w * 0.12, y - h * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function bow(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x - w * 0.08, y, h * 0.36, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.08, y - h * 0.36);
    ctx.lineTo(x - w * 0.08, y + h * 0.36);
    ctx.stroke();
  }

  function crossbow(ctx, x, y, w, h) {
    ctx.fillRect(x - w * 0.32, y - h * 0.06, w * 0.64, h * 0.12);
    ctx.strokeRect(x - w * 0.32, y - h * 0.06, w * 0.64, h * 0.12);
    ctx.fillRect(x - w * 0.04, y - h * 0.34, w * 0.08, h * 0.7);
  }

  function staff(ctx, x, y, w, h, wand) {
    ctx.fillRect(x - w * 0.03, y - h * 0.42, w * 0.06, h * 0.78);
    ctx.strokeRect(x - w * 0.03, y - h * 0.42, w * 0.06, h * 0.78);
    ellipse(ctx, x, y - h * 0.43, wand ? w * 0.22 : w * 0.34, wand ? h * 0.22 : h * 0.34);
  }

  function shield(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.42);
    ctx.lineTo(x + w * 0.34, y - h * 0.22);
    ctx.lineTo(x + w * 0.24, y + h * 0.3);
    ctx.lineTo(x, y + h * 0.46);
    ctx.lineTo(x - w * 0.24, y + h * 0.3);
    ctx.lineTo(x - w * 0.34, y - h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function ring(ctx, x, y, w, h) {
    ctx.lineWidth = Math.max(3, w * 0.09);
    ellipse(ctx, x, y, w * 0.54, h * 0.54);
  }

  function potion(ctx, x, y, w, h) {
    rounded(ctx, x - w * 0.2, y - h * 0.18, w * 0.4, h * 0.52, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x - w * 0.12, y - h * 0.4, w * 0.24, h * 0.16);
  }

  function leaf(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.36, h * 0.24, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function sapling(ctx, x, y, w, h) {
    trunk(ctx, x, y + h * 0.12, w * 0.42, h * 0.68);
    leaf(ctx, x - w * 0.16, y - h * 0.16, w * 0.46, h * 0.32);
    leaf(ctx, x + w * 0.18, y - h * 0.28, w * 0.5, h * 0.34);
  }

  function trunk(ctx, x, y, w, h) {
    rounded(ctx, x - w * 0.15, y - h * 0.46, w * 0.3, h * 0.9, w * 0.09);
    ctx.fill();
    ctx.stroke();
  }

  function rock(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.38, y + h * 0.22);
    ctx.lineTo(x - w * 0.18, y - h * 0.28);
    ctx.lineTo(x + w * 0.28, y - h * 0.34);
    ctx.lineTo(x + w * 0.42, y + h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function rune(ctx, x, y, w, h) {
    square(ctx, x, y, w * 0.72, h * 0.72);
  }

  function bar(ctx, x, y, w, h) {
    rounded(ctx, x - w * 0.45, y - h * 0.16, w * 0.9, h * 0.32, 3);
    ctx.fill();
    ctx.stroke();
  }

  function arc(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x, y, w * 0.44, -0.25, Math.PI * 0.88);
    ctx.stroke();
  }

  function burst(ctx, x, y, w, h) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * w * 0.44, y + Math.sin(angle) * h * 0.44);
      ctx.stroke();
    }
    ellipse(ctx, x, y, w * 0.48, h * 0.48);
  }

  function bolt(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.16, y - h * 0.46);
    ctx.lineTo(x + w * 0.08, y - h * 0.08);
    ctx.lineTo(x - w * 0.02, y - h * 0.08);
    ctx.lineTo(x + w * 0.18, y + h * 0.44);
    ctx.stroke();
  }

  function splash(ctx, x, y, w, h) {
    square(ctx, x, y, w, h);
    sapling(ctx, x - w * 0.2, y + h * 0.08, w * 0.46, h * 0.72);
    portal(ctx, x + w * 0.27, y + h * 0.1, w * 0.34, h * 0.62, {});
  }

  function rounded(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    }
  }

  window.TreeHeroAssets = {
    all: ASSETS,
    animations: ANIMATIONS,
    get: getAsset,
    draw,
    drawAnimation,
    setImageSources,
    preload,
    listImages: () => Object.keys(ASSETS).map((id) => ({
      id,
      src: imageSources.get(id) || null,
      status: imageCache.get(id)?.status || (imageSources.has(id) ? "pending" : "placeholder")
    })),
    list: () => Object.entries(ASSETS).map(([id, asset]) => ({ id, ...asset })),
    listAnimations: () => Object.entries(ANIMATIONS).map(([id, animation]) => ({ id, ...animation }))
  };
})();
