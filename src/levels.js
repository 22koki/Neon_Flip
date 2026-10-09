/**
 * Neon Flip — deterministic rooftop level data.
 * World coordinates are measured at a fixed 1280 × 720 logical resolution.
 * Every level feature is drawn procedurally; there are no external image assets.
 */
export const WIDTH = 1280;
export const HEIGHT = 720;
export const CEILING = 132;
export const FLOOR = 592;
export const END_X = 9350;
export const PLAYER_RADIUS = 18;

export const SECTORS = Object.freeze([
  { name: 'MIDNIGHT RUN', code: '01', start: 0, end: 3100, hue: '#55f7f0', subtitle: 'Learn to defy gravity' },
  { name: 'THE HIGHLINE', code: '02', start: 3100, end: 6200, hue: '#ff59bb', subtitle: 'Keep moving. Keep breathing.' },
  { name: 'ZERO HOUR', code: '03', start: 6200, end: END_X, hue: '#f8c66e', subtitle: 'The city is almost yours' }
]);

export const FLOOR_GAPS = Object.freeze([
  { x: 2440, width: 265 },
  { x: 4680, width: 260 },
  { x: 6730, width: 300 },
  { x: 8360, width: 245 }
]);

export const CEILING_GAPS = Object.freeze([
  { x: 3850, width: 280 },
  { x: 5680, width: 255 },
  { x: 7840, width: 280 }
]);

export const SPIKES = Object.freeze([
  { x: 950, width: 145, side: 'floor' },
  { x: 1750, width: 140, side: 'ceiling' },
  { x: 3280, width: 165, side: 'floor' },
  { x: 4420, width: 135, side: 'ceiling' },
  { x: 5210, width: 170, side: 'floor' },
  { x: 6150, width: 140, side: 'ceiling' },
  { x: 7420, width: 165, side: 'floor' },
  { x: 8130, width: 130, side: 'ceiling' },
  { x: 8850, width: 155, side: 'floor' }
]);

export const GATES = Object.freeze([
  { x: 2100, phase: 0.1 },
  { x: 3700, phase: 1.9 },
  { x: 5550, phase: 0.9 },
  { x: 7220, phase: 2.3 },
  { x: 9110, phase: 0.4 }
]);

export const DRONES = Object.freeze([
  { x: 1420, y: 370, amplitude: 98, phase: 0.5, speed: 1.4 },
  { x: 2850, y: 370, amplitude: 96, phase: 2.1, speed: 1.9 },
  { x: 4070, y: 350, amplitude: 113, phase: 0.4, speed: 1.6 },
  { x: 4930, y: 365, amplitude: 102, phase: 2.5, speed: 2.1 },
  { x: 6470, y: 360, amplitude: 124, phase: 1.8, speed: 1.7 },
  { x: 7710, y: 365, amplitude: 106, phase: 0.7, speed: 2.2 },
  { x: 8680, y: 355, amplitude: 128, phase: 1.1, speed: 1.8 }
]);

export const CHECKPOINTS = Object.freeze([3200, 6300]);

export function sectorAt(x) {
  return SECTORS.find((sector) => x < sector.end) || SECTORS[SECTORS.length - 1];
}

export function isGapAt(x, gaps, radius = 0) {
  // Landing is unsafe if most of the runner is above a gap.
  return gaps.some((gap) => x + radius * 0.25 > gap.x && x - radius * 0.25 < gap.x + gap.width);
}

function shardTrail(start, end, y, step = 91) {
  const positions = [];
  for (let x = start; x <= end; x += step) {
    positions.push({ x, y, radius: 11, collected: false });
  }
  return positions;
}

export function createWorld() {
  const shards = [
    ...shardTrail(425, 790, FLOOR - 34),
    ...shardTrail(1160, 1580, CEILING + 37),
    ...shardTrail(1920, 1990, FLOOR - 37, 90),
    ...shardTrail(2230, 2370, CEILING + 37),
    ...shardTrail(2770, 3050, CEILING + 37),
    ...shardTrail(3460, 3580, CEILING + 37),
    ...shardTrail(4200, 4390, FLOOR - 34),
    ...shardTrail(5010, 5150, FLOOR - 34),
    ...shardTrail(5890, 6070, FLOOR - 34),
    ...shardTrail(6510, 6680, CEILING + 37),
    ...shardTrail(7100, 7300, CEILING + 37),
    ...shardTrail(7550, 7770, CEILING + 37),
    ...shardTrail(8580, 8770, CEILING + 37),
    ...shardTrail(9030, 9260, FLOOR - 34)
  ];
  return {
    floorGaps: FLOOR_GAPS,
    ceilingGaps: CEILING_GAPS,
    spikes: SPIKES,
    gates: GATES,
    drones: DRONES,
    checkpoints: CHECKPOINTS,
    shards
  };
}
