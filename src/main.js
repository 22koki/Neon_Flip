import { WIDTH, HEIGHT, END_X, SECTORS, CHECKPOINTS, createWorld, sectorAt } from './levels.js';
import { createPlayer, flipGravity, jump, dash, stepPlayer, detectCollision, collectShards, DASH_COOLDOWN, MAX_HEALTH } from './physics.js';
import { render } from './renderer.js';
import { AudioEngine } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const sound = new AudioEngine();
const $ = (selector) => document.querySelector(selector);
const $all = (selector) => Array.from(document.querySelectorAll(selector));
const stored = (key, fallback = null) => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* private browsing */ }
};
const initialBest = Number(stored('neon-flip-best-time', '0')) || 0;
const initialHigh = Number(stored('neon-flip-high-score', '0')) || 0;

function createGame() {
  return {
    status: 'ready',
    player: createPlayer(),
    world: createWorld(),
    camera: 0,
    health: MAX_HEALTH,
    checkpoint: 190,
    clock: 0,
    score: 0,
    crystals: 0,
    crashes: 0,
    previousSector: 0,
    dyingTimer: 0,
    particles: [],
    shake: 0,
    damageFlash: 0,
    toastUntil: 0,
    bestTime: initialBest,
    highScore: initialHigh,
    wonRecord: false
  };
}
let game = createGame();

function resize() {
  // Render on a fixed logical canvas: CSS scales it to fit desktop and mobile.
  // A 1x-2x backing multiplier keeps the procedural art crisp on Retina displays.
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(WIDTH * scale);
  canvas.height = Math.round(HEIGHT * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
resize();
window.addEventListener('resize', resize);

function setScreen(name) {
  $all('.screen').forEach((panel) => panel.classList.toggle('is-visible', panel.dataset.screen === name));
  $('#game-shell').classList.toggle('is-playing', !name);
}
function formatTime(value) {
  const min = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  const hund = Math.floor((value % 1) * 100);
  return String(min).padStart(2, '0') + ':' + String(secs).padStart(2, '0') + '.' + String(hund).padStart(2, '0');
}
function showToast(title, label = '') {
  $('#toast-heading').textContent = title;
  $('#toast-detail').textContent = label;
  game.toastUntil = game.clock + 2.25;
  $('#toast').classList.add('show');
}
function burst(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 1.3 + Math.random() * 4.6;
    const life = .24 + Math.random() * .55;
    game.particles.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life, maxLife: life, color, size: 1.7 + Math.random() * 3.4
    });
  }
}
function updateParticles(dt = 1) {
  const seconds = dt / 60;
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += .05 * dt;
    p.life -= seconds;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  if (game.particles.length > 250) game.particles.splice(0, game.particles.length - 250);
}
function updateHud() {
  const sector = sectorAt(game.player.x);
  $('#hud-sector').textContent = sector.name;
  $('#hud-stage').textContent = sector.code + ' / 03';
  $('#hud-time').textContent = formatTime(game.clock);
  $('#hud-score').textContent = game.score.toLocaleString('en-US');
  $('#hud-crystals').textContent = game.crystals;
  $('#hud-progress').style.width = Math.min(100, game.player.x / END_X * 100) + '%';
  $('#dash-fill').style.width = (100 * (1 - game.player.dashCooldown / DASH_COOLDOWN)) + '%';
  $('#dash-status').textContent = game.player.dashCooldown <= 0 ? 'READY' : 'CHARGING';
  $('#hud-health').innerHTML = new Array(MAX_HEALTH).fill(0).map((_, i) =>
    '<span class="health-pip ' + (i < game.health ? 'alive' : '') + '"></span>').join('');
  $('#mute-label').textContent = sound.muted ? 'SOUND OFF' : 'SOUND ON';
  $('#sound-toggle').setAttribute('aria-pressed', String(!sound.muted));
}

function start() {
  sound.unlock();
  game = createGame();
  game.bestTime = Number(stored('neon-flip-best-time', '0')) || 0;
  game.highScore = Number(stored('neon-flip-high-score', '0')) || 0;
  game.status = 'playing';
  game.toastUntil = 0;
  setScreen(null);
  sound.play('start');
  showToast('MIDNIGHT RUN', 'Make it to the next rooftop.');
  updateHud();
}
function pause() {
  if (game.status !== 'playing') return;
  game.status = 'paused';
  setScreen('pause');
}
function resume() {
  if (game.status !== 'paused') return;
  game.status = 'playing';
  setScreen(null);
  sound.unlock();
}
function hit(type) {
  game.status = 'dying';
  game.dyingTimer = .8;
  game.health--;
  game.crashes++;
  game.damageFlash = 1.2;
  game.shake = 1;
  sound.play('hurt');
  burst(game.player.x, game.player.y, '#ff5a94', 28);
  if (game.health <= 0) showToast('SIGNAL LOST', 'No backup charges remaining.');
  else showToast(type === 'void' ? 'FELL INTO THE VOID' : 'SYSTEM ERROR', 'Restoring last checkpoint...');
}
function respawn() {
  game.player = createPlayer(Math.max(190, game.checkpoint - 70));
  game.player.invincible = 1.5;
  game.status = 'playing';
  game.camera = Math.max(0, game.player.x - 315);
  game.damageFlash = 0;
  sound.play('restore');
}
function lose() {
  game.status = 'gameover';
  $('#fail-distance').textContent = Math.min(99, Math.floor(100 * game.player.x / END_X)) + '%';
  $('#fail-score').textContent = game.score.toLocaleString('en-US');
  $('#fail-crystals').textContent = String(game.crystals).padStart(2, '0');
  setScreen('gameover');
  sound.play('lose');
}
function win() {
  if (game.status !== 'playing') return;
  game.status = 'won';
  const bonus = 700 + game.health * 250 + Math.max(0, 3000 - Math.floor(game.clock * 50));
  game.score += bonus;
  game.wonRecord = !game.bestTime || game.clock < game.bestTime;
  if (game.wonRecord) {
    game.bestTime = game.clock;
    save('neon-flip-best-time', game.clock);
  }
  if (game.score > game.highScore) {
    game.highScore = game.score;
    save('neon-flip-high-score', game.score);
  }
  $('#win-score').textContent = game.score.toLocaleString('en-US');
  $('#win-time').textContent = formatTime(game.clock);
  $('#win-crystals').textContent = game.crystals + ' / ' + game.world.shards.length;
  $('#win-best').textContent = formatTime(game.bestTime);
  $('#record-stamp').hidden = !game.wonRecord;
  sound.play('win');
  burst(game.player.x, game.player.y, '#ffe6a9', 60);
  setScreen('win');
}
function act(action) {
  if (action === 'start') { start(); return; }
  if (action === 'restart') { start(); return; }
  if (action === 'pause') {
    if (game.status === 'playing') pause();
    else if (game.status === 'paused') resume();
    return;
  }
  if (action === 'resume') { resume(); return; }
  if (action === 'mute') {
    sound.toggle();
    updateHud();
    return;
  }
  if (game.status !== 'playing') return;
  if (action === 'flip' && flipGravity(game.player)) {
    burst(game.player.x, game.player.y, game.player.gravity === 1 ? '#52fff1' : '#ff70c5', 13);
    sound.play('flip');
  } else if (action === 'jump' && jump(game.player)) {
    burst(game.player.x, game.player.y, '#9eefff', 10);
    sound.play('jump');
  } else if (action === 'dash' && dash(game.player)) {
    game.shake = .35;
    burst(game.player.x, game.player.y, '#b6ffff', 18);
    sound.play('dash');
  }
}
const keyMap = {
  'Space': 'flip', 'KeyE': 'flip', 'KeyF': 'flip',
  'ArrowUp': 'jump', 'KeyW': 'jump',
  'ShiftLeft': 'dash', 'ShiftRight': 'dash', 'KeyK': 'dash',
  'KeyP': 'pause', 'Escape': 'pause',
  'KeyR': 'restart', 'Enter': 'start'
};
window.addEventListener('keydown', (event) => {
  const action = keyMap[event.code];
  if (!action) return;
  event.preventDefault();
  if (event.repeat) return;
  if (game.status === 'ready' && (action === 'start' || action === 'flip')) start();
  else if (game.status === 'gameover' && ['restart', 'start', 'flip'].includes(action)) start();
  else if (game.status === 'won' && ['restart', 'start'].includes(action)) start();
  else if (action !== 'start') act(action);
});
$all('[data-action]').forEach((node) => {
  node.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    act(node.dataset.action);
  });
});
$('#game').addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' && game.status === 'playing') {
    event.preventDefault();
    act('flip');
  }
});
window.addEventListener('blur', () => { if (game.status === 'playing') pause(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.status === 'playing') pause();
});

let hudCounter = 0;
function step() {
  if (game.status !== 'playing' && game.status !== 'dying') return;
  game.clock += 1 / 60;
  const player = game.player;
  if (game.status === 'dying') {
    game.dyingTimer -= 1 / 60;
    if (game.dyingTimer <= 0) {
      if (game.health <= 0) lose();
      else respawn();
    }
  } else {
    const sectorIndex = Math.min(2, Math.floor(player.x / 3100));
    const crossedFinish = stepPlayer(player, 1, sectorIndex);
    if (crossedFinish) {
      win();
    } else {
      const collision = detectCollision(player, game.world, game.clock);
      if (collision) {
        hit(collision);
      } else {
        const collected = collectShards(player, game.world);
        if (collected) {
          game.crystals += collected;
          game.score += 125 * collected;
          burst(player.x, player.y, '#56fff0', 6 * collected);
          sound.play('crystal');
        }
        for (const checkpoint of CHECKPOINTS) {
          if (player.x >= checkpoint && game.checkpoint < checkpoint) {
            game.checkpoint = checkpoint;
            game.health = Math.min(MAX_HEALTH, game.health + 1);
            showToast('CHECKPOINT SAVED', '+1 charge restored');
            sound.play('checkpoint');
            burst(player.x, player.y, '#ffca82', 33);
          }
        }
        if (sectorIndex > game.previousSector) {
          game.previousSector = sectorIndex;
          const zone = SECTORS[sectorIndex];
          showToast(zone.name, zone.subtitle);
          sound.play('sector');
        }
      }
    }
    if (player.grounded && Math.random() < .26) {
      game.particles.push({
        x: player.x - 11, y: player.y + player.gravity * 15,
        vx: -(2 + Math.random() * 2), vy: -player.gravity * Math.random() * 2,
        maxLife: .23, life: .23, size: 1.6, color: player.gravity === 1 ? '#4effed' : '#ff78cc'
      });
    }
  }
  const desiredCamera = Math.max(0, Math.min(END_X - 1170, player.x - 270));
  game.camera += (desiredCamera - game.camera) * .14;
  game.shake = Math.max(0, game.shake - .075);
  game.damageFlash = Math.max(0, game.damageFlash - .042);
  updateParticles();
  if (game.clock > game.toastUntil) $('#toast').classList.remove('show');
  if (++hudCounter % 4 === 0) updateHud();
}

let last = performance.now();
let accumulator = 0;
function frame(now) {
  const delta = Math.min(80, now - last);
  last = now;
  accumulator += delta / (1000 / 60);
  let loops = 0;
  while (accumulator >= 1 && loops < 5) {
    step();
    accumulator--;
    loops++;
  }
  if (loops === 5) accumulator = 0;
  render(ctx, game);
  requestAnimationFrame(frame);
}
setScreen('intro');
updateHud();
requestAnimationFrame(frame);
