import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import {
  buildPharmacyComparisonRows,
  hasChangedBankDetails,
} from './PharmacyDetailsPageContent/pharmacy-information-comparison';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const DATE = '2026-10-12T08:30:00.000Z' as ISODateTimeString;

//===================================================================

const base: AdminPharmacyDetail = {
  id: '507f1f77bcf86cd799439011',
  status: 'active',
  owner: null,

  current: {
    name: 'Published pharmacy',
    location: { address: 'Main St 1', settlement: 'Odesa', countryCode: 'UA' },
    phone: '+380501234567',
    bankDetails: { iban: 'UA111' },
    bankTransferAvailable: false,
  },

  dates: { createdAt: DATE, updatedAt: DATE },
  documentCount: 2,

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

test('Stage 14.12 never invents a pending revision or overwrites published data', () => {
  assert.deepEqual(buildPharmacyComparisonRows(base), []);

  const withPending: AdminPharmacyDetail = {
    ...base,
    pendingChanges: {
      name: 'Proposed pharmacy',
      phone: null,
      location: { settlement: 'Kyiv' },
    },
  };

  const rows = buildPharmacyComparisonRows(withPending);

  assert.deepEqual(
    rows.map((item) => item.key),
    ['name', 'location.settlement', 'phone']
  );

  assert.deepEqual(
    rows.map((item) => item.changed),
    [true, true, true]
  );

  assert.equal(rows[0]?.published, 'Published pharmacy');
  assert.equal(rows[0]?.submitted, 'Proposed pharmacy');
  assert.equal(rows[1]?.published, 'Odesa');
  assert.equal(rows[1]?.submitted, 'Kyiv');
  assert.equal(rows[2]?.submitted, '—');
  assert.equal(withPending.current.location?.settlement, 'Odesa');
  assert.equal(withPending.current.phone, '+380501234567');
});

//===================================================================

test('Stage 14.12 distinguishes unchanged proposals and always flags submitted document sets', () => {
  const rows = buildPharmacyComparisonRows({
    ...base,
    pendingChanges: {
      name: 'Published pharmacy',
      documentsCount: 2,
    },
  });

  assert.equal(rows[0]?.changed, false);
  assert.equal(rows[1]?.key, 'documents');
  assert.equal(rows[1]?.changed, true);
  assert.equal(rows[1]?.verificationRequired, true);
  assert.equal(rows[1]?.published, '2 attached');
  assert.equal(rows[1]?.submitted, '2 submitted');
});

//===================================================================

test('Stage 14.12 bank comparison never exposes IBAN or submitted financial values', () => {
  const detail: AdminPharmacyDetail = {
    ...base,
    pendingChanges: { bankDetails: { iban: 'UA222' } },
  };

  const rows = buildPharmacyComparisonRows(detail);

  assert.equal(hasChangedBankDetails(detail), true);

  assert.deepEqual(
    rows.map((row) => row.key),
    ['bankDetails']
  );

  assert.equal(rows[0]?.presentation, 'private');
  assert.equal(rows[0]?.changed, true);
  assert.doesNotMatch(JSON.stringify(rows), /UA111|UA222/);

  assert.equal(
    hasChangedBankDetails({
      ...base,
      pendingChanges: { bankDetails: { iban: 'UA111' } },
    }),
    false
  );
});

//===================================================================

test('Stage 14.12 shares hours presentation and only mounts information for the active tab', async () => {
  const shell = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const content = await read(
    './PharmacyDetailsPageContent/PharmacyInformationTab.tsx'
  );

  const helper = await read(
    '../../../../../packages/ui/src/data-display/WorkingHours/WorkingHours.tsx'
  );

  const clientCommon = await read(
    '../../../../client/src/components/common/index.ts'
  );

  assert.match(shell, /activeTab === 'information' && detail/);
  assert.match(shell, /<PharmacyInformationTab/);
  assert.match(content, /detail\.pendingChanges !== undefined/);
  assert.match(content, /Published data \/ Submitted changes/);
  assert.match(content, /Submitted changes are awaiting review/);
  assert.match(content, /canViewOwner &&/);
  assert.match(content, /<DateValue value=\{dates\.updatedAt\}/);
  assert.match(content, /<WorkingHours value=\{value\}/);
  assert.match(helper, /getWorkingHoursDisplayItems/);
  assert.doesNotMatch(clientCommon, /\.\/WorkingHours\/WorkingHours/);
  assert.doesNotMatch(content, /from ['"]@\/components/);
  assert.doesNotMatch(content, /updateAdminPharmacy|fetch\(/);
});
