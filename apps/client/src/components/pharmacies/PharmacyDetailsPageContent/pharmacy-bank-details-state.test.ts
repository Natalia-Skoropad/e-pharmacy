import assert from 'node:assert/strict';
import test from 'node:test';

import { canLoadPharmacyBankDetails } from './pharmacy-bank-details-state';

//===================================================================

test('allows retry after an error but not duplicate loads', () => {
  assert.equal(canLoadPharmacyBankDetails({ status: 'idle' }), true);
  assert.equal(canLoadPharmacyBankDetails({ status: 'loading' }), false);
  assert.equal(
    canLoadPharmacyBankDetails({
      status: 'error',
      error: new Error('temporary'),
    }),
    true
  );

  assert.equal(
    canLoadPharmacyBankDetails({
      status: 'success',
      data: {
        recipientName: 'Recipient',
        taxId: '12345678',
        iban: 'UA123456789012345678901234567',
        bankName: 'Bank',
        paymentPurpose: 'Order payment',
        receiptEmail: 'receipts@example.com',
      },
    }),
    false
  );

  assert.equal(canLoadPharmacyBankDetails({ status: 'empty' }), false);
  assert.equal(canLoadPharmacyBankDetails({ status: 'empty' }, true), true);
});
