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

  // A new Owner has no memberships yet and can still create the first pharmacy.
  // Existing members can create only when one membership has the owner role.
  assert.match(
    page,
    /pharmacies\.length === 0 \|\|\s*pharmacies\.some\(\(pharmacy\) => pharmacy\.membershipRole === 'owner'\)/
  );

  assert.match(page, /disabled=\{membershipReady && !canCreate\}/);

  // The empty state belongs inside the existing table, not a second panel.
  assert.match(page, /<DataTable[\s\S]*?items=\{data\?\.items \?\? \[\]\}/);

  assert.match(
    page,
    /empty:\s*hasActiveFilters\s*\?\s*'No pharmacies match the selected filters\.'\s*:\s*'You haven’t created any pharmacies yet\.'/
  );

  assert.doesNotMatch(page, /<ProfileResourceState\s+variant="empty"/);

  assert.match(page, /Create pharmacy/);

  assert.match(
    page,
    /router\.push\(`\$\{PHARMACY_ROUTES\.PHARMACIES\}\/new`\)/
  );
});
