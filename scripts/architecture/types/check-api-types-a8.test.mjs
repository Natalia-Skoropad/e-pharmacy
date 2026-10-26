import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { auditTypes, assertReadOnlyFlags } from './check-api-types-a8.mjs';

//===================================================================

const ROOT = process.cwd();

//===================================================================

const API = 'apps/api/src/types/';
const SHARED = 'packages/types/src/';

//===================================================================

const source = (file) => readFileSync(join(ROOT, file), 'utf8');

const change = (file, value) =>
  auditTypes(ROOT, { sourceOverrides: new Map([[file, value]]) });

const failures = (value) => value.errors.join('\n');

//===================================================================

test('A8 checks exactly 23 G4 modules and 77 shared type files', () => {
  const result = auditTypes(ROOT);

  assert.equal(result.status, 'PASS', failures(result));
  assert.equal(result.apiTypeFiles, 23);
  assert.equal(result.sharedTypeFiles, 77);
  assert.equal(result.totalTypeFiles, 100);
  assert.equal(result.unresolvedImports, 0);
  assert.equal(result.typeImportCycles, 0);
});

//===================================================================

test('A8 CLI accepts only explicit read-only --check', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--check', 'unknown'],
  ])
    assert.throws(() => assertReadOnlyFlags(args), /read-only/);
});

//===================================================================

test('A8 rejects a missing canonical API type', () => {
  const result = auditTypes(ROOT, { absent: [`${API}accounts/user.ts`] });

  assert.match(failures(result), /Missing type module/);
});

//===================================================================

test('A8 rejects a missing shared public DTO module', () => {
  const result = auditTypes(ROOT, {
    absent: [`${SHARED}admin/pharmacy-detail.ts`],
  });

  assert.match(failures(result), /Missing type module/);
});

//===================================================================

test('A8 rejects an unreviewed type module in either tree', () => {
  const result = auditTypes(ROOT, { added: [`${SHARED}admin/unreviewed.ts`] });

  assert.match(failures(result), /Unreviewed type module/);
});

//===================================================================

test('A8 rejects any API declaration edit against immutable G6 fingerprints', () => {
  const file = `${API}accounts/user.ts`;

  const result = change(
    file,
    source(file) + '\nexport type Unreviewed = string;\n'
  );

  assert.match(failures(result), /fingerprint drift/);
});

//===================================================================

test('A8 detects a syntax error in a shared DTO', () => {
  const file = `${SHARED}reviews/review.ts`;
  const result = change(file, source(file) + '\nexport type Broken = {\n');

  assert.match(failures(result), /Invalid TS type file/);
});

//===================================================================

test('A8 detects duplicate declarations within the same module', () => {
  const file = `${SHARED}reviews/review.ts`;

  const result = change(
    file,
    source(file) +
      '\nexport type DuplicateExample = string;\nexport type DuplicateExample = number;\n'
  );

  assert.match(failures(result), /Duplicate exported declaration/);
});

//===================================================================

test('A8 detects unresolved relative imports inside a type module', () => {
  const file = `${SHARED}reviews/review.ts`;

  const result = change(
    file,
    source(file) + "\nimport type { X } from '../does-not-exist';\n"
  );

  assert.match(failures(result), /Unresolved relative import/);
});

//===================================================================

test('A8 protects Express.Request augmentation and auth context', () => {
  const file = `${API}infrastructure/express.ts`;

  const result = change(
    file,
    source(file).replace('adminAuthorization?', 'removedAdminAuthorization?')
  );

  assert.match(failures(result), /Missing Express.Request augmentation/);
});

//===================================================================

test('A8 detects accidental import cycles within shared type modules', () => {
  const a = `${SHARED}reviews/review.ts`;
  const b = `${SHARED}reviews/payloads.ts`;

  const result = auditTypes(ROOT, {
    sourceOverrides: new Map([
      [a, source(a) + "\nimport type { Loop } from './payloads';\n"],
      [b, source(b) + "\nimport type { Loop } from './review';\n"],
    ]),
  });

  assert.match(failures(result), /Type import cycle/);
});

//===================================================================

test('A8 classifies parallel product/pharmacy review responses without merging contracts', () => {
  const result = auditTypes(ROOT);
  const groups = result.duplicateShapeGroups;

  assert.ok(
    groups.some(
      (g) =>
        g.some((n) => n.includes('ProductReviewResponseDto')) &&
        g.some((n) => n.includes('PharmacyReviewResponseDto'))
    )
  );
});

//===================================================================

test('A8 protects the shared type registry', () => {
  const p = 'docs/architecture/types-a8/type-audit-inventory.json';
  const value = JSON.parse(source(p));

  value.sharedTypeFiles.push(value.sharedTypeFiles[0]);

  const result = change(p, JSON.stringify(value));

  assert.match(failures(result), /Invalid A8 shared type registry/);
});

//===================================================================

test('A8 source audit is stable and does not alter repository files', () => {
  const p = join(ROOT, `${API}pharmacies/pharmacy.ts`);
  const before = [statSync(p).mtimeMs, source(`${API}pharmacies/pharmacy.ts`)];

  const a = auditTypes(ROOT),
    b = auditTypes(ROOT);

  assert.deepEqual(a, b);

  assert.deepEqual(
    [statSync(p).mtimeMs, source(`${API}pharmacies/pharmacy.ts`)],
    before
  );
});
