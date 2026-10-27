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

test('verification requires address, settlement, region and countryCode', () => {
  const errors = validatePharmacyLocation({}, 'verification');

  assert.equal(errors.address, 'Address is required');
  assert.equal(errors.settlement, 'Settlement is required');
  assert.equal(errors.countryCode, 'Country code is required');
  assert.equal(errors.region, 'Region is required');
  assert.equal(errors.geo, undefined);
});

//===================================================================

test('region is required for verification but optional for an incomplete draft', () => {
  const location: PharmacyLocationDraft = {
    address: '36 Bolharskykh Opolchentsiv Street',
    settlement: 'Bolhrad',
    countryCode: 'UA',
  };

  assert.equal(isPharmacyLocationReadyForVerification(location), false);

  assert.equal(
    validatePharmacyLocation(location, 'verification').region,
    'Region is required'
  );

  assert.deepEqual(validatePharmacyLocation(location, 'draft'), {});

  const completeLocation = { ...location, region: 'Odesa region' };

  assert.equal(isPharmacyLocationReadyForVerification(completeLocation), true);

  assert.deepEqual(
    validatePharmacyLocation(completeLocation, 'verification'),
    {}
  );

  assert.equal(
    validatePharmacyLocation(
      { ...completeLocation, region: '  ' },
      'verification'
    ).region,
    'Region is required'
  );
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

//===================================================================

test('settlement and region names accept only Latin letters, spaces and hyphens', () => {
  for (const valid of ['Ivano-Frankivsk', 'Ivano Frankivsk', 'Odesa region']) {
    assert.equal(
      validatePharmacyLocation({ settlement: valid, region: valid }, 'draft')
        .settlement,
      undefined
    );

    assert.equal(
      validatePharmacyLocation({ settlement: valid, region: valid }, 'draft')
        .region,
      undefined
    );
  }

  for (const invalid of [
    'Ivano.Frankivsk',
    'Kyiv/Region',
    'Львів',
    'Odesa--region',
    'Odesa  region',
    'Lviv2',
    '-Kyiv',
    'Kyiv-',
  ]) {
    const errors = validatePharmacyLocation(
      { settlement: invalid, region: invalid },
      'draft'
    );

    assert.equal(
      errors.settlement,
      'Use Latin letters, spaces and single hyphens only',
      invalid
    );

    assert.equal(
      errors.region,
      'Use Latin letters, spaces and single hyphens only',
      invalid
    );
  }
});
