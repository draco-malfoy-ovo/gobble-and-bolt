// serve.ts — a tiny static server for playing the game locally:
//   node serve.ts   then open http://localhost:8080
// It serves only this repository's game/ folder, with the few MIME types the
// game uses, and refuses paths that climb out of it.

import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  const file = join(root, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    if (statSync(file).isDirectory()) throw new Error('dir');
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(8080, () => console.log('Gobble & Bolt at http://localhost:8080'));
