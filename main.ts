// Gobble & Bolt — hand-in program for the make.fun turkey-run-game-01 bounty.
//
// The entry itself is the game/ folder: plain static files (an index.html plus
// ES modules, no build step, no network) that play offline in desktop Chrome.
// This program copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the kit's vendored library, exactly the
// summary the sealed gate rebuilds and compares byte for byte.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the playable game first, then the maker's screenshots of it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier caps below mirror the gate's own limits, so a hand-in this
// program writes is one the gate can accept: dossier text capped at 160 KiB,
// at most 4 screenshots of at most 256 KiB each, and a game/ tree of at most
// 993 entries, 48 MiB in all, no path longer than 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
