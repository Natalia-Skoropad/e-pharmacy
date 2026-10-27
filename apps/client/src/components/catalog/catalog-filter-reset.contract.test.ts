import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readSource(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('pharmacy reset clears the selected pharmacy, location and sorting together', async () => {
  const source = await readSource(
    '../pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  );

  assert.match(
    source,
    /createPharmaciesResetFiltersHref[\s\S]*?name:\s*''[\s\S]*?address:\s*''[\s\S]*?pharmacyId:\s*''[\s\S]*?settlement:\s*''[\s\S]*?region:\s*''[\s\S]*?sort:\s*'newest'/
  );

  assert.match(source, /hasActiveFilters \? \(\s*<ResetFiltersButton/);
  assert.match(source, /onClick=\{\(\) => navigate\(resetHref\)\}/);
  assert.doesNotMatch(source, /<FilterDrawer/);
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

//===================================================================

test('pharmacy loading shows two 48px controls, and reset matches their height', async () => {
  const [loading, loadingStyles, shellStyles] = await Promise.all([
    readSource('./CatalogPageLoading/CatalogPageLoading.tsx'),
    readSource('./CatalogPageLoading/CatalogPageLoading.module.css'),
    readSource('./CatalogFiltersShell/CatalogFiltersShell.module.css'),
  ]);

  assert.match(loading, /filterCount = variant === 'product' \? 5 : 2/);
  assert.match(loading, /css\.filtersPharmacy/);

  assert.match(
    loadingStyles,
    /\.filtersPharmacy \.filterControl \{\s*height: 48px;/
  );

  assert.match(
    loadingStyles,
    /\.filtersPharmacy \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/
  );

  assert.match(
    shellStyles,
    /\.pharmacyLayout \.desktopResetSlot > \* \{[^}]*height: 48px;/
  );
});
