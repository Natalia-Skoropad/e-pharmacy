import assert from 'node:assert/strict';
import test from 'node:test';

import { formatPharmacyLocation } from './format-pharmacy-location';

//===================================================================

test('formats pharmacy location in canonical address, settlement, region order', () => {
  assert.equal(
    formatPharmacyLocation({
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      region: 'Odesa region',
    }),
    '36 Bolharskykh Opolchentsiv Street, Bolhrad, Odesa region'
  );

  assert.equal(
    formatPharmacyLocation({
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
    }),
    '36 Bolharskykh Opolchentsiv Street, Bolhrad'
  );
});

//===================================================================

test('ignores missing and whitespace-only location parts', () => {
  assert.equal(
    formatPharmacyLocation({
      address: '  Pharmacy Street  ',
      settlement: '  ',
      region: ' Odesa region ',
    }),
    'Pharmacy Street, Odesa region'
  );

  assert.equal(formatPharmacyLocation(), '');
});
