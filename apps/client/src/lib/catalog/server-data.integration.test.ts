import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPharmaciesCatalogPageData,
  createProductCatalogPageData,
} from './catalog-page-data';

//===================================================================

const productFilters = {
  name: '',
  article: '',
  category: 'all',
  availability: 'all',
  sort: 'newest',
  page: 1,
} as const;

const emptyProducts = {
  items: [],
  page: 1,
  perPage: 24,
  total: 0,
  totalPages: 0,
  earliestCreatedAt: null,
};

//===================================================================

test('preserves independent degraded states for product catalog resources', () => {
  const page = createProductCatalogPageData({
    filters: productFilters,
    productsState: { status: 'success', data: emptyProducts },

    pharmaciesState: {
      status: 'unavailable',
      reason: 'service_unavailable',
      requestId: 'pharmacies-1',
    },

    filterOptionsState: {
      status: 'unavailable',
      reason: 'invalid_response',
    },
  });

  assert.equal(page.catalogState.status, 'available');
  assert.equal(page.pharmacyOptionsState.status, 'unavailable');
  assert.equal(page.filtersState.status, 'unavailable');
  assert.deepEqual(page.products, []);
});

//===================================================================

test('does not represent a pharmacy filter outage as an available empty list', () => {
  const page = createPharmaciesCatalogPageData({
    filters: { name: '', address: '', city: '', sort: 'rating-desc', page: 1 },

    pharmaciesState: {
      status: 'success',
      data: { items: [], page: 1, perPage: 24, total: 0, totalPages: 0 },
    },

    filterState: { status: 'unavailable', reason: 'network' },
  });

  assert.equal(page.catalogState.status, 'available');
  assert.equal(page.filtersState.status, 'unavailable');
  assert.deepEqual(page.cityOptions, []);
});
