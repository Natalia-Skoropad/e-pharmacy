import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterLocationOptionsByPharmacy,
  filterPharmacyOptionsByLocation,
} from './pharmacies-filter-relationships';

//===================================================================

const pharmacies = [
  { id: '1', name: 'Dnipro 1', location: { settlement: 'Dnipro' } },
  { id: '2', name: 'Dnipro 2', location: { settlement: 'dnipro ' } },
  { id: '3', name: 'Lviv', location: { settlement: 'Lviv' } },
  {
    id: '4',
    name: 'Other region',
    location: { settlement: 'Dnipro', region: 'Other' },
  },
  { id: '5', name: 'No location' },
] as const;

const locations = [
  { settlement: 'Dnipro', label: 'Dnipro' },
  { settlement: 'Lviv', label: 'Lviv' },
  { settlement: 'Dnipro', region: 'Other', label: 'Dnipro (Other)' },
] as const;

//===================================================================

test('location selection narrows the pharmacy options without duplicate city items', () => {
  assert.deepEqual(
    filterPharmacyOptionsByLocation(pharmacies, 'Dnipro', '').map(
      (pharmacy) => pharmacy.id
    ),
    ['1', '2']
  );

  assert.deepEqual(
    filterPharmacyOptionsByLocation(pharmacies, 'Dnipro', 'Other').map(
      (pharmacy) => pharmacy.id
    ),
    ['4']
  );

  assert.equal(filterPharmacyOptionsByLocation(pharmacies, '', ''), pharmacies);
});

//===================================================================

test('pharmacy selection narrows the locations and retains a selected conflicting URL', () => {
  assert.deepEqual(
    filterLocationOptionsByPharmacy(locations, pharmacies[0], '', '').map(
      (location) => location.label
    ),
    ['Dnipro']
  );

  assert.deepEqual(
    filterLocationOptionsByPharmacy(locations, pharmacies[0], 'Lviv', '').map(
      (location) => location.label
    ),
    ['Dnipro', 'Lviv']
  );

  assert.equal(
    filterLocationOptionsByPharmacy(locations, pharmacies[4], '', ''),
    locations
  );
});

//===================================================================

test('an explicitly selected pharmacy remains available if its URL conflicts with location', () => {
  assert.deepEqual(
    filterPharmacyOptionsByLocation(pharmacies, 'Dnipro', '', '3').map(
      (pharmacy) => pharmacy.id
    ),
    ['1', '2', '3']
  );
});
