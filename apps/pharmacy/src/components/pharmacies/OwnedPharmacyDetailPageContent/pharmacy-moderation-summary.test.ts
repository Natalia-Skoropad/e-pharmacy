import assert from 'node:assert/strict';
import test from 'node:test';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { getPharmacyModerationSummary } from './pharmacy-moderation-summary';

//===================================================================

const pharmacy = {
  name: 'Care Pharmacy Lviv',
  phone: '+380501111111',
  email: 'published@example.com',
  description: 'Published description',

  location: {
    address: '15 Shevchenka Street',
    settlement: 'Lviv',
    region: 'Lviv Region',
  },

  bankDetails: {
    recipientName: 'Published recipient',
    taxId: '12345678',
    bankName: 'Published bank',
  },

  documents: [{ id: 'document-1', name: 'Existing license' }],

  pendingModeration: {
    name: 'Care Pharmacy Lviv Plus',
    phone: '+380501111111', // unchanged; must not appear in the review
    description: 'Proposed description',
    location: { address: '20 Shevchenka Street' },

    bankDetails: {
      taxId: '87654321',
      bankName: 'Published bank', // unchanged
    },

    documents: [{ id: 'document-2', name: 'New license' }],
  },
} as unknown as MyPharmacyProfile;

//===================================================================

test('moderation modal lists only changed fields, grouped by editor tab', () => {
  const summary = getPharmacyModerationSummary(pharmacy);

  assert.deepEqual(summary, [
    { title: 'Pharmacy data', fields: ['Pharmacy name', 'Address'] },
    { title: 'About pharmacy', fields: ['Description'] },
    { title: 'Payment details', fields: ['Tax ID / EDRPOU'] },
    { title: 'Documents', fields: ['Pharmacy documents'] },
  ]);
});

//===================================================================

test('no proposed fields yields no groups', () => {
  const value = {
    ...pharmacy,
    pendingModeration: {},
  } satisfies MyPharmacyProfile;

  assert.deepEqual(getPharmacyModerationSummary(value), []);
});

//===================================================================

test('a single changed field renders a single tab and label', () => {
  const value = {
    ...pharmacy,
    pendingModeration: { email: 'new@example.com' },
  } as unknown as MyPharmacyProfile;

  assert.deepEqual(getPharmacyModerationSummary(value), [
    { title: 'Pharmacy data', fields: ['Email'] },
  ]);
});

//===================================================================

test('clearing an already empty optional field does not create a false change', () => {
  const value = {
    ...pharmacy,
    email: undefined,
    pendingModeration: { email: null },
  } as unknown as MyPharmacyProfile;

  assert.deepEqual(getPharmacyModerationSummary(value), []);
});
