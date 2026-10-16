import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminPharmacyListItem,
  parseAdminPharmacyListResponse,
  parseAdminPharmacyOptionsResponse,
  parseAdminPharmacyRegistryOwnerOptionsResponse,
  parseAdminPharmacyStatistics,
} from './admin-pharmacy-registry-parsers';

//===================================================================

const item = {
  id: '507f1f77bcf86cd799439011',
  name: 'Onboarding pharmacy',
  status: 'new',
  createdAt: '2026-10-12T00:00:00.000Z',
  owner: { id: '507f1f77bcf86cd799439012', name: 'Owner' },
  activeClientsCount: 1,
  addedProductsCount: 4,
  successfulOrdersCount: 0,
  successfulRevenue: 0,
  rating: 0,
  reviewsCount: 0,
};

//===================================================================

test('registry parser accepts incomplete onboarding pharmacies and unlinked owners', () => {
  assert.deepEqual(parseAdminPharmacyListItem(item), item);

  assert.deepEqual(
    parseAdminPharmacyListItem({
      ...item,
      owner: null,
      location: { settlement: 'Odesa' },
    }),
    {
      ...item,
      owner: null,
      location: { settlement: 'Odesa' },
    }
  );
});

//===================================================================

test('registry parser validates paging including empty lists and clamped pages', () => {
  assert.deepEqual(
    parseAdminPharmacyListResponse({
      items: [],
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }).items,
    []
  );

  assert.throws(
    () =>
      parseAdminPharmacyListResponse({
        items: [],
        page: 2,
        perPage: 20,
        total: 5,
        totalPages: 1,
        earliestCreatedAt: null,
      }),
    /pagination/i
  );

  assert.throws(
    () =>
      parseAdminPharmacyListResponse({
        items: [item],
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
        earliestCreatedAt: '2026-02-30',
      }),
    /earliest/i
  );
});

//===================================================================

test('registry parser rejects invalid IDs, status, metrics and owner objects', () => {
  for (const patch of [
    { id: 'bad-id' },
    { status: 'awaiting' },
    { successfulOrdersCount: -1 },
    { activeClientsCount: '1' },
    { addedProductsCount: -1 },
    { successfulRevenue: Number.POSITIVE_INFINITY },
    { rating: 5.1 },
    { owner: { name: 'Missing ID' } },
    { createdAt: 'tomorrow' },
  ]) {
    assert.throws(() => parseAdminPharmacyListItem({ ...item, ...patch }));
  }
});

//===================================================================

test('registry options and global status counters validate shape', () => {
  assert.deepEqual(
    parseAdminPharmacyOptionsResponse({
      items: [
        {
          id: item.id,
          name: item.name,
          location: { settlement: 'Kyiv' },
        },
      ],
    }).items[0].location,
    { settlement: 'Kyiv' }
  );

  assert.deepEqual(
    parseAdminPharmacyStatistics({
      all: 3,
      new: 1,
      onVerification: 1,
      active: 0,
      onModeration: 1,
      blocked: 0,
    }).all,
    3
  );

  assert.throws(
    () =>
      parseAdminPharmacyStatistics({
        all: 4,
        new: 1,
        onVerification: 1,
        active: 0,
        onModeration: 1,
        blocked: 0,
      }),
    /counts/i
  );
});

//===================================================================

test('pharmacy-scoped owner options fail closed on invalid identity and strip contact fields', () => {
  assert.deepEqual(
    parseAdminPharmacyRegistryOwnerOptionsResponse({
      items: [
        {
          id: '507f1f77bcf86cd799439012',
          name: 'Owner',
          pictureUrl: null,
          email: 'should-not-leak@example.com',
          phone: 'hidden',
        },
      ],
    }),
    { items: [{ id: '507f1f77bcf86cd799439012', name: 'Owner' }] }
  );

  for (const bad of [
    { items: [{}] },
    { items: [{ id: 'not-object-id', name: 'Owner' }] },
    { items: [{ id: '507f1f77bcf86cd799439012', name: '' }] },
    { items: null },
  ]) {
    assert.throws(() => parseAdminPharmacyRegistryOwnerOptionsResponse(bad));
  }
});
