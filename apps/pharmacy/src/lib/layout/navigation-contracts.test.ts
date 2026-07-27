import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('keeps pharmacy navigation unique and tied to existing route constants', async () => {
  const source = await readFile(new URL('./navigation.ts', import.meta.url), 'utf8');

  const labels = [...source.matchAll(/label:\s*'([^']+)'/g)].map(
    (match) => match[1]
  );

  const routeKeys = [...source.matchAll(/href:\s*PHARMACY_ROUTES\.([A-Z_]+)/g)].map(
    (match) => match[1]
  );

  assert.equal(labels.length > 0, true);
  assert.equal(new Set(labels).size, labels.length);
  assert.equal(new Set(routeKeys).size, routeKeys.length);

  assert.deepEqual(routeKeys, [
    'DASHBOARD',
    'ORDERS',
    'CLIENTS',
    'PRODUCTS',
    'ALL_PRODUCTS',
    'PRODUCT_REQUESTS',
  ]);

  assert.equal(source.includes('PHARMACY_MOBILE_NAVIGATION'), false);
  assert.equal(source.includes('Pharmacy profile'), false);
});
