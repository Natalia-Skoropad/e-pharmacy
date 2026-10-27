import assert from 'node:assert/strict';
import test from 'node:test';

import {
  pharmacyRegionSchema,
  pharmacySettlementSchema,
} from './pharmacy-location.schema';

//===================================================================

test('server location names accept canonical Latin text and hyphens', () => {
  for (const valid of ['Ivano-Frankivsk', 'Ivano Frankivsk', 'Odesa region']) {
    assert.equal(
      pharmacySettlementSchema.safeParse(valid).success,
      true,
      valid
    );

    assert.equal(pharmacyRegionSchema.safeParse(valid).success, true, valid);
  }
});

//===================================================================

test('server rejects non-Latin characters, punctuation and repeated separators', () => {
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
    assert.equal(
      pharmacySettlementSchema.safeParse(invalid).success,
      false,
      invalid
    );

    assert.equal(
      pharmacyRegionSchema.safeParse(invalid).success,
      false,
      invalid
    );
  }
});
