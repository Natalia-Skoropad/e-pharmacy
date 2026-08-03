import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const read = (path) => readFile(resolve(ROOT, path), 'utf8');
const violations = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) violations.push(message);
};

const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) violations.push(message);
};

const requiredPaths = [
  'apps/client/src/components/catalog/CatalogEntityCard/CatalogEntityCard.tsx',
  'apps/client/src/components/catalog/CatalogFiltersShell/CatalogFiltersShell.tsx',
  'apps/client/src/components/catalog/CatalogGrid/CatalogGrid.tsx',
  'apps/client/src/components/catalog/CatalogPageShell/CatalogPageShell.tsx',
  'apps/client/src/components/catalog/CatalogResourceState/CatalogResourceState.tsx',
  'apps/client/src/components/product-catalog/ProductCard/ProductCard.tsx',
  'apps/client/src/components/pharmacies/PharmacyCard/PharmacyCard.tsx',
  'apps/client/src/components/product-catalog/server/ProductDetailPage.tsx',
  'apps/client/src/components/pharmacies/server/PharmacyDetailPage.tsx',
  'apps/client/src/components/catalog/catalog-foundation.react.test.tsx',
  'apps/client/src/components/catalog/catalog-resource-state.react.test.tsx',
  'apps/client/src/lib/catalog/catalog-search-scheduler.test.ts',
  'apps/client/src/components/detail-components-contracts.test.ts',
  'apps/client/src/components/detail-panels.react.test.tsx',
  'apps/client/src/components/product-catalog/ProductDetailsPageContent/product-offer-card.react.test.tsx',
  'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/pharmacy-contact-panel.react.test.tsx',
  'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/pharmacy-bank-details-state.test.ts',
  'packages/ui/src/navigation/Tabs/Tabs.test.tsx',
];

for (const path of requiredPaths) {
  try {
    await access(resolve(ROOT, path));
  } catch {
    violations.push(`${path}: required catalog component is missing.`);
  }
}

const [
  cardFoundation,
  productCard,
  pharmacyCard,
  productPage,
  pharmacyPage,
  productFilters,
  pharmacyFilters,
  productDetails,
  pharmacyDetails,
  productServer,
  pharmacyServer,
  productApi,
  pharmacyApi,
] = await Promise.all([
  read(
    'apps/client/src/components/catalog/CatalogEntityCard/CatalogEntityCard.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductCard/ProductCard.tsx'
  ),

  read('apps/client/src/components/pharmacies/PharmacyCard/PharmacyCard.tsx'),

  read(
    'apps/client/src/components/product-catalog/ProductCatalogPageContent/ProductCatalogPageContent.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductCatalogFiltersForm/ProductCatalogFiltersForm.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  ),
  read(
    'apps/client/src/components/product-catalog/server/ProductDetailPage.tsx'
  ),

  read('apps/client/src/components/pharmacies/server/PharmacyDetailPage.tsx'),
  read('apps/client/src/components/product-catalog/index.ts'),
  read('apps/client/src/components/pharmacies/index.ts'),
]);

forbidPattern(
  cardFoundation,
  /\b(?:isProduct|isPharmacy|showArticle|showAddress|showPhone|showOffers)\b/,
  'CatalogEntityCard must remain presentation-only and domain-neutral.'
);

requirePattern(
  productCard,
  /CatalogEntityCard/,
  'ProductCard must compose the application-local card foundation.'
);

requirePattern(
  pharmacyCard,
  /CatalogEntityCard/,
  'PharmacyCard must compose the application-local card foundation.'
);

for (const [label, source] of [
  ['ProductCatalogPageContent', productPage],
  ['PharmaciesPageContent', pharmacyPage],
]) {
  requirePattern(
    source,
    /CatalogPageShell/,
    `${label} must use CatalogPageShell.`
  );

  requirePattern(
    source,
    /CatalogResourceState/,
    `${label} must use CatalogResourceState.`
  );
}

for (const [label, source] of [
  ['ProductCatalogFiltersForm', productFilters],
  ['PharmaciesCatalogFiltersForm', pharmacyFilters],
]) {
  requirePattern(
    source,
    /CatalogFiltersShell/,
    `${label} must use CatalogFiltersShell.`
  );

  requirePattern(
    source,
    /useCatalogSearchDraft/,
    `${label} must use the shared catalog search lifecycle.`
  );

  requirePattern(
    source,
    /useCatalogNavigation/,
    `${label} must use the shared pending-navigation lifecycle.`
  );
}

if (productDetails.split(/\r?\n/).length > 220) {
  violations.push(
    'ProductDetailsPageContent exceeds the 220-line coordinator budget.'
  );
}

if (pharmacyDetails.split(/\r?\n/).length > 220) {
  violations.push(
    'PharmacyDetailsPageContent exceeds the 220-line coordinator budget.'
  );
}

for (const [label, source] of [
  ['ProductDetailPage', productServer],
  ['PharmacyDetailPage', pharmacyServer],
]) {
  requirePattern(
    source,
    /import ['"]server-only['"];/,
    `${label} must remain server-only.`
  );

  forbidPattern(
    source,
    /from ['"]@\/components\/(?:product-catalog|pharmacies)['"];/,
    `${label} must import its client detail component through a leaf path.`
  );
}

const expectedProductExports = ['ProductCatalogPageContent', 'ProductCard'];
const expectedPharmacyExports = ['PharmacyCard', 'PharmaciesPageContent'];

for (const [label, source, expected] of [
  ['product-catalog', productApi, expectedProductExports],
  ['pharmacies', pharmacyApi, expectedPharmacyExports],
]) {
  const exports = [...source.matchAll(/export \{ default as (\w+) \}/g)].map(
    (match) => match[1]
  );

  if (JSON.stringify(exports.sort()) !== JSON.stringify([...expected].sort())) {
    violations.push(
      `${label} root public API must expose only ${expected.join(', ')}.`
    );
  }
}

for (const path of [
  'apps/client/src/components/product-catalog/ProductCard/index.ts',
  'apps/client/src/components/product-catalog/ProductsList/index.ts',
  'apps/client/src/components/product-catalog/ProductCatalogFiltersForm/index.ts',
  'apps/client/src/components/product-catalog/ProductCatalogPageContent/index.ts',
  'apps/client/src/components/product-catalog/ProductDetailsPageContent/index.ts',
  'apps/client/src/components/pharmacies/PharmacyCard/index.ts',
  'apps/client/src/components/pharmacies/PharmaciesList/index.ts',
  'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/index.ts',
  'apps/client/src/components/pharmacies/PharmaciesPageContent/index.ts',
  'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/index.ts',
]) {
  try {
    await access(resolve(ROOT, path));
    violations.push(`${path}: nested no-op barrel must be removed.`);
  } catch {
    // Expected.
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  'Client catalog component check passed (foundation, ownership, server boundaries, size budgets and public APIs).'
);
