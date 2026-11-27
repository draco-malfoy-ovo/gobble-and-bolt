// screens.js — the HUD and the screens around the run: title, caught, escaped.
//
// Everything a screenshot needs to prove a complete game lives here or in
// render.js: a title screen with the premise and controls, a HUD with
// score, distance, lives, stamina and an escape-progress bar, and an end
// screen — caught or escaped — with the final score and a restart prompt.

import { STAGE_NAMES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { PALETTE, drawTurkey } from './render.js';
import { distanceMeters, escapeProgress } from './sim.js';

function panel(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
}

export function drawHud(ctx, game) {
  const { turkey } = game;
  panel(ctx, 14, 12, 300, 64, 'rgba(38,24,14,0.72)');
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'left';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillText(`Score ${game.score}`, 28, 40);
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Distance ${distanceMeters(game)} m · ${STAGE_NAMES[game.stage]}`, 28, 64);

  // Lives as little turkey hearts: full, or a bare drumstick when spent.
  ctx.textAlign = 'right';
  ctx.font = '20px Georgia, serif';
  let lives = '';
  for (let i = 0; i < 3; i++) lives += i < turkey.lives ? '♥ ' : '♡ ';
  ctx.fillStyle = '#ff8f7d';
  ctx.fillText(lives.trim(), VIEW_WIDTH - 26, 38);

  // Stamina bar under the lives.
  ctx.fillStyle = 'rgba(38,24,14,0.72)';
  ctx.fillRect(VIEW_WIDTH - 176, 48, 150, 10);
  ctx.fillStyle = turkey.stamina > 25 ? '#8fce4e' : '#e2543e';
  ctx.fillRect(VIEW_WIDTH - 174, 50, 146 * (turkey.stamina / 100), 6);

  // Escape progress: a road from the kitchen door to the woods.
  const w = 420;
  const x = (VIEW_WIDTH - w) / 2;
  ctx.fillStyle = 'rgba(38,24,14,0.72)';
  ctx.fillRect(x, VIEW_HEIGHT - 30, w, 12);
  ctx.fillStyle = '#f6c945';
  ctx.fillRect(x + 2, VIEW_HEIGHT - 28, (w - 4) * escapeProgress(game), 8);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'left';
  ctx.fillText('🏠', x - 24, VIEW_HEIGHT - 17);
  ctx.textAlign = 'right';
  ctx.fillText('🌲', x + w + 24, VIEW_HEIGHT - 17);

  if (game.farmer.state === 'chasing') {
    ctx.textAlign = 'center';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillStyle = '#ff6d4d';
    ctx.fillText('HE SEES YOU — RUN!', VIEW_WIDTH / 2, 40);
  }
}

export function drawTitleScreen(ctx, game, now) {
  ctx.fillStyle = 'rgba(46,26,10,0.45)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 180, 84, 600, 330, 'rgba(255,246,230,0.96)');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a63d2a';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('GOBBLE & BOLT', VIEW_WIDTH / 2, 158);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 19px Georgia, serif';
  ctx.fillText('The Great Thanksgiving Escape', VIEW_WIDTH / 2, 190);
  ctx.font = '16.5px Georgia, serif';
  ctx.fillText('You are the turkey. Dinner is at six, and you are not on the guest list —', VIEW_WIDTH / 2, 232);
  ctx.fillText('you are the menu. Outrun Farmer Bram from his kitchen, across the', VIEW_WIDTH / 2, 256);
  ctx.fillText('farmyard, to the Freedom Woods. Dodge the ovens and the flying', VIEW_WIDTH / 2, 280);
  ctx.fillText('carving knives, hide behind hay and pines, and do not get caught.', VIEW_WIDTH / 2, 304);
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('Move  WASD / Arrows      Sprint  Shift      Jump  Space      Crouch  C', VIEW_WIDTH / 2, 344);
  ctx.fillStyle = '#a63d2a';
  ctx.font = 'bold 21px Georgia, serif';
  const pulse = 0.72 + 0.28 * Math.sin(now * 4);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press Enter or click to run for it', VIEW_WIDTH / 2, 386);
  ctx.globalAlpha = 1;
  // The hero, posed by the panel.
  drawTurkey(ctx, { ...game.turkey, x: 0, y: 0, z: 0 }, 268, now);
}

export function drawEndScreen(ctx, game, now) {
  const escaped = game.phase === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(24,46,18,0.5)' : 'rgba(52,14,8,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 205, 118, 550, 290, 'rgba(255,246,230,0.96)');
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#2e6b24' : '#a63d2a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(escaped ? 'YOU ESCAPED!' : 'CAUGHT!', VIEW_WIDTH / 2, 182);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 17.5px Georgia, serif';
  if (escaped) {
    ctx.fillText('Free as a bird — a bird who will never see the inside of an oven.', VIEW_WIDTH / 2, 218);
    ctx.fillText('Somewhere behind you, a farmer is ordering a pizza.', VIEW_WIDTH / 2, 242);
  } else {
    ctx.fillText('Farmer Bram got his Thanksgiving after all.', VIEW_WIDTH / 2, 218);
    ctx.fillText('The gravy was lovely. You were the gravy.', VIEW_WIDTH / 2, 242);
  }
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`Final score  ${game.score}`, VIEW_WIDTH / 2, 292);
  ctx.font = '16px Georgia, serif';
  ctx.fillText(
    `Distance ${distanceMeters(game)} m · Corn ${game.cornEaten} · Close calls ${game.closeCalls}`,
    VIEW_WIDTH / 2,
    322,
  );
  ctx.fillStyle = '#a63d2a';
  ctx.font = 'bold 19px Georgia, serif';
  const pulse = 0.72 + 0.28 * Math.sin(now * 4);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press Enter or click to run again', VIEW_WIDTH / 2, 372);
  ctx.globalAlpha = 1;
}
