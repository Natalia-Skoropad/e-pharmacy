import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  assertReadOnlyFlags,
  auditCrossFolder,
  checkGateWiring,
  checkStageIntegration,
  checkUtilityParity,
} from './check-api-cross-folder-final.mjs';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const read = (name) => readFileSync(join(ROOT, name), 'utf8');
const packageJson = JSON.parse(read('package.json'));

//===================================================================

const verified = auditCrossFolder(ROOT);

const stage = (source, modifications) => ({ ...source, ...modifications });

//===================================================================

const report = (mutations) => {
  // Synthetic stage fixture: narrow in-memory injected failures only.
  const baseline = {
    A1: {
      status: 'PASS',
      controllerFiles: 29,
      silentAuthenticationReturns: 22,
    },

    A2: { status: 'PASS', middlewareFiles: 12 },

    A3: {
      status: 'PASS',
      registeredModels: 27,
      schemaDeclarations: 41,
      explicitIndexDeclarations: 91,
      unresolvedRefs: 0,
    },

    A4: {
      status: 'PASS',
      methodRegistrations: 159,
      mountedEndpoints: 190,
      routerMounts: 13,
      controllerEarlyReturns: 22,
      guardedEarlyReturns: 22,
      danglingHandlerImports: 0,
    },

    A5: {
      status: 'PASS',
      constantFiles: 35,
      seedCategories: [
        'medicine',
        'vitamins',
        'beauty',
        'hygiene',
        'medical_devices',
      ],
    },

    A6: { status: 'PASS', schemaFiles: 50 },
    A7: { status: 'PASS', canonicalScripts: 14, diagnosticWriteCalls: 0 },

    A8: {
      status: 'PASS',
      totalTypeFiles: 100,
      unresolvedImports: 0,
      typeImportCycles: 0,
    },

    A9: {
      status: 'PASS',
      totalUtilityFiles: 56,
      unresolvedImports: 0,
      importCycles: 0,
      topLevelSideEffectViolations: 0,
    },
  };

  for (const [key, changes] of Object.entries(mutations))
    baseline[key] = stage(baseline[key], changes);

  return baseline;
};

//===================================================================

test('Final checker composes all nine audited domains without changing G0–G6', () => {
  assert.equal(verified.status, 'PASS', JSON.stringify(verified.errors));
  assert.equal(verified.checkedAudits, 9);
  assert.equal(verified.routerEndpoints, 190);
  assert.equal(verified.guardedControllerEarlyReturns, 22);
});

//===================================================================

test('Final CLI is strictly read-only and fails closed on ambiguous or write modes', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const flags of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--check', '--stage', 'Final'],
  ]) {
    assert.throws(() => assertReadOnlyFlags(flags));
  }
});

//===================================================================

test('Cross-audit fails if a domain stage is absent, failed, or its registry count drifted', () => {
  assert.equal(checkStageIntegration(report({})).length, 0);

  for (const changes of [
    { A3: { status: 'FAIL' } },
    { A5: { constantFiles: 36 } },
    { A7: { canonicalScripts: 13 } },
  ])
    assert.notEqual(checkStageIntegration(report(changes)).length, 0);

  const missing = report({});

  delete missing.A6;

  assert.notEqual(checkStageIntegration(missing).length, 0);
});

//===================================================================

test('Cross-audit detects unauthenticated identity returns, changed aliases, and missing controllers', () => {
  for (const changes of [
    { A4: { guardedEarlyReturns: 21 } },
    { A4: { mountedEndpoints: 159 } },
    { A4: { danglingHandlerImports: 1 } },
  ])
    assert.notEqual(checkStageIntegration(report(changes)).length, 0);
});

//===================================================================

test('Cross-audit protects Mongo indexes, refs, shared imports and product-category seeds', () => {
  for (const changes of [
    { A3: { explicitIndexDeclarations: 90 } },
    { A3: { unresolvedRefs: 1 } },
    { A8: { typeImportCycles: 1 } },
    { A9: { unresolvedImports: 1 } },
    { A5: { seedCategories: ['medicine', 'other'] } },
  ])
    assert.notEqual(checkStageIntegration(report(changes)).length, 0);
});

//===================================================================

test('Cross-audit rejects diagnostic writes or module initialization side effects', () => {
  assert.notEqual(
    checkStageIntegration(report({ A7: { diagnosticWriteCalls: 1 } })).length,
    0
  );

  assert.notEqual(
    checkStageIntegration(report({ A9: { topLevelSideEffectViolations: 1 } }))
      .length,
    0
  );
});

//===================================================================

test('Staged deployment and final wrapper require each canonical check/test command', () => {
  assert.deepEqual(checkGateWiring(packageJson), []);

  const scripts = { ...packageJson.scripts };

  delete scripts['test:utils-a9'];

  assert.match(checkGateWiring({ scripts }).join('\n'), /utils-a9/);

  const withoutFinal = {
    ...packageJson.scripts,
    'check:before-deploy:staged': 'pnpm check:grouping-g6',
  };

  assert.match(
    checkGateWiring({ scripts: withoutFinal }).join('\n'),
    /omits check:cross-folder-final/
  );

  const withoutFull = {
    ...packageJson.scripts,
    'check:architecture:final': 'pnpm check:cross-folder-final',
  };

  assert.match(
    checkGateWiring({ scripts: withoutFull }).join('\n'),
    /full original G6 Gate/
  );
});

//===================================================================

test('Both slug-ID implementations agree on Unicode and invalid-ID behavior', () => {
  const parity = checkUtilityParity(ROOT);

  assert.equal(parity.slugCases, 11);
  assert.deepEqual(parity.errors, []);

  const file = 'apps/api/src/utils/catalog/public-slug-id.ts';
  const original = read(file);
  const modified = original.replace("product: 'pr'", "product: 'XX'");

  assert.notEqual(modified, original);

  assert.match(
    checkUtilityParity(ROOT, new Map([[file, modified]])).errors.join('\n'),
    /Slug result drift/
  );
});

//===================================================================

test('Both working-hours validators agree across boundaries and rejected entries', () => {
  const parity = checkUtilityParity(ROOT);

  assert.equal(parity.hoursCases, 25);
  assert.deepEqual(parity.errors, []);

  const file = 'apps/api/src/utils/validation/working-hours.ts';
  const original = read(file);

  const modified = original.replace(
    "return 'duplicate-days'",
    "return 'format'"
  );

  assert.notEqual(modified, original);

  assert.match(
    checkUtilityParity(ROOT, new Map([[file, modified]])).errors.join('\n'),
    /Working-hours validator drift/
  );
});

//===================================================================

test('Runtime parity evaluator blocks new imports and unsafe globals in isolated sources', () => {
  const file = 'apps/api/src/utils/catalog/public-slug-id.ts';
  const modified = read(file) + '\nimport "node:fs";\n';

  assert.match(
    checkUtilityParity(ROOT, new Map([[file, modified]])).errors.join('\n'),
    /import-free/
  );

  const other = read(file) + '\nconst bad = process.env.MONGODB_URI;\n';

  assert.match(
    checkUtilityParity(ROOT, new Map([[file, other]])).errors.join('\n'),
    /Unsafe runtime dependency/
  );
});

//===================================================================

test('Final audit is deterministic and never modifies model, route, or historical manifest sources', () => {
  const targets = [
    'apps/api/src/models/pharmacies/pharmacy.model.ts',
    'apps/api/src/routes/admin/admin.routes.ts',
    'docs/architecture/grouping-g0/relocation-plan.json',
    'docs/architecture/grouping-g6/canonical-source-fingerprints.json',
  ];

  const hash = (s) => createHash('sha256').update(s).digest('hex');
  const before = targets.map((f) => hash(read(f)));
  const a = auditCrossFolder(ROOT);
  const b = auditCrossFolder(ROOT);

  assert.deepEqual(a, b);

  assert.deepEqual(
    targets.map((f) => hash(read(f))),
    before
  );
});
