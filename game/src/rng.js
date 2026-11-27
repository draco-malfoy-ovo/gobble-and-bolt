// rng.js — a tiny seeded random number generator (mulberry32).
//
// The whole escape route is generated from one fixed seed, so every run of
// Gobble & Bolt lays out the same farm, the same ovens and the same corn.
// That is what makes the headless autopilot check repeatable: same seed,
// same world, same outcome.

export const WORLD_SEED = 20261127;

export function createRng(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function randomInt(rng, min, max) {
  return Math.floor(randomRange(rng, min, max + 1));
}

export function pickWeighted(rng, entries) {
  // entries: array of [value, weight]; returns one value.
  let total = 0;
  for (const [, weight] of entries) total += weight;
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
