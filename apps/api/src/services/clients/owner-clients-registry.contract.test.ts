import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (name: string) =>
  readFileSync(resolve(process.cwd(), 'src/services/clients', name), 'utf8');

//===================================================================

test('owner Clients registry authorizes explicit owned pharmacy IDs and never trusts selected header', () => {
  const auth = read('client-owner-scope.ts');
  const registry = read('client-registry.service.ts');

  assert.match(auth, /User\.findById\(userId\)/);
  assert.match(auth, /owner\.role !== USER_ROLES\.PHARMACY/);
  assert.match(auth, /owner\.status === USER_STATUSES\.BLOCKED/);
  assert.match(auth, /ownerId: new Types\.ObjectId\(userId\)/);
  assert.match(auth, /status: \{ \$ne: PHARMACY_STATUSES\.BLOCKED \}/);
  assert.match(registry, /query\.scope === 'owner'/);
  assert.match(registry, /HTTP_STATUS\.FORBIDDEN/);
  assert.match(registry, /getCurrentPharmacyId\(userId\)/);
});

//===================================================================

test('owner Clients aggregation groups by user before pagination and preserves walk-in defaults', () => {
  const source = read('client-registry-aggregation.ts');

  assert.match(source, /pharmacyId: \{ \$in: pharmacyIds \}/);
  assert.match(source, /_id: '\$userId'/);
  assert.match(source, /defaultClientPharmacyId: \{ \$in: pharmacyIds \}/);
  assert.match(source, /\$lookup:[\s\S]*?from: Pharmacy\.collection\.name/);
  assert.match(source, /pharmacyId: \{ \$toString: '\$pharmacyId' \}/);
  assert.match(source, /pharmacyName: '\$pharmacy\.name'/);
  assert.match(source, /\$facet:[\s\S]*?items: itemsFacet/);
});

//===================================================================

test('owner Clients unified search accepts email and phone punctuation and escapes Mongo regex input', () => {
  const schema = read('../../schemas/clients/client.schema.ts');
  const filters = read('client-registry-filters.ts');
  const aggregation = read('client-registry-aggregation.ts');

  assert.match(schema, /search: clientContactSearchSchema/);
  assert.match(filters, /createSafeRegExp\(query\.search\.trim\(\)\)/);

  for (const field of ['id', 'name', 'email', 'phone', 'address']) {
    assert.match(filters, new RegExp(`\\{ ${field}: search \\}`));
  }

  assert.match(aggregation, /earliestOrderAt: \{ \$min: '\$firstOrderAt' \}/);
});

//===================================================================

test('owner-wide client detail and pharmacies tab are owner-authorized and independent of selected pharmacy', () => {
  const routes = read('../../routes/clients/client.routes.ts');
  const details = read('client-registry.service.ts');
  const pharmacies = read('client-pharmacies.service.ts');

  assert.match(routes, /'\/:clientId\/pharmacies'/);
  assert.match(routes, /clientDetailQuerySchema/);

  assert.match(
    details,
    /ownerScope \? await getOwnedClientPharmacyIds\(userId\)/
  );

  assert.match(pharmacies, /getOwnedClientPharmacyIds\(userId\)/);
  assert.match(pharmacies, /pharmacyId: \{ \$in: pharmacyIds \}/);
  assert.match(pharmacies, /Order\.aggregate/);
});
