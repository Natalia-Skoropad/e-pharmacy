import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePositionListResponse,
  parseProductCategoryListResponse,
  parseProductCategoryMutationResponse,
} from './settings-dictionary';

//===================================================================

const category = {
  id: '68ddb73fa4b91f0fc0e6d999',
  name: 'Medical devices',
  slug: 'medical_devices',
  status: 'active',
  kind: 'standard',
  sortOrder: 50,
  color: '#8B5CF6',
  usage: { productsCount: 2, productRequestsCount: 1, total: 3 },
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T11:00:00.000Z',
};

//===================================================================

test('category list parser keeps dynamic category color and usage metadata', () => {
  const parsed = parseProductCategoryListResponse({
    items: [category],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-10-01',
  });

  assert.equal(parsed.items[0]?.color, '#8B5CF6');
  assert.equal(parsed.items[0]?.usage.total, 3);
});

//===================================================================

test('category parser fails closed for malformed color and inconsistent usage', () => {
  assert.throws(() =>
    parseProductCategoryMutationResponse({
      category: { ...category, color: 'purple' },
    })
  );

  assert.throws(() =>
    parseProductCategoryMutationResponse({
      category: {
        ...category,
        usage: { productsCount: 2, productRequestsCount: 1, total: 99 },
      },
    })
  );
});

//===================================================================

test('position parser stays color-free and validates its own usage shape', () => {
  const parsed = parsePositionListResponse({
    items: [
      {
        id: '68ddb73fa4b91f0fc0e6d111',
        name: 'Content manager',
        usage: { employeesCount: 0, total: 0 },
        createdAt: '2026-10-01T10:00:00.000Z',
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-10-01',
  });

  assert.equal(parsed.items[0]?.name, 'Content manager');
  assert.equal('color' in (parsed.items[0] ?? {}), false);
});
