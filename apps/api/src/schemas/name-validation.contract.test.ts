import assert from 'node:assert/strict';
import test from 'node:test';

import {
  sharedBankNameSchema,
  sharedBankRecipientNameSchema,
  sharedPharmacyNameSchema,
  sharedUserNameSchema,
} from './shared-validation.schema';

//===============================================================

test('domain name schemas accept Ukrainian values', () => {
  assert.equal(sharedUserNameSchema.safeParse('Наталія').success, true);

  assert.equal(
    sharedPharmacyNameSchema.safeParse('Аптека Здоров’я').success,
    true
  );

  assert.equal(
    sharedBankRecipientNameSchema.safeParse('ТОВ Аптека Здоров’я').success,
    true
  );

  assert.equal(sharedBankNameSchema.safeParse('Банк Україна').success, true);
});

//===============================================================

test('domain name schemas use their own maximum lengths', () => {
  assert.equal(sharedUserNameSchema.safeParse('а'.repeat(50)).success, true);
  assert.equal(sharedUserNameSchema.safeParse('а'.repeat(51)).success, false);

  assert.equal(
    sharedPharmacyNameSchema.safeParse('а'.repeat(100)).success,
    true
  );

  assert.equal(
    sharedPharmacyNameSchema.safeParse('а'.repeat(101)).success,
    false
  );

  assert.equal(
    sharedBankRecipientNameSchema.safeParse('а'.repeat(160)).success,
    true
  );

  assert.equal(
    sharedBankRecipientNameSchema.safeParse('а'.repeat(161)).success,
    false
  );

  assert.equal(sharedBankNameSchema.safeParse('а'.repeat(120)).success, true);
  assert.equal(sharedBankNameSchema.safeParse('а'.repeat(121)).success, false);
});
