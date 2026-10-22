import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCompleteBankDetails } from './bank-details';

//===============================================================

const valid = {
  recipientName: 'Pharmacy Name',
  taxId: '123456789',
  iban: 'UA123456789012345678901234567',
  bankName: 'Test Bank',
  receiptEmail: 'finance@example.com',
  paymentPurpose: 'Payment for order',
};

//===============================================================

test('bank transfers require all six details and reject partial/pending drafts', () => {
  assert.equal(hasCompleteBankDetails(undefined), false);
  assert.equal(hasCompleteBankDetails(null), false);
  assert.equal(hasCompleteBankDetails({}), false);
  assert.equal(hasCompleteBankDetails(valid), true);

  for (const key of Object.keys(valid) as Array<keyof typeof valid>) {
    const missing = { ...valid };

    delete (missing as Partial<typeof valid>)[key];

    assert.equal(hasCompleteBankDetails(missing), false, key);
    assert.equal(hasCompleteBankDetails({ ...valid, [key]: '' }), false, key);
  }
});
