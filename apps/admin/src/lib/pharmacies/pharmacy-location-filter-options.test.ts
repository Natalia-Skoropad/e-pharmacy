import assert from 'node:assert/strict';
import test from 'node:test';

import { getPharmacyLocationFilterOptions } from './pharmacy-location-filter-options';

//===================================================================

const pharmacies = [
  { location: { settlement: 'Dnipro', region: 'Dnipropetrovsk' } },
  { location: { settlement: 'Kryvyi Rih', region: 'Dnipropetrovsk' } },
  { location: { settlement: 'Lviv', region: 'Lviv' } },
  { location: { settlement: 'Dnipro', region: 'Dnipropetrovsk' } },
] as const;

//===================================================================

test('settlements are restricted by chosen region and have no duplicates', () => {
  const result = getPharmacyLocationFilterOptions(
    pharmacies,
    '',
    'Dnipropetrovsk'
  );

  assert.deepEqual(result.settlements, ['Dnipro', 'Kryvyi Rih']);
});

//===================================================================

test('regions are restricted by chosen settlement', () => {
  const result = getPharmacyLocationFilterOptions(pharmacies, 'Lviv', '');

  assert.deepEqual(result.regions, ['Lviv']);
});

//===================================================================

test('preserves selected values while table rows are loading', () => {
  const result = getPharmacyLocationFilterOptions(
    [],
    'Dnipro',
    'Dnipropetrovsk'
  );

  assert.deepEqual(result.settlements, ['Dnipro']);
  assert.deepEqual(result.regions, ['Dnipropetrovsk']);
});
