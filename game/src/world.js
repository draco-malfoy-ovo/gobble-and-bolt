// world.js — builds the escape route from the fixed seed.
//
// Three stages laid end to end along +x:
//   0 The Kitchen      — ovens with a heat halo, low counters to jump
//   1 The Farmyard     — fences to jump, hay bales to hide behind
//   2 Freedom Woods    — logs to jump, pine trees to hide behind
// Past the last stage stands the freedom gate; reach it to escape.
//
// Occluders (hay bales, trees, kitchen islands) block the farmer's line of
// sight: crouch behind one and he loses you. Jumpables are low obstacles the
// turkey hops with Space; running into one on the ground just stops you.

import { FIELD_BOTTOM, FIELD_TOP, GATE_X, STAGE_LENGTH } from './config.js';
import { createRng, randomRange } from './rng.js';

export function stageAt(x) {
  const stage = Math.floor(x / STAGE_LENGTH);
  return Math.max(0, Math.min(2, stage));
}

function laneY(rng) {
  return randomRange(rng, FIELD_TOP + 46, FIELD_BOTTOM - 30);
}

export function buildWorld(seed) {
  const rng = createRng(seed);
  const world = {
    ovens: [], // {x, y} — stand in the heat halo and you get singed
    jumpables: [], // {x, y, w, kind: 'counter' | 'fence' | 'log'}
    occluders: [], // {x, y, w, h, kind: 'island' | 'hay' | 'pine'}
    corns: [], // {x, y, taken}
    gateX: GATE_X,
  };

  // Stage 0 — the kitchen: ovens against the back wall and the mid lane,
  // island counters to break line of sight, low counters to hop.
  for (let i = 0; i < 5; i++) {
    const x = 330 + i * 405 + randomRange(rng, -30, 30);
    world.ovens.push({ x, y: i % 2 === 0 ? FIELD_TOP + 42 : laneY(rng) });
  }
  for (let i = 0; i < 3; i++) {
    world.occluders.push({
      x: 560 + i * 640 + randomRange(rng, -25, 25),
      y: laneY(rng),
      w: 96,
      h: 54,
      kind: 'island',
    });
  }
  for (let i = 0; i < 4; i++) {
    world.jumpables.push({
      x: 430 + i * 500 + randomRange(rng, -20, 20),
      y: laneY(rng),
      w: 64,
      kind: 'counter',
    });
  }

  // Stage 1 — the farmyard: fences across the lanes, hay bales to hide in.
  const yard = STAGE_LENGTH;
  for (let i = 0; i < 5; i++) {
    world.jumpables.push({
      x: yard + 280 + i * 400 + randomRange(rng, -25, 25),
      y: laneY(rng),
      w: 72,
      kind: 'fence',
    });
  }
  for (let i = 0; i < 5; i++) {
    world.occluders.push({
      x: yard + 220 + i * 415 + randomRange(rng, -30, 30),
      y: laneY(rng),
      w: 84,
      h: 62,
      kind: 'hay',
    });
  }

  // Stage 2 — the woods: fallen logs and thick pines, denser than the yard.
  const woods = STAGE_LENGTH * 2;
  for (let i = 0; i < 6; i++) {
    world.jumpables.push({
      x: woods + 240 + i * 350 + randomRange(rng, -20, 20),
      y: laneY(rng),
      w: 78,
      kind: 'log',
    });
  }
  for (let i = 0; i < 6; i++) {
    world.occluders.push({
      x: woods + 190 + i * 360 + randomRange(rng, -30, 30),
      y: laneY(rng),
      w: 64,
      h: 118,
      kind: 'pine',
    });
  }

  // Corn scattered along the whole route — worth points and stamina.
  for (let x = 240; x < GATE_X - 120; x += randomRange(rng, 130, 230)) {
    world.corns.push({ x, y: laneY(rng), taken: false });
  }

  return world;
}

// True when the straight line from (ax, ay) to (bx, by) stays clear of every
// occluder; the farmer can only see the turkey when this holds.
export function lineOfSightClear(world, ax, ay, bx, by) {
  for (const o of world.occluders) {
    if (segmentCrossesBox(ax, ay, bx, by, o.x - o.w / 2, o.y - o.h, o.x + o.w / 2, o.y)) {
      return false;
    }
  }
  return true;
}

function segmentCrossesBox(ax, ay, bx, by, left, top, right, bottom) {
  // Cheap sampled test: the sight lines here are short and the boxes chunky.
  const steps = 14;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (x >= left && x <= right && y >= top && y <= bottom) return true;
  }
  return false;
}

// The occluder the turkey is tucked behind, if any: close behind its right
// face, roughly level with it. Hiding there (still, or crouched) breaks the
// farmer's gaze much faster than standing in the open.
export function occluderSheltering(world, x, y) {
  for (const o of world.occluders) {
    const dx = x - o.x;
    if (dx > o.w / 2 - 6 && dx < o.w / 2 + 42 && Math.abs(y - (o.y - o.h / 3)) < o.h * 0.72) {
      return o;
    }
  }
  return null;
}
