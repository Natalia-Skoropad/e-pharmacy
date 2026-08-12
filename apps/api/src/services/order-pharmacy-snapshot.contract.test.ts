import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const servicePath = path.resolve(
  process.cwd(),
  'src/services/order.service.ts'
);

//===============================================================

test('order responses keep the confirmed pharmacy snapshot immutable', async () => {
  const source = await readFile(servicePath, 'utf8');

  assert.doesNotMatch(source, /hydrateOrderPharmacyDetails/);

  assert.doesNotMatch(
    source,
    /Pharmacy\.findById\(order\.pharmacyId\)[\s\S]{0,400}pharmacySnapshot/
  );

  assert.match(source, /serializeOrder\(\s*order,/);

  assert.match(
    source,
    /input\.paymentMethod === 'bank_transfer'[\s\S]{0,180}order\.pharmacySnapshot\.bankDetails/
  );
});
