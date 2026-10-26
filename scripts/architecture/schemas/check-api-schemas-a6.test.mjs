import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

// URL-based loading avoids adding a synthetic source-tree import to historical G4/G5 counters.
const { auditSchemas, assertReadOnlyFlags } = await import(
  new URL('./check-api-schemas-a6.mjs', import.meta.url)
);

//===================================================================

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const PREFIX = 'apps/api/src/schemas/';
const read = (file) => readFileSync(join(ROOT, file), 'utf8');

//===================================================================

const variant = (file, transform) =>
  auditSchemas(ROOT, {
    sourceOverrides: new Map([[file, transform(read(file))]]),
  });

//===================================================================

const core = `${PREFIX}shared/shared-validation.schema.ts`;
const category = `${PREFIX}catalog/product-category.schema.ts`;
const products = `${PREFIX}catalog/product-request.schema.ts`;
const cases = `${PREFIX}contracts/validation-contract-cases.json`;

//===================================================================

test('A6 pins all 50 G2 schemas, source/test counts and 70 shared cases', () => {
  const result = auditSchemas(ROOT);

  assert.equal(result.status, 'PASS', result.errors.join('\n'));
  assert.equal(result.schemaFiles, 50);

  assert.equal(
    result.codeFiles + result.contractTestFiles + result.jsonFiles,
    50
  );

  assert.equal(result.contractCases, 70);
  assert.equal(result.unresolvedRelativeImports, 0);
  assert(result.exportedDeclarations >= 200);
});

//===================================================================

test('A6 classifies four exact validator compositions as review candidates, not automatic merges', () => {
  const result = auditSchemas(ROOT);

  assert.equal(result.exactExpressionDuplicateGroups, 4);

  const descriptions = result.duplicateCandidates
    .map((group) => group.join('|'))
    .join('\n');

  assert.match(descriptions, /adminEmployeePrivateNotesQuerySchema/);
  assert.match(descriptions, /createPharmacyOwnerAdminCommentSchema/);
  assert.match(descriptions, /moderateProductReviewSchema/);
  assert.match(descriptions, /createProductReviewSchema/);
  assert.equal(result.status, 'PASS');
});

//===================================================================

test('A6 CLI is read-only and refuses implicit, apply, dry-run and unknown flags', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const flags of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--help'],
  ])
    assert.throws(() => assertReadOnlyFlags(flags), /read-only/);
});

//===================================================================

test('A6 detects unexpected schema files, missing files and old flat proxies', () => {
  assert.match(
    auditSchemas(ROOT, {
      extraPaths: [`${PREFIX}legacy-proxy.ts`],
    }).errors.join('\n'),
    /Unexpected schema file/
  );

  assert.match(
    auditSchemas(ROOT, {
      missingPaths: [`${PREFIX}cart/cart.schema.ts`],
    }).errors.join('\n'),
    /Missing G2 schema/
  );
});

//===================================================================

test('A6 rejects a missing canonical shared validator', () => {
  const result = variant(core, (text) =>
    text.replace('export const sharedEmailSchema', 'const sharedEmailSchema')
  );

  assert.match(
    result.errors.join('\n'),
    /Missing canonical shared validator: sharedEmailSchema/
  );
});

//===================================================================

test('A6 catches an accidental weakened validator through immutable G6 signatures', () => {
  const result = variant(core, (text) =>
    text.replace('.max(USER_EMAIL_MAX_LENGTH', '.min(USER_EMAIL_MAX_LENGTH')
  );

  assert.match(
    result.errors.join('\n'),
    /Historical G6 schema fingerprint drift/
  );
});

//===================================================================

test('A6 finds broken schema-to-schema relative imports', () => {
  const file = `${PREFIX}pharmacies/pharmacy-note.schema.ts`;

  const result = variant(file, (text) =>
    text.replace("from '../shared/index'", "from '../shared/missing'")
  );

  assert.match(result.errors.join('\n'), /Unresolved relative schema import/);
});

//===================================================================

test('A6 rejects a TypeScript syntax regression', () => {
  const result = variant(
    category,
    (text) => text + '\nexport const broken = z.object({;\n'
  );

  assert.match(result.errors.join('\n'), /TypeScript syntax errors/);
});

//===================================================================

test('A6 rejects duplicate schema exports', () => {
  const result = variant(
    category,
    (text) => text + '\nexport const productCategorySlugSchema = z.string();\n'
  );

  assert.match(result.errors.join('\n'), /Duplicate export declarations/);
});

//===================================================================

test('A6 protects canonical, DB-backed product categories from persisted Other', () => {
  const result = variant(
    category,
    (text) => text + "\nconst category = {slug: 'other'};\n"
  );

  assert.match(
    result.errors.join('\n'),
    /Disallowed persisted Other product category/
  );

  const request = variant(
    products,
    (text) => text + "\nconst categories = z.enum(['other']);\n"
  );

  assert.match(
    request.errors.join('\n'),
    /Disallowed persisted Other product category/
  );
});

//===================================================================

test('A6 keeps client segments independent of actual product category slugs', () => {
  const source = read(`${PREFIX}clients/client.schema.ts`);

  assert.match(source, /'other'/);
  assert.equal(auditSchemas(ROOT).status, 'PASS');
});

//===================================================================

test('A6 rejects duplicated or malformed cross-package validation matrix cases', () => {
  const result = variant(cases, (text) => {
    const document = JSON.parse(text);

    document.cases[1].id = document.cases[0].id;

    return JSON.stringify(document);
  });

  assert.match(result.errors.join('\n'), /case uniqueness drift/);

  const malformed = variant(cases, (text) => {
    const document = JSON.parse(text);

    delete document.cases[0].contract;

    return JSON.stringify(document);
  });

  assert.match(malformed.errors.join('\n'), /malformed case entries/);
});

//===================================================================

test('A6 requires both product and pharmacy review contract tests', () => {
  const file = `${PREFIX}reviews/review-validation.contract.test.ts`;

  const result = variant(file, (text) =>
    text.replaceAll('createPharmacyReviewSchema', 'unverifiedReviewSchema')
  );

  assert.match(
    result.errors.join('\n'),
    /Missing product\/pharmacy review behavior parity test/
  );
});

//===================================================================

test('A6 does not mutate production schemas or historical G2/G6 manifests', () => {
  const files = [
    core,
    category,
    products,
    cases,
    'docs/architecture/grouping-g0/relocation-plan.json',
    'docs/architecture/grouping-g6/canonical-source-fingerprints.json',
  ];

  const snapshot = files.map(read);

  assert.equal(auditSchemas(ROOT).status, 'PASS');
  assert.deepEqual(files.map(read), snapshot);
});
