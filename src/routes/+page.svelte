<script>
  import { onMount } from 'svelte';
  import { createGameEngine } from '$lib/game/engine.js';
  import { initAudio, updateEngineSound, playSwapSound, playCrashSound, playLevelUpSound } from '$lib/game/audio.js';
  import { LEVELS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '$lib/game/levels.js';

  let canvasEl = $state();
  let containerEl = $state();
  let engine = createGameEngine();
  let score = $state(0);
  let currentLevel = $state(1);
  let gameState = $state('START');
  let rafId;

  let scaleX = 1;
  let scaleY = 1;

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
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(containerEl);
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

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
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
