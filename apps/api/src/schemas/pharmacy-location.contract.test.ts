import assert from 'node:assert/strict';
import test from 'node:test';

import {
  pharmacyLocationDraftSchema,
  pharmacyLocationSchema,
} from './shared/pharmacy-location.schema';

//===============================================================

test('new pharmacy location draft may be incomplete', () => {
  assert.equal(pharmacyLocationDraftSchema.safeParse({}).success, true);

  assert.equal(
    pharmacyLocationDraftSchema.safeParse({ settlement: 'Bolhrad' }).success,
    true
  );
});

//===============================================================

test('verification-ready location requires address, settlement and countryCode', () => {
  const result = pharmacyLocationSchema.safeParse({});

  assert.equal(result.success, false);

  if (result.success) return;

  const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
  assert.equal(fields.has('address'), true);
  assert.equal(fields.has('settlement'), true);
  assert.equal(fields.has('countryCode'), true);
  assert.equal(fields.has('region'), false);
  assert.equal(fields.has('geo'), false);
});

//===============================================================

test('region and geo are optional for verification-ready location', () => {
  assert.deepEqual(
    pharmacyLocationSchema.parse({
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      countryCode: 'UA',
    }),
    {
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      countryCode: 'UA',
    }
  );
});

//===============================================================

test('GeoJSON Point accepts a longitude-latitude tuple and rejects out-of-range coordinates', () => {
  assert.equal(
    pharmacyLocationSchema.safeParse({
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      countryCode: 'UA',
      geo: { type: 'Point', coordinates: [28.611, 45.682] },
    }).success,
    true
  );

  assert.equal(
    pharmacyLocationSchema.safeParse({
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      countryCode: 'UA',
      geo: { type: 'Point', coordinates: [181, 45.682] },
    }).success,
    false
  );
});
