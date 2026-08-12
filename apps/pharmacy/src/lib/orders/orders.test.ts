import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  normalizePharmacyOrder,
  normalizePharmacyOrderDetails,
} from './orders';

//===================================================================

function validOrder() {
  return {
    id: '507f1f77bcf86cd799439011',
    orderNumber: 'ORD-1001',
    createdAt: '2026-08-12T10:00:00.000Z',
    pharmacyId: '507f1f77bcf86cd799439014',
    pharmacyName: 'Health Pharmacy',
    clientId: '507f1f77bcf86cd799439015',
    clientName: 'Natalia',
    paymentMethod: 'cash',
    delivery: { method: 'pickup' },
    status: 'new',
    createdByType: 'client',
    totalItems: 2,
    totalPrice: 200,
    managerCommentsCount: 0,

    items: [
      {
        id: '507f1f77bcf86cd799439016',
        productId: '507f1f77bcf86cd799439013',
        productOfferId: '507f1f77bcf86cd799439012',
        name: 'Aspirin',
        article: 'ASP-100',
        category: 'medicine',
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
        availableQuantity: 5,
      },
    ],

    statusHistory: [
      {
        status: 'new',
        changedAt: '2026-08-12T10:00:00.000Z',
        changedBy: '507f1f77bcf86cd799439015',
      },
    ],
    activityHistory: [],
  };
}

//===================================================================

function isInvalidResponse(error: unknown): boolean {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
}

//===================================================================

test('pharmacy order parser rejects invalid transactional defaults', () => {
  const order = validOrder();
  assert.equal(normalizePharmacyOrder(order).paymentMethod, 'cash');

  for (const invalid of [
    { ...order, paymentMethod: 'unknown' },
    { ...order, status: 'unknown' },
    { ...order, id: 'bad-id' },
    { ...order, createdAt: '2026-08-12' },
    { ...order, totalItems: 1 },
    { ...order, totalPrice: 199 },
    { ...order, items: [{ ...order.items[0], quantity: 1.5 }] },
    { ...order, items: [{ ...order.items[0], quantity: -1 }] },
    { ...order, items: [{ ...order.items[0], totalPrice: 0 }] },
  ]) {
    assert.throws(() => normalizePharmacyOrder(invalid), isInvalidResponse);
  }
});

//===================================================================

test('pharmacy order details reject malformed nested history and bank data', () => {
  const order = validOrder();
  assert.equal(normalizePharmacyOrderDetails(order)?.status, 'new');

  assert.throws(
    () =>
      normalizePharmacyOrderDetails({
        ...order,
        statusHistory: [{ ...order.statusHistory[0], changedAt: 'invalid' }],
      }),
    isInvalidResponse
  );

  assert.throws(
    () =>
      normalizePharmacyOrderDetails({
        ...order,
        bankDetails: { iban: 'UA00' },
      }),
    isInvalidResponse
  );
});
