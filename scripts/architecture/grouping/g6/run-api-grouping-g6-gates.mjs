#!/usr/bin/env node
// G6 orchestrator; exit at first failure. No operational seeds or DB migrations.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..'
);

//===================================================================

export const HISTORY = Object.freeze([
  'check:grouping-g6',
  'test:grouping-g6',

  ...['g1', 'g2', 'g3', 'g4', 'g5'].flatMap((name) => [
    `check:grouping-${name}`,
    `test:grouping-${name}`,
  ]),

  'check:models-m1',
  'test:models-m1',
  'check:services-s1',
  'test:services-s1',
  'check:transport-c1',
  'test:transport-c1',
]);

//===================================================================

export const FULL_GATE = Object.freeze([
  'check:source:api',
  'check:source:shared',
  'check:source:client',
  'check:source:pharmacy',
  'check:source:admin',
  'check:lint:serial',
  'check:type-check:serial',
  'check:test:serial',
  'check:react:serial',
  'check:integration:serial',
  'check:build:serial',
  'check:deploy-artifact',
]);

//===================================================================

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert(
    process.argv.length === 3 &&
      ['--history', '--full'].includes(process.argv[2]),

    'Choose --history or --full. G6 never executes migrations or writes DB records.'
  );

  const commands =
    process.argv[2] === '--full' ? [...HISTORY, ...FULL_GATE] : [...HISTORY];

  const scripts = JSON.parse(
    readFileSync(path.join(ROOT, 'package.json'), 'utf8')
  ).scripts;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];

    console.log(`\n===== G6 ${i + 1}/${commands.length}: ${command} =====`);

    // Historical architecture gates are dependency-free Node scripts, so run
    // them directly. The full workspace gate uses pnpm for package scripts.
    const direct = HISTORY.includes(command);
    const nodeScript = direct ? scripts[command] : null;

    if (direct)
      assert(
        /^node (?:--test )?scripts\/architecture\/(?:[\w.-]+\/)*[\w.-]+\.mjs(?: --check(?: --stage G[1-5])?)?$/.test(
          nodeScript
        ),
        `Unexpected historical gate definition: ${command}`
      );

    const status = direct
      ? spawnSync(process.execPath, nodeScript.split(' ').slice(1), {
          cwd: ROOT,
          stdio: 'inherit',
        })
      : spawnSync('pnpm', [command], {
          cwd: ROOT,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
    if (status.error || status.status !== 0) {
      console.error(
        `G6 FAIL at ${command}: ${status.error?.message ?? `exit ${status.status}`}`
      );

      process.exitCode = status.status || 1;

      break;
    }

    console.log(`G6 PASS: ${command}`);
  }
}
