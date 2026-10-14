import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPharmacyApiParams,
  buildPharmacyPath,
  getPharmacyActiveFiltersCount,
  isPharmacyNoIndex,
  parsePharmacySegments,
  parsePharmacySearchParams,
} from './pharmacies-catalog';

//===================================================================

const id = '507f1f77bcf86cd799439011';

//===================================================================

test('selected pharmacy has canonical catalog URL and exact API filter', () => {
  const filters = parsePharmacySearchParams({ pharmacyId: id });
  assert.equal(buildPharmacyPath(filters), `/pharmacies/pharmacy-id-${id}`);
  assert.equal(buildPharmacyApiParams(filters).pharmacyId, id);
  assert.equal(getPharmacyActiveFiltersCount(filters), 1);
  assert.equal(isPharmacyNoIndex(filters), true);

  assert.equal(
    parsePharmacySegments({ segments: [`pharmacy-id-${id}`] }).filters
      .pharmacyId,
    id
  );
});

//===================================================================

test('invalid pharmacy id is ignored in query and marked malformed in routes', () => {
  assert.equal(
    parsePharmacySearchParams({ pharmacyId: 'anything' }).pharmacyId,
    ''
  );

  const parsed = parsePharmacySegments({ segments: ['pharmacy-id-wrong'] });

  assert.equal(parsed.isCanonical, false);
  assert.equal(parsed.issues[0]?.code, 'malformed');
});
