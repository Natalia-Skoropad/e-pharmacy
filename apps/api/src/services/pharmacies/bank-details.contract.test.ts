import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/services', path), 'utf8');

//===================================================================

test('all payment surfaces use one complete-bank-details predicate', () => {
  const helper = read('pharmacies/bank-details.ts');

  const consumers = [
    'admin/pharmacies/admin.service.ts',
    'admin/pharmacies/admin-pharmacy-detail-read.service.ts',
    'pharmacies/pharmacy.service.ts',
    'orders/order-checkout.service.ts',
  ];

  assert.match(helper, /details is CompletePharmacyBankDetails/);

  for (const path of consumers) {
    const source = read(path);

    assert.match(source, /import \{ hasCompleteBankDetails \}/);
    assert.doesNotMatch(source, /function hasCompleteBankDetails\(/);
  }

  const publicSerializer = read('pharmacies/pharmacy.service.ts').split(
    'function serializeCurrentPharmacySummary'
  )[0];

  assert.doesNotMatch(publicSerializer, /bankDetails:\s*pharmacy\.bankDetails/);

  const adminDetail = read(
    'admin/pharmacies/admin-pharmacy-detail-read.service.ts'
  );

  assert.match(
    adminDetail,
    /bankTransferAvailable: hasCompleteBankDetails\(bankDetails\)/
  );

  assert.match(
    adminDetail,
    /const bankDetails = serializeBankDetails\(pharmacy\.bankDetails\)/
  );
});
