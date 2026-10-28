import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseOwnedPharmacyDetailResponse,
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

//=============================================================================

test('owner pharmacy detail accepts validated Markdown descriptions after saving', () => {
  // The backend allows links, underscores, URL query parameters and markdown
  // emphasis. The response parser must accept that same persisted content.
  const description =
    '## Pharmacy details\nRead [delivery & pickup](https://example.com/help?locale=en&topic=pharmacy) or contact @support_team ~today~.';

  const parsed = parseOwnedPharmacyDetailResponse({
    pharmacy: {
      id: base.id,
      membershipRole: 'owner',
      name: base.name,
      status: 'active',
      rating: 4.5,
      reviewsCount: 2,
      bankTransferAvailable: false,
      documents: [],
      description: 'Published details',
      pendingModeration: { description },
      updatedAt: '2026-10-12T00:00:00.000Z',
    },

    dates: {
      createdAt: '2026-10-12T00:00:00.000Z',
      updatedAt: '2026-10-12T00:00:00.000Z',
    },

    metrics: { ...metrics, rating: 4.5, reviewsCount: 2 },
  });

  assert.equal(parsed.pharmacy.pendingModeration?.description, description);
  assert.equal(parsed.pharmacy.description, 'Published details');
  assert.equal(parsed.metrics?.successfulOrdersCount, 2);

  assert.throws(() =>
    parseOwnedPharmacyDetailResponse({
      pharmacy: {
        ...parsed.pharmacy,
        description: '<script>alert(1)</script>',
      },

      dates: parsed.dates,
      metrics: parsed.metrics,
    })
  );
});
