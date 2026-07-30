import assert from 'node:assert/strict';
import test from 'node:test';

import { selectRootDetail } from './root-detail-policy';
import type { RootDetail } from './root-detail-resolver';

//===================================================================

const product = {
  type: 'product',
  product: { id: '507f1f77bcf86cd799439011', name: 'Product' },
  canonicalPath: '/product-507f1f77bcf86cd799439011',
  isCanonicalSlug: true,
} as unknown as RootDetail;

//===================================================================

const pharmacy = {
  type: 'pharmacy',
  pharmacy: { id: '507f1f77bcf86cd799439011', name: 'Pharmacy' },
  canonicalPath: '/pharmacy-507f1f77bcf86cd799439011',
  isCanonicalSlug: true,
} as unknown as RootDetail;

//===================================================================

test('fails closed when product and pharmacy resolve the same root slug', () => {
  assert.deepEqual(selectRootDetail([product, pharmacy]), {
    status: 'collision',
  });
});

//===================================================================

test('returns the only resolved detail', () => {
  assert.deepEqual(selectRootDetail([product]), {
    status: 'found',
    detail: product,
  });
});
