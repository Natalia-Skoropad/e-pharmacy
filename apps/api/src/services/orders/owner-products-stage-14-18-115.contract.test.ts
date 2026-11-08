import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd();

//===================================================================

const read = (path: string) => readFile(join(root, 'src', path), 'utf8');

//===================================================================

test('owner order queries check owned pharmacy IDs and preserve selected-pharmacy legacy mode', async () => {
  const [access, orders, stats] = await Promise.all([
    read('services/orders/order-access.ts'),
    read('services/orders/order-query.service.ts'),
    read('services/orders/order-sales-statistics.service.ts'),
  ]);

  assert.match(access, /Pharmacy\.distinct\('_id', \{ ownerId:/);
  assert.match(orders, /query\.scope === 'owner'/);
  assert.match(orders, /ownerIds\.some/);
  assert.match(orders, /getCurrentPharmacyId/);
  assert.match(stats, /getOrderSalesStatisticsForPharmaciesService/);

  const byId = orders.split('export async function getOrderByIdService(')[1];

  assert.ok(
    byId && !byId.includes('query.scope'),
    'Order detail must not reference undeclared query'
  );
});

//===================================================================

test('client purchased product and product-client searches cannot cross owner scope', async () => {
  const [purchases, registry, source, schema] = await Promise.all([
    read('services/clients/client-purchases.service.ts'),
    read('services/clients/client-registry-aggregation.ts'),
    read('services/clients/client-purchases-aggregation.ts'),
    read('schemas/clients/client.schema.ts'),
  ]);

  assert.match(purchases, /getClientByIdService\(userId, clientId, true\)/);
  assert.match(purchases, /getOwnedClientPharmacyIds\(userId\)/);
  assert.match(registry, /query\.productId/);
  assert.match(registry, /sourcePriority: 1/);
  assert.match(source, /pharmacyId: Array\.isArray\(pharmacyIds\)/);
  assert.match(schema, /productId: mongoIdSchema\.optional\(\)/);
});
