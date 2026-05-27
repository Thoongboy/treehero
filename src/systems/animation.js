"use strict";

export function createTreeAnimationSystem({ getPlayer, getRoom, getProjectiles, getParticles }) {
  let time = 0;

  function update(dt) {
    time += dt;
    updateActor(getPlayer(), dt);
    const room = getRoom();
    for (const enemy of room?.enemies || []) updateActor(enemy, dt);
    for (const pickup of room?.pickups || []) updateObject(pickup, dt);
    for (const projectile of getProjectiles()) updateObject(projectile, dt);
    for (const particle of getParticles()) updateObject(particle, dt);
  }

  function getTime() {
    return time;
  }

  return { update, getTime };
}

export function ensureAnimation(entity) {
  if (!entity) return null;
  if (!entity.animation) {
    entity.animation = {
      age: 0,
      lastX: entity.x,
      lastY: entity.y,
      state: "idle",
      direction: "down",
      facing: 1
    };
  }
  return entity.animation;
}

export function actorAnimationKey(entity, type) {
  const animation = ensureAnimation(entity);
  const direction = animation?.direction || "down";
  const state = animation?.state || "idle";
  if (type === "hero") return `character.hero.${state}.${direction}`;
  if (type === "enemy") return `monster.${state}.${direction}`;
  return "character.hero.idle";
}

export function actorAnimationDirection(entity) {
  return ensureAnimation(entity)?.direction || "down";
}

function updateActor(entity, dt) {
  const animation = ensureAnimation(entity);
  if (!animation) return;
  animation.age += dt;
  const dx = entity.x - animation.lastX;
  const dy = entity.y - animation.lastY;
  const speed = Math.hypot(dx, dy) / Math.max(dt, 0.001);
  animation.state = entity.rollT > 0 ? "roll" : entity.dash ? "dash" : entity.attackT > 0 ? "attack" : speed > 0.01 ? "walk" : "idle";
  const angle = facingAngle(entity, dx, dy, speed);
  animation.direction = directionFromAngle(angle);
  animation.facing = animation.direction === "left" ? -1 : 1;
  animation.lastX = entity.x;
  animation.lastY = entity.y;
}

function facingAngle(entity, dx, dy, speed) {
  if (entity.rollT > 0 && Number.isFinite(entity.rollDir)) return entity.rollDir;
  if (entity.dash && Number.isFinite(entity.dash.dir)) return entity.dash.dir;
  if (Number.isFinite(entity.dir)) return entity.dir;
  if (speed > 0.01) return Math.atan2(dy, dx);
  return 0;
}

function directionFromAngle(angle) {
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  if (Math.abs(x) > Math.abs(y)) return x >= 0 ? "right" : "left";
  return y >= 0 ? "down" : "up";
}

function updateObject(entity, dt) {
  const animation = ensureAnimation(entity);
  if (!animation) return;
  animation.age += dt;
}
