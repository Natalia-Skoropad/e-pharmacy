import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  assertReadOnlyFlags,
  parseG6Commands,
  verifyToolSafety,
} from './check-tool-safety-cl2.mjs';

//===================================================================

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

//===================================================================

const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');

//===================================================================

const inputs = () => ({
  scripts: structuredClone(JSON.parse(read('package.json')).scripts),

  runnerSource: read(
    'scripts/architecture/grouping/g6/run-api-grouping-g6-gates.mjs'
  ),

  inventory: structuredClone(
    JSON.parse(
      read(
        'docs/architecture/cleanup-readiness/SCRIPT-RETENTION-INVENTORY.json'
      )
    )
  ),
});

//===================================================================

const audit = (mutate) => {
  const state = inputs();

  mutate?.(state);

  return verifyToolSafety(state);
};

//===================================================================

test('CL2 protects all five gate roots and retains three historical write entrypoints', () => {
  const result = audit();

  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.equal(result.protectedRoots, 5);
  assert.equal(result.historicalWriteEntrypoints, 3);
  assert(result.checkedCommands >= 35);
});

//===================================================================

test('CL2 accepts only explicit read-only --check', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--help'],
  ])
    assert.throws(() => assertReadOnlyFlags(args));
});

//===================================================================

test('CL2 rejects changing or removing historical relocation commands', () => {
  for (const name of [
    'grouping:relocate',
    'services:relocate',
    'transport:relocate',
  ])
    assert.equal(
      audit(({ scripts }) => {
        delete scripts[name];
      }).status,
      'FAIL'
    );
});

//===================================================================

test('CL2 refuses --apply in an otherwise safe checker', () => {
  const out = audit(({ scripts }) => {
    scripts['check:models-m1'] += ' --apply';
  });

  assert(out.errors.some((x) => x.includes('Write mode')));
});

//===================================================================

test('CL2 finds indirect access to write-capable relocator commands', () => {
  const out = audit(({ scripts }) => {
    scripts['check:models-m1'] = 'pnpm transport:relocate';
  });

  assert(out.errors.some((x) => x.includes('Write-capable command reachable')));
});

//===================================================================

test('CL2 rejects historical relocation checker without --check', () => {
  const out = audit(({ scripts }) => {
    scripts['check:grouping-g2'] = scripts['check:grouping-g2'].replace(
      '--check',
      '--dry-run'
    );
  });

  assert(out.errors.some((x) => x.includes('without --check')));
});

//===================================================================

test('CL2 fails if safety preflight is removed from final or deployment commands', () => {
  for (const name of [
    'check:architecture:final',
    'check:before-deploy:staged',
    'check:before-deploy',
  ]) {
    const out = audit(({ scripts }) => {
      scripts[name] = scripts[name].replace(
        'pnpm check:tool-safety-cl2 && ',
        ''
      );
    });

    assert(out.errors.some((x) => x.includes(`must lead ${name}`)));
  }
});

//===================================================================

test('CL2 requires canonical safety commands and flags', () => {
  const out = audit(({ scripts }) => {
    scripts['check:tool-safety-cl2'] = 'node bad.mjs --apply';
  });

  assert(out.errors.some((x) => x.includes('Missing canonical read-only')));
});

//===================================================================

test('CL2 refuses an altered G6 dispatch list', () => {
  const out = audit((state) => {
    state.runnerSource = state.runnerSource.replace(
      "'check:source:api'",
      "'seed:demo'"
    );
  });

  assert(out.errors.some((x) => x.includes('Missing command: seed:demo')));
  assert.throws(() => parseG6Commands('export const HISTORY = [];'));
});

//===================================================================

test('CL2 detects missing, duplicated or reduced historical inventory', () => {
  const out = audit(({ inventory }) => {
    inventory.scripts.pop();
  });

  assert(out.errors.some((x) => x.includes('CL1 inventory')));
});

//===================================================================

test('CL2 detects dependency cycles without running commands', () => {
  const out = audit(({ scripts }) => {
    scripts['check:models-m1'] = 'pnpm check:architecture:final';
  });

  assert(out.errors.some((x) => x.includes('dependency cycle')));
});

//===================================================================

test('CL2 CLI never launches relocation and rejects write flags', () => {
  const file = path.join(
    ROOT,
    'scripts/architecture/maintenance/check-tool-safety-cl2.mjs'
  );

  const bad = spawnSync(process.execPath, [file, '--apply'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.notEqual(bad.status, 0);

  const first = spawnSync(process.execPath, [file, '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  const second = spawnSync(process.execPath, [file, '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(first.stdout, second.stdout);
});
