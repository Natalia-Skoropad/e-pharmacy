import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from './public-cache-policy';

//===================================================================

test('public cache policy keeps volatile commerce substantially fresher than reviews and dictionaries', () => {
  assert.ok(PUBLIC_CACHE_REVALIDATE_SECONDS.commerce <= 30);

  assert.ok(
    PUBLIC_CACHE_REVALIDATE_SECONDS.commerce <
      PUBLIC_CACHE_REVALIDATE_SECONDS.reviews
  );

  assert.ok(
    PUBLIC_CACHE_REVALIDATE_SECONDS.reviews <
      PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary
  );
});

//===================================================================

test('commerce, review, and dictionary readers select their domain cache presets', async () => {
  const [productCatalog, pharmacyCatalog, productDetail, pharmacyDetail] =
    await Promise.all([
      readFile(
        resolve(process.cwd(), 'src/lib/catalog/product-catalog-server.ts'),
        'utf8'
      ),

      readFile(
        resolve(process.cwd(), 'src/lib/catalog/pharmacies-catalog-server.ts'),
        'utf8'
      ),

      readFile(
        resolve(process.cwd(), 'src/lib/details/server/product-detail-page.ts'),
        'utf8'
      ),

      readFile(
        resolve(
          process.cwd(),
          'src/lib/details/server/pharmacy-detail-page.ts'
        ),
        'utf8'
      ),
    ]);

  assert.match(
    productCatalog,
    /getProducts[\s\S]*PUBLIC_COMMERCE_CACHE_OPTIONS/
  );

  assert.match(
    productCatalog,
    /getProductFilters[\s\S]*PUBLIC_DICTIONARY_CACHE_OPTIONS/
  );

  assert.match(
    pharmacyCatalog,
    /getPharmacies[\s\S]*PUBLIC_COMMERCE_CACHE_OPTIONS/
  );

  // Only selected-location canonicalization needs the dictionary reader.
  // Its bounded request must continue to use the dictionary cache preset.
  assert.match(
    pharmacyCatalog,
    /getPharmacySearchOptions\(\s*\{\s*kind:\s*'location'[\s\S]*?PUBLIC_DICTIONARY_CACHE_OPTIONS/
  );

  // Stage 14.18.50+ reuses the cached commerce listing for selected pharmacy
  // identity and local suggestions. A second "kind: pharmacy" lookup made
  // page metadata wait on the slow search-options endpoint.
  assert.doesNotMatch(
    pharmacyCatalog,
    /getPharmacySearchOptions\(\s*\{\s*kind:\s*'pharmacy'/
  );

  assert.match(pharmacyCatalog, /const readCatalogState = cache\(/);

  assert.match(
    pharmacyCatalog,
    /getSelectedPharmacySeoDetails\([\s\S]*?readCatalogForFilters\(filters\)/
  );

  assert.match(
    pharmacyCatalog,
    /pharmacyOptions:[\s\S]*?pageData\.pharmacies\.map\(/
  );

  // Prevent regressions to eagerly materializing the full dictionaries.
  assert.doesNotMatch(pharmacyCatalog, /\bgetPharmacyFilters\s*\(/);
  assert.doesNotMatch(pharmacyCatalog, /\bgetPharmacyOptions\s*\(/);

  assert.match(productDetail, /PUBLIC_COMMERCE_CACHE_OPTIONS/);
  assert.match(pharmacyDetail, /PUBLIC_COMMERCE_CACHE_OPTIONS/);
});
