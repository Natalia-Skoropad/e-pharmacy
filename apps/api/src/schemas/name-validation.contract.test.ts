import assert from 'node:assert/strict';
import test from 'node:test';

import {
  sharedBankNameSchema,
  sharedBankRecipientNameSchema,
  sharedPharmacyNameSchema,
  sharedUserNameSchema,
} from './shared-validation.schema';

//===============================================================

test('domain name schemas accept English and reject Cyrillic values', () => {
  assert.equal(sharedUserNameSchema.safeParse('Natalia').success, true);
  assert.equal(
    sharedPharmacyNameSchema.safeParse('Health Pharmacy').success,
    true
  );
  assert.equal(
    sharedBankRecipientNameSchema.safeParse('Health Pharmacy LLC').success,
    true
  );
  assert.equal(sharedBankNameSchema.safeParse('Example Bank').success, true);

  assert.equal(sharedUserNameSchema.safeParse('Наталія').success, false);
  assert.equal(sharedPharmacyNameSchema.safeParse('Аптека').success, false);
  assert.equal(
    sharedBankRecipientNameSchema.safeParse('ТОВ Аптека').success,
    false
  );
  assert.equal(sharedBankNameSchema.safeParse('Банк').success, false);
});

//===============================================================

test('domain name schemas use their own maximum lengths', () => {
  assert.equal(sharedUserNameSchema.safeParse('A'.repeat(50)).success, true);
  assert.equal(sharedUserNameSchema.safeParse('A'.repeat(51)).success, false);
  assert.equal(
    sharedPharmacyNameSchema.safeParse('A'.repeat(100)).success,
    true
  );

  assert.equal(
    sharedPharmacyNameSchema.safeParse('A'.repeat(101)).success,
    false
  );

  assert.equal(
    sharedBankRecipientNameSchema.safeParse('A'.repeat(160)).success,
    true
  );

  assert.equal(
    sharedBankRecipientNameSchema.safeParse('A'.repeat(161)).success,
    false
  );

  assert.equal(sharedBankNameSchema.safeParse('A'.repeat(120)).success, true);
  assert.equal(sharedBankNameSchema.safeParse('A'.repeat(121)).success, false);
});
