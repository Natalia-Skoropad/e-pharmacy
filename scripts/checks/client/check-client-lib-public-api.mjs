import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const libRoot = path.join(root, 'apps/client/src/lib');

//===================================================================

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', '.turbo', 'dist'].includes(entry.name))
      continue;

    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(target)));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

for (const removed of [
  'apps/client/src/lib/seo/index.ts',
  'apps/client/src/lib/seo/content.ts',
  'apps/client/src/lib/content/home.ts',
  'apps/client/src/lib/catalog/product-offers.ts',
  'apps/client/src/lib/api/routes/index.ts',
  'apps/client/src/lib/checkout/index.ts',
  'apps/client/src/lib/async/is-abort-error.ts',
  'apps/client/src/lib/details/server/root-detail-resolver.ts',
  'apps/client/src/lib/details/server/root-detail-policy.ts',
  'apps/client/src/lib/routes/reserved-root-slugs.ts',
]) {
  assert.equal(await exists(removed), false, `${removed} must stay deleted.`);
}

//===================================================================

for (const barrel of [
  'apps/client/src/lib/api/browser/index.ts',
  'apps/client/src/lib/api/server/index.ts',
]) {
  const source = await readFile(path.join(root, barrel), 'utf8');
  assert.doesNotMatch(source, /export\s+\*/);
}

const files = await listFiles(libRoot);

const source = (
  await Promise.all(files.map((file) => readFile(file, 'utf8')))
).join('\n');

for (const alias of [
  'getProductsFromClientApi',
  'getProductDetailsFromClientApi',
  'getProductReviewsFromClientApi',
  'getPharmaciesFromClientApi',
  'getPharmacyDetailsFromClientApi',
  'getPharmacyReviewsFromClientApi',
  'getProductsFromBackend',
  'getPharmaciesFromBackend',
]) {
  assert.doesNotMatch(source, new RegExp(`\\b${alias}\\b`));
}

assert.doesNotMatch(
  source,
  /^export\s+(?:\*|\{[^}]+\})\s+from\s+['"]@e-pharmacy\//m,
  'Client lib must not proxy shared package exports.'
);

for (const internalName of [
  'CartLoadStatus',
  'CartMutationTask',
  'PUBLIC_API_REVALIDATE_SECONDS',
]) {
  assert.doesNotMatch(
    source,
    new RegExp(`export\\s+(?:type\\s+|const\\s+)${internalName}\\b`)
  );
}

console.log(
  `Client-lib public API check passed (${files.length} lib modules, explicit environment entrypoints).`
);
