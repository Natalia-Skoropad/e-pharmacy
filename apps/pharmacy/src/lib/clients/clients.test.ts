import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  normalizePharmacyClient,
  normalizePharmacyClientProductsResponse,
  normalizePharmacyClientsResponse,
} from './clients';

//===================================================================

function isInvalidResponse(error: unknown): boolean {
  return (
    error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
}

//===================================================================

function validClient() {
  return {
    id: '507f1f77bcf86cd799439011',
    photoUrl: null,
    firstOrderAt: '2026-08-12T10:00:00.000Z',
    name: 'Natalia',
    email: 'user@example.com',
    phone: '+380501234567',
    address: 'Main Street',
    successfulOrdersCount: 2,
    successfulOrdersAmount: 500,
    status: 'active',
    isDefault: false,
  };
}

//===================================================================

test('pharmacy client parser rejects missing or malformed authoritative fields', () => {
  assert.equal(normalizePharmacyClient(validClient()).status, 'active');

  for (const invalid of [
    { ...validClient(), status: undefined },
    { ...validClient(), status: 'unknown' },
    { ...validClient(), name: '' },
    { ...validClient(), firstOrderAt: '2026-08-12' },
    { ...validClient(), successfulOrdersCount: -1 },
    { ...validClient(), successfulOrdersAmount: Number.NaN },
  ]) {
    assert.throws(() => normalizePharmacyClient(invalid), isInvalidResponse);
  }
});

//===================================================================

test('pharmacy clients response rejects malformed rows and earliest date', () => {
  const response = {
    items: [validClient()],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-08-12',
  };

  assert.equal(normalizePharmacyClientsResponse(response).total, 1);

  assert.throws(
    () =>
      normalizePharmacyClientsResponse({
        ...response,
        items: [{ ...validClient(), status: undefined }],
      }),
    isInvalidResponse
  );

  assert.throws(
    () =>
      normalizePharmacyClientsResponse({
        ...response,
        earliestCreatedAt: '12/08/2026',
      }),
    isInvalidResponse
  );
});

//===================================================================

test('purchased product response rejects invalid quantities and dates', () => {
  const item = {
    id: '507f1f77bcf86cd799439010-507f1f77bcf86cd799439012',
    orderId: '507f1f77bcf86cd799439010',
    orderDate: '2026-08-12T10:00:00.000Z',
    productId: '507f1f77bcf86cd799439013',
    photoUrl: null,
    article: 'ASP-100',
    name: 'Aspirin',
    category: 'medicine',
    quantity: 2,
    totalAmount: 200,
    status: 'active',
  };

  const response = {
    items: [item],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
    earliestCreatedAt: '2026-08-12',
  };

  assert.equal(normalizePharmacyClientProductsResponse(response).total, 1);

  assert.throws(
    () =>
      normalizePharmacyClientProductsResponse({
        ...response,
        items: [{ ...item, quantity: 0 }],
      }),
    isInvalidResponse
  );

  assert.throws(
    () =>
      normalizePharmacyClientProductsResponse({
        ...response,
        items: [{ ...item, orderDate: '2026-08-12' }],
      }),
    isInvalidResponse
  );
});
