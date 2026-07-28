import assert from 'node:assert/strict';
import test from 'node:test';

import type { RequestOptions } from '@e-pharmacy/api-client/transport';

import { createPublicProductsReader } from './public-products-reader';

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
