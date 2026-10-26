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
  '../../../..'
);
//===================================================================

const read = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));

const plan = read('docs/architecture/grouping-g0/relocation-plan.json');
const inventory = read('docs/architecture/grouping-g0/source-inventory.json');

//===================================================================

const hashes = read(
  'docs/architecture/grouping-g1/expected-transformed-hashes.json'
);

//===================================================================

const moves = plan.moves.filter((x) => x.stage === 'G1');

//===================================================================

const run = (...argv) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        'scripts/architecture/grouping/g1/relocate-api-grouping-g1.mjs',
        ...argv,
      ],
      { cwd: root, encoding: 'utf8' }
    )
  );

//===================================================================

const digest = (p) =>
  createHash('sha256')
    .update(readFileSync(path.join(root, p)))
    .digest('hex');

//===================================================================

test('G1 matches all 35 immutable G0 constants, without destination collision or proxy', () => {
  const uniqueFrom = new Set(moves.map((x) => x.from));
  const uniqueTo = new Set(moves.map((x) => x.to));

  assert.equal(moves.length, 35);
  assert.equal(uniqueFrom.size, 35);
  assert.equal(uniqueTo.size, 35);

  assert.deepEqual(
    uniqueFrom,
    new Set(inventory.files.filter((x) => x.stage === 'G1').map((x) => x.path))
  );

  assert.deepEqual(uniqueTo, new Set(Object.keys(hashes.hashes)));
  assert.deepEqual(uniqueTo, new Set(Object.keys(hashes.rawHashes)));

  for (const move of moves) {
    assert.equal(move.stable, false);
    assert.equal(path.posix.basename(move.from), path.posix.basename(move.to));

    assert.notEqual(
      existsSync(path.join(root, move.from)),
      existsSync(path.join(root, move.to))
    );
  }
});

//===================================================================

test('G1 dry-run and check are read-only and preserve file contents', () => {
  const watch = moves.map((m) =>
    existsSync(path.join(root, m.to)) ? m.to : m.from
  );

  const before = watch.map(digest);
  const complete = watch[0] === moves[0].to;
  const result = run('--dry-run', '--stage', 'G1');

  assert.equal(result.status, 'PASS');
  assert.equal(result.manifestEntries, 35);
  assert.equal(result.projectedMoved, 35);
  assert.equal(result.verifiedRelativeImports > 3000, true);

  if (complete) assert.equal(run('--check', '--stage', 'G1').selectedMoves, 0);

  assert.deepEqual(watch.map(digest), before);
});

//===================================================================

test('G1 rejects malformed flags and does not move files on accidental --check', () => {
  for (const args of [
    ['--apply'],
    ['--check', '--apply'],
    ['--stage', 'G2', '--dry-run'],
  ]) {
    // --apply without a stage is intentionally supported to ease automation,
    // so reject a deliberate unknown flag instead.
    const actual = args.length === 1 ? ['--apply', '--unknown'] : args;

    const result = spawnSync(
      process.execPath,

      [
        'scripts/architecture/grouping/g1/relocate-api-grouping-g1.mjs',
        ...actual,
      ],

      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
  }

  const complete = moves.every((m) => existsSync(path.join(root, m.to)));

  if (!complete) {
    const result = spawnSync(
      process.execPath,

      [
        'scripts/architecture/grouping/g1/relocate-api-grouping-g1.mjs',
        '--check',
        '--stage',
        'G1',
      ],

      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
  }
});

//===================================================================

test('G1 retains verified immutable hashes and keeps non-G1 scope untouched', () => {
  const nonG1 = plan.moves.filter((m) => m.stage !== 'G1');
  const g2Moves = plan.moves.filter((m) => m.stage === 'G2' && !m.stable);
  const completedG2 = g2Moves.every((m) => existsSync(path.join(root, m.to)));
  const g3Moves = plan.moves.filter((m) => m.stage === 'G3' && !m.stable);
  const completedG3 = g3Moves.every((m) => existsSync(path.join(root, m.to)));
  const g4Moves = plan.moves.filter((m) => m.stage === 'G4' && !m.stable);
  const completedG4 = g4Moves.every((m) => existsSync(path.join(root, m.to)));
  const g5Moves = plan.moves.filter((m) => m.stage === 'G5' && !m.stable);
  const completedG5 = g5Moves.every((m) => existsSync(path.join(root, m.to)));

  assert(
    g5Moves.every((m) =>
      existsSync(path.join(root, completedG5 ? m.to : m.from))
    )
  );

  assert.equal(g2Moves.length, 38);
  assert.equal(nonG1.length, 118);

  for (const m of nonG1) {
    const alreadyRelocated =
      !m.stable &&
      ((completedG2 && m.stage === 'G2') ||
        (completedG3 && m.stage === 'G3') ||
        (completedG4 && m.stage === 'G4') ||
        (completedG5 && m.stage === 'G5'));

    const canonical = alreadyRelocated ? m.to : m.from;

    assert(
      existsSync(path.join(root, canonical)),
      `Grouping source missing: ${canonical}`
    );

    if (!m.stable)
      assert(
        !existsSync(path.join(root, alreadyRelocated ? m.from : m.to)),
        `Unexpected legacy or premature grouping target: ${m.from}`
      );
  }

  const complete = moves.every((m) => existsSync(path.join(root, m.to)));

  if (complete) {
    assert.equal(
      readdirSync(path.join(root, 'apps/api/src/constants'), {
        withFileTypes: true,
      }).filter((ent) => ent.isFile()).length,
      0,
      'No flat proxy files'
    );
  }
});

//===================================================================

test('G1 only performs an approved constants relocation; M1 and C1 historical maps stay fixed', () => {
  for (const file of [
    'docs/architecture/models-m1/model-relocation-map.json',
    'docs/architecture/transport-c1/transport-relocation-map.json',
    'docs/architecture/services-s1/service-relocation-map.json',
  ])
    assert(existsSync(path.join(root, file)));

  const expected = read(
    'docs/architecture/grouping-g1/expected-transformed-hashes.json'
  );

  assert.equal(expected.schemaVersion, 1);
  assert.equal(expected.stage, 'G1');
});
