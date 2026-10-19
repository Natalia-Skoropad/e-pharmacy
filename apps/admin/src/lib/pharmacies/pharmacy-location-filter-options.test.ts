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

test('region remains selectable when a settlement is chosen (region-first workflow)', () => {
  const result = getPharmacyLocationFilterOptions(pharmacies, 'Lviv', '');

  assert.deepEqual(result.regions, ['Dnipropetrovsk', 'Lviv']);
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

//===================================================================

test('preserves region choices and selection when the settlement is selected', () => {
  const result = getPharmacyLocationFilterOptions(
    pharmacies,
    'Lviv',
    'Dnipropetrovsk'
  );

  assert.deepEqual(result.regions, ['Dnipropetrovsk', 'Lviv']);
});
