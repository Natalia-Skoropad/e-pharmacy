// Stage G4 immutable type relocation regression tests. Never mutate project sources.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const absolute = (name) => path.join(root, name);
const read = (name) => readFileSync(absolute(name), 'utf8');

const plan = JSON.parse(
  read('docs/architecture/grouping-g0/relocation-plan.json')
);

const inventory = JSON.parse(
  read('docs/architecture/grouping-g0/source-inventory.json')
);

const pinned = JSON.parse(
  read('docs/architecture/grouping-g4/source-fingerprints.json')
);

const maps = plan.moves.filter((item) => item.stage === 'G4');
const executable = 'scripts/architecture/relocate-api-grouping-g4.mjs';
const script = absolute(executable);
const digest = (data) => createHash('sha256').update(data).digest('hex');

const sourceHash = (text) =>
  digest(
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .filter(
        (line) =>
          line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
      )
      .join('\n')
  );

const isCompleted = () =>
  maps.every(
    (m) => existsSync(absolute(m.to)) && !existsSync(absolute(m.from))
  );

const isPending = () =>
  maps.every(
    (m) => existsSync(absolute(m.from)) && !existsSync(absolute(m.to))
  );

const invoke = (...args) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });

//===================================================================

test('G4 covers exactly 23 distinct immutable G0 types with canonical destinations', () => {
  assert.equal(plan.schemaVersion, 1);
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(maps.length, 23);
  assert(maps.every((m) => !m.stable));

  const original = new Set(maps.map((m) => m.from));
  const targets = new Set(maps.map((m) => m.to));

  assert.equal(original.size, 23);
  assert.equal(targets.size, 23);

  for (const m of maps) {
    assert(m.from.startsWith('apps/api/src/types/'));
    assert(m.to.startsWith('apps/api/src/types/'));

    assert.notEqual(m.from, m.to);
    assert(!m.from.includes('..') && !m.to.includes('..'));
    assert.equal(path.posix.basename(m.from), path.posix.basename(m.to));
    assert(inventory.files.some((item) => item.path === m.from));
  }

  assert(isCompleted() || isPending(), 'Reject partial G4 relocation');
});

//===================================================================

test('G4 pinned original and canonical fingerprints cover exactly the manifest', () => {
  assert.equal(pinned.schemaVersion, 1);
  assert.equal(pinned.stage, 'G4');

  assert.deepEqual(
    new Set(Object.keys(pinned.baselineHashes)),
    new Set(maps.map((m) => m.from))
  );

  assert.deepEqual(
    new Set(Object.keys(pinned.canonicalHashes)),
    new Set(maps.map((m) => m.to))
  );

  for (const m of maps) {
    const current = isCompleted() ? m.to : m.from;
    const content = read(current);

    const expected = isCompleted()
      ? pinned.canonicalHashes[m.to]
      : pinned.baselineHashes[m.from];

    assert.equal(
      sourceHash(content),
      expected.normalized,
      `Type changed: ${current}`
    );
  }
});

//===================================================================

test('G4 dry-run and completed-stage check are deterministic and read-only', () => {
  const args = isCompleted()
    ? ['--check', '--stage', 'G4']
    : ['--dry-run', '--stage', 'G4'];

  const a = invoke(...args);
  const b = invoke(...args);

  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.equal(a.stdout, b.stdout);

  const summary = JSON.parse(a.stdout);

  assert.equal(summary.status, 'PASS');
  assert.equal(summary.manifestEntries, 23);
  assert.equal(summary.obsoleteProxyFiles, 0);
  assert.equal(summary.verifiedRelativeImports, 3494);

  if (isCompleted()) {
    assert.equal(summary.selectedMoves, 0);
    assert.equal(summary.touchedFiles, 0);
  }
});

//===================================================================

test('G4 rejects unknown/ambiguous flags and check before relocation', () => {
  for (const args of [
    ['--wat'],
    ['--apply', '--check', '--stage', 'G4'],
    ['--check', '--stage', 'G2'],
    ['--dry-run', '--stage', 'G4', '--unexpected'],
  ])
    assert.notEqual(
      invoke(...args).status,
      0,
      `Accepted invalid arguments ${args}`
    );

  if (isPending())
    assert.notEqual(invoke('--check', '--stage', 'G4').status, 0);
});

//===================================================================

test('Express.Request ambient augmentation is retained at the new canonical path', () => {
  const express = maps.find((m) => m.from.endsWith('/express.ts'));

  assert(express);
  assert.equal(express.to, 'apps/api/src/types/infrastructure/express.ts');

  const text = read(isCompleted() ? express.to : express.from);
  const body = text.slice(text.indexOf("declare module 'express'"));

  assert(body.startsWith("declare module 'express'"));

  for (const field of [
    'interface Request {',
    'authSessionId?: string;',
    'adminAuthorization?: AdminAuthorization;',
    'user?: {',
    'role: UserRole;',
    'status: UserStatus;',
    'export {};',
  ])
    assert(body.includes(field));

  const config = JSON.parse(read('apps/api/tsconfig.json'));

  assert(config.include.includes('src'));

  if (isCompleted()) {
    assert(text.includes("from '../admin/access/admin-access'"));
    assert(text.includes("from '../accounts/user'"));
  }
});

//===================================================================

test('G4 creates no flat proxies and does not prematurely move G5 utilities', () => {
  const utilities = plan.moves.filter((m) => m.stage === 'G5');

  assert.equal(utilities.length, 31);

  for (const m of utilities) {
    assert(existsSync(absolute(m.from)), `Unexpected G5 change: ${m.from}`);

    if (!m.stable) assert(!existsSync(absolute(m.to)));
  }

  const directory = 'apps/api/src/types';

  const flat = readdirSync(absolute(directory), { withFileTypes: true }).filter(
    (entry) => entry.isFile()
  );

  assert.equal(flat.length, isCompleted() ? 0 : 23);
});

//===================================================================

test('G4 retains exact historical G0–G3, M1, S1 and Transport manifests', () => {
  for (const filename of [
    'docs/architecture/grouping-g0/relocation-plan.json',
    'docs/architecture/grouping-g1/expected-transformed-hashes.json',
    'docs/architecture/grouping-g2/source-fingerprints.json',
    'docs/architecture/grouping-g3/source-fingerprints.json',
    'docs/architecture/models-m1/model-inventory.json',
    'docs/architecture/services-s1/service-relocation-map.json',
    'docs/architecture/transport-c1/transport-relocation-map.json',
  ])
    assert(
      existsSync(absolute(filename)),
      `Historical baseline missing: ${filename}`
    );

  const prior = plan.moves.filter(
    (m) => ['G1', 'G2', 'G3'].includes(m.stage) && !m.stable
  );

  assert(
    prior.every(
      (m) => existsSync(absolute(m.to)) && !existsSync(absolute(m.from))
    )
  );
});
