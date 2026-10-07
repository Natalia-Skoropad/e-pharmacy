import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAdminPharmacyOwnerEntityId,
  parseAdminPharmacyOwnerDetail,
  parseAdminPharmacyOwnerListResponse,
  parseAdminPharmacyOwnerStatusMutationResponse,
} from './admin-pharmacy-owner';

//===================================================================

const OWNER_ID = '64b64b64b64b64b64b64b64b';

//===================================================================

test('parses owner list/detail/status network contracts fail-closed', () => {
  const list = parseAdminPharmacyOwnerListResponse({
    items: [
      {
        id: OWNER_ID,
        name: 'Natalia Owner',
        email: 'owner@example.com',
        phone: '+380000000000',
        status: 'new',
        registeredAt: '2026-10-01T10:00:00.000Z',
        operatingPharmaciesCount: 1,
        nonWorkingPharmaciesCount: 2,
      },
    ],
    page: 1,
    perPage: 20,
    total: 1,
    totalPages: 1,
  });

  assert.equal(list.items[0]?.status, 'new');

  const detail = parseAdminPharmacyOwnerDetail({
    id: OWNER_ID,
    name: 'Natalia Owner',
    email: 'owner@example.com',
    phone: '+380000000000',
    status: 'active',
    registeredAt: '2026-10-01T10:00:00.000Z',
    lastPersonalDataUpdateAt: '2026-10-02T10:00:00.000Z',

    pharmacyStatistics: {
      all: 3,
      new: 0,
      onVerification: 1,
      onModeration: 0,
      active: 2,
      blocked: 0,
    },
  });

  assert.equal(detail.pharmacyStatistics.all, 3);

  const mutation = parseAdminPharmacyOwnerStatusMutationResponse({
    owner: {
      ownerId: OWNER_ID,
      status: 'blocked',
      blockedPharmacies: 2,
    },
  });

  assert.equal(mutation.owner.blockedPharmacies, 2);

  assert.throws(() =>
    parseAdminPharmacyOwnerListResponse({
      items: [],
      page: 1,
      perPage: 20,
      total: 21,
      totalPages: 1,
    })
  );

  assert.throws(() =>
    parseAdminPharmacyOwnerStatusMutationResponse({
      owner: { ownerId: OWNER_ID, status: 'new', blockedPharmacies: 0 },
    })
  );
});

//===================================================================

test('rejects malformed entity ids before browser requests are built', () => {
  assert.equal(assertAdminPharmacyOwnerEntityId(OWNER_ID), OWNER_ID);
  assert.throws(() => assertAdminPharmacyOwnerEntityId('not-an-id'));
});
