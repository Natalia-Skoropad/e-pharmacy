import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('client analytics are owner-authorized and never derived from header selection', () => {
  const source = read('services/clients/client-analytics.service.ts');

  assert.match(source, /getClientByIdService\(userId, clientId, true\)/);
  assert.match(source, /getOwnedClientPharmacyIds\(userId\)/);
  assert.match(source, /client\.isDefault\s*\? ownedIds\.filter/);
  assert.match(source, /String\(id\) === client\.pharmacyId/);
  assert.match(source, /: ownedIds/);
  assert.match(source, /userId: clientObjectId/);
  assert.match(source, /pharmacyId: \{ \$in: pharmacyIds \}/);
  assert.doesNotMatch(source, /getCurrentPharmacyId/);
});

//===============================================================

test('client order statistics initialize four statuses to zero and chart filters orders by client', () => {
  const source = read('services/clients/client-analytics.service.ts');
  const sales = read('services/orders/order-sales-statistics.service.ts');

  for (const status of ['new', 'in_progress', 'successful', 'rejected']) {
    assert.match(source, new RegExp(`${status}: \\{ count: 0, amount: 0 \\}`));
  }

  assert.match(
    source,
    /getOrderSalesStatisticsForPharmaciesService\(\s*pharmacyIds\.map\(String\),\s*query,\s*clientId/
  );

  assert.match(
    sales,
    /clientId \? \{ userId: new Types\.ObjectId\(clientId\) \}/
  );
});

//===============================================================

test('client analytics routes validate IDs and the sales period, using authenticated BFF', () => {
  const routes = read('routes/clients/client.routes.ts');
  const controllers = read('controllers/clients/client.controller.ts');

  assert.match(routes, /'\/:clientId\/order-statistics'/);
  assert.match(routes, /'\/:clientId\/sales-statistics'/);
  assert.match(routes, /query: orderSalesStatisticsQuerySchema/);
  assert.match(routes, /params: clientParamsSchema/);
  assert.match(controllers, /getClientOrderStatisticsService\(/);
  assert.match(controllers, /getClientSalesStatisticsService\(/);
});
