"use strict";

import {
  SAVE_KEY,
  TILE_W,
  TILE_H,
  MAP_SIZE,
  GROVE_SIZE,
  AUTOSAVE_MS,
  MAX_PARTICLES,
  MAX_PROJECTILES,
  SAVE_SLOT_COUNT,
  PLAYER_DEFAULTS,
  DEFAULT_KEYBINDS,
  HERO_PROGRESSION,
  ORIGIN_STARTS,
  SLOTS,
  MATERIALS,
  FERTILIZERS,
  CONSUMABLES,
  RARITIES,
  MATERIAL_RARITY_MULTS,
  ACCESSORY_RARITY_MULTS,
  WEAPONS,
  WEAPON_RARITY_MULTS,
  WEAPON_STAT_VARIANCE,
  WEAPON_MODIFIER_COUNTS,
  WEAPON_MODIFIER_POOLS,
  ELEMENTS,
  ARMOR_TRAITS,
  ARMORS,
  ARMOR_RARITY_MULTS,
  ARMOR_STAT_VARIANCE,
  ARMOR_MODIFIER_COUNTS,
  ARMOR_MODIFIER_POOLS,
  ACCESSORIES,
  FERTILIZER_RARITY_MULTS,
  CONSUMABLE_RARITY_MULTS,
  CRAFTING_RECIPES,
  TREE_SKILLS,
  QUESTS,
  DUNGEON_LAYOUTS,
  MONSTER_ARCHETYPES,
  BOSS_ARCHETYPE,
  ENEMY_SCALING,
  SHOP_SETTINGS,
  SHOP_STOCK
} from "./data.js";
import { angleDelta, clamp, distance, pick, rand, uid } from "./src/core/math.js";
import { createIsoProjection } from "./src/core/projection.js";
import { canStandInObstacles, moveTowardWithCollision, moveWithCollision } from "./src/systems/collision.js";
import { createPickupSystem } from "./src/systems/pickups.js";
import {
  calculateDungeonThreat,
  chooseDungeonRoomLayout,
  chooseMonsterArchetype,
  createDungeonMap as createDungeonRouteMap,
  getDungeonNodeKind,
  getEnemyCountForRoom
} from "./src/systems/difficulty.js";
import { heroXpRequirement, treeXpRequirement } from "./src/systems/progression.js";
import { calculateHeroStats } from "./src/systems/stats.js";
import { getTreeGrowthProfile, getTreeStage } from "./src/systems/tree-growth.js";
import { createSaveSystem } from "./src/systems/save.js";
import { actorAnimationKey, createTreeAnimationSystem } from "./src/systems/animation.js";
import { getGroveInteractions, groveStations, serializeGroveLayout } from "./src/data/grove-layout.js";
import { createPlaceholderImageSourceMap, firstImagePreloadIds, imageAssets } from "./src/data/images.js";

const RECIPES = CRAFTING_RECIPES;
const KEYBIND_ACTIONS = [
  { id: "moveUp", label: "Move Up" },
  { id: "moveDown", label: "Move Down" },
  { id: "moveLeft", label: "Move Left" },
  { id: "moveRight", label: "Move Right" },
  { id: "moveUpAlt", label: "Move Up Alt" },
  { id: "moveDownAlt", label: "Move Down Alt" },
  { id: "moveLeftAlt", label: "Move Left Alt" },
  { id: "moveRightAlt", label: "Move Right Alt" },
  { id: "attack", label: "Attack" },
  { id: "interact", label: "Interact" },
  { id: "potion", label: "Potion Slot" },
  { id: "bag", label: "Bag" },
  { id: "quests", label: "Quests" },
  { id: "groveEdit", label: "Grove Edit" },
  { id: "pause", label: "Pause Menu" }
];
const HELD_KEYBIND_ACTIONS = ["moveUp", "moveDown", "moveLeft", "moveRight", "moveUpAlt", "moveDownAlt", "moveLeftAlt", "moveRightAlt", "attack"];
const INTERACT_POPUP_OVERLAYS = ["tree", "craft", "shop", "portal", "map"];

const runtime = {
  app: document.getElementById("app"),
  canvas: null,
  ctx: null,
  hud: null,
  prompt: null,
  overlay: null,
  toast: null,
  tooltip: null,
  tooltipTarget: null,
  keys: new Set(),
  mouse: { x: 0, y: 0, down: false },
  last: 0,
  autosave: 0,
  running: false,
  sellMode: false,
  bindingAction: null,
  activeSaveSlot: 1,
  camera: { x: 0, y: 0 },
  shake: 0,
  projectiles: [],
  particles: [],
  indicators: [],
  floaters: [],
  drawables: [],
  dpr: 1
};

// runtime helpers for quick optimizations
runtime.lastHudHtml = null;
runtime.lastPromptHtml = null;
runtime.lastSavedJSON = null;
runtime.canvasRect = null;
runtime.particlePool = [];
runtime.projectilePool = [];
runtime.groveEditor = { enabled: false, dragging: null, hover: null, output: null };

const { project, rawProject, screenToWorld, screenUnitFromWorldAngle } = createIsoProjection({
  tileW: TILE_W,
  tileH: TILE_H,
  getCamera: () => runtime.camera
});

let state = makeFreshState();

function exposeState() {
  window.state = state;
}

function installPlaceholderImageSources() {
  const assets = window.TreeHeroAssets;
  if (!assets?.all || !assets.setImageSources) return;
  const ids = Object.keys(assets.all);
  assets.setImageSources(createPlaceholderImageSourceMap(ids));
  assets.preload?.(firstImagePreloadIds);
}

const saveSystem = createSaveSystem({
  key: SAVE_KEY,
  getState: () => state,
  getSlot: () => runtime.activeSaveSlot,
  shouldSkipSave: () => state.mode === "game" && state.settings?.autosave === false,
  onSaved: (raw) => {
    runtime.lastSavedJSON = raw;
  }
});

const pickupSystem = createPickupSystem({
  getRoom: currentRoom,
  getPlayer: () => state.player,
  addItem,
  toast
});

const animationSystem = createTreeAnimationSystem({
  getPlayer: () => state.player,
  getRoom: currentRoom,
  getProjectiles: () => runtime.projectiles,
  getParticles: () => runtime.particles
});

installPlaceholderImageSources();

function makeDefaultSettings() {
  return { autosave: true, screenshake: true, keybinds: { ...DEFAULT_KEYBINDS } };
}

function makeFreshState() {
  return {
    mode: "menu",
    area: "grove",
    overlay: null,
    message: "The tree stirs. The dungeon below is hungry.",
    settings: makeDefaultSettings(),
    hero: {
      name: PLAYER_DEFAULTS.name,
      origin: PLAYER_DEFAULTS.origin,
      level: PLAYER_DEFAULTS.level,
      xp: PLAYER_DEFAULTS.xp,
      gold: PLAYER_DEFAULTS.gold,
      hp: PLAYER_DEFAULTS.hp,
      base: { ...PLAYER_DEFAULTS.base },
      points: PLAYER_DEFAULTS.points,
      inventory: [],
      equipment: Object.fromEntries(SLOTS.map((slot) => [slot, null]))
    },
    tree: {
      level: 1,
      xp: 0,
      points: 0,
      skills: Object.fromEntries(TREE_SKILLS.map((skill) => [skill.id, 0]))
    },
    quests: QUESTS.map((quest) => ({ id: quest.id, done: false })),
    upgrades: { craft: 1, enhance: 0, shop: 0 },
    player: { ...PLAYER_DEFAULTS.startPosition },
    dungeon: { depth: 0, bestDepth: 0, room: null, map: null, currentNode: null, runComplete: false },
    shop: [],
    log: []
  };
}

function startNewHero(form) {
  state = makeFreshState();
  exposeState();
  state.mode = "game";
  state.hero.name = form.heroName.value.trim() || PLAYER_DEFAULTS.name;
  applyOriginStart(form.origin.value);
  refreshShop();
  state.hero.hp = statBlock().maxHp;
  enterGrove(ORIGIN_STARTS[state.hero.origin].message);
  saveGame();
  mountGame();
}

function applyOriginStart(origin) {
  const fallbackOrigin = PLAYER_DEFAULTS.origin;
  const config = ORIGIN_STARTS[origin] || ORIGIN_STARTS[fallbackOrigin];
  state.hero.origin = ORIGIN_STARTS[origin] ? origin : fallbackOrigin;
  state.hero.base = { ...config.base };
  state.hero.gold = config.gold;
  state.hero.inventory = [];
  state.hero.equipment = Object.fromEntries(SLOTS.map((slot) => [slot, null]));
  for (const spec of config.equipment) {
    const item = makeStarterItem(spec);
    state.hero.equipment[item.slot] = item;
  }
  for (const spec of config.inventory) addItem(makeStarterItem(spec));
}

function makeStarterItem(spec) {
  if (spec.kind === "weapon") return makeStarterWeapon(spec.type, spec.options || {});
  if (spec.kind === "armor") return makeStarterArmor(spec.type, spec.options || {});
  if (spec.kind === "accessory") return makeStarterAccessory(spec.type, spec.options || {});
  if (spec.kind === "consumable") return makeStarterConsumable(spec.name, spec.qty || 1);
  if (spec.kind === "material") return makeStarterMaterial(spec.name, spec.qty || 1);
  if (spec.kind === "fertilizer") return makeStarterFertilizer(spec.qty || 1);
  return { id: uid(), kind: spec.kind || "material", name: spec.name || "Unknown Item", qty: spec.qty || 1, value: spec.value || 1 };
}

function makeStarterWeapon(type, options = {}) {
  const base = WEAPONS.find((weapon) => weapon.type === type) || WEAPONS[0];
  const item = {
    id: uid(),
    kind: "weapon",
    rarity: options.rarity || "common",
    level: 1,
    qty: 1,
    value: options.value || 36,
    type: base.type,
    class: base.class || base.type,
    name: options.name || base.type,
    slot: base.slot,
    range: base.range,
    attackSpeed: options.attackSpeed ?? options.speed ?? base.attackSpeed ?? base.speed,
    hands: options.hands ?? base.hands ?? 1,
    compatibleWeapons: options.compatibleWeapons || base.compatibleWeapons,
    mode: base.mode,
    arc: base.arc,
    projectile: base.projectile,
    projectileSpeed: base.projectileSpeed,
    color: base.color,
    size: base.size,
    pierce: options.pierce ?? base.pierce ?? 0,
    projectileCount: options.projectileCount ?? base.projectileCount ?? 0,
    forks: options.forks ?? base.forks ?? 0,
    homing: options.homing ?? base.homing ?? 0,
    aoe: options.aoe ?? base.aoe ?? 0,
    stats: options.stats || { attack: 7, [base.stat]: 1 }
  };
  if (base.mode === "melee") item.cleave = options.cleave || (base.type === "Spear" ? 2 : 2);
  if (base.mode === "ranged") {
    item.effect = options.effect || (options.chain ? "chain" : "pierce");
    if (options.chain) {
      item.chain = options.chain;
      item.chainRange = options.chainRange || 2.7;
      item.chainDamage = options.chainDamage || 0.56;
      item.pierce = 0;
    }
  }
  if (base.mode === "magic") {
    item.element = options.element || "fire";
    item.color = ELEMENTS[item.element].color;
    if (item.element === "fire") item.splash = options.splash || 1.15;
    if (item.element === "ice") {
      item.splash = options.splash || 1.05;
      item.chill = options.chill || 1.5;
    }
    if (item.element === "lightning") {
      item.chain = options.chain || 2;
      item.chainRange = options.chainRange || 2.8;
      item.chainDamage = options.chainDamage || 0.62;
      item.pierce = 0;
    }
  }
  return item;
}

function makeStarterArmor(type, options = {}) {
  const base = ARMORS.find((armor) => armor.type === type) || ARMORS[3];
  return {
    id: uid(),
    kind: "armor",
    rarity: options.rarity || "common",
    level: 1,
    qty: 1,
    value: options.value || 30,
    type: base.type,
    name: options.name || base.type,
    slot: base.slot,
    stats: options.stats || { defense: 4, hp: 8 }
  };
}

function makeStarterAccessory(type, options = {}) {
  const base = ACCESSORIES.find((accessory) => accessory.type === type) || ACCESSORIES[0];
  const item = {
    id: uid(),
    kind: "accessory",
    rarity: options.rarity || "common",
    level: 1,
    qty: 1,
    value: options.value || 30,
    type: base.type,
    name: options.name || base.type,
    slot: base.slot,
    stats: options.stats || {}
  };
  if (Number.isFinite(options.slots)) item.slots = options.slots;
  return item;
}

function makeStarterConsumable(name, qty = 1) {
  return { id: uid(), kind: "consumable", name, qty, value: name === "Secret Seed" ? 120 : 32, use: consumableUse({ name }) };
}

function makeStarterMaterial(name, qty = 1) {
  return { id: uid(), kind: "material", rarity: "common", level: 1, name, qty, value: 15 };
}

function makeStarterFertilizer(qty = 1) {
  const base = FERTILIZERS[0];
  return { id: uid(), kind: "fertilizer", rarity: "common", level: 1, name: base.name, treeXp: base.xp, qty, value: base.value };
}

function continueGame(slot = runtime.activeSaveSlot) {
  const loaded = loadGame(slot);
  if (!loaded) return;
  runtime.activeSaveSlot = slot;
  state = loaded;
  exposeState();
  state.mode = "game";
  normalizeState();
  mountGame();
}

function normalizeState() {
  state.overlay = null;
  state.settings = normalizeSettings(state.settings);
  state.hero.origin ||= PLAYER_DEFAULTS.origin;
  state.hero.inventory ||= [];
  state.hero.equipment ||= Object.fromEntries(SLOTS.map((slot) => [slot, null]));
  for (const slot of SLOTS) state.hero.equipment[slot] ??= null;
  state.player ||= { ...PLAYER_DEFAULTS.startPosition };
  state.player.moveDir ??= state.player.dir || 0;
  const mapSize = state.area === "grove" ? GROVE_SIZE : MAP_SIZE;
  if (state.area === "grove" && ((state.player.x ?? 0) >= mapSize - 1.25 || (state.player.y ?? 0) >= mapSize - 1.25)) {
    state.player.x = 8.1;
    state.player.y = 7.6;
  } else {
    state.player.x = clamp(state.player.x ?? 8.5, 1.2, mapSize - 1.2);
    state.player.y = clamp(state.player.y ?? 11.5, 1.2, mapSize - 1.2);
  }
  state.shop ||= [];
  state.log ||= [];
  state.quests ||= [];
  for (const quest of QUESTS) {
    if (!state.quests.some((entry) => entry.id === quest.id)) state.quests.push({ id: quest.id, done: false });
  }
  state.upgrades ||= { craft: 1, enhance: 0, shop: 0 };
  state.upgrades.craft ??= 1;
  state.upgrades.enhance ??= 0;
  state.upgrades.shop ??= 0;
  normalizeEquipment();
  state.dungeon.map ||= null;
  state.dungeon.currentNode ||= null;
  state.dungeon.runComplete ||= false;
  if (state.dungeon.room) {
    state.dungeon.room.size ||= state.area === "grove" ? GROVE_SIZE : MAP_SIZE;
    state.dungeon.room.obstacles ||= [];
    state.dungeon.room.spawns ||= [];
    state.dungeon.room.threat ||= dungeonThreat(state.dungeon.depth || 1);
    state.dungeon.room.exit ||= { x: Math.floor(state.dungeon.room.size / 2), y: 3.7 };
    rebalanceRoomEnemies(state.dungeon.room);
  }
  if (state.area === "dungeon" && state.dungeon.room?.cleared && !state.dungeon.room.portal) {
    state.dungeon.room.portal = makeFloorPortal(state.dungeon.room.kind);
  }
  if (!state.dungeon?.room && state.area === "dungeon") enterGrove("The roots pull you back to the grove.");
}

function normalizeSettings(settings = {}) {
  return {
    autosave: settings.autosave ?? true,
    screenshake: settings.screenshake ?? true,
    keybinds: { ...DEFAULT_KEYBINDS, ...(settings.keybinds || {}) }
  };
}

function normalizeEquipment() {
  const weapon = state.hero.equipment.weapon;
  const offhand = state.hero.equipment.offhand;
  if (!offhand || canUseOffhandWithWeapon(offhand, weapon)) return;
  state.hero.inventory.push(offhand);
  state.hero.equipment.offhand = null;
}

function isTwoHandedWeapon(item) {
  return item?.slot === "weapon" && (item.hands === 2 || item.type === "Two-Handed Sword" || item.type === "Magic Staff");
}

function isBowWeapon(item) {
  return item?.type === "Bow" || item?.type === "Crossbow" || item?.class === "Bow" || item?.class === "Crossbow";
}

function isWandWeapon(item) {
  return item?.type === "Wand" || item?.class === "Wand";
}

function isTome(item) {
  return item?.type === "Tome" || item?.class === "Tome" || item?.mode === "tome";
}

function isQuiver(item) {
  return item?.type === "Quiver" || item?.class === "Quiver" || item?.mode === "quiver";
}

function canUseOffhandWithWeapon(offhand, weapon) {
  if (!offhand || offhand.slot !== "offhand") return true;
  if (isTwoHandedWeapon(weapon)) return false;
  if (isQuiver(offhand)) return isBowWeapon(weapon);
  if (isTome(offhand)) return isWandWeapon(weapon);
  if (isBowWeapon(weapon)) return false;
  return true;
}

function offhandRequirementText(offhand, weapon = state.hero.equipment.weapon) {
  if (isTwoHandedWeapon(weapon)) return `${weaponClass(weapon)} uses both hands.`;
  if (isQuiver(offhand)) return "Quivers require a bow or crossbow.";
  if (isTome(offhand)) return "Tomes require a wand.";
  if (isBowWeapon(weapon)) return "Bows and crossbows can only use quivers off-hand.";
  return "That off-hand item does not fit your weapon.";
}

function renderMenu() {
  const hasSave = saveSystem.hasSave();
  const originOptions = Object.keys(ORIGIN_STARTS)
    .map((origin) => `<option>${escapeHtml(origin)}</option>`)
    .join("");
  runtime.app.innerHTML = `
    <main class="menu-screen">
      <section class="menu-panel">
        <div class="menu-art" data-asset="splash.main">
          <img class="menu-splash-image" src="${imageAssets.menu.mainSplash}" alt="Tree's Hero splash art" />
        </div>
        <div class="menu-copy">
          <h1>Tree's Hero</h1>
          <p>Move through the grove, dive into branching dungeon rooms, fight in real time, grab loot, and feed the tree to unlock power.</p>
          <div class="menu-actions">
            <button class="gold" ${hasSave ? "" : "disabled"} onclick="continueGame()">Continue</button>
            <button onclick="showCreator()">New Hero</button>
            <button ${hasSave ? "" : "disabled"} onclick="deleteSave()">Delete Save</button>
          </div>
          <form id="creator" class="creator" hidden onsubmit="event.preventDefault(); startNewHero(this)">
            <label>Hero Name<input name="heroName" maxlength="18" placeholder="Ash" /></label>
            <label>Origin<select name="origin">${originOptions}</select></label>
            <button class="gold" type="submit">Begin</button>
          </form>
        </div>
      </section>
    </main>
  `;
}

function showCreator() {
  document.getElementById("creator").hidden = false;
}

function mountGame() {
  runtime.app.innerHTML = `
    <main class="game-shell">
      <canvas id="game"></canvas>
      <div id="hud" class="hud"></div>
      <div id="prompt" class="prompt"></div>
      <div id="overlay" class="overlay-root"></div>
      <div id="toast" class="toast" hidden></div>
      <div id="item-tooltip" class="item-tooltip" hidden></div>
      <section id="grove-editor" class="grove-editor" hidden>
        <header>
          <strong>Grove Editor</strong>
          <button type="button" onclick="toggleGroveEditor(false)">Close</button>
        </header>
        <p>Drag grove stations on the canvas. The generated layout stays live until reload.</p>
        <textarea id="grove-editor-output" spellcheck="false"></textarea>
      </section>
    </main>
  `;
  runtime.canvas = document.getElementById("game");
  runtime.ctx = runtime.canvas.getContext("2d");
  runtime.hud = document.getElementById("hud");
  runtime.prompt = document.getElementById("prompt");
  runtime.overlay = document.getElementById("overlay");
  runtime.toast = document.getElementById("toast");
  runtime.tooltip = document.getElementById("item-tooltip");
  runtime.groveEditor.panel = document.getElementById("grove-editor");
  runtime.groveEditor.output = document.getElementById("grove-editor-output");
  bindCanvas();
  bindTooltips();
  resizeCanvas();
  renderOverlay();
  if (!runtime.running) {
    runtime.running = true;
    requestAnimationFrame(loop);
  }
}

function bindCanvas() {
  runtime.canvas.onpointermove = (event) => {
    const rect = runtime.canvasRect || runtime.canvas.getBoundingClientRect();
    runtime.canvasRect = rect;
    runtime.mouse.x = event.clientX - rect.left;
    runtime.mouse.y = event.clientY - rect.top;
    if (runtime.groveEditor.enabled) {
      const world = screenToWorld(runtime.mouse.x, runtime.mouse.y);
      if (runtime.groveEditor.dragging) {
        runtime.groveEditor.dragging.x = clamp(world.x, 1.2, GROVE_SIZE - 1.2);
        runtime.groveEditor.dragging.y = clamp(world.y, 1.2, GROVE_SIZE - 1.2);
        updateGroveEditorOutput();
      } else {
        runtime.groveEditor.hover = findGroveEditorStation(world);
      }
    }
  };
  runtime.canvas.onpointerdown = (event) => {
    runtime.canvas.setPointerCapture(event.pointerId);
    runtime.mouse.down = true;
    runtime.canvas.onpointermove(event);
    if (runtime.groveEditor.enabled) {
      const world = screenToWorld(runtime.mouse.x, runtime.mouse.y);
      runtime.groveEditor.dragging = findGroveEditorStation(world);
      event.preventDefault();
      return;
    }
    playerAttack("mouse");
  };
  runtime.canvas.onpointerup = () => {
    runtime.mouse.down = false;
    runtime.groveEditor.dragging = null;
  };
}

function bindTooltips() {
  runtime.app.onpointerover = (event) => {
    const target = event.target.closest?.("[data-tooltip]");
    if (!target || !runtime.app.contains(target)) return;
    showItemTooltip(target, event);
  };
  runtime.app.onpointermove = (event) => {
    if (runtime.tooltipTarget) positionItemTooltip(event, runtime.tooltipTarget);
  };
  runtime.app.onpointerout = (event) => {
    if (!runtime.tooltipTarget) return;
    if (event.relatedTarget && runtime.tooltipTarget.contains(event.relatedTarget)) return;
    hideItemTooltip();
  };
  runtime.app.onpointerdown = (event) => {
    if (!event.target.closest?.("[data-tooltip]")) hideItemTooltip();
  };
}

function showItemTooltip(target, event) {
  if (!runtime.tooltip || !target.dataset.tooltip) return;
  runtime.tooltipTarget = target;
  runtime.tooltip.innerHTML = target.dataset.tooltip;
  runtime.tooltip.hidden = false;
  runtime.tooltip.className = `item-tooltip ${target.dataset.tooltipTone || ""}`;
  positionItemTooltip(event, target);
}

function positionItemTooltip(event, target) {
  if (!runtime.tooltip || runtime.tooltip.hidden) return;
  const panel = target.closest(".overlay-panel");
  const bounds = panel?.getBoundingClientRect() || { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8, width: window.innerWidth - 16, height: window.innerHeight - 16 };
  const margin = 8;
  runtime.tooltip.style.maxWidth = `${Math.max(180, Math.min(320, bounds.width - margin * 2))}px`;
  runtime.tooltip.style.maxHeight = `${Math.max(120, Math.min(300, bounds.height - margin * 2))}px`;
  const rect = runtime.tooltip.getBoundingClientRect();
  let x = event.clientX + 14;
  let y = event.clientY + 14;
  if (x + rect.width > bounds.right - margin) x = event.clientX - rect.width - 14;
  if (y + rect.height > bounds.bottom - margin) y = event.clientY - rect.height - 14;
  const minX = bounds.left + margin;
  const minY = bounds.top + margin;
  const maxX = Math.max(minX, bounds.right - rect.width - margin);
  const maxY = Math.max(minY, bounds.bottom - rect.height - margin);
  runtime.tooltip.style.left = `${Math.round(Math.max(minX, Math.min(maxX, x)))}px`;
  runtime.tooltip.style.top = `${Math.round(Math.max(minY, Math.min(maxY, y)))}px`;
}

function hideItemTooltip() {
  runtime.tooltipTarget = null;
  if (runtime.tooltip) runtime.tooltip.hidden = true;
}

function isTypingTarget(target) {
  return Boolean(target?.matches?.("input, select, textarea"));
}

function keybinds() {
  state.settings = normalizeSettings(state.settings);
  return state.settings.keybinds;
}

function keyFor(action) {
  return keybinds()[action] || "";
}

function matchesKeybind(action, code) {
  return Boolean(code && keyFor(action) === code);
}

function isHeldActionCode(code) {
  return HELD_KEYBIND_ACTIONS.some((action) => matchesKeybind(action, code));
}

function isActionDown(action) {
  const code = keyFor(action);
  return Boolean(code && runtime.keys.has(code));
}

function beginKeybindRebind(action) {
  if (!KEYBIND_ACTIONS.some((entry) => entry.id === action)) return;
  runtime.bindingAction = action;
  renderOverlay();
}

function finishKeybindRebind(action, code) {
  keybinds()[action] = code;
  runtime.bindingAction = null;
  runtime.keys.clear();
  runtime.lastHudHtml = null;
  runtime.lastPromptHtml = null;
  saveGame(runtime.activeSaveSlot, true);
  renderOverlay();
}

function resetKeybinds() {
  state.settings = normalizeSettings({ ...state.settings, keybinds: DEFAULT_KEYBINDS });
  runtime.bindingAction = null;
  runtime.keys.clear();
  runtime.lastHudHtml = null;
  runtime.lastPromptHtml = null;
  saveGame(runtime.activeSaveSlot, true);
  renderOverlay();
}

function keyLabel(code) {
  if (!code) return "Unbound";
  const labels = {
    Space: "Space",
    Escape: "Esc",
    Enter: "Enter",
    Tab: "Tab",
    Backspace: "Backspace",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right"
  };
  if (labels[code]) return labels[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Numpad ${code.slice(6)}`;
  return code.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function togglePauseMenu() {
  state.overlay = state.overlay === "pause" ? null : "pause";
  runtime.bindingAction = null;
  runtime.keys.clear();
  runtime.mouse.down = false;
  renderOverlay();
}

function toggleOverlayShortcut(action, overlay, code) {
  if (!matchesKeybind(action, code)) return false;
  if (!state.overlay || state.overlay === overlay) {
    toggleOverlay(overlay);
    return true;
  }
  return false;
}

function handlePopupShortcut(code) {
  if (toggleOverlayShortcut("bag", "inventory", code)) return true;
  if (toggleOverlayShortcut("quests", "quests", code)) return true;
  if (matchesKeybind("interact", code) && INTERACT_POPUP_OVERLAYS.includes(state.overlay)) {
    toggleOverlay(null);
    return true;
  }
  if (matchesKeybind("groveEdit", code) && (!state.overlay || runtime.groveEditor.enabled)) {
    toggleGroveEditor();
    return true;
  }
  return false;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  if (state.mode !== "game") return;
  if (runtime.bindingAction) {
    event.preventDefault();
    if (!event.repeat) finishKeybindRebind(runtime.bindingAction, event.code);
    return;
  }
  const code = event.code;
  if (matchesKeybind("pause", code)) {
    event.preventDefault();
    if (!event.repeat) togglePauseMenu();
    return;
  }
  if (isTypingTarget(event.target)) return;
  if (event.repeat) return;
  if (handlePopupShortcut(code)) {
    event.preventDefault();
    return;
  }
  if (state.overlay) return;
  if (isHeldActionCode(code)) {
    runtime.keys.add(code);
    event.preventDefault();
  }
  if (matchesKeybind("attack", code)) {
    event.preventDefault();
    playerAttack("keyboard");
  }
  if (matchesKeybind("interact", code)) {
    event.preventDefault();
    interact();
  }
  if (matchesKeybind("potion", code)) {
    event.preventDefault();
    usePotion();
  }
});
window.addEventListener("keyup", (event) => runtime.keys.delete(event.code));
window.addEventListener("beforeunload", saveGame);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    runtime.running = false;
  } else {
    if (!runtime.running && state.mode === "game") {
      runtime.running = true;
      runtime.last = performance.now();
      requestAnimationFrame(loop);
    }
  }
});

function loop(now) {
  const dt = Math.min(0.033, (now - runtime.last || 16) / 1000);
  runtime.last = now;
  if (state.mode === "game" && runtime.canvas) {
    update(dt);
    draw();
    renderHud();
    maybeAutosave(dt);
  }
  if (runtime.running) requestAnimationFrame(loop);
}

function resizeCanvas() {
  if (!runtime.canvas) return;
  hideItemTooltip();
  runtime.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = runtime.canvas.getBoundingClientRect();
  runtime.canvas.width = Math.floor(rect.width * runtime.dpr);
  runtime.canvas.height = Math.floor(rect.height * runtime.dpr);
  // cache canvas rect for pointer calculations
  runtime.canvasRect = rect;
}

function update(dt) {
  if (state.overlay) return;
  const player = state.player;
  const stats = statBlock();
  player.attackCd = Math.max(0, player.attackCd - dt);
  player.attackT = Math.max(0, player.attackT - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  runtime.shake = Math.max(0, runtime.shake - dt * 18);
  updateMovement(dt, stats);
  if ((runtime.mouse.down || isActionDown("attack")) && player.attackCd <= 0) playerAttack(runtime.mouse.down ? "mouse" : "keyboard");
  updateProjectiles(dt);
  if (state.area === "dungeon") updateDungeon(dt, stats);
  updatePickups(dt);
  updateFx(dt);
  animationSystem.update(dt);
}

function updateMovement(dt, stats) {
  let screenX = 0;
  let screenY = 0;
  if (isActionDown("moveUp") || isActionDown("moveUpAlt")) {
    screenY -= 1;
  }
  if (isActionDown("moveDown") || isActionDown("moveDownAlt")) {
    screenY += 1;
  }
  if (isActionDown("moveLeft") || isActionDown("moveLeftAlt")) {
    screenX -= 1;
  }
  if (isActionDown("moveRight") || isActionDown("moveRightAlt")) {
    screenX += 1;
  }
  if (screenX || screenY) {
    const length = Math.hypot(screenX, screenY);
    screenX /= length;
    screenY /= length;
    const dx = screenX * (TILE_H / TILE_W) + screenY;
    const dy = screenY - screenX * (TILE_H / TILE_W);
    const size = currentMapSize();
    const nextX = clamp(state.player.x + dx * stats.moveSpeed * dt, 1.2, size - 1.2);
    const nextY = clamp(state.player.y + dy * stats.moveSpeed * dt, 1.2, size - 1.2);
    movePlayerWithCollision(nextX, nextY);
    state.player.moveDir = Math.atan2(dy, dx);
    if (state.player.attackT <= 0 && !runtime.mouse.down && !isActionDown("attack")) {
      state.player.dir = state.player.moveDir;
    }
  }
}

function movePlayerWithCollision(nextX, nextY) {
  moveWithCollision(state.player, nextX, nextY, 0.36, canStandAt);
}

function moveEntityWithCollision(entity, targetX, targetY, speed, dt, radius) {
  moveTowardWithCollision(entity, targetX, targetY, speed, dt, radius, canStandAt);
}

function canStandAt(x, y, radius = 0.36) {
  const room = state.area === "dungeon" ? state.dungeon.room : null;
  return canStandInObstacles(x, y, radius, room?.obstacles || []);
}

function updateDungeon(dt, stats) {
  const room = state.dungeon.room;
  if (!room) return;
  for (const enemy of room.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.cd = Math.max(0, enemy.cd - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    enemy.slow = Math.max(0, (enemy.slow || 0) - dt);
    if (enemy.hp <= 0 || enemy.stun > 0) continue;
    const dist = distance(enemy, state.player);
    const speed = enemy.speed * (enemy.slow > 0 ? 0.48 : 1);
    // always try to close distance to the player (prevents idling far away)
    if (dist > 0.02) moveEntityWithCollision(enemy, state.player.x, state.player.y, speed, dt, enemy.radius || 0.4);

    // recompute distance after moving and handle attack when in range
    const postDist = distance(enemy, state.player);
    if (postDist <= enemy.range && enemy.cd <= 0) {
      enemy.cd = enemy.attackType === "ranged" ? 1.55 : enemy.elite ? 1.05 : 1.25;
      const amount = enemyDamageAmount(enemy, stats);
      if (enemy.attackType === "ranged") {
        spawnIndicator({ kind: "blast", x: state.player.x, y: state.player.y, radius: 0.72, color: "#b9d46a", life: 0.22, max: 0.22, ring: true });
        spawnParticle(state.player.x, state.player.y, "#b9d46a", 1.1);
      }
      hurtHero(amount);
      spawnFloater("-" + amount, state.player.x, state.player.y, enemy.attackType === "ranged" ? "#b9d46a" : "#ff8a7e");
    }
    }
  room.enemies = room.enemies.filter((enemy) => enemy.hp > 0);
  if (!room.cleared && room.enemies.length === 0) clearRoom();
}

function enemyDamageAmount(enemy, heroStats) {
  const variance = enemy.attackType === "ranged" ? ENEMY_SCALING.rangedDamageVariance : ENEMY_SCALING.meleeDamageVariance;
  return Math.max(
    ENEMY_SCALING.minimumDamage,
    Math.floor(enemy.attack - heroStats.defense * ENEMY_SCALING.heroDefenseDamageReduction + rand(0, variance))
  );
}

function updateProjectiles(dt) {
  if (!runtime.projectiles.length) return;
  const room = state.dungeon.room;
  for (let i = runtime.projectiles.length - 1; i >= 0; i--) {
    const projectile = runtime.projectiles[i];
    projectile.lastX = projectile.x;
    projectile.lastY = projectile.y;
    if (room && state.area === "dungeon" && projectile.homing > 0) steerProjectile(projectile, room, dt);
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (room && state.area === "dungeon") {
      for (const obstacle of room.obstacles || []) {
        if (distance(projectile, obstacle) <= (obstacle.r || 0.65) + projectile.radius) {
          projectile.life = 0;
          for (let j = 0; j < 4; j++) spawnParticle(projectile.x, projectile.y, projectile.color, 0.9);
          break;
        }
      }
      if (projectile.life > 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || projectile.hit.includes(enemy.id)) continue;
          if (distance(projectile, enemy) > enemy.radius + projectile.radius) continue;
          hitProjectileEnemy(projectile, enemy, room, 1);
          if (projectile.pierce <= 0) projectile.life = 0;
          else projectile.pierce -= 1;
          break;
        }
      }
    }
    if (projectile.life <= 0) {
      const last = runtime.projectiles.pop();
      if (i < runtime.projectiles.length) runtime.projectiles[i] = last;
      // reset minimal fields and release to pool
      projectile.hit = [];
      runtime.projectilePool.push(projectile);
    }
  }
}

function hitProjectileEnemy(projectile, enemy, room, multiplier = 1, triggerSpecials = true) {
  if (enemy.hp <= 0 || projectile.hit.includes(enemy.id)) return;
  const damage = Math.max(2, Math.floor(projectile.damage * multiplier) - Math.floor(enemy.defense * 0.3));
  projectile.hit.push(enemy.id);
  enemy.hp -= damage;
  enemy.hit = 0.16;
  enemy.stun = Math.max(enemy.stun || 0, projectile.kind === "bolt" ? 0.16 : 0.08);
  if (projectile.element === "ice") {
    enemy.slow = Math.max(enemy.slow || 0, projectile.chill || 1.5);
    enemy.stun = Math.max(enemy.stun || 0, 0.18);
  }
  spawnFloater(projectile.crit ? `!${damage}` : `${damage}`, enemy.x, enemy.y, projectile.crit ? "#ffe68a" : projectile.color);
  for (let i = 0; i < 7; i++) spawnParticle(enemy.x, enemy.y, projectile.color, 1.2);
  if (triggerSpecials) applyProjectileSpecials(projectile, enemy, room);
  if (enemy.hp <= 0) killEnemy(enemy);
}

function applyProjectileSpecials(projectile, enemy, room) {
  if (projectile.element === "fire") applyFireBurst(projectile, enemy, room);
  else if (projectile.aoe > 0) applyImpactBurst(projectile, enemy, room);
  if (projectile.element === "ice") applyIceChill(projectile, enemy, room);
  if (projectile.chain > 0) applyChainHit(projectile, enemy, room);
  if (projectile.forks > 0) applyForkShots(projectile, enemy, room);
}

function steerProjectile(projectile, room, dt) {
  const target = nearestProjectileTarget(projectile, room, projectile.homingRange || 6.5);
  if (!target) return;
  const speed = projectile.speed || Math.hypot(projectile.vx, projectile.vy) || 1;
  const current = Math.atan2(projectile.vy, projectile.vx);
  const desired = Math.atan2(target.y - projectile.y, target.x - projectile.x);
  const turn = clamp(projectile.homing * dt * 4, 0, 0.35);
  const next = current + angleDelta(current, desired) * turn;
  projectile.vx = Math.cos(next) * speed;
  projectile.vy = Math.sin(next) * speed;
}

function nearestProjectileTarget(projectile, room, range) {
  let target = null;
  let best = Infinity;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || projectile.hit.includes(enemy.id)) continue;
    const dist = distance(projectile, enemy);
    if (dist <= range && dist < best) {
      target = enemy;
      best = dist;
    }
  }
  return target;
}

function applyFireBurst(projectile, origin, room) {
  const radius = projectile.splash || 1.15;
  spawnIndicator({ kind: "blast", x: origin.x, y: origin.y, radius, color: ELEMENTS.fire.color, life: 0.28, max: 0.28 });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.id === origin.id || projectile.hit.includes(enemy.id)) continue;
    if (distance(origin, enemy) > radius + enemy.radius) continue;
    const damage = Math.max(2, Math.floor(projectile.damage * 0.45) - Math.floor(enemy.defense * 0.22));
    projectile.hit.push(enemy.id);
    enemy.hp -= damage;
    enemy.hit = 0.16;
    spawnFloater(`${damage}`, enemy.x, enemy.y, ELEMENTS.fire.color);
    for (let i = 0; i < 5; i++) spawnParticle(enemy.x, enemy.y, ELEMENTS.fire.color, 1.4);
    if (enemy.hp <= 0) killEnemy(enemy);
  }
}

function applyIceChill(projectile, origin, room) {
  const radius = projectile.splash || 1.05;
  spawnIndicator({ kind: "blast", x: origin.x, y: origin.y, radius, color: ELEMENTS.ice.color, life: 0.32, max: 0.32, ring: true });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.id === origin.id) continue;
    if (distance(origin, enemy) > radius + enemy.radius) continue;
    enemy.slow = Math.max(enemy.slow || 0, (projectile.chill || 1.5) * 0.8);
    enemy.hit = Math.max(enemy.hit || 0, 0.1);
    spawnParticle(enemy.x, enemy.y, ELEMENTS.ice.color, 0.9);
  }
}

function applyImpactBurst(projectile, origin, room) {
  const radius = projectile.aoe || 0;
  if (radius <= 0) return;
  spawnIndicator({ kind: "blast", x: origin.x, y: origin.y, radius, color: projectile.color, life: 0.24, max: 0.24, ring: true });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.id === origin.id || projectile.hit.includes(enemy.id)) continue;
    if (distance(origin, enemy) > radius + enemy.radius) continue;
    const damage = Math.max(2, Math.floor(projectile.damage * 0.38) - Math.floor(enemy.defense * 0.2));
    projectile.hit.push(enemy.id);
    enemy.hp -= damage;
    enemy.hit = 0.14;
    spawnFloater(`${damage}`, enemy.x, enemy.y, projectile.color);
    for (let i = 0; i < 4; i++) spawnParticle(enemy.x, enemy.y, projectile.color, 1.1);
    if (enemy.hp <= 0) killEnemy(enemy);
  }
}

function applyChainHit(projectile, origin, room) {
  let from = origin;
  let multiplier = projectile.chainDamage || 0.58;
  for (let jumps = 0; jumps < projectile.chain; jumps++) {
    const next = nearestChainTarget(from, room, projectile.chainRange || 2.6, projectile.hit);
    if (!next) return;
    spawnIndicator({ kind: "chain", from: { x: from.x, y: from.y }, to: { x: next.x, y: next.y }, color: projectile.color, life: 0.24, max: 0.24 });
    hitProjectileEnemy(projectile, next, room, multiplier, false);
    from = next;
    multiplier *= 0.78;
  }
}

function nearestChainTarget(from, room, range, hit) {
  let target = null;
  let best = Infinity;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || hit.includes(enemy.id)) continue;
    const dist = distance(from, enemy);
    if (dist <= range && dist < best) {
      target = enemy;
      best = dist;
    }
  }
  return target;
}

function applyForkShots(projectile, origin, room) {
  const targets = room.enemies
    .filter((enemy) => enemy.hp > 0 && enemy.id !== origin.id && !projectile.hit.includes(enemy.id))
    .map((enemy) => ({ enemy, dist: distance(origin, enemy) }))
    .filter(({ dist }) => dist <= (projectile.forkRange || 4.2))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, projectile.forks);
  for (const { enemy, dist } of targets) {
    const angle = Math.atan2(enemy.y - origin.y, enemy.x - origin.x);
    const forkSpeed = Math.max(4, (projectile.speed || Math.hypot(projectile.vx, projectile.vy) || 8) * 0.92);
    spawnProjectile({
      weapon: {
        mode: "ranged",
        projectile: projectile.kind,
        projectileSpeed: forkSpeed,
        color: projectile.color,
        size: projectile.radius * 16,
        pierce: 0,
        chain: 0,
        forks: 0,
        homing: projectile.homing,
        forkRange: 0
      },
      x: origin.x,
      y: origin.y,
      angle,
      speed: forkSpeed,
      range: Math.max(0.5, dist + 0.8),
      damage: Math.max(2, Math.floor(projectile.damage * (projectile.forkDamage || 0.52))),
      crit: projectile.crit,
      hit: [...projectile.hit]
    });
  }
}

function updatePickups(dt) {
  pickupSystem.update(dt);
}

function updateFx(dt) {
  for (let i = runtime.indicators.length - 1; i >= 0; i--) {
    const indicator = runtime.indicators[i];
    indicator.life -= dt;
    if (indicator.life <= 0) {
      const last = runtime.indicators.pop();
      if (i < runtime.indicators.length) runtime.indicators[i] = last;
    }
  }
  for (let i = runtime.particles.length - 1; i >= 0; i--) {
    const particle = runtime.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) {
      const last = runtime.particles.pop();
      if (i < runtime.particles.length) runtime.particles[i] = last;
      runtime.particlePool.push(particle);
    }
  }
  for (let i = runtime.floaters.length - 1; i >= 0; i--) {
    const floater = runtime.floaters[i];
    floater.y -= dt * 1.2;
    floater.life -= dt;
    if (floater.life <= 0) {
      const last = runtime.floaters.pop();
      if (i < runtime.floaters.length) runtime.floaters[i] = last;
    }
  }
}

function playerAttack(source = "keyboard") {
  if (state.mode !== "game" || state.overlay) return;
  const stats = statBlock();
  const weapon = combatWeapon();
  const range = weaponRange(weapon);
  const attackSpeed = weaponAttackSpeed(weapon);
  if (state.player.attackCd > 0) return;
  state.player.attackCd = attackSpeed;
  state.player.attackT = weapon.mode === "melee" ? 0.18 : 0.12;
  state.player.dir = aimDirection(range, source);
  const room = state.dungeon.room;
  if (state.area !== "dungeon" || !room) {
    if (weapon.mode === "melee") spawnSlash(range, weapon.arc || 0.9);
    else fireProjectile(weapon, stats, range);
    return;
  }
  if (weapon.mode === "ranged" || weapon.mode === "magic") {
    fireProjectile(weapon, stats, range);
    return;
  }
  performMeleeAttack(weapon, stats, room);
}

function basicWeapon() {
  return { type: "Fists", class: "Unarmed", range: 1.05, attackSpeed: 0.5, mode: "melee", arc: 0.95, cleave: 1, color: "#d7a84f", size: 6 };
}

function aimDirection(range, source = "keyboard") {
  const target = source === "keyboard" ? nearestEnemy(range + 2.5) : null;
  if (target) return Math.atan2(target.y - state.player.y, target.x - state.player.x);
  const playerScreen = project(state.player.x, state.player.y);
  const screenX = runtime.mouse.x - playerScreen.x;
  const screenY = runtime.mouse.y - playerScreen.y;
  const worldX = screenX / TILE_W + screenY / TILE_H;
  const worldY = screenY / TILE_H - screenX / TILE_W;
  if (!worldX && !worldY) return state.player.dir;
  return Math.atan2(worldY, worldX);
}

function nearestEnemy(maxRange = Infinity) {
  const room = state.dungeon.room;
  if (!room) return null;
  let target = null;
  let best = Infinity;
  for (const enemy of room.enemies) {
    const dist = distance(enemy, state.player);
    if (dist <= maxRange && dist < best) {
      target = enemy;
      best = dist;
    }
  }
  return target;
}

function performMeleeAttack(weapon, stats, room) {
  const range = weaponRange(weapon);
  const arc = weapon.arc || 0.9;
  const cleave = meleeCleave(weapon);
  spawnSlash(range, arc);
  const targets = [];
  for (const enemy of room.enemies) {
    const dist = distance(enemy, state.player);
    if (dist > range + enemy.radius) continue;
    const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x);
    if (Math.abs(angleDelta(state.player.dir, angle)) > arc) continue;
    targets.push({ enemy, dist });
  }
  targets.sort((a, b) => a.dist - b.dist);
  targets.slice(0, cleave).forEach(({ enemy }, index) => damageEnemy(enemy, stats, weapon, index ? 0.72 : 1));
}

function fireProjectile(weapon, stats, range) {
  const crit = Math.random() < stats.crit;
  const speed = weapon.projectileSpeed || 9;
  const damage = weaponDamage(stats, weapon, crit, weapon.mode === "magic" ? 0.86 : 0.95);
  const color = projectileColor(weapon);
  const px = state.player.x + Math.cos(state.player.dir) * 0.42;
  const py = state.player.y + Math.sin(state.player.dir) * 0.42;
  const count = projectileCount(weapon);
  const spread = projectileSpread(weapon, count);
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    spawnProjectile({
      weapon,
      x: px,
      y: py,
      angle: state.player.dir + offset,
      speed,
      range,
      damage: count > 1 ? Math.max(2, Math.floor(damage * 0.82)) : damage,
      crit
    });
  }
  for (let i = 0; i < 4; i++) spawnParticle(px, py, color, 1.1);
}

function spawnProjectile({ weapon, x, y, angle, speed, range, damage, crit, hit = [] }) {
  if (runtime.projectiles.length < MAX_PROJECTILES) {
    let proj = runtime.projectilePool.pop();
    const projectile = {
      x,
      y,
      lastX: x,
      lastY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      speed,
      life: Math.max(0.3, range / speed),
      radius: (weapon.size || 8) / 16,
      damage,
      color: projectileColor(weapon),
      kind: weapon.projectile || "shot",
      pierce: weapon.mode === "magic" && magicElement(weapon) === "lightning" ? 0 : projectilePierce(weapon),
      chain: projectileChain(weapon),
      chainRange: weapon.chainRange || 2.65,
      chainDamage: weapon.chainDamage || 0.58,
      element: weapon.mode === "magic" ? magicElement(weapon) : null,
      splash: weapon.splash || (weapon.mode === "magic" ? 1.15 : 0),
      aoe: weapon.aoe || 0,
      chill: weapon.chill || 1.5,
      forks: weapon.forks || 0,
      forkRange: weapon.forkRange || 4.2,
      forkDamage: weapon.forkDamage || 0.52,
      homing: weapon.homing || 0,
      homingRange: weapon.homingRange || 6.5,
      crit,
      hit
    };
    if (proj) {
      Object.assign(proj, projectile);
    } else {
      proj = projectile;
    }
    runtime.projectiles.push(proj);
  }
}

function projectileCount(weapon) {
  return clamp(1 + (weapon.projectileCount || 0), 1, 5);
}

function projectileSpread(weapon, count) {
  if (count <= 1) return 0;
  return weapon.mode === "magic" ? 0.16 : 0.13;
}

function meleeCleave(weapon) {
  if (weapon.mode !== "melee") return 1;
  if (Number.isFinite(weapon.cleave)) return Math.max(1, weapon.cleave);
  if (weapon.type === "Fists") return 1;
  const base = weapon.type === "Two-Handed Sword" || weapon.type === "Axe" ? 3 : weapon.type === "Spear" ? 2 : 2;
  return Math.min(6, base + Math.floor(rarityRank(weapon.rarity) / 2) + Math.floor((weapon.level || 1) / 6));
}

function projectilePierce(weapon) {
  if (weapon.mode !== "ranged") return Number.isFinite(weapon.pierce) ? weapon.pierce : 0;
  if (Number.isFinite(weapon.pierce) && weapon.pierce > 0) return weapon.pierce;
  if (weapon.effect === "chain") return 0;
  return weapon.type === "Crossbow" ? 1 : 0;
}

function projectileChain(weapon) {
  if (weapon.mode === "magic" && magicElement(weapon) === "lightning") return weapon.chain || 2;
  if (weapon.mode !== "ranged") return weapon.chain || 0;
  if (weapon.effect !== "chain") return weapon.chain || 0;
  return weapon.chain || 1;
}

function magicElement(weapon) {
  return ELEMENTS[weapon.element] ? weapon.element : "fire";
}

function projectileColor(weapon) {
  if (weapon.mode === "magic") return ELEMENTS[magicElement(weapon)].color;
  return weapon.color || "#d7a84f";
}

function weaponRange(weapon) {
  const range = weapon?.range || 1.35;
  if (weapon?.mode === "melee" && weapon.type !== "Fists" && !weapon.class) return range * 1.2;
  return range;
}

function weaponAttackSpeed(weapon) {
  return weapon?.attackSpeed ?? weapon?.speed ?? 0.5;
}

function combatWeapon() {
  return withOffhandModifiers(state.hero.equipment.weapon || basicWeapon(), state.hero.equipment.offhand);
}

function withOffhandModifiers(weapon, offhand) {
  const active = { ...weapon };
  if (!offhand || !canUseOffhandWithWeapon(offhand, weapon)) {
    if (isBowWeapon(weapon)) active.attackSpeed = Number((weaponAttackSpeed(active) * 1.5).toFixed(3));
    return active;
  }
  if (isTome(offhand)) {
    active.projectileCount = (active.projectileCount || 0) + (offhand.projectileCount || 0);
    active.homing = Math.max(active.homing || 0, offhand.homing || 0);
    active.aoe = Math.max(active.aoe || 0, offhand.aoe || 0);
    active.chain = (active.chain || 0) + (offhand.chain || 0);
    if (offhand.aoe && active.element === "fire") active.splash = (active.splash || 1.15) + offhand.aoe * 0.45;
    if (offhand.aoe && active.element === "ice") active.splash = (active.splash || 1.05) + offhand.aoe * 0.35;
  }
  if (isQuiver(offhand)) {
    active.projectileSpeed = (active.projectileSpeed || 9) + (offhand.projectileSpeed || 0);
    active.projectileCount = (active.projectileCount || 0) + (offhand.projectileCount || 0);
    active.pierce = (active.pierce || 0) + (offhand.pierce || 0);
    active.forks = (active.forks || 0) + (offhand.forks || 0);
  }
  if (isBowWeapon(weapon) && !isQuiver(offhand)) active.attackSpeed = Number((weaponAttackSpeed(active) * 1.5).toFixed(3));
  return active;
}

function damageEnemy(target, stats, weapon, multiplier) {
  const crit = Math.random() < stats.crit;
  const damage = Math.max(2, weaponDamage(stats, weapon, crit, multiplier) - Math.floor(target.defense * 0.35));
  target.hp -= damage;
  target.hit = 0.16;
  target.stun = 0.08;
  spawnFloater((crit ? "!" : "") + damage, target.x, target.y, crit ? "#ffe68a" : "#f7f1d8");
  for (let i = 0; i < 8; i++) spawnParticle(target.x, target.y, crit ? "#ffe68a" : "#d56358");
  if (target.hp <= 0) killEnemy(target);
}

function weaponDamage(stats, weapon, crit, multiplier = 1) {
  const scalar = weapon.mode === "magic" ? stats.int * 0.95 : weapon.mode === "ranged" ? stats.dex * 0.9 : stats.str * 0.75;
  return Math.max(2, Math.floor((stats.attack + scalar + rand(-3, 5)) * multiplier * (crit ? 1.8 : 1)));
}

function spawnSlash(range, arc = 0.9) {
  const px = state.player.x + Math.cos(state.player.dir) * Math.min(range, 1.5);
  const py = state.player.y + Math.sin(state.player.dir) * Math.min(range, 1.5);
  spawnIndicator({ kind: "melee", x: state.player.x, y: state.player.y, dir: state.player.dir, radius: range, arc, color: "#d7a84f", life: 0.16, max: 0.16 });
  for (let i = 0; i < 5; i++) spawnParticle(px, py, "#d7a84f", 1.6);
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  const room = state.dungeon.room;
  gainXp(enemy.xp);
  state.hero.gold += enemy.gold;
  if (Math.random() < 0.82 + statBlock().loot) dropLoot(enemy.x, enemy.y, enemy.elite ? 0.4 : 0);
  if (enemy.boss) {
    dropSpecific({ kind: "quest", name: "Deep Mycelium Core", qty: 1, value: 140, id: uid() }, enemy.x, enemy.y);
    dropSpecific(makeItem("fertilizer", 3), enemy.x + 0.4, enemy.y);
  }
  room.kills += 1;
}

function hurtHero(amount) {
  if (state.player.invuln > 0) return;
  state.player.invuln = 0.28;
  state.hero.hp -= amount;
  runtime.shake = state.settings.screenshake ? 8 : 0;
  if (state.hero.hp <= 0) die();
}

function die() {
  const stats = statBlock();
  const fee = Math.min(state.hero.gold, Math.ceil((35 + state.hero.level * 12) * (1 - stats.fee)));
  state.hero.gold -= fee;
  state.hero.hp = Math.ceil(stats.maxHp * 0.55);
  enterGrove(`You fell below the roots. The tree pulls you back for ${fee} gold.`);
  saveGame();
}

function enterGrove(message = "You return to the grove.") {
  state.area = "grove";
  state.dungeon.depth = 0;
  state.dungeon.room = makeGroveRoom();
  state.player.x = 8.1;
  state.player.y = 7.6;
  state.overlay = null;
  state.message = message;
  runtime.projectiles = [];
  runtime.indicators = [];
  runtime.particles = [];
  runtime.floaters = [];
  renderOverlay();
}

function enterDungeon() {
  state.area = "dungeon";
  state.dungeon.depth = 0;
  state.dungeon.map = makeDungeonMap();
  state.dungeon.currentNode = null;
  state.dungeon.runComplete = false;
  state.dungeon.room = null;
  state.overlay = "map";
  state.message = "Choose a route on the old root map.";
  renderOverlay();
  saveGame();
}

function dungeonThreat(depth = state.dungeon.depth) {
  return calculateDungeonThreat(depth, state?.hero?.level || 1, state.dungeon.bestDepth || 0);
}

function chooseRoomLayout(type, depth, node = null) {
  return chooseDungeonRoomLayout({ type, depth, node, heroLevel: state.hero.level, layouts: DUNGEON_LAYOUTS });
}

function enemyCountForRoom(type, depth) {
  return getEnemyCountForRoom(type, dungeonThreat(depth));
}

function startRoom(type, node = null) {
  const depth = Math.max(1, state.dungeon.depth);
  const layout = chooseRoomLayout(type, depth, node);
  state.dungeon.bestDepth = Math.max(state.dungeon.bestDepth, depth);
  state.player.x = layout.start.x;
  state.player.y = layout.start.y;
  const room = {
    kind: type,
    layout: layout.id,
    title: roomTitle(type, depth, layout),
    size: layout.size,
    start: layout.start,
    exit: layout.portal,
    obstacles: layout.obstacles.map((obstacle) => ({ ...obstacle, id: uid() })),
    spawns: layout.spawns,
    threat: dungeonThreat(depth),
    enemies: [],
    pickups: [],
    gates: [],
    portal: null,
    cleared: false,
    kills: 0
  };
  if (type === "cache") {
    room.cleared = true;
    for (let i = 0; i < 5; i++) {
      const point = room.spawns[i % room.spawns.length];
      dropSpecific(makeItem(i % 2 ? "material" : "fertilizer", Math.ceil(room.threat), 0.2), point.x + rand(-0.45, 0.45), point.y + rand(-0.45, 0.45), room);
    }
    const picked = collectRoomPickups(room);
    room.portal = makeFloorPortal(type);
    if (node) {
      const mapNode = state.dungeon.map?.rows.flat().find((entry) => entry.id === node.id);
      if (mapNode) mapNode.done = true;
    }
    state.message = `The roots hide a cache here. ${picked} items gathered. Use the portal for the next route.`;
    room.mapReady = true;
  } else {
    const count = enemyCountForRoom(type, depth);
    for (let i = 0; i < count; i++) room.enemies.push(makeEnemy(type, depth, i, room));
    state.message = `${room.title}: threat ${Math.round(room.threat)}. Survive and take what falls.`;
  }
  state.dungeon.room = room;
  state.dungeon.currentNode = node || state.dungeon.currentNode;
  state.overlay = null;
  runtime.projectiles = [];
  runtime.indicators = [];
  renderOverlay();
  saveGame();
}

function clearRoom() {
  const room = state.dungeon.room;
  room.cleared = true;
  const depth = state.dungeon.depth;
  const reward = 14 + depth * 4 + (room.kind === "elite" ? 18 : 0) + (room.kind === "boss" ? 50 : 0);
  gainTreeXp(Math.ceil(reward * 0.5));
  state.hero.gold += reward;
  const picked = collectRoomPickups(room);
  room.portal = makeFloorPortal(room.kind);
  room.mapReady = true;
  const node = currentMapNode();
  if (node) node.done = true;
  if (room.kind === "boss") {
    state.dungeon.runComplete = true;
    state.message = `Guardian defeated. ${picked} items gathered. Enter the portal to return to the grove.`;
    toast("Guardian defeated. The tree pulses above.");
  } else {
    state.message = `Floor clear. ${picked} items gathered. Enter the portal to choose the next route.`;
  }
  state.overlay = null;
  renderOverlay();
  saveGame();
}

function collectRoomPickups(room) {
  return pickupSystem.collect(room);
}

function makeFloorPortal(kind) {
  const exit = state.dungeon.room?.exit || { x: Math.floor(currentMapSize() / 2), y: 3.7 };
  return {
    kind: kind === "boss" ? "grove" : "map",
    label: kind === "boss" ? "Return to Grove" : "Next Root Map",
    x: exit.x,
    y: exit.y
  };
}

function makeDungeonMap() {
  return createDungeonRouteMap();
}

function pickNodeKind(row, col) {
  return getDungeonNodeKind(row, col);
}

function currentMapNode() {
  const current = state.dungeon.currentNode;
  if (!current || !state.dungeon.map) return null;
  return state.dungeon.map.rows.flat().find((node) => node.id === current.id) || null;
}

function canChooseMapNode(node) {
  if (!state.dungeon.map || state.dungeon.runComplete) return false;
  const room = state.dungeon.room;
  if (room && !room.cleared) return false;
  const current = currentMapNode();
  if (!current) return node.row === 0;
  return current.done && current.next.includes(node.id);
}

function chooseMapNode(id) {
  const node = state.dungeon.map?.rows.flat().find((entry) => entry.id === id);
  if (!node || !canChooseMapNode(node)) return;
  state.dungeon.currentNode = { id: node.id, row: node.row, col: node.col };
  state.dungeon.depth = node.row + 1;
  state.dungeon.map.route.push(node.id);
  startRoom(node.kind, state.dungeon.currentNode);
}

function finishDungeonRun() {
  enterGrove("You return from the dungeon with the guardian's sap still glowing in your pack.");
  state.dungeon.map = null;
  state.dungeon.currentNode = null;
  state.dungeon.runComplete = false;
  saveGame();
}

function makeGates(depth) {
  const gates = [
    { kind: "monster", label: "Monster Tunnel", x: 5.2, y: 3.8 },
    { kind: "elite", label: "Elite Hollow", x: 8.5, y: 2.5 },
    { kind: "cache", label: "Root Cache", x: 11.8, y: 3.8 }
  ];
  if ((depth + 1) % 5 === 0) gates[1] = { kind: "boss", label: "Guardian Gate", x: 8.5, y: 2.5 };
  gates.push({ kind: "grove", label: "Return Grove", x: 2.8, y: 13.2 });
  return gates;
}

function chooseGate(gate) {
  if (gate.kind === "grove") {
    enterGrove("You climb back to the tree with your loot.");
    saveGame();
    return;
  }
  state.dungeon.depth += gate.kind === "elite" ? 2 : 1;
  startRoom(gate.kind);
}

function makeGroveRoom() {
  return { kind: "grove", size: GROVE_SIZE, enemies: [], pickups: [], gates: [], obstacles: [], portal: null, cleared: true, kills: 0, title: "Rest Grove" };
}

function currentRoom() {
  return state.area === "grove" ? state.dungeon.room || makeGroveRoom() : state.dungeon.room;
}

function currentMapSize() {
  return state.area === "grove" ? GROVE_SIZE : state.dungeon.room?.size || MAP_SIZE;
}

function rebalanceRoomEnemies(room) {
  if (!room?.enemies?.length) return;
  const threat = room.threat || dungeonThreat(state.dungeon.depth || 1);
  for (const enemy of room.enemies) {
    const archetype = enemyArchetype(enemy);
    enemy.attack = enemyAttackValue(archetype, threat, enemy.elite, enemy.boss);
    enemy.defense = enemyDefenseValue(archetype, threat, enemy.elite);
  }
}

function makeEnemy(type, depth, index, activeRoom = state.dungeon.room) {
  const elite = type === "elite";
  const boss = type === "boss";
  const room = activeRoom;
  const threat = dungeonThreat(depth);
  const archetype = boss ? BOSS_ARCHETYPE : pickMonsterArchetype(type, depth, index);
  const spawn = room?.spawns?.[index % room.spawns.length];
  const angle = (Math.PI * 2 * index) / Math.max(1, boss ? 1 : 6);
  const radius = boss ? 0 : 3.2 + (index % 4) * 0.65;
  const x = spawn ? spawn.x : (currentMapSize() / 2 + Math.cos(angle) * radius);
  const y = spawn ? spawn.y : (currentMapSize() * 0.38 + Math.sin(angle) * radius);
  const eliteHpMult = elite ? ENEMY_SCALING.eliteHpMult : 1;
  return {
    id: uid(),
    name: elite && !boss ? `Elder ${archetype.name}` : archetype.name,
    archetype: archetype.id,
    asset: archetype.asset,
    attackType: archetype.attackType,
    effect: archetype.effect || null,
    x: clamp(x + rand(-0.55, 0.55), 2.1, currentMapSize() - 2.1),
    y: clamp(y + rand(-0.55, 0.55), 2.1, currentMapSize() - 2.1),
    hp: Math.floor((ENEMY_SCALING.hpBase + threat * ENEMY_SCALING.hpPerThreat) * archetype.hp * (boss ? 1 : eliteHpMult)),
    maxHp: Math.floor((ENEMY_SCALING.hpBase + threat * ENEMY_SCALING.hpPerThreat) * archetype.hp * (boss ? 1 : eliteHpMult)),
    attack: enemyAttackValue(archetype, threat, elite, boss),
    defense: enemyDefenseValue(archetype, threat, elite),
    speed: archetype.speed * (elite ? ENEMY_SCALING.eliteSpeedMult : 1),
    range: archetype.range,
    radius: archetype.radius * (elite ? ENEMY_SCALING.eliteRadiusMult : 1),
    gold: Math.floor(7 + threat * 4.3 + (boss ? 90 : elite ? 34 : 0)),
    xp: Math.floor(20 + threat * 11 + (boss ? 160 : elite ? 52 : 0)),
    cd: rand(0.3, 1.2),
    hit: 0,
    stun: 0,
    elite,
    boss
  };
}

function enemyArchetype(enemy) {
  if (enemy.boss || enemy.archetype === BOSS_ARCHETYPE.id) return BOSS_ARCHETYPE;
  return MONSTER_ARCHETYPES.find((entry) => entry.id === enemy.archetype) || MONSTER_ARCHETYPES[0];
}

function enemyAttackValue(archetype, threat, elite = false, boss = false) {
  const mult = boss ? ENEMY_SCALING.bossAttackMult : elite ? ENEMY_SCALING.eliteAttackMult : ENEMY_SCALING.normalAttackMult;
  return Math.floor((ENEMY_SCALING.attackBase + threat * ENEMY_SCALING.attackPerThreat) * archetype.attack * mult);
}

function enemyDefenseValue(archetype, threat, elite = false) {
  const mult = elite ? ENEMY_SCALING.eliteDefenseMult : 1;
  return Math.floor((ENEMY_SCALING.defenseBase + threat * ENEMY_SCALING.defensePerThreat) * archetype.defense * mult);
}

function pickMonsterArchetype(type, depth, index) {
  return chooseMonsterArchetype({ archetypes: MONSTER_ARCHETYPES, type, threat: dungeonThreat(depth), index });
}

function roomTitle(type, depth, layout = null) {
  const name = layout?.name || "Dungeon Hall";
  if (type === "boss") return `Depth ${depth} Guardian - ${name}`;
  if (type === "elite") return `Depth ${depth} Elite - ${name}`;
  if (type === "cache") return `Depth ${depth} Cache - ${name}`;
  return `Depth ${depth} Fight - ${name}`;
}

function interact() {
  if (state.mode !== "game" || state.overlay) return;
  const action = nearbyAction();
  if (!action) return;
  if (action.type === "dungeon") enterDungeon();
  if (action.type === "tree") toggleOverlay("tree");
  if (action.type === "craft") toggleOverlay("craft");
  if (action.type === "shop") toggleOverlay("shop");
  if (action.type === "rest") {
    state.hero.hp = statBlock().maxHp;
    toast("Rested.");
  }
  if (action.type === "gate") chooseGate(action.gate);
  if (action.type === "floorPortal") {
    state.pendingPortal = action.portal;
    if (action.portal.kind === "map") {
      diveDeeperFromPortal();
      return;
    }
    if (action.portal.kind === "grove") {
      finishDungeonRun();
      return;
    }
    state.overlay = "portal";
    state.message = action.portal.label || "Step through the portal.";
    renderOverlay();
  }
}

function nearbyAction() {
  const player = state.player;
  if (state.area === "grove") {
    return getGroveInteractions().find((point) => distance(point, player) < point.r);
  }
  const room = state.dungeon.room;
  if (room?.cleared) {
    if (room.portal && distance(room.portal, player) < 1.35) {
      return { type: "floorPortal", label: room.portal.label, portal: room.portal };
    }
    const gate = room.gates.find((item) => distance(item, player) < 1.1);
    if (gate) return { type: "gate", label: gate.label, gate };
  }
  return null;
}

function draw() {
  const ctx = runtime.ctx;
  const canvas = runtime.canvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const playerPoint = rawProject(state.player.x, state.player.y);
  const shakeX = runtime.shake ? rand(-runtime.shake, runtime.shake) : 0;
  const shakeY = runtime.shake ? rand(-runtime.shake, runtime.shake) : 0;
  runtime.camera.x = width / 2 - playerPoint.x + shakeX;
  runtime.camera.y = height * 0.58 - playerPoint.y + shakeY;
  drawBackdrop(ctx, width, height);
  drawTiles(ctx);
  drawCombatIndicators(ctx);
  drawDepthSortedScene(ctx);
  drawFloaters(ctx);
  drawGroveEditorOverlay(ctx);
  drawVignette(ctx, width, height);
}

function toggleGroveEditor(force = !runtime.groveEditor.enabled) {
  runtime.groveEditor.enabled = Boolean(force);
  runtime.groveEditor.dragging = null;
  runtime.groveEditor.hover = null;
  if (runtime.groveEditor.panel) runtime.groveEditor.panel.hidden = !runtime.groveEditor.enabled;
  updateGroveEditorOutput();
  if (runtime.groveEditor.enabled && state.area !== "grove") {
    toast("Grove editor is available in the grove.");
  }
}

function updateGroveEditorOutput() {
  if (!runtime.groveEditor.output) return;
  runtime.groveEditor.output.value = serializeGroveLayout();
}

function findGroveEditorStation(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of groveStations) {
    const d = distance(station, point);
    if (d < Math.max(0.65, station.radius * 0.72) && d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return best;
}

function drawGroveEditorOverlay(ctx) {
  if (!runtime.groveEditor.enabled || state.area !== "grove") return;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (const station of groveStations) {
    const p = project(station.x, station.y);
    const active = runtime.groveEditor.dragging === station || runtime.groveEditor.hover === station;
    ctx.strokeStyle = active ? "#ffe68a" : "rgba(255, 230, 138, 0.7)";
    ctx.fillStyle = active ? "rgba(255, 230, 138, 0.18)" : "rgba(255, 230, 138, 0.08)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, TILE_W * station.radius * 0.46, TILE_H * station.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff7cf";
    ctx.fillText(station.id, p.x, p.y - 18);
  }
  ctx.restore();
}

function drawAsset(ctx, key, x, y, options = {}) {
  if (!window.TreeHeroAssets?.draw) return false;
  window.TreeHeroAssets.draw(ctx, key, x, y, options);
  return true;
}

function drawAnimatedAsset(ctx, key, x, y, options = {}) {
  if (!window.TreeHeroAssets?.drawAnimation) return false;
  window.TreeHeroAssets.drawAnimation(ctx, key, x, y, gameTimeMs(), options);
  return true;
}

function gameTimeMs() {
  return animationSystem.getTime() * 1000;
}

function drawBackdrop(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (state.area === "grove") {
    gradient.addColorStop(0, "#172719");
    gradient.addColorStop(0.55, "#101815");
    gradient.addColorStop(1, "#0a1010");
  } else {
    gradient.addColorStop(0, "#141419");
    gradient.addColorStop(0.55, "#101018");
    gradient.addColorStop(1, "#08090c");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawTiles(ctx) {
  const size = currentMapSize();
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const p = project(x, y);
      const alt = (x + y) % 2;
      const grove = state.area === "grove";
      const base = grove ? (alt ? "#1d3323" : "#1a2d20") : alt ? "#20202a" : "#1a1a23";
      if (!drawAsset(ctx, grove ? "ground.grove" : "ground.dungeon", p.x, p.y, { w: TILE_W, h: TILE_H, fill: base, stroke: grove ? "#28412b" : "#2b2b38", label: false })) {
        drawDiamond(ctx, p.x, p.y, TILE_W, TILE_H, base, grove ? "#28412b" : "#2b2b38");
      }
      if (!grove && (x === 0 || y === 0 || x === size - 1 || y === size - 1)) {
        if (!drawAsset(ctx, "ground.wall", p.x, p.y - 7, { w: TILE_W, h: TILE_H, label: false })) drawDiamond(ctx, p.x, p.y - 7, TILE_W, TILE_H, "#272733", "#36364a");
      }
    }
  }
}

function drawWorldObjects(ctx) {
  if (state.area === "grove") drawGroveObjects(ctx);
  else drawDungeonObjects(ctx);
}

function drawGroveObjects(ctx) {
  for (const station of groveStations) drawGroveStation(ctx, station);
}

function drawDungeonObjects(ctx) {
  const room = state.dungeon.room;
  if (!room) return;
  if (room.portal) drawFloorPortal(ctx, room.portal);
  for (const gate of room.gates) drawGate(ctx, gate);
  for (const obstacle of room.obstacles || []) drawObstacle(ctx, obstacle);
}

function drawDepthSortedScene(ctx) {
  const drawables = sceneDrawables(ctx);
  drawables.sort((a, b) => a.depth - b.depth || a.layer - b.layer);
  for (const item of drawables) item.draw();
}

function sceneDrawables(ctx) {
  const drawables = runtime.drawables;
  drawables.length = 0;
  const add = (x, y, layer, draw, bias = 0) => {
    drawables.push({ depth: isoDepth(x, y, bias), layer, draw });
  };
  if (state.area === "grove") {
    for (const station of groveStations) {
      add(station.x, station.y, station.sceneLayer, () => drawGroveStation(ctx, station), station.depthBias);
    }
  } else {
    const room = state.dungeon.room;
    if (room) {
      if (room.portal) add(room.portal.x, room.portal.y, 30, () => drawFloorPortal(ctx, room.portal), 0.58);
      for (const gate of room.gates || []) add(gate.x, gate.y, 30, () => drawGate(ctx, gate), 0.46);
      for (const obstacle of room.obstacles || []) add(obstacle.x, obstacle.y, 24, () => drawObstacle(ctx, obstacle), obstacle.depthBias ?? 0.35);
      for (const enemy of room.enemies || []) add(enemy.x, enemy.y, 40, () => drawEnemy(ctx, enemy), enemy.radius || 0);
    }
  }
  const room = currentRoom();
  for (const pickup of room?.pickups || []) add(pickup.x, pickup.y, 12, () => drawPickup(ctx, pickup), -0.05);
  add(state.player.x, state.player.y, 42, () => drawHero(ctx), 0);
  for (const projectile of runtime.projectiles) add(projectile.x, projectile.y, 50, () => drawProjectile(ctx, projectile), 0.05);
  for (const particle of runtime.particles) add(particle.x, particle.y, 60, () => drawParticle(ctx, particle), 0.1);
  return drawables;
}

function drawGroveStation(ctx, station) {
  if (station.draw === "campfire") drawCampfire(ctx, station.x, station.y);
  if (station.draw === "craft") drawCraftingTable(ctx, station.x, station.y);
  if (station.draw === "shop") drawShop(ctx, station.x, station.y);
  if (station.draw === "portal") drawPortal(ctx, station.x, station.y);
  if (station.draw === "tree") drawTree(ctx, station.x, station.y);
}

function isoDepth(x, y, bias = 0) {
  return x + y + bias;
}

function drawCombatIndicators(ctx) {
  for (const indicator of runtime.indicators) {
    const pct = clamp(indicator.life / indicator.max, 0, 1);
    if (indicator.kind === "melee") drawMeleeIndicator(ctx, indicator, pct);
    if (indicator.kind === "blast") drawBlastIndicator(ctx, indicator, pct);
    if (indicator.kind === "chain") drawChainIndicator(ctx, indicator, pct);
  }
}

function drawMeleeIndicator(ctx, indicator, pct) {
  const center = project(indicator.x, indicator.y);
  const steps = 18;
  ctx.save();
  ctx.globalAlpha = 0.12 + pct * 0.28;
  ctx.fillStyle = indicator.color;
  ctx.strokeStyle = "rgba(255,232,153,.82)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  for (let i = 0; i <= steps; i++) {
    const angle = indicator.dir - indicator.arc + (indicator.arc * 2 * i) / steps;
    const p = project(indicator.x + Math.cos(angle) * indicator.radius, indicator.y + Math.sin(angle) * indicator.radius);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.65 + pct * 0.25;
  ctx.stroke();
  ctx.restore();
}

function drawBlastIndicator(ctx, indicator, pct) {
  const points = worldCirclePoints(indicator.x, indicator.y, indicator.radius, 28);
  ctx.save();
  ctx.globalAlpha = indicator.ring ? 0.25 + pct * 0.35 : 0.16 + pct * 0.28;
  ctx.fillStyle = indicator.color;
  ctx.strokeStyle = indicator.color;
  ctx.lineWidth = indicator.ring ? 4 : 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const p = project(point.x, point.y);
    if (index) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
  if (!indicator.ring) ctx.fill();
  ctx.globalAlpha = 0.72 + pct * 0.22;
  ctx.stroke();
  ctx.restore();
}

function drawChainIndicator(ctx, indicator, pct) {
  const from = project(indicator.from.x, indicator.from.y);
  const to = project(indicator.to.x, indicator.to.y);
  ctx.save();
  ctx.globalAlpha = 0.35 + pct * 0.55;
  ctx.strokeStyle = indicator.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y - 24);
  const midX = (from.x + to.x) / 2 + Math.sin(gameTimeMs() / 35) * 8;
  const midY = (from.y + to.y) / 2 - 52;
  ctx.lineTo(midX, midY);
  ctx.lineTo(to.x, to.y - 24);
  ctx.stroke();
  ctx.restore();
}

function worldCirclePoints(x, y, radius, steps) {
  return Array.from({ length: steps }, (_, index) => {
    const angle = (Math.PI * 2 * index) / steps;
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
  });
}

function drawEntities(ctx) {
  const room = currentRoom();
  const drawables = [];
  if (room?.pickups) room.pickups.forEach((pickup) => drawables.push({ y: pickup.x + pickup.y, draw: () => drawPickup(ctx, pickup) }));
  if (state.area === "dungeon" && state.dungeon.room) {
    state.dungeon.room.enemies.forEach((enemy) => drawables.push({ y: enemy.x + enemy.y, draw: () => drawEnemy(ctx, enemy) }));
  }
  drawables.push({ y: state.player.x + state.player.y, draw: () => drawHero(ctx) });
  runtime.projectiles.forEach((projectile) => drawables.push({ y: projectile.x + projectile.y, draw: () => drawProjectile(ctx, projectile) }));
  runtime.particles.forEach((particle) => drawables.push({ y: particle.x + particle.y, draw: () => drawParticle(ctx, particle) }));
  drawables.sort((a, b) => a.y - b.y);
  for (const item of drawables) item.draw();
}

function treeStage() {
  return getTreeStage(state.tree.level);
}

function drawTree(ctx, x, y) {
  const p = project(x, y);
  const { stage, scale, trunkH, crownW, crownH, leafAlpha, bend } = getTreeGrowthProfile(state.tree);
  const trunkX = p.x + bend * scale * 0.25;
  const crownX = p.x + bend * scale;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ellipse(ctx, p.x, p.y + 26 * scale, 76 * scale, 24 * scale);
  drawAsset(ctx, stage ? "tree.trunk" : "tree.sapling", p.x, p.y - 18 * scale, { w: 76 * scale, h: 120 * scale, label: false, alpha: 0.2 });
  const trunk = ctx.createLinearGradient(p.x - 20, p.y - 20, p.x + 24, p.y + 80);
  trunk.addColorStop(0, "#9c6b3b");
  trunk.addColorStop(1, "#56311d");
  ctx.fillStyle = trunk;
  roundRect(ctx, trunkX - 18 * scale, p.y - trunkH * scale, 36 * scale, (trunkH + 34) * scale, 12 * scale);
  ctx.fill();
  ctx.globalAlpha = leafAlpha;
  drawAsset(ctx, "tree.crown", crownX, p.y - (trunkH + 42) * scale, { w: crownW * scale, h: crownH * scale, label: false, alpha: 0.22 });
  ctx.fillStyle = "#2e7c42";
  ellipse(ctx, crownX, p.y - (trunkH + 30) * scale, crownW * scale, crownH * scale);
  ctx.fillStyle = "#4faf58";
  ellipse(ctx, crownX - 28 * scale, p.y - (trunkH + 44) * scale, (34 + stage * 11) * scale, (24 + stage * 8) * scale);
  ctx.fillStyle = "#61bd5c";
  ellipse(ctx, crownX + 30 * scale, p.y - (trunkH + 45) * scale, (38 + stage * 12) * scale, (26 + stage * 9) * scale);
  ctx.fillStyle = "rgba(190,255,142,.22)";
  ellipse(ctx, crownX - 34 * scale, p.y - (trunkH + 58) * scale, 26 * scale, 16 * scale);
  ctx.globalAlpha = 1;
}

function drawPortal(ctx, x, y) {
  const p = project(x, y);
  if (drawAnimatedAsset(ctx, "effect.portal", p.x, p.y - 10, { asset: "portal.grove", w: 120, h: 150, label: false })) return;
  ctx.strokeStyle = "#7fc1ee";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 42, 42, Math.PI, Math.PI * 2);
  ctx.lineTo(p.x + 42, p.y + 22);
  ctx.moveTo(p.x - 42, p.y - 42);
  ctx.lineTo(p.x - 42, p.y + 22);
  ctx.stroke();
  ctx.fillStyle = "rgba(113,169,207,.24)";
  ellipse(ctx, p.x, p.y - 16, 44 + Math.sin(gameTimeMs() / 250) * 4, 70);
}

function drawShop(ctx, x, y) {
  const p = project(x, y);
  if (drawAsset(ctx, "shop", p.x, p.y - 8, { w: 112, h: 112, label: false })) return;
  drawDiamond(ctx, p.x, p.y + 10, 96, 48, "#69502c", "#b7863d");
  ctx.fillStyle = "#c94f4b";
  ctx.beginPath();
  ctx.moveTo(p.x - 52, p.y - 6);
  ctx.lineTo(p.x, p.y - 58);
  ctx.lineTo(p.x + 52, p.y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0ddae";
  ctx.fillRect(p.x - 32, p.y - 8, 64, 30);
}

function drawCraftingTable(ctx, x, y) {
  const p = project(x, y);
  if (drawAsset(ctx, "craft.table", p.x, p.y - 2, { w: 92, h: 72, label: false })) return;
  drawDiamond(ctx, p.x, p.y + 18, 82, 42, "#3f2d20", "#8b643d");
  ctx.fillStyle = "#9d6a3d";
  roundRect(ctx, p.x - 42, p.y - 12, 84, 26, 5);
  ctx.fill();
  ctx.fillStyle = "#d7a84f";
  ctx.fillRect(p.x + 12, p.y - 34, 10, 32);
}

function drawCampfire(ctx, x, y) {
  const p = project(x, y);
  if (drawAnimatedAsset(ctx, "effect.campfire", p.x, p.y - 8, { asset: "campfire", w: 72, h: 82, label: false })) return;
  drawDiamond(ctx, p.x, p.y + 12, 64, 30, "#30241b", "#5b4631");
  ctx.fillStyle = "rgba(255,146,69,.28)";
  ellipse(ctx, p.x, p.y - 8, 48, 38);
  ctx.fillStyle = "#ff7a3d";
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 44);
  ctx.lineTo(p.x - 16, p.y);
  ctx.lineTo(p.x + 16, p.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd36c";
  ctx.beginPath();
  ctx.moveTo(p.x + 2, p.y - 30);
  ctx.lineTo(p.x - 7, p.y);
  ctx.lineTo(p.x + 10, p.y);
  ctx.closePath();
  ctx.fill();
}

function drawPillar(ctx, x, y) {
  const p = project(x, y);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ellipse(ctx, p.x, p.y + 20, 42, 16);
  ctx.fillStyle = "#2f2f3e";
  roundRect(ctx, p.x - 15, p.y - 62, 30, 82, 6);
  ctx.fill();
  ctx.fillStyle = "#44445a";
  ctx.fillRect(p.x - 22, p.y - 66, 44, 12);
}

function drawObstacle(ctx, obstacle) {
  const p = project(obstacle.x, obstacle.y);
  ctx.fillStyle = "rgba(0,0,0,.24)";
  ellipse(ctx, p.x, p.y + 18, 48 * (obstacle.r || 0.7), 18 * (obstacle.r || 0.7));
  if (drawAsset(ctx, obstacle.asset || "obstacle.pillar", p.x, p.y - 30, { w: 72, h: 92, label: false })) return;
  drawPillar(ctx, obstacle.x, obstacle.y);
}

function drawGate(ctx, gate) {
  const p = project(gate.x, gate.y);
  const hue = gate.kind === "elite" || gate.kind === "boss" ? "#c79cf2" : gate.kind === "cache" ? "#d7a84f" : gate.kind === "grove" ? "#77b86b" : "#7fc1ee";
  ctx.strokeStyle = hue;
  ctx.lineWidth = gate.kind === "boss" ? 7 : 5;
  ctx.globalAlpha = 0.78 + Math.sin(gameTimeMs() / 220) * 0.18;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 24, 34, Math.PI, 0);
  ctx.lineTo(p.x + 34, p.y + 22);
  ctx.moveTo(p.x - 34, p.y - 24);
  ctx.lineTo(p.x - 34, p.y + 22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,.45)";
  roundRect(ctx, p.x - 58, p.y + 24, 116, 24, 5);
  ctx.fill();
  ctx.fillStyle = "#f0eee3";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(gate.label, p.x, p.y + 41);
}

function drawFloorPortal(ctx, portal) {
  const p = project(portal.x, portal.y);
  const pulse = Math.sin(gameTimeMs() / 210);
  if (drawAnimatedAsset(ctx, "effect.portal", p.x, p.y - 10, { asset: portal.kind === "grove" ? "portal.return" : "portal.floor", w: 108 + pulse * 4, h: 120 + pulse * 5, label: false })) return;
  const hue = portal.kind === "grove" ? "#77b86b" : "#7fc1ee";
  ctx.save();
  ctx.globalAlpha = 0.75 + pulse * 0.15;
  ctx.fillStyle = portal.kind === "grove" ? "rgba(119,184,107,.28)" : "rgba(127,193,238,.26)";
  ellipse(ctx, p.x, p.y + 8, 84 + pulse * 6, 36 + pulse * 4);
  ctx.strokeStyle = hue;
  ctx.lineWidth = 5;
  ellipse(ctx, p.x, p.y + 8, 68, 26);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(240,217,162,.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 18, 28 + pulse * 3, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  ctx.restore();
}

function drawHero(ctx) {
  const p = project(state.player.x, state.player.y);
  const weapon = state.hero.equipment.weapon || basicWeapon();
  const aim = screenUnitFromWorldAngle(state.player.dir);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ellipse(ctx, p.x, p.y + 20, 34, 12);
  drawAnimatedAsset(ctx, actorAnimationKey(state.player, "hero"), p.x, p.y - 18, { asset: "character.hero", w: 62, h: 86, label: false, body: state.player.invuln > 0 ? "#ffe1a4" : "#80a9c8" });
  if (state.player.attackT > 0 && weapon.mode !== "melee") {
    ctx.fillStyle = weapon.color || "#d7a84f";
    ellipse(ctx, p.x + 30 * aim.x, p.y - 24 + 30 * aim.y, 14, 14);
  }
  ctx.strokeStyle = weapon.mode === "magic" ? "#8fd9ff" : weapon.mode === "ranged" ? "#d8b56d" : "#d7a84f";
  ctx.lineWidth = weapon.mode === "ranged" ? 5 : 4;
  ctx.beginPath();
  ctx.moveTo(p.x + 10, p.y - 24);
  ctx.lineTo(p.x + 30 * aim.x, p.y - 24 + 30 * aim.y);
  ctx.stroke();
}

function drawEnemy(ctx, enemy) {
  const p = project(enemy.x, enemy.y);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ellipse(ctx, p.x, p.y + 18, enemy.boss ? 64 : enemy.elite ? 46 : 34, enemy.boss ? 20 : 13);
  if (drawAnimatedAsset(ctx, actorAnimationKey(enemy, "enemy"), p.x, p.y - 22, { asset: enemy.asset || "monster.gnawer", w: enemy.boss ? 92 : enemy.elite ? 70 : 54, h: enemy.boss ? 92 : enemy.elite ? 72 : 56, label: false, fill: enemy.hit > 0 ? "#ffd0b8" : undefined })) {
    if (enemy.slow > 0) {
      ctx.strokeStyle = "rgba(143,217,255,.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - (enemy.boss ? 42 : 30), (enemy.boss ? 76 : enemy.elite ? 56 : 42) / 2, (enemy.boss ? 72 : enemy.elite ? 52 : 42) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawBar(ctx, p.x - 32, p.y - (enemy.boss ? 106 : 76), 64, 7, enemy.hp / enemy.maxHp, "#d86a5f");
    return;
  }
  ctx.fillStyle = enemy.hit > 0 ? "#ffd0b8" : enemy.boss ? "#743447" : enemy.elite ? "#8f4e62" : "#6e3635";
  ellipse(ctx, p.x, p.y - (enemy.boss ? 40 : 28), enemy.boss ? 62 : enemy.elite ? 44 : 32, enemy.boss ? 58 : enemy.elite ? 42 : 32);
  ctx.fillStyle = enemy.boss ? "#d7a84f" : "#292029";
  ellipse(ctx, p.x - 11, p.y - 38, 5, 5);
  ellipse(ctx, p.x + 11, p.y - 38, 5, 5);
  if (enemy.slow > 0) {
    ctx.strokeStyle = "rgba(143,217,255,.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - (enemy.boss ? 40 : 28), (enemy.boss ? 72 : enemy.elite ? 52 : 38) / 2, (enemy.boss ? 68 : enemy.elite ? 50 : 38) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawBar(ctx, p.x - 32, p.y - (enemy.boss ? 106 : 76), 64, 7, enemy.hp / enemy.maxHp, "#d86a5f");
}

function drawPickup(ctx, pickup) {
  const p = project(pickup.x, pickup.y);
  const bob = Math.sin((pickup.t || 0) * 5) * 5;
  const color = pickup.item.kind === "fertilizer" ? "#77b86b" : pickup.item.kind === "material" ? "#d7a84f" : pickup.item.kind === "consumable" ? "#d86a5f" : pickup.item.kind === "quest" ? "#c79cf2" : rarityColor(pickup.item);
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ellipse(ctx, p.x, p.y + 16, 24, 9);
  if (drawAsset(ctx, itemAssetKey(pickup.item), p.x, p.y - 10 + bob, { w: 28, h: 28, label: false, fill: color })) return;
  ctx.fillStyle = color;
  ellipse(ctx, p.x, p.y - 10 + bob, 16, 16);
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.stroke();
}

function drawProjectile(ctx, projectile) {
  const p = project(projectile.x, projectile.y);
  const screenVx = (projectile.vx - projectile.vy) * (TILE_W / 2);
  const screenVy = (projectile.vx + projectile.vy) * (TILE_H / 2);
  ctx.save();
  ctx.translate(p.x, p.y - 24);
  ctx.rotate(Math.atan2(screenVy, screenVx));
  ctx.fillStyle = projectile.color;
  ctx.strokeStyle = projectile.color;
  ctx.lineWidth = projectile.kind === "orb" ? 3 : 2;
  if (projectile.element && projectile.element !== "lightning") {
    drawAsset(ctx, `effect.${projectile.element}`, 0, 0, { w: projectile.radius * 34, h: projectile.radius * 34, label: false, fill: projectile.color, alpha: 0.72 });
    ctx.restore();
    return;
  }
  if (projectile.element === "lightning") {
    ctx.rotate(Math.PI / 2);
    drawAsset(ctx, "effect.lightning", 0, 0, { w: 36, h: 36, label: false, fill: projectile.color });
    ctx.restore();
    return;
  }
  if (projectile.kind === "arrow" || projectile.kind === "bolt") {
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-14, -3);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-14, 3);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.globalAlpha = 0.85;
    ellipse(ctx, 0, 0, projectile.radius * 22, projectile.radius * 22);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawParticle(ctx, particle) {
  const p = project(particle.x, particle.y);
  ctx.globalAlpha = Math.max(0, particle.life / particle.max);
  ctx.fillStyle = particle.color;
  ellipse(ctx, p.x, p.y - 20, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx) {
  ctx.textAlign = "center";
  ctx.font = "700 16px system-ui";
  for (const floater of runtime.floaters) {
    const p = project(floater.x, floater.y);
    ctx.globalAlpha = Math.max(0, floater.life / 0.8);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, p.x, p.y - 58);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.78);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function renderHud() {
  const stats = statBlock();
  const xpNeed = xpToLevel(state.hero.level);
  const treeNeed = treeXpToLevel(state.tree.level);
  const potionKey = keyLabel(keyFor("potion"));
  const interactKey = keyLabel(keyFor("interact"));
  const hudHtml = `
    <div class="hud-left">
      <strong>${state.hero.name}</strong>
      <span>Lv ${state.hero.level}</span>
      ${bar("HP", state.hero.hp, stats.maxHp, "hp")}
      ${bar("XP", state.hero.xp, xpNeed, "xp")}
      ${bar("Tree", state.tree.xp, treeNeed, "tree")}
    </div>
    <div class="hud-center">
      <span>${state.area === "dungeon" ? `Depth ${state.dungeon.depth}` : "Rest Grove"}</span>
      <span>${state.hero.gold}g</span>
      <span class="potion-slot"><b>${escapeHtml(potionKey)}</b> Potion x${potionCount()}</span>
      ${state.hero.points ? `<span>${state.hero.points} stat pts</span>` : ""}
      ${state.tree.points ? `<span>${state.tree.points} tree pts</span>` : ""}
    </div>
    <div class="hud-right">${state.message}</div>
  `;
  if (hudHtml !== runtime.lastHudHtml) {
    runtime.hud.innerHTML = hudHtml;
    runtime.lastHudHtml = hudHtml;
  }
  const action = nearbyAction();
  const promptHtml = action ? `<span class="prompt-key">${escapeHtml(interactKey)}</span><span>${escapeHtml(action.label)}</span>` : "";
  if (promptHtml !== runtime.lastPromptHtml) {
    runtime.prompt.innerHTML = promptHtml;
    runtime.lastPromptHtml = promptHtml;
  }
}

function bar(label, value, max, cls) {
  const pct = clamp((value / max) * 100, 0, 100);
  return `<div class="meter-row" data-asset="hud.${cls}"><span>${label}</span><div class="meter ${cls}"><i style="width:${pct}%"></i></div><b>${Math.max(0, Math.ceil(value))}/${max}</b></div>`;
}

function renderOverlay() {
  if (!runtime.overlay) return;
  hideItemTooltip();
  if (state.overlay !== "inventory") runtime.sellMode = false;
  if (!state.overlay) {
    runtime.overlay.className = "overlay-root";
    runtime.overlay.innerHTML = "";
    return;
  }
  runtime.overlay.className = `overlay-root ${state.overlay === "pause" ? "overlay-dim" : ""}`;
  const views = {
    pause: pauseOverlay,
    inventory: inventoryOverlay,
    tree: treeOverlay,
    craft: craftOverlay,
    shop: shopOverlay,
    map: mapOverlay,
    portal: portalOverlay,
    quests: questsOverlay,
    save: saveOverlay,
    keybinds: keybindOverlay,
    settings: settingsOverlay
  };
  const closeButton = state.overlay === "pause" ? "" : `<button class="close" onclick="toggleOverlay(null)">Close</button>`;
  runtime.overlay.innerHTML = `
    <section class="overlay-panel ${state.overlay}-panel">
      ${closeButton}
      ${views[state.overlay] ? views[state.overlay]() : ""}
    </section>
  `;
}

function mapOverlay() {
  if (state.area !== "dungeon" || !state.dungeon.map) {
    return `<h2>Root Map</h2><p class="muted">Enter the dungeon gate to unroll a route map.</p>`;
  }
  const nodes = state.dungeon.map.rows.flat();
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const lines = nodes.flatMap((node) => node.next.map((id) => {
    const next = nodeById[id];
    if (!next) return "";
    const active = currentMapNode()?.id === node.id || state.dungeon.map.route.includes(node.id);
    return `<line x1="${node.x * 100}%" y1="${node.y * 100}%" x2="${next.x * 100}%" y2="${next.y * 100}%" class="${active ? "lit" : ""}" />`;
  })).join("");
  const buttons = nodes.map((node) => {
    const choose = canChooseMapNode(node);
    const current = currentMapNode()?.id === node.id;
    const classes = ["map-node", node.kind, node.done ? "done" : "", choose ? "ready" : "", current ? "current" : ""].join(" ");
    return `<button class="${classes}" data-asset="map.node.${node.kind}" style="left:${node.x * 100}%; top:${node.y * 100}%;" ${choose ? "" : "disabled"} onclick="chooseMapNode('${node.id}')"><b>${nodeGlyph(node.kind)}</b><span>${nodeLabel(node.kind)}</span></button>`;
  }).join("");
  return `
    <h2>Root Map</h2>
    <p class="map-note">Choose a connected room. Monster rooms feed XP, cache rooms feed crafting, elite rooms risk blood for stronger loot.</p>
    <div class="map-scroll">
      <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
      <div class="map-boss">ROOT-EATER</div>
      ${buttons}
      <span class="map-scribble one"></span>
      <span class="map-scribble two"></span>
      <span class="map-scribble three"></span>
    </div>
    <div class="map-actions">
      ${state.dungeon.runComplete ? `<button class="gold" onclick="finishDungeonRun()">Return to Grove</button>` : ""}
      <button onclick="toggleOverlay(null)">Close Map</button>
    </div>
  `;
}

function portalOverlay() {
  const portal = state.pendingPortal || state.dungeon.room?.portal;
  if (!portal) return `<h2>Portal</h2><p class="muted">There is no portal here.</p>`;
  const label = portal.label || (portal.kind === "grove" ? "Return to Grove" : "Root Depth Portal");
  const mapPortal = portal.kind !== "grove";
  return `
    <h2>Portal</h2>
    <p class="muted">${escapeHtml(label)}</p>
    <div class="portal-actions">
      ${mapPortal ? `<button class="gold" onclick="diveDeeperFromPortal()">Open Root Map</button>` : ""}
      <button onclick="finishDungeonRun()">Return to Grove</button>
      <button onclick="toggleOverlay(null)">Cancel</button>
    </div>
  `;
}

function diveDeeperFromPortal() {
  state.pendingPortal = null;
  if (!state.dungeon.map) state.dungeon.map = makeDungeonMap();
  const current = currentMapNode();
  if (state.dungeon.room?.cleared && current) current.done = true;
  state.overlay = "map";
  state.message = "Choose the next root path.";
  renderOverlay();
}

function nodeGlyph(kind) {
  if (kind === "boss") return "B";
  if (kind === "elite") return "E";
  if (kind === "cache") return "C";
  return "M";
}

function nodeLabel(kind) {
  if (kind === "boss") return "Guardian";
  if (kind === "elite") return "Elite";
  if (kind === "cache") return "Cache";
  return "Fight";
}

function inventoryOverlay() {
  const stats = statBlock();
  const weapon = combatWeapon();
  const capacity = bagCapacity();
  const filled = state.hero.inventory.length;
  const overflow = Math.max(0, filled - capacity);
  const visibleSlots = capacity + overflow;
  const equip = ["helm", "amulet", "weapon", "armor", "offhand", "gloves", "ring", "belt", "boots"].map((slot) => {
    const item = state.hero.equipment[slot];
    const twoHandLocked = slot === "offhand" && !item && isTwoHandedWeapon(state.hero.equipment.weapon);
    return `<div class="paper-slot slot-${slot} ${item ? `has-tooltip rarity-${item.rarity || "common"}` : ""}" ${item ? `style="--item-color:${rarityColor(item)}" data-tooltip-tone="${tooltipTone(item)}" data-tooltip="${escapeAttr(itemTooltip(item, "equipped"))}"` : ""}>
      <span>${slotLabel(slot)}</span>
      <b style="color:${item ? itemNameColor(item) : "#6a4a2c"}">${item ? escapeHtml(item.name) : twoHandLocked ? "two-handed" : "empty"}</b>
      ${item ? `<small class="item-statline">${escapeHtml(itemSummary(item))}</small>` : ""}
      ${item ? `<button onclick="unequip('${slot}')">X</button>` : ""}
    </div>`;
  }).join("");
  return `
    <h2>Hero Ledger</h2>
    <div class="equipment-screen">
      <div class="paper-doll">
        <div class="paper-hero" data-asset="character.inventory"><i></i></div>
        ${equip}
      </div>
      <div class="stats-list parchment-list">
        ${["str", "dex", "int", "vit"].map((stat) => `<button ${state.hero.points ? "" : "disabled"} onclick="allocateStat('${stat}')">${stat.toUpperCase()} ${stats[stat]} +</button>`).join("")}
        <span>Power ${stats.power}</span><span>Attack ${stats.attack}</span><span>Defense ${stats.defense}</span><span>Move ${formatNumber(stats.moveSpeed)}</span><span>Attack Speed ${formatNumber(weaponAttackSpeed(weapon))}s</span><span>Crit ${Math.round(stats.crit * 100)}%</span><span>${attackStyleLabel()}</span>
      </div>
      <div class="bag-panel ${runtime.sellMode ? "sell-mode" : ""}">
        <div class="pack-head">
          <h3>Pack ${Math.min(filled, capacity)}/${capacity}${overflow ? ` (+${overflow})` : ""}</h3>
          <div class="pack-actions">
            <button onclick="sortInventory()">Sort</button>
            <button class="${runtime.sellMode ? "active danger" : ""}" onclick="toggleSellMode()">${runtime.sellMode ? "Selling" : "Sell"}</button>
          </div>
        </div>
        <div class="minecraft-grid">${inventoryCells(state.hero.inventory, visibleSlots, capacity)}</div>
      </div>
    </div>
  `;
}

function bagCapacity() {
  return 12 + beltSlots(state.hero.equipment.belt);
}

function beltSlots(item) {
  if (!item || item.slot !== "belt") return 0;
  if (Number.isFinite(item.slots)) return item.slots;
  const rarity = RARITIES.findIndex((entry) => entry.name === item.rarity);
  return 6 + Math.max(0, rarity) * 6 + Math.floor((item.level || 1) / 4) * 6;
}

function itemRow(item, actions = "", context = actions ? "shop" : "bag") {
  return `
    <div class="item-row has-tooltip rarity-${item.rarity || "common"}" style="--item-color:${rarityColor(item)}" data-tooltip-tone="${tooltipTone(item)}" data-tooltip="${escapeAttr(itemTooltip(item, context))}">
      <b style="color:${itemNameColor(item)}">${escapeHtml(item.name)}${item.qty > 1 ? ` x${item.qty}` : ""}</b>
      <span>${escapeHtml(itemSummary(item))} - ${item.value}g</span>
      <div>
        ${actions || `${item.slot ? `<button onclick="equipItem('${item.id}')">Equip</button>` : ""}${item.kind === "consumable" ? `<button onclick="useItem('${item.id}')">Use</button>` : ""}<button onclick="sellItem('${item.id}')">Sell</button>`}
      </div>
    </div>
  `;
}

function inventoryCells(items, size, softLimit = size) {
  const cells = [];
  for (let i = 0; i < size; i++) cells.push(itemCell(items[i], i >= softLimit));
  return cells.join("");
}

function itemCell(item, overflow = false) {
  if (!item) return `<span class="item-cell empty"></span>`;
  const normalAction = item.slot ? `equipItem('${item.id}')` : item.kind === "consumable" ? `useItem('${item.id}')` : "";
  const action = runtime.sellMode ? `sellItem('${item.id}')` : normalAction;
  const tag = itemCellTag(item);
  const tooltip = `${itemTooltip(item, runtime.sellMode ? "sell" : "bag")}${overflow ? `<div class="tooltip-note">Over pack limit: sell or equip items to restore free slots.</div>` : ""}`;
  return `<div class="item-cell item-filled ${item.kind} rarity-${item.rarity || "common"} ${overflow ? "overflow-cell" : ""} has-tooltip" style="--item-color:${rarityColor(item)}" data-asset="${itemAssetKey(item)}" data-tooltip-tone="${tooltipTone(item)}" data-tooltip="${escapeAttr(tooltip)}">
    <button class="item-use" ${action ? `onclick="${action}"` : ""}>
      <b class="item-icon" style="color:${itemNameColor(item)}">${tag}</b>
      <i>${escapeHtml(itemCellStat(item))}</i>
      <span>${item.qty > 1 ? item.qty : ""}</span>
    </button>
  </div>`;
}

function itemSummary(item) {
  if (!item) return "";
  if (item.kind === "weapon") return weaponSummary(item);
  if (item.kind === "armor" || item.kind === "accessory") {
    const stats = statLines(item).join(" ");
    const slots = item.slot === "belt" ? ` Pack +${beltSlots(item)}` : "";
    const mods = item.modifiers?.length ? ` ${item.modifiers.length} mod${item.modifiers.length === 1 ? "" : "s"}` : "";
    return `${stats}${slots}${mods}`.trim() || item.kind;
  }
  if (item.kind === "fertilizer") return `Tree XP +${item.treeXp || 24}`;
  if (item.kind === "consumable") return consumableUseText(item);
  if (item.kind === "material") return "Crafting material";
  if (item.kind === "quest") return "Quest item";
  return item.kind;
}

function weaponSummary(item) {
  const stats = statLines(item).join(" ");
  const cls = weaponClass(item);
  const mods = item.modifiers?.length ? ` ${item.modifiers.length} mod${item.modifiers.length === 1 ? "" : "s"}` : "";
  if (isTome(item) || isQuiver(item)) return `${cls} ${stats} ${offhandEffectSummary(item)}${mods}`.trim();
  if (item.mode === "melee") return `${cls} ${stats} Cleave ${meleeCleave(item)}${mods}`.trim();
  if (item.mode === "ranged") {
    const pierce = projectilePierce(item);
    const chain = projectileChain(item);
    return `${cls} ${stats} ${chain ? `Chain ${chain}` : `Pierce ${pierce}`}${mods}`.trim();
  }
  if (item.mode === "magic") {
    const element = ELEMENTS[magicElement(item)].name;
    return `${cls} ${stats} ${element}${mods}`.trim();
  }
  return `${stats}${mods}`.trim() || item.kind;
}

function offhandEffectSummary(item) {
  const parts = [];
  if (item.projectileSpeed) parts.push(`Proj speed +${formatNumber(item.projectileSpeed)}`);
  if (item.projectileCount) parts.push(`Projectiles +${item.projectileCount}`);
  if (item.pierce) parts.push(`Pierce +${item.pierce}`);
  if (item.forks) parts.push(`Forks ${item.forks}`);
  if (item.homing) parts.push(`Homing ${formatNumber(item.homing)}`);
  if (item.aoe) parts.push(`AoE ${formatNumber(item.aoe)}`);
  if (item.chain) parts.push(`Chain +${item.chain}`);
  return parts.join(" ");
}

function itemCellStat(item) {
  if (item.kind === "weapon") {
    if (item.stats?.attack) return `A+${item.stats.attack}`;
    if (item.stats?.defense) return `D+${item.stats.defense}`;
    return "";
  }
  if (item.kind === "armor") return item.stats?.defense ? `D+${item.stats.defense}` : "";
  if (item.slot === "belt") return `+${beltSlots(item)}`;
  if (item.kind === "accessory") return statLines(item)[0] || "";
  if (item.kind === "fertilizer") return `T+${item.treeXp || 24}`;
  if (item.kind === "consumable") return consumableShortText(item);
  return "";
}

function itemCellTag(item) {
  if (item.kind === "weapon") return weaponClassTag(item);
  return item.kind.slice(0, 3).toUpperCase();
}

function itemAssetKey(item) {
  if (!item) return "missing";
  if (item.kind === "weapon") return `item.weapon.${weaponClass(item).toLowerCase()}`;
  if (item.kind === "armor") return "item.armor";
  if (item.kind === "accessory") return "item.accessory";
  if (item.kind === "material") return "item.material";
  if (item.kind === "fertilizer") return "item.fertilizer";
  if (item.kind === "consumable") return "item.consumable";
  if (item.kind === "quest") return "item.quest";
  return "missing";
}

function weaponClass(item) {
  if (item.class) return item.class;
  if (item.type === "Two-Handed Sword") return "Greatsword";
  if (item.type === "Magic Staff") return "Staff";
  return item.type || "Weapon";
}

function weaponClassTag(item) {
  const tags = {
    Sword: "SWD",
    Greatsword: "2HS",
    Axe: "AXE",
    Spear: "SPR",
    Bow: "BOW",
    Crossbow: "XBW",
    Staff: "STF",
    Wand: "WND",
    Shield: "SHD",
    Tome: "TOM",
    Quiver: "QVR",
    Unarmed: "HND"
  };
  return tags[weaponClass(item)] || "WEA";
}

function itemTooltip(item, context = "bag") {
  const lines = [
    `<div class="tooltip-title">${escapeHtml(item.name)}${item.qty > 1 ? ` x${item.qty}` : ""}</div>`,
    `<div class="tooltip-subtitle">${escapeHtml(`${title(item.rarity || item.kind)} ${item.kind === "weapon" ? weaponClass(item) : title(item.kind)}${item.level ? ` Lv ${item.level}` : ""}${item.slot ? ` - ${slotLabel(item.slot)}` : ""}`)}</div>`
  ];
  const stats = statLines(item);
  if (stats.length) lines.push(`<div class="tooltip-base-stats">${escapeHtml(stats.join(", "))}</div>`);
  if (item.modifiers?.length) {
    const tone = modifierToneClass(item.modifiers.length);
    lines.push(...item.modifiers.map((modifier) => `<div class="tooltip-mod ${tone}">${escapeHtml(`${modifier.name}: ${modifier.text}`)}</div>`));
  }
  if (item.kind === "weapon") lines.push(...weaponTooltipLines(item));
  if (item.slot === "offhand" && !canUseOffhandWithWeapon(item, state.hero.equipment.weapon)) lines.push(tooltipNote(offhandRequirementText(item)));
  if (item.slot === "belt") lines.push(tooltipNote(`Pack slots +${beltSlots(item)}`));
  if (item.kind === "fertilizer") lines.push(tooltipNote(`Use at the tree: +${item.treeXp || 24} tree XP.`));
  if (item.kind === "consumable") lines.push(tooltipNote(`Use: ${consumableUseText(item)}.`));
  if (item.kind === "material") lines.push(tooltipNote("Used for crafting weapons, armor, fertilizer, and table upgrades."));
  if (item.kind === "quest") lines.push(tooltipNote("Turn in to the tree when its quest asks for this."));
  if (context === "sell") lines.push(tooltipNote(`Sell mode: click to sell one for ${sellValue(item)}g.`));
  else if (item.slot && context !== "shop") lines.push(tooltipNote(context === "equipped" ? "Equipped. Press X to unequip." : "Click to equip."));
  else if (item.kind === "consumable") lines.push(tooltipNote("Click to use."));
  if (context === "bag") lines.push(tooltipNote("Use the Sell toggle above, then click the item to sell one."));
  lines.push(`<div class="tooltip-value">Value ${item.value || 0}g</div>`);
  return lines.filter(Boolean).join("");
}

function weaponTooltipLines(item) {
  if (isTome(item) || isQuiver(item)) {
    const lines = [tooltipNote(`${weaponClass(item)} off-hand. ${isTome(item) ? "Requires a wand." : "Requires a bow or crossbow."}`)];
    const effects = offhandEffectSummary(item);
    if (effects) lines.push(tooltipNote(effects));
    return lines;
  }
  const lines = [tooltipNote(`${weaponClass(item)} ${title(item.mode)} attack. Range ${formatNumber(weaponRange(item))}. Attack Speed ${formatNumber(weaponAttackSpeed(item))}s.`)];
  if (isTwoHandedWeapon(item)) lines.push(tooltipNote("Uses both hands and disables the off-hand slot."));
  if (item.mode === "melee") lines.push(tooltipNote(`Cleave hits up to ${meleeCleave(item)} enemies inside the swing arc.`));
  if (item.mode === "ranged") {
    const chain = projectileChain(item);
    if (chain) lines.push(tooltipNote(`Shots chain to ${chain} nearby target${chain === 1 ? "" : "s"} after impact.`));
    else lines.push(tooltipNote(`Shots pierce ${projectilePierce(item)} additional target${projectilePierce(item) === 1 ? "" : "s"}.`));
    if (isBowWeapon(item)) lines.push(tooltipNote("Only quivers can be equipped off-hand with this weapon."));
    if (isBowWeapon(item)) lines.push(tooltipNote("Without a quiver, attacks are 50% slower."));
  }
  if (item.mode === "magic") {
    const element = ELEMENTS[magicElement(item)];
    lines.push(tooltipNote(`${element.name}: ${element.text}`));
  }
  return lines;
}

function tooltipNote(text) {
  return `<div class="tooltip-note">${escapeHtml(text)}</div>`;
}

function modifierToneClass(count) {
  if (count >= 4) return "mod-epic";
  if (count === 3) return "mod-rare";
  if (count === 2) return "mod-blue";
  return "mod-green";
}

function statLines(item) {
  if (!item?.stats) return [];
  return Object.entries(item.stats).map(([key, value]) => `${statLabel(key)} ${formatSigned(value, key)}`);
}

function statLabel(key) {
  return ({ str: "STR", dex: "DEX", int: "INT", vit: "VIT", hp: "HP", attack: "Attack", defense: "Defense", crit: "Crit" }[key] || title(key));
}

function formatSigned(value, key = "") {
  if (key === "crit") return `+${Math.round(value * 100)}%`;
  return `${value >= 0 ? "+" : ""}${value}`;
}

function consumableUse(item) {
  if (item.use) return item.use;
  const mult = item.useMult || 1;
  const scaled = (value) => Math.ceil(value * mult);
  if (item.name === "Recovery Potion") return { heal: scaled(80) };
  if (item.name === "Ironbark Stew") return { heal: scaled(45), xp: scaled(20) };
  if (item.name === "Moon Sap Tonic") return { treeXp: scaled(35), xp: scaled(15) };
  if (item.name === "Secret Seed") return { stat: Math.max(1, Math.round(mult)) };
  return { xp: scaled(35) };
}

function consumableUseText(item) {
  const use = consumableUse(item);
  const lines = [];
  if (use.heal) lines.push(`Heal ${use.heal}`);
  if (use.xp) lines.push(`XP +${use.xp}`);
  if (use.treeXp) lines.push(`Tree XP +${use.treeXp}`);
  if (use.stat) lines.push(`random stat +${use.stat}`);
  return lines.join(", ");
}

function consumableShortText(item) {
  const use = consumableUse(item);
  if (use.heal) return `H+${use.heal}`;
  if (use.treeXp) return `T+${use.treeXp}`;
  if (use.stat) return `S+${use.stat}`;
  if (use.xp) return `X+${use.xp}`;
  return "";
}

function slotLabel(slot) {
  return ({ offhand: "off hand", helm: "head" }[slot] || slot).toUpperCase();
}

function attackStyleLabel() {
  const weapon = combatWeapon();
  const cls = weaponClass(weapon);
  if (weapon.mode === "ranged") return `${cls}: ${projectileChain(weapon) ? "chain shot" : "piercing shot"}`;
  if (weapon.mode === "magic") return `${cls}: ${ELEMENTS[magicElement(weapon)].name} spell`;
  return `${cls}: cleave arc`;
}

function treeOverlay() {
  const stage = treeStage();
  const skills = TREE_SKILLS.map((skill) => {
    const rank = state.tree.skills[skill.id] || 0;
    return `
      <div class="skill-node ${rank >= skill.max ? "maxed" : ""}">
        <b>${skill.name}</b>
        <span>${rank}/${skill.max} - ${skill.text}</span>
        <button ${state.tree.points >= skill.cost && rank < skill.max ? "" : "disabled"} onclick="unlockSkill('${skill.id}')">Grow</button>
      </div>
    `;
  }).join("");
  const fertilizer = state.hero.inventory.filter((item) => item.kind === "fertilizer");
  const quests = questListHtml();
  return `
    <h2>Tree of Vows</h2>
    <div class="tree-screen">
      <div class="sapling-scene stage-${stage}">
        <div class="sun-card">Tree Lv ${state.tree.level}</div>
        <div class="hill"></div>
        <div class="sapling">
          <span class="stem"></span>
          <span class="leaf left"></span>
          <span class="leaf right"></span>
          <span class="crown"></span>
        </div>
      </div>
      <div>
        <h3>Branches</h3>
        <div class="skill-grid">${skills}</div>
      </div>
      <div>
        <h3>Fertilizer Satchel</h3>
        <div class="feed-row">${fertilizer.length ? fertilizer.map((item) => `<button class="has-tooltip rarity-${item.rarity || "common"}" style="--item-color:${rarityColor(item)}; color:${itemNameColor(item)}" data-tooltip-tone="${tooltipTone(item)}" data-tooltip="${escapeAttr(itemTooltip(item))}" onclick="feedTree('${item.id}')">${escapeHtml(item.name)} x${item.qty}</button>`).join("") : `<p class="muted">Bring fertilizer from the dungeon or craft it.</p>`}</div>
        <h3>Bark Quests</h3>
        <div class="quest-list">${quests}</div>
      </div>
    </div>
  `;
}

function questListHtml() {
  return visibleQuests().map((quest) => {
    const progress = questProgress(quest.id);
    const have = quest.need.kind ? countKind(quest.need.kind) : countItem(quest.need.name);
    return `
      <div class="quest-line ${quest.origin ? "origin-quest" : ""}">
        <b>${escapeHtml(quest.title)}</b><span>${progress.done ? "done" : `${have}/${quest.need.qty}`}</span>
        <button ${!progress.done && have >= quest.need.qty ? "" : "disabled"} onclick="completeQuest('${quest.id}')">Turn In</button>
        <small>${escapeHtml(quest.text || questNeedLabel(quest))}</small>
      </div>
    `;
  }).join("");
}

function visibleQuests() {
  const origin = state.hero.origin || PLAYER_DEFAULTS.origin;
  return QUESTS
    .filter((quest) => !quest.origin || quest.origin === origin)
    .sort((a, b) => Number(Boolean(b.origin)) - Number(Boolean(a.origin)));
}

function questProgress(id) {
  let progress = state.quests.find((entry) => entry.id === id);
  if (!progress) {
    progress = { id, done: false };
    state.quests.push(progress);
  }
  return progress;
}

function questNeedLabel(quest) {
  const name = quest.need.kind ? `${title(quest.need.kind)} items` : quest.need.name;
  return `Needs ${name} x${quest.need.qty}.`;
}

function craftOverlay() {
  const recipes = RECIPES.map((recipe) => {
    const can = canCraft(recipe);
    const needs = Object.entries(recipe.need).map(([name, qty]) => `${name} ${countItem(name)}/${qty}`).join(" - ");
    const ingredientCells = Object.entries(recipe.need).map(([name, qty]) => `<span class="craft-cell filled"><b>${shortName(name)}</b><small>${countItem(name)}/${qty}</small></span>`).join("");
    return `<div class="recipe-card">
      <div class="crafting-matrix">${ingredientCells}${emptyCraftCells(4 - Object.keys(recipe.need).length)}</div>
      <span class="craft-arrow">></span>
      <span class="craft-output">${shortName(recipe.name)}</span>
      <div class="recipe-copy"><b>${recipe.name}</b><span>${needs}</span><button ${can ? "" : "disabled"} onclick="craft('${recipe.id}')">Make</button></div>
    </div>`;
  }).join("");
  const materials = state.hero.inventory.filter((item) => ["material", "fertilizer", "quest"].includes(item.kind));
  return `
    <h2>Crafting Table</h2>
    <div class="craft-screen">
      <div class="recipe-list">${recipes}</div>
      <div>
        <h3>Materials</h3>
        <div class="minecraft-grid">${inventoryCells(materials, 27)}</div>
      </div>
    </div>
  `;
}

function emptyCraftCells(count) {
  return Array.from({ length: Math.max(0, count) }, () => `<span class="craft-cell"></span>`).join("");
}

function shortName(name) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, "&#10;");
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function shopOverlay() {
  if (!state.shop.length) refreshShop();
  const stock = state.shop.map((item) => itemRow(item, `<button ${state.hero.gold >= item.value ? "" : "disabled"} onclick="buyItem('${item.id}')">Buy</button>`)).join("");
  return `<h2>Grove Keeper</h2><button onclick="refreshShop(); renderOverlay()">Refresh Wares</button><div class="item-list">${stock}</div>`;
}

function pauseOverlay() {
  const dungeonActions = state.area === "dungeon"
    ? `<button onclick="returnToGroveFromPause()">Return to Grove</button>`
    : "";
  return `
    <h2>Paused</h2>
    <div class="pause-menu">
      <button class="gold" onclick="toggleOverlay(null)">Resume</button>
      <button onclick="toggleOverlay('save')">Save / Load</button>
      <button onclick="toggleOverlay('quests')">Quests</button>
      <button onclick="toggleOverlay('keybinds')">Keybinds</button>
      <button onclick="toggleOverlay('settings')">Settings</button>
      ${dungeonActions}
      <button onclick="exitToMenu()">Exit</button>
    </div>
  `;
}

function questsOverlay() {
  return `
    <h2>Quest Log</h2>
    <div class="quest-list">${questListHtml()}</div>
  `;
}

function saveOverlay() {
  const slots = saveSystem.listSlots(SAVE_SLOT_COUNT).map(({ slot, exists, summary }) => {
    const active = slot === runtime.activeSaveSlot ? " active" : "";
    const details = exists
      ? `${escapeHtml(summary.hero)} Lv ${summary.level} - Tree ${summary.treeLevel} - ${escapeHtml(summary.area)}${summary.depth ? ` - best depth ${summary.depth}` : ""}`
      : "Empty slot";
    return `<div class="save-slot${active}">
      <div><b>Slot ${slot}</b><span>${details}</span></div>
      <button onclick="saveToSlot(${slot})">Save</button>
      <button ${exists ? "" : "disabled"} onclick="loadFromSlot(${slot})">Load</button>
      <button ${exists ? "" : "disabled"} onclick="deleteSaveSlot(${slot})">Delete</button>
    </div>`;
  }).join("");
  return `
    <h2>Save / Load</h2>
    <div class="save-slots">${slots}</div>
    <div class="menu-actions">
      <button onclick="saveToSlot(${runtime.activeSaveSlot})">Save Current Slot</button>
      <button onclick="toggleOverlay('pause')">Back</button>
    </div>
  `;
}

function keybindOverlay() {
  const rows = KEYBIND_ACTIONS.map((action) => {
    const waiting = runtime.bindingAction === action.id;
    return `<div class="keybind-row ${waiting ? "waiting" : ""}">
      <span>${escapeHtml(action.label)}</span>
      <button onclick="beginKeybindRebind('${action.id}')">${waiting ? "Press key" : escapeHtml(keyLabel(keyFor(action.id)))}</button>
    </div>`;
  }).join("");
  return `
    <h2>Keybinds</h2>
    <div class="keybind-list">${rows}</div>
    <div class="menu-actions">
      <button onclick="resetKeybinds()">Reset Defaults</button>
      <button onclick="toggleOverlay('pause')">Back</button>
    </div>
  `;
}

function settingsOverlay() {
  return `
    <h2>Settings</h2>
    <label class="check"><input type="checkbox" ${state.settings.autosave ? "checked" : ""} onchange="state.settings.autosave=this.checked; saveGame(${runtime.activeSaveSlot}, true)"> Autosave</label>
    <label class="check"><input type="checkbox" ${state.settings.screenshake ? "checked" : ""} onchange="state.settings.screenshake=this.checked; saveGame(${runtime.activeSaveSlot}, true)"> Screenshake</label>
    <div class="menu-actions">
      <button onclick="toggleOverlay('pause')">Back</button>
    </div>
  `;
}

function toggleOverlay(name) {
  runtime.bindingAction = null;
  state.overlay = state.overlay === name ? null : name;
  runtime.keys.clear();
  runtime.mouse.down = false;
  renderOverlay();
}

function statBlock() {
  return calculateHeroStats(state.hero, state.tree);
}

function makeItem(kind, level = 1, boost = 0) {
  const rarity = rollRarity(boost);
  const item = { id: uid(), kind, rarity: rarity.name, level, qty: 1, value: itemValue(level, rarity.mult), name: kind };
  if (kind === "weapon") {
    const base = pickWeighted(WEAPONS);
    const profile = base.rarityProfile || "balanced";
    item.type = base.type;
    item.class = base.class || base.type;
    item.name = rarity.name === "common" ? base.type : `${title(rarity.name)} ${base.type}`;
    item.slot = base.slot;
    item.hands = base.hands || 1;
    item.compatibleWeapons = base.compatibleWeapons;
    item.value = itemValue(level, rarityMult(WEAPON_RARITY_MULTS, profile, "value", rarity.name));
    item.range = base.range;
    item.attackSpeed = base.attackSpeed ?? base.speed;
    item.mode = base.mode;
    item.arc = base.arc;
    item.projectile = base.projectile;
    item.projectileSpeed = base.projectileSpeed;
    item.color = base.color;
    item.size = base.size;
    item.pierce = base.pierce || 0;
    item.projectileCount = base.projectileCount || 0;
    item.forks = base.forks || 0;
    item.homing = base.homing || 0;
    item.aoe = base.aoe || 0;
    if (base.mode === "melee") {
      const baseCleave = base.type === "Two-Handed Sword" || base.type === "Axe" ? 3 : base.type === "Spear" ? 2 : 2;
      item.cleave = Math.min(6, baseCleave + Math.floor(rarityRank(rarity.name) / 2) + Math.floor(level / 6));
    }
    if (base.mode === "ranged") {
      item.effect = Math.random() < 0.5 ? "pierce" : "chain";
      if (item.effect === "pierce") item.pierce = 1 + Math.floor(rarityRank(rarity.name) / 2) + Math.floor(level / 6);
      else {
        item.pierce = 0;
        item.chain = 1 + Math.floor(rarityRank(rarity.name) / 2) + Math.floor(level / 7);
        item.chainRange = 2.7;
        item.chainDamage = 0.56;
      }
    }
    if (base.mode === "magic") {
      item.element = pick(Object.keys(ELEMENTS));
      item.color = ELEMENTS[item.element].color;
      if (item.element === "fire") item.splash = 1.15 + rarityRank(rarity.name) * 0.12;
      if (item.element === "ice") {
        item.splash = 1.05;
        item.chill = 1.5 + rarityRank(rarity.name) * 0.25;
      }
      if (item.element === "lightning") {
        item.chain = 2 + rarityRank(rarity.name);
        item.chainRange = 2.9;
        item.chainDamage = 0.62;
      }
    }
    if (base.type === "Shield") {
      item.stats = {
        defense: Math.ceil((5 + level * 1.8) * rarityMult(WEAPON_RARITY_MULTS, profile, "defense", rarity.name)),
        hp: Math.ceil((8 + level * 3) * rarityMult(WEAPON_RARITY_MULTS, profile, "hp", rarity.name))
      };
    } else if (base.mode === "tome") {
      item.stats = {
        attack: Math.ceil((3 + level * 1.45) * rarityMult(WEAPON_RARITY_MULTS, profile, "attack", rarity.name)),
        int: Math.ceil((1 + level * 0.22) * rarityMult(WEAPON_RARITY_MULTS, profile, "stat", rarity.name))
      };
    } else if (base.mode === "quiver") {
      item.stats = {
        attack: Math.ceil((3 + level * 1.35) * rarityMult(WEAPON_RARITY_MULTS, profile, "attack", rarity.name)),
        dex: Math.ceil((1 + level * 0.2) * rarityMult(WEAPON_RARITY_MULTS, profile, "stat", rarity.name))
      };
    } else if (base.stat === "int") {
      item.stats = {
        attack: Math.ceil((5 + level * 2.2) * (base.attackMult || 1) * rarityMult(WEAPON_RARITY_MULTS, profile, "attack", rarity.name)),
        int: Math.ceil((1 + level * 0.3) * (base.statMult || 1) * rarityMult(WEAPON_RARITY_MULTS, profile, "stat", rarity.name))
      };
    } else {
      item.stats = {
        attack: Math.ceil((6 + level * 2.5) * (base.attackMult || 1) * rarityMult(WEAPON_RARITY_MULTS, profile, "attack", rarity.name)),
        [base.stat]: Math.ceil(Math.max(0.2, level * 0.22) * (base.statMult || 1) * rarityMult(WEAPON_RARITY_MULTS, profile, "stat", rarity.name))
      };
    }
    randomizeWeaponBaseStats(item, rarity.name);
    applyWeaponModifiers(item, base, rarity.name, level);
  }
  if (kind === "armor") {
    const base = pick(ARMORS);
    const trait = ARMOR_TRAITS[base.weight] || ARMOR_TRAITS.medium;
    const profile = base.rarityProfile || base.weight || "medium";
    item.type = base.type;
    item.name = rarity.name === "common" ? base.type : `${title(rarity.name)} ${base.type}`;
    item.slot = base.slot;
    item.value = itemValue(level, rarityMult(ARMOR_RARITY_MULTS, profile, "value", rarity.name));
    item.stats = {
      defense: Math.ceil((4 + level * 1.6) * rarityMult(ARMOR_RARITY_MULTS, profile, "defense", rarity.name) * trait.defenseMult),
      hp: Math.ceil((5 + level * 3) * rarityMult(ARMOR_RARITY_MULTS, profile, "hp", rarity.name) * trait.hpMult)
    };
    randomizeArmorBaseStats(item, rarity.name);
    applyArmorModifiers(item, base, rarity.name, level);
  }
  if (kind === "accessory") {
    const base = pick(ACCESSORIES);
    const profile = base.rarityProfile || base.slot || "ring";
    const stat = pick(["str", "dex", "int", "vit", "crit"]);
    item.type = base.type;
    item.name = rarity.name === "common" ? base.type : `${title(rarity.name)} ${base.type}`;
    item.slot = base.slot;
    item.value = itemValue(level, rarityMult(ACCESSORY_RARITY_MULTS, profile, "value", rarity.name));
    item.stats = stat === "crit"
      ? { crit: Number(((0.03 + level * 0.002) * rarityMult(ACCESSORY_RARITY_MULTS, profile, "crit", rarity.name)).toFixed(3)) }
      : { [stat]: Math.ceil((1 + level / 4) * rarityMult(ACCESSORY_RARITY_MULTS, profile, "stat", rarity.name)) };
    if (base.slot === "belt") item.slots = Math.ceil((6 + Math.floor(level / 4) * 6) * rarityMult(ACCESSORY_RARITY_MULTS, profile, "slots", rarity.name));
  }
  if (kind === "material") {
    const base = pick(MATERIALS);
    const profile = base.rarityProfile || "commonMaterial";
    item.name = itemBaseName(base);
    item.value = Math.ceil((12 + level * 3) * rarityMult(MATERIAL_RARITY_MULTS, profile, "value", rarity.name));
  }
  if (kind === "fertilizer") {
    const index = clamp(Math.floor(level / 3), 0, FERTILIZERS.length - 1);
    const base = FERTILIZERS[index];
    const profile = base.rarityProfile || "faint";
    item.name = base.name;
    item.treeXp = Math.ceil(base.xp * rarityMult(FERTILIZER_RARITY_MULTS, profile, "treeXp", rarity.name));
    item.value = Math.ceil(base.value * rarityMult(FERTILIZER_RARITY_MULTS, profile, "value", rarity.name));
  }
  if (kind === "consumable") {
    const base = pick(CONSUMABLES);
    const profile = base.rarityProfile || "potion";
    item.name = itemBaseName(base);
    item.value = Math.ceil((base.value || 28 + level * 4) * rarityMult(CONSUMABLE_RARITY_MULTS, profile, "value", rarity.name));
    item.useMult = rarityMult(CONSUMABLE_RARITY_MULTS, profile, "use", rarity.name);
    item.use = consumableUse(item);
  }
  return item;
}

function itemValue(level, mult = 1) {
  return Math.ceil((10 + level * 7) * mult);
}

function randomizeWeaponBaseStats(item, rarityName) {
  randomizeItemBaseStats(item, rarityName, WEAPON_STAT_VARIANCE);
}

function randomizeArmorBaseStats(item, rarityName) {
  randomizeItemBaseStats(item, rarityName, ARMOR_STAT_VARIANCE);
}

function randomizeItemBaseStats(item, rarityName, varianceConfig) {
  const variance = varianceConfig[rarityName] || varianceConfig.common;
  item.roll = {};
  for (const [stat, value] of Object.entries(item.stats || {})) {
    const mult = rand(variance.min, variance.max);
    item.roll[stat] = Number(mult.toFixed(3));
    item.stats[stat] = stat === "crit"
      ? Number((value * mult).toFixed(3))
      : Math.max(1, Math.ceil(value * mult));
  }
}

function applyWeaponModifiers(item, base, rarityName, level) {
  const count = rollWeaponModifierCount(rarityName);
  if (count <= 0) return;
  const candidates = weaponModifierCandidates(item.mode);
  const picked = [];
  const used = new Set();
  while (picked.length < count && used.size < candidates.length) {
    const modifier = pickWeighted(candidates.filter((entry) => !used.has(entry.id)));
    if (!modifier) break;
    used.add(modifier.id);
    const rolled = applyItemModifier(item, modifier, rarityName, level);
    if (rolled) picked.push(rolled);
  }
  if (!picked.length) return;
  item.modifiers = picked;
  const config = WEAPON_MODIFIER_COUNTS[rarityName] || WEAPON_MODIFIER_COUNTS.common;
  item.value = Math.ceil(item.value * (config.valueMult + Math.max(0, picked.length - 1) * 0.04));
}

function rollWeaponModifierCount(rarityName) {
  const config = WEAPON_MODIFIER_COUNTS[rarityName] || WEAPON_MODIFIER_COUNTS.common;
  return Math.floor(rand(config.min, config.max + 1));
}

function weaponModifierCandidates(mode) {
  const offhandModes = ["guard", "tome", "quiver"];
  return [
    ...(offhandModes.includes(mode) ? [] : (WEAPON_MODIFIER_POOLS.any || [])),
    ...(WEAPON_MODIFIER_POOLS[mode] || [])
  ];
}

function applyArmorModifiers(item, base, rarityName, level) {
  const count = rollArmorModifierCount(rarityName);
  if (count <= 0) return;
  const candidates = armorModifierCandidates(base);
  const picked = [];
  const used = new Set();
  while (picked.length < count && used.size < candidates.length) {
    const modifier = pickWeighted(candidates.filter((entry) => !used.has(entry.id)));
    if (!modifier) break;
    used.add(modifier.id);
    const rolled = applyItemModifier(item, modifier, rarityName, level);
    if (rolled) picked.push(rolled);
  }
  if (!picked.length) return;
  item.modifiers = picked;
  const config = ARMOR_MODIFIER_COUNTS[rarityName] || ARMOR_MODIFIER_COUNTS.common;
  item.value = Math.ceil(item.value * (config.valueMult + Math.max(0, picked.length - 1) * 0.035));
}

function rollArmorModifierCount(rarityName) {
  const config = ARMOR_MODIFIER_COUNTS[rarityName] || ARMOR_MODIFIER_COUNTS.common;
  return Math.floor(rand(config.min, config.max + 1));
}

function armorModifierCandidates(base) {
  return [
    ...(ARMOR_MODIFIER_POOLS.any || []),
    ...(ARMOR_MODIFIER_POOLS[base.weight] || []),
    ...(ARMOR_MODIFIER_POOLS[base.slot] || [])
  ];
}

function applyItemModifier(item, modifier, rarityName, level) {
  const texts = [];
  for (const effect of modifier.effects || []) {
    const text = applyItemModifierEffect(item, effect, rarityName, level);
    if (text) texts.push(text);
  }
  if (!texts.length) return null;
  return { id: modifier.id, name: modifier.name, text: texts.join(", ") };
}

function applyItemModifierEffect(item, effect, rarityName, level) {
  if (effect.type === "stat") {
    const value = rollModifierValue(effect, rarityName, level);
    item.stats ||= {};
    item.stats[effect.stat] = effect.stat === "crit"
      ? Number(((item.stats[effect.stat] || 0) + value).toFixed(3))
      : Math.ceil((item.stats[effect.stat] || 0) + value);
    return `${effect.label || statLabel(effect.stat)} ${formatSigned(value, effect.stat)}`;
  }
  if (effect.type === "propertyAdd") {
    const value = rollModifierValue(effect, rarityName, level);
    item[effect.field] = Number(((item[effect.field] || 0) + value).toFixed(effect.precision ?? 0));
    return `${effect.label || title(effect.field)} ${formatSigned(value)}`;
  }
  if (effect.type === "propertyMult") {
    const value = rollModifierValue(effect, rarityName, level, { rarityScale: false });
    item[effect.field] = Number(((item[effect.field] || 0) * value).toFixed(3));
    const pct = effect.invertPercent ? Math.round((1 - value) * 100) : Math.round((value - 1) * 100);
    return `${effect.label || title(effect.field)} +${pct}%`;
  }
  if (effect.type === "projectileSpecial") {
    if (item.effect === "chain" || item.chain > 0) {
      item.chain = (item.chain || 0) + (effect.chain || 1);
      return `Chain +${effect.chain || 1}`;
    }
    item.pierce = (item.pierce || 0) + (effect.pierce || 1);
    return `Pierce +${effect.pierce || 1}`;
  }
  if (effect.type === "elementalBoost") {
    if (item.element === "fire") {
      item.splash = Number(((item.splash || 1.15) + effect.fireSplash).toFixed(2));
      return `Fire splash +${formatNumber(effect.fireSplash)}`;
    }
    if (item.element === "ice") {
      item.chill = Number(((item.chill || 1.5) + effect.iceChill).toFixed(2));
      return `Ice chill +${formatNumber(effect.iceChill)}s`;
    }
    if (item.element === "lightning") {
      item.chain = (item.chain || 0) + effect.lightningChain;
      return `Lightning chain +${effect.lightningChain}`;
    }
  }
  if (effect.type === "valueMult") {
    const value = rollModifierValue(effect, rarityName, level, { rarityScale: false });
    item.value = Math.ceil(item.value * value);
    return `${effect.label || "Value"} +${Math.round((value - 1) * 100)}%`;
  }
  return "";
}

function rollModifierValue(effect, rarityName, level, options = {}) {
  const rarityPower = options.rarityScale === false ? 1 : 1 + rarityRank(rarityName) * 0.14;
  const min = (effect.min || 0) + (effect.perLevel || 0) * level;
  const max = (effect.max ?? effect.min ?? 0) + (effect.perLevel || 0) * level;
  const value = rand(min, max) * rarityPower;
  if (effect.integer) return Math.max(1, Math.round(value));
  return Number(value.toFixed(effect.precision ?? (effect.format === "percent" ? 3 : 2)));
}

function itemBaseName(base) {
  return typeof base === "string" ? base : base.name;
}

function rarityMult(profiles, profile, stat, rarityName) {
  return profiles?.[profile]?.[stat]?.[rarityName]
    ?? profiles?.default?.[stat]?.[rarityName]
    ?? RARITIES.find((entry) => entry.name === rarityName)?.mult
    ?? 1;
}

function pickWeighted(entries, weightKey = "dropWeight") {
  const total = entries.reduce((sum, entry) => sum + (entry[weightKey] || 1), 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry[weightKey] || 1;
    if (roll <= 0) return entry;
  }
  return entries[0];
}

function rollRarity(boost = 0) {
  const roll = Math.random() + boost + statBlockSafeLoot();
  if (roll > 0.96) return RARITIES[3];
  if (roll > 0.78) return RARITIES[2];
  if (roll > 0.46) return RARITIES[1];
  return RARITIES[0];
}

function statBlockSafeLoot() {
  try {
    return (state?.tree?.skills?.luckyLeaves || 0) * 0.03;
  } catch {
    return 0;
  }
}

function addItem(item) {
  const stackable = ["material", "fertilizer", "consumable", "quest"].includes(item.kind);
  if (stackable) {
    const found = state.hero.inventory.find((current) => canStackItems(current, item));
    if (found) {
      found.qty += item.qty || 1;
      saveGame();
      return;
    }
  }
  state.hero.inventory.push(item);
  saveGame();
}

function canStackItems(a, b) {
  if (a.kind !== b.kind || a.name !== b.name) return false;
  if (a.kind === "quest") return true;
  return (a.rarity || "common") === (b.rarity || "common");
}

function removeItem(id, qty = 1) {
  const item = state.hero.inventory.find((entry) => entry.id === id);
  if (!item) return null;
  const taken = { ...item, qty };
  item.qty -= qty;
  if (item.qty <= 0) state.hero.inventory = state.hero.inventory.filter((entry) => entry.id !== id);
  return taken;
}

function removeNamed(name, qty) {
  let left = qty;
  for (const item of [...state.hero.inventory]) {
    if (item.name !== name || left <= 0) continue;
    const take = Math.min(item.qty || 1, left);
    removeItem(item.id, take);
    left -= take;
  }
  return left === 0;
}

function countItem(name) {
  return state.hero.inventory.filter((item) => item.name === name).reduce((sum, item) => sum + (item.qty || 1), 0);
}

function potionCount() {
  return countItem("Recovery Potion");
}

function countKind(kind) {
  return state.hero.inventory.filter((item) => item.kind === kind).reduce((sum, item) => sum + (item.qty || 1), 0);
}

function sortInventory() {
  const kindOrder = { weapon: 0, armor: 1, accessory: 2, consumable: 3, fertilizer: 4, material: 5, quest: 6 };
  state.hero.inventory.sort((a, b) =>
    (kindOrder[a.kind] ?? 99) - (kindOrder[b.kind] ?? 99) ||
    rarityRank(b.rarity) - rarityRank(a.rarity) ||
    (b.level || 0) - (a.level || 0) ||
    a.name.localeCompare(b.name)
  );
  saveGame();
  renderOverlay();
}

function toggleSellMode() {
  runtime.sellMode = !runtime.sellMode;
  hideItemTooltip();
  renderOverlay();
}

function equipItem(id) {
  if (runtime.sellMode) return sellItem(id);
  const item = state.hero.inventory.find((entry) => entry.id === id);
  if (!item?.slot) return;
  if (item.slot === "offhand" && !canUseOffhandWithWeapon(item, state.hero.equipment.weapon)) {
    toast(offhandRequirementText(item));
    return;
  }
  removeItem(id, 1);
  const displaced = [];
  if (item.slot === "weapon") {
    const offhand = state.hero.equipment.offhand;
    if (offhand && !canUseOffhandWithWeapon(offhand, item)) {
      state.hero.equipment.offhand = null;
      displaced.push(offhand);
    }
  }
  const old = state.hero.equipment[item.slot];
  if (old) displaced.push(old);
  item.qty = 1;
  state.hero.equipment[item.slot] = item;
  for (const displacedItem of displaced) addItem(displacedItem);
  state.hero.hp = Math.min(state.hero.hp, statBlock().maxHp);
  toast(`Equipped ${item.name}`);
  saveGame();
  renderOverlay();
}

function unequip(slot) {
  const item = state.hero.equipment[slot];
  if (!item) return;
  state.hero.equipment[slot] = null;
  addItem(item);
  state.hero.hp = Math.min(state.hero.hp, statBlock().maxHp);
  renderOverlay();
}

function useItem(id) {
  if (runtime.sellMode) return sellItem(id);
  const item = state.hero.inventory.find((entry) => entry.id === id);
  if (!item || item.kind !== "consumable") return;
  const use = consumableUse(item);
  if (use.heal) state.hero.hp = Math.min(statBlock().maxHp, state.hero.hp + use.heal);
  if (use.xp) gainXp(use.xp);
  if (use.treeXp) gainTreeXp(use.treeXp);
  if (use.stat) state.hero.base[pick(HERO_PROGRESSION.secretSeedStats)] += use.stat;
  removeItem(id, 1);
  toast(`Used ${item.name}`);
  saveGame();
  renderOverlay();
}

function usePotion() {
  const potion = state.hero.inventory.find((item) => item.kind === "consumable" && item.name === "Recovery Potion");
  if (potion) useItem(potion.id);
  else toast("No recovery potion.");
}

function sellItem(id) {
  const item = state.hero.inventory.find((entry) => entry.id === id);
  if (!item) return;
  const gold = sellValue(item);
  state.hero.gold += gold;
  removeItem(id, 1);
  toast(`Sold ${item.name} for ${gold}g`);
  saveGame();
  renderOverlay();
}

function sellValue(item) {
  return Math.max(1, Math.floor((item?.value || 1) * 0.55));
}

function buyItem(id) {
  const item = state.shop.find((entry) => entry.id === id);
  if (!item || state.hero.gold < item.value) return;
  state.hero.gold -= item.value;
  addItem({ ...item, id: uid(), qty: 1 });
  state.shop = state.shop.filter((entry) => entry.id !== id);
  toast(`Bought ${item.name}`);
  saveGame();
  renderOverlay();
}

function refreshShop() {
  const shopLevel = state.upgrades?.shop || 0;
  const slots = clamp(SHOP_SETTINGS.baseSlots + shopLevel * SHOP_SETTINGS.slotsPerUpgrade, 1, SHOP_SETTINGS.maxSlots);
  const rarityBoost = shopLevel * SHOP_SETTINGS.rarityBoostPerUpgrade;
  state.shop = Array.from({ length: slots }, (_, index) => {
    const stock = SHOP_STOCK[index % SHOP_STOCK.length];
    return makeItem(stock.kind, state.hero.level, (stock.boost || 0) + rarityBoost);
  });
}

function feedTree(id) {
  const item = state.hero.inventory.find((entry) => entry.id === id);
  if (!item || item.kind !== "fertilizer") return;
  gainTreeXp(item.treeXp || 24);
  removeItem(id, 1);
  state.message = "The tree drinks the fertilizer and spreads new roots.";
  toast(`Tree +${item.treeXp || 24} XP`);
  saveGame();
  renderOverlay();
}

function unlockSkill(id) {
  const skill = TREE_SKILLS.find((entry) => entry.id === id);
  const rank = state.tree.skills[id] || 0;
  if (!skill || rank >= skill.max || state.tree.points < skill.cost) return;
  state.tree.points -= skill.cost;
  state.tree.skills[id] = rank + 1;
  state.hero.hp = Math.min(statBlock().maxHp, state.hero.hp + 14);
  saveGame();
  renderOverlay();
}

function completeQuest(id) {
  const quest = QUESTS.find((entry) => entry.id === id);
  const progress = quest ? questProgress(quest.id) : null;
  if (!quest || !progress || progress.done) return;
  const have = quest.need.kind ? countKind(quest.need.kind) : countItem(quest.need.name);
  if (have < quest.need.qty) return;
  if (quest.need.kind) removeKind(quest.need.kind, quest.need.qty);
  else removeNamed(quest.need.name, quest.need.qty);
  progress.done = true;
  state.hero.gold += quest.reward.gold;
  gainXp(quest.reward.xp);
  gainTreeXp(quest.reward.treeXp);
  state.message = `Quest complete: ${quest.title}.`;
  saveGame();
  renderOverlay();
}

function removeKind(kind, qty) {
  let left = qty;
  for (const item of [...state.hero.inventory]) {
    if (item.kind !== kind || left <= 0) continue;
    const take = Math.min(item.qty || 1, left);
    removeItem(item.id, take);
    left -= take;
  }
}

function canCraft(recipe) {
  return Object.entries(recipe.need).every(([name, qty]) => countItem(name) >= qty);
}

function craft(id) {
  const recipe = RECIPES.find((entry) => entry.id === id);
  if (!recipe || !canCraft(recipe)) return;
  for (const [name, qty] of Object.entries(recipe.need)) removeNamed(name, qty);
  if (recipe.upgrade) {
    state.upgrades[recipe.upgrade] = (state.upgrades[recipe.upgrade] || 0) + 1;
    toast(`${recipe.name} complete`);
  } else {
    const item = makeCraftedItem(recipe);
    addItem(item);
    toast(`Crafted ${item.name}`);
  }
  saveGame();
  renderOverlay();
}

function makeCraftedItem(recipe) {
  const output = recipe.output || {};
  const level = output.level ?? state.hero.level + (output.levelOffset || 0);
  return makeItem(output.kind || recipe.id, level, output.boost || 0);
}

function allocateStat(stat) {
  if (state.hero.points <= 0) return;
  state.hero.base[stat] += 1;
  state.hero.points -= 1;
  if (stat === "vit") state.hero.hp += HERO_PROGRESSION.hpGainWhenAllocatingVit;
  state.hero.hp = Math.min(state.hero.hp, statBlock().maxHp);
  saveGame();
  renderOverlay();
}

function gainXp(amount) {
  state.hero.xp += Math.ceil(amount * (1 + statBlock().xp));
  while (state.hero.xp >= xpToLevel(state.hero.level)) {
    state.hero.xp -= xpToLevel(state.hero.level);
    state.hero.level += 1;
    state.hero.points += HERO_PROGRESSION.statPointsPerLevel;
    state.hero.hp = statBlock().maxHp;
    state.message = `${state.hero.name} reached level ${state.hero.level}.`;
    toast("Level up.");
  }
}

function gainTreeXp(amount) {
  state.tree.xp += Math.ceil(amount);
  while (state.tree.xp >= treeXpToLevel(state.tree.level)) {
    state.tree.xp -= treeXpToLevel(state.tree.level);
    state.tree.level += 1;
    state.tree.points += 1;
    state.message = `The tree grows to level ${state.tree.level}.`;
  }
}

function xpToLevel(level) {
  return heroXpRequirement(level);
}

function treeXpToLevel(level) {
  return treeXpRequirement(level);
}

function dropLoot(x, y, boost = 0) {
  const depth = Math.max(1, state.dungeon.depth);
  const table = ["material", "material", "fertilizer", "consumable", "weapon", "armor", "accessory"];
  const item = makeItem(pick(table), depth, boost);
  dropSpecific(item, x + rand(-0.35, 0.35), y + rand(-0.35, 0.35));
  if (Math.random() < 0.2 + boost) dropSpecific(makeItem("material", depth), x + rand(-0.4, 0.4), y + rand(-0.4, 0.4));
}

function dropSpecific(item, x, y, room = state.dungeon.room) {
  room.pickups.push({ id: uid(), item, x, y, t: rand(0, 1) });
}

function spawnParticle(x, y, color, speed = 1) {
  if (runtime.particles.length >= MAX_PARTICLES) return;
  let p = runtime.particlePool.pop();
  if (p) {
    p.x = x;
    p.y = y;
    p.vx = rand(-1.2, 1.2) * speed;
    p.vy = rand(-1.2, 1.2) * speed;
    p.life = rand(0.18, 0.42);
    p.max = 0.42;
    p.size = rand(4, 8);
    p.color = color;
  } else {
    p = { x, y, vx: rand(-1.2, 1.2) * speed, vy: rand(-1.2, 1.2) * speed, life: rand(0.18, 0.42), max: 0.42, size: rand(4, 8), color };
  }
  runtime.particles.push(p);
}

function spawnIndicator(indicator) {
  runtime.indicators.push(indicator);
}

function spawnFloater(text, x, y, color) {
  runtime.floaters.push({ text, x, y, color, life: 0.8 });
}

function toast(text) {
  if (!runtime.toast) return;
  runtime.toast.textContent = text;
  runtime.toast.hidden = false;
  clearTimeout(runtime.toastTimer);
  runtime.toastTimer = setTimeout(() => {
    if (runtime.toast) runtime.toast.hidden = true;
  }, 1500);
}

function maybeAutosave(dt) {
  runtime.autosave += dt * 1000;
  if (runtime.autosave < AUTOSAVE_MS) return;
  runtime.autosave = 0;
  if (!state.settings?.autosave) return;
  try {
    const raw = JSON.stringify(state);
    if (raw !== runtime.lastSavedJSON) saveGame();
  } catch {
    /* ignore stringify errors */
  }
}

function saveGame(slot = runtime.activeSaveSlot, force = false) {
  if (!Number.isInteger(slot)) slot = runtime.activeSaveSlot;
  runtime.activeSaveSlot = slot;
  return saveSystem.save(slot, { force });
}

function loadGame(slot = runtime.activeSaveSlot) {
  return saveSystem.load(slot);
}

function saveToSlot(slot) {
  const saved = saveGame(slot, true);
  toast(saved ? `Saved slot ${slot}` : "Save failed.");
  renderOverlay();
}

function exitToMenu() {
  runtime.bindingAction = null;
  runtime.keys.clear();
  runtime.mouse.down = false;
  state.overlay = null;
  saveGame(runtime.activeSaveSlot, true);
  state.mode = "menu";
  renderMenu();
}

function returnToGroveFromPause() {
  if (state.area !== "dungeon") {
    toggleOverlay(null);
    return;
  }
  state.dungeon.map = null;
  state.dungeon.currentNode = null;
  state.dungeon.runComplete = false;
  enterGrove("You retreat through the roots to the grove.");
  saveGame();
}

function loadFromSlot(slot) {
  const loaded = loadGame(slot);
  if (!loaded) {
    toast(`Slot ${slot} is empty.`);
    return;
  }
  runtime.activeSaveSlot = slot;
  state = loaded;
  exposeState();
  state.mode = "game";
  normalizeState();
  mountGame();
  toast(`Loaded slot ${slot}`);
}

function deleteSaveSlot(slot) {
  saveSystem.remove(slot);
  if (slot === runtime.activeSaveSlot) {
    runtime.activeSaveSlot = nextSaveSlotAfterDelete(slot);
    try {
      runtime.lastSavedJSON = JSON.stringify(state);
    } catch {
      runtime.lastSavedJSON = null;
    }
  }
  toast(`Deleted slot ${slot}`);
  renderOverlay();
}

function nextSaveSlotAfterDelete(deletedSlot) {
  const existing = saveSystem.listSlots(SAVE_SLOT_COUNT).find((entry) => entry.exists && entry.slot !== deletedSlot);
  if (existing) return existing.slot;
  return deletedSlot === 1 && SAVE_SLOT_COUNT > 1 ? 2 : 1;
}

function deleteSave() {
  saveSystem.remove(runtime.activeSaveSlot);
  state = makeFreshState();
  exposeState();
  renderMenu();
}

function drawDiamond(ctx, x, y, w, h, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x, y + h / 2);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function ellipse(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBar(ctx, x, y, w, h, pct, color) {
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(pct, 0, 1), h);
}

function title(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function rarityColor(item) {
  return RARITIES.find((rarity) => rarity.name === item.rarity)?.color || "#e8e3d3";
}

function itemNameColor(item) {
  if (item.kind === "quest") return "#7a2f90";
  if (item.kind === "consumable") return "#a7452f";
  if (item.kind === "weapon" && item.mode === "magic" && ELEMENTS[magicElement(item)]) return ELEMENTS[magicElement(item)].color;
  return "#24150c";
}

function tooltipTone(item) {
  if (item.kind === "quest") return "tooltip-quest";
  if (item.kind === "consumable") return "tooltip-consumable";
  return `tooltip-${item.rarity || "common"}`;
}

function rarityRank(name) {
  return Math.max(0, RARITIES.findIndex((rarity) => rarity.name === name));
}

Object.assign(window, {
  startNewHero,
  continueGame,
  showCreator,
  deleteSave,
  toggleOverlay,
  toggleGroveEditor,
  beginKeybindRebind,
  resetKeybinds,
  exitToMenu,
  returnToGroveFromPause,
  interact,
  playerAttack,
  usePotion,
  useItem,
  equipItem,
  unequip,
  sellItem,
  sortInventory,
  toggleSellMode,
  saveToSlot,
  loadFromSlot,
  deleteSaveSlot,
  buyItem,
  refreshShop,
  diveDeeperFromPortal,
  chooseMapNode,
  finishDungeonRun,
  feedTree,
  unlockSkill,
  completeQuest,
  craft,
  allocateStat,
  state,
  saveGame,
  renderOverlay
});

exposeState();
renderMenu();
