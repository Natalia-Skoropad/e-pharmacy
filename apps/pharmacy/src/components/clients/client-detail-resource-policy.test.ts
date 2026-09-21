import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldLoadClientProducts } from './client-detail-resource-policy';

//===================================================================

test('client products load only on first activation for the current request generation', () => {
  let requestCount = 0;
  let loadedRequestKey: string | null = null;
  const requestKey = 'client-a:products-page-1';

  const visit = (tab: 'details' | 'orders' | 'products' | 'comments') => {
    if (!shouldLoadClientProducts(tab, loadedRequestKey, requestKey)) return;

    requestCount += 1;
    loadedRequestKey = requestKey;
  };

  visit('details');
  assert.equal(requestCount, 0);

  visit('products');
  assert.equal(requestCount, 1);

  visit('details');
  visit('products');
  assert.equal(requestCount, 1);
});

//===================================================================

test('client products reload when filters, pagination, or retry create a new request generation', () => {
  const previousRequestKey = 'client-a:products-page-1';
  const nextRequestKey = 'client-a:products-page-2';

  assert.equal(
    shouldLoadClientProducts('products', previousRequestKey, nextRequestKey),
    true
  );

  assert.equal(
    shouldLoadClientProducts('comments', previousRequestKey, nextRequestKey),
    false
  );
});
