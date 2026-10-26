// Stage A4. Pure source overlays test negative cases without touching repo files.
// Direct `node file.test.mjs` avoids the Windows test-worker native exit seen in A3.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const { auditRoutes, assertReadOnlyCheckFlags } = await import(
  pathToFileURL(join(ROOT, 'scripts/architecture/check-api-routes-a4.mjs')).href
);

const ROUTES = 'apps/api/src/routes/';
const original = auditRoutes(ROOT);

//===================================================================

function mutated(file, before, after) {
  const pathname = ROUTES + file;
  const text = readFileSync(join(ROOT, pathname), 'utf8');

  assert(text.includes(before), `Missing fixture anchor: ${file} ${before}`);

  return {
    sourceOverrides: new Map([[pathname, text.replace(before, after)]]),
  };
}

//===================================================================

const failing = (fixture, contains) => {
  const result = auditRoutes(ROOT, fixture);

  assert.equal(
    result.status,
    'FAIL',
    `Mutation unexpectedly accepted: ${contains}`
  );

  assert(
    result.errors.some((message) => message.includes(contains)),
    result.errors.join('\n')
  );
};

//===================================================================

test('A4 covers 13 mounts, 159 HTTP registrations and all guarded controller early returns', () => {
  assert.equal(original.status, 'PASS', original.errors.join('\n'));
  assert.equal(original.routeFiles, 12);
  assert.equal(original.routerMounts, 13);
  assert.equal(original.methodRegistrations, 159);
  assert.equal(original.mountedEndpoints, 190); // 31 pharmacy endpoints intentionally have two mount prefixes.
  assert.equal(original.protectedRegistrations, 138);
  assert.equal(original.publicRegistrations, 21);
  assert.equal(original.permissionGuardedRegistrations, 43);
  assert.equal(original.controllerEarlyReturns, 22);
  assert.equal(original.guardedEarlyReturns, 22);
  assert.equal(original.danglingHandlerImports, 0);

  assert(
    original.evidence.silentByHandler.every(
      ({ authenticated, paths }) => authenticated && paths.length
    )
  );
});

//===================================================================

test('A4 is read-only and refuses all write and ambiguous CLI modes', () => {
  assert.doesNotThrow(() => assertReadOnlyCheckFlags(['--check']));

  for (const args of [
    [],
    ['--apply'],
    ['--dry-run'],
    ['--check', '--apply'],
    ['--check', '--check'],
    ['--unknown'],
  ]) {
    assert.throws(() => assertReadOnlyCheckFlags(args), /A4 is read-only/);
  }
});

//===================================================================

test('A4 detects missing authentication for globally protected order routes', () => {
  failing(
    mutated(
      'orders/order.routes.ts',
      'orderRoutes.use(authenticate);',
      '// removed global authentication'
    ),
    'silent early return createManagerOrder'
  );
});

//===================================================================

test('A4 rejects loss of admin global authorization', () => {
  failing(
    mutated(
      'admin/admin.routes.ts',
      'resolveAdminAuthorization\n);',
      'authenticate\n);'
    ),
    'missing admin router-wide auth/RBAC/authorization'
  );
});

//===================================================================

test('A4 rejects role checks before authentication', () => {
  failing(
    mutated(
      'pharmacies/pharmacy-note.routes.ts',
      'authenticate, authorizeRoles(USER_ROLES.PHARMACY)',
      'authorizeRoles(USER_ROLES.PHARMACY), authenticate'
    ),
    'role authorization before authentication'
  );
});

//===================================================================

test('A4 protects trusted BFF secret before login and refresh handlers', () => {
  failing(
    mutated(
      'auth/auth.routes.ts',
      "  '/login',\n  requireTrustedAuthProxy,",
      "  '/login',"
    ),
    'BFF secret verification'
  );
});

//===================================================================

test('A4 catches duplicate HTTP paths and dynamic precedence conflicts', () => {
  failing(
    mutated('pharmacies/pharmacy.routes.ts', "  '/options',", "  '/filters',"),
    'Duplicate HTTP route'
  );

  failing(
    mutated('pharmacies/pharmacy.routes.ts', "  '/options',", "  '/:search',"),
    'Route shadowed'
  );
});

//===================================================================

test('A4 rejects missing or weakened per-route admin permissions even with unchanged route counts', () => {
  failing(
    mutated(
      'admin/admin.routes.ts',
      'requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.moderate)',
      'requireAdminPermission(ADMIN_PERMISSIONS.pharmacies.view)'
    ),
    'Pinned route access contract drift'
  );
});

//===================================================================

test('A4 verifies direct canonical controller imports, rejecting a missing handler', () => {
  failing(
    mutated(
      'orders/order.routes.ts',
      'ctrlWrapper(getOrders)',
      'ctrlWrapper(unregisteredOrdersHandler)'
    ),
    'handler unregisteredOrdersHandler not imported directly'
  );
});

//===================================================================

test('A4 rejects additional mounts and missing pharmacy alias', () => {
  failing(
    mutated(
      'index.ts',
      "routes.use('/pharmacy', pharmacyRoutes);",
      "routes.use('/pharmacy-legacy', pharmacyRoutes);"
    ),
    'Legacy /pharmacy alias'
  );
});

//===================================================================

test('A4 rejects production exposure of temporary role test endpoints', () => {
  failing(
    mutated(
      'auth/auth.routes.ts',
      "if (env.NODE_ENV !== 'production')",
      "if (env.NODE_ENV === 'production')"
    ),
    'test route exposed to production'
  );
});

//===================================================================

test('A4 scan never mutates route sources or legacy transport manifests', () => {
  const files = [
    'apps/api/src/routes/admin/admin.routes.ts',
    'apps/api/src/routes/index.ts',
    'docs/architecture/transport-c1/transport-relocation-map.json',
  ];

  const before = files.map((file) => readFileSync(join(ROOT, file), 'utf8'));

  auditRoutes(ROOT);

  for (const [index, file] of files.entries())
    assert.equal(readFileSync(join(ROOT, file), 'utf8'), before[index]);
});
