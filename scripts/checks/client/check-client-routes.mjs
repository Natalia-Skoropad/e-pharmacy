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

for (const routeName of ['CART', 'CHECKOUT', 'PROFILE']) {
  assert.match(accessPolicy, new RegExp(`ROUTES\\.${routeName}`));
}

for (const routeName of ['LOGIN', 'REGISTER', 'PASSWORD_RECOVERY']) {
  assert.match(accessPolicy, new RegExp(`ROUTES\\.${routeName}`));
}

assert.match(accessPolicy, /CLIENT_TOKEN_ACCESS_ROUTES/);
assert.match(accessPolicy, /ROUTES\.RESET_PASSWORD/);

console.log(
  `Client route-access check passed (${privatePages.length} private pages, 3 guest-preferred routes, reset-password token policy).`
);
