// turkey.js — the player: a turkey with somewhere better to be.
//
// Movement is eight-way inside the field band, with a sprint that drains
// stamina, a hop that clears low obstacles, and a crouch that makes the
// turkey small, slow and hard to spot. Position is (x, y) on the ground
// plane; z is the hop height above it.

import { FIELD_BOTTOM, FIELD_TOP, TURKEY } from './config.js';

export function createTurkey() {
  return {
    x: 90,
    y: 330,
    z: 0,
    vz: 0,
    facing: 1,
    moving: false,
    sprinting: false,
    crouching: false,
    airborne: false,
    stamina: TURKEY.staminaMax,
    lives: TURKEY.lives,
    invulnerable: 0, // seconds of post-catch grace left
    runPhase: 0, // leg animation clock
  };
}

export function resetTurkeyAfterCatch(turkey) {
  // A caught turkey wriggles free a little way ahead, feathers everywhere.
  turkey.z = 0;
  turkey.vz = 0;
  turkey.airborne = false;
  turkey.crouching = false;
  turkey.invulnerable = TURKEY.invulnerableSeconds;
}

export function updateTurkey(turkey, input, dt, world) {
  const wantX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const wantY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  turkey.crouching = Boolean(input.crouch) && !turkey.airborne;
  turkey.moving = wantX !== 0 || wantY !== 0;

  const wantsSprint = Boolean(input.sprint) && turkey.moving && !turkey.crouching;
  turkey.sprinting = wantsSprint && turkey.stamina > 1;
  if (turkey.sprinting) {
    turkey.stamina = Math.max(0, turkey.stamina - TURKEY.staminaDrain * dt);
  } else {
    turkey.stamina = Math.min(TURKEY.staminaMax, turkey.stamina + TURKEY.staminaRegen * dt);
  }

  const speedX = turkey.crouching ? 62 : turkey.sprinting ? TURKEY.sprintSpeed : TURKEY.walkSpeed;
  const speedY = turkey.crouching ? 52 : TURKEY.strafeSpeed;
  let nextX = turkey.x + wantX * speedX * dt;
  let nextY = turkey.y + wantY * speedY * dt;
  nextY = Math.max(FIELD_TOP + 20, Math.min(FIELD_BOTTOM, nextY));
  nextX = Math.max(36, nextX);

  // Low obstacles block a grounded turkey; a hopping one sails over.
  if (turkey.z < 22) {
    for (const j of world.jumpables) {
      if (Math.abs(nextX - j.x) < j.w / 2 + TURKEY.radius - 6 && Math.abs(nextY - j.y) < 26) {
        nextX = turkey.x;
        break;
      }
    }
  }

  if (wantX !== 0) turkey.facing = wantX;
  turkey.x = nextX;
  turkey.y = nextY;
  if (turkey.moving && !turkey.airborne) {
    turkey.runPhase += dt * (turkey.sprinting ? 15 : 10.5);
  }

  // The hop itself.
  if (input.jump && !turkey.airborne && !turkey.crouching) {
    turkey.vz = TURKEY.jumpVelocity;
    turkey.airborne = true;
  }
  if (turkey.airborne) {
    turkey.z += turkey.vz * dt;
    turkey.vz -= TURKEY.gravity * dt;
    if (turkey.z <= 0) {
      turkey.z = 0;
      turkey.vz = 0;
      turkey.airborne = false;
    }
  }

  if (turkey.invulnerable > 0) turkey.invulnerable -= dt;
}

// How visible the turkey is to the farmer right now, as a multiplier on his
// sight range: sprinting is loud, crouching is quiet, hiding is quieter.
export function turkeyVisibility(turkey, sheltered) {
  if (sheltered) return 0.45;
  if (turkey.crouching) return 0.55;
  if (turkey.sprinting) return 1.3;
  if (!turkey.moving) return 0.8;
  return 1;
}
