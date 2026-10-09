import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR, CEILING, END_X, PLAYER_RADIUS, FLOOR_GAPS,
  createWorld, sectorAt, isGapAt
} from '../src/levels.js';
import {
  createPlayer, flipGravity, jump, dash, stepPlayer,
  collectShards, detectCollision, isGateActive, droneY,
  MAX_HEALTH
} from '../src/physics.js';

test('player spawns safely on the floor', () => {
  const p = createPlayer();
  assert.equal(p.gravity, 1);
  assert.equal(p.y, FLOOR - PLAYER_RADIUS);
  assert.equal(p.grounded, true);
  assert.equal(detectCollision(p, createWorld(), 0), null);
});

test('gravity flip switches direction and has a cooldown', () => {
  const p = createPlayer();
  assert.equal(flipGravity(p), true);
  assert.equal(p.gravity, -1);
  assert.equal(flipGravity(p), false);
  stepPlayer(p, 13);
  assert.equal(flipGravity(p), true);
  assert.equal(p.gravity, 1);
});

test('jump works only from a surface and propels away from it', () => {
  const p = createPlayer();
  assert.equal(jump(p), true);
  assert.ok(p.vy < 0);
  assert.equal(jump(p), false);
  const ceilingRunner = createPlayer(100, -1);
  assert.equal(ceilingRunner.y, CEILING + PLAYER_RADIUS);
  assert.equal(jump(ceilingRunner), true);
  assert.ok(ceilingRunner.vy > 0);
});

test('dash starts invulnerability and cannot be spammed', () => {
  const p = createPlayer();
  assert.equal(dash(p), true);
  assert.ok(p.dashTime > 0);
  assert.equal(dash(p), false);
  stepPlayer(p, 90);
  assert.equal(dash(p), true);
});

test('running advances the player and re-lands on intact floors', () => {
  const p = createPlayer();
  stepPlayer(p, 1);
  assert.ok(p.x > 190);
  assert.equal(p.y, FLOOR - PLAYER_RADIUS);
  assert.equal(p.grounded, true);
});

test('floor gaps are real and do not provide a landing surface', () => {
  const gap = FLOOR_GAPS[0];
  assert.equal(isGapAt(gap.x + 30, FLOOR_GAPS), true);
  assert.equal(isGapAt(gap.x - 60, FLOOR_GAPS), false);
  const p = createPlayer(gap.x + 40);
  stepPlayer(p, 3);
  assert.equal(p.grounded, false);
  assert.ok(p.y > FLOOR - PLAYER_RADIUS);
});

test('sector boundaries select the right theme', () => {
  assert.equal(sectorAt(0).code, '01');
  assert.equal(sectorAt(3100).code, '02');
  assert.equal(sectorAt(6200).code, '03');
  assert.equal(sectorAt(END_X).code, '03');
});

test('shards collect once and award exactly one pickup', () => {
  const world = createWorld();
  const shard = world.shards[0];
  const p = createPlayer(shard.x);
  p.y = shard.y;
  assert.equal(collectShards(p, world), 1);
  assert.equal(collectShards(p, world), 0);
  assert.equal(world.shards[0].collected, true);
});

test('spikes kill on their own side, and ceiling is safe from floor spikes', () => {
  const world = createWorld();
  const spike = world.spikes.find((s) => s.side === 'floor');
  const p = createPlayer(spike.x + 30);
  assert.equal(detectCollision(p, world, 0), 'spikes');
  p.y = CEILING + PLAYER_RADIUS;
  assert.equal(detectCollision(p, world, 0), null);
});

test('laser gate pulses between dangerous and safe', () => {
  const gate = createWorld().gates[0];
  const states = Array.from({ length: 80 }, (_, i) => isGateActive(gate, i * .1));
  assert.ok(states.includes(true));
  assert.ok(states.includes(false));
});

test('dash lets the runner pass an active laser gate', () => {
  const world = createWorld();
  const gate = world.gates[0];
  const p = createPlayer(gate.x);
  p.y = (FLOOR + CEILING) / 2;
  assert.equal(isGateActive(gate, 0), true);
  assert.equal(detectCollision(p, world, 0), 'laser');
  dash(p);
  assert.equal(detectCollision(p, world, 0), null);
});

test('drones have deterministic positions and physical hit areas', () => {
  const world = createWorld();
  const drone = world.drones[0];
  const p = createPlayer(drone.x);
  p.y = droneY(drone, 1);
  assert.equal(detectCollision(p, world, 1), 'drone');
});

test('health budget and finish line have expected values', () => {
  assert.equal(MAX_HEALTH, 4);
  const p = createPlayer(END_X - 1);
  assert.equal(stepPlayer(p, 1, 2), true);
});

test('world creates a new mutable collectible set for each run', () => {
  const a = createWorld();
  const b = createWorld();
  a.shards[0].collected = true;
  assert.equal(b.shards[0].collected, false);
});
