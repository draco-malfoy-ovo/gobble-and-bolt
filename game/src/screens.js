// screens.js — the HUD and the screens around the run: title, caught, escaped.
//
// Everything a screenshot needs to prove a complete game lives here or in
// render.js: a title screen with the premise and controls, a HUD with
// score, distance, lives, stamina and a three-stage escape-progress bar,
// first-run coaching hints that fire as each danger first appears, and an
// end screen — caught or escaped — with an escape grade, the run itemised
// in a table, and a restart prompt.

import { STAGE_LENGTH, STAGE_NAMES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
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
  ctx.fillText(`Distance ${distanceMeters(game)} m · Stage ${game.stage + 1} of 3 · ${STAGE_NAMES[game.stage]}`, 28, 64);

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

  // Escape progress: a road from the kitchen door to the woods, in three
  // labelled stages with the turkey's marker on it — where you are, what
  // ground is left, and what it is called, all in one glance.
  const w = 420;
  const x = (VIEW_WIDTH - w) / 2;
  const gateX = game.world.gateX;
  ctx.font = '10.5px Georgia, serif';
  ctx.fillStyle = 'rgba(255,246,230,0.85)';
  ctx.textAlign = 'center';
  const segNames = ['KITCHEN', 'FARMYARD', 'FREEDOM WOODS'];
  for (let i = 0; i < 3; i++) {
    const mid = x + ((STAGE_LENGTH * (i + 0.5)) / gateX) * w;
    ctx.fillText(segNames[i], mid, VIEW_HEIGHT - 36);
  }
  ctx.fillStyle = 'rgba(38,24,14,0.72)';
  ctx.fillRect(x, VIEW_HEIGHT - 30, w, 12);
  ctx.fillStyle = '#f6c945';
  ctx.fillRect(x + 2, VIEW_HEIGHT - 28, (w - 4) * escapeProgress(game), 8);
  ctx.fillStyle = 'rgba(255,246,230,0.9)';
  for (let i = 1; i < 3; i++) {
    const tickX = x + ((STAGE_LENGTH * i) / gateX) * w;
    ctx.fillRect(tickX - 1, VIEW_HEIGHT - 30, 2, 12);
  }
  // The turkey's marker: a pin dropped on the road itself, so it never
  // collides with the stage labels above the bar.
  const markerX = x + escapeProgress(game) * w;
  ctx.fillStyle = '#fff6e6';
  ctx.strokeStyle = 'rgba(51,36,26,0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(markerX, VIEW_HEIGHT - 18.5);
  ctx.lineTo(markerX - 5.5, VIEW_HEIGHT - 29.5);
  ctx.lineTo(markerX + 5.5, VIEW_HEIGHT - 29.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
    ctx.fillText('HE SEES YOU — RUN!', VIEW_WIDTH / 2, 102);
  }
}

// First-run coaching: one short hint the first time each danger shows
// up, read off the same state the player is looking at. The memory lives
// here in the screen layer — never in the simulation — and resets when a
// fresh run starts (a new run's clock runs behind the old one's).
const hintMemory = { seen: new Set(), activeUntil: -1, activeText: '', activeId: '', lastTime: -1 };
const HINTS = [
  {
    id: 'start',
    text: 'Run right — the Freedom Gate waits past the woods. Corn scores and heals!',
    when: (g) => g.time < 5,
  },
  {
    id: 'chase',
    text: "He's seen you! Break his gaze — duck behind hay, pines or counters!",
    when: (g) => g.farmer.state === 'chasing',
  },
  {
    id: 'knife',
    text: 'Knife incoming — Crouch (C) or switch lanes!',
    when: (g) => g.hazards.knives.some((k) => !k.flying && k.warned > 0),
  },
  {
    id: 'oven',
    text: 'Oven heat singes — steer wide of the glow!',
    when: (g) =>
      g.world.ovens.some(
        (o) => o.x - g.turkey.x > -20 && o.x - g.turkey.x < 300 && Math.abs(o.y - g.turkey.y) < 90,
      ),
  },
  {
    id: 'search',
    text: "He's searching where he last saw you — stay hidden till he gives up…",
    when: (g) => g.farmer.state === 'searching',
  },
];

function drawHintPill(ctx, text) {
  ctx.font = 'bold 15.5px Georgia, serif';
  const w = ctx.measureText(text).width + 38;
  const x = (VIEW_WIDTH - w) / 2;
  const y = VIEW_HEIGHT - 78;
  panel(ctx, x, y, w, 30, 'rgba(38,24,14,0.85)');
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_WIDTH / 2, y + 20.5);
}

export function drawHints(ctx, game, now) {
  if (game.phase !== 'playing') {
    hintMemory.seen.clear();
    hintMemory.activeUntil = -1;
    hintMemory.lastTime = -1;
    return;
  }
  if (game.time < hintMemory.lastTime) {
    hintMemory.seen.clear();
    hintMemory.activeUntil = -1;
  }
  hintMemory.lastTime = game.time;
  // The opening hint belongs to the opening seconds: once the run's
  // clock is past them it gives way to whatever danger is current.
  if (hintMemory.activeId === 'start' && game.time >= 5) hintMemory.activeUntil = -1;
  if (now < hintMemory.activeUntil) {
    drawHintPill(ctx, hintMemory.activeText);
    return;
  }
  for (const hint of HINTS) {
    if (hintMemory.seen.has(hint.id)) continue;
    if (hint.when(game)) {
      hintMemory.seen.add(hint.id);
      hintMemory.activeText = hint.text;
      hintMemory.activeId = hint.id;
      hintMemory.activeUntil = now + 3.4;
      drawHintPill(ctx, hint.text);
      return;
    }
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

// The escape grade: a letter for how the run went, from the run's own
// facts only — lives left and the clock. Printed with its reason, so it
// reads as a verdict, not a decoration.
function escapeGrade(game) {
  const lives = game.turkey.lives;
  const quick = game.time <= 120;
  if (lives >= 3 && quick) return { letter: 'S', note: 'Untouched, and quick about it' };
  if (lives >= 3) return { letter: 'A', note: 'Not a feather out of place' };
  if (lives === 2 && quick) return { letter: 'A', note: 'Ruffled, but home in time for nobody’s dinner' };
  if (lives === 2) return { letter: 'B', note: 'Ruffled, but free' };
  return { letter: 'C', note: 'Free by a feather’s width' };
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function drawEndScreen(ctx, game, now) {
  const escaped = game.phase === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(24,46,18,0.5)' : 'rgba(52,14,8,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 200, 92, 560, 348, 'rgba(255,246,230,0.96)');
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#2e6b24' : '#a63d2a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(escaped ? 'YOU ESCAPED!' : 'CAUGHT!', VIEW_WIDTH / 2, 152);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 16.5px Georgia, serif';
  if (escaped) {
    ctx.fillText('Free as a bird — a bird who will never see the inside of an oven.', VIEW_WIDTH / 2, 182);
    ctx.fillText('Somewhere behind you, a farmer is ordering a pizza.', VIEW_WIDTH / 2, 204);
  } else {
    ctx.fillText('Farmer Bram got his Thanksgiving after all.', VIEW_WIDTH / 2, 182);
    ctx.fillText('The gravy was lovely. You were the gravy.', VIEW_WIDTH / 2, 204);
  }

  // The verdict line: a grade for an escape, the distance still owed
  // for a capture.
  ctx.font = 'bold 21px Georgia, serif';
  if (escaped) {
    const grade = escapeGrade(game);
    ctx.fillStyle = '#b97d10';
    ctx.fillText(`★ ESCAPE GRADE ${grade.letter} ★`, VIEW_WIDTH / 2, 240);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText(grade.note, VIEW_WIDTH / 2, 262);
  } else {
    const pct = Math.round(escapeProgress(game) * 100);
    ctx.fillStyle = '#a63d2a';
    ctx.fillText(`You covered ${pct}% of the way to the gate`, VIEW_WIDTH / 2, 240);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText('The gate was closer than the oven. Run it again.', VIEW_WIDTH / 2, 262);
  }

  // The run, itemised: every number the simulation kept, in a table.
  ctx.strokeStyle = 'rgba(51,36,26,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(248, 278);
  ctx.lineTo(VIEW_WIDTH - 248, 278);
  ctx.stroke();
  const rows = [
    ['Distance', `${distanceMeters(game)} m`, 'Time', formatTime(game.time)],
    ['Corn eaten', `${game.cornEaten}`, 'Close calls', `${game.closeCalls}`],
    [
      'Lives left',
      escaped ? `${game.turkey.lives} of 3` : 'none',
      'Final score',
      `${game.score}`,
    ],
  ];
  ctx.font = '16px Georgia, serif';
  rows.forEach(([labelA, valueA, labelB, valueB], i) => {
    const y = 302 + i * 26;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(51,36,26,0.62)';
    ctx.fillText(labelA, 262, y);
    ctx.fillText(labelB, 502, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(valueA, 452, y);
    ctx.fillText(valueB, 692, y);
    ctx.font = '16px Georgia, serif';
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#a63d2a';
  ctx.font = 'bold 19px Georgia, serif';
  const pulse = 0.72 + 0.28 * Math.sin(now * 4);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press Enter or click to run again', VIEW_WIDTH / 2, 404);
  ctx.globalAlpha = 1;
}
