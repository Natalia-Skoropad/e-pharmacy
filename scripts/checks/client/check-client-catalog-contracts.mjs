import { readFile } from 'node:fs/promises';
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

const [
  productSummary,
  pharmacySummary,
  productResponses,
  pharmacyResponses,
  resourceState,
  productCard,
  pharmacyCard,
  productFilters,
  pharmacyFilters,
  offerList,
  bankPanel,
  bankState,
  productServer,
  pharmacyServer,
  parser,
] = await Promise.all([
  read('packages/types/src/products/product-card-summary.ts'),
  read('packages/types/src/pharmacies/pharmacy-card-summary.ts'),
  read('packages/types/src/products/responses.ts'),
  read('packages/types/src/pharmacies/responses.ts'),
  read('apps/client/src/lib/catalog/catalog-resource-state.ts'),

  read(
    'apps/client/src/components/product-catalog/ProductCard/ProductCard.tsx'
  ),

  read('apps/client/src/components/pharmacies/PharmacyCard/PharmacyCard.tsx'),

  read(
    'apps/client/src/components/product-catalog/ProductCatalogFiltersForm/ProductCatalogFiltersForm.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx'
  ),

  read(
    'apps/client/src/components/product-catalog/ProductDetailsPageContent/ProductOfferList.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
  ),

  read(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/pharmacy-bank-details-state.ts'
  ),

  read(
    'apps/client/src/components/product-catalog/server/ProductDetailPage.tsx'
  ),

  read('apps/client/src/components/pharmacies/server/PharmacyDetailPage.tsx'),
  read('packages/api-client/src/response/shared-dto-parsers.ts'),
]);

forbidPattern(
  productSummary,
  /\boffers\b/,
  'ProductCardSummary must not expose offers.'
);

requirePattern(
  productResponses,
  /ApiPaginationResponse<ProductCardSummary>/,
  'ProductsResponse must use ProductCardSummary.'
);

requirePattern(
  productResponses,
  /ApiPaginationResponse<ProductDetails>/,
  'The explicit details/management response must retain ProductDetails.'
);

for (const field of [
  'email',
  'workingHours',
  'description',
  'updatedAt',
  'bankTransferAvailable',
  'bankDetails',
]) {
  if (new RegExp(`\\b${field}\\b`).test(pharmacySummary)) {
    violations.push(`PharmacyCardSummary must not expose ${field}.`);
  }
}

requirePattern(
  pharmacyResponses,
  /ApiPaginationResponse<PharmacyCardSummary>/,
  'PharmaciesResponse must use PharmacyCardSummary.'
);

forbidPattern(
  productCard,
  /product\.offers/,
  'ProductCard must not inspect details offers.'
);

forbidPattern(
  pharmacyCard,
  /pharmacy\.(?:email|workingHours|description|bankDetails)/,
  'PharmacyCard must not depend on detail-only fields.'
);

for (const status of ['success', 'empty', 'unavailable']) {
  requirePattern(
    resourceState,
    new RegExp(`status: '${status}'`),
    `CatalogResourceState is missing ${status}.`
  );
}

requirePattern(
  resourceState,
  /'catalog-empty' \| 'no-matches'/,
  'CatalogResourceState must preserve contextual empty reasons.'
);

forbidPattern(
  productFilters,
  /type\s+\w+\s*=\s*'all'\s*\|\s*string/,
  'Product filters must not use pseudo-safe all|string types.'
);

forbidPattern(
  pharmacyFilters,
  /type\s+\w+\s*=\s*'all'\s*\|\s*string/,
  'Pharmacy filters must not use pseudo-safe all|string types.'
);

requirePattern(
  offerList,
  /key=\{offer\.id\}/,
  'Product offers must use offer.id as React key.'
);

forbidPattern(
  offerList,
  /key=\{offer\.pharmacyId\}/,
  'Product offers must not use pharmacyId as React key.'
);

requirePattern(
  bankPanel,
  /state\.data\.receiptEmail/,
  'Receipt email must come from bank details.'
);

forbidPattern(
  bankPanel,
  /pharmacy\.email/,
  'Bank-details panel must not use public contact email as receipt email.'
);

for (const status of ['idle', 'loading', 'success', 'empty', 'error']) {
  requirePattern(
    bankState,
    new RegExp(`status: '${status}'`),
    `Bank-details state is missing ${status}.`
  );
}

for (const [label, source, fallback] of [
  [
    'ProductDetailPage',
    productServer,
    /reviewsData\?\.total \?\? product\.reviewsCount/,
  ],
  [
    'PharmacyDetailPage',
    pharmacyServer,
    /reviewsData\?\.total \?\? pharmacy\.reviewsCount/,
  ],
]) {
  requirePattern(
    source,
    fallback,
    `${label} must retain the known aggregate review count.`
  );

  forbidPattern(
    source,
    /reviews=\{\[\.\.\./,
    `${label} must pass readonly reviews without a mutable copy.`
  );
}

for (const invariant of [
  /availableQuantity > totalQuantity/,
  /reservedQuantity > totalQuantity/,
  /availableQuantity \+ reservedQuantity > totalQuantity/,
  /record\.inStock !== expectedInStock/,
]) {
  requirePattern(
    parser,
    invariant,
    `Product-offer parser is missing invariant ${invariant}.`
  );
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  'Client catalog contract check passed (summary DTOs, resource states, filters, offers, bank details and review totals).'
);
