# Neon Flip — game design & architecture

## Elevator pitch
A futuristic courier must escape the city before dawn by sprinting across its rooftops. Running is automatic; your agency comes from reversing gravity to ride the ceiling, jumping away from the current surface, and triggering a brief invulnerable dash. Learn which hazards demand a flip, which demand a jump, and which demand a perfectly timed dash.

## Game pillars
1. **Readable at speed** — threats glow distinctly: pink spikes, pink lasers, hovering magenta drones; cyan pickups and markers.
2. **Momentum as mastery** — fixed forward speed, deliberate cooldowns, short recovery window.
3. **Neon atmosphere** — original procedural art, layered parallax, nocturnal skyline, snowfall-like rain.
4. **Instant retries** — no loading screen, predictable checkpoint restoration.
5. **Inspectable code** — isolated level data, collision logic and renderer; tests on critical mechanics.

## Core player state
- Position `x/y`, vertical velocity, gravity sign (+1 floor / -1 ceiling).
- Grounded flag, flip cooldown, dash cooldown and remaining dash invulnerability.
- A fixed 60 Hz timestep applies acceleration and constraints.
- Collision is disabled during a dash; respawns give temporary recovery protection.

## World model
A 9,350 world-unit route is divided into three named sectors. The world is generated from immutable arrays of gaps, spikes, moving drones, timed laser gates and checkpoints. Collectibles have per-run mutable collected flags. The renderer culls off-screen geometry where possible.

## Core loop
READY → PLAYING → (PAUSED ↔ PLAYING), PLAYING → DYING → (PLAYING respawn | GAMEOVER), PLAYING → WON.

`main.js` orchestrates the state machine and input. `physics.js` owns game mechanics, `levels.js` owns level data, `renderer.js` draws the world, and `audio.js` synthesizes feedback.

## Player feedback
- Color shift from cyan to pink when gravity switches.
- Flare particles on pickups, impacts, jumps, checkpoints and gravity reversal.
- Dash trail and circular dash shield; screen shake on dash or collision.
- Sound is opt-in via the user's first action, with an on-screen mute toggle.
- UI includes charge pips, score, time, sector, route progress, shard count and dash readiness.

## MVP acceptance criteria
- Load with no downloaded textures, no third-party JS library, and no backend.
- Start, flip, jump, dash, pause, resume, restart, respawn, lose and win.
- Dashing through active hazards is safe; running through them without protection is harmful.
- Collected shards award score once only.
- Reaching checkpoint restores a charge once.
- Entire run is navigable by keyboard and has touch controls.
- Tests cover gravity, hazards, dash invulnerability, collectibles and stage boundaries.

## Next iteration priorities
- Conduct full browser playtests and obstacle-balance tuning for a completable route.
- Accessibility: settings for reduced camera shake, low-contrast effects, remappable controls.
- Add a replayable ghost time-trial and optional high-score service.
- Improve mobile landscape HUD and particles on low-end devices.

## Hosting
GitHub Pages is configured via `.github/workflows/pages.yml`. Set Pages source to **GitHub Actions** in repository settings; the deploy job publishes the static files.
