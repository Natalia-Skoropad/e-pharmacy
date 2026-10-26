import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';

import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const absolute = (p) => path.join(root, p);
const json = (p) => JSON.parse(readFileSync(absolute(p), 'utf8'));
const exists = (p) => existsSync(absolute(p));

const digest = (p) =>
  createHash('sha256')
    .update(readFileSync(absolute(p)))
    .digest('hex');

const plan = json('docs/architecture/grouping-g0/relocation-plan.json');
const inventory = json('docs/architecture/grouping-g0/source-inventory.json');
const pinned = json('docs/architecture/grouping-g3/source-fingerprints.json');

const entrypoints = json(
  'docs/architecture/grouping-g0/script-entrypoints.json'
);

const moves = plan.moves.filter((m) => m.stage === 'G3');
const completed = () => moves.every((m) => exists(m.to));

const run = (...args) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['scripts/architecture/relocate-api-grouping-g3.mjs', ...args],
      { cwd: root, encoding: 'utf8' }
    )
  );

//===================================================================

test('G3 manifest covers exactly 14 operational scripts and no future stages', () => {
  assert.equal(moves.length, 14);
  assert(moves.every((m) => !m.stable));
  assert.equal(new Set(moves.map((m) => m.from)).size, 14);
  assert.equal(new Set(moves.map((m) => m.to)).size, 14);

  assert.deepEqual(
    new Set(moves.map((m) => m.from)),
    new Set(inventory.files.filter((f) => f.stage === 'G3').map((f) => f.path))
  );

  assert.deepEqual(
    new Set(Object.keys(pinned.baselineHashes)),
    new Set(moves.map((m) => m.from))
  );

  assert.deepEqual(
    new Set(Object.keys(pinned.canonicalHashes)),
    new Set(moves.map((m) => m.to))
  );

  for (const m of moves) {
    assert(m.from.startsWith('apps/api/src/scripts/'));
    assert(m.to.startsWith('apps/api/src/scripts/'));

    assert.equal(path.posix.basename(m.from), path.posix.basename(m.to));
    assert(!m.to.split('/').includes('..'));
    assert.notEqual(exists(m.from), exists(m.to));
  }
});

//===================================================================

test('G3 dry-run and completed-stage check are deterministic and read-only', () => {
  const watch = moves.map((m) => (completed() ? m.to : m.from));
  const before = watch.map(digest);

  const pack = digest('apps/api/package.json');
  const result = run('--dry-run', '--stage', 'G3');

  assert.equal(result.status, 'PASS');
  assert.equal(result.manifestEntries, 14);
  assert.equal(result.projectedMoved, 14);
  assert.equal(result.obsoleteProxyFiles, 0);
  assert.equal(result.preservedCommandNames, 14);
  assert(result.verifiedRelativeImports > 3200);

  if (completed()) {
    const checked = run('--check', '--stage', 'G3');

    assert.equal(checked.completedBeforeRun, 14);
    assert.equal(checked.selectedMoves, 0);
    assert.equal(checked.touchedFiles, 0);
  }

  assert.deepEqual(watch.map(digest), before);
  assert.equal(digest('apps/api/package.json'), pack);
});

//===================================================================

test('G3 rejects malformed flags and refuses --check before relocation', () => {
  for (const args of [
    ['--apply', '--unknown'],
    ['--apply', '--check', '--stage', 'G3'],
    ['--dry-run', '--stage', 'G2'],
  ]) {
    const response = spawnSync(
      process.execPath,
      ['scripts/architecture/relocate-api-grouping-g3.mjs', ...args],
      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(response.status, 0);
  }

  if (!completed()) {
    const response = spawnSync(
      process.execPath,
      [
        'scripts/architecture/relocate-api-grouping-g3.mjs',
        '--check',
        '--stage',
        'G3',
      ],
      { cwd: root, encoding: 'utf8' }
    );

    assert.notEqual(response.status, 0);
  }
});

//===================================================================

test('G3 retains all 14 CLI names, command options and paths', () => {
  assert.equal(entrypoints.commands.length, 14);

  const scripts = json('apps/api/package.json').scripts;

  for (const entry of entrypoints.commands) {
    const m = moves.find((x) => x.from === entry.target);

    assert(m, `Missing command target: ${entry.target}`);

    const oldPart = `src/scripts/${path.posix.basename(m.from)}`;
    const newPart = `src/scripts/${m.to.slice('apps/api/src/scripts/'.length)}`;

    const expected = completed()
      ? entry.executable.replace(oldPart, newPart)
      : entry.executable;

    assert.equal(scripts[entry.command], expected);
  }

  if (completed()) {
    const flat = readdirSync(absolute('apps/api/src/scripts'), {
      withFileTypes: true,
    }).filter((x) => x.isFile());

    assert.equal(flat.length, 0, 'No obsolete flat script proxies');
  }
});

//===================================================================

test('G3 preserves copy-template and demo seed filesystem roots', () => {
  const get = (name) => moves.find((x) => x.from.endsWith(`/${name}`));
  const templ = get('copy-templates.mjs');
  const seed = get('seed.ts');

  assert(templ && seed);

  const templateText = readFileSync(
    absolute(completed() ? templ.to : templ.from),
    'utf8'
  );

  const seedText = readFileSync(
    absolute(completed() ? seed.to : seed.from),
    'utf8'
  );

  if (completed()) {
    assert(templateText.includes("resolve(__dirname, '..', '..', '..')"));

    assert(
      seedText.includes("path.resolve(__dirname, '..', '..', '..', 'public'")
    );
  } else {
    assert(templateText.includes("resolve(__dirname, '..', '..')"));
    assert(seedText.includes("path.resolve(__dirname, '..', '..', 'public'"));
  }

  const canonicalApi = path.resolve(
    absolute('apps/api/src/scripts'),
    '..',
    '..'
  );

  const canonicalTemplate = path.resolve(
    path.dirname(absolute(templ.to)),
    '..',
    '..',
    '..'
  );

  const canonicalSeedPublic = path.resolve(
    path.dirname(absolute(seed.to)),
    '..',
    '..',
    '..',
    'public'
  );

  assert.equal(canonicalTemplate, canonicalApi);
  assert.equal(canonicalSeedPublic, path.join(canonicalApi, 'public'));
});

//===================================================================

test('G3 honors completed G4, leaves G5 pending and preserves historical baselines', () => {
  const g4 = plan.moves.filter((m) => m.stage === 'G4');
  const g4Done = g4.every((m) => exists(m.to) && !exists(m.from));
  const g4Pending = g4.every((m) => exists(m.from) && !exists(m.to));

  assert(g4Done || g4Pending, 'No partial G4 types relocation');

  for (const m of plan.moves.filter((x) => ['G4', 'G5'].includes(x.stage))) {
    const completedMove = m.stage === 'G4' && g4Done && !m.stable;

    assert(
      exists(completedMove ? m.to : m.from),
      `Expected G3/G4 source missing: ${m.from}`
    );

    if (!m.stable)
      assert(
        !exists(completedMove ? m.from : m.to),
        `Duplicate or premature future move: ${m.to}`
      );
  }

  for (const item of [
    'docs/architecture/grouping-g0/source-inventory.json',
    'docs/architecture/grouping-g1/expected-transformed-hashes.json',
    'docs/architecture/grouping-g2/source-fingerprints.json',
    'docs/architecture/models-m1/model-inventory.json',
    'docs/architecture/services-s1/service-relocation-map.json',
    'docs/architecture/transport-c1/transport-relocation-map.json',
  ])
    assert(exists(item));
});

//===================================================================

test('G3 template copier keeps source and dist lookup relative to API root', () => {
  if (!completed()) return;

  // An isolated temp API tree exercises the actual Node script without
  // touching project dist or any real templates.
  const temporary = mkdtempSync(path.join(tmpdir(), 'epharmacy-g3-'));

  try {
    const script = path.join(temporary, 'src/scripts/build/copy-templates.mjs');
    const template = path.join(temporary, 'src/templates/test-g3.html');

    mkdirSync(path.dirname(script), { recursive: true });
    mkdirSync(path.dirname(template), { recursive: true });
    cpSync(absolute('apps/api/src/scripts/build/copy-templates.mjs'), script);
    writeFileSync(template, '<p>G3 filesystem smoke test</p>');

    execFileSync(process.execPath, [script], { cwd: temporary, stdio: 'pipe' });

    assert.equal(
      readFileSync(path.join(temporary, 'dist/templates/test-g3.html'), 'utf8'),
      '<p>G3 filesystem smoke test</p>'
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
