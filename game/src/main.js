// main.js — boots Gobble & Bolt in the browser: owns the canvas, the
// fixed-step loop, and the wiring from simulation events to sound, shake
// and floating score text. The simulation itself lives in sim.js and never
// knows any of this exists.

import {
  playCaughtSting,
  playCloseCall,
  playCorn,
  playEscapeJingle,
  playGobble,
  playKnifeWhistle,
  playSpotted,
  playThud,
  toggleMute,
  unlockAudio,
} from './audio.js';
import { STEP_SECONDS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createInput } from './input.js';
import { cameraFor, drawWorld } from './render.js';
import { drawEndScreen, drawHud, drawTitleScreen } from './screens.js';
import { createGame, startRun, stepSimulation } from './sim.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = createGame();
const input = createInput();

let accumulator = 0;
let lastTimestamp = 0;
let shake = 0;
const popups = []; // {x, y, text, left} — floating score notes, visual only

function handleEvents(events) {
  for (const event of events) {
    switch (event.type) {
      case 'spotted':
        playSpotted();
        break;
      case 'knife-thrown':
        playKnifeWhistle();
        break;
      case 'corn':
        playCorn();
        popups.push({ x: game.turkey.x, y: game.turkey.y - 54, text: `+${event.points}`, left: 0.9 });
        break;
      case 'close-call':
        playCloseCall();
        popups.push({ x: game.turkey.x, y: game.turkey.y - 54, text: 'Close call!', left: 1.1 });
        break;
      case 'life-lost':
        playThud();
        shake = 0.45;
        break;
      case 'burst-free':
        playGobble();
        break;
      case 'stage':
        popups.push({ x: game.turkey.x + 120, y: 210, text: ['', 'The Farmyard', 'Freedom Woods'][event.stage] ?? '', left: 1.6 });
        break;
      case 'caught':
        playCaughtSting();
        break;
      case 'escaped':
        playEscapeJingle();
        break;
    }
  }
}

function beginRun() {
  unlockAudio();
  startRun(game);
  playGobble();
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && game.phase !== 'playing') beginRun();
  if (event.code === 'KeyM') toggleMute();
});
canvas.addEventListener('pointerdown', () => {
  unlockAudio();
  if (game.phase !== 'playing') beginRun();
});

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!lastTimestamp) lastTimestamp = timestamp;
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (elapsed > 0.25) elapsed = 0.25; // a stalled tab must not fast-forward
  const now = timestamp / 1000;

  if (game.phase === 'playing') {
    accumulator += elapsed;
    while (accumulator >= STEP_SECONDS) {
      accumulator -= STEP_SECONDS;
      handleEvents(stepSimulation(game, input.read()));
    }
  }

  const camX = cameraFor(game.turkey);
  ctx.save();
  if (shake > 0) {
    shake -= elapsed;
    ctx.translate((Math.random() - 0.5) * 9 * shake, (Math.random() - 0.5) * 7 * shake);
  }
  drawWorld(ctx, game, camX, now);
  ctx.restore();

  if (game.phase === 'playing') {
    drawHud(ctx, game);
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Georgia, serif';
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.left -= elapsed;
      if (p.left <= 0) {
        popups.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, p.left);
      ctx.fillStyle = '#fff3cf';
      ctx.fillText(p.text, p.x - camX, p.y - (0.9 - p.left) * 26);
      ctx.globalAlpha = 1;
    }
  } else if (game.phase === 'title') {
    drawTitleScreen(ctx, game, now);
  } else {
    drawEndScreen(ctx, game, now);
  }
}
requestAnimationFrame(frame);

// Hooks for the maker's screenshot script (tools/capture.mjs): they pose
// real scenes of this same game — nothing here renders anything the game
// itself would not.
window.__gobble = { game, startRun, stepSimulation, VIEW_WIDTH, VIEW_HEIGHT };
