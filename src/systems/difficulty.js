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
  const rowCount = DUNGEON_ROUTE_ROW_SHAPES.length;
  const rows = Array.from({ length: rowCount }, (_, row) => {
    const last = row === rowCount - 1;
    const count = last ? 1 : row === 0 ? randomInt(2, 4) : randomInt(3, 5);
    return randomRouteXs(count).map((x, col) => ({
      id: `r${row}c${col}`,
      row,
      col,
      x,
      y: clamp(0.88 - row * 0.125 + rand(-0.018, 0.018), 0.08, 0.9),
      kind: last ? "boss" : randomNodeKind(row),
      next: [],
      done: false
    }));
  });
  for (let row = 0; row < rows.length - 1; row++) {
    const incoming = new Map(rows[row + 1].map((node) => [node.id, 0]));
    for (const node of rows[row]) {
      const next = rows[row + 1]
        .map((entry) => ({ entry, score: Math.abs(entry.x - node.x) + rand(0, 0.08) }))
        .sort((a, b) => a.score - b.score)
        .map(({ entry }) => entry);
      const maxLinks = Math.min(3, next.length);
      const linkCount = row === rows.length - 2 ? 1 : randomInt(1, maxLinks);
      node.next = next.slice(0, linkCount).map((entry) => entry.id);
      for (const id of node.next) incoming.set(id, (incoming.get(id) || 0) + 1);
    }
    for (const nextNode of rows[row + 1]) {
      if (incoming.get(nextNode.id)) continue;
      const parent = [...rows[row]].sort((a, b) => Math.abs(a.x - nextNode.x) - Math.abs(b.x - nextNode.x))[0];
      if (parent && !parent.next.includes(nextNode.id)) parent.next.push(nextNode.id);
    }
  }
  return { rows, route: [] };
}

function randomRouteXs(count) {
  if (count === 1) return [0.5 + rand(-0.04, 0.04)];
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    return clamp(0.16 + t * 0.68 + rand(-0.045, 0.045), 0.12, 0.88);
  }).sort((a, b) => a - b);
}

function randomNodeKind(row) {
  if (row === 0) return Math.random() < 0.18 ? "cache" : "monster";
  const roll = Math.random();
  if (roll < 0.18) return "elite";
  if (roll < 0.42) return "cache";
  return "monster";
}

function randomInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
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
