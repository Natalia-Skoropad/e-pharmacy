import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const { auditScripts, assertReadOnlyFlags } = await import(
  new URL('./check-api-scripts-a7.mjs', import.meta.url)
);

const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const PREFIX = 'apps/api/src/scripts/';
const read = (file) => readFileSync(join(ROOT, file), 'utf8');

const modify = (file, fn) =>
  auditScripts(ROOT, { sourceOverrides: new Map([[file, fn(read(file))]]) });

//===================================================================

const seed = `${PREFIX}seeds/seed.ts`;
const diag = `${PREFIX}diagnostics/diagnose-pharmacy-owner-registration-documents.ts`;
const docs = `${PREFIX}migrations/owners/migrate-pharmacy-owner-registration-documents.ts`;
const owner = `${PREFIX}seeds/seed-admin-owner.ts`;
const template = `${PREFIX}build/copy-templates.mjs`;
const domain = `${PREFIX}migrations/domains/migrate-domain-entities.ts`;

//===================================================================

const expectFail = (result, term) => {
  assert.equal(result.status, 'FAIL', JSON.stringify(result));

  assert(
    result.errors.some((e) => e.includes(term)),
    JSON.stringify(result.errors)
  );
};

//===================================================================

test('A7 inventories all 14 G3 canonical operational scripts and command contracts', () => {
  const r = auditScripts(ROOT);

  assert.equal(r.status, 'PASS', r.errors.join('\n'));
  assert.equal(r.scriptFiles, 14);
  assert.equal(r.canonicalScripts, 14);
  assert.equal(r.operationalCommands, 14);
  assert.equal(r.diagnosticWriteCalls, 0);
  assert.equal(r.unscopedDeletes, 10);
  assert(r.mutationCalls >= 50);
});

//===================================================================

test('A7 CLI is strictly read-only and refuses implicit modes and unknown flags', () => {
  assert.doesNotThrow(() => assertReadOnlyFlags(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--check', '--check'],
    ['--no-check'],
  ]) {
    assert.throws(() => assertReadOnlyFlags(args), /read-only/);
  }
});

//===================================================================

test('A7 rejects a missing canonical script', () => {
  expectFail(
    auditScripts(ROOT, { sourceOverrides: new Map([[template, null]]) }),
    'Missing G3'
  );
});

//===================================================================

test('A7 rejects reintroduced legacy flat scripts and unapproved scripts', () => {
  expectFail(
    auditScripts(ROOT, {
      sourceOverrides: new Map([[`${PREFIX}seed.ts`, 'export {};']]),
    }),
    'Unapproved script'
  );
});

//===================================================================

test('A7 refuses broken or renamed operational commands', () => {
  const pkg = JSON.parse(read('apps/api/package.json'));

  pkg.scripts.seed = 'node src/scripts/seeds/missing-seed.ts';

  expectFail(
    auditScripts(ROOT, { packageOverride: pkg }),
    'Broken or absent operational command seed'
  );
});

//===================================================================

test('A7 keeps build template copying behind tsc', () => {
  const pkg = JSON.parse(read('apps/api/package.json'));

  pkg.scripts.build = 'node src/scripts/build/copy-templates.mjs';

  expectFail(
    auditScripts(ROOT, { packageOverride: pkg }),
    'Broken or absent operational command build'
  );
});

//===================================================================

test('A7 rejects Mongo writes added to a diagnostic', () => {
  expectFail(
    modify(diag, (s) => s + '\nvoid Pharmacy.deleteMany({});\n'),
    'Diagnostic must remain read-only'
  );
});

//===================================================================

test('A7 recognizes computed-property mutation calls in read-only diagnostics', () => {
  expectFail(
    modify(diag, (s) => s + "\nvoid Pharmacy['updateMany']({}, {});\n"),
    'Diagnostic must remain read-only'
  );
});

//===================================================================

test('A7 catches expansion of the destructive demo reset', () => {
  expectFail(
    modify(seed, (s) =>
      s.replace(
        '    Pharmacy.deleteMany({}),',
        '    Pharmacy.deleteMany({}),\n    User.deleteMany({}),'
      )
    ),
    'Unreviewed destructive demo reset scope'
  );
});

//===================================================================

test('A7 diagnostic must reject command flags and disable auto writes', () => {
  expectFail(
    modify(diag, (s) => s.replace('process.argv.length > 2', 'false')),
    'Diagnostic must reject CLI'
  );

  expectFail(
    modify(diag, (s) => s.replace('autoCreate: false', 'autoCreate: true')),
    'Diagnostic must reject CLI'
  );
});

//===================================================================

test('A7 blocks removal of production guard from destructive demo seed', () => {
  expectFail(
    modify(seed, (s) =>
      s.replace("process.env.NODE_ENV === 'production'", 'false')
    ),
    'production environment guard'
  );
});

//===================================================================

test('A7 detects unreviewed unscoped deletes in a migration', () => {
  expectFail(
    modify(docs, (s) => s + '\nvoid mongoose.connection.db?.dropDatabase();\n'),
    'Unreviewed destructive'
  );
});

//===================================================================

test('A7 keeps documented high-risk domain migration visible', () => {
  const result = auditScripts(ROOT);

  assert.equal(
    result.operationSummary['migrations/domains/migrate-domain-entities.ts']
      .destructiveCalls,
    2
  );

  assert(result.warnings.some((w) => w.includes('index')));

  expectFail(
    modify(
      domain,
      (s) => s + '\nvoid mongoose.connection.db?.dropDatabase();\n'
    ),
    'Unreviewed destructive'
  );
});

//===================================================================

test('A7 protects owner document dry-run mode and --apply opt-in', () => {
  expectFail(
    modify(docs, (s) => s.replace("process.argv.includes('--apply')", 'true')),
    'dry-run'
  );

  expectFail(
    modify(docs, (s) =>
      s.replace(
        'migratePharmacyOwnerRegistrationDocuments(apply)',
        'migratePharmacyOwnerRegistrationDocuments(true)'
      )
    ),
    'dry-run'
  );
});

//===================================================================

test('A7 protects transactional Platform Owner bootstrap', () => {
  expectFail(
    modify(owner, (s) =>
      s.replace('session.withTransaction(', 'session.withoutTransaction(')
    ),
    'transactional'
  );
});

//===================================================================

test('A7 protects API-relative template roots without touching the filesystem', () => {
  expectFail(
    modify(template, (s) =>
      s.replace("'dist', 'templates'", "'../dist', 'templates'")
    ),
    'API-local'
  );
});

//===================================================================

test('A7 rejects TypeScript syntax corruption rather than trusting regex', () => {
  expectFail(
    modify(docs, (s) => s + '\nconst = ;'),
    'TypeScript parse error'
  );
});

//===================================================================

test('A7 is deterministic and does not rewrite scripts or historical G3 manifests', () => {
  const targets = [
    seed,
    diag,
    docs,
    owner,
    template,
    'docs/architecture/grouping-g3/source-fingerprints.json',
  ];

  const before = targets.map(read);
  const a = auditScripts(ROOT);
  const b = auditScripts(ROOT);

  assert.deepEqual(a, b);
  assert.deepEqual(targets.map(read), before);
});
