import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPaymentPurposeError,
  buildWorkingHoursError,
  normalizePharmacyPaymentForm,
  validatePharmacyContactForm,
  validatePharmacyPaymentForm,
} from '../profile';

import {
  PICTURE_DATA_URL_MAX_LENGTH,
  PICTURE_HTTP_URL_MAX_LENGTH,
  buildPictureUrlError,
  validatePharmacyDocuments,
} from '../files';

import { isCalendarDate, isDateRangeValid, validateDateRange } from '../url';

import { ORDER_COMMENT_PATTERN, PAYMENT_PURPOSE_PATTERN } from './patterns';

const validWorkingHours = [
  'Mon: 09:00-18:00',
  'Tue: 09:00-18:00',
  'Wed: 09:00-18:00',
  'Thu: 09:00-18:00',
  'Fri: 09:00-18:00',
  'Sat: Closed',
  'Sun: Closed',
].join('; ');

//=============================================================================

test('payment purpose has its own semantic pattern', () => {
  assert.notEqual(PAYMENT_PURPOSE_PATTERN, ORDER_COMMENT_PATTERN);
  assert.equal(buildPaymentPurposeError('Payment for pharmacy order'), '');
  assert.notEqual(buildPaymentPurposeError('Оплата замовлення'), '');
});

//=============================================================================

test('working hours require exactly one entry for every day', () => {
  assert.equal(buildWorkingHoursError(validWorkingHours), '');
  assert.notEqual(buildWorkingHoursError('Open every day'), '');
  assert.notEqual(
    buildWorkingHoursError(validWorkingHours.replace('; Sun: Closed', '')),
    ''
  );
  assert.notEqual(
    buildWorkingHoursError(`${validWorkingHours}; Mon: Closed`),
    ''
  );
  assert.notEqual(
    buildWorkingHoursError(
      validWorkingHours.replace('09:00-18:00', '18:00-09:00')
    ),
    ''
  );
});

//=============================================================================

test('calendar dates reject impossible dates and inverted ranges', () => {
  assert.equal(isCalendarDate('2026-02-28'), true);
  assert.equal(isCalendarDate('2024-02-29'), true);
  assert.equal(isCalendarDate('2026-02-29'), false);
  assert.equal(isCalendarDate('2026-99-45'), false);
  assert.equal(
    isDateRangeValid({ from: '2026-07-01', to: '2026-07-31' }),
    true
  );
  assert.equal(
    isDateRangeValid({ from: '2026-08-01', to: '2026-07-31' }),
    false
  );
  assert.ok(validateDateRange({ from: '2026-99-45' }).from);
});

//=============================================================================

test('picture transport distinguishes data URLs, HTTP URLs and blob previews', () => {
  assert.equal(buildPictureUrlError('https://example.com/image.webp'), '');
  assert.equal(buildPictureUrlError('data:image/webp;base64,AA=='), '');
  assert.notEqual(buildPictureUrlError('data:image/jpg;base64,AA=='), '');
  assert.notEqual(buildPictureUrlError('blob:https://example.com/preview'), '');

  assert.notEqual(
    buildPictureUrlError(
      `https://example.com/${'a'.repeat(PICTURE_HTTP_URL_MAX_LENGTH)}`
    ),
    ''
  );

  assert.notEqual(
    buildPictureUrlError(
      `data:image/png;base64,${'A'.repeat(PICTURE_DATA_URL_MAX_LENGTH)}`
    ),
    ''
  );
});

//=============================================================================

test('pharmacy draft and verification validation modes are explicit', () => {
  const emptyContact = {
    name: '',
    address: '',
    phone: '',
    email: '',
    workingHours: '',
  };

  const emptyPayment = {
    recipientName: '',
    taxId: '',
    iban: '',
    bankName: '',
    receiptEmail: '',
    paymentPurpose: '',
  };

  assert.deepEqual(validatePharmacyContactForm(emptyContact, 'draft'), {});
  assert.notDeepEqual(
    validatePharmacyContactForm(emptyContact, 'verification'),
    {}
  );

  assert.deepEqual(validatePharmacyPaymentForm(emptyPayment, 'draft'), {});
  assert.notDeepEqual(
    validatePharmacyPaymentForm(emptyPayment, 'verification'),
    {}
  );

  assert.deepEqual(normalizePharmacyPaymentForm(emptyPayment, 'draft'), {});
});

//=============================================================================

test('pharmacy payment normalization lowercases email and uppercases IBAN', () => {
  assert.deepEqual(
    normalizePharmacyPaymentForm(
      {
        recipientName: 'Health Pharmacy LLC',
        taxId: '12345678',
        iban: ' ua123456789012345678901234567 ',
        bankName: 'Example Bank',
        receiptEmail: ' Billing@Example.COM ',
        paymentPurpose: 'Payment for medicines',
      },
      'verification'
    ),
    {
      recipientName: 'Health Pharmacy LLC',
      taxId: '12345678',
      iban: 'UA123456789012345678901234567',
      bankName: 'Example Bank',
      receiptEmail: 'billing@example.com',
      paymentPurpose: 'Payment for medicines',
    }
  );
});

//=============================================================================

test('pharmacy document validation checks count, MIME, extension and size', () => {
  const validDocument = {
    name: 'license.pdf',
    type: 'application/pdf',
    size: 1024,
  };

  assert.equal(validatePharmacyDocuments([validDocument]), '');
  assert.equal(validatePharmacyDocuments([{ ...validDocument, type: '' }]), '');
  assert.notEqual(
    validatePharmacyDocuments([
      { name: 'license.exe', type: 'application/octet-stream', size: 1024 },
    ]),
    ''
  );

  assert.notEqual(
    validatePharmacyDocuments([
      { ...validDocument, size: 10 * 1024 * 1024 + 1 },
    ]),
    ''
  );

  assert.notEqual(validatePharmacyDocuments([], { required: true }), '');
});
