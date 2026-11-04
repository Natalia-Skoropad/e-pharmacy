import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

//===================================================================

const read = (path) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

//===================================================================

const search = read(
  'apps/api/src/services/pharmacies/pharmacy-search-options.service.ts'
);

const catalog = read(
  'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
);

const photo = read('apps/api/src/services/pharmacies/pharmacy-public-image.ts');
const routes = read('apps/api/src/routes/pharmacies/pharmacy.routes.ts');

const controller = read(
  'apps/api/src/controllers/pharmacies/pharmacy-public.controller.ts'
);

const imageProxy = read(
  'apps/client/src/app/api/pharmacies/[pharmacyId]/photo/route.ts'
);

const diagnostic = read(
  'apps/api/src/scripts/diagnostics/diagnose-public-pharmacy-options.ts'
);

const publicProxy = read('packages/next-api/src/proxy/public-backend-proxy.ts');
const routeFactories = read('packages/next-api/src/proxy/route-factories.ts');

//===================================================================

test('catalog and search output computes lazy public photo URLs without transferring inline base64', () => {
  assert.match(search, /imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION/g);

  assert.doesNotMatch(
    search,
    /select\('_id name imageUrl email phone location'\)/
  );

  assert.match(catalog, /PHARMACY_CARD_PROJECTION/);
  assert.match(catalog, /imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION/);
  assert.match(photo, /\$regexMatch/);
  assert.match(photo, /\$concat: \['\/api\/pharmacies\/'/);
});

//===================================================================

test('photo is fetched only if published and only through an explicit GET route', () => {
  assert.match(photo, /status: PUBLIC_PHARMACY_STATUS_FILTER/);
  assert.match(photo, /\.select\('_id imageUrl'\)/);
  assert.match(routes, /'\/:pharmacyId\/photo-source'/);
  assert.match(routes, /ctrlWrapper\(getPharmacyPhotoSource\)/);
  assert.match(controller, /getPublicPharmacyPhotoSource\(pharmacyId\)/);
});

//===================================================================

test('same-origin BFF streams binary images with a validated public route', () => {
  assert.match(imageProxy, /createPublicGetProxyRoute/);
  assert.match(imageProxy, /API_ROUTES\.pharmacies\.photoSource/);
  assert.match(imageProxy, /responseType: 'image'/);
  assert.match(imageProxy, /staleWhileRevalidate: 0/);

  assert.match(
    publicProxy,
    /if \(responseType === 'image' && execution\.response\.ok\)/
  );

  assert.match(publicProxy, /image\/jpeg/);
  assert.match(publicProxy, /image\/png/);
  assert.match(publicProxy, /image\/webp/);
  assert.match(routeFactories, /responseType\?: 'json' \| 'image'/);
  assert.match(controller, /res\.status\(HTTP_STATUS\.OK\)\.send\(bytes\)/);
});

//===================================================================

test('read-only diagnostic profiles the new public output without logging photo contents', () => {
  assert.match(diagnostic, /PUBLIC_PHARMACY_IMAGE_PROJECTION/);
  assert.match(diagnostic, /lazyPhotoUrls/);
  assert.doesNotMatch(diagnostic, /console\.log\(.*imageUrl/);
});
