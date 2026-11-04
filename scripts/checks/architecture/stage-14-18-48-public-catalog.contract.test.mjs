import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const root = process.cwd();

//===================================================================

const read = (file) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

const service = read(
  'apps/api/src/services/pharmacies/pharmacy-public-catalog.service.ts'
);

const select = read(
  'packages/ui/src/forms/SearchableSelect/SearchableSelect.tsx'
);

const styles = read(
  'packages/ui/src/forms/SearchableSelect/SearchableSelect.module.css'
);

const pharmacyFilters = read(
  'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
);

//===================================================================

const countSource = service.slice(
  service.indexOf('async function getAvailableProductsCountMap'),
  service.indexOf('function serializePharmacyCardSummary')
);

//===================================================================

test('public availability count avoids querying MongoDB for an empty pharmacy page', () => {
  assert.match(countSource, /pharmacyIds\.length === 0/);
  assert.match(countSource, /availableQuantity:\s*\{\s*\$gt:\s*0\s*\}/);
});

//===================================================================

test('public availability count looks up distinct products before counting by pharmacy', () => {
  const productGroup = countSource.indexOf("_id: '$productId'");
  const productLookup = countSource.indexOf('from: Product.collection.name');
  const pharmacyUnwind = countSource.indexOf("$unwind: '$pharmacyIds'");
  const pharmacyGroup = countSource.indexOf("_id: '$pharmacyIds'");

  assert.ok(productGroup > 0 && productGroup < productLookup);
  assert.ok(productLookup < pharmacyUnwind && pharmacyUnwind < pharmacyGroup);

  assert.match(
    countSource,
    /pharmacyIds:\s*\{\s*\$push:\s*'\$pharmacyId'\s*\}/
  );

  assert.match(countSource, /status:\s*'active'/);
  assert.match(countSource, /\$project:\s*\{\s*_id:\s*1\s*\}/);

  assert.match(
    read('apps/api/src/models/inventory/productOffer.model.ts'),
    /index\(\{\s*productId:\s*1,\s*pharmacyId:\s*1\s*\},\s*\{\s*unique:\s*true\s*\}\)/
  );
});

//===================================================================

test('listing logs query durations without exposing search terms, ids, or account data', () => {
  const listing = service.slice(
    service.indexOf('export async function getPharmaciesService'),
    service.indexOf('export async function getPharmacyDetailsService')
  );

  for (const field of [
    'listReadMs',
    'totalReadMs',
    'availableProductsCountMs',
    'durationMs',
  ]) {
    assert.match(listing, new RegExp(field));
  }

  assert.match(listing, /durationMs >= 1_500/);

  assert.doesNotMatch(
    listing,
    /logger\.info\([\s\S]*?keyword:\s*query\.keyword/
  );
});

//===================================================================

test('pharmacy and location dropdowns opt into existing soft-error UI tokens', () => {
  assert.equal(
    (pharmacyFilters.match(/loadMoreErrorVariant="notice"/g) ?? []).length,
    2
  );

  assert.match(select, /loadMoreErrorVariant === 'notice'/);
  assert.match(select, /<Info\s+size=\{17\}/);
  assert.match(select, /role="alert"/);
  assert.match(styles, /background-color:\s*var\(--color-error-soft\)/);
  assert.match(styles, /color:\s*var\(--color-error\)/);
  assert.match(select, /loadMoreError \? null : \(/);
  assert.match(select, /onClick=\{onLoadMore\}/);
});

//===================================================================

test('public listing continues excluding blocked and unreviewed pharmacy statuses', () => {
  const publicStatuses = read(
    'apps/api/src/services/pharmacies/pharmacy-public-status.ts'
  );

  assert.match(publicStatuses, /PHARMACY_STATUSES\.ACTIVE/);
  assert.match(publicStatuses, /PHARMACY_STATUSES\.ON_MODERATION/);
  assert.doesNotMatch(publicStatuses, /PHARMACY_STATUSES\.BLOCKED/);
  assert.doesNotMatch(publicStatuses, /PHARMACY_STATUSES\.ON_REACTIVATION/);
  assert.match(service, /status:\s*PUBLIC_PHARMACY_STATUS_FILTER/);
});

//===================================================================

test('a timed-out pharmacy catalog displays a retry state instead of a false zero count', () => {
  const state = read(
    'apps/client/src/components/catalog/CatalogResourceState/CatalogResourceState.tsx'
  );

  const page = read(
    'apps/client/src/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  assert.match(state, /unavailableRecoveryHref/);
  assert.match(state, /ProfileResourceState[\s\S]*?variant="error"/);
  assert.match(state, /href=\{unavailableRecoveryHref\}/);

  assert.match(
    page,
    /unavailableRecoveryHref=\{buildPharmacyPath\(filters\)\}/
  );

  assert.match(
    page,
    /catalogUnavailable=\{resourceState\.status === 'unavailable'\}/
  );

  assert.match(pharmacyFilters, /catalogUnavailable \? null : \(/);
});
