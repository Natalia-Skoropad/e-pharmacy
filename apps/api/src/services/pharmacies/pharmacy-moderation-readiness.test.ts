import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { moderationReadyPharmacyFields } from '../__tests__/fixtures/pharmacy-moderation-ready.helper';

import { missingRequiredModerationFields } from './pharmacy-moderation-readiness';

//===============================================================

function activePharmacy() {
  return new Pharmacy({
    ...moderationReadyPharmacyFields({
      email: 'pharmacy@example.com',
      phone: '+380501234567',
    }),

    ownerId: new Types.ObjectId(),
    name: 'Approved Pharmacy',
    status: 'active',
  });
}

//===============================================================

test('a single changed field can be moderated with complete hydrated published fields', () => {
  const pharmacy = activePharmacy();

  assert.equal(pharmacy.validateSync(), undefined);

  assert.deepEqual(
    missingRequiredModerationFields(pharmacy, { name: 'Updated Pharmacy' }),
    []
  );

  assert.deepEqual(
    missingRequiredModerationFields(pharmacy, {
      bankDetails: { bankName: 'Updated Bank' },
    }),
    []
  );
});

//===============================================================

test('missing proposed bank, documents and text cannot be masked by published data', () => {
  const pharmacy = activePharmacy();

  assert.deepEqual(
    missingRequiredModerationFields(pharmacy, {
      bankDetails: { iban: null },
      documents: [],
      description: null,
    }),
    ['description', 'iban', 'documents']
  );
});

//===============================================================

test('an incomplete proposed location cannot fall back to the published address', () => {
  const pharmacy = activePharmacy();

  assert.deepEqual(
    missingRequiredModerationFields(pharmacy, {
      location: { settlement: 'Odesa', region: 'Odesa region' },
    }),
    ['address', 'countryCode']
  );

  assert.deepEqual(
    missingRequiredModerationFields(pharmacy, {
      location: {
        address: '20 New Street',
        settlement: 'Odesa',
        region: 'Odesa region',
        countryCode: 'UA',
      },
    }),
    []
  );
});
