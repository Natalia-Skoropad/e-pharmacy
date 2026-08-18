import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

//===================================================================

const publicSlugValidation = await read(
  'packages/validation/src/url/slug-id.ts'
);

const backendPublicSlug = await read('apps/api/src/utils/public-slug-id.ts');

for (const prefix of ["product: 'pr'", "pharmacy: 'ph'"]) {
  const pattern = new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  assert.match(publicSlugValidation, pattern);
  assert.match(backendPublicSlug, pattern);
}

assert.match(publicSlugValidation, /parsePublicEntitySlugId/);
assert.match(backendPublicSlug, /buildPublicEntitySlugId/);

const backendProductService = await read(
  'apps/api/src/services/product.service.ts'
);

const backendPharmacyService = await read(
  'apps/api/src/services/pharmacy.service.ts'
);

const sharedDtoParsers = await read(
  'packages/api-client/src/response/shared-dto-parsers.ts'
);

assert.match(
  backendProductService,
  /publicSlugId:\s*buildPublicEntitySlugId\([\s\S]*?'product'/
);

assert.match(
  backendPharmacyService,
  /publicSlugId:\s*buildPublicEntitySlugId\([\s\S]*?'pharmacy'/
);

assert.match(sharedDtoParsers, /publicSlugId:\s*'string'/);

const requestOptions = await read('apps/client/src/lib/api/request-options.ts');

assert.match(
  requestOptions,
  /Omit<[\s\S]*?JsonResponseRequestOptions,[\s\S]*?'method' \| 'body'[\s\S]*?>/
);

const environment = await read(
  'apps/client/src/lib/constants/public-environment.ts'
);

for (const contract of [
  'INSECURE_PRODUCTION_URL',
  'CREDENTIALS_NOT_ALLOWED',
  'QUERY_OR_HASH_NOT_ALLOWED',
  'BASE_PATH_NOT_ALLOWED',
  'MISSING_PRODUCTION_SITE_URL',
  'requireExplicitProductionSiteUrl',
  "nodeEnv === 'production'",
])
  assert.match(
    environment,
    new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  );

assert.doesNotMatch(environment, /VERCEL_ENV|process\.env\.CI/);

const cache = await read('apps/client/src/lib/api/server/cache-options.ts');

for (const preset of ['commerce', 'reviews', 'dictionary']) {
  assert.match(
    cache,
    new RegExp(`revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS\\.${preset}`)
  );
}

assert.doesNotMatch(cache, /cache:\s*['"]no-store/);

const dataState = await read('apps/client/src/lib/api/server/data-state.ts');
assert.match(dataState, /isAbortError\(error\).*throw error/s);
assert.match(dataState, /rate_limit|service_unavailable|invalid_response/);

const productLoader = await read(
  'apps/client/src/lib/catalog/product-catalog-server.ts'
);

const pharmacyLoader = await read(
  'apps/client/src/lib/catalog/pharmacies-catalog-server.ts'
);

assert.match(productLoader, /createProductCatalogPageData/);
assert.match(pharmacyLoader, /createPharmaciesCatalogPageData/);

const cartState = await read('apps/client/src/lib/cart/cart-state.ts');

assert.match(
  cartState,
  /state\.ownerKey === ownerKey \? getCartStateCart\(state\) : null/
);

await assert.rejects(
  access(path.join(root, 'apps/client/src/lib/cart/cart-errors.ts')),
  (error) => error?.code === 'ENOENT'
);

const cartApi = await read('apps/client/src/lib/api/browser/cart.api.ts');
assert.match(cartApi, /export function removeCartPharmacy/);

const sitemapData = await read(
  'apps/client/src/lib/seo/server/sitemap-data.ts'
);

assert.match(sitemapData, /Sitemap was generated with partial backend data/);
assert.doesNotMatch(sitemapData, /catch\s*\{\s*return null/);
assert.doesNotMatch(sitemapData, /product\.inStock\s*!==\s*false/);
assert.doesNotMatch(sitemapData, /pharmacy\.isActive\s*!==\s*false/);
assert.doesNotMatch(sitemapData, /lastModified:\s*now/);

const clientLib = await read('apps/client/src/lib/seo/server/sitemap.ts');
assert.match(clientLib, /ISO_CALENDAR_OR_DATETIME_PATTERN/);
assert.match(clientLib, /choosePreferredEntry/);

const detailFiles = [
  'apps/client/src/components/product-catalog/server/ProductDetailPage.tsx',
  'apps/client/src/components/pharmacies/server/PharmacyDetailPage.tsx',
];

for (const file of detailFiles) {
  const source = await read(file);
  assert.match(source, /resolveServerDataState/);
  assert.doesNotMatch(source, /catch\(\(\) => null\)/);
}

for (const requiredTest of [
  'apps/client/src/lib/constants/public-environment.test.ts',
  'apps/client/src/lib/catalog/server-data.integration.test.ts',
  'apps/client/src/lib/seo/server/sitemap.test.ts',
  'apps/client/src/lib/seo/server/sitemap-data.integration.test.ts',
  'apps/client/src/lib/api/server/data-state.test.ts',
]) {
  await access(path.join(root, requiredTest));
}

console.log(
  'Client-lib contract check passed (request semantics, environment, cache, server data, atomic cart-group removal, cart ownership and sitemap policy).'
);
