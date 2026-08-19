import assert from 'node:assert/strict';
import test from 'node:test';

import { clientsQuerySchema, clientProductsQuerySchema } from './client.schema';

import {
  ordersQuerySchema,
  orderSalesStatisticsQuerySchema,
} from './order.schema';

import {
  pharmaciesQuerySchema,
  updateMyPharmacyProfileSchema,
  uploadMyPharmacyDocumentSchema,
} from './pharmacy.schema';

import {
  managedProductsQuerySchema,
  productFiltersQuerySchema,
  publicProductsQuerySchema,
} from './product.schema';

import { sharedWorkingHoursSchema } from './shared-validation.schema';
import { emptyQuerySchema } from './shared';

const EXPECTED_REVISION = '2026-08-14T12:00:00.000Z';

const validWorkingHours = [
  'Mon: 09:00-18:00',
  'Tue: 09:00-18:00',
  'Wed: 09:00-18:00',
  'Thu: 09:00-18:00',
  'Fri: 09:00-18:00',
  'Sat: Closed',
  'Sun: Closed',
].join('; ');

//===============================================================

test('working hours require every day exactly once', () => {
  assert.equal(
    sharedWorkingHoursSchema.safeParse(validWorkingHours).success,
    true
  );

  assert.equal(
    sharedWorkingHoursSchema.safeParse('Open every day').success,
    false
  );

  assert.equal(
    sharedWorkingHoursSchema.safeParse(
      validWorkingHours.replace('; Sun: Closed', '')
    ).success,
    false
  );

  assert.equal(
    sharedWorkingHoursSchema.safeParse(`${validWorkingHours}; Mon: Closed`)
      .success,
    false
  );
});

//===============================================================

test('query schemas validate real calendar dates and ordered ranges', () => {
  const invalidCalendarDate = { dateFrom: '2026-99-45' };
  const invertedRange = { dateFrom: '2026-08-01', dateTo: '2026-07-31' };

  assert.equal(ordersQuerySchema.safeParse(invalidCalendarDate).success, false);
  assert.equal(ordersQuerySchema.safeParse(invertedRange).success, false);

  assert.equal(
    orderSalesStatisticsQuerySchema.safeParse(invertedRange).success,
    false
  );

  assert.equal(
    managedProductsQuerySchema.safeParse({
      addedFrom: invertedRange.dateFrom,
      addedTo: invertedRange.dateTo,
    }).success,
    false
  );

  assert.equal(
    clientsQuerySchema.safeParse({
      firstOrderFrom: invertedRange.dateFrom,
      firstOrderTo: invertedRange.dateTo,
    }).success,
    false
  );

  assert.equal(
    clientProductsQuerySchema.safeParse(invertedRange).success,
    false
  );
});

//===============================================================

test('public product queries reject management-only lifecycle filters', () => {
  assert.equal(
    publicProductsQuerySchema.safeParse({ includeBlocked: true }).success,
    false
  );

  assert.equal(
    publicProductsQuerySchema.safeParse({ status: 'blocked' }).success,
    false
  );

  assert.equal(
    managedProductsQuerySchema.safeParse({
      includeBlocked: true,
      status: 'blocked',
    }).success,
    true
  );
});

//===============================================================

test('public cacheable query schemas reject unknown parameters', () => {
  assert.equal(pharmaciesQuerySchema.safeParse({ junk: 'a' }).success, false);

  assert.equal(
    productFiltersQuerySchema.safeParse({ junk: 'a' }).success,
    false
  );

  assert.equal(emptyQuerySchema.safeParse({ junk: 'a' }).success, false);
  assert.equal(emptyQuerySchema.safeParse({}).success, true);
});

//===============================================================

test('empty nested bank details do not count as a profile change', () => {
  assert.equal(
    updateMyPharmacyProfileSchema.safeParse({
      expectedRevision: EXPECTED_REVISION,
      bankDetails: {},
    }).success,
    false
  );

  const normalized = updateMyPharmacyProfileSchema.parse({
    expectedRevision: EXPECTED_REVISION,
    bankDetails: {
      iban: ' ua123456789012345678901234567 ',
      receiptEmail: ' Billing@Example.COM ',
    },
  });

  assert.equal(normalized.bankDetails?.iban, 'UA123456789012345678901234567');
  assert.equal(normalized.bankDetails?.receiptEmail, 'billing@example.com');
});

//===============================================================

test('profile updates use null for explicit clears and reject empty-string clear ambiguity', () => {
  const clearResult = updateMyPharmacyProfileSchema.safeParse({
    expectedRevision: EXPECTED_REVISION,
    description: null,
    bankDetails: { receiptEmail: null },
  });

  assert.equal(clearResult.success, true);

  assert.equal(
    updateMyPharmacyProfileSchema.safeParse({
      expectedRevision: EXPECTED_REVISION,
      description: '',
    }).success,
    false
  );
});

//===============================================================

test('pharmacy document upload validates content while profile stores references', () => {
  const validDocument = {
    name: 'license.pdf',
    type: 'application/pdf' as const,
    size: 9,
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ=',
  };

  assert.equal(
    uploadMyPharmacyDocumentSchema.safeParse(validDocument).success,
    true
  );

  assert.equal(
    uploadMyPharmacyDocumentSchema.safeParse({
      ...validDocument,
      name: 'license.exe',
    }).success,
    false
  );

  assert.equal(
    uploadMyPharmacyDocumentSchema.safeParse({
      ...validDocument,
      size: 10 * 1024 * 1024 + 1,
    }).success,
    false
  );

  assert.equal(
    updateMyPharmacyProfileSchema.safeParse({
      expectedRevision: EXPECTED_REVISION,
      documents: [{ documentId: '507f1f77bcf86cd799439011' }],
    }).success,
    true
  );

  assert.equal(
    updateMyPharmacyProfileSchema.safeParse({
      expectedRevision: EXPECTED_REVISION,
      documents: Array.from({ length: 7 }, (_, index) => ({
        documentId: `507f1f77bcf86cd7994390${String(index + 11).padStart(2, '0')}`,
      })),
    }).success,
    false
  );
});
