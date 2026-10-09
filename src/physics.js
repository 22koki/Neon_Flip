/**
 * Fixed-timestep platforming rules. Browser-independent so Node can test them.
 * A positive gravity means the runner is pulled toward the floor.
 */
import { CEILING, FLOOR, END_X, FLOOR_GAPS, CEILING_GAPS, PLAYER_RADIUS, isGapAt } from './levels.js';

export const DASH_DURATION = 0.28; // seconds
export const DASH_COOLDOWN = 1.45;
export const FLIP_COOLDOWN = 0.19;
export const MAX_HEALTH = 4;

export function createPlayer(x = 190, gravity = 1) {
  return {
    x,
    y: gravity === 1 ? FLOOR - PLAYER_RADIUS : CEILING + PLAYER_RADIUS,
    vy: 0,
    gravity,
    radius: PLAYER_RADIUS,
    grounded: true,
    flipCooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    invincible: 0
  };
}

export function flipGravity(player) {
  if (player.flipCooldown > 0) return false;
  player.gravity *= -1;
  player.vy = player.gravity * 7.2;
  player.grounded = false;
  player.flipCooldown = FLIP_COOLDOWN;
  return true;
}

export function jump(player) {
  if (!player.grounded) return false;
  player.vy = -player.gravity * 12.2;
  player.grounded = false;
  return true;
}

export function dash(player) {
  if (player.dashCooldown > 0) return false;
  player.dashTime = DASH_DURATION;
  player.dashCooldown = DASH_COOLDOWN;
  return true;
}

export function isGateActive(gate, elapsed) {
  // 2.9s cycle. A short quiet phase gives non-dashing players a chance.
  return Math.sin(elapsed * 2.15 + gate.phase) > -0.46;
}

export function droneY(drone, elapsed) {
  return drone.y + Math.sin(elapsed * drone.speed + drone.phase) * drone.amplitude;
}

export function stepPlayer(player, dt, sectorIndex = 0) {
  // dt is a multiplier relative to 1/60 second; all movement is frame-rate independent.
  const seconds = dt / 60;
  player.flipCooldown = Math.max(0, player.flipCooldown - seconds);
  player.dashCooldown = Math.max(0, player.dashCooldown - seconds);
  player.dashTime = Math.max(0, player.dashTime - seconds);
  player.invincible = Math.max(0, player.invincible - seconds);

  const runSpeed = 5.15 + sectorIndex * 0.55;
  player.x += (runSpeed + (player.dashTime > 0 ? 8.7 : 0)) * dt;
  player.vy = Math.min(15.5, Math.max(-15.5, player.vy + 0.67 * player.gravity * dt));
  player.y += player.vy * dt;
  player.grounded = false;

  if (player.gravity === 1 && player.y + player.radius >= FLOOR && !isGapAt(player.x, FLOOR_GAPS, player.radius)) {
    player.y = FLOOR - player.radius;
    player.vy = 0;
    player.grounded = true;
  } else if (player.gravity === -1 && player.y - player.radius <= CEILING && !isGapAt(player.x, CEILING_GAPS, player.radius)) {
    player.y = CEILING + player.radius;
    player.vy = 0;
    player.grounded = true;
  }

  return player.x >= END_X;
}

export function detectCollision(player, world, elapsed) {
  if (player.dashTime > 0 || player.invincible > 0) return null;
  if (player.y > 750 || player.y < -30) return 'void';

  for (const spike of world.spikes) {
    if (Math.abs(player.x - (spike.x + spike.width / 2)) >= spike.width / 2 + player.radius - 4) continue;
    const touching = spike.side === 'floor'
      ? player.y + player.radius >= FLOOR - 33
      : player.y - player.radius <= CEILING + 33;
    if (touching) return 'spikes';
  }

  for (const gate of world.gates) {
    if (Math.abs(player.x - gate.x) < player.radius + 10 && isGateActive(gate, elapsed) &&
        player.y + player.radius > CEILING && player.y - player.radius < FLOOR) return 'laser';
  }

  for (const drone of world.drones) {
    const dx = player.x - drone.x;
    const dy = player.y - droneY(drone, elapsed);
    if (dx * dx + dy * dy < (player.radius + 22) ** 2) return 'drone';
  }
  return null;
}

export function collectShards(player, world) {
  let count = 0;
  for (const shard of world.shards) {
    if (shard.collected) continue;
    const dx = player.x - shard.x;
    const dy = player.y - shard.y;
    if (dx * dx + dy * dy < (player.radius + shard.radius + 7) ** 2) {
      shard.collected = true;
      count++;
    }
  }
  return count;
}
