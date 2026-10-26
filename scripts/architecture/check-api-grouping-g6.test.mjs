import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  runAudit,
  verifyLayout,
  verifyPinnedSources,
  EXPECTED,
} from './check-api-grouping-g6.mjs';

import { HISTORY, FULL_GATE } from './run-api-grouping-g6-gates.mjs';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const load = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));
const manifest = load('docs/architecture/grouping-g0/relocation-plan.json');
const inventory = load('docs/architecture/grouping-g0/source-inventory.json');

const approval = load(
  'docs/architecture/grouping-g6/approved-g5-formatting.json'
);

const pinned = load(
  'docs/architecture/grouping-g6/canonical-source-fingerprints.json'
);

const paths = manifest.moves.map((m) => m.to);
const known = new Set(paths);

const check = (...args) =>
  spawnSync(
    process.execPath,
    [
      path.join(root, 'scripts/architecture/check-api-grouping-g6.mjs'),
      ...args,
    ],
    { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  );

const virtual = (overrides = {}) =>
  verifyLayout({
    moves: overrides.moves ?? manifest.moves,
    files: overrides.files ?? inventory.files,
    sourcePaths: overrides.paths ?? paths,
    fileExists: overrides.exists ?? ((f) => known.has(f)),
  });

//===================================================================

test('G6 covers every one of 153 immutable G0 files, 140 moves and 13 stable paths', () => {
  assert.equal(manifest.moves.length, 153);
  assert.equal(inventory.files.length, 153);
  assert.equal(Object.keys(pinned.hashes).length, 153);
  assert.equal(new Set(paths).size, 153);
  assert.deepEqual(virtual().errors, []);

  for (const [name, values] of Object.entries(EXPECTED)) {
    assert.equal(
      manifest.moves.filter((m) => m.stage === name).length,
      values[0]
    );

    assert.equal(
      manifest.moves.filter((m) => m.stage === name && !m.stable).length,
      values[1]
    );
  }
});

//===================================================================

test('G6 final check is deterministic and read-only', () => {
  const tracked = [
    'docs/architecture/grouping-g0/relocation-plan.json',
    'docs/architecture/grouping-g5/source-fingerprints.json',
    'apps/api/src/utils/email/sendEmail.ts',
    'apps/api/src/types/infrastructure/express.ts',
  ];

  const hashes = () =>
    tracked.map((p) =>
      createHash('sha256')
        .update(readFileSync(path.join(root, p)))
        .digest('hex')
    );

  const before = hashes();

  const first = check('--check'),
    second = check('--check');

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual(hashes(), before);

  const report = JSON.parse(first.stdout);

  assert.equal(report.status, 'PASS');
  assert.equal(report.relocatedFiles, 140);
  assert.equal(report.stableFiles, 13);
  assert.equal(report.unresolvedRelativeImports, 0);
  assert.equal(report.apiImportCycles, 0);
  assert.equal(report.obsoleteLiteralPaths, 0);
  assert.equal(report.preservedCommandNames, 14);
  assert(report.verifiedRelativeImports >= 3494);
});

//===================================================================

test('G6 rejects unknown flags and every write mode', () => {
  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--help'],
    ['--check', '--stage', 'G6'],
  ])
    assert.notEqual(check(...args).status, 0, `Unexpectedly allowed: ${args}`);
});

//===================================================================

test('G6 fails closed when a relocated file is missing or a legacy proxy returns', () => {
  const moved = manifest.moves.find((m) => !m.stable);

  assert(
    virtual({ exists: (f) => known.has(f) && f !== moved.to }).errors.some(
      (x) => x.includes('Missing final target')
    )
  );

  assert(
    virtual({ exists: (f) => known.has(f) || f === moved.from }).errors.some(
      (x) => x.includes('Legacy flat path/proxy')
    )
  );
});

//===================================================================

test('G6 refuses unplanned paths, duplicates and incomplete manifest', () => {
  assert(
    virtual({
      paths: [...paths, 'apps/api/src/utils/legacy-proxy.ts'],
    }).errors.some((x) => x.includes('Unplanned file'))
  );

  assert(
    virtual({ moves: manifest.moves.slice(1) }).errors.some((x) =>
      x.includes('count')
    )
  );

  const clone = manifest.moves.map((x) => ({ ...x }));

  clone[1].to = clone[0].to;

  assert(
    virtual({ moves: clone }).errors.some((x) =>
      x.includes('Duplicate map key')
    )
  );
});

//===================================================================

test('G6 rejects a corrupted pinned source hash without mutating the repo', () => {
  const changed = structuredClone(pinned.hashes);

  changed[paths[0]].normalized = '0'.repeat(64);

  const errors = verifyPinnedSources({
    moves: manifest.moves,
    hashes: changed,
    fileExists: () => true,
    readBytes: (f) => readFileSync(path.join(root, f)),
  });

  assert(
    errors.some((e) => e.includes(`Source fingerprint drift: ${paths[0]}`))
  );
});

//===================================================================

test('G6 keeps the exact two post-G5 formatting approvals without rebaselining G5', () => {
  const names = Object.keys(approval.files).sort();

  assert.deepEqual(names, [
    'apps/api/src/utils/email/passwordResetEmail.ts',
    'apps/api/src/utils/email/sendEmail.ts',
  ]);

  const g5 = load('docs/architecture/grouping-g5/source-fingerprints.json');

  for (const name of names) {
    assert.deepEqual(approval.files[name].previousG5, g5.canonicalHashes[name]);

    const b = readFileSync(path.join(root, name));

    assert.equal(
      createHash('sha256').update(b).digest('hex'),
      approval.files[name].approvedAfterG5.raw
    );

    assert.deepEqual(pinned.hashes[name], approval.files[name].approvedAfterG5);
  }
});

//===================================================================

test('G6 preserves the original 14 CLI entrypoints and Express augmentation', () => {
  const report = runAudit();

  assert.equal(report.status, 'PASS', report.errors.join('\n'));

  const p = manifest.moves.find(
    (x) => x.from === 'apps/api/src/types/express.ts'
  );

  assert(p);

  assert.match(
    readFileSync(path.join(root, p.to), 'utf8'),
    /declare module 'express'/
  );

  assert.equal(report.preservedCommandNames, 14);
});

//===================================================================

test('G6 full gate enumerates every source, lint, typing, test, build and archive stage', () => {
  assert.equal(HISTORY.length, 18);
  assert.equal(FULL_GATE.length, 12);
  assert.equal(new Set([...HISTORY, ...FULL_GATE]).size, 30);
  assert(FULL_GATE.includes('check:deploy-artifact'));

  assert(
    ![...HISTORY, ...FULL_GATE].some((x) =>
      /^(?:seed|migrate|diagnose):/.test(x)
    )
  );
});
