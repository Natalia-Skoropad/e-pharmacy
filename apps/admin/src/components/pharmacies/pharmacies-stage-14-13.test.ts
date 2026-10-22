import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import {
  buildAdminPaymentRows,
  getMissingPublishedPaymentFields,
  getPublishedPaymentStatus,
  displayPaymentValue,
} from './PharmacyDetailsPageContent/pharmacy-about-payment';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const DATE = '2026-10-12T08:30:00.000Z' as ISODateTimeString;
const IBAN = 'UA' + '1'.repeat(27);
const ANOTHER_IBAN = 'UA' + '2'.repeat(27);

//===================================================================

const completeBank = {
  recipientName: 'Pharmacy LLC',
  taxId: '12345678',
  iban: IBAN,
  bankName: 'City bank',
  receiptEmail: 'receipts@example.com',
  paymentPurpose: 'Medicines',
};

const detail: AdminPharmacyDetail = {
  id: '507f1f77bcf86cd799439011',
  status: 'on_moderation',
  owner: null,

  current: {
    name: 'Test pharmacy',
    description: 'Published description',
    bankDetails: completeBank,
    bankTransferAvailable: true,
  },

  dates: { createdAt: DATE, updatedAt: DATE },
  documentCount: 0,

  metrics: {
    activeClientsCount: 0,
    successfulOrdersCount: 0,
    successfulRevenue: 0,
    addedProductsCount: 0,
    rating: 0,
    reviewsCount: 0,
  },
};

//===================================================================

test('14.13 authorized administrators can view full banking identifiers while pending changes remain separate', () => {
  assert.equal(displayPaymentValue('taxId', '12345678'), '12345678');
  assert.equal(displayPaymentValue('iban', IBAN), IBAN);
  assert.equal(displayPaymentValue('iban', ' '), 'Not provided');

  const rows = buildAdminPaymentRows(completeBank, {
    iban: ANOTHER_IBAN,
    taxId: null,
  });

  assert.equal(rows.length, 6);
  assert.equal(rows.find((row) => row.key === 'iban')?.changed, true);

  assert.equal(
    rows.find((row) => row.key === 'taxId')?.submitted,
    'Will be cleared'
  );

  assert.equal(rows.find((row) => row.key === 'taxId')?.changed, true);

  assert.equal(
    rows.find((row) => row.key === 'bankName')?.submitted,
    undefined
  );

  const safeText = JSON.stringify(rows);

  assert.match(safeText, /12345678/);
  assert.match(safeText, /UA1{27}/);
  assert.match(safeText, /UA2{27}/);
});

//===================================================================

test('14.13 validates the IBAN/Tax ID presentation but does not publish submitted fields', () => {
  const [iban, taxId] = buildAdminPaymentRows(
    { iban: 'not-an-iban', taxId: '34' },
    { iban: 'UA' + '3'.repeat(27), taxId: '9876543210' }
  ).filter((row) => row.key === 'iban' || row.key === 'taxId');

  assert.ok(iban?.publishedFormatIssue);
  assert.equal(iban?.submittedFormatIssue, undefined);
  assert.ok(taxId?.publishedFormatIssue);
  assert.equal(taxId?.submittedFormatIssue, undefined);

  assert.equal(getPublishedPaymentStatus(detail), 'available');

  assert.equal(
    getPublishedPaymentStatus({
      ...detail,
      pendingChanges: { bankDetails: { taxId: null, iban: ANOTHER_IBAN } },
    }),
    'available'
  );

  assert.equal(
    getPublishedPaymentStatus({
      ...detail,

      current: {
        ...detail.current,
        bankDetails: { iban: IBAN },
        bankTransferAvailable: false,
      },

      pendingChanges: { bankDetails: completeBank },
    }),
    'incomplete'
  );

  assert.deepEqual(getMissingPublishedPaymentFields({ iban: IBAN }), [
    'Recipient name',
    'Tax ID / EDRPOU',
    'Bank name',
    'Receipt email',
    'Payment purpose',
  ]);
});

//===================================================================

test('14.13 pharmacy description and bank details render in independent read-only tabs', async () => {
  const [shell, about, payment] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyAboutTab.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyPaymentTab.tsx'),
  ]);

  assert.match(shell, /activeTab === 'about' && detail/);
  assert.match(shell, /activeTab === 'payment' && detail/);
  assert.match(shell, /<PharmacyAboutTab detail=\{detail\}/);
  assert.match(shell, /<PharmacyPaymentTab detail=\{detail\}/);
  assert.doesNotMatch(shell, /about-payment/);
  assert.match(about, /current\.description/);
  assert.match(about, /pending\?\.description !== undefined/);

  assert.match(
    about,
    /<PharmacyAboutFields value=\{current\.description \?\? ''\} disabled/
  );

  assert.match(about, /<MarkdownContent value=\{pending\.description\}/);
  assert.match(about, /<MarkdownContent value=\{pending\.description\}/);

  const renderer = await read(
    '../../../../../packages/ui/src/data-display/MarkdownContent/markdown-to-html.ts'
  );

  assert.match(renderer, /escapeHtml/);
  assert.match(renderer, /https\?/);

  for (const tab of [about, payment]) {
    assert.doesNotMatch(
      tab,
      /dangerouslySetInnerHTML|innerHTML|<input|<textarea|<form|fetch\(|updateAdminPharmacy/
    );
  }

  assert.match(payment, /<PharmacyPaymentFields/);
  assert.match(payment, /disabled/);

  assert.match(
    payment,
    /buildAdminPaymentRows\(bank, pending\?\.bankDetails\)/
  );

  assert.match(payment, /pending\?\.bankDetails !== undefined/);
});

//===================================================================

test('14.13 private Admin API is guarded and generic public pharmacy API excludes banking credentials', async () => {
  const [route, backendRoutes, readService, publicService, bff] =
    await Promise.all([
      read('../../../../api/src/routes/admin.routes.ts'),
      read('../../../../api/src/controllers/admin.controller.ts'),

      read(
        '../../../../api/src/services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
      ),

      read(
        '../../../../api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
      ),

      read('../../../../../packages/next-api/src/proxy/backend-proxy.ts'),
    ]);

  assert.match(
    route,
    /'\/pharmacies\/:pharmacyId',[\s\S]*?ADMIN_PERMISSIONS\.pharmacies\.view/
  );

  assert.match(backendRoutes, /getAdminPharmacyDetailService/);
  assert.match(readService, /hasCompleteBankDetails\(bankDetails\)/);

  assert.match(
    readService,
    /import\s*\{\s*hasCompleteBankDetails\s*\}\s*from\s*['"]\.\.\/\.\.\/pharmacies\/bank-details['"]/
  );

  assert.match(readService, /const bankDetails = pending\.bankDetails/);
  assert.match(readService, /BANK_FIELDS\.filter/);

  const publicSerializer = publicService.slice(
    publicService.indexOf('function serializePublicPharmacy('),
    publicService.indexOf('export async function getPharmacyFiltersService')
  );

  assert.doesNotMatch(publicSerializer, /bankDetails:/);

  assert.match(
    publicSerializer,
    /bankTransferAvailable: hasCompleteBankDetails\(pharmacy\.bankDetails\)/
  );

  assert.match(bff, /cacheControl: 'no-store'/);
});
