import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { auditUtils, assertReadOnlyFlags } from './check-api-utils-a9.mjs';

//===================================================================

const ROOT = process.cwd();

//===================================================================

const API = 'apps/api/src/utils/';
const SHARED = 'packages/utils/src/';

//===================================================================

const read = (file) => readFileSync(join(ROOT, file), 'utf8');

const changed = (file, value) =>
  auditUtils(ROOT, { sourceOverrides: new Map([[file, value]]) });

const failures = (result) => result.errors.join('\n');

//===================================================================

test('A9 covers all 31 G5 API utilities and 25 shared utility modules', () => {
  const result = auditUtils(ROOT);

  assert.equal(result.status, 'PASS', failures(result));
  assert.equal(result.apiUtilityFiles, 31);
  assert.equal(result.sharedUtilityFiles, 25);
  assert.equal(result.totalUtilityFiles, 56);
  assert.equal(result.unresolvedImports, 0);
  assert.equal(result.importCycles, 0);
  assert.equal(result.sharedPublicEntrypoints, 7);
});

//===================================================================

test('A9 is strictly read-only and refuses ambiguous or write CLI modes', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['anything'],
  ])
    assert.throws(() => assertReadOnlyFlags(args), /read-only/);
});

//===================================================================

test('A9 rejects a missing canonical API utility', () => {
  assert.match(
    failures(auditUtils(ROOT, { absent: [`${API}http/httpError.ts`] })),
    /Missing canonical utility/
  );
});

//===================================================================

test('A9 rejects a missing shared module and unreviewed files', () => {
  assert.match(
    failures(
      auditUtils(ROOT, { absent: [`${SHARED}date/date-formatters.ts`] })
    ),
    /Missing canonical utility/
  );

  assert.match(
    failures(auditUtils(ROOT, { added: [`${SHARED}unreviewed.ts`] })),
    /Unreviewed utility file/
  );
});

//===================================================================

test('A9 protects immutable G6 utility code against accidental edits', () => {
  const file = `${API}auth/password-reset-url.ts`;

  assert.match(
    failures(changed(file, read(file) + '\nexport const drift = true;\n')),
    /fingerprint drift/
  );
});

//===================================================================

test('A9 rejects TypeScript syntax regressions in shared helpers', () => {
  const file = `${SHARED}guards/record.ts`;

  assert.match(
    failures(changed(file, read(file) + '\nexport function broken( {\n')),
    /Invalid TypeScript utility/
  );
});

//===================================================================

test('A9 rejects duplicate exported functions in one shared module', () => {
  const file = `${SHARED}guards/record.ts`;

  assert.match(
    failures(
      changed(
        file,
        read(file) +
          '\nexport function duplicated() {}\nexport function duplicated() {}\n'
      )
    ),
    /Duplicate exported function/
  );
});

//===================================================================

test('A9 finds broken relative imports', () => {
  const file = `${SHARED}guards/record.ts`;

  assert.match(
    failures(
      changed(file, read(file) + "\nimport { Missing } from './missing';\n")
    ),
    /Unresolved relative utility import/
  );
});

//===================================================================

test('A9 detects a cycle within shared utils', () => {
  const one = `${SHARED}guards/is-abort-error.ts`;
  const two = `${SHARED}guards/record.ts`;

  const result = auditUtils(ROOT, {
    sourceOverrides: new Map([
      [one, read(one) + "\nimport type { Loop } from './record';\n"],
      [two, read(two) + "\nimport type { Loop } from './is-abort-error';\n"],
    ]),
  });

  assert.match(failures(result), /Utility import cycle/);
});

//===================================================================

test('A9 prevents application and IO dependencies inside shared utils', () => {
  const file = `${SHARED}guards/record.ts`;

  assert.match(
    failures(
      changed(
        file,
        read(file) + "\nimport { authenticate } from '@e-pharmacy/auth';\n"
      )
    ),
    /backend or IO dependency/
  );
});

//===================================================================

test('A9 prevents unreviewed module initialization side effects', () => {
  const file = `${SHARED}guards/record.ts`;

  assert.match(
    failures(changed(file, read(file) + '\nprocess.exit(0);\n')),
    /Top-level side effect/
  );
});

//===================================================================

test('A9 protects the reviewed public utility package entrypoints', () => {
  const file = 'packages/utils/package.json';
  const packageJson = JSON.parse(read(file));

  delete packageJson.exports['./guards'];

  assert.match(
    failures(changed(file, JSON.stringify(packageJson))),
    /public entrypoint/
  );
});

//===================================================================

test('A9 maintains pharmacy capability checks inside backend-only utility adapter', () => {
  const file = `${API}pharmacies/pharmacyAccess.ts`;

  assert.match(
    failures(
      changed(
        file,
        read(file).replaceAll('requirePharmacyCapability', 'removedCapability')
      )
    ),
    /capability authorization/
  );
});

//===================================================================

test('A9 identifies two backend/shared-validation overlaps for domain review', () => {
  const names = auditUtils(ROOT)
    .overlappingExportNames.map((item) => item.symbol)
    .sort();

  assert.deepEqual(names, [
    'buildPublicEntitySlugId',
    'getWorkingHoursValidationIssue',
  ]);
});

//===================================================================

test('A9 inventory is pinned and rejects edits to shared file list', () => {
  const file = 'docs/architecture/utils-a9/utils-audit-inventory.json';
  const inventory = JSON.parse(read(file));

  inventory.sharedUtilityFiles.push(inventory.sharedUtilityFiles[0]);

  assert.match(
    failures(changed(file, JSON.stringify(inventory))),
    /inventory differs/
  );
});

//===================================================================

test('A9 audit is deterministic and never changes production files', () => {
  const file = `${API}validation/regexp.ts`;
  const before = [statSync(join(ROOT, file)).mtimeMs, read(file)];

  assert.deepEqual(auditUtils(ROOT), auditUtils(ROOT));
  assert.deepEqual([statSync(join(ROOT, file)).mtimeMs, read(file)], before);
});
