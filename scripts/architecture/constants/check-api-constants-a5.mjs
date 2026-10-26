#!/usr/bin/env node
// Stage A5: read-only audit of the canonical G1 constants and shared value-set parity.
// Mutation tests pass sourceOverrides in memory; no database or file writes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const PREFIX = 'apps/api/src/constants/';
const SOURCE_MAP = 'docs/architecture/grouping-g0/relocation-plan.json';

const PINNED =
  'docs/architecture/grouping-g6/canonical-source-fingerprints.json';

const SHARED = {
  AUTH_APPLICATIONS: 'packages/config/src/auth/domain-values.ts',
  USER_ROLES: 'packages/config/src/auth/domain-values.ts',
  PHARMACY_STATUSES: 'packages/config/src/pharmacies/domain-values.ts',
};

//===================================================================

const abs = (root, file) => join(root, file);

const ast = (file, source) =>
  ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

const unwrap = (node) => {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node))
  )
    node = node.expression;
  return node;
};

//===================================================================

const key = (node) =>
  ts.isIdentifier(node) || ts.isStringLiteral(node)
    ? node.text
    : node.getText();

//===================================================================

const literal = (node) => {
  node = unwrap(node);

  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

  return null;
};

//===================================================================

const fields = (obj) => {
  const node = unwrap(obj);

  if (!ts.isObjectLiteralExpression(node)) return null;

  return node.properties
    .filter(ts.isPropertyAssignment)
    .map((p) => [key(p.name), literal(p.initializer)]);
};

//===================================================================

const members = (node) => {
  node = unwrap(node);

  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);

  const ps = fields(node);

  return ps?.map(([, v]) => v) ?? null;
};

//===================================================================

const vars = (sourceFile) => {
  const declarations = new Map();

  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;

    for (const decl of stmt.declarationList.declarations)
      if (ts.isIdentifier(decl.name)) {
        declarations.set(decl.name.text, {
          initializer: decl.initializer,

          exported:
            stmt.modifiers?.some(
              (m) => m.kind === ts.SyntaxKind.ExportKeyword
            ) ?? false,
        });
      }
  }

  return declarations;
};

//===================================================================

const unique = (values) => new Set(values).size === values.length;

//===================================================================

const asSortedStrings = (value, label, errors) => {
  if (!value || value.some((v) => typeof v !== 'string') || !unique(value)) {
    errors.push(`${label}: expected distinct static string values`);

    return [];
  }

  return [...value].sort();
};

//===================================================================

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((x) =>
    x.isDirectory()
      ? listFiles(join(dir, x.name))
      : x.isFile()
        ? [join(dir, x.name)]
        : []
  );

//===================================================================

export function analyzeConstants(root = ROOT, fixture = {}) {
  const overrides = fixture.sourceOverrides ?? new Map();
  const extras = fixture.extraPaths ?? [];

  const read = (p) => overrides.get(p) ?? readFileSync(abs(root, p), 'utf8');
  const manifest = JSON.parse(readFileSync(abs(root, SOURCE_MAP), 'utf8'));
  const hashes = JSON.parse(readFileSync(abs(root, PINNED), 'utf8'));
  const entries = manifest.moves.filter((m) => m.stage === 'G1');

  const expected = entries.map((e) => e.to).sort();

  const actual = listFiles(abs(root, PREFIX))
    .map((f) => relative(abs(root, PREFIX), f).split('\\').join('/'))
    .map((f) => PREFIX + f)
    .concat(extras)
    .sort();

  const errors = [];
  const duplicates = [];
  const intentionalMirrors = [];

  if (entries.length !== 35 || new Set(expected).size !== 35)
    errors.push('G1 baseline must contain exactly 35 unique constants');

  for (const p of expected)
    if (!actual.includes(p)) errors.push(`Missing G1 constant: ${p}`);

  for (const p of actual)
    if (!expected.includes(p)) errors.push(`Unexpected constant file: ${p}`);

  for (const item of entries)
    if (existsSync(abs(root, item.from)) && item.from !== item.to)
      errors.push(`Legacy constants proxy: ${item.from}`);

  const byFile = new Map();
  const exportOwner = new Map();
  const declarationShapes = new Map();

  const normalizeSource = (text) =>
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .filter(
        (line) =>
          line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
      )
      .join('\n');

  const sha = (text) => createHash('sha256').update(text).digest('hex');

  let exportedValues = 0;
  let codeFiles = 0;

  for (const p of expected) {
    if (!actual.includes(p) || !p.endsWith('.ts')) continue;

    const text = read(p);
    const pinned = hashes.hashes[p];

    if (
      !pinned ||
      (sha(text) !== pinned.raw &&
        sha(normalizeSource(text)) !== pinned.normalized)
    )
      errors.push(`Historical G6 constant fingerprint drift: ${p}`);

    const parsed = ast(p, text);

    if (parsed.parseDiagnostics.length) errors.push(`Invalid TypeScript: ${p}`);

    codeFiles++;

    const vv = vars(parsed);

    byFile.set(p, vv);

    for (const [name, v] of vv) {
      if (!v.exported) continue;

      exportedValues++;

      const previous = exportOwner.get(name);

      if (previous)
        errors.push(
          `Duplicate exported constant owner: ${name} in ${previous} and ${p}`
        );
      else exportOwner.set(name, p);

      const expression = unwrap(v.initializer);

      if (
        !expression ||
        (!ts.isArrayLiteralExpression(expression) &&
          !ts.isObjectLiteralExpression(expression))
      )
        continue;

      const value = expression.getText(parsed).replace(/\s+/g, '');

      if (value.length < 24) continue;

      const earlier = declarationShapes.get(value);

      if (earlier && earlier.name !== name)
        duplicates.push(`${earlier.file}:${earlier.name} ≈ ${p}:${name}`);
      else declarationShapes.set(value, { name, file: p });
    }
  }

  for (const [name, sharedPath] of Object.entries(SHARED)) {
    const api = byFile.get(PREFIX + 'auth/auth.ts')?.get(name)?.initializer;
    const actualAPI = members(api);

    const shared = vars(ast(sharedPath, read(sharedPath))).get(
      name
    )?.initializer;

    const actualShared = members(shared);
    const local = asSortedStrings(actualAPI, `API ${name}`, errors);
    const remote = asSortedStrings(actualShared, `shared ${name}`, errors);

    if (JSON.stringify(local) !== JSON.stringify(remote))
      errors.push(`${name} differs from packages/config domain values`);
    else intentionalMirrors.push(name);
  }

  const cat = byFile.get(PREFIX + 'catalog/product-category.ts');

  const seeds = unwrap(
    cat?.get('PRODUCT_CATEGORY_SEED_DEFINITIONS')?.initializer
  );

  const expectedSeeds = [
    'medicine',
    'vitamins',
    'beauty',
    'hygiene',
    'medical_devices',
  ];

  if (!seeds || !ts.isArrayLiteralExpression(seeds))
    errors.push('Product categories: expected static seed definitions');
  else {
    const slugs = seeds.elements.map(
      (e) => fields(e)?.find(([k]) => k === 'slug')?.[1]
    );

    if (JSON.stringify(slugs) !== JSON.stringify(expectedSeeds))
      errors.push('Product categories: changed canonical five seed slugs');

    if (slugs.includes('other'))
      errors.push('Product categories: Other cannot be a real seed category');
  }

  for (const name of [
    'PRODUCT_CATEGORY_KINDS',
    'PRODUCT_CATEGORY_STATUSES',
    'PRODUCT_REQUEST_CATEGORY_MODES',
  ]) {
    const p = name.startsWith('PRODUCT_REQUEST')
      ? PREFIX + 'catalog/product-request.ts'
      : PREFIX + 'catalog/product-category.ts';

    const values = members(byFile.get(p)?.get(name)?.initializer);

    if (!values || values.some((v) => v === 'other' || v === 'Other'))
      errors.push(`${name}: Other is not a supported persisted value`);

    if (values && !unique(values)) errors.push(`${name}: duplicate values`);
  }

  for (const [p, name] of [
    [PREFIX + 'auth/auth.ts', 'AUTH_ERROR_CODES'],
    [PREFIX + 'admin/access/admin-access.ts', 'ADMIN_ACCESS_ERROR_CODES'],

    [
      PREFIX + 'catalog/product-management.ts',
      'PRODUCT_MANAGEMENT_ERROR_CODES',
    ],

    [PREFIX + 'catalog/product-request.ts', 'PRODUCT_REQUEST_ERROR_CODES'],
  ]) {
    const values = members(byFile.get(p)?.get(name)?.initializer);

    if (!values || values.some((v) => typeof v !== 'string') || !unique(values))
      errors.push(`Duplicated/nonstatic error codes in ${name}`);
  }

  const statusFields = fields(
    byFile.get(PREFIX + 'http/httpStatus.ts')?.get('HTTP_STATUS')?.initializer
  );

  if (!statusFields || statusFields.some(([, v]) => !/^\d+$/.test(v)))
    errors.push('HTTP_STATUS must use static numeric literals');

  if (statusFields && !unique(statusFields.map(([, v]) => v)))
    errors.push('HTTP_STATUS: duplicate numeric values');

  const matrix = fields(
    byFile
      .get(PREFIX + 'admin/access/admin-permissions.ts')
      ?.get('ADMIN_PERMISSION_MATRIX')?.initializer
  );

  const permissions = byFile
    .get(PREFIX + 'admin/access/admin-permissions.ts')
    ?.get('ADMIN_PERMISSIONS')?.initializer;

  const permNode = unwrap(permissions);

  if (!matrix || !permNode || !ts.isObjectLiteralExpression(permNode))
    errors.push('Admin permission matrix/registry missing');
  else {
    const matrixNames = matrix.map(([k]) => k);

    const actualNames = permNode.properties
      .filter(ts.isPropertyAssignment)
      .map((p) => key(p.name));

    if (JSON.stringify(matrixNames) !== JSON.stringify(actualNames))
      errors.push('Admin permission resource names differ from matrix');

    for (const item of permNode.properties.filter(ts.isPropertyAssignment)) {
      const resource = key(item.name);

      const expectedNode = byFile
        .get(PREFIX + 'admin/access/admin-permissions.ts')
        ?.get('ADMIN_PERMISSION_MATRIX')?.initializer;

      const matrixObj = unwrap(expectedNode);

      const matrixProperty = matrixObj.properties.find(
        (p) => ts.isPropertyAssignment(p) && key(p.name) === resource
      );

      const actions = members(matrixProperty?.initializer);

      const actualActions = fields(item.initializer)?.map(([action]) => action);

      if (
        !actions ||
        !actualActions ||
        JSON.stringify(actions) !== JSON.stringify(actualActions)
      )
        errors.push(`Admin permission action mismatch: ${resource}`);
    }
  }

  return {
    stage: 'A5',
    status: errors.length ? 'FAIL' : 'PASS',
    constantFiles: expected.length,
    codeFiles,
    exportedValues,

    duplicateExportOwners: errors.filter((x) =>
      x.startsWith('Duplicate exported')
    ).length,

    possibleStructuralDuplicates: duplicates,
    sharedDomainMirrors: intentionalMirrors,
    seedCategories: expectedSeeds,
    errors,
  };
}

//===================================================================

export function parseArgs(args) {
  assert.deepEqual(
    args,
    ['--check'],
    'A5 is read-only and accepts exactly --check'
  );
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  parseArgs(process.argv.slice(2));

  const result = analyzeConstants();

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length) process.exitCode = 1;
}
