import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { normalizeOrderSalesStatistics } from './order-sales-statistics';

//===================================================================

function isInvalidResponse(error: unknown): boolean {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
}

//===================================================================

function validStatistics() {
  return {
    currency: '₴',
    groupBy: 'month',
    categories: ['medicine'],
    points: [
      {
        key: '2026-08',
        label: 'Aug 2026',
        values: {
          medicine: { quantity: 2, amount: 200 },
        },
      },
    ],
  };
}

//===================================================================

test('sales statistics parser rejects malformed values instead of returning zero defaults', () => {
  assert.equal(
    normalizeOrderSalesStatistics(validStatistics()).points.length,
    1
  );

  for (const invalid of [
    null,
    { ...validStatistics(), currency: 'USD' },
    { ...validStatistics(), groupBy: 'week' },
    { ...validStatistics(), categories: ['unknown'] },
    { ...validStatistics(), points: undefined },
    {
      ...validStatistics(),
      points: [
        {
          key: '2026-08',
          label: 'Aug 2026',
          values: { medicine: { quantity: -1, amount: 200 } },
        },
      ],
    },
    {
      ...validStatistics(),
      points: [
        {
          key: '2026-08',
          label: 'Aug 2026',
          values: {},
        },
      ],
    },
  ]) {
    assert.throws(
      () => normalizeOrderSalesStatistics(invalid),
      isInvalidResponse
    );
  }
});
