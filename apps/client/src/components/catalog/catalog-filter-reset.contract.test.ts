import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readSource(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('pharmacy reset clears name, address, city and sorting together', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.match(
    source,
    /createPharmaciesResetFiltersHref[\s\S]*?name:\s*''[\s\S]*?address:\s*''[\s\S]*?city:\s*''[\s\S]*?sort:\s*'newest'/
  );

  assert.match(source, /resetDraft\(\{ name: '', address: '' \}\)/);
});

//===================================================================

test('product reset clears every catalog filter together', async () => {
  const source = await readSource(
    '../product-catalog/ProductCatalogFiltersForm/ProductCatalogFiltersForm.tsx'
  );

  assert.match(
    source,
    /createProductsResetFiltersHref[\s\S]*?name:\s*''[\s\S]*?article:\s*''[\s\S]*?category:\s*'all'[\s\S]*?availability:\s*'all'[\s\S]*?pharmacyId:\s*undefined[\s\S]*?sort:\s*'newest'/
  );

  assert.match(source, /resetDraft\(\{ name: '', article: '' \}\)/);
});
