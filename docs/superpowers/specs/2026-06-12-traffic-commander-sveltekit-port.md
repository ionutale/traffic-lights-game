# Traffic Commander — SvelteKit Port

## Stack

- **Runtime:** Node 26+
- **Framework:** SvelteKit (Svelte 5, runes mode)
- **CSS:** Tailwind CSS v4 + DaisyUI 5
- **Adapter:** `@sveltejs/adapter-vercel`
- **Language:** JavaScript (faithful port of existing game logic)

## File Layout

```
traffic-lights-game/
├── docs/superpowers/specs/
│   └── 2026-06-12-traffic-commander-sveltekit-port.md
├── src/
│   ├── lib/
│   │   └── game/
│   │       ├── engine.js       # Car class, intersection simulation, collision detection
│   │       ├── audio.js        # Web Audio API engine drone + SFX
│   │       └── levels.js       # LEVELS config, PHASES, constants (ROAD_WIDTH, etc.)
│   ├── routes/
│   │   ├── +layout.svelte      # HTML shell, DaisyUI theme, global CSS import
│   │   └── +page.svelte        # Canvas mount, DaisyUI HUD/game-over overlays, controls
│   ├── app.html                # SvelteKit shell (near-default)
│   └── app.css                 # @import "tailwindcss" + DaisyUI plugin
├── static/                     # (empty — no static assets needed)
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## Module Responsibilities

### `src/lib/game/levels.js`

Exports:
- `LEVELS` — array of `{ target, spawn, speedMult }` for levels 1–8
- `PHASES` — array of `{ ns, ew, duration }` for traffic light state machine
- `ROAD_WIDTH`, `LANE_OFFSET`, `STOP_DISTANCE`, `LOGICAL_WIDTH`, `LOGICAL_HEIGHT`, `CENTER_X`, `CENTER_Y` — canvas constants

Pure data. No logic.

### `src/lib/game/audio.js`

Exports functions:
- `initAudio()` — lazily creates `AudioContext`, oscillator, filter, gain nodes
- `updateEngineSound(numCars, avgSpeed, gameState)` — modulates drone volume/pitch
- `playSwapSound()`, `playScoreSound()`, `playLevelUpSound()`, `playCrashSound()`, `playScreechSound(intensity)` — one-shot SFX

Same Web Audio API implementation as original HTML file. Extracted to own module.

### `src/lib/game/engine.js`

Exports class `Car` and a `GameEngine` factory function that encapsulates:
- `cars` — `{ N: [], S: [], E: [], W: [] }`
- `currentPhase`, `lightTimer`, `crashPoint`
- `updateLogic()` — spawns cars, updates positions, checks collisions, checks score/level
- `drawScene(ctx, scaleX, scaleY, timestamp)` — renders roads, markings, traffic lights, cars, explosion
- `getCarRect(car)` — AABB for collision
- `checkCollisions()` — returns crash point or null
- `getState()` — returns `{ score, level, gameState, crashPoint }` for the Svelte component to read

The engine is instantiated once in `+page.svelte` and driven by `requestAnimationFrame`.

### `src/routes/+layout.svelte`

- Minimal shell
- Imports `app.css`
- Sets DaisyUI `data-theme` on `<html>` (dark or light)
- `<slot />` for page content

### `src/routes/+page.svelte`

The main game page. Key responsibilities:

1. **Canvas setup** — `onMount` gets canvas ref, calls `resizeCanvas`, starts rAF loop. `onDestroy` cancels rAF.
2. **Engine binding** — Creates a `GameEngine` instance. Exposes reactive `$state()` variables: `score`, `currentLevel`, `gameState`, `crashPoint`.
3. **Game loop** — Each rAF frame calls `engine.updateLogic()` then `engine.drawScene()`. After `updateLogic`, the reactive state is synced from engine.
4. **UI rendering** — DaisyUI components read reactive state for HUD (score/level hearts, progress), game-over overlay, level-up modal.
5. **Controls** — `on:keydown` on window for Space to swap lights. `on:click` on swap button. `on:click` on overlay start/continue/retry button.

### `src/app.css`

```css
@import "tailwindcss";
@plugin "daisyui";
```

## State Management

No Svelte stores needed. The game engine is a plain JS object. The page component mirrors slice of engine state into `$state()` runes after each `updateLogic()` call. This keeps the engine framework-agnostic and testable standalone.

## Data Flow

```
requestAnimationFrame
  → engine.updateLogic()
    → spawn cars, update positions, check collisions, check score
  → syncState() (copy engine values to Svelte reactive state)
  → engine.drawScene(ctx, ...)
  → render (Svelte reactive bindings update DOM automatically)
```

User input (Space or button click):
  → `engine.requestLightSwap()` 
  → next rAF frame processes phase change

## Deployment

- `package.json` scripts: `dev`, `build`, `preview`
- `svelte.config.js`: adapter `@sveltejs/adapter-vercel`
- Deploy via `vercel deploy` or Vercel Git integration

## Test Plan

- `npm run dev` — verify game loads, runs, all interactions work
- `npm run build` — verify production build succeeds
- Visual verification: scoring, level progression, light swap, crash game over, level-up modal, victory screen

## Out of Scope

- Multiplayer
- Leaderboards
- Mobile touch controls (keyboard/button only, as original)
- Unit tests (game is a visual simulation; manual QA suffices for this port)
