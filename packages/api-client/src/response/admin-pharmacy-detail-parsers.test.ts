import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAdminPharmacyDetail } from './admin-pharmacy-detail-parsers';

//===================================================================

const ID = '507f1f77bcf86cd799439011';
const OWNER_ID = '507f1f77bcf86cd799439012';
const DATE = '2026-10-12T08:30:00.000Z';

const onboarding = {
  id: ID,
  status: 'new',
  owner: null,
  current: { name: '', bankTransferAvailable: false },
  dates: { createdAt: DATE, updatedAt: DATE },
  documentCount: 0,

  metrics: {
    activeClientsCount: 0,
    successfulOrdersCount: 0,
    successfulRevenue: 0,
    addedProductsCount: 0,
    rating: 0,
    reviewsCount: 0,
  },
};

//===================================================================

test('Stage 14.5 accepts incomplete/onboarding and legacy unlinked pharmacy', () => {
  assert.deepEqual(parseAdminPharmacyDetail(onboarding), onboarding);

  assert.deepEqual(
    parseAdminPharmacyDetail({
      ...onboarding,

      current: {
        name: '',
        location: { settlement: 'Odesa' },
        bankDetails: { iban: '' },
        bankTransferAvailable: false,
      },
    }).current.location,
    { settlement: 'Odesa' }
  );
});

//===================================================================

test('Stage 14.5 keeps published and proposed changes separate, validates owner', () => {
  const detail = parseAdminPharmacyDetail({
    ...onboarding,
    status: 'on_moderation',

    owner: {
      id: OWNER_ID,
      name: 'Pharmacy owner',
      email: 'owner@example.com',
      phone: '+380501234567',
      status: 'active',
    },

    current: {
      name: 'Approved name',
      bankDetails: { iban: 'UA000' },
      bankTransferAvailable: false,
    },

    pendingChanges: {
      name: 'Proposed name',
      phone: null,
      bankDetails: { iban: null },
      documentsCount: 2,
    },

    reviewState: 'changes_requested',
    reviewFeedback: 'Correct the details',
    reviewedAt: DATE,
    reviewedBy: OWNER_ID,
    dates: { createdAt: DATE, updatedAt: DATE, approvedAt: DATE },
  });

  assert.equal(detail.current.name, 'Approved name');
  assert.equal(detail.pendingChanges?.name, 'Proposed name');
  assert.equal(detail.pendingChanges?.bankDetails?.iban, null);
  assert.equal(detail.owner?.id, OWNER_ID);
  assert.equal(detail.reviewedBy, OWNER_ID);
});

//===================================================================

test('Stage 14.5 rejects invalid entity IDs, timestamps, statuses and metrics', () => {
  for (const patch of [
    { id: 'bad' },
    { reviewedBy: 'bad' },
    { status: 'inactive' },
    { reviewState: 'approved' },
    { dates: { createdAt: '2026-02-30T08:30:00.000Z', updatedAt: DATE } },
    { dates: { createdAt: DATE, updatedAt: 'yesterday' } },
    {
      owner: {
        id: 'bad',
        name: 'Owner',
        email: 'a@b.c',
        phone: '123',
        status: 'active',
      },
    },
    { metrics: { ...onboarding.metrics, rating: 5.001 } },
    { metrics: { ...onboarding.metrics, successfulOrdersCount: -1 } },
    { metrics: { ...onboarding.metrics, successfulRevenue: Infinity } },
    { documentCount: -1 },
    { current: { name: 'Name', bankTransferAvailable: 'yes' } },
    { pendingChanges: { documentsCount: -1 } },
    {
      current: {
        name: 'Name',
        bankTransferAvailable: false,
        location: { geo: { type: 'Point', coordinates: [191, 50] } },
      },
    },
  ]) {
    assert.throws(() => parseAdminPharmacyDetail({ ...onboarding, ...patch }));
  }
});

//===================================================================

test('Stage 14.5 parser strictly selects safe fields, never returns raw document metadata', () => {
  const detail = parseAdminPharmacyDetail({
    ...onboarding,
    secretServerToken: 'secret',
    documents: [{ sha256: 'secret' }],

    current: {
      name: 'Approved',
      bankTransferAvailable: false,
      internalNotes: 'secret',
      bankDetails: { iban: 'UA000', password: 'secret' },
    },

    pendingChanges: {
      name: 'Pending',
      documentsCount: 1,
      documents: [{ sha256: 'secret', content: 'secret' }],
      bankDetails: { iban: 'UA111', password: 'secret' },
    },
  });

  assert.doesNotMatch(
    JSON.stringify(detail),
    /secret|sha256|password|documents":/
  );

  assert.equal(detail.documentCount, 0);
  assert.equal(detail.pendingChanges?.documentsCount, 1);
});
