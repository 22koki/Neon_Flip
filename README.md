# NEON FLIP — Rewrite Gravity

A cinematic cyberpunk gravity-runner built with **vanilla JavaScript, HTML5 Canvas and Web Audio**. No package dependencies, no image downloads, and no backend. Play directly in the browser.

## Play

Open `index.html` through a local HTTP server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000. You can also publish this repo with **Settings → Pages → Source: GitHub Actions**. The repository includes a Pages deployment workflow.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Flip gravity | Space / E / F | FLIP |
| Jump | Up arrow / W | JUMP |
| Dash (brief invulnerability) | Shift / K | DASH |
| Pause | P / Escape | Pause icon |
| Restart | R | Restart button |

The character runs automatically. Find safer routes across the ceiling and floor, dodge drones, collect cyan shards, and dash through timed laser gates. You have four backup charges. Passing checkpoints restores one charge. The highest score and fastest completion time are saved locally.

## Current MVP

- Three contiguous districts: **Midnight Run**, **The Highline**, **Zero Hour**
- Procedural parallax cyberpunk skyline, illuminated moon, billboards, neon platforms, rainfall and moving stars
- Gravity reversal, surface-specific jumping and cooldown-based dash
- Moving drones, floor/ceiling spikes, timed laser gates, fatal gaps
- Checkpoints, recovery, health, score, shard collection and finish line
- Pause/restart, introductory controls, win/lose states, synthesized sound effects
- Browser and mobile touch controls
- Fixed 60 Hz simulation timestep with frame-rate-independent rendering
- JavaScript gameplay tests and GitHub Actions CI
- GitHub Pages deployment workflow

## Architecture

```text
index.html                    Browser game, HUD, title and result screens
styles.css                    Responsive neon design and touch controls
favicon.svg                   Original vector identity
src/
  levels.js                   World constants, sectors, hazards, collectibles
  physics.js                  Movement, gravity, dash, collision and pickups
  renderer.js                 Canvas skyline, environment, characters, particles
  audio.js                    Web Audio sound synthesizer
  main.js                     Game state machine, input, timing, HUD, checkpointing
tests/gameplay.test.js        Physics and collision regression tests
.github/workflows/ci.yml     Syntax checks and unit tests
.github/workflows/pages.yml  Static game publishing
docs/GAME_DESIGN.md          Design pillars, roadmap and technical decisions
```

## Develop and test

Node.js 20+ required for tests, but **not** to play.

```bash
npm test
npm run check
npm run ci
```

All game code is standard ES modules and is intentionally dependency-free.

## Roadmap

**v0.1:** playable first run, procedural visuals, hazards, checkpoints and game-feel.

**v0.2:** authored level challenges, more obstacle types, richer animation and music, accessibility and balance improvements.

**v0.3:** ghost replay, time-trial leaderboards (optional backend), player cosmetics and unlocks, speedrun metrics.

## Credits

Made by [@22koki](https://github.com/22koki). All visuals are original procedurally drawn canvas art; sound effects are generated at runtime. License: MIT.
