import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const source = (relative: string) =>
  readFile(new URL(relative, import.meta.url), 'utf8');

//===================================================================

test('pharmacy registry uses only member-scoped BFF paths, never admin endpoints', async () => {
  const [client, backend, page] = await Promise.all([
    source('../../lib/api/browser/owned-pharmacy-registry.api.ts'),
    source('../../lib/api/routes/pharmacy-api-routes.ts'),
    source('./OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx'),
  ]);

  assert.match(backend, /ownedRegistry: '\/api\/pharmacies\/me\/pharmacies'/);
  assert.match(client, /getOwnedPharmacyStatistics/);
  assert.doesNotMatch(client, /getAdminPharmac|ownerId|ownerSearch/);

  assert.doesNotMatch(
    page,
    /PharmacyOwnerSearch|ownerId|buildAdminPharmacyDetailUrl/
  );
});

//===================================================================

test('empty list offers an owner-only create action with a working route', async () => {
  const page = await source(
    './OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx'
  );

  assert.match(page, /data\?\.total === 0 && !hasActiveFilters/);
  assert.match(page, /<ProfileResourceState\s+variant="empty"/);

  assert.match(
    page,
    /pharmacies\.some\(\(pharmacy\) => pharmacy\.membershipRole === 'owner'\)/
  );

  assert.match(page, /Create pharmacy/);

  assert.match(
    page,
    /router\.push\(`\$\{PHARMACY_ROUTES\.PHARMACIES\}\/new`\)/
  );
});
