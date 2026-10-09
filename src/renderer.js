import { WIDTH, HEIGHT, CEILING, FLOOR, END_X, PLAYER_RADIUS, SECTORS, sectorAt } from './levels.js';
import { isGateActive, droneY } from './physics.js';

const C = {
  cyan: '#50fff2', pink: '#ff5dbd', violet: '#9676ff', gold: '#ffcf81',
  navy: '#080b1e', ice: '#dbffff', danger: '#ff6488'
};

function hash(n) {
  const a = Math.sin(n * 127.1 + 43.67) * 43758.5453;
  return a - Math.floor(a);
}
function mod(n, m) { return ((n % m) + m) % m; }
function rounded(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) ctx.fill();
}
function neonLine(ctx, x1, y1, x2, y2, color, blur = 12, width = 2) {
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}
function drawSky(ctx, camera, t, hue) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#09091f');
  sky.addColorStop(.40, '#151232');
  sky.addColorStop(.72, '#20153c');
  sky.addColorStop(1, '#101329');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bloom = ctx.createRadialGradient(860, 250, 20, 860, 250, 600);
  bloom.addColorStop(0, 'rgba(185,65,186,.17)');
  bloom.addColorStop(.5, 'rgba(112,61,190,.075)');
  bloom.addColorStop(1, 'rgba(20,15,45,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 96; i++) {
    const x = mod(hash(i + 1) * WIDTH * 1.8 - camera * .035, WIDTH);
    const y = 28 + hash(i + 90) * 350;
    ctx.globalAlpha = .24 + .45 * Math.abs(Math.sin(t * (.38 + hash(i + 55)) + i));
    ctx.fillStyle = i % 4 ? '#bcd7ff' : '#ffb9ea';
    ctx.fillRect(x, y, 1.0 + hash(i * 2) * 1.3, 1.0 + hash(i * 2) * 1.3);
  }
  ctx.globalAlpha = 1;

  const moonX = mod(980 - camera * .022, 1500) - 30;
  const halo = ctx.createRadialGradient(moonX, 146, 4, moonX, 146, 170);
  halo.addColorStop(0, 'rgba(193,248,255,.25)');
  halo.addColorStop(.35, 'rgba(117,188,255,.12)');
  halo.addColorStop(1, 'rgba(117,188,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(moonX, 146, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bdeef4';
  ctx.shadowColor = '#9adbf8';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(moonX, 146, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#a1d6df';
  ctx.beginPath();
  ctx.arc(moonX - 8, 136, 5, 0, Math.PI * 2);
  ctx.arc(moonX + 11, 154, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '11px monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('N E O N   C I T Y  //  2089', 58, 83);
  ctx.letterSpacing = '0px';
}
function drawBuildings(ctx, camera, t) {
  const layers = [
    { speed: .12, step: 112, base: 612, max: 238, fill: '#171736', windows: '#4a3c6b', alpha: .55 },
    { speed: .27, step: 102, base: 650, max: 340, fill: '#14162f', windows: '#6f477b', alpha: .78 },
    { speed: .42, step: 112, base: 679, max: 400, fill: '#10162c', windows: '#294b68', alpha: 1 }
  ];
  layers.forEach((layer, li) => {
    const scroll = camera * layer.speed;
    const first = Math.floor(scroll / layer.step) - 1;
    const offset = mod(scroll, layer.step);
    ctx.globalAlpha = layer.alpha;
    for (let k = -1; k < 16; k++) {
      const i = first + k;
      const bx = k * layer.step - offset;
      const seed = hash(i + 1000 + li * 103);
      const tall = 80 + seed * layer.max;
      const bw = layer.step * (.69 + hash(i + 31) * .25);
      const by = layer.base - tall;
      ctx.fillStyle = layer.fill;
      ctx.fillRect(bx, by, bw, tall);
      ctx.fillStyle = li === 2 ? '#203752' : '#4b365a';
      ctx.fillRect(bx + 5, by + 8, bw - 10, 2);
      if (i % 7 === 0) {
        neonLine(ctx, bx + bw / 2, by, bx + bw / 2, by - (14 + seed * 30), '#a66fff', 6, 1);
      }
      for (let wy = by + 19, row = 0; wy < layer.base - 17; wy += 20, row++) {
        for (let wx = bx + 12, col = 0; wx < bx + bw - 9; wx += 17, col++) {
          if (hash(i * 19 + row * 4.9 + col * 17 + li * 201) > .54) {
            ctx.globalAlpha = layer.alpha * (.4 + .42 * Math.sin(i + row + t * .12) ** 2);
            ctx.fillStyle = hash(i + row + col * 19) > .7 ? '#d67fdd' : layer.windows;
            ctx.fillRect(wx, wy, 5, 9);
          }
        }
      }
      ctx.globalAlpha = layer.alpha;
    }
  });
  ctx.globalAlpha = 1;

  // Low, hazy strip of light at the horizon.
  const haze = ctx.createLinearGradient(0, 390, 0, 690);
  haze.addColorStop(0, 'rgba(155,59,181,0)');
  haze.addColorStop(.45, 'rgba(170,53,178,.10)');
  haze.addColorStop(1, 'rgba(60,44,137,.18)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 380, WIDTH, 310);
}
function drawBillboards(ctx, camera, t) {
  const signs = [
    { x: 470, y: 338, text: 'NIGHT // 01', color: C.pink },
    { x: 2750, y: 300, text: 'GRAVITY IS A LIE', color: C.cyan },
    { x: 4720, y: 342, text: 'STAY UNREAL', color: C.violet },
    { x: 6840, y: 325, text: 'RUN / REPEAT', color: C.pink },
    { x: 8670, y: 320, text: 'DAWN IS A GLITCH', color: C.gold }
  ];
  ctx.save();
  for (const s of signs) {
    const x = s.x - camera * .64;
    if (x < -260 || x > WIDTH + 90) continue;
    ctx.translate(x, s.y);
    ctx.fillStyle = '#0b1227';
    ctx.strokeStyle = s.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = s.color;
    ctx.lineWidth = 2;
    rounded(ctx, 0, 0, 216, 68, 5, true);
    ctx.strokeRect(4, 4, 208, 60);
    ctx.shadowBlur = 0;
    ctx.fillStyle = s.color;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = .78 + .22 * Math.sin(t * 4);
    ctx.fillText(s.text, 108, 38);
    ctx.globalAlpha = 1;
    ctx.translate(-x, -s.y);
  }
  ctx.restore();
}
function platforms(ctx, camera, t, gaps, side, color) {
  const y = side === 'floor' ? FLOOR : CEILING;
  const top = side === 'floor' ? y : 0;
  const height = side === 'floor' ? HEIGHT - y : y;
  let cursor = Math.floor(camera / 100) * 100 - 150;
  const far = camera + WIDTH + 170;
  const ordered = gaps.filter((gap) => gap.x + gap.width > cursor && gap.x < far);
  const intervals = [];
  for (const gap of ordered) {
    if (gap.x > cursor) intervals.push({ x: cursor, width: gap.x - cursor });
    cursor = Math.max(cursor, gap.x + gap.width);
  }
  if (cursor < far) intervals.push({ x: cursor, width: far - cursor });
  const edge = side === 'floor' ? y : y - 2;
  for (const segment of intervals) {
    const x = segment.x - camera;
    if (segment.width <= 0) continue;
    const fill = ctx.createLinearGradient(0, top, 0, top + height);
    if (side === 'floor') {
      fill.addColorStop(0, '#1b2540');
      fill.addColorStop(.6, '#0d1329');
      fill.addColorStop(1, '#090e20');
    } else {
      fill.addColorStop(0, '#090e20');
      fill.addColorStop(.55, '#10182b');
      fill.addColorStop(1, '#243250');
    }
    ctx.fillStyle = fill;
    ctx.fillRect(x, top, segment.width, height);
    ctx.fillStyle = '#28324b';
    for (let i = Math.ceil(segment.x / 64); i * 64 < segment.x + segment.width; i++) {
      ctx.fillRect(i * 64 - camera, side === 'floor' ? FLOOR + 15 : 8, 2, 54);
    }
    neonLine(ctx, x, edge, x + segment.width, edge, color, 16, 3);
    neonLine(ctx, x, side === 'floor' ? edge + 7 : edge - 7, x + segment.width,
      side === 'floor' ? edge + 7 : edge - 7, 'rgba(255,255,255,.22)', 0, 1);
  }
  for (const gap of ordered) {
    const gx = gap.x - camera;
    ctx.fillStyle = 'rgba(255,75,140,.18)';
    ctx.fillRect(gx - 5, side === 'floor' ? FLOOR - 15 : CEILING - 2, 4, 18);
    ctx.fillRect(gx + gap.width + 2, side === 'floor' ? FLOOR - 15 : CEILING - 2, 4, 18);
    neonLine(ctx, gx, edge, gx, edge + (side === 'floor' ? 44 : -44), '#ff577e', 17, 3);
    neonLine(ctx, gx + gap.width, edge, gx + gap.width, edge + (side === 'floor' ? 44 : -44), '#ff577e', 17, 3);
    ctx.fillStyle = '#fa5c88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOID', gx + gap.width / 2, side === 'floor' ? FLOOR + 36 : CEILING - 21);
  }
}
function drawGrid(ctx, camera, t) {
  ctx.globalAlpha = .07;
  ctx.strokeStyle = '#a3c1ff';
  ctx.lineWidth = 1;
  const start = -mod(camera * .65, 64);
  for (let x = start; x < WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, CEILING);
    ctx.lineTo(x, FLOOR);
    ctx.stroke();
  }
  for (let y = CEILING + 38; y < FLOOR; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(36,20,75,.055)';
  for (let y = CEILING; y < FLOOR; y += 5) ctx.fillRect(0, y, WIDTH, 1);
}
function drawSpikes(ctx, world, camera) {
  for (const strip of world.spikes) {
    const sx = strip.x - camera;
    if (sx + strip.width < -20 || sx > WIDTH + 20) continue;
    const floorSide = strip.side === 'floor';
    const y = floorSide ? FLOOR : CEILING;
    ctx.fillStyle = '#4c1733';
    ctx.fillRect(sx, floorSide ? y - 9 : y, strip.width, 10);
    ctx.fillStyle = C.danger;
    ctx.shadowColor = C.danger;
    ctx.shadowBlur = 17;
    for (let x = 0; x < strip.width; x += 21) {
      const right = Math.min(x + 21, strip.width);
      ctx.beginPath();
      ctx.moveTo(sx + x, y);
      ctx.lineTo(sx + (x + right) / 2, y + (floorSide ? -38 : 38));
      ctx.lineTo(sx + right, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
function drawGates(ctx, world, camera, t) {
  for (const gate of world.gates) {
    const x = gate.x - camera;
    if (x < -65 || x > WIDTH + 65) continue;
    const active = isGateActive(gate, t);
    ctx.fillStyle = '#151b35';
    ctx.strokeStyle = active ? C.danger : C.cyan;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    rounded(ctx, x - 19, CEILING + 4, 38, 22, 5, true);
    ctx.strokeRect(x - 19, CEILING + 4, 38, 22);
    rounded(ctx, x - 19, FLOOR - 26, 38, 22, 5, true);
    ctx.strokeRect(x - 19, FLOOR - 26, 38, 22);
    ctx.shadowBlur = 0;
    if (active) {
      const beam = ctx.createLinearGradient(x - 17, 0, x + 17, 0);
      beam.addColorStop(0, 'rgba(255,61,110,0)');
      beam.addColorStop(.5, 'rgba(255,92,139,.8)');
      beam.addColorStop(1, 'rgba(255,61,110,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(x - 19, CEILING + 24, 38, FLOOR - CEILING - 48);
      neonLine(ctx, x, CEILING + 24, x, FLOOR - 24, '#ffabc9', 28, 3);
      ctx.fillStyle = C.danger;
    } else ctx.fillStyle = '#66ffec';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(active ? 'DASH' : 'CLEAR', x, CEILING + 43);
  }
}
function drawDrones(ctx, world, camera, t) {
  for (const drone of world.drones) {
    const x = drone.x - camera;
    if (x < -75 || x > WIDTH + 75) continue;
    const y = droneY(drone, t);
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(t * 9 + drone.phase) * 3;
    ctx.fillStyle = '#111b39';
    ctx.strokeStyle = '#fb75ba';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff57bf';
    ctx.shadowBlur = 19;
    ctx.beginPath();
    ctx.ellipse(0, bob, 27, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fb7fc5';
    ctx.fillRect(-8, bob - 3, 16, 6);
    ctx.fillStyle = '#8f9ff2';
    ctx.fillRect(-44, bob - 2, 16, 4);
    ctx.fillRect(28, bob - 2, 16, 4);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = .12;
    ctx.fillStyle = '#ff72c4';
    ctx.beginPath();
    ctx.moveTo(-12, bob + 12);
    ctx.lineTo(12, bob + 12);
    ctx.lineTo(36, bob + 100);
    ctx.lineTo(-36, bob + 100);
    ctx.fill();
    ctx.restore();
  }
}
function drawShards(ctx, world, camera, t) {
  for (const shard of world.shards) {
    if (shard.collected) continue;
    const x = shard.x - camera;
    if (x < -30 || x > WIDTH + 30) continue;
    const y = shard.y + Math.sin(t * 3.5 + shard.x * .01) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 1.6);
    ctx.shadowColor = C.cyan;
    ctx.shadowBlur = 17;
    ctx.strokeStyle = '#c7fff7';
    ctx.fillStyle = '#39e8d9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
function drawCheckpoint(ctx, camera, x, active, t) {
  const px = x - camera;
  if (px < -45 || px > WIDTH + 45) return;
  ctx.save();
  ctx.globalAlpha = active ? .3 : .9;
  neonLine(ctx, px, CEILING + 14, px, FLOOR - 14, '#67feeb', 28, 2);
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 14]);
  ctx.strokeRect(px - 15, CEILING + 70, 30, FLOOR - CEILING - 140);
  ctx.setLineDash([]);
  ctx.fillStyle = '#98fff5';
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('SAVE //', px, 204);
  ctx.restore();
}
function drawFinish(ctx, camera, t) {
  const x = END_X - camera;
  if (x < -110 || x > WIDTH + 120) return;
  ctx.save();
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 25;
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(x - 29, CEILING + 30, 58, FLOOR - CEILING - 60);
  ctx.fillStyle = 'rgba(255,207,129,.13)';
  ctx.fillRect(x - 26, CEILING + 33, 52, FLOOR - CEILING - 66);
  neonLine(ctx, x, CEILING + 45, x, FLOOR - 45, '#fff4c9', 20, 2 + Math.sin(t * 6));
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH', x, CEILING + 17);
  ctx.restore();
}
function drawRain(ctx, camera, t) {
  ctx.lineWidth = 1;
  for (let i = 0; i < 108; i++) {
    const x = mod(hash(i * 11 + 700) * 1560 - t * (130 + hash(i + 34) * 45) - camera * .08, 1330) - 25;
    const y = mod(hash(i * 23 + 214) * 920 + t * (300 + hash(i + 160) * 190), 850) - 60;
    ctx.strokeStyle = i % 4 === 0 ? 'rgba(224,163,255,.20)' : 'rgba(163,220,255,.12)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 9, y + 27);
    ctx.stroke();
  }
}
function drawRunner(ctx, player, camera, t) {
  if (!player) return;
  const x = player.x - camera;
  const y = player.y;
  if (player.invincible > 0 && Math.floor(t * 17) % 2 === 0) ctx.globalAlpha = .45;

  const trailCount = player.dashTime > 0 ? 7 : 3;
  for (let i = trailCount; i > 0; i--) {
    ctx.globalAlpha = (player.dashTime > 0 ? .22 : .055) * (1 - i / (trailCount + 2));
    ctx.fillStyle = player.gravity === 1 ? C.cyan : C.pink;
    ctx.beginPath();
    ctx.ellipse(x - i * (player.dashTime > 0 ? 16 : 9), y, 16 + i * 1.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = player.invincible > 0 && Math.floor(t * 17) % 2 === 0 ? .55 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, player.gravity);
  ctx.rotate(Math.max(-.16, Math.min(.16, player.vy / 45)));

  const color = player.gravity === 1 ? C.cyan : C.pink;
  const running = Math.sin(t * 18) * (player.grounded ? 1 : .25);

  if (player.dashTime > 0) {
    ctx.strokeStyle = '#eaffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 27 + Math.sin(t * 30) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Shoes and animated legs.
  ctx.strokeStyle = '#7fa4cc';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 8); ctx.lineTo(-9 - running * 6, 19);
  ctx.moveTo(7, 8); ctx.lineTo(7 + running * 6, 20);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16 - running * 6, 21); ctx.lineTo(-6 - running * 6, 21);
  ctx.moveTo(0 + running * 6, 21); ctx.lineTo(14 + running * 6, 21);
  ctx.stroke();

  // Scarf streams behind runner.
  ctx.fillStyle = player.gravity === 1 ? 'rgba(79,255,241,.83)' : 'rgba(255,96,192,.88)';
  ctx.beginPath();
  ctx.moveTo(-5, -9);
  ctx.lineTo(-26 - Math.sin(t * 6) * 3, -12);
  ctx.lineTo(-44 - Math.sin(t * 9) * 5, -4);
  ctx.lineTo(-7, -3);
  ctx.fill();

  // Jacket, bright left shoulder, futuristic reflective accent.
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#17223a';
  rounded(ctx, -10, -13, 23, 24, 6, true);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  rounded(ctx, -10, -13, 23, 24, 6, false);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(6, -5, 4, 12);
  ctx.shadowBlur = 0;

  // Helmet and visor.
  ctx.fillStyle = '#12182d';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(1, -19, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  rounded(ctx, -1, -23, 16, 7, 3, true);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, -21, 3, 2);
  ctx.restore();
  ctx.globalAlpha = 1;
}
function drawParticles(ctx, game) {
  ctx.save();
  for (const p of game.particles) {
    const x = p.x - game.camera;
    if (x < -20 || x > WIDTH + 20) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha * .86;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawVignette(ctx, game) {
  const gradient = ctx.createRadialGradient(640, 335, 250, 640, 340, 760);
  gradient.addColorStop(0, 'rgba(5,7,18,0)');
  gradient.addColorStop(.78, 'rgba(5,7,18,.12)');
  gradient.addColorStop(1, 'rgba(3,4,14,.56)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (game.damageFlash > 0) {
    ctx.fillStyle = 'rgba(255,35,93,' + Math.min(.28, game.damageFlash * .25) + ')';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}
export function render(ctx, game) {
  const t = game.clock;
  const camera = game.camera;
  const shift = game.shake > 0 ? Math.sin(t * 84) * game.shake * 7 : 0;
  ctx.save();
  ctx.translate(shift, game.shake > 0 ? Math.cos(t * 104) * game.shake * 3 : 0);
  drawSky(ctx, camera, t);
  drawBuildings(ctx, camera, t);
  drawBillboards(ctx, camera, t);
  drawGrid(ctx, camera, t);
  platforms(ctx, camera, t, game.world.ceilingGaps, 'ceiling', '#ff6ac5');
  platforms(ctx, camera, t, game.world.floorGaps, 'floor', '#51f9f2');
  drawSpikes(ctx, game.world, camera);
  drawGates(ctx, game.world, camera, t);
  drawDrones(ctx, game.world, camera, t);
  for (const checkpoint of game.world.checkpoints) {
    drawCheckpoint(ctx, camera, checkpoint, game.checkpoint >= checkpoint, t);
  }
  drawFinish(ctx, camera, t);
  drawShards(ctx, game.world, camera, t);
  drawParticles(ctx, game);
  drawRunner(ctx, game.player, camera, t);
  drawRain(ctx, camera, t);
  drawVignette(ctx, game);
  ctx.restore();

  // Small cinematic ticker in the bottom-left corner, beyond the route.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#83a2b4';
  ctx.globalAlpha = .9;
  ctx.fillText('NΞON FLIP  //  ' + sectorAt(game.player.x).code + '  //  SIGNAL ACTIVE', 30, HEIGHT - 24);
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.min(100, Math.floor(game.player.x / END_X * 100))).padStart(2, '0') + '% TO DAWN', WIDTH - 30, HEIGHT - 24);
  ctx.restore();
}
