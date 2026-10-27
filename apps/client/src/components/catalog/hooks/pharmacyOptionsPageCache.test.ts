import assert from 'node:assert/strict';
import test from 'node:test';

import type { PharmacySearchOptionsResponse } from '@e-pharmacy/types/pharmacies';

import {
  PHARMACY_SELECT_PAGE_SIZE,
  createPharmacyOptionsPageCache,
} from './pharmacyOptionsPageCache';

//===================================================================

const response: PharmacySearchOptionsResponse = {
  kind: 'pharmacy',
  items: [{ id: '6ac75e0f17684f6f914a45c9', name: 'Test pharmacy' }],
  page: 1,
  perPage: PHARMACY_SELECT_PAGE_SIZE,
  total: 115,
  totalPages: 3,
};

//===================================================================

test('public select defaults to a bounded 50-result page', () => {
  assert.equal(PHARMACY_SELECT_PAGE_SIZE, 50);
});

//===================================================================

test('reuses a page for the same normalized search and filters only', () => {
  const cache = createPharmacyOptionsPageCache(500, 10);

  const params = {
    kind: 'pharmacy' as const,
    query: ' Lviv ',
    settlement: 'Lviv',
    page: 1,
    perPage: 50,
  };

  cache.set(params, response, 100);

  assert.strictEqual(cache.get({ ...params, query: 'lviv' }, 200), response);
  assert.equal(cache.get({ ...params, region: 'Odessa' }, 200), null);
  assert.equal(cache.get({ ...params, settlement: 'Kyiv' }, 200), null);
  assert.equal(cache.get({ ...params, page: 2 }, 200), null);
  assert.equal(cache.get({ ...params, perPage: 30 }, 200), null);
  assert.equal(cache.get({ ...params, kind: 'location' }, 200), null);
});

//===================================================================

test('expires cached results even when they were recently accessed', () => {
  const cache = createPharmacyOptionsPageCache(100, 10);
  const params = { kind: 'pharmacy' as const, page: 1 };

  cache.set(params, response, 100);
  assert.strictEqual(cache.get(params, 199), response);
  assert.equal(cache.get(params, 200), null);
});

//===================================================================

test('evicts least recently used pages to bound memory usage', () => {
  const cache = createPharmacyOptionsPageCache(1000, 2);
  const first = { kind: 'pharmacy' as const, page: 1 };
  const second = { kind: 'pharmacy' as const, page: 2 };
  const third = { kind: 'pharmacy' as const, page: 3 };

  cache.set(first, response, 0);
  cache.set(second, response, 0);
  cache.get(first, 1); // First is now most recently used.
  cache.set(third, response, 2);
  assert.equal(cache.get(second, 3), null);
  assert.strictEqual(cache.get(first, 3), response);
  assert.strictEqual(cache.get(third, 3), response);
});
