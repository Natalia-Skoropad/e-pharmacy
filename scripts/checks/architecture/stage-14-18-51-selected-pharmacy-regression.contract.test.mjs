import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const read = (name) => readFileSync(path.join(process.cwd(), name), 'utf8');

//===================================================================

const server = read('apps/client/src/lib/catalog/pharmacies-catalog-server.ts');

const page = read(
  'apps/client/src/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
);

const filters = read(
  'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
);

const options = read(
  'apps/api/src/services/pharmacies/pharmacy-search-options.service.ts'
);

const listing = read(
  'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
);

const diagnostic = read(
  'apps/api/src/scripts/diagnostics/diagnose-pharmacy-reactivation.ts'
);

//===================================================================

// Server-render regression: selected ID used to require two separate API
// reads, one of which failed at 6 seconds for the activated pharmacy.
test('selected title, combobox and SEO derive from the actual public listing, not a second search-options call', () => {
  assert.match(server, /pageData\.pharmacies\.map\(/);
  assert.match(server, /return \{ \.\.\.pageData, pharmacyOptions \}/);
  assert.match(server, /const state = await readCatalogForFilters\(filters\)/);
  assert.doesNotMatch(server, /selectedId: parsedFilters\.pharmacyId/);
  assert.doesNotMatch(server, /selectedId: pharmacyId/);

  assert.match(
    page,
    /pharmacies\.find\(\(item\) => item\.id === filters\.pharmacyId\)\?\.name/
  );

  assert.match(filters, /const localPharmacyMatches = useMemo/);

  assert.match(
    filters,
    /pharmacySearch\.isOptionsLoading && localPharmacyMatches\.length === 0/
  );

  for (const route of [
    'apps/client/src/app/(public)/(pharmacies)/pharmacies/page.tsx',
    'apps/client/src/app/(public)/(pharmacies)/pharmacies/[...segments]/page.tsx',
  ]) {
    assert.match(read(route), /getSelectedPharmacySeoName\(filters\)/);
  }
});

//===================================================================

test('location canonicalization no longer launches a second catalogue query', () => {
  assert.match(
    server,
    /const \{ filters, filterState \} =\s*await resolvePharmaciesCatalogFilters/
  );

  assert.match(
    server,
    /const pharmaciesState = await readCatalogForFilters\(filters\)/
  );

  assert.doesNotMatch(
    server,
    /initialPharmaciesState|const changed\s*=|pharmaciesState = changed/
  );
});

//===================================================================

test('metadata and page can reuse the same exact public catalog read within the render', () => {
  assert.match(server, /import \{ cache \} from 'react'/);
  assert.match(server, /const readCatalogState = cache\(/);
  assert.match(server, /JSON\.stringify\(buildPharmacyApiParams\(filters\)\)/);
  assert.match(server, /PUBLIC_COMMERCE_CACHE_OPTIONS/);
});

//===================================================================

test('API selectedId uses indexed one-record path; general search and location filters retain contracts', () => {
  assert.match(options, /if \(selectedId\) \{[\s\S]*?Pharmacy\.aggregate/);
  assert.match(options, /\.hint\(\{ _id: 1 \}\)/);
  assert.match(options, /total: items\.length/);
  assert.match(options, /Pharmacy\.countDocuments\(filter\)/);
  assert.match(options, /createFlexibleSearchRegExp\(search\)/);
  assert.match(options, /const \[result\] = await Pharmacy\.aggregate/);

  assert.match(
    listing,
    /filter\._id = new Types\.ObjectId\(query\.pharmacyId\)/
  );

  assert.match(listing, /if \(!query\.pharmacyId\) pipeline\.push/);
  assert.match(listing, /status: PUBLIC_PHARMACY_STATUS_FILTER/);
});

//===================================================================

test('read-only diagnostic checks the selected option without leaking patient or owner data', () => {
  assert.match(diagnostic, /mode === 'option'/);
  assert.match(diagnostic, /perPage: 1,[\s\S]*?selectedId: pharmacyId/);
  assert.match(diagnostic, /autoIndex: false/);
  assert.doesNotMatch(diagnostic, /\.updateOne\(|\.deleteMany\(|\.create\(/);
});
