#!/usr/bin/env node
// Stage A7: read-only operational-script audit. Never connect to a DB or run a script.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const PREFIX = 'apps/api/src/scripts/';
const PLAN = 'docs/architecture/grouping-g0/relocation-plan.json';
const ENTRYPOINTS = 'docs/architecture/grouping-g0/script-entrypoints.json';

//===================================================================

const WRITE_METHODS = new Set([
  'create',
  'insertOne',
  'insertMany',
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findByIdAndUpdate',
  'findByIdAndDelete',
  'deleteOne',
  'deleteMany',
  'remove',
  'save',
  'bulkWrite',
  'drop',
  'dropDatabase',
  'dropCollection',
  'dropIndex',
  'createIndex',
  'createIndexes',
  'syncIndexes',
]);

//===================================================================

const HIGH_RISK_METHODS = new Set([
  'deleteMany',
  'drop',
  'dropDatabase',
  'dropCollection',
  'dropIndex',
]);

//===================================================================

const ALLOWED_HIGH_RISK = new Map([
  ['seeds/seed.ts', new Set(['deleteMany'])],
  [
    'migrations/domains/migrate-domain-entities.ts',
    new Set(['deleteMany', 'dropIndex']),
  ],
]);

//===================================================================

export function assertReadOnlyFlags(args) {
  if (args.length !== 1 || args[0] !== '--check') {
    throw new Error('A7 is read-only and requires exactly --check');
  }
}

//===================================================================

function listRecursive(root, base) {
  if (!existsSync(join(root, base))) return [];

  return readdirSync(join(root, base), { withFileTypes: true }).flatMap((e) => {
    const name = `${base}/${e.name}`;

    return e.isDirectory()
      ? listRecursive(root, name)
      : [name.replaceAll('\\', '/')];
  });
}

//===================================================================

function callsIn(file, contents) {
  const source = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const calls = [];

  const diagnostics = source.parseDiagnostics.map((d) =>
    ts.flattenDiagnosticMessageText(d.messageText, '\n')
  );

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      const property = ts.isPropertyAccessExpression(expr)
        ? expr.name.text
        : ts.isElementAccessExpression(expr) &&
            ts.isStringLiteral(expr.argumentExpression)
          ? expr.argumentExpression.text
          : null;

      if (property && WRITE_METHODS.has(property)) {
        const first = node.arguments[0];
        const loc = source.getLineAndCharacterOfPosition(node.getStart(source));

        calls.push({
          method: property,
          line: loc.line + 1,

          target:
            ts.isPropertyAccessExpression(expr) ||
            ts.isElementAccessExpression(expr)
              ? expr.expression.getText(source)
              : null,

          unscoped:
            property === 'deleteMany' &&
            Boolean(
              first &&
              ts.isObjectLiteralExpression(first) &&
              first.properties.length === 0
            ),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return { calls, diagnostics };
}

//===================================================================

export function auditScripts(
  root = ROOT,
  { sourceOverrides = new Map(), packageOverride } = {}
) {
  const errors = [];

  const read = (file) =>
    sourceOverrides.has(file)
      ? sourceOverrides.get(file)
      : readFileSync(join(root, file), 'utf8');

  const json = (file) => JSON.parse(read(file));
  const plan = json(PLAN);
  const historical = json(ENTRYPOINTS);
  const moves = plan.moves.filter((m) => m.stage === 'G3');
  const manifest = moves.map((m) => m.to);
  const diskFiles = listRecursive(root, PREFIX.slice(0, -1));

  const virtualFiles = [
    ...new Set([
      ...diskFiles,
      ...[...sourceOverrides.keys()].filter((p) => p.startsWith(PREFIX)),
    ]),
  ];

  const files = virtualFiles.filter(
    (f) => !sourceOverrides.has(f) || sourceOverrides.get(f) !== null
  );

  const packageJson = packageOverride ?? json('apps/api/package.json');
  const operationSummary = {};

  let mutationCalls = 0;
  let destructiveCalls = 0;
  let unscopedDeletes = 0;
  let resolvedCommands = 0;

  const duplicateCommands = [];
  const seenCommands = new Set();

  if (moves.length !== 14 || new Set(manifest).size !== 14)
    errors.push('G3 must enumerate exactly 14 distinct script destinations');

  for (const f of manifest)
    if (!files.includes(f)) errors.push(`Missing G3 canonical script: ${f}`);

  for (const f of files)
    if (!manifest.includes(f))
      errors.push(`Unapproved script or legacy proxy: ${f}`);

  for (const move of moves)
    if (files.includes(move.from))
      errors.push(`Old flat script still present: ${move.from}`);

  for (const row of historical.commands) {
    if (seenCommands.has(row.command)) duplicateCommands.push(row.command);

    seenCommands.add(row.command);

    const move = moves.find((m) => m.from === row.target);

    if (!move) {
      errors.push(`Historical entrypoint has no G3 relocation: ${row.command}`);
      continue;
    }

    const cmd = packageJson.scripts?.[row.command];
    const destination = move.to.replace('apps/api/', '');

    const expected = row.executable.replace(
      row.target.replace('apps/api/', ''),
      destination
    );

    if (!cmd || cmd !== expected || !files.includes(move.to)) {
      errors.push(
        `Broken or absent operational command ${row.command} → ${destination}`
      );

      continue;
    }

    if (row.command === 'build' && !cmd.startsWith('tsc && node '))
      errors.push('Build script must typecheck before copying templates');

    resolvedCommands++;
  }

  if (historical.commands.length !== 14 || duplicateCommands.length)
    errors.push(
      'Historical G3 entrypoint registry is incomplete or duplicated'
    );

  const source = new Map();

  for (const file of manifest) {
    if (!files.includes(file)) continue;

    const contents = read(file);

    source.set(file, contents);

    const { calls, diagnostics } = callsIn(file, contents);

    if (diagnostics.length)
      errors.push(
        `TypeScript parse error in ${file}: ${diagnostics.join('; ')}`
      );

    mutationCalls += calls.length;

    destructiveCalls += calls.filter((c) =>
      HIGH_RISK_METHODS.has(c.method)
    ).length;

    unscopedDeletes += calls.filter((c) => c.unscoped).length;

    const rel = file.slice(PREFIX.length);

    operationSummary[rel] = {
      lines: contents.split(/\r?\n/).length,
      writes: calls.length,

      destructiveCalls: calls.filter((c) => HIGH_RISK_METHODS.has(c.method))
        .length,
    };

    if (rel.startsWith('diagnostics/') && calls.length) {
      errors.push(
        `Diagnostic must remain read-only: ${rel} calls ${calls.map((c) => `${c.method}@${c.line}`).join(', ')}`
      );
    }

    if (
      rel.startsWith('diagnostics/') &&
      (!contents.includes('process.argv.length > 2') ||
        !contents.includes('autoCreate: false') ||
        !contents.includes('autoIndex: false'))
    ) {
      errors.push(
        `Diagnostic must reject CLI arguments and disable DB auto-mutations: ${rel}`
      );
    }

    const allow = ALLOWED_HIGH_RISK.get(rel) ?? new Set();

    for (const c of calls)
      if (HIGH_RISK_METHODS.has(c.method) && !allow.has(c.method)) {
        errors.push(
          `Unreviewed destructive DB method: ${rel}:${c.line} ${c.method}`
        );
      }

    if (rel === 'seeds/seed.ts') {
      if (
        !/process\.env\.NODE_ENV\s*===\s*['"]production['"]/.test(contents) ||
        !contents.includes('Seed script is blocked in production')
      ) {
        errors.push(
          'Destructive demo seed must retain production environment guard'
        );
      }

      if (
        contents.indexOf('await connectDB()') <
        contents.indexOf("process.env.NODE_ENV === 'production'")
      ) {
        errors.push('Destructive seed guard must execute before DB connection');
      }

      if (!calls.some((c) => c.unscoped))
        errors.push(
          'Destructive seed inventory unexpectedly changed; review the reset contract'
        );
    }

    if (rel === 'seeds/seed-admin-owner.ts') {
      if (
        contents.split('session.withTransaction(').length - 1 < 2 ||
        !contents.includes('existingAdmin')
      ) {
        errors.push(
          'Platform Owner bootstrap must retain transactional create and existing-owner guard'
        );
      }
    }

    if (
      rel ===
      'migrations/owners/migrate-pharmacy-owner-registration-documents.ts'
    ) {
      if (
        !/const\s+apply\s*=\s*process\.argv\.includes\(['"]--apply['"]\)/.test(
          contents
        ) ||
        !contents.includes(
          'migratePharmacyOwnerRegistrationDocuments(apply)'
        ) ||
        !contents.includes("apply ? 'apply' : 'dry-run'")
      ) {
        errors.push(
          'Owner-document migration must default to read-only dry-run and require --apply for writes'
        );
      }
    }

    if (rel === 'build/copy-templates.mjs') {
      if (
        !contents.includes("'src', 'templates'") ||
        !contents.includes("'dist', 'templates'")
      ) {
        errors.push(
          'Build template copier must preserve API-local source and dist roots'
        );
      }
    }
  }

  const diag = manifest.filter((p) => p.includes('/diagnostics/'));

  if (
    diag.length !== 1 ||
    operationSummary[
      'diagnostics/diagnose-pharmacy-owner-registration-documents.ts'
    ]?.writes !== 0
  ) {
    errors.push(
      'A7 must retain one read-only registration document diagnostic'
    );
  }

  const resetNames = [
    'Pharmacy',
    'Product',
    'ProductOffer',
    'ProductReview',
    'PharmacyReview',
    'Order',
    'Cart',
    'StockMovement',
    'PharmacyNote',
    'ProductRequest',
  ];

  const seedCalls = callsIn(
    PREFIX + 'seeds/seed.ts',
    source.get(PREFIX + 'seeds/seed.ts') ?? ''
  ).calls;

  const actualResets = seedCalls
    .filter((c) => c.unscoped)
    .map((c) => c.target)
    .sort();

  if (
    unscopedDeletes !== 10 ||
    JSON.stringify(actualResets) !== JSON.stringify([...resetNames].sort())
  ) {
    errors.push(
      'Unreviewed destructive demo reset scope: expected exactly ten known collections'
    );
  }

  return {
    stage: 'A7',
    status: errors.length ? 'FAIL' : 'PASS',
    scriptFiles: files.length,
    canonicalScripts: manifest.length,
    operationalCommands: resolvedCommands,
    mutationCalls,
    destructiveCalls,
    unscopedDeletes,

    diagnosticWriteCalls:
      operationSummary[
        'diagnostics/diagnose-pharmacy-owner-registration-documents.ts'
      ]?.writes ?? null,

    warnings: [
      'seed.ts performs unscoped destructive deletes; NODE_ENV=production guard is not a proof that MONGODB_URI points at a demo database.',
      'migrate-domain-entities.ts drops an index and deduplicates carts; backup and database-specific rehearsal are required.',
      'Historical owner foundation migration bootstraps demo accounts with a fixed legacy password; review before using on non-demo data.',
    ],

    operationSummary,
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

    const result = auditScripts();

    console.log(JSON.stringify(result, null, 2));

    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
