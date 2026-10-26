#!/usr/bin/env node
// Stage A3: read-only, AST-based validation of Mongo model ownership and indexes.
// Do not run migrations or access MongoDB from this checker.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const SCOPE = 'apps/api/src/models/';
const MANIFEST = 'docs/architecture/models-m1/model-relocation-map.json';
const INVENTORY = 'docs/architecture/models-m1/model-inventory.json';

//===================================================================

function enumerate(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);

    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) return enumerate(full, relative);

    return entry.isFile() && relative.endsWith('.ts') ? [relative] : [];
  });
}

//===================================================================

const unwrap = (value) => {
  while (ts.isAsExpression(value) || ts.isParenthesizedExpression(value))
    value = value.expression;

  return value;
};

//===================================================================

function valueName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node)) return node.text;

  return node.getText();
}

//===================================================================

function staticRefValues(node) {
  const refs = [];

  const visit = (child) => {
    if (ts.isPropertyAssignment(child) && valueName(child.name) === 'ref') {
      const value = unwrap(child.initializer);

      assert(
        ts.isStringLiteral(value),
        `Nonliteral model ref: ${child.getText()}`
      );

      refs.push(value.text);
    }

    ts.forEachChild(child, visit);
  };

  visit(node);

  return refs;
}

//===================================================================

// Optional in-memory fixtures are for mutation tests only. Production CLI calls
// this function without fixtures and always reads the canonical on-disk tree.
export function analyzeModels(root = REPO, fixture = undefined) {
  const extraPaths = fixture?.extraPaths ?? [];
  const virtualExistingPaths = fixture?.virtualExistingPaths ?? new Set();
  const sourceOverrides = fixture?.sourceOverrides ?? new Map();

  const readModelSource = (file) =>
    sourceOverrides.get(file) ?? readFileSync(path.join(root, file), 'utf8');

  const expected = JSON.parse(readFileSync(path.join(root, MANIFEST), 'utf8'));
  const baseline = JSON.parse(readFileSync(path.join(root, INVENTORY), 'utf8'));

  assert.equal(expected.schemaVersion, 1);
  assert.equal(expected.scope, SCOPE);
  assert.equal(baseline.modelCount, 27);
  assert.equal(baseline.testCount, 3);
  assert.equal(expected.moves.length, 30);

  const expectedPaths = new Set(expected.moves.map(({ to }) => to));

  const actualPaths = [
    ...enumerate(path.join(root, SCOPE)).map((name) => SCOPE + name),
    ...extraPaths,
  ].sort();

  assert.deepEqual(
    actualPaths,
    [...expectedPaths].sort(),
    'A3 rejects unexpected, duplicate or missing model files'
  );

  for (const { from, to } of expected.moves) {
    assert(existsSync(path.join(root, to)), `Missing M1 canonical model ${to}`);

    assert(
      !existsSync(path.join(root, from)) && !virtualExistingPaths.has(from),
      `Legacy model path/proxy ${from}`
    );
  }

  const files = actualPaths.filter((name) => name.endsWith('.model.ts'));
  const tests = actualPaths.filter((name) => name.endsWith('.test.ts'));

  assert.equal(files.length, 27);
  assert.equal(tests.length, 3);

  const registrations = new Map();
  const refs = [];
  const indexes = [];
  const fileStatistics = {};

  let schemaDeclarations = 0;
  let indexDeclarations = 0;
  let inlineIndexDeclarations = 0;

  for (const file of files) {
    const source = readModelSource(file);

    const ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    assert.equal(
      ast.parseDiagnostics.length,
      0,
      `Invalid TypeScript syntax in ${file}`
    );

    const names = [];

    let schemasInFile = 0;
    let indexesInFile = 0;
    let inlineInFile = 0;

    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'Schema'
      ) {
        schemasInFile++;
        schemaDeclarations++;
      }

      if (ts.isCallExpression(node)) {
        if (
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'model'
        ) {
          const first = node.arguments[0];

          assert(
            first && ts.isStringLiteral(first),
            `Model registration must have literal name in ${file}`
          );

          assert(
            !registrations.has(first.text),
            `Duplicate model registration: ${first.text}`
          );

          registrations.set(first.text, file);
          names.push(first.text);
        }

        if (
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'index'
        ) {
          indexesInFile++;
          indexDeclarations++;

          const target = node.expression.expression.getText(ast);
          const key = node.arguments[0]?.getText(ast).replace(/\s+/g, '') || '';

          assert(
            key.startsWith('{') && key.endsWith('}'),
            `Non-object index key: ${file}`
          );

          indexes.push({
            file,
            target,
            key,
            options: node.arguments[1]?.getText(ast) ?? '',
          });
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        valueName(node.name) === 'index' &&
        node.initializer.kind === ts.SyntaxKind.TrueKeyword
      ) {
        inlineInFile++;
        inlineIndexDeclarations++;
      }

      ts.forEachChild(node, visit);
    };

    visit(ast);
    refs.push(...staticRefValues(ast).map((name) => ({ file, name })));

    assert.equal(
      names.length,
      1,
      `Expected one registered model per .model.ts: ${file}`
    );

    fileStatistics[file.slice(SCOPE.length)] = {
      model: names[0],
      lines: source.split(/\r?\n/).length - Number(source.endsWith('\n')),
      schemas: schemasInFile,
      explicitIndexes: indexesInFile,
      inlineIndexes: inlineInFile,
    };
  }

  assert.equal(registrations.size, 27, 'M1 registry count must remain 27');

  assert.equal(
    schemaDeclarations,
    41,
    'M1 schema declaration count must remain 41'
  );

  assert.equal(
    indexDeclarations,
    91,
    'M1 explicit index declaration count must remain 91'
  );

  for (const { file, name } of refs)
    assert(registrations.has(name), `Unresolved ref '${name}' in ${file}`);

  const duplicateIndexes = [];
  const seenIndexes = new Map();

  for (const index of indexes) {
    const signature = `${index.file}:${index.target}:${index.key}`;

    if (seenIndexes.has(signature)) duplicateIndexes.push(index);

    seenIndexes.set(signature, true);
  }

  assert.equal(
    duplicateIndexes.length,
    0,
    'Duplicate explicit index keys in one schema'
  );

  // Detect drift in intentionally parallel review attributes without merging
  // their separate target refs, partial-unique indexes or collection names.
  const sharedReviewFields = [
    'userId',
    'userName',
    'rating',
    'comment',
    'status',
    'moderationReason',
    'moderatedBy',
    'moderatedAt',
  ];

  function reviewProperties(relative) {
    const file = path.join(root, SCOPE, relative);

    const ast = ts.createSourceFile(
      file,
      readModelSource(path.posix.join(SCOPE, relative)),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const properties = new Map();

    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'Schema' &&
        node.arguments?.[0] &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        for (const property of node.arguments[0].properties) {
          if (ts.isPropertyAssignment(property))
            properties.set(
              valueName(property.name),
              property.initializer.getText(ast).replace(/\s+/g, '')
            );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(ast);

    return properties;
  }

  const pharmacyReview = reviewProperties('reviews/pharmacyReview.model.ts');
  const productReview = reviewProperties('reviews/productReview.model.ts');

  for (const name of sharedReviewFields) {
    assert(
      pharmacyReview.has(name) && productReview.has(name),
      `Missing common review field: ${name}`
    );

    assert.equal(
      pharmacyReview.get(name),
      productReview.get(name),
      `Review validation parity drift: ${name}`
    );
  }

  // These distinct uniqueness scopes protect moderation, ownership and idempotency.
  // Fail closed on accidental removal. M1 checks the complete source separately.
  const mustContain = {
    'reviews/pharmacyReview.model.ts': [
      'pharmacyId: 1, userId: 1',
      'status: { $in: [...ACTIVE_REVIEW_STATUSES] }',
      'unique: true',
    ],

    'reviews/productReview.model.ts': [
      'productId: 1, userId: 1',
      'status: { $in: [...ACTIVE_REVIEW_STATUSES] }',
      'unique: true',
    ],

    'pharmacies/pharmacy.model.ts': [
      'creationRequestId: 1',
      'partialFilterExpression',
      'managerUserIds: 1',
    ],

    'orders/order.model.ts': [
      'managerRequestId: 1',
      'partialFilterExpression',
      'unique: true',
    ],

    'accounts/session.model.ts': ['refreshTokenHash: 1', 'expireAfterSeconds'],
    'audit/adminAuditLog.model.ts': [
      'expireAfterSeconds',
      'ADMIN_AUDIT_RETENTION_SECONDS',
    ],
  };

  for (const [suffix, fragments] of Object.entries(mustContain)) {
    const source = readModelSource(path.posix.join(SCOPE, suffix));

    for (const fragment of fragments)
      assert(
        source.includes(fragment),
        `A3 critical Mongo contract missing: ${suffix} / ${fragment}`
      );
  }

  return {
    status: 'PASS',
    stage: 'A3',
    modelFiles: files.length,
    modelTestFiles: tests.length,
    registeredModels: registrations.size,
    schemaDeclarations,
    explicitIndexDeclarations: indexDeclarations,
    inlineIndexDeclarations,
    modelRefs: refs.length,
    unresolvedRefs: 0,
    duplicateIndexDefinitions: duplicateIndexes.length,
    legacyModelFiles: 0,
    intentionallyMirroredReviewFields: sharedReviewFields.length,

    largestModels: Object.entries(fileStatistics)
      .sort((a, b) => b[1].lines - a[1].lines)
      .slice(0, 5)
      .map(([file, stat]) => ({ file, lines: stat.lines })),

    fileStatistics,
  };
}

//===================================================================

// Keep CLI validation testable in-process. Spawning several TypeScript-loading
// Node processes under node --test can exhaust Windows test-worker resources.
export function assertReadOnlyCheckFlags(flags) {
  assert(
    flags.length === 1 && flags[0] === '--check',
    'A3 is read-only; only --check is supported'
  );
}

//===================================================================

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertReadOnlyCheckFlags(process.argv.slice(2));
  console.log(JSON.stringify(analyzeModels(), null, 2));
}
