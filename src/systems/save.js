"use strict";

export function createSaveSystem({ key, getState, shouldSkipSave = () => false, onSaved = null }) {
  function save() {
    if (shouldSkipSave()) return false;
    try {
      const raw = JSON.stringify(getState());
      localStorage.setItem(key, raw);
      onSaved?.(raw);
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function remove() {
    localStorage.removeItem(key);
  }

  function hasSave() {
    return Boolean(localStorage.getItem(key));
  }

  return { save, load, remove, hasSave };
}
