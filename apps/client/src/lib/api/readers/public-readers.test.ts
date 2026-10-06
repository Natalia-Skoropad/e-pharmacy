import assert from 'node:assert/strict';
import test from 'node:test';

import type { RequestOptions } from '@e-pharmacy/api-client/transport';

import { createPublicProductsReader } from './public-products-reader';
import { createPublicPharmaciesReader } from './public-pharmacies-reader';

//===================================================================

const validProductsPayload = {
  status: 'success',
  data: {
    items: [],
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    earliestCreatedAt: null,
  },
};

//===================================================================

test('public reader injects transport while keeping route/query/envelope logic shared', async () => {
  const calls: Array<{ path: string; options?: RequestOptions }> = [];

  const request = async (path: string, options?: RequestOptions) => {
    calls.push({ path, options });
    return validProductsPayload;
  };

  const reader = createPublicProductsReader(request, {
    list: '/products?locale=uk',
    filters: '/products/filters',
    details: (id) => `/products/${id}`,
    reviews: (id) => `/products/${id}/reviews`,
  });

  assert.deepEqual(await reader.getProducts({ page: 2, inStock: false }), {
    items: [],
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    earliestCreatedAt: null,
  });

  assert.equal(calls[0]?.path, '/products?locale=uk&page=2&inStock=false');
});

//===================================================================

test('pharmacy reader shares route and runtime parsing behavior', async () => {
  const calls: string[] = [];

  const reader = createPublicPharmaciesReader(
    async (path: string) => {
      calls.push(path);
      return {
        status: 'success',
        data: { items: [], page: 1, perPage: 24, total: 0, totalPages: 0 },
      };
    },

    {
      list: '/pharmacies',
      options: '/pharmacies/options',
      filters: '/pharmacies/filters',
      details: (id) => `/pharmacies/${id}`,
      reviews: (id) => `/pharmacies/${id}/reviews`,
    }
  );

  assert.deepEqual(
    await reader.getPharmacies({
      settlement: 'Київ',
      region: 'Київська область',
    }),
    {
      items: [],
      page: 1,
      perPage: 24,
      total: 0,
      totalPages: 0,
    }
  );

  assert.equal(
    calls[0],
    '/pharmacies?settlement=%D0%9A%D0%B8%D1%97%D0%B2&region=' +
      '%D0%9A%D0%B8%D1%97%D0%B2%D1%81%D1%8C%D0%BA%D0%B0%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C'
  );
});
