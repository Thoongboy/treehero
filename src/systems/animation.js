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
      facing: 1
    };
  }
  return entity.animation;
}

export function actorAnimationKey(entity, type) {
  const animation = ensureAnimation(entity);
  if (type === "hero") return animation?.state === "attack" ? "character.hero.attack" : "character.hero.idle";
  if (type === "enemy") return "monster.walk";
  return "character.hero.idle";
}

function updateActor(entity, dt) {
  const animation = ensureAnimation(entity);
  if (!animation) return;
  animation.age += dt;
  const dx = entity.x - animation.lastX;
  const dy = entity.y - animation.lastY;
  const speed = Math.hypot(dx, dy) / Math.max(dt, 0.001);
  animation.state = entity.attackT > 0 ? "attack" : speed > 0.01 ? "walk" : "idle";
  if (Math.abs(dx) > 0.001) animation.facing = dx >= 0 ? 1 : -1;
  animation.lastX = entity.x;
  animation.lastY = entity.y;
}

function updateObject(entity, dt) {
  const animation = ensureAnimation(entity);
  if (!animation) return;
  animation.age += dt;
}
