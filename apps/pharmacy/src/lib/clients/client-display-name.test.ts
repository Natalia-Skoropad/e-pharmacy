import assert from 'node:assert/strict';
import test from 'node:test';

import type { PharmacyClientRow } from './clients';
import { getClientDisplayName } from './client-display-name';

//===================================================================

const makeClient = (
  overrides: Partial<PharmacyClientRow>
): PharmacyClientRow => ({
  id: '507f1f77bcf86cd799439011',
  photoUrl: null,
  firstOrderAt: '2026-11-06T00:00:00.000Z',
  name: 'Walk-in client',
  email: '',
  phone: '',
  address: '',
  successfulOrdersCount: 0,
  successfulOrdersAmount: 0,
  status: 'active',
  isDefault: true,
  ...overrides,
});

//===================================================================

test('Walk-in clients include their own pharmacy name in the displayed label', () => {
  assert.equal(
    getClientDisplayName(makeClient({ pharmacyName: 'Pharmacy A' })),
    'Walk-in client (Pharmacy A)'
  );

  assert.equal(
    getClientDisplayName(makeClient({ pharmacyName: 'Pharmacy B' })),
    'Walk-in client (Pharmacy B)'
  );
});

//===================================================================

test('Regular customers are never suffixed, even if their name is Walk-in client', () => {
  assert.equal(
    getClientDisplayName(
      makeClient({ isDefault: false, pharmacyName: 'Pharmacy A' })
    ),
    'Walk-in client'
  );

  assert.equal(
    getClientDisplayName(
      makeClient({
        isDefault: false,
        name: 'Olena',
        pharmacyName: 'Pharmacy B',
      })
    ),
    'Olena'
  );
});

//===================================================================

test('Walk-in client without pharmacy metadata falls back to their name', () => {
  assert.equal(getClientDisplayName(makeClient({})), 'Walk-in client');
});
