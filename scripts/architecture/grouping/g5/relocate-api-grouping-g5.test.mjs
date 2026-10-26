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

    // Final cross-folder audit introduces nine explicitly reviewed module imports.
    // Approvals are restricted to the checker file and exact paths; no G0–G6
    // hashes, manifests, or prior allowances are changed.
    const afterA9 = afterA8 + a9.approvedAdditions.length;

    const finalPath =
      'docs/architecture/cross-folder-final/approved-relative-imports.json';

    if (!existsSync(absolute(finalPath))) return afterA9;

    const finalApproval = JSON.parse(read(finalPath));

    assert.equal(finalApproval.schemaVersion, 1);
    assert.equal(finalApproval.stage, 'Final');
    assert.equal(finalApproval.historicalAfterA9, afterA9);

    assert.deepEqual(
      finalApproval.approvedAdditions,
      [
        '../audits/check-api-controllers-a1.mjs',
        '../audits/check-api-middlewares-a2.mjs',
        '../audits/check-api-routes-a4.mjs',
        '../models/check-api-models-a3.mjs',
        '../constants/check-api-constants-a5.mjs',
        '../schemas/check-api-schemas-a6.mjs',
        '../scripts/check-api-scripts-a7.mjs',
        '../types/check-api-types-a8.mjs',
        '../utils/check-api-utils-a9.mjs',
        './check-api-cross-folder-final.mjs',
      ].map((specifier) => ({
        file:
          specifier === './check-api-cross-folder-final.mjs'
            ? 'scripts/architecture/final/check-api-cross-folder-final.test.mjs'
            : 'scripts/architecture/final/check-api-cross-folder-final.mjs',

        specifier,
      }))
    );

    for (const { file, specifier } of finalApproval.approvedAdditions) {
      assert(
        read(file).includes(`from '${specifier}'`),
        `Missing approved Final import: ${file} / ${specifier}`
      );
    }

    const afterFinal = afterA9 + finalApproval.approvedAdditions.length;

    const cl2Path =
      'docs/architecture/cleanup-readiness/CL2-APPROVED-IMPORTS.json';

    if (!existsSync(absolute(cl2Path))) return afterFinal;

    const cl2 = JSON.parse(read(cl2Path));

    assert.equal(cl2.schemaVersion, 1);
    assert.equal(cl2.stage, 'CL2');
    assert.equal(cl2.historicalAfterFinal, afterFinal);

    assert.deepEqual(cl2.approvedAdditions, [
      {
        file: 'scripts/architecture/maintenance/check-tool-safety-cl2.test.mjs',
        specifier: './check-tool-safety-cl2.mjs',
      },
    ]);

    for (const { file, specifier } of cl2.approvedAdditions)
      assert(
        read(file).includes(`from '${specifier}'`),
        `Missing CL2 approved import: ${file} / ${specifier}`
      );

    return afterFinal + cl2.approvedAdditions.length;
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

const digest = (value) => createHash('sha256').update(value).digest('hex');

const normalized = (value) =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

//===================================================================

const manifest = JSON.parse(
  read('docs/architecture/grouping-g0/relocation-plan.json')
);

const inventory = JSON.parse(
  read('docs/architecture/grouping-g0/source-inventory.json')
);

const pinned = JSON.parse(
  read('docs/architecture/grouping-g5/source-fingerprints.json')
);

const g6Approval = JSON.parse(
  read('docs/architecture/grouping-g6/approved-g5-formatting.json')
);

const approvedG3 = JSON.parse(
  read('docs/architecture/grouping-g5/approved-g3-after-g5.json')
);

//===================================================================

const utilities = manifest.moves.filter((x) => x.stage === 'G5');
const moves = utilities.filter((x) => !x.stable);
const stable = utilities.filter((x) => x.stable);

const tool = absolute(
  'scripts/architecture/grouping/g5/relocate-api-grouping-g5.mjs'
);

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

    const approved = completed() ? g6Approval.files[destination] : undefined;

    if (approved)
      assert.deepEqual(approved.previousG5, pinned.canonicalHashes[m.to]);

    const actualHash = digest(normalized(text));

    assert(
      actualHash === hash.normalized ||
        (approved &&
          actualHash === approved.approvedAfterG5.normalized &&
          digest(text) === approved.approvedAfterG5.raw),
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

  assert.equal(
    report.verifiedRelativeImports,
    expectedRelativeImportsAfterA1()
  );

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
