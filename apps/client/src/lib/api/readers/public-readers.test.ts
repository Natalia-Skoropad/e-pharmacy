import assert from 'node:assert/strict';
import test from 'node:test';

import type { RequestOptions } from '@e-pharmacy/api-client/core';

import { createPublicProductsReader } from './public-products-reader';

//===================================================================

test('public reader injects transport while keeping route/query/envelope logic shared', async () => {
  const calls: Array<{ path: string; options?: RequestOptions }> = [];
  const request = async <TData>(path: string, options?: RequestOptions) => {
    calls.push({ path, options });
    return { status: 'success', data: { items: [] } } as TData;
  };

  const reader = createPublicProductsReader(request, {
    list: '/products?locale=uk',
    filters: '/products/filters',
    details: (id) => `/products/${id}`,
    reviews: (id) => `/products/${id}/reviews`,
  });

  assert.deepEqual(await reader.getProducts({ page: 2, inStock: false }), {
    items: [],
  });
  assert.equal(calls[0]?.path, '/products?locale=uk&page=2&inStock=false');
});
