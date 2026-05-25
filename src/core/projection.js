"use strict";

export function createIsoProjection({ tileW, tileH, getCamera }) {
  function rawProject(x, y) {
    return { x: (x - y) * (tileW / 2), y: (x + y) * (tileH / 2) };
  }

  function project(x, y) {
    const camera = getCamera?.() || { x: 0, y: 0 };
    const p = rawProject(x, y);
    return { x: p.x + camera.x, y: p.y + camera.y };
  }

  function screenToWorld(screenX, screenY) {
    const camera = getCamera?.() || { x: 0, y: 0 };
    const x = screenX - camera.x;
    const y = screenY - camera.y;
    return {
      x: x / tileW + y / tileH,
      y: y / tileH - x / tileW
    };
  }

  function screenUnitFromWorldAngle(angle) {
    const wx = Math.cos(angle);
    const wy = Math.sin(angle);
    const sx = (wx - wy) * (tileW / 2);
    const sy = (wx + wy) * (tileH / 2);
    const length = Math.hypot(sx, sy) || 1;
    return { x: sx / length, y: sy / length };
  }

  return { project, rawProject, screenToWorld, screenUnitFromWorldAngle };
}
