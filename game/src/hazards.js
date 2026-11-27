// hazards.js — the dinnerware fights back.
//
// Carving knives: a glint and a thin whistle warn you, then a knife spins in
// from the right at carving height. Crouch (hold C) or step out of its lane
// to dodge it; a hopping turkey is right in its path, so jumping is no
// answer here.
// Ovens: standing in the heat halo of a lit oven singes a life away.
// Corn: running over a cob scores points and tops up stamina.

import { HAZARDS, SCORE, TURKEY } from './config.js';
import { randomRange } from './rng.js';

export function createHazards() {
  return {
    knives: [], // {x, y, warned} — warned counts down, then it flies
    nextKnifeIn: 2.2,
  };
}

export function updateHazards(hazards, turkey, rng, dt, events) {
  // Spawn the next warning glint somewhere ahead of the turkey.
  hazards.nextKnifeIn -= dt;
  if (hazards.nextKnifeIn <= 0) {
    hazards.knives.push({
      x: turkey.x + 880,
      y: Math.max(178, Math.min(486, turkey.y + randomRange(rng, -130, 130))),
      warned: HAZARDS.knifeWarnSeconds,
      flying: false,
    });
    hazards.nextKnifeIn = randomRange(rng, HAZARDS.knifeEveryMin, HAZARDS.knifeEveryMax);
  }

  for (const knife of hazards.knives) {
    if (!knife.flying) {
      knife.warned -= dt;
      if (knife.warned <= 0) {
        knife.flying = true;
        events.push({ type: 'knife-thrown' });
      }
      continue;
    }
    knife.x -= HAZARDS.knifeSpeed * dt;
    // A knife at carving height misses a crouching turkey clean.
    const inLane = Math.abs(knife.y - turkey.y) < 24;
    const atHeight = !turkey.crouching || turkey.z > 6;
    if (inLane && atHeight && Math.abs(knife.x - turkey.x) < 26 && turkey.invulnerable <= 0) {
      events.push({ type: 'hit', source: 'knife' });
      knife.x = -9999; // spent
    }
  }
  hazards.knives = hazards.knives.filter((k) => k.x > turkey.x - 500);
}

export function checkOvens(world, turkey, events) {
  if (turkey.invulnerable > 0) return;
  for (const oven of world.ovens) {
    if (Math.hypot(oven.x - turkey.x, oven.y - turkey.y) < HAZARDS.ovenHeatRadius) {
      events.push({ type: 'hit', source: 'oven' });
      return;
    }
  }
}

export function checkCorn(world, turkey, events) {
  for (const corn of world.corns) {
    if (corn.taken) continue;
    if (Math.abs(corn.x - turkey.x) < 26 && Math.abs(corn.y - turkey.y) < 26) {
      corn.taken = true;
      turkey.stamina = Math.min(TURKEY.staminaMax, turkey.stamina + 22);
      events.push({ type: 'corn', points: SCORE.cornPoints });
    }
  }
}
