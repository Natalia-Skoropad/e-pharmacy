#!/usr/bin/env node
// A6: read-only audit of canonical G2 schemas and their public validation contracts.
// Tests inject in-memory variants; historical fingerprints are never rewritten.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const PREFIX = 'apps/api/src/schemas/';
const G0 = 'docs/architecture/grouping-g0/relocation-plan.json';
const G6 = 'docs/architecture/grouping-g6/canonical-source-fingerprints.json';

//===================================================================

const CASES = `${PREFIX}contracts/validation-contract-cases.json`;
const CATEGORY = `${PREFIX}catalog/product-category.schema.ts`;
const REQUEST = `${PREFIX}catalog/product-request.schema.ts`;
const SHARED = `${PREFIX}shared/shared-validation.schema.ts`;

//===================================================================

const sha = (value) => createHash('sha256').update(value).digest('hex');

//===================================================================

const norm = (value) =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

//===================================================================

const normalizedPath = (p) => p.split('\\').join('/');

//===================================================================

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);

    return e.isDirectory() ? walk(p) : e.isFile() ? [p] : [];
  });

//===================================================================

function resolveImport(root, owner, specifier, known, excludes) {
  const base = normalizedPath(join(dirname(owner), specifier));

  const candidates = [
    base,
    ...['.ts', '.tsx', '.json', '/index.ts', '/index.tsx'].map(
      (suffix) => base + suffix
    ),
  ];

  return candidates.find(
    (p) => !excludes.has(p) && (known.has(p) || existsSync(join(root, p)))
  );
}

//===================================================================

function isExported(node) {
  return (
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
  );
}

//===================================================================

function exportedDeclarations(sf) {
  const names = [];
  const expressions = [];

  for (const stmt of sf.statements) {
    if (!isExported(stmt)) continue;

    if (ts.isVariableStatement(stmt)) {
      for (const declaration of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;

        names.push(declaration.name.text);

        if (
          declaration.initializer &&
          declaration.getText(sf).length >= 100 &&
          /Schema|Validation/.test(declaration.name.text)
        ) {
          expressions.push({
            name: declaration.name.text,
            source: declaration.initializer.getText(sf).replace(/\s+/g, ''),
          });
        }
      }
    } else if (
      (ts.isFunctionDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isClassDeclaration(stmt)) &&
      stmt.name
    ) {
      names.push(stmt.name.text);
    }
  }

  return { names, expressions };
}

//===================================================================

export function assertReadOnlyFlags(args) {
  if (args.length !== 1 || args[0] !== '--check')
    throw new Error('A6 is read-only. Only --check is supported.');
}

//===================================================================

export function auditSchemas(root = ROOT, fixture = {}) {
  const overrides = fixture.sourceOverrides ?? new Map();
  const missingPaths = new Set(fixture.missingPaths ?? []);
  const extraPaths = fixture.extraPaths ?? [];

  const read = (p) => overrides.get(p) ?? readFileSync(join(root, p), 'utf8');
  const plan = JSON.parse(readFileSync(join(root, G0), 'utf8'));
  const pins = JSON.parse(readFileSync(join(root, G6), 'utf8')).hashes;

  const expected = plan.moves
    .filter((p) => p.stage === 'G2')
    .map((p) => p.to)
    .sort();

  const actual = walk(join(root, PREFIX))
    .map((p) => normalizedPath(relative(root, p)))
    .filter((p) => !missingPaths.has(p))
    .concat(extraPaths)
    .sort();

  const known = new Set(actual);

  const errors = [];
  const warnings = [];
  const importEdges = [];
  const candidates = new Map();
  const declarations = {};
  const methodStats = {};

  let zodCalls = 0;
  let exportedDeclarationsCount = 0;
  let sourceFiles = 0;
  let testFiles = 0;
  let jsonFiles = 0;
  let resolvedLocalImports = 0;
  let unresolvedLocalImports = 0;

  const domainCounts = {};

  if (expected.length !== 50 || new Set(expected).size !== 50)
    errors.push('G2 inventory must contain exactly 50 distinct schema files');

  for (const file of expected)
    if (!known.has(file)) errors.push(`Missing G2 schema: ${file}`);

  for (const file of actual)
    if (!expected.includes(file))
      errors.push(`Unexpected schema file: ${file}`);

  for (const item of plan.moves.filter((x) => x.stage === 'G2'))
    if (item.from !== item.to && existsSync(join(root, item.from)))
      errors.push(`Legacy G2 schema proxy: ${item.from}`);

  for (const file of expected) {
    if (!known.has(file) || missingPaths.has(file)) continue;

    const content = read(file);
    const fingerprint = pins[file];

    if (
      !fingerprint ||
      (sha(content) !== fingerprint.raw &&
        sha(norm(content)) !== fingerprint.normalized)
    )
      errors.push(`Historical G6 schema fingerprint drift: ${file}`);

    const domain = file.slice(PREFIX.length).split('/')[0];

    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;

    if (file.endsWith('.json')) {
      jsonFiles++;
      continue;
    }

    if (!file.endsWith('.ts')) continue;
    if (file.endsWith('.test.ts')) testFiles++;
    else sourceFiles++;

    const sf = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    if (sf.parseDiagnostics.length)
      errors.push(`TypeScript syntax errors: ${file}`);

    const { names, expressions } = exportedDeclarations(sf);

    exportedDeclarationsCount += names.length;

    const duplicatedNames = names.filter(
      (name, index) => names.indexOf(name) !== index
    );

    if (duplicatedNames.length)
      errors.push(
        `Duplicate export declarations in ${file}: ${duplicatedNames.join(', ')}`
      );

    declarations[file] = names;

    for (const value of expressions) {
      const list = candidates.get(value.source) ?? [];

      list.push(`${file}:${value.name}`);
      candidates.set(value.source, list);
    }

    const scan = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const spec = node.moduleSpecifier.text;

        if (spec.startsWith('.')) {
          const target = resolveImport(root, file, spec, known, missingPaths);

          if (!target) {
            errors.push(
              `Unresolved relative schema import: ${file} -> ${spec}`
            );

            unresolvedLocalImports++;
          } else {
            resolvedLocalImports++;

            if (target.startsWith(PREFIX)) importEdges.push([file, target]);
          }
        }
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const operation = node.expression.name.text;
        const expr = node.expression.expression;

        if (ts.isIdentifier(expr) && expr.text === 'z') zodCalls++;

        if (
          [
            'object',
            'array',
            'enum',
            'union',
            'strict',
            'refine',
            'superRefine',
            'preprocess',
            'transform',
            'default',
            'optional',
            'nullable',
            'regex',
            'min',
            'max',
            'passthrough',
          ].includes(operation)
        )
          methodStats[operation] = (methodStats[operation] ?? 0) + 1;
      }

      ts.forEachChild(node, scan);
    };

    scan(sf);
  }

  const duplicates = [...candidates.values()].filter((list) => list.length > 1);

  // Repeated expressions are reported, not automatically merged across different domains.
  if (duplicates.length)
    warnings.push(
      `${duplicates.length} candidate identical exported Zod expressions require domain review`
    );

  const cases = JSON.parse(read(CASES));
  const ids = cases.cases?.map((c) => c.id) ?? [];

  if (
    cases.version !== 1 ||
    cases.language !== 'en' ||
    ids.length < 70 ||
    new Set(ids).size !== ids.length
  )
    errors.push(
      'Validation contract matrix version/language/case uniqueness drift'
    );

  if (
    cases.cases?.some(
      (c) => typeof c.contract !== 'string' || typeof c.valid !== 'boolean'
    )
  )
    errors.push('Validation contract matrix contains malformed case entries');

  // Intentional distinctions: a client segment named "other" is not a product category.
  // Product categories are DB-backed slugs, not an "Other" enum.
  for (const file of [CATEGORY, REQUEST]) {
    const code = read(file);

    if (
      /z\.enum\(\s*\[\s*['"]other['"]/.test(code) ||
      /(?:slug|category)\s*:\s*['"]other['"]/.test(code)
    )
      errors.push(`Disallowed persisted Other product category: ${file}`);
  }

  const core = read(SHARED);

  for (const name of [
    'sharedUserNameSchema',
    'sharedEmailSchema',
    'sharedReviewCommentSchema',
    'sharedReviewRatingSchema',
    'sharedRequiredAddressSchema',
  ])
    if (!new RegExp(`export\\s+const\\s+${name}\\s*=`).test(core))
      errors.push(`Missing canonical shared validator: ${name}`);

  const reviewTest = read(
    `${PREFIX}reviews/review-validation.contract.test.ts`
  );

  if (
    !reviewTest.includes('createProductReviewSchema') ||
    !reviewTest.includes('createPharmacyReviewSchema')
  )
    errors.push('Missing product/pharmacy review behavior parity test');

  const matrixTest = read(
    `${PREFIX}contracts/validation-contract-matrix.test.ts`
  );

  if (!matrixTest.includes('validation-contract-cases.json'))
    errors.push('Missing shared contract matrix parity test');

  const result = {
    stage: 'A6',
    status: errors.length ? 'FAIL' : 'PASS',
    schemaFiles: actual.length,
    codeFiles: sourceFiles,
    contractTestFiles: testFiles,
    jsonFiles,
    exportedDeclarations: exportedDeclarationsCount,
    zodCalls,
    resolvedRelativeImports: resolvedLocalImports,
    unresolvedRelativeImports: unresolvedLocalImports,
    internalSchemaImportEdges: importEdges.length,
    contractCases: ids.length,
    exactExpressionDuplicateGroups: duplicates.length,
    duplicateCandidates: duplicates,
    domainCounts,
    zodMethods: Object.fromEntries(Object.entries(methodStats).sort()),
    warnings,
    errors,
  };
  return result;
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertReadOnlyFlags(process.argv.slice(2));

  const result = auditSchemas();

  console.log(JSON.stringify(result, null, 2));
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
}
