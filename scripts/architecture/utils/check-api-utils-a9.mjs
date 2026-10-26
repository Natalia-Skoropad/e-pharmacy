#!/usr/bin/env node
// A9: read-only, static audit of API and shared utilities. Never imports a utility or touches MongoDB.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const API = 'apps/api/src/utils/';
const SHARED = 'packages/utils/src/';
const VALIDATION = 'packages/validation/src/';
const MANIFEST = 'docs/architecture/grouping-g0/relocation-plan.json';
const G6 = 'docs/architecture/grouping-g6/canonical-source-fingerprints.json';
const INVENTORY = 'docs/architecture/utils-a9/utils-audit-inventory.json';

//===================================================================

const slash = (p) => p.replace(/\\/g, '/');
const hash = (s) => createHash('sha256').update(s).digest('hex');

//===================================================================

const normalized = (s) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() && !/^\s*\/\/(?:={5,}|-{5,}|\*{5,})\s*$/.test(line)
    )
    .join('\n');

//===================================================================

const walk = (folder) =>
  readdirSync(folder, { withFileTypes: true }).flatMap((e) => {
    const target = join(folder, e.name);

    return e.isDirectory() ? walk(target) : e.isFile() ? [target] : [];
  });

//===================================================================

const exported = (node) =>
  node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;

//===================================================================

const isCallable = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node);

//===================================================================

export function assertReadOnlyFlags(args) {
  if (args.length !== 1 || args[0] !== '--check')
    throw new Error('A9 read-only audit supports only --check');
}

//===================================================================

function cyclesOf(nodes, edges) {
  const visiting = new Set(),
    visited = new Set(),
    cycles = new Set();

  const adjacency = new Map(nodes.map((n) => [n, []]));

  for (const [a, b] of edges)
    if (adjacency.has(a) && adjacency.has(b)) adjacency.get(a).push(b);

  function visit(n, path) {
    if (visiting.has(n)) {
      cycles.add(path.slice(path.indexOf(n)).concat(n).join(' -> '));

      return;
    }

    if (visited.has(n)) return;

    visiting.add(n);

    for (const next of adjacency.get(n)) visit(next, [...path, next]);

    visiting.delete(n);
    visited.add(n);
  }

  for (const n of nodes) visit(n, [n]);

  return [...cycles];
}

//===================================================================

export function auditUtils(root = ROOT, fixture = {}) {
  const overrides = fixture.sourceOverrides ?? new Map();
  const absent = new Set(fixture.absent ?? []);
  const added = fixture.added ?? [];

  const read = (name) =>
    overrides.get(name) ?? readFileSync(join(root, name), 'utf8');

  const manifest = JSON.parse(read(MANIFEST));
  const inventory = JSON.parse(read(INVENTORY));
  const pins = JSON.parse(read(G6)).hashes;

  const errors = [],
    warnings = [];

  const apiExpected = manifest.moves
    .filter((m) => m.stage === 'G5')
    .map((m) => m.to)
    .sort();

  const sharedExpected = inventory.sharedUtilityFiles;
  const expected = [...apiExpected, ...sharedExpected].sort();

  const actual = [...walk(join(root, API)), ...walk(join(root, SHARED))]
    .map((file) => slash(relative(root, file)))
    .filter((file) => file.endsWith('.ts') && !absent.has(file))
    .concat(added)
    .sort();

  const known = new Set(actual),
    expectedSet = new Set(expected);

  if (
    inventory.schemaVersion !== 1 ||
    inventory.stage !== 'A9' ||
    inventory.apiGroupingStage !== 'G5' ||
    inventory.expectedApiFiles.length !== 31 ||
    new Set(inventory.expectedApiFiles).size !== 31 ||
    new Set(sharedExpected).size !== sharedExpected.length ||
    sharedExpected.length !== 25 ||
    JSON.stringify(inventory.expectedApiFiles) !== JSON.stringify(apiExpected)
  )
    errors.push(
      'A9 inventory differs from immutable G5 scope or the reviewed shared registry'
    );

  for (const name of expected)
    if (!known.has(name)) errors.push(`Missing canonical utility: ${name}`);

  for (const name of actual)
    if (!expectedSet.has(name)) errors.push(`Unreviewed utility file: ${name}`);

  for (const item of manifest.moves.filter((m) => m.stage === 'G5'))
    if (item.from !== item.to && existsSync(join(root, item.from)))
      errors.push(`Legacy flat utility or proxy: ${item.from}`);

  const sourceStats = {},
    domainCounts = {},
    functionGroups = new Map();

  const namesByPackage = {
    api: new Map(),
    shared: new Map(),
    validation: new Map(),
  };

  const edges = [];

  let unresolvedImports = 0,
    relativeImports = 0,
    exportedFunctions = 0,
    testFiles = 0;

  let explicitExternalEffects = 0;

  const addName = (scope, name, file) => {
    const owners = namesByPackage[scope].get(name) ?? [];

    owners.push(file);
    namesByPackage[scope].set(name, owners);
  };

  const fileExists = (name) =>
    known.has(name) || (!absent.has(name) && existsSync(join(root, name)));

  const resolveRelative = (source, specifier) => {
    const raw = posix.normalize(posix.join(posix.dirname(source), specifier));
    const base = raw.replace(/\.(?:js|mjs|ts|tsx)$/, '');

    return (
      [
        raw,
        base + '.ts',
        base + '.tsx',
        base + '.mjs',
        base + '.js',
        base + '/index.ts',
        base + '/index.tsx',
      ].find(fileExists) ?? null
    );
  };

  const visitFile = (file, scope) => {
    const text = read(file);

    const parsed = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    if (parsed.parseDiagnostics.length)
      errors.push(
        `Invalid TypeScript utility ${file}: ${ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, '\n')}`
      );

    if (scope === 'api') {
      const expectedHash = pins[file]?.normalized;

      if (!expectedHash || hash(normalized(text)) !== expectedHash)
        errors.push(`G6 immutable utility fingerprint drift: ${file}`);
    }

    const domain = `${scope}/${
      file
        .split('/')
        .slice(scope === 'api' ? 4 : 3, -1)
        .join('/') || 'root'
    }`;

    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;

    const test = file.endsWith('.test.ts');

    if (test) testFiles++;

    let localExports = 0,
      imports = 0,
      sideEffects = 0;

    const declarations = new Set();

    for (const stmt of parsed.statements) {
      if (ts.isFunctionDeclaration(stmt) && stmt.name) {
        if (exported(stmt)) {
          localExports++;
          exportedFunctions++;
          addName(scope, stmt.name.text, file);

          const signature =
            stmt.body &&
            hash(normalized(stmt.body.getText(parsed)).replace(/\s+/g, ''));

          if (signature && stmt.body.statements.length > 2) {
            const group = functionGroups.get(signature) ?? [];

            group.push(`${file}:${stmt.name.text}`);
            functionGroups.set(signature, group);
          }

          if (declarations.has(stmt.name.text))
            errors.push(
              `Duplicate exported function: ${file}:${stmt.name.text}`
            );

          declarations.add(stmt.name.text);
        }
      }

      if (ts.isVariableStatement(stmt)) {
        for (const d of stmt.declarationList.declarations) {
          if (
            exported(stmt) &&
            ts.isIdentifier(d.name) &&
            d.initializer &&
            isCallable(d.initializer)
          ) {
            localExports++;
            exportedFunctions++;
            addName(scope, d.name.text, file);
          }

          // Shared utilities must not execute I/O or process operations during module initialization.
          if (
            scope === 'shared' &&
            !test &&
            d.initializer &&
            ts.isCallExpression(d.initializer)
          ) {
            const callee = d.initializer.expression.getText(parsed);

            if (
              /^(?:fetch|require|process\.exit|process\.cwd|setInterval|setTimeout|eval)$/.test(
                callee
              )
            ) {
              errors.push(
                `Unexpected shared utility module initialization: ${file}: ${callee}`
              );
              sideEffects++;
            }
          }
        }
      }

      if (ts.isExpressionStatement(stmt) && scope === 'shared' && !test) {
        errors.push(`Top-level side effect in shared utility: ${file}`);
        sideEffects++;
      }

      if (!ts.isImportDeclaration(stmt) && !ts.isExportDeclaration(stmt))
        continue;

      const spec = stmt.moduleSpecifier;

      if (!spec || !ts.isStringLiteral(spec)) continue;

      if (!spec.text.startsWith('.')) {
        if (
          scope === 'shared' &&
          !test &&
          (/^@e-pharmacy\//.test(spec.text) ||
            /^node:(?:fs|child_process|net|http)/.test(spec.text) ||
            /^(?:mongoose|express|nodemailer|jsonwebtoken)$/.test(spec.text))
        ) {
          errors.push(
            `Shared utility imports backend or IO dependency: ${file}: ${spec.text}`
          );
        }

        continue;
      }

      imports++;
      relativeImports++;

      const dest = resolveRelative(file, spec.text);

      if (!dest) {
        unresolvedImports++;

        errors.push(
          `Unresolved relative utility import: ${file} -> ${spec.text}`
        );

        continue;
      }

      if (scope === 'shared' && !dest.startsWith(SHARED))
        errors.push(
          `Shared utility crosses package boundary: ${file} -> ${dest}`
        );

      if (expectedSet.has(dest)) edges.push([file, dest]);
    }

    sourceStats[file] = {
      scope,
      lines: text.split(/\r?\n/).length,
      exportedFunctions: localExports,
      relativeImports: imports,
      sideEffectSignals: sideEffects,
    };

    explicitExternalEffects += sideEffects;
  };

  for (const file of expected)
    if (known.has(file))
      visitFile(file, file.startsWith(API) ? 'api' : 'shared');

  // Cross-boundary name overlaps are only candidates: a backend date validator
  // and a browser date formatter can have different semantics and error contracts.
  for (const file of walk(join(root, VALIDATION))
    .map((f) => slash(relative(root, f)))

    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
    const parsed = ts.createSourceFile(
      file,
      read(file),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    for (const stmt of parsed.statements)
      if (ts.isFunctionDeclaration(stmt) && stmt.name && exported(stmt))
        addName('validation', stmt.name.text, file);
  }

  const publicPackage = JSON.parse(read('packages/utils/package.json'));
  const entrypoints = publicPackage.exports;

  if (
    JSON.stringify(entrypoints) !== JSON.stringify(inventory.packageEntrypoints)
  )
    errors.push('Unexpected shared utils public entrypoint change');

  for (const [name, target] of Object.entries(inventory.packageEntrypoints)) {
    const file = 'packages/utils/' + target.replace(/^\.\//, '');

    if (!known.has(file))
      errors.push(`Missing shared public entrypoint: ${name} -> ${file}`);
  }

  const overlap = [];

  for (const [name, apiOwners] of namesByPackage.api) {
    const common = namesByPackage.shared.get(name);
    const validators = namesByPackage.validation.get(name);

    if (common || validators)
      overlap.push({
        symbol: name,
        apiOwners,
        sharedOwners: common ?? [],
        validationOwners: validators ?? [],
      });
  }

  for (const [name, sharedOwners] of namesByPackage.shared) {
    const validators = namesByPackage.validation.get(name);

    if (validators && !namesByPackage.api.has(name))
      overlap.push({
        symbol: name,
        apiOwners: [],
        sharedOwners,
        validationOwners: validators,
      });
  }

  const cycles = cyclesOf(expected, edges);

  for (const cycle of cycles) errors.push(`Utility import cycle: ${cycle}`);

  const exactDuplicates = [...functionGroups.values()].filter(
    (group) => new Set(group.map((x) => x.split(':')[0])).size > 1
  );

  if (exactDuplicates.length)
    warnings.push(
      `${exactDuplicates.length} exact utility function body matches require domain review`
    );

  // Keep auth/logging/persistence adapters in the API rather than moving them
  // into the browser-importable shared utils package.
  const adapterOwners = [
    'auth/jwt.ts',
    'auth/password.ts',
    'email/sendEmail.ts',
    'logging/logger.ts',
    'pharmacies/pharmacyAccess.ts',
  ].map((f) => API + f);

  for (const owner of adapterOwners)
    if (!known.has(owner))
      errors.push(`Missing sensitive API-only utility adapter: ${owner}`);

  if (
    !read(API + 'pharmacies/pharmacyAccess.ts').includes(
      'requirePharmacyCapability'
    )
  )
    errors.push(
      'Pharmacy capability authorization must remain explicit in the API adapter'
    );

  if (
    !read(API + 'auth/password-reset-url.ts').includes('url.hash = tokenParams')
  )
    errors.push('Password reset URL fragment compatibility contract drift');

  return {
    stage: 'A9',
    status: errors.length ? 'FAIL' : 'PASS',
    apiUtilityFiles: apiExpected.length,
    sharedUtilityFiles: sharedExpected.length,
    totalUtilityFiles: expected.length,
    testFiles,
    exportedFunctions,
    relativeImports,
    unresolvedImports,
    internalUtilityEdges: edges.length,
    importCycles: cycles.length,
    sharedPublicEntrypoints: Object.keys(entrypoints).length,
    topLevelSideEffectViolations: explicitExternalEffects,
    exactDuplicateFunctionGroups: exactDuplicates,
    overlappingExportNames: overlap,
    domainCounts,
    sourceStats,
    warnings,
    errors,
  };
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    assertReadOnlyFlags(process.argv.slice(2));

    const result = auditUtils();

    console.log(JSON.stringify(result, null, 2));

    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
