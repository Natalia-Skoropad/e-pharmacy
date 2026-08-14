import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizePharmacyAboutForm,
  normalizePharmacyContactForm,
  normalizePharmacyPaymentForm,
} from './pharmacy-profile-validation';

//===================================================================

test('draft pharmacy normalization distinguishes unchanged empty values from explicit clears', () => {
  assert.deepEqual(
    normalizePharmacyAboutForm(
      { description: '' },
      'draft',
      { description: 'Existing description' }
    ),
    { description: null }
  );

  assert.deepEqual(
    normalizePharmacyContactForm(
      {
        name: 'Example Pharmacy',
        address: '',
        phone: '',
        email: '',
        workingHours: '',
      },
      'draft',
      {
        name: 'Example Pharmacy',
        address: 'Kyiv, Main Street 1',
        phone: '+380501234567',
        email: 'pharmacy@example.com',
        workingHours: 'Mon: 09:00-18:00',
      }
    ),
    {
      name: 'Example Pharmacy',
      address: null,
      phone: null,
      email: null,
      workingHours: null,
    }
  );

  assert.deepEqual(
    normalizePharmacyPaymentForm(
      {
        recipientName: '',
        taxId: '',
        iban: '',
        bankName: '',
        receiptEmail: '',
        paymentPurpose: '',
      },
      'draft',
      {
        recipientName: 'Example LLC',
        taxId: '12345678',
        iban: 'UA123456789012345678901234567',
        bankName: 'Example Bank',
        receiptEmail: 'billing@example.com',
        paymentPurpose: 'Payment for medicines',
      }
    ),
    {
      recipientName: null,
      taxId: null,
      iban: null,
      bankName: null,
      receiptEmail: null,
      paymentPurpose: null,
    }
  );
});

//===================================================================

test('draft pharmacy normalization omits fields that were already empty', () => {
  assert.deepEqual(
    normalizePharmacyAboutForm({ description: '' }, 'draft', { description: '' }),
    {}
  );
});
