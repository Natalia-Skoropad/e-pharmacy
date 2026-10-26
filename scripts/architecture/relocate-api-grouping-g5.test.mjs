// G5 regression gate: read-only verification of canonical utility relocation.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const absolute = (name) => path.join(root, name);
const read = (name) => readFileSync(absolute(name), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');

const normalized = (value) =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

const manifest = JSON.parse(
  read('docs/architecture/grouping-g0/relocation-plan.json')
);

const inventory = JSON.parse(
  read('docs/architecture/grouping-g0/source-inventory.json')
);

const pinned = JSON.parse(
  read('docs/architecture/grouping-g5/source-fingerprints.json')
);

const approvedG3 = JSON.parse(
  read('docs/architecture/grouping-g5/approved-g3-after-g5.json')
);

const utilities = manifest.moves.filter((x) => x.stage === 'G5');
const moves = utilities.filter((x) => !x.stable);
const stable = utilities.filter((x) => x.stable);
const tool = absolute('scripts/architecture/relocate-api-grouping-g5.mjs');

const invoke = (...args) =>
  spawnSync(process.execPath, [tool, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });

const completed = () =>
  moves.every(
    (x) => existsSync(absolute(x.to)) && !existsSync(absolute(x.from))
  );

const pending = () =>
  moves.every(
    (x) => existsSync(absolute(x.from)) && !existsSync(absolute(x.to))
  );

//===================================================================

test('G5 immutable G0 plan groups 31 utilities: 30 moves and one stable validator', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(utilities.length, 31);
  assert.equal(moves.length, 30);
  assert.equal(stable.length, 1);

  assert.equal(
    stable[0].from,
    'apps/api/src/utils/validation/working-hours.ts'
  );

  assert.equal(stable[0].from, stable[0].to);
  assert(existsSync(absolute(stable[0].from)));
  assert.equal(new Set(moves.map((x) => x.to)).size, 30);
  assert.equal(new Set(moves.map((x) => x.from)).size, 30);

  for (const m of utilities) {
    assert(m.from.startsWith('apps/api/src/utils/'));
    assert(m.to.startsWith('apps/api/src/utils/'));
    assert.equal(path.posix.basename(m.from), path.posix.basename(m.to));
    assert(inventory.files.some((v) => v.path === m.from));
  }

  assert(completed() || pending(), 'Partial G5 relocation');
});

//===================================================================

test('G5 pinned original and transformed source fingerprints are exact', () => {
  assert.equal(pinned.schemaVersion, 1);
  assert.equal(pinned.stage, 'G5');

  assert.deepEqual(
    new Set(Object.keys(pinned.baselineHashes)),
    new Set(utilities.map((x) => x.from))
  );

  assert.deepEqual(
    new Set(Object.keys(pinned.canonicalHashes)),
    new Set(utilities.map((x) => x.to))
  );

  for (const m of utilities) {
    const destination = m.stable || pending() ? m.from : m.to;
    const text = read(destination);

    const hash =
      m.stable || pending()
        ? pinned.baselineHashes[m.from]
        : pinned.canonicalHashes[m.to];

    assert.equal(
      digest(normalized(text)),
      hash.normalized,
      `Unexpected source drift: ${destination}`
    );
  }
});

//===================================================================

test('G5 dry-run or applied check is deterministic, read-only and resolves imports', () => {
  const args = completed()
    ? ['--check', '--stage', 'G5']
    : ['--dry-run', '--stage', 'G5'];

  const first = invoke(...args);
  const second = invoke(...args);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);

  const report = JSON.parse(first.stdout);

  assert.equal(report.status, 'PASS');
  assert.equal(report.manifestEntries, 30);
  assert.equal(report.verifiedRelativeImports, 3494);
  assert.equal(report.obsoleteProxyFiles, 0);

  if (completed()) {
    assert.equal(report.selectedMoves, 0);
    assert.equal(report.touchedFiles, 0);
  } else {
    assert.equal(report.selectedMoves, 30);
    assert.equal(report.projectedMoved, 30);
  }
});

//===================================================================

test('G5 refuses unknown flags, multiple modes and premature --check', () => {
  const inputs = [
    ['--apply', '--check', '--stage', 'G5'],
    ['--wat'],
    ['--check', '--stage', 'G4'],
    ['--dry-run', '--stage', 'G5', '--unexpected'],
  ];
  for (const args of inputs)
    assert.notEqual(invoke(...args).status, 0, `Accepted bad flags: ${args}`);

  if (pending()) assert.notEqual(invoke('--check', '--stage', 'G5').status, 0);
});

//===================================================================

test('G5 removes flat utility proxies while preserving the stable working-hours validator', () => {
  const flat = readdirSync(absolute('apps/api/src/utils'), {
    withFileTypes: true,
  }).filter((x) => x.isFile());

  assert.equal(flat.length, completed() ? 0 : 30);

  for (const m of moves) {
    assert(existsSync(absolute(completed() ? m.to : m.from)));
    assert(!existsSync(absolute(completed() ? m.from : m.to)));
  }

  assert(
    existsSync(absolute('apps/api/src/utils/validation/working-hours.ts'))
  );
});

//===================================================================

test('G5 preserves exact G3 script approvals and M1/G1–G4 historical maps', () => {
  assert.equal(approvedG3.schemaVersion, 1);
  assert.equal(approvedG3.stage, 'G5');
  assert.equal(Object.keys(approvedG3.files).length, 5);

  for (const [name, values] of Object.entries(approvedG3.files)) {
    if (!completed()) continue;

    assert.equal(
      digest(normalized(read(name))),
      values.normalized,
      `G3 changed after G5: ${name}`
    );
  }

  for (const old of [
    'docs/architecture/grouping-g0/relocation-plan.json',
    'docs/architecture/grouping-g1/expected-transformed-hashes.json',
    'docs/architecture/grouping-g2/source-fingerprints.json',
    'docs/architecture/grouping-g3/source-fingerprints.json',
    'docs/architecture/grouping-g4/source-fingerprints.json',
    'docs/architecture/models-m1/model-inventory.json',
    'docs/architecture/services-s1/service-relocation-map.json',
    'docs/architecture/transport-c1/transport-relocation-map.json',
  ])
    assert(existsSync(absolute(old)), `Historical baseline lost: ${old}`);

  for (const m of manifest.moves.filter(
    (x) => ['G1', 'G2', 'G3', 'G4'].includes(x.stage) && !x.stable
  )) {
    assert(
      existsSync(absolute(m.to)) && !existsSync(absolute(m.from)),
      `Earlier stage moved: ${m.from}`
    );
  }
});

//===================================================================

test('G5 does not alter public utility behavior or external script command names', () => {
  const pkg = JSON.parse(read('apps/api/package.json'));

  const baseline = JSON.parse(
    read('docs/architecture/grouping-g0/script-entrypoints.json')
  ).commands;

  assert.equal(baseline.length, 14);

  for (const c of baseline) assert(typeof pkg.scripts[c.command] === 'string');

  assert(
    read(
      completed()
        ? 'apps/api/src/utils/auth/password-reset-url.ts'
        : 'apps/api/src/utils/password-reset-url.ts'
    ).includes("new URL('/reset-password', appUrl)")
  );

  assert(
    read(
      completed()
        ? 'apps/api/src/utils/http/httpError.ts'
        : 'apps/api/src/utils/httpError.ts'
    ).includes('HttpError')
  );
});
