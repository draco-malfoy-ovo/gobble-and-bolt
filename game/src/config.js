// config.js — every tuning number for Gobble & Bolt in one place.
//
// The simulation advances in fixed steps of STEP_SECONDS so a run plays out
// identically on any machine; rendering only reads the state it produces.

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const STEP_SECONDS = 1 / 60;

// The playfield is a horizontal band: the turkey runs right along it and can
// strafe up and down inside it (up = further from the camera).
export const FIELD_TOP = 150;
export const FIELD_BOTTOM = 492;
export const GROUND_Y = 500;

// The escape route: three stages laid end to end, then the freedom gate.
export const STAGE_LENGTH = 2300;
export const STAGE_NAMES = ['The Kitchen', 'The Farmyard', 'Freedom Woods'];
export const GATE_X = STAGE_LENGTH * 3 + 260;
export const METERS_PER_PIXEL = 0.02; // HUD distance reads in metres

export const TURKEY = {
  radius: 17,
  walkSpeed: 168,
  sprintSpeed: 238,
  strafeSpeed: 150,
  staminaMax: 100,
  staminaDrain: 26, // per second while sprinting
  staminaRegen: 17, // per second while not sprinting
  jumpVelocity: 430,
  gravity: 1250,
  lives: 3,
  invulnerableSeconds: 2.2,
};

export const FARMER = {
  radius: 19,
  baseSpeed: 152,
  speedPerStage: 18, // he knows the later ground better than you do
  topSpeed: 224,
  sightRange: 330,
  sightRangeSprinting: 430, // a sprinting turkey is easy to spot
  loseSightSeconds: 1.6, // hidden this long and he drops to searching
  searchSeconds: 4.5,
  catchDistance: 34,
  startDelaySeconds: 1.1, // grace at the start of a run and after a catch
};

export const HAZARDS = {
  knifeSpeed: 300,
  knifeWarnSeconds: 0.55, // a glint and a whistle before the knife flies
  knifeEveryMin: 2.6,
  knifeEveryMax: 4.6,
  ovenHeatRadius: 44,
};

export const SCORE = {
  cornPoints: 50,
  closeCallPoints: 25,
  escapeBonus: 500,
  lifeBonus: 100,
};
