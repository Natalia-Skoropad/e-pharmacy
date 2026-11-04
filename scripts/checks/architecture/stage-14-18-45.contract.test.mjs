import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const ROOT = resolve(process.cwd());

//===================================================================

const read = (relativePath) =>
  readFileSync(resolve(ROOT, relativePath), 'utf8');

//===================================================================

test('auth bootstrap allows the full private BFF timeout instead of aborting at four seconds', () => {
  const auth = read('packages/auth/src/core/AuthProviderCore.tsx');

  assert.match(auth, /DEFAULT_AUTH_BOOTSTRAP_TIMEOUT_MS = 14_000/);
  assert.match(auth, /stateRef\.current\.status !== 'authenticated'/);
  assert.match(auth, /stateRef\.current\.status !== 'unauthenticated'/);
  assert.doesNotMatch(auth, /DEFAULT_AUTH_BOOTSTRAP_TIMEOUT_MS = 4_000/);
});

//===================================================================

test('pharmacy location facets use a tenant-scoped lightweight read endpoint', () => {
  const service = read(
    'apps/api/src/services/pharmacies/owned-pharmacy-registry-read.service.ts'
  );

  const route = read('apps/api/src/routes/pharmacies/pharmacy.routes.ts');

  const bff = read(
    'apps/pharmacy/src/app/api/pharmacies/me/pharmacies/locations/route.ts'
  );

  const browser = read(
    'apps/pharmacy/src/lib/api/browser/owned-pharmacy-registry.api.ts'
  );

  const component = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx'
  );

  assert.match(
    service,
    /listOwnedPharmacyLocationsService\(actorUserId: string\)/
  );

  assert.match(service, /\.\.\.membershipStages\(userId\),\s*\{\s*\$group:/);

  assert.match(
    route,
    /'\/me\/pharmacies\/locations',[\s\S]{0,250}authenticate,[\s\S]{0,250}authorizeRoles\(USER_ROLES\.PHARMACY\)/
  );

  assert.match(bff, /createPrivateProxyRoute/);
  assert.match(browser, /getOwnedPharmacyLocationRows/);

  assert.match(
    component,
    /if \(!isFiltersOpen \|\| allLocationRows !== null\) return/
  );

  assert.doesNotMatch(component, /loadCompletePharmacyLocations\(/);
});

//===================================================================

test('registry has a bounded independent timeout at both the browser and BFF layers', () => {
  const bff = read(
    'apps/pharmacy/src/app/api/pharmacies/me/pharmacies/route.ts'
  );

  const browser = read(
    'apps/pharmacy/src/lib/api/browser/owned-pharmacy-registry.api.ts'
  );

  assert.match(bff, /timeoutMs: 28_000/);
  assert.match(browser, /timeoutMs: options\?\.timeoutMs \?\? 30_000/);
});

//===================================================================

test('multi-pharmacy 409 cannot trigger unbounded order counter requests on focus', () => {
  const sidebar = read(
    'apps/pharmacy/src/components/layout/PharmacySidebar/PharmacySidebar.tsx'
  );

  assert.match(sidebar, /error\.code === 'PHARMACY_SELECTION_REQUIRED'/);
  assert.match(sidebar, /needsPharmacySelection \|\| activeController/);
  assert.match(sidebar, /needsPharmacySelection = false/);
});

//===================================================================

test('slow authentication is diagnosed without exposing tokens, session IDs or user details', () => {
  const middleware = read('apps/api/src/middlewares/auth/auth.middleware.ts');

  assert.match(middleware, /sessionLookupMs/);
  assert.match(middleware, /userLookupMs/);
  assert.match(middleware, /candidatesChecked/);

  assert.match(
    middleware,
    /logger\.info\('\[auth\] slow authentication lookup'/
  );

  assert.doesNotMatch(middleware, /logger\.info\([^)]*candidate\.token/);
});
