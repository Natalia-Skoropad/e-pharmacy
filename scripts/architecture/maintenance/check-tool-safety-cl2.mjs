#!/usr/bin/env node
// CL2: read-only proof that protected gates cannot invoke historical write tools.
// This verifies package-script reachability, not arbitrary shell/CI execution.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

//===================================================================

const ORIGINAL_RELOCATORS = Object.freeze({
  'grouping:relocate':
    'node scripts/architecture/grouping/relocate-api-grouping.mjs',
  'services:relocate':
    'node scripts/architecture/services/relocate-services-s1.mjs',
  'transport:relocate':
    'node scripts/architecture/transport/relocate-api-transport-c1.mjs',
});

//===================================================================

const ROOT_GATES = Object.freeze([
  'check:architecture:final',
  'check:before-deploy:staged',
  'check:before-deploy',
  'check:grouping-g6:history',
  'check:grouping-g6:full',
]);

//===================================================================

const SAFETY_GATES = Object.freeze([
  'check:architecture:final',
  'check:before-deploy:staged',
  'check:before-deploy',
]);

//===================================================================

const REQUIRED_HEAD = [
  'pnpm check:tool-safety-cl2',
  'pnpm test:tool-safety-cl2',
];

//===================================================================

const RUNNER = 'scripts/architecture/grouping/g6/run-api-grouping-g6-gates.mjs';

//===================================================================

export function assertReadOnlyFlags(args) {
  assert.deepEqual(args, ['--check'], 'CL2 accepts only --check');
}

//===================================================================

// Parse only the reviewed G6 declarative dispatch lists. Unknown syntax fails
// closed; never evaluate arbitrary JS or launch the runner from the CL2 audit.
export function parseG6Commands(source) {
  const history = source.match(
    /export const HISTORY = Object\.freeze\(\[([\s\S]*?)\]\);/
  );

  const full = source.match(
    /export const FULL_GATE = Object\.freeze\(\[([\s\S]*?)\]\);/
  );

  if (!history || !full) throw Error('Missing canonical G6 command lists');

  const expectedExpander =
    "...['g1', 'g2', 'g3', 'g4', 'g5'].flatMap((name) => [";

  if (
    !history[1].includes(expectedExpander) ||
    !history[1].includes('`check:grouping-${name}`') ||
    !history[1].includes('`test:grouping-${name}`')
  )
    throw Error('Unexpected G6 G1–G5 command expansion');

  const literals = (block) =>
    [...block.matchAll(/'([\w:-]+)'/g)].map((m) => m[1]);

  const fixed = literals(history[1]).filter((x) => /^(?:check|test):/.test(x));

  const expanded = ['g1', 'g2', 'g3', 'g4', 'g5'].flatMap((stage) => [
    `check:grouping-${stage}`,
    `test:grouping-${stage}`,
  ]);

  const a = [...fixed.slice(0, 2), ...expanded, ...fixed.slice(2)];
  const b = literals(full[1]);

  if (
    a.length !== 18 ||
    b.length !== 12 ||
    !source.includes('const direct = HISTORY.includes(command)') ||
    !source.includes("spawnSync('pnpm', [command]")
  )
    throw Error('G6 dispatch shape or historical/full command count changed');

  return { history: a, full: b };
}

//===================================================================

function splitCommand(command) {
  if (typeof command !== 'string' || !command.trim())
    throw Error('Empty command');

  // && is the only supported shell composer for architecture gate definitions.
  if (/(?:\|\||[;|`]|\$\(|\n|\r)/.test(command))
    throw Error('Unreviewed shell composition in protected command');

  return command.split('&&').map((x) => x.trim());
}

//===================================================================

export function verifyToolSafety({ scripts, runnerSource, inventory }) {
  const errors = [];
  const visited = new Set();
  const active = new Set();

  let g6;

  try {
    g6 = parseG6Commands(runnerSource);
  } catch (error) {
    errors.push(error.message);
  }

  if (
    inventory?.inventoryCount !== 46 ||
    !Array.isArray(inventory?.scripts) ||
    inventory.scripts.length !== 46
  )
    errors.push('CL1 inventory must retain exactly 46 historical scripts');
  else {
    const historical = new Set(inventory.scripts.map((x) => x.path));

    for (const rel of [
      'scripts/architecture/grouping/relocate-api-grouping.mjs',
      'scripts/architecture/services/relocate-services-s1.mjs',
      'scripts/architecture/transport/relocate-api-transport-c1.mjs',
      'scripts/architecture/grouping/g0/api-grouping-g0-core.mjs',
    ])
      if (!historical.has(rel))
        errors.push(`Missing CL1 retained tool: ${rel}`);

    if (new Set(inventory.scripts.map((x) => x.path)).size !== 46)
      errors.push('Duplicated CL1 inventory paths');
  }

  for (const [name, command] of Object.entries(ORIGINAL_RELOCATORS))
    if (scripts[name] !== command)
      errors.push(`Historical relocation command changed: ${name}`);

  const expectedChecker =
    'node scripts/architecture/maintenance/check-tool-safety-cl2.mjs --check';

  const expectedTest =
    'node scripts/architecture/maintenance/check-tool-safety-cl2.test.mjs';

  if (scripts['check:tool-safety-cl2'] !== expectedChecker)
    errors.push('Missing canonical read-only CL2 checker command');

  if (scripts['test:tool-safety-cl2'] !== expectedTest)
    errors.push('Missing canonical CL2 test command');

  for (const gate of SAFETY_GATES) {
    try {
      const steps = splitCommand(scripts[gate]);

      if (steps[0] !== REQUIRED_HEAD[0] || steps[1] !== REQUIRED_HEAD[1])
        errors.push(`CL2 safety checks must lead ${gate}`);
    } catch (error) {
      errors.push(`${gate}: ${error.message}`);
    }
  }

  function visit(name) {
    if (visited.has(name)) return;

    if (active.has(name)) {
      errors.push(`Command dependency cycle: ${name}`);

      return;
    }

    if (!Object.hasOwn(scripts, name)) {
      errors.push(`Missing command: ${name}`);

      return;
    }

    if (
      Object.hasOwn(ORIGINAL_RELOCATORS, name) ||
      /(?:^|:)(?:relocate|migrate|seed|apply)(?:$|:)/i.test(name)
    ) {
      errors.push(
        `Write-capable command reachable from protected gate: ${name}`
      );

      return;
    }

    active.add(name);

    let steps;

    try {
      steps = splitCommand(scripts[name]);
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
      steps = [];
    }

    for (const step of steps) {
      if (/\s--apply(?:\s|$)|\s--write(?:\s|$)/.test(` ${step}`))
        errors.push(`Write mode reachable via ${name}: ${step}`);

      const pnpm = step.match(
        /^pnpm\s+(?!(?:exec|--filter)\b)([\w:-]+)(?:\s|$)/
      );

      if (pnpm) {
        visit(pnpm[1]);
        continue;
      }

      const g6call = step.match(
        /^node\s+(scripts\/architecture\/grouping\/g6\/run-api-grouping-g6-gates\.mjs)\s+(--full|--history)$/
      );

      if (g6call) {
        if (g6)
          for (const cmd of [
            ...g6.history,
            ...(g6call[2] === '--full' ? g6.full : []),
          ])
            visit(cmd);
        continue;
      }

      const direct = step.match(
        /^node\s+(?:--test\s+)?(scripts\/architecture\/[^\s]+\.mjs)(.*)$/
      );

      if (direct) {
        if (
          /relocate-api-|relocate-services-|relocate-api-transport/.test(
            direct[1]
          ) &&
          !/\.test\.mjs$/.test(direct[1]) &&
          !/\s--check(?:\s|$)/.test(direct[2])
        )
          errors.push(`Historical relocation tool without --check: ${name}`);

        if (/\.test\.mjs$/.test(direct[1]) && direct[2].trim())
          errors.push(`Unexpected flags on test command: ${name}`);

        continue;
      }

      // Other non-architecture commands are delegated to existing G6
      // source/build/test gates; their internals are outside CL2's scope.
      if (
        /^pnpm\s+exec\s+turbo\b/.test(step) ||
        /^pnpm\s+(?:--filter|run\s)/.test(step) ||
        /^node\s+/.test(step) ||
        /^tsc\b/.test(step) ||
        /^next\b/.test(step) ||
        /^turbo\s+(?:lint|type-check|test|build)\b/.test(step)
      )
        continue;

      errors.push(`Unreviewed command syntax in ${name}: ${step}`);
    }

    active.delete(name);
    visited.add(name);
  }

  for (const gate of ROOT_GATES) visit(gate);

  return {
    status: errors.length ? 'FAIL' : 'PASS',
    protectedRoots: ROOT_GATES.length,
    checkedCommands: visited.size,
    historicalWriteEntrypoints: Object.keys(ORIGINAL_RELOCATORS).length,
    errors,
  };
}

//===================================================================

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertReadOnlyFlags(process.argv.slice(2));

  const load = (p) => readFileSync(path.join(ROOT, p), 'utf8');

  const result = verifyToolSafety({
    scripts: JSON.parse(load('package.json')).scripts,
    runnerSource: load(RUNNER),

    inventory: JSON.parse(
      load(
        'docs/architecture/cleanup-readiness/SCRIPT-RETENTION-INVENTORY.json'
      )
    ),
  });

  console.log(JSON.stringify({ stage: 'CL2', ...result }, null, 2));

  if (result.errors.length) process.exitCode = 1;
}
