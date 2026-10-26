#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const MIDDLEWARE_ROOT = 'apps/api/src/middlewares';
const CONTROLLER_ROOT = 'apps/api/src/controllers';
const REPORT = 'docs/architecture/middlewares-a2/controller-decomposition.json';

const read = (path, root = ROOT) => readFileSync(join(root, path), 'utf8');
const digest = (text) => createHash('sha256').update(text).digest('hex');

//===================================================================

function walk(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const pathname = join(dir, entry.name);

    return entry.isDirectory()
      ? walk(pathname)
      : entry.isFile()
        ? [pathname]
        : [];
  });
}

//===================================================================

const has = (source, match) => match.test(source);
const handlerPattern = /^export (?:async )?function\s+(\w+)\s*\(/gm;

//===================================================================

// Match the exact source of each relocated exported function, excluding only
// separator comments after the closing brace. This is a relocation regression
// check; it intentionally does not hash imports, which are expected to change.
export function getHandlerChunks(text) {
  const matches = [...text.matchAll(handlerPattern)];

  return Object.fromEntries(
    matches.map((match, index) => {
      const start = match.index;

      const end =
        index + 1 < matches.length ? matches[index + 1].index : text.length;

      const body = text
        .slice(start, end)
        .replace(/\n\s*\/{2}={5,}\s*$/s, '')
        .trimEnd();

      return [match[1], body];
    })
  );
}

//===================================================================

export function auditMiddlewares({
  middlewareFiles,
  controllers,
  routes,
  appSource,
  manifest,
}) {
  const errors = [];
  const warnings = [];

  const requirePattern = (file, rule, pattern) => {
    if (!has(middlewareFiles[file] ?? '', pattern))
      errors.push(`${file}: ${rule}`);
  };

  const files = Object.keys(middlewareFiles).sort();

  if (files.length !== 12)
    errors.push(
      `Expected 12 production middleware files; found ${files.length}`
    );

  for (const file of files) {
    const code = middlewareFiles[file];

    if (/export\s+\*\s+from|export\s*\{[^}]+\}\s*from/.test(code)) {
      errors.push(`${file}: compatibility/proxy re-export is not permitted`);
    }
  }

  requirePattern(
    'auth/auth.middleware.ts',
    'current access cookie must precede legacy fallback',
    /return \[\.\.\.accessCandidates, \.\.\.legacyCandidates\]/
  );

  requirePattern(
    'auth/auth.middleware.ts',
    'session must be verified before req.user',
    /await assertActiveSessionService\([\s\S]*?await getUserByIdService\([\s\S]*?req\.user = user/
  );

  requirePattern(
    'auth/auth.middleware.ts',
    'optional authentication must reject invalid presented tokens',
    /export async function optionalAuthenticate[\s\S]*?await authenticateToken\(req\)[\s\S]*?next\(error\)/
  );

  requirePattern(
    'auth/auth-bff.middleware.ts',
    'BFF marker is not sufficient without secret',
    /marker !== BFF_AUTH_PROXY_MARKER_VALUE[\s\S]*?typeof secret === 'string' && secret === configuredSecret/
  );

  if (
    !/if \(!req\.user\)/.test(
      (middlewareFiles['auth/role.middleware.ts'] ?? '').split(
        'export async function requireActivePharmacy'
      )[0]
    )
  )
    errors.push('auth/role.middleware.ts: role guard rejects anonymous users');

  requirePattern(
    'admin/admin-permission.middleware.ts',
    'unknown permissions must fail closed',
    /if \(!isAdminPermission\(permission\)\)/
  );

  requirePattern(
    'admin/admin-permission.middleware.ts',
    'RBAC evaluator must be used',
    /!hasAdminPermission\(req\.adminAuthorization, permission\)/
  );

  requirePattern(
    'pharmacies/pharmacy-selection.middleware.ts',
    'selection must remain request-local',
    /new AsyncLocalStorage<string \| undefined>\(\)/
  );

  requirePattern(
    'pharmacies/pharmacy-selection.middleware.ts',
    'invalid pharmacy ID must reject',
    /!Types\.ObjectId\.isValid\(value\)/
  );

  requirePattern(
    'auth/role.middleware.ts',
    'active pharmacy must use canonical capability',
    /requirePharmacyCapability\([\s\S]*?'read_orders'/
  );

  const joinedRoutes = Object.values(routes).join('\n');

  if (!has(routes['admin/admin.routes.ts'] ?? '', /resolveAdminAuthorization/))
    errors.push('admin routes: authorization resolver missing');

  if (!has(routes['admin/admin.routes.ts'] ?? '', /requireAdminPermission/))
    errors.push('admin routes: permission guards missing');

  if (
    !has(
      routes['auth/auth.routes.ts'] ?? '',
      /'\/login'[\s\S]*?requireTrustedAuthProxy[\s\S]*?ctrlWrapper\(loginUser\)/
    )
  )
    errors.push('auth routes: login BFF boundary missing');

  if (
    !has(
      routes['auth/auth.routes.ts'] ?? '',
      /'\/refresh'[\s\S]*?requireTrustedAuthProxy[\s\S]*?ctrlWrapper\(refreshAuthSession\)/
    )
  )
    errors.push('auth routes: refresh BFF boundary missing');

  if (
    !has(
      routes['pharmacies/pharmacy.routes.ts'] ?? '',
      /authorizeRoles\(USER_ROLES\.PHARMACY\)/
    )
  )
    errors.push('pharmacy routes: role guard missing');

  if (!has(appSource ?? '', /app\.use\(attachPharmacySelection\)/))
    errors.push('pharmacy selection middleware is not mounted');

  const seen = new Set();
  const ownedModules = new Set();

  let preservedHandlers = 0;

  for (const [originalPath, modules] of Object.entries(
    manifest.controllerGroups ?? {}
  )) {
    if (modules[0] !== originalPath || modules.length < 2)
      errors.push(`${originalPath}: invalid decomposition`);

    for (const file of modules) {
      const source = controllers[file];

      if (!source) {
        errors.push(`${file}: canonical module missing`);
        continue;
      }

      if (ownedModules.has(file))
        errors.push(`${file}: multiple canonical owners`);

      ownedModules.add(file);

      if (/export\s*\*\s*from|export\s*\{[^}]+\}\s*from/.test(source))
        errors.push(`${file}: proxy exports forbidden`);

      if (source.split(/\r?\n/).length > 300)
        errors.push(`${file}: exceeds 300-line decomposition limit`);

      for (const [name, body] of Object.entries(getHandlerChunks(source))) {
        const expected = manifest.handlerFingerprints[name];

        if (!expected || expected.module !== file)
          errors.push(`${name}: wrong canonical handler owner`);
        else if (digest(body) !== expected.sha256)
          errors.push(`${name}: handler implementation changed in relocation`);

        if (seen.has(name)) errors.push(`${name}: duplicate handler export`);

        if (!new RegExp(`\\b${name}\\b`).test(joinedRoutes))
          errors.push(`${name}: route no longer references handler`);

        seen.add(name);
        preservedHandlers += 1;
      }
    }
  }

  if (preservedHandlers !== 80)
    errors.push(
      `Expected 80 preserved handlers across three decomposed controllers; got ${preservedHandlers}`
    );

  if (Object.keys(manifest.handlerFingerprints ?? {}).length !== 80)
    errors.push('Controller baseline must contain 80 pinned handlers');

  warnings.push(
    'Auth middleware shares error-forwarding branches between required and optional authentication; behavior differs at no-token boundary, so leave unchanged until behavioral tests cover extraction.'
  );

  warnings.push(
    'Cookie parsing in controller session operations and authentication middleware has different ordering semantics; not a confirmed safe duplicate.'
  );
  warnings.push(
    'A1 identified 22 silent authentication returns in controllers; recheck complete route chains during A4 before changing behavior.'
  );

  return {
    status: errors.length ? 'FAIL' : 'PASS',
    stage: 'A2',
    middlewareFiles: files.length,
    preservedControllerHandlers: preservedHandlers,
    controllerModules: ownedModules.size,

    proxyFiles: files.filter((file) =>
      /export\s+\*\s+from/.test(middlewareFiles[file])
    ).length,

    warnings,
    errors,
  };
}

//===================================================================

export function runAudit(root = ROOT) {
  const collect = (dir) =>
    Object.fromEntries(
      walk(join(root, dir))
        .filter((p) => p.endsWith('.ts') && !p.endsWith('.test.ts'))
        .map((p) => [
          relative(join(root, dir), p).replaceAll('\\', '/'),
          readFileSync(p, 'utf8'),
        ])
    );

  const allRoutes = collect('apps/api/src/routes');

  return auditMiddlewares({
    middlewareFiles: collect(MIDDLEWARE_ROOT),
    controllers: collect(CONTROLLER_ROOT),
    routes: allRoutes,
    appSource: read('apps/api/src/app.ts', root),
    manifest: JSON.parse(read(REPORT, root)),
  });
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assert.deepEqual(process.argv.slice(2), ['--check'], 'A2 is read-only');

  const result = runAudit();

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length) process.exitCode = 1;
}
