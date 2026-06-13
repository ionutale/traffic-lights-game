import { createEventBus } from './EventBus.js';
import { createGameEngine } from './engine.js';
import { AudioManager } from './AudioManager.js';
import { LEVELS } from './levels.js';

export function createGameController() {
  const bus = createEventBus();
  const engine = createGameEngine(bus);
  const audio = new AudioManager(bus);

  let rafId = null;
  let prevTimestamp = 0;
  let stateSubscribers = [];

  function getTargetForLevel(level) {
    return LEVELS[level] ? LEVELS[level].target : 0;
  }

  function syncState() {
    const s = engine.getState();
    stateSubscribers.forEach(fn => fn({
      score: s.score,
      currentLevel: s.currentLevel,
      gameState: s.gameState,
      target: getTargetForLevel(s.currentLevel)
    }));
  }

  function gameLoop(timestamp) {
    const dt = prevTimestamp ? timestamp - prevTimestamp : 16.67;
    prevTimestamp = timestamp;

    engine.updateLogic(dt);
    syncState();

    const metrics = engine.getAudioMetrics();
    audio.setIntensity(metrics.numCars, metrics.avgSpeed, engine.gameState);

    rafId = requestAnimationFrame(gameLoop);
  }

  return {

    getEngine() { return engine; },

    onState(fn) {
      stateSubscribers.push(fn);
      return () => { stateSubscribers = stateSubscribers.filter(f => f !== fn); };
    },

    requestLightSwap() {
      audio.init();
      return engine.requestLightSwap();
    },

    handleAction() {
      audio.init();
      const gs = engine.gameState;
      if (gs === 'START' || gs === 'GAME_OVER' || gs === 'VICTORY') {
        engine.restart();
      } else if (gs === 'LEVEL_UP') {
        engine.initLevel(engine.currentLevel);
      }
      syncState();
    },

    startLoop() {
      prevTimestamp = 0;
      rafId = requestAnimationFrame(gameLoop);
    },

    stopLoop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },

    dispose() {
      this.stopLoop();
      audio.dispose();
      bus.clear();
      stateSubscribers = [];
    }
  };
}
