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
      if (d < magnetRange && d > 0.001) {
        const pull = d < 0.95 ? 6.8 : 3.1;
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

  return { update, collect };
}
