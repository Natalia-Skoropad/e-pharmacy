import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseOwnedPharmacyListResponse,
  parseOwnedPharmacyOptionsResponse,
  parseOwnedPharmacyStatistics,
} from './owned-pharmacy-registry-parsers';

//=============================================================================

const base = {
  id: '507f1f77bcf86cd799439011',
  name: 'New pharmacy',
  status: 'new',
  createdAt: '2026-10-12T00:00:00.000Z',
  rating: 0,
  reviewsCount: 0,
};

const metrics = {
  activeClientsCount: 3,
  addedProductsCount: 10,
  successfulOrdersCount: 2,
  successfulRevenue: 120,
};

const envelope = (items: unknown[]) => ({
  items,
  page: 1,
  perPage: 20,
  total: items.length,
  totalPages: items.length ? 1 : 0,
  earliestCreatedAt: null,
});

//=============================================================================

test('owned registry accepts drafts, private owner metrics, and redacted manager metrics', () => {
  const result = parseOwnedPharmacyListResponse(
    envelope([
      { ...base, membershipRole: 'owner', ...metrics },
      { ...base, id: '507f1f77bcf86cd799439012', membershipRole: 'manager' },
    ])
  );

  assert.equal(result.items[0]?.activeClientsCount, 3);
  assert.equal(result.items[1]?.activeClientsCount, undefined);
  assert.equal(parseOwnedPharmacyListResponse(envelope([])).total, 0);
});

//=============================================================================

test('owned registry rejects manager metric disclosure, missing owner metrics, bad IDs and pages', () => {
  for (const bad of [
    { ...base, membershipRole: 'manager', ...metrics },
    { ...base, membershipRole: 'owner' },
    { ...base, membershipRole: 'owner', ...metrics, id: 'invalid' },
  ]) {
    assert.throws(() => parseOwnedPharmacyListResponse(envelope([bad])));
  }

  assert.throws(() =>
    parseOwnedPharmacyListResponse({ ...envelope([]), page: 2 })
  );
});

//=============================================================================

test('owned pharmacy options and totals retain only scope-safe fields', () => {
  const options = parseOwnedPharmacyOptionsResponse({
    items: [
      {
        id: base.id,
        name: base.name,
        status: base.status,
        membershipRole: 'manager',
      },
    ],
  });

  assert.deepEqual(Object.keys(options.items[0] ?? {}), [
    'id',
    'name',
    'status',
    'membershipRole',
  ]);

  const totals = parseOwnedPharmacyStatistics({
    all: 2,
    new: 1,
    onVerification: 0,
    active: 1,
    onModeration: 0,
    blocked: 0,
  });

  assert.equal(totals.all, 2);
});
