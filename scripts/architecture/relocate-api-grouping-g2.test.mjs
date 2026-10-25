import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const read = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));

const plan = read('docs/architecture/grouping-g0/relocation-plan.json');
const inventory = read('docs/architecture/grouping-g0/source-inventory.json');
const pinned = read('docs/architecture/grouping-g2/source-fingerprints.json');

const all = plan.moves.filter((item) => item.stage === 'G2');
const moves = all.filter((item) => !item.stable);
const stable = all.filter((item) => item.stable);

const run = (...argv) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['scripts/architecture/relocate-api-grouping-g2.mjs', ...argv],
      { cwd: root, encoding: 'utf8' }
    )
  );

const digest = (p) =>
  createHash('sha256')
    .update(readFileSync(path.join(root, p)))
    .digest('hex');

const pathExists = (p) => existsSync(path.join(root, p));
const complete = () => moves.every((item) => pathExists(item.to));

//===================================================================

test('G2 immutable manifest inventories 50 schemas with 38 safe moves and 12 stable files', () => {
  assert.equal(all.length, 50);
  assert.equal(moves.length, 38);
  assert.equal(stable.length, 12);

  assert.equal(new Set(all.map((m) => m.from)).size, 50);
  assert.equal(new Set(all.map((m) => m.to)).size, 50);

  assert.deepEqual(
    new Set(all.map((m) => m.from)),
    new Set(inventory.files.filter((f) => f.stage === 'G2').map((f) => f.path))
  );

  assert.deepEqual(
    new Set(all.map((m) => m.from)),
    new Set(Object.keys(pinned.baselineHashes))
  );

  assert.deepEqual(
    new Set(all.map((m) => m.to)),
    new Set(Object.keys(pinned.canonicalHashes))
  );

  for (const m of all) {
    assert(m.from.startsWith('apps/api/src/schemas/'));
    assert(m.to.startsWith('apps/api/src/schemas/'));

    assert(
      !m.from.split('/').includes('..') && !m.to.split('/').includes('..')
    );

    assert.equal(path.posix.basename(m.from), path.posix.basename(m.to));

    if (m.stable) {
      assert.equal(m.from, m.to);
      assert(pathExists(m.from));
    } else {
      assert.notEqual(pathExists(m.from), pathExists(m.to));
    }
  }
});

//===================================================================

test('G2 dry-run and post-apply check are deterministic and read-only', () => {
  const watch = all.map((m) => (complete() ? m.to : m.from));
  const before = watch.map(digest);
  const result = run('--dry-run', '--stage', 'G2');

  assert.equal(result.status, 'PASS');
  assert.equal(result.manifestEntries, 38);
  assert.equal(result.projectedMoved, 38);
  assert(result.verifiedRelativeImports >= 3290);
  assert.equal(result.obsoleteProxyFiles, 0);

  if (complete()) {
    const check = run('--check', '--stage', 'G2');

    assert.equal(check.completedBeforeRun, 38);
    assert.equal(check.selectedMoves, 0);
    assert.equal(check.touchedFiles, 0);
  }

  assert.deepEqual(watch.map(digest), before);
});

//===================================================================

test('G2 never applies on invalid flags or silently checks an unrelocated tree', () => {
  for (const args of [
    ['--apply', '--unexpected'],
    ['--apply', '--check', '--stage', 'G2'],
    ['--dry-run', '--stage', 'G1'],
  ]) {
    const result = spawnSync(
      process.execPath,
      ['scripts/architecture/relocate-api-grouping-g2.mjs', ...args],
      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
  }

  if (!complete()) {
    const result = spawnSync(
      process.execPath,
      [
        'scripts/architecture/relocate-api-grouping-g2.mjs',
        '--check',
        '--stage',
        'G2',
      ],
      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
  }
});

//===================================================================

test('G2 protects JSON contracts and leaves G3–G5 source paths intact', () => {
  assert.equal(pinned.schemaVersion, 1);
  assert.equal(pinned.stage, 'G2');

  for (const m of plan.moves.filter((x) =>
    ['G3', 'G4', 'G5'].includes(x.stage)
  )) {
    assert(pathExists(m.from), `Premature move of future stage: ${m.from}`);

    if (!m.stable)
      assert(!pathExists(m.to), `Unexpected future target: ${m.to}`);
  }

  const jsonFixture = stable.find((m) =>
    m.from.endsWith('validation-contract-cases.json')
  );

  assert(jsonFixture);

  assert.equal(
    digest(jsonFixture.from),
    pinned.canonicalHashes[jsonFixture.to].raw
  );

  if (complete()) {
    const flat = readdirSync(path.join(root, 'apps/api/src/schemas'), {
      withFileTypes: true,
    }).filter((entry) => entry.isFile());

    assert.equal(flat.length, 0, 'No flat schemas remain as proxies');
  }
});

//===================================================================

test('G2 keeps immutable G0, G1, M1, S1 and Transport C1 baselines', () => {
  for (const p of [
    'docs/architecture/grouping-g0/source-inventory.json',
    'docs/architecture/grouping-g1/expected-transformed-hashes.json',
    'docs/architecture/models-m1/model-inventory.json',
    'docs/architecture/services-s1/service-relocation-map.json',
    'docs/architecture/transport-c1/transport-relocation-map.json',
  ])
    assert(pathExists(p), `Missing historical baseline: ${p}`);

  assert.equal(plan.moves.filter((m) => m.stage === 'G1').length, 35);
  assert.equal(Object.keys(pinned.constantAfterG2Hashes).length, 34);
});
