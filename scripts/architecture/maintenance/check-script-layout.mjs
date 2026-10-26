#!/usr/bin/env node
// Read-only confirmation that the architecture toolchain uses canonical directories.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

//===================================================================

const MAP = 'docs/architecture/scripts-reorganization/relocation-map.json';
const ARCH = 'scripts/architecture';

const abs = (p) => path.join(ROOT, p);

//===================================================================

export function verifyLayout({ moves, exists, scripts, flatEntries }) {
  const errors = [];

  if (moves.length !== 32)
    errors.push('Expected 32 documented architecture script moves');

  if (
    new Set(moves.map(([a]) => a)).size !== moves.length ||
    new Set(moves.map(([, b]) => b)).size !== moves.length
  )
    errors.push('Duplicate architecture relocation paths');

  for (const [before, after] of moves) {
    if (
      !before.startsWith(ARCH + '/') ||
      !after.startsWith(ARCH + '/') ||
      before === after
    )
      errors.push(`Unsafe move: ${before} => ${after}`);

    if (exists(before)) errors.push(`Legacy flat script remains: ${before}`);

    if (!exists(after))
      errors.push(`Canonical architecture script missing: ${after}`);
  }

  for (const file of flatEntries)
    if (file.endsWith('.mjs'))
      errors.push(`Unexpected flat architecture script: ${file}`);

  for (const [name, cmd] of Object.entries(scripts)) {
    const match = cmd.match(
      /^node (?:--test )?(scripts\/architecture\/[^\s]+\.mjs)(?:\s|$)/
    );

    if (match && !exists(match[1]))
      errors.push(`Broken npm script: ${name} => ${match[1]}`);
  }

  return errors;
}

//===================================================================

export function parseArgs(args) {
  assert.deepEqual(args, ['--check'], 'Script layout check is read-only');
}

//===================================================================

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  parseArgs(process.argv.slice(2));

  const map = JSON.parse(readFileSync(abs(MAP), 'utf8'));
  const scripts = JSON.parse(readFileSync(abs('package.json'), 'utf8')).scripts;

  const errors = verifyLayout({
    moves: Object.entries(map.mapping),
    exists: (p) => existsSync(abs(p)),
    scripts,
    flatEntries: readdirSync(abs(ARCH)),
  });

  console.log(
    JSON.stringify(
      {
        stage: 'A5',
        grouping: 'architecture-tooling',
        status: errors.length ? 'FAIL' : 'PASS',
        movedFiles: Object.keys(map.mapping).length,
        errors,
      },
      null,
      2
    )
  );

  if (errors.length) process.exitCode = 1;
}
