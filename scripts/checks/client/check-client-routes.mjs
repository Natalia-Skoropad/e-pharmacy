import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const privateRoot = path.join(root, 'apps/client/src/app/(private)');

const guestRoot = path.join(
  root,
  'apps/client/src/app/(public)/(auth)/(guest)'
);

//===================================================================

async function collectFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory)) {
    const target = path.join(directory, entry);
    const info = await stat(target);

    if (info.isDirectory()) files.push(...(await collectFiles(target)));
    else files.push(target);
  }

  return files;
}

//===================================================================

const privateLayout = await readFile(
  path.join(privateRoot, 'layout.tsx'),
  'utf8'
);

assert.match(privateLayout, /ClientProtectedRoute/);

const privatePages = (await collectFiles(privateRoot)).filter((file) =>
  file.endsWith(`${path.sep}page.tsx`)
);

for (const file of privatePages) {
  const source = await readFile(file, 'utf8');
  assert.doesNotMatch(
    source,
    /ProtectedRoute/,
    `${path.relative(root, file)} must inherit the private layout policy.`
  );
}

//===================================================================

const guestLayout = await readFile(path.join(guestRoot, 'layout.tsx'), 'utf8');
assert.match(guestLayout, /ClientGuestOnlyRoute/);

for (const route of ['login', 'register', 'password-recovery']) {
  const page = path.join(guestRoot, route, 'page.tsx');
  const source = await readFile(page, 'utf8');
  assert.doesNotMatch(source, /GuestOnlyRoute/);
}

const resetPassword = await readFile(
  path.join(
    root,
    'apps/client/src/app/(public)/(auth)/reset-password/page.tsx'
  ),
  'utf8'
);

assert.doesNotMatch(resetPassword, /GuestOnlyRoute/);

const protectedAdapter = await readFile(
  path.join(root, 'apps/client/src/routes/ProtectedRoute/ProtectedRoute.tsx'),
  'utf8'
);

assert.match(
  protectedAdapter,
  /authorizeUser=\{canAccessClientPrivateRoutes\}/
);

const accessDecision = await readFile(
  path.join(root, 'apps/client/src/lib/auth/client-route-access.ts'),
  'utf8'
);

assert.match(accessDecision, /user\.role === 'client'/);
assert.match(accessDecision, /user\.status === 'active'/);

const proxy = await readFile(path.join(root, 'apps/client/proxy.ts'), 'utf8');
assert.match(proxy, /CLIENT_PRIVATE_ROUTE_PREFIXES/);

const accessPolicy = await readFile(
  path.join(root, 'apps/client/src/lib/routes/access-policy.ts'),
  'utf8'
);

const routeSegmentsSource = await readFile(
  path.join(root, 'apps/client/src/lib/routes/route-segments.ts'),
  'utf8'
);

const routesSource = await readFile(
  path.join(root, 'apps/client/src/lib/routes/routes.ts'),
  'utf8'
);

const segmentValues = new Map(
  [...routeSegmentsSource.matchAll(/(\w+):\s*'([^']+)'/g)].map((match) => [
    match[1],
    match[2],
  ])
);

const routeValues = new Map();
for (const match of routesSource.matchAll(
  /(\w+):\s*`\/\$\{ROUTE_SEGMENTS\.(\w+)\}`/g
)) {
  const segment = segmentValues.get(match[2]);
  assert.ok(segment, `Missing ROUTE_SEGMENTS.${match[2]} value.`);
  routeValues.set(match[1], `/${segment}`);
}

const privateArray = accessPolicy.match(
  /CLIENT_PRIVATE_ROUTE_PREFIXES\s*=\s*\[([\s\S]*?)\]\s*as const/
)?.[1];

assert.ok(privateArray, 'CLIENT_PRIVATE_ROUTE_PREFIXES must remain explicit.');

const registeredPrivateRoots = [...privateArray.matchAll(/ROUTES\.(\w+)/g)]
  .map((match) => {
    const value = routeValues.get(match[1]);
    assert.ok(value, `Unable to resolve ROUTES.${match[1]}.`);
    return value;
  })
  .sort();

const actualPrivateRoots = (await readdir(privateRoot, { withFileTypes: true }))
  .filter(
    (entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith('(') &&
      !entry.name.startsWith('@')
  )
  .map((entry) => `/${entry.name}`)
  .sort();

const matcherBlock = proxy.match(/matcher:\s*\[([\s\S]*?)\]/)?.[1];
assert.ok(matcherBlock, 'proxy.config.matcher must remain explicit.');

const proxyMatcherRoots = [...matcherBlock.matchAll(/['"]([^'"]+)['"]/g)]
  .map((match) => match[1].replace(/\/:path\*$/, ''))
  .sort();

assert.deepEqual(
  registeredPrivateRoots,
  actualPrivateRoots,
  'Private App Router roots must match CLIENT_PRIVATE_ROUTE_PREFIXES.'
);

assert.deepEqual(
  proxyMatcherRoots,
  actualPrivateRoots,
  'proxy.config.matcher must match the actual private App Router roots.'
);

const routePolicy = await readFile(
  path.join(root, 'apps/client/src/lib/seo/server/route-policy.ts'),
  'utf8'
);

assert.match(
  routePolicy,
  /\.\.\.CLIENT_PRIVATE_ROUTE_PREFIXES/,
  'robots policy must derive private roots from CLIENT_PRIVATE_ROUTE_PREFIXES.'
);

for (const routeName of ['LOGIN', 'REGISTER', 'PASSWORD_RECOVERY']) {
  assert.match(accessPolicy, new RegExp(`ROUTES\\.${routeName}`));
}

assert.match(accessPolicy, /CLIENT_TOKEN_ACCESS_ROUTES/);
assert.match(accessPolicy, /ROUTES\.RESET_PASSWORD/);

const clientReadme = await readFile(
  path.join(root, 'apps/client/README.md'),
  'utf8'
);

for (const documentedRoute of [
  'product-catalog/[...segments]/',
  'pharmacies/[...segments]/',
  '[slugId]/',
]) {
  assert.match(
    clientReadme,
    new RegExp(documentedRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `Client README must document ${documentedRoute}.`
  );
}

for (const deprecatedRoute of [
  'product-catalog/[[...segments]]',
  'pharmacies/[[...segments]]',
  'pharmacies/[slugId]/',
]) {
  assert.equal(
    clientReadme.includes(deprecatedRoute),
    false,
    `Client README must not document deprecated route ${deprecatedRoute}.`
  );
}

assert.match(clientReadme, /legacy_public_entity_route_hit/);
assert.match(clientReadme, /product-first/);
assert.match(clientReadme, /2026-11-30/);
assert.match(clientReadme, /30 consecutive days/);

const routeBarrel = await readFile(
  path.join(root, 'apps/client/src/routes/index.ts'),
  'utf8'
);

assert.match(routeBarrel, /ClientProtectedRoute/);
assert.match(routeBarrel, /ClientGuestOnlyRoute/);
assert.doesNotMatch(routeBarrel, /export \{ default \} from/);

const pharmacyConfig = await readFile(
  path.join(root, 'apps/client/src/lib/auth/pharmacy-app-config-core.ts'),
  'utf8'
);
for (const contract of [
  'INSECURE_PRODUCTION_URL',
  'CREDENTIALS_NOT_ALLOWED',
  'SAME_ORIGIN_NOT_ALLOWED',
  'allowedPathPrefix',
  'dashboardUrl',
]) {
  assert.match(pharmacyConfig, new RegExp(contract));
}

const loginDestination = await readFile(
  path.join(root, 'apps/client/src/lib/auth/resolve-login-destination.ts'),
  'utf8'
);

assert.match(loginDestination, /requirePharmacyAppConfiguration/);
assert.doesNotMatch(loginDestination, /\? ROUTES\.HOME/);

console.log(
  `Client route-access check passed (${privatePages.length} private pages, 3 guest-preferred routes, reset-password token policy).`
);
