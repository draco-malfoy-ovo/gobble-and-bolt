[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/draco-malfoy-ovo/gobble-and-bolt/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/draco-malfoy-ovo/gobble-and-bolt/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobble & Bolt — The Great Thanksgiving Escape

An original turkey escape game for make.fun's **turkey-run-game-01** bounty
($250 prize pool). You are the turkey. Dinner is at six, and you are not on
the guest list — you are the menu.

## The game

Outrun Farmer Bram from his kitchen, across the farmyard, to the Freedom
Woods — three stages, one gate, no gravy.

- **The Kitchen** — lit ovens with a heat halo that singes, island counters
  that break the farmer's line of sight, low counters to hop.
- **The Farmyard** — fences to jump, hay bales to hide behind.
- **Freedom Woods** — fallen logs, thick pines, and the gate at the end.

Farmer Bram chases what he can see, hurries to the last place he saw you
when he loses you, searches, and gives up — break his line of sight behind
hay, pines or a kitchen island and he drops off your tail. You can watch
him think: his gaze is drawn as a cone, pale while he patrols, amber
while he searches the spot he last saw you (her faint silhouette still
hangs there), red with a "!" the moment he is on you — and whatever
blocks the cone is exactly what hides you. Carving knives
fly in at carving height after a glint and a whistle: crouch or change
lanes. Corn scores points and restores stamina. Three lives; reach the
gate to escape.

**Controls** — Move: WASD / Arrow keys · Sprint: Shift · Jump: Space ·
Crouch: C · Mute: M. Title screen, HUD (score, distance, stage, lives,
stamina, and an escape-progress road labelled with all three stages and
your marker on it), and caught / escaped end screens with restart. A
first run coaches itself: the first time each danger shows up — a knife
glinting in, an oven's glow, Bram spotting you or searching for you — a
one-line hint says what to do about it. Reach the gate and the escape
screen grades the run (S / A / B / C, from lives left and the clock) and
itemises it: distance, time, corn, close calls, lives, final score. Get
caught and it tells you what percentage of the way to the gate you made.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library.
- `game/` — the game itself: static files, no build step, no network.
  - `game/src/sim.js` — the whole game as a step-by-step simulation: same seed, same run, every time
  - `game/src/world.js` — the seeded route: stages, ovens, occluders, corn
  - `game/src/turkey.js` / `farmer.js` / `hazards.js` — the actors and dangers
  - `game/src/render.js` / `screens.js` — all canvas art, HUD and screens
  - `game/src/audio.js` — procedural WebAudio sound, no audio files
  - `game/src/input.js` / `main.js` — keys, boot and the game loop
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — four real renders of the game: the farmyard chase
  under the title (the cover), the kitchen mid-chase, Bram searching the
  woods, and the escape screen.

## Play locally

```sh
node serve.ts        # then open http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed — see `LICENSE`.
