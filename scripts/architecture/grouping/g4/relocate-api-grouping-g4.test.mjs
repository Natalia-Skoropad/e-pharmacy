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
  '../../../..'
);

//===================================================================

const absolute = (name) => path.join(root, name);
const read = (name) => readFileSync(absolute(name), 'utf8');

//===================================================================

// A1 adds six reviewed source imports. Preserve the G4/G5 historical baseline.
function expectedRelativeImportsAfterA1() {
  const a2Path = 'docs/architecture/middlewares-a2/approved-import-delta.json';

  if (existsSync(absolute(a2Path))) {
    const a2 = JSON.parse(read(a2Path));

    const originalA1 = JSON.parse(
      read('docs/architecture/controllers-a1/approved-import-delta.json')
    );

    assert.equal(originalA1.historicalRelativeImports, 3494);
    assert.equal(originalA1.approvedAdditions.length, 6);
    assert.equal(a2.stage, 'A2');
    assert.equal(a2.historicalAfterA1, 3500);
    assert.equal(a2.preservedHandlers, 80);
    assert.equal(a2.canonicalControllerModules, 16);

    for (const file of a2.migratedDocumentHelpers) {
      assert.match(
        read(file),
        /from ['"]\.\.\/shared\/document-attachment['"]/
      );
    }

    for (const [moduleName, expectedHash] of Object.entries(
      a2.newControllerImportHashes
    )) {
      const actualImports = [
        ...read(`apps/api/src/controllers/${moduleName}`).matchAll(
          /from ['"]([^'"]+)['"]/g
        ),
      ]
        .map((match) => match[1])
        .join('\n');

      const actualHash = createHash('sha256')
        .update(actualImports)
        .digest('hex');

      // A2 approved both exact import orders below. Swapping the HTTP_STATUS and AdminAuditListQuery
      // import declarations is formatting-only; every other import change remains rejected.
      const approvedActivityImportOrder =
        moduleName === 'admin/admin-activity.controller.ts' &&
        actualHash ===
          '34a1a83695e55aa5ad2bfb922bb3b7e2f0b75e371dd02096976dba54daccd7ca';

      assert(
        actualHash === expectedHash || approvedActivityImportOrder,
        `Unexpected A2 module import changes: ${moduleName}\n` +
          `Actual SHA-256: ${actualHash}\nExpected SHA-256: ${expectedHash}`
      );
    }

    // A5 adds exactly two tested ESM imports under newly grouped architecture paths.
    // G0/A1/A2 pins are immutable; verify every additional import explicitly.
    const a5Path =
      'docs/architecture/scripts-reorganization/approved-relative-imports.json';

    if (!existsSync(absolute(a5Path))) return a2.expectedRelativeImports;

    const approval = JSON.parse(read(a5Path));

    assert.equal(approval.stage, 'A5');
    assert.equal(approval.historicalAfterA2, a2.expectedRelativeImports);
    assert.equal(approval.approvedAdditions.length, 2);

    for (const { file, specifier } of approval.approvedAdditions) {
      assert(
        read(file).includes(`from '${specifier}'`),
        `Missing A5 ESM import: ${file}`
      );
    }

    // A8 adds one peer import for the independently tested type audit.
    // The pinned A5/G0–G6 baselines remain unchanged.
    const a8Path = 'docs/architecture/types-a8/approved-relative-imports.json';

    if (!existsSync(absolute(a8Path)))
      return a2.expectedRelativeImports + approval.approvedAdditions.length;

    const a8 = JSON.parse(read(a8Path));

    assert.equal(a8.schemaVersion, 1);
    assert.equal(a8.stage, 'A8');

    assert.equal(
      a8.historicalAfterA5,
      a2.expectedRelativeImports + approval.approvedAdditions.length
    );

    assert.deepEqual(a8.approvedAdditions, [
      {
        file: 'scripts/architecture/types/check-api-types-a8.test.mjs',
        specifier: './check-api-types-a8.mjs',
      },
    ]);

    for (const { file, specifier } of a8.approvedAdditions)
      assert(
        read(file).includes(`from '${specifier}'`),
        `Missing A8 ESM import: ${file}`
      );

    const a9Path = 'docs/architecture/utils-a9/approved-relative-imports.json';
    const afterA8 = a8.historicalAfterA5 + a8.approvedAdditions.length;

    if (!existsSync(absolute(a9Path))) return afterA8;

    const a9 = JSON.parse(read(a9Path));

    assert.equal(a9.schemaVersion, 1);
    assert.equal(a9.stage, 'A9');
    assert.equal(a9.historicalAfterA8, afterA8);

    assert.deepEqual(a9.approvedAdditions, [
      {
        file: 'scripts/architecture/utils/check-api-utils-a9.test.mjs',
        specifier: './check-api-utils-a9.mjs',
      },
    ]);

    for (const { file, specifier } of a9.approvedAdditions)
      assert(
        read(file).includes(`from '${specifier}'`),
        `Missing approved A9 test import: ${file}`
      );

    return afterA8 + a9.approvedAdditions.length;
  }

  const deltaPath =
    'docs/architecture/controllers-a1/approved-import-delta.json';

  if (!existsSync(absolute(deltaPath))) return 3494;

  const delta = JSON.parse(read(deltaPath));

  assert.equal(delta.historicalRelativeImports, 3494);
  assert.equal(delta.stage, 'A1');
  assert.equal(delta.approvedAdditions.length, 6);

  const unique = new Set();

  for (const { file, specifier } of delta.approvedAdditions) {
    assert.equal(unique.has(file), false, `Duplicate A1 approval: ${file}`);
    unique.add(file);

    const content = read(file);

    assert(
      content.includes(`from '${specifier}'`),
      `Missing approved A1 import: ${file}`
    );
  }

  return delta.historicalRelativeImports + delta.approvedAdditions.length;
}

//===================================================================

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

const executable =
  'scripts/architecture/grouping/g4/relocate-api-grouping-g4.mjs';

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

  assert.equal(
    summary.verifiedRelativeImports,
    expectedRelativeImportsAfterA1()
  );

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

test('G4 creates no flat proxies and honors the all-or-none G5 utility stage', () => {
  const utilities = plan.moves.filter((m) => m.stage === 'G5');

  assert.equal(utilities.length, 31);

  const moved = utilities.filter((m) => !m.stable);

  const g5Done = moved.every(
    (m) => existsSync(absolute(m.to)) && !existsSync(absolute(m.from))
  );

  const g5Pending = moved.every(
    (m) => existsSync(absolute(m.from)) && !existsSync(absolute(m.to))
  );

  assert(g5Done || g5Pending, 'Partially relocated G5 utilities');

  for (const m of utilities) {
    const current = m.stable || !g5Done ? m.from : m.to;

    assert(existsSync(absolute(current)), `Missing G5 utility: ${current}`);

    if (!m.stable) assert(!existsSync(absolute(g5Done ? m.from : m.to)));
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
