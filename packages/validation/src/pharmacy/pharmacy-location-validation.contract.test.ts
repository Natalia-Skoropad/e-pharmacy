import assert from 'node:assert/strict';
import test from 'node:test';

import type { PharmacyLocationDraft } from '@e-pharmacy/types/pharmacies';

import {
  isPharmacyLocationReadyForVerification,
  validatePharmacyLocation,
} from './pharmacy-location-validation';

//===================================================================

test('draft pharmacy location may be incomplete', () => {
  assert.deepEqual(validatePharmacyLocation({}, 'draft'), {});

  assert.deepEqual(
    validatePharmacyLocation({ settlement: 'Bolhrad' }, 'draft'),
    {}
  );
});

//===================================================================

test('verification requires address, settlement and countryCode only', () => {
  const errors = validatePharmacyLocation({}, 'verification');

  assert.equal(errors.address, 'Address is required');
  assert.equal(errors.settlement, 'Settlement is required');
  assert.equal(errors.countryCode, 'Country code is required');
  assert.equal(errors.region, undefined);
  assert.equal(errors.geo, undefined);
});

//===================================================================

test('region and geo remain optional for verification', () => {
  const location: PharmacyLocationDraft = {
    address: '36 Bolharskykh Opolchentsiv Street',
    settlement: 'Bolhrad',
    countryCode: 'UA',
  };

  assert.equal(isPharmacyLocationReadyForVerification(location), true);
  assert.deepEqual(validatePharmacyLocation(location, 'verification'), {});
});

//===================================================================

test('verification rejects malformed country code and out-of-range GeoJSON Point', () => {
  const errors = validatePharmacyLocation(
    {
      address: '36 Bolharskykh Opolchentsiv Street',
      settlement: 'Bolhrad',
      countryCode: 'ua',
      geo: {
        type: 'Point',
        coordinates: [181, 46.42],
      },
    },
    'verification'
  );

  assert.equal(
    errors.countryCode,
    'Country code must contain two uppercase Latin letters'
  );

  assert.equal(
    errors.geo,
    'Geo must be a valid GeoJSON Point with [longitude, latitude]'
  );
});
