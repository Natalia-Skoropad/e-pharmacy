import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

//===================================================================

for (const check of [
  'scripts/checks/client/check-client-routes.mjs',
  'scripts/checks/api-client/check-api-client-routes.mjs',
]) {
  const result = spawnSync(process.execPath, [check], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `${check} failed:\n${result.stdout}\n${result.stderr}`
  );
}

//===================================================================

const reserved = await read(
  'apps/client/src/lib/routes/reserved-root-slugs.ts'
);

const routePolicy = await read(
  'apps/client/src/lib/seo/server/route-policy.ts'
);

const routes = await read('apps/client/src/lib/routes/routes.ts');

for (const routeName of [
  'HOME',
  'PHARMACIES',
  'PRODUCTS_CATALOG',
  'DELIVERY_PAYMENT',
  'RETURN_POLICY',
  'USER_AGREEMENT',
  'PERSONAL_DATA_NOTICE',
]) {
  assert.match(routePolicy, new RegExp(`ROUTES\\.${routeName}\\b`));
}

for (const privateRoute of [
  'CART',
  'CHECKOUT',
  'PROFILE',
  'LOGIN',
  'REGISTER',
  'PASSWORD_RECOVERY',
  'RESET_PASSWORD',
]) {
  assert.match(routePolicy, new RegExp(`ROUTES\\.${privateRoute}\\b`));
}

assert.doesNotMatch(reserved, /export const RESERVED_ROOT_SLUGS/);
assert.match(routes, /CLIENT_RESERVED_APP_PREFIXES/);

const catalogFiles = [];

//===================================================================

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.'))
      catalogFiles.push(target);
  }
}

//===================================================================

await walk(path.join(root, 'apps/client/src/lib/catalog'));

const catalogSource = (
  await Promise.all(catalogFiles.map((file) => readFile(file, 'utf8')))
).join('\n');

assert.doesNotMatch(
  catalogSource,
  /['"`]\/(?:pharmacies|product-catalog)['"`]/
);

console.log(
  'Client-lib route/SEO parity check passed (application routes, proxy/BFF parity, sitemap and robots classifications).'
);
