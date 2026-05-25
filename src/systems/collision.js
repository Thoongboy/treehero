"use strict";

import { distance } from "../core/math.js";

export function canStandInObstacles(x, y, radius, obstacles = []) {
  return !obstacles.some((obstacle) => {
    if (obstacle.hidden) return false;
    const obstacleRadius = obstacle.r ?? obstacle.radius ?? 0.65;
    return distance({ x, y }, obstacle) < obstacleRadius + radius;
  });
}

export function moveWithCollision(entity, nextX, nextY, radius, canStandAt) {
  if (canStandAt(nextX, nextY, radius)) {
    entity.x = nextX;
    entity.y = nextY;
    return true;
  }
  let moved = false;
  if (canStandAt(nextX, entity.y, radius)) {
    entity.x = nextX;
    moved = true;
  }
  if (canStandAt(entity.x, nextY, radius)) {
    entity.y = nextY;
    moved = true;
  }
  return moved;
}

export function moveTowardWithCollision(entity, targetX, targetY, speed, dt, radius, canStandAt) {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return false;

  const step = speed * dt;
  const dirX = dx / dist;
  const dirY = dy / dist;
  const nextX = entity.x + dirX * step;
  const nextY = entity.y + dirY * step;
  if (moveWithCollision(entity, nextX, nextY, radius, canStandAt)) return true;

  const baseAngle = Math.atan2(dy, dx);
  const offsets = [0, 0.22, -0.22, 0.45, -0.45, 0.75, -0.75, 1.1, -1.1, 1.6, -1.6];
  for (const offset of offsets) {
    const angle = baseAngle + offset;
    const altX = entity.x + Math.cos(angle) * step;
    const altY = entity.y + Math.sin(angle) * step;
    if (canStandAt(altX, altY, radius)) {
      entity.x = altX;
      entity.y = altY;
      return true;
    }
  }

  for (const multiplier of [1.25, 1.6]) {
    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const altX = entity.x + Math.cos(angle) * step * multiplier;
      const altY = entity.y + Math.sin(angle) * step * multiplier;
      if (canStandAt(altX, altY, radius)) {
        entity.x = altX;
        entity.y = altY;
        return true;
      }
    }
  }

  const perpX = -dirY;
  const perpY = dirX;
  for (const nudge of [0.32, -0.32, 0.6, -0.6]) {
    const altX = entity.x + perpX * step * nudge;
    const altY = entity.y + perpY * step * nudge;
    if (canStandAt(altX, altY, radius)) {
      entity.x = altX;
      entity.y = altY;
      return true;
    }
  }
  return false;
}
