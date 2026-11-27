// farmer.js — Farmer Bram, who has a table to fill and a pie crust ready.
//
// He runs a small state machine:
//   waiting  — the grace beat at the start and after each catch
//   chasing  — he can see the turkey and runs straight at it
//   searching— he lost it: he hurries to the last place he saw it, looks
//              around, and gives up back to a patrol if it stays hidden
//   patrol   — ambles along the route until something gobbles
// He is a touch slower than a sprinting turkey but faster than a walking
// one, cuts across lanes without tiring, and speeds up a little in each
// later stage. Breaking his line of sight — hay, pines, a kitchen island,
// or plain distance — is how you shake him.

import { FARMER, FIELD_BOTTOM, FIELD_TOP } from './config.js';
import { stageAt } from './world.js';

export function createFarmer() {
  return {
    x: -70,
    y: 330,
    state: 'waiting',
    waitLeft: FARMER.startDelaySeconds,
    seesTurkey: false,
    lostFor: 0, // seconds since he last saw the turkey
    searchLeft: 0,
    lastSeenX: 0,
    lastSeenY: 330,
    lookPhase: 0,
    runPhase: 0,
  };
}

export function farmerSpeedAt(x) {
  const speed = FARMER.baseSpeed + stageAt(x) * FARMER.speedPerStage;
  return Math.min(FARMER.topSpeed, speed);
}

export function updateFarmer(farmer, turkey, canSee, dt) {
  farmer.seesTurkey = canSee;
  if (canSee) {
    farmer.lastSeenX = turkey.x;
    farmer.lastSeenY = turkey.y;
    farmer.lostFor = 0;
  } else {
    farmer.lostFor += dt;
  }

  switch (farmer.state) {
    case 'waiting':
      farmer.waitLeft -= dt;
      if (farmer.waitLeft <= 0) farmer.state = canSee ? 'chasing' : 'patrol';
      return;
    case 'chasing':
      if (!canSee && farmer.lostFor > FARMER.loseSightSeconds) {
        farmer.state = 'searching';
        farmer.searchLeft = FARMER.searchSeconds;
      }
      break;
    case 'searching':
      farmer.searchLeft -= dt;
      if (canSee) farmer.state = 'chasing';
      else if (farmer.searchLeft <= 0) farmer.state = 'patrol';
      break;
    case 'patrol':
      if (canSee) farmer.state = 'chasing';
      break;
  }

  let targetX = farmer.x;
  let targetY = farmer.y;
  let speed = farmerSpeedAt(farmer.x);
  if (farmer.state === 'chasing') {
    targetX = turkey.x;
    targetY = turkey.y;
  } else if (farmer.state === 'searching') {
    targetX = farmer.lastSeenX;
    targetY = farmer.lastSeenY;
    speed *= 0.92;
    farmer.lookPhase += dt;
    if (Math.hypot(targetX - farmer.x, targetY - farmer.y) < 26) {
      // He stands at the empty spot, turning his head, pitchfork drooping.
      targetX = farmer.x + Math.sin(farmer.lookPhase * 2.4) * 8;
      targetY = farmer.y;
      speed = 30;
    }
  } else {
    // Patrol: drift forward along the route, sweeping between lanes.
    targetX = turkey.x - 260;
    targetY = 320 + Math.sin(farmer.x * 0.004) * 110;
    speed *= 0.62;
  }

  const dx = targetX - farmer.x;
  const dy = targetY - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 2) {
    const step = Math.min(dist, speed * dt);
    farmer.x += (dx / dist) * step;
    farmer.y += (dy / dist) * step;
    farmer.runPhase += dt * 11;
  }
  farmer.y = Math.max(FIELD_TOP + 16, Math.min(FIELD_BOTTOM, farmer.y));
  farmer.x = Math.max(-90, farmer.x);
}

export function farmerCaughtTurkey(farmer, turkey) {
  if (farmer.state === 'waiting' || turkey.invulnerable > 0 || turkey.z > 30) return false;
  return Math.hypot(farmer.x - turkey.x, farmer.y - turkey.y) < FARMER.catchDistance;
}

export function resetFarmerAfterCatch(farmer, turkey) {
  farmer.x = turkey.x - 330;
  farmer.y = turkey.y;
  farmer.state = 'waiting';
  farmer.waitLeft = FARMER.startDelaySeconds;
  farmer.lostFor = 0;
}
