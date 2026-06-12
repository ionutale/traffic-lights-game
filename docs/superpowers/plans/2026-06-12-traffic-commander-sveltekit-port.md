# Traffic Commander SvelteKit Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the existing HTML/JS Traffic Commander game to a SvelteKit 5 app with Tailwind CSS v4 + DaisyUI 5, deployable to Vercel.

**Architecture:** Game engine logic (Car class, collision detection, canvas drawing, audio) extracted into plain JS modules under `src/lib/game/`. A single `+page.svelte` component instantiates the engine and drives the game loop via requestAnimationFrame. UI overlays (HUD, modals) use DaisyUI components bound to Svelte 5 reactive `$state()` runes.

**Tech Stack:** Svelte 5 (runes), SvelteKit, Tailwind CSS v4, DaisyUI 5, `@sveltejs/adapter-vercel`, Node 26+

---

### Task 1: Scaffold SvelteKit project

**Files:**
- Create: `package.json`
- Create: `svelte.config.js`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/app.html`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "traffic-commander",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/adapter-vercel": "^5.0.0",
    "@sveltejs/kit": "^2.20.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "svelte": "^5.25.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.0",
    "@tailwindcss/vite": "^4.1.0",
    "tailwindcss": "^4.1.0",
    "daisyui": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create svelte.config.js**

```js
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  }
};

export default config;
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 5: Create src/app.html**

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚦</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Traffic Commander</title>
    %sveltekit.head%
  </head>
  <body class="min-h-screen bg-slate-900">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.output/
.svelte-kit/
build/
.DS_Store
vite.config.js.timestamp-*
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: All packages installed, no errors.

---

### Task 2: Configure Tailwind CSS v4 + DaisyUI 5

**Files:**
- Create: `src/app.css`

- [ ] **Step 1: Create src/app.css**

```css
@import "tailwindcss";
@plugin "daisyui";
```

- [ ] **Step 2: Verify Tailwind works**

Run: `npm run build`
Expected: Build succeeds, no CSS errors.

---

### Task 3: Create levels.js (game constants)

**Files:**
- Create: `src/lib/game/levels.js`

- [ ] **Step 1: Write src/lib/game/levels.js**

```js
export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 800;
export const CENTER_X = LOGICAL_WIDTH / 2;
export const CENTER_Y = LOGICAL_HEIGHT / 2;
export const ROAD_WIDTH = 120;
export const LANE_OFFSET = 30;
export const STOP_DISTANCE = 80;

export const LEVELS = [
  { target: 0, spawn: 0, speedMult: 0 },
  { target: 15, spawn: 0.015, speedMult: 0.9 },
  { target: 35, spawn: 0.025, speedMult: 1.1 },
  { target: 65, spawn: 0.035, speedMult: 1.3 },
  { target: 105, spawn: 0.045, speedMult: 1.5 },
  { target: 155, spawn: 0.060, speedMult: 1.7 },
  { target: 215, spawn: 0.080, speedMult: 2.0 },
  { target: 285, spawn: 0.100, speedMult: 2.3 },
  { target: 375, spawn: 0.120, speedMult: 2.7 }
];

export const PHASES = [
  { ns: 'GREEN', ew: 'RED', duration: Infinity },
  { ns: 'YELLOW', ew: 'RED', duration: 60 },
  { ns: 'RED', ew: 'RED', duration: 30 },
  { ns: 'RED', ew: 'GREEN', duration: Infinity },
  { ns: 'RED', ew: 'YELLOW', duration: 60 },
  { ns: 'RED', ew: 'RED', duration: 30 }
];
```

- [ ] **Step 2: Verify import works**

Run: `npm run build`
Expected: Build succeeds.

---

### Task 4: Create audio.js (Web Audio API system)

**Files:**
- Create: `src/lib/game/audio.js`

- [ ] **Step 1: Write src/lib/game/audio.js**

```js
let audioCtx;
let engineOsc, engineGain, engineFilter;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 50;
    engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 150;
    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function updateEngineSound(numCars, avgSpeed, gameState) {
  if (!audioCtx || !engineGain) return;
  if (gameState !== 'PLAYING') {
    engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    return;
  }
  const targetVol = Math.min(0.2, numCars * 0.015);
  const targetFreq = 40 + (avgSpeed * 12);
  engineGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
  engineFilter.frequency.setTargetAtTime(100 + avgSpeed * 50, audioCtx.currentTime, 0.1);
}

function playTone(freq, type, duration, vol = 0.1) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playSwapSound() {
  playTone(400, 'sine', 0.1, 0.05);
  setTimeout(() => playTone(600, 'sine', 0.1, 0.05), 100);
}

export function playScoreSound() {
  playTone(880, 'sine', 0.05, 0.02);
}

export function playScreechSound(intensity) {
  if (!audioCtx) return;
  const dur = 0.4;
  const bufferSize = audioCtx.sampleRate * dur;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2500, audioCtx.currentTime);
  filter.Q.value = 2;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(Math.min(intensity * 0.02, 0.15), audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

export function playLevelUpSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [440, 554, 659, 880].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}

export function playCrashSound() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

---

### Task 5: Create engine.js (game logic + canvas rendering)

**Files:**
- Create: `src/lib/game/engine.js`

- [ ] **Step 1: Write src/lib/game/engine.js**

```js
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, CENTER_X, CENTER_Y, ROAD_WIDTH, LANE_OFFSET, STOP_DISTANCE, LEVELS, PHASES } from './levels.js';
import { playScreechSound, playScoreSound } from './audio.js';

export class Car {
  constructor(dir, speedMult) {
    this.dir = dir;
    this.length = 45;
    this.breadth = 22;
    this.maxSpeed = speedMult * (3.5 + Math.random() * 1.5);
    this.speed = this.maxSpeed;
    this.acceleration = 0.1 * (speedMult > 1 ? speedMult * 0.8 : 1);
    this.color = this.getRandomColor();
    this.passedStopLine = false;
    this.decidedToRunYellow = false;
    this.screechCooldown = 0;

    if (dir === 'E') {
      this.x = -this.length; this.y = CENTER_Y + LANE_OFFSET;
    } else if (dir === 'W') {
      this.x = LOGICAL_WIDTH + this.length; this.y = CENTER_Y - LANE_OFFSET;
    } else if (dir === 'S') {
      this.x = CENTER_X - LANE_OFFSET; this.y = -this.length;
    } else if (dir === 'N') {
      this.x = CENTER_X + LANE_OFFSET; this.y = LOGICAL_HEIGHT + this.length;
    }
    const drift = (Math.random() * 8 - 4);
    if (dir === 'E' || dir === 'W') this.y += drift;
    else this.x += drift;
  }

  getRandomColor() {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f8fafc', '#1e293b'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(leaderCar, currentPhase) {
    let targetSpeed = this.maxSpeed;
    let obstacleDist = Infinity;
    const forwardSign = (this.dir === 'E' || this.dir === 'S') ? 1 : -1;
    const axis = (this.dir === 'E' || this.dir === 'W') ? 'x' : 'y';
    const frontPos = this[axis] + forwardSign * (this.length / 2);
    const stopLinePos = (axis === 'x' ? CENTER_X : CENTER_Y) - forwardSign * STOP_DISTANCE;
    const distToStop = (stopLinePos - frontPos) * forwardSign;
    const safeDistance = 18;
    const slowdownDistance = 120 * (this.maxSpeed / 3.5);

    const lightState = (this.dir === 'N' || this.dir === 'S') ? PHASES[currentPhase].ns : PHASES[currentPhase].ew;

    if (!this.passedStopLine) {
      if (distToStop < 0) {
        this.passedStopLine = true;
      } else {
        let forceStop = false;
        if (lightState !== 'GREEN') {
          if (lightState === 'YELLOW') {
            const noReturnDist = 50 * (this.maxSpeed / 3.5);
            if (this.decidedToRunYellow || (distToStop < noReturnDist && this.speed > 2.0)) {
              this.decidedToRunYellow = true;
            } else {
              forceStop = true;
            }
          } else if (lightState === 'RED') {
            forceStop = true;
            this.decidedToRunYellow = false;
          }
        }
        if (forceStop) obstacleDist = Math.min(obstacleDist, distToStop);
      }
    }

    if (leaderCar) {
      const leaderRearPos = leaderCar[axis] - forwardSign * (leaderCar.length / 2);
      const distToLeader = (leaderRearPos - frontPos) * forwardSign;
      if (distToLeader > 0) obstacleDist = Math.min(obstacleDist, distToLeader);
      else if (distToLeader > -this.length) obstacleDist = 0;
    }

    if (obstacleDist <= safeDistance) {
      targetSpeed = 0;
    } else if (obstacleDist < slowdownDistance) {
      let speedRatio = (obstacleDist - safeDistance) / (slowdownDistance - safeDistance);
      targetSpeed = this.maxSpeed * (speedRatio * speedRatio);
    }

    const oldSpeed = this.speed;

    if (this.speed < targetSpeed) {
      this.speed = Math.min(this.speed + this.acceleration, targetSpeed);
    } else {
      let brakeForce = this.acceleration * 4;
      if (obstacleDist < safeDistance * 2) brakeForce = this.acceleration * 8;
      this.speed = Math.max(this.speed - brakeForce, targetSpeed);
    }

    if (obstacleDist !== Infinity) {
      const minGap = 4;
      if (obstacleDist - minGap < this.speed) {
        this.speed = Math.max(0, obstacleDist - minGap);
      }
    }

    if (this.speed < 0) this.speed = 0;

    if (this.screechCooldown > 0) this.screechCooldown--;
    if (oldSpeed - this.speed > this.acceleration * 6 && this.screechCooldown <= 0) {
      playScreechSound(oldSpeed - this.speed);
      this.screechCooldown = 30;
    }

    this[axis] += this.speed * forwardSign;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir === 'W') ctx.rotate(Math.PI);
    else if (this.dir === 'S') ctx.rotate(Math.PI / 2);
    else if (this.dir === 'N') ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-this.length / 2 + 2, -this.breadth / 2 + 5, this.length, this.breadth);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.breadth / 2, this.length, this.breadth, 4);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.roundRect(-this.length / 2 + this.length * 0.6, -this.breadth / 2 + 2, this.length * 0.25, this.breadth - 4, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-this.length / 2 + this.length * 0.1, -this.breadth / 2 + 2, this.length * 0.15, this.breadth - 4, 1); ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.length / 2 - 2, -this.breadth / 2 + 2, 2, 4);
    ctx.fillRect(this.length / 2 - 2, this.breadth / 2 - 6, 2, 4);

    ctx.fillStyle = (this.speed < this.maxSpeed * 0.8 && this.speed > 0) || this.speed === 0 ? '#ff0000' : '#7f1d1d';
    ctx.fillRect(-this.length / 2, -this.breadth / 2 + 2, 2, 4);
    ctx.fillRect(-this.length / 2, this.breadth / 2 - 6, 2, 4);

    ctx.restore();
  }
}

export function createGameEngine() {
  return {
    cars: { N: [], S: [], E: [], W: [] },
    currentPhase: 0,
    lightTimer: 0,
    crashPoint: null,
    currentLevel: 1,
    score: 0,
    gameState: 'START',

    getState() {
      return {
        score: this.score,
        currentLevel: this.currentLevel,
        gameState: this.gameState,
        crashPoint: this.crashPoint
      };
    },

    requestLightSwap() {
      if (this.gameState !== 'PLAYING') return;
      if (this.currentPhase === 0) {
        this.currentPhase = 1;
        this.lightTimer = 0;
        return true;
      } else if (this.currentPhase === 3) {
        this.currentPhase = 4;
        this.lightTimer = 0;
        return true;
      }
      return false;
    },

    initLevel(level) {
      this.cars = { N: [], S: [], E: [], W: [] };
      this.currentPhase = 0;
      this.lightTimer = 0;
      this.crashPoint = null;
      this.currentLevel = level;
      this.gameState = 'PLAYING';
    },

    restart() {
      this.score = 0;
      this.currentLevel = 1;
      this.initLevel(1);
    },

    getCarRect(car) {
      let w, h;
      if (car.dir === 'N' || car.dir === 'S') { w = car.breadth; h = car.length; }
      else { w = car.length; h = car.breadth; }
      return {
        left: car.x - w / 2 + 2, right: car.x + w / 2 - 2,
        top: car.y - h / 2 + 2, bottom: car.y + h / 2 - 2
      };
    },

    checkCollisions() {
      let nsCars = [...this.cars.N, ...this.cars.S];
      let ewCars = [...this.cars.E, ...this.cars.W];
      for (let c1 of nsCars) {
        let r1 = this.getCarRect(c1);
        for (let c2 of ewCars) {
          let r2 = this.getCarRect(c2);
          if (!(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top)) {
            return { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
          }
        }
      }
      return null;
    },

    updateLogic() {
      if (this.gameState !== 'PLAYING') return;

      const lvlData = LEVELS[this.currentLevel];

      if (PHASES[this.currentPhase].duration !== Infinity) {
        this.lightTimer++;
        if (this.lightTimer >= PHASES[this.currentPhase].duration) {
          this.lightTimer = 0;
          this.currentPhase = (this.currentPhase + 1) % PHASES.length;
        }
      }

      ['N', 'S', 'E', 'W'].forEach(dir => {
        if (Math.random() < lvlData.spawn / 4) {
          let canSpawn = true;
          if (this.cars[dir].length > 0) {
            const lastCar = this.cars[dir][this.cars[dir].length - 1];
            let distFromSpawn = 0;
            if (dir === 'E') distFromSpawn = lastCar.x - (-45);
            else if (dir === 'W') distFromSpawn = (LOGICAL_WIDTH + 45) - lastCar.x;
            else if (dir === 'S') distFromSpawn = lastCar.y - (-45);
            else if (dir === 'N') distFromSpawn = (LOGICAL_HEIGHT + 45) - lastCar.y;
            if (distFromSpawn < 120) canSpawn = false;
          }
          if (canSpawn) this.cars[dir].push(new Car(dir, lvlData.speedMult));
        }
      });

      ['N', 'S', 'E', 'W'].forEach(dir => {
        for (let i = 0; i < this.cars[dir].length; i++) {
          const leaderCar = i > 0 ? this.cars[dir][i - 1] : null;
          this.cars[dir][i].update(leaderCar, this.currentPhase);
        }

        if (this.cars[dir].length > 0) {
          const fc = this.cars[dir][0];
          const offScreen = (dir === 'E' && fc.x > LOGICAL_WIDTH + 100) ||
            (dir === 'W' && fc.x < -100) ||
            (dir === 'S' && fc.y > LOGICAL_HEIGHT + 100) ||
            (dir === 'N' && fc.y < -100);
          if (offScreen) {
            this.cars[dir].shift();
            this.score++;
            playScoreSound();
          }
        }
      });

      const crash = this.checkCollisions();
      if (crash) {
        this.crashPoint = crash;
        this.gameState = 'GAME_OVER';
        return;
      }

      if (this.score >= lvlData.target) {
        if (this.currentLevel >= 8) {
          this.gameState = 'VICTORY';
        } else {
          this.currentLevel++;
          this.gameState = 'LEVEL_UP';
        }
      }
    },

    drawScene(ctx, scaleX, scaleY, timestamp) {
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      ctx.fillStyle = '#334155';
      ctx.fillRect(CENTER_X - ROAD_WIDTH / 2, 0, ROAD_WIDTH, LOGICAL_HEIGHT);
      ctx.fillRect(0, CENTER_Y - ROAD_WIDTH / 2, LOGICAL_WIDTH, ROAD_WIDTH);
      ctx.fillRect(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - ROAD_WIDTH / 2, ROAD_WIDTH, ROAD_WIDTH);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      const ylOffset = 2;
      ctx.beginPath();
      ctx.moveTo(CENTER_X - ylOffset, 0); ctx.lineTo(CENTER_X - ylOffset, CENTER_Y - ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X + ylOffset, 0); ctx.lineTo(CENTER_X + ylOffset, CENTER_Y - ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X - ylOffset, CENTER_Y + ROAD_WIDTH / 2); ctx.lineTo(CENTER_X - ylOffset, LOGICAL_HEIGHT);
      ctx.moveTo(CENTER_X + ylOffset, CENTER_Y + ROAD_WIDTH / 2); ctx.lineTo(CENTER_X + ylOffset, LOGICAL_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, CENTER_Y - ylOffset); ctx.lineTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - ylOffset);
      ctx.moveTo(0, CENTER_Y + ylOffset); ctx.lineTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y + ylOffset);
      ctx.moveTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y - ylOffset); ctx.lineTo(LOGICAL_WIDTH, CENTER_Y - ylOffset);
      ctx.moveTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y + ylOffset); ctx.lineTo(LOGICAL_WIDTH, CENTER_Y + ylOffset);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(CENTER_X, CENTER_Y + STOP_DISTANCE); ctx.lineTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y + STOP_DISTANCE);
      ctx.moveTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - STOP_DISTANCE); ctx.lineTo(CENTER_X, CENTER_Y - STOP_DISTANCE);
      ctx.moveTo(CENTER_X - STOP_DISTANCE, CENTER_Y); ctx.lineTo(CENTER_X - STOP_DISTANCE, CENTER_Y + ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X + STOP_DISTANCE, CENTER_Y - ROAD_WIDTH / 2); ctx.lineTo(CENTER_X + STOP_DISTANCE, CENTER_Y);
      ctx.stroke();

      this.drawCrosswalk(ctx, CENTER_X, CENTER_Y - STOP_DISTANCE - 15, ROAD_WIDTH, 20, false);
      this.drawCrosswalk(ctx, CENTER_X, CENTER_Y + STOP_DISTANCE + 15, ROAD_WIDTH, 20, false);
      this.drawCrosswalk(ctx, CENTER_X - STOP_DISTANCE - 15, CENTER_Y, ROAD_WIDTH, 20, true);
      this.drawCrosswalk(ctx, CENTER_X + STOP_DISTANCE + 15, CENTER_Y, ROAD_WIDTH, 20, true);

      this.drawTrafficLight(ctx, CENTER_X - ROAD_WIDTH / 2 - 25, CENTER_Y - ROAD_WIDTH / 2 - 35, PHASES[this.currentPhase].ns);
      this.drawTrafficLight(ctx, CENTER_X + ROAD_WIDTH / 2 + 25, CENTER_Y + ROAD_WIDTH / 2 + 35, PHASES[this.currentPhase].ns);
      this.drawTrafficLight(ctx, CENTER_X - ROAD_WIDTH / 2 - 35, CENTER_Y + ROAD_WIDTH / 2 + 25, PHASES[this.currentPhase].ew);
      this.drawTrafficLight(ctx, CENTER_X + ROAD_WIDTH / 2 + 35, CENTER_Y - ROAD_WIDTH / 2 - 25, PHASES[this.currentPhase].ew);

      ['N', 'S', 'E', 'W'].forEach(dir => {
        for (let car of this.cars[dir]) car.draw(ctx);
      });

      if (this.crashPoint) {
        ctx.save();
        ctx.translate(this.crashPoint.x, this.crashPoint.y);
        const pulse = Math.sin(timestamp / 100) * 15;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 50 + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.beginPath(); ctx.arc(0, 0, 30 - pulse * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    },

    drawCrosswalk(ctx, x, y, width, length, isVertical) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const stripes = 8;
      const stripeWidth = width / (stripes * 2);
      ctx.save();
      ctx.translate(x, y);
      for (let i = 0; i < stripes; i++) {
        if (isVertical) ctx.fillRect(-width / 2 + (i * 2 + 0.5) * stripeWidth, -length / 2, stripeWidth, length);
        else ctx.fillRect(-length / 2, -width / 2 + (i * 2 + 0.5) * stripeWidth, length, stripeWidth);
      }
      ctx.restore();
    },

    drawTrafficLight(ctx, x, y, state) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.ellipse(0, 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-3, -20, 6, 30);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-12, -75, 24, 60, 6);
      ctx.fill();
      const drawBulb = (cy, color, isActive) => {
        ctx.beginPath(); ctx.arc(0, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? color : '#334155'; ctx.fill();
        if (isActive) {
          ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath(); ctx.arc(-2, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
        }
      };
      drawBulb(-61, '#ef4444', state === 'RED');
      drawBulb(-45, '#eab308', state === 'YELLOW');
      drawBulb(-29, '#22c55e', state === 'GREEN');
      ctx.restore();
    }
  };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

---

### Task 6: Create +layout.svelte

**Files:**
- Create: `src/routes/+layout.svelte`
- Modified: `src/app.html` (already set up)

- [ ] **Step 1: Write src/routes/+layout.svelte**

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

{#if children}
  {@render children()}
{/if}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

---

### Task 7: Create +page.svelte (main game page)

**Files:**
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Write src/routes/+page.svelte**

```svelte
<script>
  import { onMount } from 'svelte';
  import { createGameEngine } from '$lib/game/engine.js';
  import { initAudio, updateEngineSound, playSwapSound, playCrashSound, playLevelUpSound } from '$lib/game/audio.js';
  import { LEVELS } from '$lib/game/levels.js';

  let canvasEl = $state();
  let containerEl = $state();
  let engine = $state(createGameEngine());
  let score = $state(0);
  let currentLevel = $state(1);
  let gameState = $state('START');
  let crashPoint = $state(null);
  let rafId;

  let scaleX = 1;
  let scaleY = 1;
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 800;

  function getTargetForLevel(level) {
    return LEVELS[level] ? LEVELS[level].target : 0;
  }

  function handleLightSwap() {
    initAudio();
    if (gameState !== 'PLAYING') return;
    const swapped = engine.requestLightSwap();
    if (swapped) playSwapSound();
  }

  function handleOverlayAction() {
    initAudio();
    if (gameState === 'START' || gameState === 'GAME_OVER' || gameState === 'VICTORY') {
      engine.restart();
    } else if (gameState === 'LEVEL_UP') {
      engine.initLevel(engine.currentLevel);
    }
    syncState();
  }

  function syncState() {
    const s = engine.getState();
    score = s.score;
    currentLevel = s.currentLevel;
    gameState = s.gameState;
    crashPoint = s.crashPoint;
  }

  function resizeCanvas() {
    if (!containerEl || !canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = containerEl.getBoundingClientRect();
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    const ctx = canvasEl.getContext('2d');
    ctx.scale(dpr, dpr);
    scaleX = rect.width / LOGICAL_WIDTH;
    scaleY = rect.height / LOGICAL_HEIGHT;
  }

  onMount(() => {
    resizeCanvas();
    const ctx = canvasEl.getContext('2d');

    function loop(timestamp) {
      engine.updateLogic();
      syncState();

      let numCars = 0;
      let totalSpeed = 0;
      if (engine.gameState === 'PLAYING' || engine.gameState === 'LEVEL_UP') {
        ['N', 'S', 'E', 'W'].forEach(dir => {
          numCars += engine.cars[dir].length;
          engine.cars[dir].forEach(c => totalSpeed += c.speed);
        });
      }
      updateEngineSound(numCars, numCars > 0 ? totalSpeed / numCars : 0, engine.gameState);

      engine.drawScene(ctx, scaleX, scaleY, timestamp);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    if (gameState === 'GAME_OVER') {
      playCrashSound();
    }

    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="min-h-screen bg-slate-900 flex flex-col items-center py-4 sm:py-6 px-2 sm:px-4">
  <div class="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col">

    <!-- HUD -->
    <div class="bg-slate-800 text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-blue-500 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.3 8.7 5.4 0"/><path d="m8.5 13.2 7 0"/><path d="M12 2 6.5 22h11L12 2z"/></svg>
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-100">TRAFFIC COMMANDER</h1>
          <p class="text-slate-400 text-sm font-medium">Prevent crashes. Manage the flow.</p>
        </div>
      </div>

      <div class="flex gap-4 sm:gap-8 bg-slate-900 px-6 py-3 rounded-xl border border-slate-700">
        <div class="text-center">
          <p class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Level</p>
          <p class="text-3xl font-black text-amber-400 leading-none">{currentLevel}<span class="text-lg text-slate-500">/8</span></p>
        </div>
        <div class="w-px bg-slate-700"></div>
        <div class="text-center">
          <p class="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Score</p>
          <p class="text-3xl font-black text-emerald-400 leading-none">{score}<span class="text-lg text-slate-500">/{getTargetForLevel(currentLevel)}</span></p>
        </div>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="p-4 bg-slate-200 relative">
      <div bind:this={containerEl} class="w-full max-w-[800px] mx-auto aspect-square bg-green-500 overflow-hidden relative rounded-xl shadow-inner">
        <canvas bind:this={canvasEl} class="block w-full h-full"></canvas>

        <!-- Game Overlay -->
        {#if gameState === 'START' || gameState === 'GAME_OVER' || gameState === 'LEVEL_UP' || gameState === 'VICTORY'}
          <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity duration-300 rounded-xl">
            <div class="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4">
              {#if gameState === 'START'}
                <h2 class="text-4xl font-black mb-2 text-slate-800">TRAFFIC COMMANDER</h2>
                <p class="text-slate-600 mb-6 font-medium">Click start to manage the intersection!</p>
                <div class="text-left bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                  <p class="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 block shrink-0"></span> 1 Point per car.</p>
                  <p class="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500 block shrink-0"></span> Crash = Game Over.</p>
                  <p class="text-sm font-semibold text-slate-700 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500 block shrink-0"></span> Use Spacebar to swap lights.</p>
                </div>
                <button onclick={() => handleOverlayAction()} class="btn btn-primary btn-block text-lg">START GAME</button>

              {:else if gameState === 'GAME_OVER'}
                <h2 class="text-5xl font-black mb-2 text-red-600">CRASH!</h2>
                <p class="text-slate-600 mb-8 font-medium">You scored {score} points and reached Level {currentLevel}.</p>
                <button onclick={() => handleOverlayAction()} class="btn btn-error btn-block text-lg">TRY AGAIN</button>

              {:else if gameState === 'LEVEL_UP'}
                <h2 class="text-5xl font-black mb-2 text-blue-600">LEVEL {currentLevel}</h2>
                <p class="text-slate-600 mb-8 font-medium">Speed and traffic volume increased. Get ready!</p>
                <button onclick={() => handleOverlayAction()} class="btn btn-primary btn-block text-lg">CONTINUE</button>

              {:else if gameState === 'VICTORY'}
                <h2 class="text-5xl font-black mb-2 text-emerald-500">CITY SAVED!</h2>
                <p class="text-slate-600 mb-8 font-medium">You are a master Traffic Commander!</p>
                <button onclick={() => handleOverlayAction()} class="btn btn-success btn-block text-lg">PLAY AGAIN</button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-white p-6 border-t border-slate-200 flex justify-center">
      <button onclick={() => handleLightSwap()} disabled={gameState !== 'PLAYING'} class="btn btn-neutral btn-wide text-lg flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
        SWAP LIGHTS (SPACE)
      </button>
    </div>
  </div>
</div>

<svelte:window onkeydown={(e) => { if (e.code === 'Space') { e.preventDefault(); handleLightSwap(); } }} />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

---

### Task 8: Full build verification

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: Build succeeds, output in `.svelte-kit/` and `build/`.

- [ ] **Step 2: Preview server**

Run: `npm run preview`
Expected: Server starts on http://localhost:4173. Verify the game loads, renders, and interactions work.

- [ ] **Step 3: Dev mode quick-check**

Run: `npm run dev`
Expected: Dev server starts on http://localhost:5173. Open in browser, verify game renders and responds to interactions.
