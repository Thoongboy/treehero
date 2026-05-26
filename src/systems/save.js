"use strict";

export function createSaveSystem({ key, getState, shouldSkipSave = () => false, onSaved = null, getSlot = () => 1 }) {
  function keyFor(slot = getSlot()) {
    return `${key}-slot-${slot}`;
  }

  function save(slot = getSlot(), options = {}) {
    if (!options.force && shouldSkipSave()) return false;
    try {
      const raw = JSON.stringify(getState());
      localStorage.setItem(keyFor(slot), raw);
      onSaved?.(raw);
      return true;
    } catch {
      return false;
    }
  }

  function load(slot = getSlot()) {
    try {
      const raw = localStorage.getItem(keyFor(slot)) || (slot === 1 ? localStorage.getItem(key) : null);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function remove(slot = getSlot()) {
    localStorage.removeItem(keyFor(slot));
    if (slot === 1) localStorage.removeItem(key);
  }

  function hasSave(slot = getSlot()) {
    return Boolean(localStorage.getItem(keyFor(slot)) || (slot === 1 && localStorage.getItem(key)));
  }

  function listSlots(count = 3) {
    return Array.from({ length: count }, (_, index) => {
      const slot = index + 1;
      const raw = localStorage.getItem(keyFor(slot)) || (slot === 1 ? localStorage.getItem(key) : null);
      let summary = null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          summary = {
            hero: parsed.hero?.name || "Hero",
            level: parsed.hero?.level || 1,
            area: parsed.area || "grove",
            depth: parsed.dungeon?.bestDepth || parsed.dungeon?.depth || 0,
            treeLevel: parsed.tree?.level || 1
          };
        } catch {
          summary = { hero: "Unreadable save", level: 0, area: "unknown", depth: 0, treeLevel: 0 };
        }
      }
      return { slot, exists: Boolean(raw), summary };
    });
  }

  return { save, load, remove, hasSave, listSlots };
}
