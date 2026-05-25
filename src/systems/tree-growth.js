"use strict";

import { clamp } from "../core/math.js";
import { TREE_GROWTH } from "../data/tree.js";

export function getTreeStage(level, growth = TREE_GROWTH) {
  return clamp(Math.floor(((level || 1) - 1) / growth.levelsPerStage), 0, growth.maxStage);
}

export function getTreeGrowthProfile(tree = {}, growth = TREE_GROWTH) {
  const stage = getTreeStage(tree.level, growth);
  const skills = tree.skills || {};
  const bend = Object.entries(growth.skillBend).reduce((sum, [id, amount]) => sum + (skills[id] || 0) * amount, 0);
  return {
    stage,
    bend: clamp(bend, -18, 24),
    scale: growth.scaleBase + stage * growth.scalePerStage,
    trunkH: growth.trunkHeightBase + stage * growth.trunkHeightPerStage,
    crownW: growth.crownWidthBase + stage * growth.crownWidthPerStage,
    crownH: growth.crownHeightBase + stage * growth.crownHeightPerStage,
    leafAlpha: stage <= 1 ? 0.82 : 1
  };
}
