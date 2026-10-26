#!/usr/bin/env node
// Stage-specific API grouping dispatcher. Explicit stage and mode are required.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const args = process.argv.slice(2);
const index = args.indexOf('--stage');

assert(index !== -1, 'Use --stage G1, G2, G3 or G4');

const stage = args[index + 1];

assert(
  ['G1', 'G2', 'G3', 'G4'].includes(stage),
  'Supported stages: G1, G2, G3, G4'
);

const count = args.filter((arg) =>
  ['--dry-run', '--apply', '--check'].includes(arg)
).length;

assert.equal(count, 1, 'Exactly one execution mode is required');

const filename = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  `relocate-api-grouping-${stage.toLowerCase()}.mjs`
);

const result = spawnSync(process.execPath, [filename, ...args], {
  stdio: 'inherit',
});

if (result.error) throw result.error;

process.exitCode = result.status ?? 1;
