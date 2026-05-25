"use strict";

export const DUNGEON_NODE_PATTERN = ["monster", "cache", "monster", "elite", "monster", "cache", "elite"];

export const DUNGEON_ROUTE_ROW_SHAPES = [
  [0.28, 0.5, 0.72],
  [0.2, 0.42, 0.66, 0.84],
  [0.3, 0.56, 0.78],
  [0.18, 0.42, 0.64, 0.86],
  [0.34, 0.58, 0.78],
  [0.28, 0.5, 0.72],
  [0.5]
];

export const DUNGEON_LAYOUTS = [
  {
    id: "crossroads",
    name: "Root-Cross Hall",
    size: 23,
    start: { x: 11.5, y: 19.2 },
    portal: { x: 11.5, y: 3.5 },
    spawns: [{ x: 8.4, y: 7 }, { x: 11.5, y: 6.2 }, { x: 14.6, y: 7 }, { x: 7.4, y: 10.8 }, { x: 15.6, y: 10.8 }, { x: 11.5, y: 12.5 }],
    obstacles: [
      { asset: "obstacle.pillar", x: 7, y: 9, r: 0.62 },
      { asset: "obstacle.pillar", x: 16, y: 9, r: 0.62 },
      { asset: "obstacle.rubble", x: 9.5, y: 14.2, r: 0.68 },
      { asset: "obstacle.rubble", x: 13.5, y: 14.2, r: 0.68 }
    ]
  },
  {
    id: "root_maze",
    name: "Tangled Root Maze",
    size: 25,
    start: { x: 12.5, y: 21.5 },
    portal: { x: 12.5, y: 3.8 },
    spawns: [{ x: 6.5, y: 7.2 }, { x: 18.4, y: 7.2 }, { x: 9.5, y: 11.4 }, { x: 15.6, y: 11.2 }, { x: 7.2, y: 15.8 }, { x: 17.8, y: 15.8 }, { x: 12.5, y: 9.2 }],
    obstacles: [
      { asset: "obstacle.roots", x: 8, y: 9.4, r: 0.86 },
      { asset: "obstacle.roots", x: 16.6, y: 9.4, r: 0.86 },
      { asset: "obstacle.roots", x: 10.4, y: 14.2, r: 0.86 },
      { asset: "obstacle.roots", x: 14.7, y: 14.2, r: 0.86 },
      { asset: "obstacle.rubble", x: 12.5, y: 17.2, r: 0.72 }
    ]
  },
  {
    id: "broken_chambers",
    name: "Broken Chambers",
    size: 24,
    start: { x: 12, y: 20.5 },
    portal: { x: 12, y: 3.8 },
    spawns: [{ x: 6.8, y: 6.8 }, { x: 11.8, y: 6.4 }, { x: 17, y: 6.8 }, { x: 8.6, y: 12.6 }, { x: 15.4, y: 12.6 }, { x: 12, y: 15.8 }],
    obstacles: [
      { asset: "obstacle.rubble", x: 6, y: 10, r: 0.86 },
      { asset: "obstacle.rubble", x: 18, y: 10, r: 0.86 },
      { asset: "obstacle.pillar", x: 10.2, y: 12.2, r: 0.62 },
      { asset: "obstacle.pillar", x: 13.8, y: 12.2, r: 0.62 },
      { asset: "obstacle.roots", x: 12, y: 8.8, r: 0.82 }
    ]
  },
  {
    id: "wide_hollow",
    name: "Wide Hollow",
    size: 26,
    start: { x: 13, y: 22.2 },
    portal: { x: 13, y: 4 },
    spawns: [{ x: 7.2, y: 7.5 }, { x: 13, y: 6.4 }, { x: 18.8, y: 7.5 }, { x: 6.8, y: 13 }, { x: 19.2, y: 13 }, { x: 10.6, y: 16.2 }, { x: 15.4, y: 16.2 }],
    obstacles: [
      { asset: "obstacle.pillar", x: 8.2, y: 11, r: 0.62 },
      { asset: "obstacle.pillar", x: 17.8, y: 11, r: 0.62 },
      { asset: "obstacle.roots", x: 13, y: 10, r: 0.9 },
      { asset: "obstacle.rubble", x: 8.4, y: 17.2, r: 0.74 },
      { asset: "obstacle.rubble", x: 17.6, y: 17.2, r: 0.74 }
    ]
  }
];
