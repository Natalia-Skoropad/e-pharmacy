import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);

const { analyzeModels, assertReadOnlyCheckFlags } = await import(
  pathToFileURL(path.join(root, 'scripts/architecture/check-api-models-a3.mjs'))
    .href
);

const original = analyzeModels(root);

const MODEL_SCOPE = 'apps/api/src/models/';

//===================================================================

// Overlay source changes in memory. These tests never create, modify, copy or
// recursively remove files in the host filesystem (notably on Windows).
function modifiedModel(relative, before, after) {
  const name = MODEL_SCOPE + relative;
  const source = readFileSync(path.join(root, name), 'utf8');

  assert(source.includes(before), `Mutation anchor missing: ${relative}`);

  return {
    sourceOverrides: new Map([[name, source.replace(before, after)]]),
  };
}

//===================================================================

test('A3 matches M1 registry, index and schema invariants', () => {
  assert.equal(original.status, 'PASS');
  assert.equal(original.modelFiles, 27);
  assert.equal(original.modelTestFiles, 3);
  assert.equal(original.registeredModels, 27);
  assert.equal(original.schemaDeclarations, 41);
  assert.equal(original.explicitIndexDeclarations, 91);
  assert.equal(original.inlineIndexDeclarations, 54);
  assert.equal(original.modelRefs, 69);
  assert.equal(original.unresolvedRefs, 0);
  assert.equal(original.duplicateIndexDefinitions, 0);
  assert.equal(original.intentionallyMirroredReviewFields, 8);
});

//===================================================================

test('A3 CLI is read-only and rejects write or ambiguous flags', () => {
  assert.doesNotThrow(() => assertReadOnlyCheckFlags(['--check']));

  for (const flags of [
    ['--apply'],
    ['--dry-run'],
    ['--check', '--check'],
    [],
    ['--check', '--apply'],
    ['--unknown'],
  ]) {
    assert.throws(
      () => assertReadOnlyCheckFlags(flags),
      /A3 is read-only; only --check is supported/
    );
  }
});

//===================================================================

test('A3 rejects unexpected model files or reintroduced legacy model proxies', () => {
  assert.throws(
    () =>
      analyzeModels(root, {
        extraPaths: [MODEL_SCOPE + 'unplanned.model.ts'],
      }),
    /unexpected, duplicate or missing model/
  );

  // Virtual path presence exercises the exact legacy-path guard without writes.
  const legacy = MODEL_SCOPE + 'user.model.ts';

  assert.throws(
    () =>
      analyzeModels(root, {
        virtualExistingPaths: new Set([legacy]),
      }),
    /Legacy model path\/proxy/
  );
});

//===================================================================

test('A3 rejects duplicate model registration and missing schema declarations', () => {
  const fixture = modifiedModel(
    'reviews/pharmacyReview.model.ts',
    "'PharmacyReview', pharmacyReviewSchema",
    "'ProductReview', pharmacyReviewSchema"
  );

  assert.throws(
    () => analyzeModels(root, fixture),
    /Duplicate model registration/
  );
});

//===================================================================

test('A3 rejects an invalid ref and retains strict model-to-model links', () => {
  const fixture = modifiedModel(
    'reviews/productReview.model.ts',
    "ref: 'Product'",
    "ref: 'MissingProduct'"
  );

  assert.throws(
    () => analyzeModels(root, fixture),
    /Unresolved ref 'MissingProduct'/
  );
});

//===================================================================

test('A3 detects a missing index and duplicated schema index keys', () => {
  const index = 'productReviewSchema.index({ status: 1, createdAt: -1 });';

  assert.throws(
    () =>
      analyzeModels(
        root,

        modifiedModel(
          'reviews/productReview.model.ts',
          index,
          '// removed one index'
        )
      ),
    /index declaration count must remain 91/
  );

  assert.throws(
    () =>
      analyzeModels(
        root,

        modifiedModel(
          'reviews/productReview.model.ts',
          index,
          'productReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });'
        )
      ),
    /Duplicate explicit index keys/
  );
});

//===================================================================

test('A3 protects moderator uniqueness and pharmacy idempotency scopes', () => {
  const fixture = modifiedModel(
    'reviews/pharmacyReview.model.ts',
    'status: { $in: [...ACTIVE_REVIEW_STATUSES] }',
    'status: { $in: [...INACTIVE_REVIEW_STATUSES] }'
  );

  assert.throws(
    () => analyzeModels(root, fixture),
    /critical Mongo contract missing/
  );
});

//===================================================================

test('A3 detects validation drift in intentionally parallel review fields', () => {
  const fixture = modifiedModel(
    'reviews/productReview.model.ts',
    "'Moderation reason must be at most 300 characters'",
    "'Moderation reason must be at most 301 characters'"
  );

  assert.throws(
    () => analyzeModels(root, fixture),
    /Review validation parity drift: moderationReason/
  );
});

//===================================================================

test('A3 does not rewrite any model source or historical baseline', () => {
  const before = readFileSync(
    path.join(root, 'apps/api/src/models/pharmacies/pharmacy.model.ts'),
    'utf8'
  );

  const history = readFileSync(
    path.join(root, 'docs/architecture/models-m1/model-inventory.json'),
    'utf8'
  );

  analyzeModels(root);

  assert.equal(
    readFileSync(
      path.join(root, 'apps/api/src/models/pharmacies/pharmacy.model.ts'),
      'utf8'
    ),

    before
  );

  assert.equal(
    readFileSync(
      path.join(root, 'docs/architecture/models-m1/model-inventory.json'),
      'utf8'
    ),

    history
  );
});
