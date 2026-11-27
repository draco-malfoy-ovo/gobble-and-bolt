// sim.js — the whole game as a pure fixed-step simulation.
//
// Nothing here touches the DOM or the clock: give stepSimulation an input
// ({left, right, up, down, sprint, jump, crouch}) and it advances the world
// by exactly STEP_SECONDS. The browser loop feeds it real keys; the headless
// check feeds it an autopilot and asserts a turkey can actually escape.
// Events (for sounds, shake and score popups) are returned per step and
// never stored on the state, so two runs from the same seed stay identical.

import { FARMER, METERS_PER_PIXEL, SCORE, STEP_SECONDS } from './config.js';
import { createFarmer, farmerCaughtTurkey, resetFarmerAfterCatch, updateFarmer } from './farmer.js';
import { checkCorn, checkOvens, createHazards, updateHazards } from './hazards.js';
import { createRng, WORLD_SEED } from './rng.js';
import { createTurkey, resetTurkeyAfterCatch, turkeyVisibility, updateTurkey } from './turkey.js';
import { buildWorld, lineOfSightClear, occluderSheltering, stageAt } from './world.js';

export function createGame(seed = WORLD_SEED) {
  return {
    seed,
    phase: 'title', // 'title' | 'playing' | 'caught' | 'escaped'
    time: 0,
    score: 0,
    cornEaten: 0,
    closeCalls: 0,
    wasChased: false,
    stage: 0,
    world: buildWorld(seed),
    turkey: createTurkey(),
    farmer: createFarmer(),
    hazards: createHazards(),
    rng: createRng(seed ^ 0x9e3779b9),
  };
}

// Restart keeps the same seed, so the route — and the rematch — is fair.
export function startRun(game) {
  const fresh = createGame(game.seed);
  game.phase = 'playing';
  game.time = 0;
  game.score = 0;
  game.cornEaten = 0;
  game.closeCalls = 0;
  game.wasChased = false;
  game.stage = 0;
  game.world = fresh.world;
  game.turkey = fresh.turkey;
  game.farmer = fresh.farmer;
  game.hazards = fresh.hazards;
  game.rng = fresh.rng;
}

export function distanceMeters(game) {
  return Math.max(0, Math.floor(game.turkey.x * METERS_PER_PIXEL));
}

export function escapeProgress(game) {
  return Math.max(0, Math.min(1, game.turkey.x / game.world.gateX));
}

function farmerCanSee(game) {
  const { farmer, turkey, world } = game;
  if (farmer.state === 'waiting') return false;
  const dist = Math.hypot(farmer.x - turkey.x, farmer.y - turkey.y);
  const sheltered = occluderSheltering(world, turkey.x, turkey.y) !== null;
  const range = FARMER.sightRange * turkeyVisibility(turkey, sheltered);
  if (dist > range) return false;
  if (sheltered && dist > 120) return false;
  return lineOfSightClear(world, farmer.x, farmer.y, turkey.x, turkey.y);
}

function loseLife(game, events, source, burstPixels) {
  const { turkey, farmer } = game;
  turkey.lives -= 1;
  events.push({ type: 'life-lost', source, livesLeft: turkey.lives });
  if (turkey.lives <= 0) {
    game.phase = 'caught';
    events.push({ type: 'caught', source });
    return;
  }
  // Hurt but free: the turkey bursts ahead in a panic of feathers.
  turkey.x += burstPixels;
  resetTurkeyAfterCatch(turkey);
  resetFarmerAfterCatch(farmer, turkey);
  events.push({ type: 'burst-free' });
}

export function stepSimulation(game, input) {
  const events = [];
  if (game.phase !== 'playing') return events;
  const dt = STEP_SECONDS;
  game.time += dt;
  const { turkey, farmer, world } = game;

  const stage = stageAt(turkey.x);
  if (stage !== game.stage) {
    game.stage = stage;
    events.push({ type: 'stage', stage });
  }

  updateTurkey(turkey, input, dt, world);
  const canSee = farmerCanSee(game);
  if (canSee && farmer.state !== 'chasing' && farmer.state !== 'waiting') {
    events.push({ type: 'spotted' });
  }
  updateFarmer(farmer, turkey, canSee, dt);

  // A close call: he was right on your tail feathers and you broke away.
  const farmerClose = Math.hypot(farmer.x - turkey.x, farmer.y - turkey.y) < 120;
  if (farmer.state === 'chasing') game.wasChased = true;
  if (game.wasChased && !farmerClose && farmer.state !== 'chasing') {
    game.wasChased = false;
    game.closeCalls += 1;
    game.score += SCORE.closeCallPoints;
    events.push({ type: 'close-call', points: SCORE.closeCallPoints });
  }

  updateHazards(game.hazards, turkey, game.rng, dt, events);
  checkCorn(world, turkey, events);
  for (const event of events) {
    if (event.type === 'corn') {
      game.score += event.points;
      game.cornEaten += 1;
    }
  }

  // One misfortune a step is plenty: knife, then oven, then the farmer.
  const knifeHit = events.find((e) => e.type === 'hit');
  if (knifeHit) {
    loseLife(game, events, knifeHit.source, 130);
  } else {
    const ovenHits = [];
    checkOvens(world, turkey, ovenHits);
    if (ovenHits.length > 0) {
      loseLife(game, events, 'oven', 130);
    } else if (farmerCaughtTurkey(farmer, turkey)) {
      loseLife(game, events, 'farmer', 90);
    }
  }

  if (game.phase === 'playing') {
    game.score = Math.max(game.score, distanceMeters(game));
    if (turkey.x >= world.gateX) {
      game.phase = 'escaped';
      game.score += SCORE.escapeBonus + turkey.lives * SCORE.lifeBonus;
      events.push({ type: 'escaped', score: game.score });
    }
  }

  return events;
}
