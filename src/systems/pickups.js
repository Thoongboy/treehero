"use strict";

import { distance } from "../core/math.js";

export function createPickupSystem({
  getRoom,
  getPlayer,
  addItem,
  toast,
  magnetRange = 1.8,
  collectRange = 0.58
}) {
  function update(dt) {
    const room = getRoom();
    const player = getPlayer();
    if (!room || !player) return;

    for (const pickup of room.pickups || []) {
      pickup.t = (pickup.t || 0) + dt;
      const d = distance(pickup, player);
      const forced = pickup.flyToPlayer || pickup.forcePull;
      if ((forced || d < magnetRange) && d > 0.001) {
        const pull = forced ? Math.min(18, Math.max(8, d * 8.5)) : d < 0.95 ? 6.8 : 3.1;
        const angle = Math.atan2(player.y - pickup.y, player.x - pickup.x);
        pickup.x += Math.cos(angle) * pull * dt;
        pickup.y += Math.sin(angle) * pull * dt;
      }
      if (d < collectRange) {
        addItem(pickup.item);
        toast(`Picked up ${pickup.item.name}`);
        pickup.dead = true;
      }
    }
    room.pickups = (room.pickups || []).filter((pickup) => !pickup.dead);
  }

  function collect(room) {
    if (!room?.pickups?.length) return 0;
    const count = room.pickups.reduce((sum, pickup) => sum + (pickup.item.qty || 1), 0);
    for (const pickup of room.pickups) addItem(pickup.item);
    room.pickups = [];
    toast(count === 1 ? "Loot gathered." : `${count} loot items gathered.`);
    return count;
  }

  function pullAll(room) {
    if (!room?.pickups?.length) return 0;
    for (const pickup of room.pickups) pickup.flyToPlayer = true;
    return room.pickups.reduce((sum, pickup) => sum + (pickup.item.qty || 1), 0);
  }

  return { update, collect, pullAll };
}
