import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { auditMiddlewares, runAudit } from './check-api-middlewares-a2.mjs';

//===================================================================

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const read = (name) => readFileSync(join(root, name), 'utf8');
const middlewareRoot = 'apps/api/src/middlewares/';
const controllerRoot = 'apps/api/src/controllers/';
const routeRoot = 'apps/api/src/routes/';

//===================================================================

const manifest = JSON.parse(
  read('docs/architecture/middlewares-a2/controller-decomposition.json')
);

//===================================================================

const middlewarePaths = [
  'admin/admin-permission.middleware.ts',
  'auth/auth-bff.middleware.ts',
  'auth/auth.middleware.ts',
  'auth/role.middleware.ts',
  'http/error.middleware.ts',
  'http/notFound.middleware.ts',
  'http/request-context.middleware.ts',
  'http/validate.middleware.ts',
  'pharmacies/pharmacy-selection.middleware.ts',
  'security/origin.middleware.ts',
  'security/rate-limit-security.ts',
  'security/rateLimit.middleware.ts',
];

//===================================================================

function inputs() {
  const names = Object.values(manifest.controllerGroups).flat();

  return {
    middlewareFiles: Object.fromEntries(
      middlewarePaths.map((path) => [path, read(middlewareRoot + path)])
    ),

    controllers: Object.fromEntries(
      names.map((path) => [path, read(controllerRoot + path)])
    ),

    routes: Object.fromEntries(
      [
        'admin/admin.routes.ts',
        'auth/auth.routes.ts',
        'pharmacies/pharmacy.routes.ts',
      ].map((path) => [path, read(routeRoot + path)])
    ),

    appSource: read('apps/api/src/app.ts'),
    manifest,
  };
}

//===================================================================

test('A2 preserves 12 middleware implementations and 80 real handlers across 16 canonical modules', () => {
  const result = runAudit();

  assert.equal(result.status, 'PASS', JSON.stringify(result.errors));
  assert.equal(result.middlewareFiles, 12);
  assert.equal(result.preservedControllerHandlers, 80);
  assert.equal(result.controllerModules, 16);
  assert.equal(result.proxyFiles, 0);
});

//===================================================================

test('A2 is read-only and refuses accidental write modes', () => {
  const tool = join(
    root,
    'scripts/architecture/audits/check-api-middlewares-a2.mjs'
  );

  const valid = spawnSync(process.execPath, [tool, '--check'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(valid.status, 0, valid.stderr);

  for (const invalid of [
    ['--apply'],
    ['--dry-run'],
    [],
    ['--check', '--apply'],
  ]) {
    const result = spawnSync(process.execPath, [tool, ...invalid], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0, invalid.join(' '));
  }
});

//===================================================================

test('A2 rejects removing the trusted BFF secret verification', () => {
  const input = inputs();

  input.middlewareFiles['auth/auth-bff.middleware.ts'] = input.middlewareFiles[
    'auth/auth-bff.middleware.ts'
  ].replace(
    "typeof secret === 'string' && secret === configuredSecret",
    'true'
  );

  assert.match(auditMiddlewares(input).errors.join('\n'), /BFF marker/);
});

//===================================================================

test('A2 rejects removal of explicit permissions or anonymous-role protection', () => {
  const input = inputs();

  input.middlewareFiles['admin/admin-permission.middleware.ts'] =
    input.middlewareFiles['admin/admin-permission.middleware.ts'].replace(
      '!hasAdminPermission(req.adminAuthorization, permission)',
      'false'
    );

  input.middlewareFiles['auth/role.middleware.ts'] = input.middlewareFiles[
    'auth/role.middleware.ts'
  ].replace('if (!req.user)', 'if (false)');

  const errors = auditMiddlewares(input).errors.join('\n');

  assert.match(errors, /RBAC evaluator/);
  assert.match(errors, /role guard/);
});

//===================================================================

test('A2 rejects a modified relocated handler and a second handler owner', () => {
  const input = inputs();
  const target = manifest.handlerFingerprints.getAdminPharmacyDocument.module;

  input.controllers[target] = input.controllers[target].replace(
    "'private, no-store'",
    "'public, max-age=86400'"
  );

  assert.match(
    auditMiddlewares(input).errors.join('\n'),
    /handler implementation changed/
  );

  const input2 = inputs();

  input2.controllers['admin/admin.controller.ts'] +=
    '\n' +
    input2.controllers[target].match(
      /export async function getAdminPharmacyDocument[\s\S]*/
    )[0];

  const errors = auditMiddlewares(input2).errors.join('\n');

  assert.match(
    errors,
    /duplicate handler export|wrong canonical handler owner/
  );
});

//===================================================================

test('A2 rejects legacy proxy exports, missing request-local pharmacy selection or a missing route registration', () => {
  const input = inputs();

  input.middlewareFiles['auth/role.middleware.ts'] +=
    '\nexport * from "./old-role.middleware";';

  input.appSource = input.appSource.replace(
    'app.use(attachPharmacySelection)',
    'app.use((_req, _res, next) => next())'
  );

  input.routes['admin/admin.routes.ts'] = input.routes[
    'admin/admin.routes.ts'
  ].replaceAll('getAdminPharmacyDocument', 'oldDownloadHandler');

  const errors = auditMiddlewares(input).errors.join('\n');

  assert.match(errors, /compatibility\/proxy/);
  assert.match(errors, /pharmacy selection middleware is not mounted/);
  assert.match(errors, /route no longer references/);
});
