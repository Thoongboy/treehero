"use strict";

import { clamp } from "../core/math.js";
import { DUNGEON_NODE_PATTERN, DUNGEON_ROUTE_ROW_SHAPES } from "../data/maps.js";

export function calculateDungeonThreat(depth, heroLevel, bestDepth = 0) {
  return Math.max(1, depth + (heroLevel - 1) * 0.72 + Math.max(0, bestDepth) * 0.12);
}

export function chooseDungeonRoomLayout({ type, depth, node, heroLevel, layouts }) {
  const candidates = type === "boss" ? layouts.filter((layout) => layout.id !== "root_maze") : layouts;
  const seed = (node?.row || 0) * 7 + (node?.col || 0) * 3 + depth + heroLevel;
  const base = candidates[seed % candidates.length];
  const drift = ((depth + heroLevel) % 3 - 1) * 0.25;

  return {
    ...base,
    start: { ...base.start },
    portal: { ...base.portal },
    spawns: base.spawns.map((point, index) => ({
      x: clamp(point.x + (index % 2 ? drift : -drift), 2.2, base.size - 2.2),
      y: clamp(point.y + (index % 3 ? -drift : drift), 2.2, base.size - 2.2)
    })),
    obstacles: base.obstacles.map((obstacle, index) => ({
      ...obstacle,
      x: clamp(obstacle.x + (index % 2 ? drift : -drift) * 0.7, 2.2, base.size - 2.2),
      y: clamp(obstacle.y + (index % 3 ? -drift : drift) * 0.7, 2.2, base.size - 2.2)
    }))
  };
}

export function getEnemyCountForRoom(type, threat) {
  if (type === "boss") return 1;
  if (type === "elite") return Math.min(5, 2 + Math.floor(threat / 4));
  return Math.min(12, 4 + Math.floor(threat / 2.2));
}

export function getDungeonNodeKind(row, col) {
  if (row === 0) return "monster";
  return DUNGEON_NODE_PATTERN[(row * 2 + col) % DUNGEON_NODE_PATTERN.length];
}

export function createDungeonMap() {
  const rows = DUNGEON_ROUTE_ROW_SHAPES.map((shape, row) =>
    shape.map((x, col) => ({
      id: `r${row}c${col}`,
      row,
      col,
      x,
      y: 0.88 - row * 0.125,
      kind: row === DUNGEON_ROUTE_ROW_SHAPES.length - 1 ? "boss" : getDungeonNodeKind(row, col),
      next: [],
      done: false
    }))
  );
  for (let row = 0; row < rows.length - 1; row++) {
    for (const node of rows[row]) {
      const next = [...rows[row + 1]].sort((a, b) => Math.abs(a.x - node.x) - Math.abs(b.x - node.x));
      node.next = next.slice(0, row % 2 === 0 ? 2 : 1).map((entry) => entry.id);
    }
  }
  return { rows, route: [] };
}

export function chooseMonsterArchetype({ archetypes, type, threat, index }) {
  const unlocked = archetypes.filter((entry) => {
    if (entry.id === "spitter") return threat >= 2.5 || type === "elite";
    if (entry.id === "thornback") return threat >= 4 || type === "elite";
    if (entry.id === "shade") return threat >= 3;
    return true;
  });
  const weighted = unlocked.flatMap((entry) =>
    Array.from({ length: entry.weight + (type === "elite" && entry.id === "thornback" ? 2 : 0) }, () => entry)
  );
  return weighted[(index + Math.floor(threat)) % weighted.length] || archetypes[0];
}
