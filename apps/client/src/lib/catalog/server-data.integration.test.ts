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
  sort: 'newest',
  page: 1,
} as const;

//===================================================================

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

  assert.equal(page.resourceState.status, 'empty');
  assert.equal(page.pharmacyOptionsState.status, 'unavailable');
  assert.equal(page.filtersState.status, 'unavailable');
  assert.deepEqual(page.products, []);
});

//===================================================================

test('does not represent a pharmacy filter outage as an available empty list', () => {
  const page = createPharmaciesCatalogPageData({
    filters: {
      name: '',
      address: '',
      settlement: '',
      region: '',
      sort: 'rating-desc',
      page: 1,
    },

    pharmaciesState: {
      status: 'success',
      data: { items: [], page: 1, perPage: 24, total: 0, totalPages: 0 },
    },

    filterState: { status: 'unavailable', reason: 'network' },
  });

  assert.equal(page.resourceState.status, 'empty');
  assert.equal(page.filtersState.status, 'unavailable');
  assert.deepEqual(page.locationOptions, []);
});

//===================================================================

test('keeps unavailable product state exclusive from empty results', () => {
  const page = createProductCatalogPageData({
    filters: productFilters,

    productsState: {
      status: 'unavailable',
      reason: 'service_unavailable',
      requestId: 'products-1',
    },

    pharmaciesState: { status: 'success', data: { items: [] } },
    filterOptionsState: {
      status: 'success',
      data: {
        categories: [],
        availability: [],
        sort: [],
      },
    },
  });

  assert.deepEqual(page.resourceState, { status: 'unavailable' });
  assert.deepEqual(page.products, []);
});

//===================================================================

test('classifies filtered empty results separately from an empty catalog', () => {
  const page = createPharmaciesCatalogPageData({
    filters: {
      name: 'Care',
      address: '',
      settlement: '',
      region: '',
      sort: 'newest',
      page: 1,
    },

    pharmaciesState: {
      status: 'success',
      data: { items: [], page: 1, perPage: 24, total: 0, totalPages: 0 },
    },

    filterState: { status: 'success', data: { locations: [], sort: [] } },
  });

  assert.deepEqual(page.resourceState, {
    status: 'empty',
    reason: 'no-matches',
  });
});

//===================================================================

test('keeps canonical category labels while narrowing the available category facet', () => {
  const allCategories = [
    { value: 'all' as const, label: 'All categories' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'hygiene', label: 'Hygiene' },
  ];

  const page = createProductCatalogPageData({
    filters: { ...productFilters, pharmacyId: '6ac75e0f17684f6f914a4579' },
    productsState: { status: 'success', data: emptyProducts },
    pharmaciesState: { status: 'success', data: { items: [] } },

    filterOptionsState: {
      status: 'success',
      data: { categories: allCategories, availability: [], sort: [] },
    },

    scopedCategoryState: {
      status: 'success',

      data: {
        categories: [allCategories[0]!, allCategories[1]!],
        availability: [],
        sort: [],
      },
    },
  });

  assert.deepEqual(
    page.availableCategories.map((category) => category.value),
    ['all', 'medicine']
  );

  assert.deepEqual(
    page.filterOptions.categories.map((category) => category.value),
    ['all', 'medicine', 'hygiene']
  );
});
