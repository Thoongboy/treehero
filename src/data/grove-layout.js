"use strict";

export const groveStations = [
  {
    id: "campfire",
    type: "rest",
    label: "Rest at Campfire",
    draw: "campfire",
    x: 4.1,
    y: 8.6,
    radius: 1.15,
    sceneLayer: 20,
    depthBias: 0.12
  },
  {
    id: "craft",
    type: "craft",
    label: "Use Crafting Table",
    draw: "craft",
    x: 3.5,
    y: 6.4,
    radius: 1.2,
    sceneLayer: 22,
    depthBias: 0.22
  },
  {
    id: "shop",
    type: "shop",
    label: "Trade with Grove Keeper",
    draw: "shop",
    x: 8.6,
    y: 4.5,
    radius: 1.25,
    sceneLayer: 24,
    depthBias: 0.36
  },
  {
    id: "dungeon",
    type: "dungeon",
    label: "Enter Dungeon",
    draw: "portal",
    x: 8.8,
    y: 7.2,
    radius: 1.35,
    sceneLayer: 28,
    depthBias: 0.52
  },
  {
    id: "tree",
    type: "tree",
    label: "Open the Tree",
    draw: "tree",
    x: 6.1,
    y: 4.3,
    radius: 1.75,
    sceneLayer: 32,
    depthBias: 0.72
  }
];

export function getGroveStation(id) {
  return groveStations.find((station) => station.id === id);
}

export function getGroveInteractions() {
  return groveStations.map((station) => ({
    type: station.type,
    label: station.label,
    x: station.x,
    y: station.y,
    r: station.radius
  }));
}

export function serializeGroveLayout() {
  const body = groveStations
    .map((station) => {
      const fields = [
        `id: ${JSON.stringify(station.id)}`,
        `type: ${JSON.stringify(station.type)}`,
        `label: ${JSON.stringify(station.label)}`,
        `draw: ${JSON.stringify(station.draw)}`,
        `x: ${round(station.x)}`,
        `y: ${round(station.y)}`,
        `radius: ${round(station.radius)}`,
        `sceneLayer: ${station.sceneLayer}`,
        `depthBias: ${round(station.depthBias)}`
      ];
      return `  { ${fields.join(", ")} }`;
    })
    .join(",\n");
  return `export const groveStations = [\n${body}\n];`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
