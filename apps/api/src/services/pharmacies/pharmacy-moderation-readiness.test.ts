import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { moderationReadyPharmacyFields } from '../__tests__/fixtures/pharmacy-moderation-ready.helper';

import {
  hasEffectiveModerationChanges,
  missingRequiredModerationFields,
} from './pharmacy-moderation-readiness';

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

//===============================================================

test('empty or unchanged proposals must not activate moderation submission', () => {
  const pharmacy = activePharmacy();

  assert.equal(hasEffectiveModerationChanges(pharmacy, {}), false);

  assert.equal(
    hasEffectiveModerationChanges(pharmacy, { name: pharmacy.name }),
    false
  );

  assert.equal(
    hasEffectiveModerationChanges(pharmacy, {
      bankDetails: { taxId: pharmacy.bankDetails?.taxId },

      location: {
        address: pharmacy.location?.address,
        settlement: pharmacy.location?.settlement,
        region: pharmacy.location?.region,
        countryCode: pharmacy.location?.countryCode,
      },
    }),
    false
  );

  assert.equal(
    hasEffectiveModerationChanges(pharmacy, { name: 'Changed Pharmacy Name' }),
    true
  );
});

test('cleared approved fields are real proposals but must fail readiness', () => {
  const pharmacy = activePharmacy();
  const pending = { bankDetails: { taxId: null } };

  assert.equal(hasEffectiveModerationChanges(pharmacy, pending), true);

  assert.deepEqual(missingRequiredModerationFields(pharmacy, pending), [
    'taxId',
  ]);
});

//===============================================================

test('a null proposal for an already absent field is not a real change', () => {
  const pharmacy = activePharmacy();

  pharmacy.email = undefined;
  assert.equal(hasEffectiveModerationChanges(pharmacy, { email: null }), false);
});

//===============================================================

test('reactivation readiness accepts an approved pharmacy without a pending proposal', () => {
  const pharmacy = activePharmacy();

  assert.deepEqual(missingRequiredModerationFields(pharmacy), []);
  assert.deepEqual(missingRequiredModerationFields(pharmacy, undefined), []);
});
