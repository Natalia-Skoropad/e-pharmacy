#!/usr/bin/env node
// A4: read-only inspection of the actual TypeScript Express router graph.
// Route/guard ownership is derived from AST nodes, never from invented regex routes.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ROUTE_ROOT = 'apps/api/src/routes';
const CONTROLLER_ROOT = 'apps/api/src/controllers';

//===================================================================

const METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

//===================================================================

const EARLY_RETURN =
  /\bif\s*\(\s*!\s*(?:adminUserId|userId|user|req\.user\?\.id)\s*\)\s*return\s*;/g;

//===================================================================

const source = (name, content) =>
  ts.createSourceFile(
    name,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

//===================================================================

const normalize = (value) => value.replaceAll('\\', '/');

//===================================================================

function allFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = join(dir, entry.name);

    return entry.isDirectory() ? allFiles(name) : entry.isFile() ? [name] : [];
  });
}

//===================================================================

function unwrap(node) {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))
    node = node.expression;

  return node;
}

//===================================================================

function text(node, ast) {
  return node?.getText(ast) ?? '';
}

//===================================================================

function leaf(call) {
  return ts.isCallExpression(call) && ts.isIdentifier(call.expression)
    ? call.expression.text
    : '';
}

//===================================================================

function basenameRoute(route) {
  return route.replace(/:\w+/g, ':param');
}

//===================================================================

function routeSegments(route) {
  return route.split('/').filter(Boolean);
}

//===================================================================

function overshadows(before, after) {
  const a = routeSegments(before),
    b = routeSegments(after);

  return (
    a.length === b.length &&
    a.every(
      (segment, i) =>
        segment === b[i] || segment.startsWith(':') || segment === '*'
    )
  );
}

//===================================================================

function handlerName(arg) {
  const input = unwrap(arg);

  if (
    leaf(input) !== 'ctrlWrapper' ||
    input.arguments.length !== 1 ||
    !ts.isIdentifier(input.arguments[0])
  )
    return null;

  return input.arguments[0].text;
}

//===================================================================

function extractRoutes(file, code) {
  const ast = source(file, code);
  const handlers = [];
  const uses = [];
  const imports = new Map();
  const errors = [];

  if (ast.parseDiagnostics.length)
    errors.push(`${file}: TypeScript syntax error`);

  for (const statement of ast.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      const origin = statement.moduleSpecifier.text;

      for (const element of statement.importClause.namedBindings.elements) {
        imports.set(element.name.text, {
          origin,
          imported: element.propertyName?.text ?? element.name.text,
        });
      }
    }
  }

  function visit(node, withinProductionGate = false) {
    let guarded = withinProductionGate;

    if (
      ts.isIfStatement(node) &&
      /env\.NODE_ENV\s*!==\s*['"]production['"]/.test(
        text(node.expression, ast)
      )
    ) {
      visit(node.thenStatement, true);
      if (node.elseStatement) visit(node.elseStatement, withinProductionGate);

      return;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const router = text(node.expression.expression, ast),
        method = node.expression.name.text;

      if (router.endsWith('Routes') || router === 'routes') {
        if (method === 'use') {
          uses.push({
            file,
            router,
            args: node.arguments.map((arg) => text(arg, ast)),
            pos: node.getStart(ast),
          });
        } else if (METHODS.has(method)) {
          const first = node.arguments[0];

          if (!first || !ts.isStringLiteral(first))
            errors.push(`${file}: dynamic route path`);
          else {
            const chain = node.arguments.slice(1).map((arg) => text(arg, ast));
            const last = node.arguments.at(-1);
            const handler = last && handlerName(last);

            if (!handler)
              errors.push(
                `${file}: ${method.toUpperCase()} ${first.text} must end in ctrlWrapper(namedHandler)`
              );

            handlers.push({
              file,
              router,
              method: method.toUpperCase(),
              path: first.text,
              chain,
              handler,
              pos: node.getStart(ast),
              testOnly: guarded,
            });
          }
        }
      }
    }

    ts.forEachChild(node, (child) => visit(child, guarded));
  }

  visit(ast);

  return { imports, handlers, uses, errors };
}

//===================================================================

function authGuards(root, file, content) {
  const ast = source(file, content);
  const results = [];

  for (const statement of ast.statements) {
    if (
      !ts.isFunctionDeclaration(statement) ||
      !statement.name ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;

    const matches = [...statement.getText(ast).matchAll(EARLY_RETURN)];

    for (let index = 0; index < matches.length; index++)
      results.push({ file, handler: statement.name.text });
  }

  return results;
}

//===================================================================

/** Injection hooks exist solely for safe, deterministic, in-memory negative tests. */
export function auditRoutes(root = ROOT, fixture = undefined) {
  const errors = [];
  const routeDir = join(root, ROUTE_ROOT);

  const routeFiles = allFiles(routeDir).filter(
    (f) => f.endsWith('.routes.ts') || f === join(routeDir, 'index.ts')
  );

  const controllerFiles = allFiles(join(root, CONTROLLER_ROOT)).filter((f) =>
    f.endsWith('.controller.ts')
  );

  const overrides = fixture?.sourceOverrides ?? new Map();

  const read = (name) =>
    overrides.get(name) ?? readFileSync(join(root, name), 'utf8');

  const sourceRoutes = [];
  const routerUses = [];
  const routeStats = {};

  const controllerImports = new Map();
  const routingImports = new Map();

  for (const abs of routeFiles) {
    const file = normalize(relative(root, abs));
    const extracted = extractRoutes(file, read(file));

    sourceRoutes.push(...extracted.handlers);
    routerUses.push(...extracted.uses);
    errors.push(...extracted.errors);
    routeStats[file.slice(ROUTE_ROOT.length + 1)] = extracted.handlers.length;
    routingImports.set(file, extracted.imports);

    for (const [name, declaration] of extracted.imports) {
      if (declaration.origin.includes('/controllers/')) {
        const controllerFile = normalize(
          join(dirname(file), declaration.origin + '.ts')
        );

        controllerImports.set(`${file}:${name}`, {
          controllerFile,
          imported: declaration.imported,
        });
      }
    }
  }

  const top = routerUses.filter(
    (u) => u.router === 'routes' && /^'\//.test(u.args[0] ?? '')
  );

  const mounts = top.map((use) => ({
    prefix: use.args[0].slice(1, -1),
    router: use.args[1],
  }));

  if (mounts.length !== 13)
    errors.push(`Expected 13 router mounts, got ${mounts.length}`);

  if (new Set(mounts.map((m) => m.prefix)).size !== mounts.length)
    errors.push('Duplicate top-level mount prefix');

  if (sourceRoutes.length !== 159)
    errors.push(
      `Expected 159 HTTP method registrations, got ${sourceRoutes.length}`
    );

  if (routeFiles.length !== 13)
    errors.push(
      `Expected 12 route modules plus one aggregator, got ${routeFiles.length}`
    );

  const routeKeys = new Set();
  const ordered = new Map();

  let protectedRoutes = 0,
    publicRoutes = 0,
    permissionGuarded = 0,
    danglingHandlerImports = 0;

  const routes = [];

  for (const item of sourceRoutes) {
    const localUses = routerUses.filter(
      (u) =>
        u.router === item.router &&
        u.file === item.file &&
        u.pos < item.pos &&
        (u.args[0] ?? '') !== "'/'" &&
        !/^['"]\//.test(u.args[0] ?? '')
    );

    const globals = localUses.flatMap((use) => use.args);
    const guardChain = [...globals, ...item.chain];

    const guardAuthIndex = guardChain.findIndex(
      (name) => name === 'authenticate'
    );

    const roleIndex = guardChain.findIndex((name) =>
      name.startsWith('authorizeRoles(')
    );

    const permissionIndex = guardChain.findIndex((name) =>
      name.startsWith('requireAdminPermission(')
    );

    const authorized = guardAuthIndex !== -1;
    const scopedAdmin = item.router === 'adminRoutes';

    if (roleIndex >= 0 && (!authorized || guardAuthIndex > roleIndex))
      errors.push(
        `${item.file} ${item.method} ${item.path}: role authorization before authentication`
      );

    if (
      permissionIndex >= 0 &&
      (!authorized || guardAuthIndex > permissionIndex)
    )
      errors.push(
        `${item.file} ${item.method} ${item.path}: permission authorization before authentication`
      );

    if (
      scopedAdmin &&
      (!authorized ||
        !guardChain.includes('resolveAdminAuthorization') ||
        roleIndex === -1)
    )
      errors.push(
        `${item.file} ${item.method} ${item.path}: missing admin router-wide auth/RBAC/authorization`
      );

    if (
      item.router === 'pharmacyNoteRoutes' &&
      (!authorized || roleIndex === -1)
    )
      errors.push(
        `${item.file} ${item.method} ${item.path}: missing pharmacy note auth/RBAC`
      );

    if (item.router === 'cartRoutes' && (!authorized || roleIndex === -1))
      errors.push(
        `${item.file} ${item.method} ${item.path}: missing client cart auth/RBAC`
      );

    if (authorized) protectedRoutes++;
    else publicRoutes++;

    if (permissionIndex !== -1) permissionGuarded++;

    if (
      item.testOnly &&
      (!item.path.startsWith('/test/') || !authorized || roleIndex === -1)
    )
      errors.push(
        `${item.file} ${item.path}: nonproduction test endpoint not protected`
      );

    if (item.path.startsWith('/test/') && !item.testOnly)
      errors.push(
        `${item.file} ${item.path}: test route exposed to production`
      );

    const declaration = controllerImports.get(`${item.file}:${item.handler}`);

    if (
      !declaration ||
      !existsSync(join(root, declaration.controllerFile)) ||
      !new RegExp(
        `\\bexport\\s+(?:async\\s+)?function\\s+${declaration.imported}\\s*\\(`
      ).test(read(declaration.controllerFile))
    ) {
      errors.push(
        `${item.file}: handler ${item.handler} not imported directly from its canonical controller`
      );

      danglingHandlerImports++;
    }

    const mount = mounts.filter((m) => m.router === item.router);

    if (mount.length === 0)
      errors.push(`${item.file}: unmounted router ${item.router}`);

    for (const m of mount) {
      const fullPath = (
        m.prefix + (item.path === '/' ? '' : item.path)
      ).replace(/\/+/g, '/');

      const key = `${item.method} ${basenameRoute(fullPath)}`;

      if (routeKeys.has(key)) errors.push(`Duplicate HTTP route ${key}`);

      routeKeys.add(key);

      const previous = ordered.get(`${m.prefix}:${item.method}`) ?? [];

      for (const earlier of previous)
        if (overshadows(earlier, item.path)) {
          errors.push(
            `Route shadowed by earlier dynamic path: ${item.method} ${fullPath} after ${m.prefix}${earlier}`
          );

          break;
        }

      previous.push(item.path);
      ordered.set(`${m.prefix}:${item.method}`, previous);

      routes.push({
        method: item.method,
        path: fullPath,
        handler: item.handler,
        authorized,
        roles: guardChain.filter((s) => s.startsWith('authorizeRoles(')),

        permissions: guardChain.filter((s) =>
          s.startsWith('requireAdminPermission(')
        ),

        testOnly: item.testOnly,
      });
    }
  }

  // Global/middleware checks for token-bearing authentication must retain the verified BFF boundary.
  for (const endpoint of ['/register', '/login', '/refresh']) {
    const item = sourceRoutes.find(
      (r) =>
        r.router === 'authRoutes' && r.method === 'POST' && r.path === endpoint
    );

    const proxyIndex = item?.chain.indexOf('requireTrustedAuthProxy') ?? -1;

    const handlerIndex =
      item?.chain.findIndex((v) => v.startsWith('ctrlWrapper(')) ?? -1;

    if (
      !item ||
      proxyIndex < 0 ||
      proxyIndex > handlerIndex ||
      proxyIndex !== 0
    )
      errors.push(
        `POST /auth${endpoint}: BFF secret verification must precede validation/limits/handler`
      );
  }

  const lastAuth = sourceRoutes.filter(
    (r) =>
      r.router === 'authRoutes' &&
      ['/password-reset/request', '/password-reset/confirm'].includes(r.path)
  );

  if (
    lastAuth.length !== 2 ||
    lastAuth.some((r) => !r.chain.some((c) => c.startsWith('passwordReset')))
  )
    errors.push('Password reset routes lost rate limiting');

  const silent = controllerFiles.flatMap((abs) => {
    const file = normalize(relative(root, abs));

    return authGuards(root, file, read(file));
  });

  if (silent.length !== 22)
    errors.push(
      `Expected 22 existing controller early returns, got ${silent.length}`
    );

  const silentByHandler = [];

  for (const guard of silent) {
    const matching = routes.filter((route) => route.handler === guard.handler);
    if (!matching.length || matching.some((route) => !route.authorized))
      errors.push(
        `${guard.file}: silent early return ${guard.handler} is reachable without required authentication`
      );

    silentByHandler.push({
      ...guard,
      paths: matching.map(({ method, path }) => `${method} ${path}`),

      authenticated:
        matching.length > 0 && matching.every((route) => route.authorized),
    });
  }

  // Canonical shared BFF guard and checks are the source of truth; never fake a browser proxy here.
  const bffChecks = [
    'scripts/checks/routes/check-next-api-routes.mjs',
    'scripts/checks/contracts/check-next-api-contracts.mjs',
  ];

  for (const check of bffChecks)
    if (!existsSync(join(root, check)))
      errors.push(`Missing existing BFF parity gate: ${check}`);

  const doubleMount = mounts
    .filter((m) => m.router === 'pharmacyRoutes')
    .map((m) => m.prefix)
    .sort();

  if (
    JSON.stringify(doubleMount) !== JSON.stringify(['/pharmacies', '/pharmacy'])
  )
    errors.push(
      'Legacy /pharmacy alias is not preserved alongside /pharmacies'
    );

  const pinnedPath = join(
    root,
    'docs/architecture/routes-a4/route-contracts.json'
  );

  if (existsSync(pinnedPath)) {
    const approved = JSON.parse(readFileSync(pinnedPath, 'utf8'));

    const observed = routes.map(
      ({
        method,
        path,
        handler,
        authorized,
        roles,
        permissions,
        testOnly,
      }) => ({
        method,
        path,
        handler,
        authorized,
        roles,
        permissions,
        testOnly,
      })
    );

    if (approved.stage !== 'A4' || approved.registryVersion !== 1)
      errors.push('Invalid A4 pinned contract registry');

    if (approved.endpoints.length !== 190)
      errors.push(
        'A4 pinned registry must contain exactly 190 mounted endpoints'
      );

    for (
      let i = 0;
      i < Math.max(approved.endpoints.length, observed.length);
      i++
    ) {
      if (
        JSON.stringify(approved.endpoints[i]) !== JSON.stringify(observed[i])
      ) {
        const route = observed[i] ?? approved.endpoints[i];

        errors.push(
          `Pinned route access contract drift at ${i}: ${route?.method} ${route?.path}`
        );

        if (
          errors.filter((e) => e.startsWith('Pinned route access')).length >= 5
        )
          break;
      }
    }
  } else if (!fixture?.allowMissingRegistry)
    errors.push('Missing A4 pinned route-contracts.json registry');

  const result = {
    stage: 'A4',
    status: errors.length ? 'FAIL' : 'PASS',
    routeFiles: routeFiles.length - 1,
    routerMounts: mounts.length,
    methodRegistrations: sourceRoutes.length,
    mountedEndpoints: routes.length,
    protectedRegistrations: protectedRoutes,
    publicRegistrations: publicRoutes,
    permissionGuardedRegistrations: permissionGuarded,
    controllerEarlyReturns: silent.length,
    guardedEarlyReturns: silentByHandler.filter((g) => g.authenticated).length,
    danglingHandlerImports,
    sourceRouteFiles: routeStats,

    warnings: [
      '22 pre-existing controller early returns are unreachable without passing authenticate; they remain a defensive-response quality issue, not an A4 guard bypass.',
      'The /pharmacy and /pharmacies mounts are an intentional alias. Admin route declarations remain in one module to preserve legacy static contracts.',
    ],

    errors,
  };

  return { ...result, evidence: { mounts, routes, silentByHandler } };
}

//===================================================================

export function assertReadOnlyCheckFlags(args) {
  if (args.length !== 1 || args[0] !== '--check')
    throw new Error('A4 is read-only. Only --check is supported.');
}

//===================================================================

function cli() {
  assertReadOnlyCheckFlags(process.argv.slice(2));

  const result = auditRoutes();

  console.log(JSON.stringify({ ...result, evidence: undefined }, null, 2));
  assert.equal(result.status, 'PASS', result.errors.join('\n'));
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    cli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
