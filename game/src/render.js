// render.js — every pixel of Gobble & Bolt, drawn by hand on a canvas.
//
// No image assets at all: the turkey, Farmer Bram, the ovens, hay bales and
// pines are all canvas paths in one autumn palette, so the game ships as
// pure code and plays offline. Rendering only reads simulation state (plus
// a visual clock for idle bobbing); it never changes it.

import { FARMER, FIELD_BOTTOM, FIELD_TOP, GATE_X, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { stageAt } from './world.js';

export const PALETTE = {
  sky: '#f7d9a8',
  skyLow: '#f2a65a',
  wall: '#e8c39e',
  wallDark: '#c98d5f',
  floorKitchen: '#b5542d',
  floorYard: '#a06a35',
  floorWoods: '#5f7031',
  wood: '#7a4a21',
  woodDark: '#54300f',
  hay: '#e3b505',
  pine: '#2e5d33',
  pineDark: '#1e4023',
  turkeyBody: '#8a5a2b',
  turkeyDark: '#5f3c1a',
  turkeyCream: '#f3e2c7',
  farmerShirt: '#b3392e',
  farmerPants: '#33526e',
  skin: '#eebd8f',
  straw: '#e8c95a',
  knife: '#d7dde3',
  corn: '#f6c945',
  cream: '#fff6e6',
  ink: '#33241a',
};

export function cameraFor(turkey) {
  const maxCam = GATE_X + 420 - VIEW_WIDTH;
  return Math.max(0, Math.min(maxCam, turkey.x - 300));
}

function drawBackground(ctx, camX) {
  const stage = stageAt(camX + VIEW_WIDTH / 2);
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  if (stage === 0) {
    grad.addColorStop(0, '#d99a68');
    grad.addColorStop(1, '#b06a3b');
  } else {
    grad.addColorStop(0, PALETTE.sky);
    grad.addColorStop(0.7, PALETTE.skyLow);
    grad.addColorStop(1, '#e07b39');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  if (stage === 0) drawKitchenBackdrop(ctx, camX);
  else if (stage === 1) drawYardBackdrop(ctx, camX);
  else drawWoodsBackdrop(ctx, camX);

  // The ground band the actors run on.
  const floor = stage === 0 ? PALETTE.floorKitchen : stage === 1 ? PALETTE.floorYard : PALETTE.floorWoods;
  ctx.fillStyle = floor;
  ctx.fillRect(0, FIELD_TOP + 26, VIEW_WIDTH, VIEW_HEIGHT - FIELD_TOP - 26);
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.fillRect(0, FIELD_TOP + 26, VIEW_WIDTH, 5);
  if (stage === 0) drawTileLines(ctx, camX);
  else drawGroundTexture(ctx, camX, stage);
}

function drawGroundTexture(ctx, camX, stage) {
  // Sparse ground detail so the long fields do not read as one flat
  // wash: grass tufts and pebbles pinned to world positions by a hash,
  // scrolling with the world and identical in every frame.
  parallaxX(camX, 1, 90, (x) => {
    const idx = Math.round((x + camX) / 90);
    const h = ((idx * 2654435761) % 1000) / 1000;
    const y = FIELD_TOP + 66 + h * (VIEW_HEIGHT - FIELD_TOP - 120);
    if (h < 0.45) {
      ctx.strokeStyle = stage === 2 ? 'rgba(30,52,22,0.5)' : 'rgba(84,52,20,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y - 7 - h * 4);
      ctx.moveTo(x + 3, y);
      ctx.lineTo(x + 4, y - 6 - h * 3);
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + 9, y - 5);
      ctx.stroke();
    } else if (h > 0.8) {
      ctx.fillStyle = 'rgba(60,40,20,0.28)';
      ctx.beginPath();
      ctx.ellipse(x + 20, y, 5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function parallaxX(camX, factor, spacing, fn) {
  const off = -((camX * factor) % spacing);
  for (let x = off - spacing; x < VIEW_WIDTH + spacing; x += spacing) fn(x);
}

function drawKitchenBackdrop(ctx, camX) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_WIDTH, FIELD_TOP + 30);
  // A window with late-afternoon light.
  ctx.fillStyle = '#f9e3ae';
  ctx.fillRect(120 - (camX * 0.2) % 700, 26, 120, 96);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.strokeRect(120 - (camX * 0.2) % 700, 26, 120, 96);
  // Hanging pans and garlic along the wall.
  parallaxX(camX, 0.35, 210, (x) => {
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 40, 0);
    ctx.lineTo(x + 40, 26);
    ctx.stroke();
    ctx.fillStyle = '#6d6d72';
    ctx.beginPath();
    ctx.arc(x + 40, 44, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#efe6d0';
    ctx.beginPath();
    ctx.ellipse(x + 120, 40, 9, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 134, 44, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // A bunting of recipe cards above the pass.
  ctx.fillStyle = '#a63d2a';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— THANKSGIVING MENU —', VIEW_WIDTH / 2, 30);
  ctx.font = '13px Georgia, serif';
  ctx.fillText('roast turkey · stuffing · pie', VIEW_WIDTH / 2, 50);
}

function drawYardBackdrop(ctx, camX) {
  // Distant barn and silo.
  parallaxX(camX, 0.25, 760, (x) => {
    ctx.fillStyle = '#9c3a2a';
    ctx.fillRect(x + 60, 74, 150, 92);
    ctx.beginPath();
    ctx.moveTo(x + 48, 76);
    ctx.lineTo(x + 135, 34);
    ctx.lineTo(x + 222, 76);
    ctx.closePath();
    ctx.fillStyle = '#6e2718';
    ctx.fill();
    ctx.fillStyle = '#c8c2b4';
    ctx.fillRect(x + 250, 52, 34, 114);
  });
  // A low fence line.
  ctx.fillStyle = PALETTE.wood;
  parallaxX(camX, 0.55, 92, (x) => ctx.fillRect(x, 138, 8, 34));
  ctx.fillRect(0, 146, VIEW_WIDTH, 6);
}

function drawWoodsBackdrop(ctx, camX) {
  parallaxX(camX, 0.3, 150, (x) => drawPineShape(ctx, x, 168, 0.8, PALETTE.pineDark));
  parallaxX(camX, 0.55, 210, (x) => drawPineShape(ctx, x + 60, 178, 1.05, PALETTE.pine));
}

function drawPineShape(ctx, x, baseY, scale, color) {
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x - 5 * scale, baseY - 26 * scale, 10 * scale, 26 * scale);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const w = (64 - i * 13) * scale;
    const y = baseY - 22 * scale - i * 30 * scale;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x, y - 38 * scale);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTileLines(ctx, camX) {
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = 2;
  const spacing = 64;
  const off = -(camX % spacing);
  for (let x = off; x < VIEW_WIDTH; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, FIELD_TOP + 30);
    ctx.lineTo(x - 22, VIEW_HEIGHT);
    ctx.stroke();
  }
}

function shadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(40,20,5,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Bram's gaze (visual only) -----------------------------------------
// The chase AI is the game's whole selling point, so draw what Bram is
// paying attention to: a soft cone from his eyes, as long as his sight
// range, coloured by what he is doing — pale gold while he patrols, amber
// while he searches, red the moment he is on you. The hay bales, pines and
// counters are painted over the cone, which is exactly how they save you:
// stand behind one and the cone stops at the bale, not at you.
const CONE_TINTS = {
  patrol: 'rgba(246,201,69,',
  searching: 'rgba(255,158,44,',
  chasing: 'rgba(214,48,38,',
};

function gazeAngle(game) {
  const { farmer, turkey } = game;
  if (farmer.state === 'chasing') {
    return Math.atan2(turkey.y - farmer.y, turkey.x - farmer.x);
  }
  if (farmer.state === 'searching') {
    const dx = farmer.lastSeenX - farmer.x;
    const dy = farmer.lastSeenY - farmer.y;
    if (Math.hypot(dx, dy) > 26) return Math.atan2(dy, dx);
    // At the empty spot: sweep the lane the way his head turns in farmer.js.
    return Math.sin(farmer.lookPhase * 2.4) * 0.85;
  }
  // Patrol: he walks the route facing forward, sweeping his gaze up and
  // down the lanes on the same slow phase that swings his amble between
  // them — a gentle scan ahead, never a stare at the ground or the sky.
  return Math.sin(farmer.x * 0.004) * 0.45;
}

function drawVisionCone(ctx, game, camX) {
  const { farmer } = game;
  if (farmer.state === 'waiting' || farmer.x <= -60) return;
  const ox = farmer.x - camX;
  const oy = farmer.y - 56; // his eyes, above the straw hat's brim line
  const angle = gazeAngle(game);
  const half = 0.4;
  const r = FARMER.sightRange;
  const tint = CONE_TINTS[farmer.state] ?? CONE_TINTS.patrol;
  const grad = ctx.createRadialGradient(ox, oy, 12, ox, oy, r);
  grad.addColorStop(0, tint + '0.36)');
  grad.addColorStop(1, tint + '0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, r, angle - half, angle + half);
  ctx.closePath();
  ctx.fill();
}

// The turkey Bram remembers, drawn faint where he last saw her while he
// searches — the spot he is hurrying to, made visible.
const GHOST_TURKEY = {
  x: 0, y: 0, z: 0, vz: 0, facing: 1, moving: false, sprinting: false,
  crouching: false, airborne: false, stamina: 100, lives: 3,
  invulnerable: 0, runPhase: 0,
};

// ---- Feather burst (visual only) ---------------------------------------
// When a catch costs the turkey a life she bursts free in a puff of
// feathers. The simulation knows nothing of this: the renderer watches
// her post-hit grace flag flip on and sheds a dozen feathers, moved by a
// tiny visual clock and a hand-rolled LCG — never the game's own RNG, so
// a replayed run still lands byte for byte where it always did.
const featherFx = { parts: [], wasHurt: false, seed: 987654321, lastNow: 0 };

function fxRand() {
  featherFx.seed = (featherFx.seed * 1103515245 + 12345) & 0x7fffffff;
  return featherFx.seed / 0x7fffffff;
}

function drawFeathers(ctx, game, camX, now) {
  const { turkey } = game;
  const hurt = turkey.invulnerable > 0;
  if (hurt && !featherFx.wasHurt) {
    for (let i = 0; i < 12; i++) {
      featherFx.parts.push({
        x: turkey.x + (fxRand() - 0.5) * 26,
        y: turkey.y - turkey.z - 18 + (fxRand() - 0.5) * 16,
        vx: (fxRand() - 0.5) * 130,
        vy: -40 - fxRand() * 90,
        rot: fxRand() * Math.PI,
        vr: (fxRand() - 0.5) * 7,
        life: 0.85,
        size: 4.5 + fxRand() * 3.5,
        color: [PALETTE.turkeyBody, PALETTE.turkeyCream, PALETTE.turkeyDark][i % 3],
      });
    }
  }
  featherFx.wasHurt = hurt;
  const dt = Math.max(0, Math.min(0.05, now - featherFx.lastNow));
  featherFx.lastNow = now;
  for (let i = featherFx.parts.length - 1; i >= 0; i--) {
    const p = featherFx.parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      featherFx.parts.splice(i, 1);
      continue;
    }
    p.vy += 260 * dt;
    p.vx *= 1 - 1.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    ctx.save();
    ctx.globalAlpha = Math.min(0.95, p.life * 1.6);
    ctx.translate(p.x - camX, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawOven(ctx, oven, sx) {
  const x = sx;
  const y = oven.y;
  // Heat halo first, so the turkey reads the danger zone at a glance.
  const halo = ctx.createRadialGradient(x, y - 16, 6, x, y - 16, 52);
  halo.addColorStop(0, 'rgba(255,110,30,0.40)');
  halo.addColorStop(1, 'rgba(255,110,30,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y - 16, 52, 0, Math.PI * 2);
  ctx.fill();
  shadow(ctx, x, y, 34);
  ctx.fillStyle = '#3d3a3c';
  ctx.fillRect(x - 30, y - 58, 60, 58);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 30, y - 58, 60, 58);
  ctx.fillStyle = '#57535a';
  ctx.fillRect(x - 30, y - 58, 60, 9);
  ctx.fillStyle = '#ff7b24';
  ctx.fillRect(x - 21, y - 42, 42, 26);
  ctx.fillStyle = '#ffc23d';
  ctx.fillRect(x - 14, y - 36, 28, 14);
  ctx.fillStyle = '#221f22';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x - 16 + i * 16, y - 53, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOccluder(ctx, o, sx) {
  const x = sx;
  const top = o.y - o.h;
  if (o.kind === 'hay') {
    shadow(ctx, x, o.y, 46);
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.ellipse(x, o.y - 26, o.w / 2, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6403';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = '#b98a04';
    ctx.lineWidth = 3;
    for (const dx of [-22, 0, 22]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, o.y - 26, 7, 25, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (o.kind === 'pine') {
    shadow(ctx, x, o.y, 30);
    drawPineShape(ctx, x, o.y + 4, 1.25, PALETTE.pine);
  } else {
    // Kitchen island: a stout counter with pans hanging off its front.
    shadow(ctx, x, o.y, 52);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(x - o.w / 2, top + 14, o.w, o.h - 14);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - o.w / 2, top + 14, o.w, o.h - 14);
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(x - o.w / 2 - 5, top, o.w + 10, 15);
    ctx.strokeRect(x - o.w / 2 - 5, top, o.w + 10, 15);
    ctx.fillStyle = '#6d6d72';
    ctx.beginPath();
    ctx.arc(x - 22, top + 34, 9, 0, Math.PI * 2);
    ctx.arc(x + 16, top + 38, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJumpable(ctx, j, sx) {
  const x = sx;
  const y = j.y;
  shadow(ctx, x, y, j.w / 2);
  if (j.kind === 'fence') {
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(x - j.w / 2, y - 34, 8, 34);
    ctx.fillRect(x + j.w / 2 - 8, y - 34, 8, 34);
    ctx.fillRect(x - j.w / 2, y - 30, j.w, 7);
    ctx.fillRect(x - j.w / 2, y - 16, j.w, 7);
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x - j.w / 2, y - 30, j.w, 7);
    ctx.strokeRect(x - j.w / 2, y - 16, j.w, 7);
  } else if (j.kind === 'log') {
    ctx.fillStyle = '#6e4520';
    ctx.beginPath();
    ctx.ellipse(x, y - 12, j.w / 2, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#caa06a';
    ctx.beginPath();
    ctx.ellipse(x + j.w / 2 - 4, y - 12, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#8a8f96';
    ctx.fillRect(x - j.w / 2, y - 26, j.w, 26);
    ctx.strokeStyle = '#5f646b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - j.w / 2, y - 26, j.w, 26);
    ctx.fillStyle = '#a9aeb5';
    ctx.fillRect(x - j.w / 2 - 3, y - 30, j.w + 6, 6);
  }
}

function drawCorn(ctx, corn, sx, now) {
  const bob = Math.sin(now * 3 + corn.x * 0.05) * 2.5;
  const x = sx;
  const y = corn.y - 12 + bob;
  shadow(ctx, x, corn.y, 9);
  ctx.fillStyle = '#3f7a2e';
  ctx.beginPath();
  ctx.ellipse(x - 7, y + 6, 4, 10, -0.6, 0, Math.PI * 2);
  ctx.ellipse(x + 7, y + 6, 4, 10, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c78f06';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,100,10,0.55)';
  for (let r = -8; r <= 8; r += 5) ctx.fillRect(x - 6, y + r, 12, 1.4);
}

export function drawTurkey(ctx, turkey, sx, now) {
  const x = sx;
  const groundY = turkey.y;
  const y = groundY - turkey.z;
  const blink = turkey.invulnerable > 0 && Math.floor(now * 14) % 2 === 0;
  shadow(ctx, x, groundY, turkey.airborne ? 13 : 18);
  if (blink) ctx.globalAlpha = 0.35;

  const squash = turkey.crouching ? 0.72 : 1;
  const bob = turkey.moving && !turkey.airborne ? Math.sin(turkey.runPhase) * 2.2 : 0;
  const cy = y - 20 * squash + bob;

  ctx.save();
  ctx.translate(x, cy);
  ctx.scale(turkey.facing, 1);

  // Tail fan: five feathers fanned behind, the turkey's whole personality.
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.strokeStyle = 'rgba(51,36,26,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-14, -2);
    ctx.rotate(i * 0.34 - 0.12);
    ctx.beginPath();
    ctx.ellipse(-13, 0, 15, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#d98a2b';
  ctx.lineWidth = 3;
  const legSwing = turkey.moving && !turkey.airborne ? Math.sin(turkey.runPhase) * 7 : 0;
  ctx.beginPath();
  ctx.moveTo(-3, 12 * squash);
  ctx.lineTo(-3 + legSwing, 22);
  ctx.moveTo(5, 12 * squash);
  ctx.lineTo(5 - legSwing, 22);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 15 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyCream;
  ctx.beginPath();
  ctx.ellipse(4, 3, 12, 8.5 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 11, 6.4 * squash, turkey.airborne ? -0.7 : 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  ctx.strokeStyle = '#7d8894';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(14, -6 * squash);
  ctx.quadraticCurveTo(20, -14 * squash, 22, -18 * squash);
  ctx.stroke();
  ctx.fillStyle = '#93a3b1';
  ctx.beginPath();
  ctx.arc(23, -19 * squash, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Wattle and beak.
  ctx.fillStyle = '#c22f2f';
  ctx.beginPath();
  ctx.ellipse(26, -13 * squash, 3.2, 5.6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0a832';
  ctx.beginPath();
  ctx.moveTo(29, -21 * squash);
  ctx.lineTo(38, -18 * squash);
  ctx.lineTo(29, -15.5 * squash);
  ctx.closePath();
  ctx.fill();
  // Eye, wide with purpose.
  ctx.fillStyle = '#14100c';
  ctx.beginPath();
  ctx.arc(24.5, -20.5 * squash, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawFarmer(ctx, farmer, sx, now) {
  const x = sx;
  const y = farmer.y;
  shadow(ctx, x, y, 20);
  const bob = Math.abs(Math.sin(farmer.runPhase)) * 2.4;
  const cy = y - 34 - bob;
  ctx.save();
  ctx.translate(x, cy);
  // Legs in overalls.
  ctx.strokeStyle = PALETTE.farmerPants;
  ctx.lineWidth = 7;
  const swing = Math.sin(farmer.runPhase) * 8;
  ctx.beginPath();
  ctx.moveTo(-4, 16);
  ctx.lineTo(-4 + swing, 32);
  ctx.moveTo(5, 16);
  ctx.lineTo(5 - swing, 32);
  ctx.stroke();
  // Torso: plaid shirt and overall bib.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-13, -12, 26, 30);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(-13, -12, 26, 30);
  ctx.fillStyle = PALETTE.farmerPants;
  ctx.fillRect(-9, 2, 18, 16);
  // Arm swinging a carving fork.
  ctx.strokeStyle = PALETTE.skin;
  ctx.lineWidth = 6;
  const armSwing = Math.sin(farmer.runPhase + 1.2) * 9;
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(20, 4 + armSwing * 0.4);
  ctx.stroke();
  ctx.strokeStyle = '#8f979e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(20, 4 + armSwing * 0.4);
  ctx.lineTo(30, -2 + armSwing * 0.4);
  ctx.moveTo(30, -2 + armSwing * 0.4);
  ctx.lineTo(33, -7 + armSwing * 0.4);
  ctx.moveTo(30, -2 + armSwing * 0.4);
  ctx.lineTo(34, 1 + armSwing * 0.4);
  ctx.stroke();
  // Head and straw hat.
  ctx.fillStyle = PALETTE.skin;
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.straw;
  ctx.fillRect(-16, -29, 32, 5);
  ctx.beginPath();
  ctx.arc(0, -29, 8.5, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // His intentions, worn on his sleeve: one symbol per state, matching
  // the colour of his gaze cone, so a screenshot reads his mind at a
  // glance — red "!" he is on you, amber "?" he is hunting the spot he
  // last saw you, quiet dots he is only ambling his patrol.
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center';
  if (farmer.state === 'chasing') {
    ctx.fillStyle = '#c22f2f';
    ctx.fillText('!', x, y - 88 - bob);
  } else if (farmer.state === 'searching') {
    ctx.fillStyle = '#e07b00';
    ctx.fillText('?', x, y - 88 - bob + Math.sin(now * 4) * 2);
  } else if (farmer.state === 'patrol') {
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = 'rgba(51,36,26,0.7)';
    ctx.fillText('· · ·', x, y - 84 - bob);
  }
}

function drawKnife(ctx, knife, sx, now) {
  const x = sx;
  const y = knife.y - 24;
  if (!knife.flying) {
    // The warning glint: a haloed sparkle where the knife will come
    // from, big enough to read at a glance — it is the only warning
    // the player gets, so it has to shout.
    const pulse = 0.6 + 0.4 * Math.sin(now * 26);
    const r = 13 * pulse + 5;
    ctx.fillStyle = `rgba(255,214,120,${0.2 * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,240,190,${pulse})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    const d = r * 0.66;
    const e = r * 0.34;
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x - e, y - e);
    ctx.moveTo(x + d, y - d);
    ctx.lineTo(x + e, y - e);
    ctx.moveTo(x - d, y + d);
    ctx.lineTo(x - e, y + e);
    ctx.moveTo(x + d, y + d);
    ctx.lineTo(x + e, y + e);
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(now * 16);
  ctx.fillStyle = PALETTE.knife;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(8, -4.5);
  ctx.lineTo(14, 0);
  ctx.lineTo(8, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-22, -2.6, 7, 5.2);
  ctx.restore();
}

function drawGate(ctx, camX) {
  const x = GATE_X - camX;
  if (x < -160 || x > VIEW_WIDTH + 160) return;
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x - 8, FIELD_TOP + 6, 13, FIELD_BOTTOM - FIELD_TOP + 26);
  ctx.fillRect(x + 96, FIELD_TOP + 6, 13, FIELD_BOTTOM - FIELD_TOP + 26);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(x - 22, FIELD_TOP - 22, 148, 30);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM WOODS', x + 52, FIELD_TOP - 2);
  // Sunlit meadow beyond.
  ctx.fillStyle = 'rgba(255,236,160,0.35)';
  ctx.fillRect(x + 110, FIELD_TOP + 30, 130, FIELD_BOTTOM - FIELD_TOP);
}

export function drawWorld(ctx, game, camX, now) {
  drawBackground(ctx, camX);
  drawGate(ctx, camX);
  // Bram's gaze goes on the ground, under the furniture and actors: the
  // bale or pine that blocks his view paints over the cone.
  drawVisionCone(ctx, game, camX);
  const { world, turkey, farmer } = game;

  for (const corn of world.corns) {
    if (corn.taken) continue;
    const sx = corn.x - camX;
    if (sx < -40 || sx > VIEW_WIDTH + 40) continue;
    drawCorn(ctx, corn, sx, now);
  }

  // Depth-sort the actors and furniture by ground line, then paint.
  const items = [];
  for (const oven of world.ovens) items.push({ y: oven.y, draw: () => drawOven(ctx, oven, oven.x - camX) });
  for (const o of world.occluders) items.push({ y: o.y, draw: () => drawOccluder(ctx, o, o.x - camX) });
  for (const j of world.jumpables) items.push({ y: j.y, draw: () => drawJumpable(ctx, j, j.x - camX) });
  items.push({ y: turkey.y, draw: () => drawTurkey(ctx, turkey, turkey.x - camX, now) });
  if (farmer.state === 'searching') {
    items.push({
      y: farmer.lastSeenY,
      draw: () => {
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawTurkey(ctx, { ...GHOST_TURKEY, y: farmer.lastSeenY }, farmer.lastSeenX - camX, now);
        ctx.restore();
      },
    });
  }
  if (farmer.x > -60) items.push({ y: farmer.y, draw: () => drawFarmer(ctx, farmer, farmer.x - camX, now) });
  items.sort((a, b) => a.y - b.y);
  for (const item of items) {
    // Cull anything far off screen (positions are checked loosely by kind).
    item.draw();
  }

  for (const knife of game.hazards.knives) {
    const sx = knife.x - camX;
    if (sx < -60 || sx > VIEW_WIDTH + 60) continue;
    drawKnife(ctx, knife, sx, now);
  }

  drawFeathers(ctx, game, camX, now);
}
