import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const readSource = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('no-match remote searches do not retain the All sentinel', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.match(source, /!pharmacySearch\.query\.trim\(\)/);
  assert.match(source, /!locationSearch\.query\.trim\(\)/);
  assert.match(source, /emptyMessage="No pharmacies found"/);
  assert.match(source, /emptyMessage="No locations found"/);
});

//===================================================================

test('pharmacy transitions show per-select loaders for selection and reset', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.equal((source.match(/isLoading=\{isPending\}/g) ?? []).length, 2);
  assert.match(source, /onClick=\{\(\) => navigate\(resetHref\)\}/);
});

//===================================================================

test('deep-linked locations stay selected when remote suggestions are absent', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  // The selected URL value is not required to appear in the first remote page.
  assert.match(source, /const selectedLocationValue = useMemo/);
  assert.match(source, /const selectedLocation = useMemo/);
  assert.match(source, /normalizeLocationKey\(option\.settlement\)/);
  assert.match(source, /settlement: filters\.settlement/);
  assert.match(source, /value: selectedLocationValue/);
  assert.match(source, /selectedFallbackLabel=\{/);
  assert.match(source, /if \(value === selectedLocationValue\) return/);
});
