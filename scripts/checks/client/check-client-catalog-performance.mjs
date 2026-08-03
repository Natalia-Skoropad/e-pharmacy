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
  productTypes,
  pharmacyTypes,
  productSummary,
  pharmacySummary,
  productService,
  productController,
  productCard,
  homePage,
  profilePage,
  continueShopping,
  parserTests,
  catalogConfig,
] = await Promise.all([
  read('packages/types/src/products/responses.ts'),
  read('packages/types/src/pharmacies/responses.ts'),
  read('packages/types/src/products/product-card-summary.ts'),
  read('packages/types/src/pharmacies/pharmacy-card-summary.ts'),
  read('apps/api/src/services/product.service.ts'),
  read('apps/api/src/controllers/product.controller.ts'),

  read(
    'apps/client/src/components/product-catalog/ProductCard/ProductCard.tsx'
  ),

  read('apps/client/src/app/page.tsx'),

  read(
    'apps/client/src/components/profile/ProfilePageContent/ProfilePageContent.tsx'
  ),

  read(
    'apps/client/src/components/cart/ContinueShoppingModal/ContinueShoppingModal.tsx'
  ),

  read('packages/api-client/src/response/shared-dto-parsers.test.ts'),
  read('apps/client/src/lib/catalog/catalog-config.ts'),
]);

//===================================================================

requirePattern(
  productTypes,
  /ApiPaginationResponse<ProductCardSummary>/,
  'ProductsResponse must paginate ProductCardSummary.'
);

forbidPattern(
  productSummary,
  /\boffers\b/,
  'ProductCardSummary must not expose product offers.'
);

forbidPattern(
  productCard,
  /product\.offers|offers\s*\./,
  'ProductCard must not derive presentation from full offers.'
);

for (const [label, source] of [
  ['home preview', homePage],
  ['favorite products', profilePage],
  ['continue-shopping modal', continueShopping],
]) {
  requirePattern(
    source,
    /ProductCardSummary/,
    `${label} must use ProductCardSummary.`
  );
}

requirePattern(
  productService,
  /getOfferSummaryByProductIds/,
  'Product catalog aggregates must be computed in the backend service.'
);

requirePattern(
  productService,
  /serializeProductCardSummary/,
  'Product catalog must use the compact backend serializer.'
);

requirePattern(
  productController,
  /includeOffers:\s*(?:isPharmacy|canManageProducts|hasPharmacyRole|[^\n]*PHARMACY)/i,
  'Full offers must be explicitly limited to pharmacy-management requests.'
);

requirePattern(
  pharmacyTypes,
  /ApiPaginationResponse<PharmacyCardSummary>/,
  'PharmaciesResponse must paginate PharmacyCardSummary.'
);

for (const forbidden of [
  'email',
  'workingHours',
  'description',
  'updatedAt',
  'bankTransferAvailable',
  'bankDetails',
]) {
  if (new RegExp(`\\b${forbidden}\\b`).test(pharmacySummary)) {
    violations.push(
      `PharmacyCardSummary must not expose detail-only field ${forbidden}.`
    );
  }
}

requirePattern(
  parserTests,
  /Array\.from\(\{ length: 25 \}/,
  'Catalog response parser tests must include a 25-offer regression fixture.'
);

requirePattern(
  catalogConfig,
  /CATALOG_REMOTE_PHARMACY_SEARCH_THRESHOLD\s*=\s*250/,
  'Catalog must document the local pharmacy-option scalability threshold.'
);

requirePattern(
  parserTests,
  /bankDetails/,
  'Pharmacy summary parser tests must reject bank details.'
);

const productBudgetFixture = {
  id: '507f1f77bcf86cd799439011',
  name: 'Representative product name',
  publicSlugId: 'representative-product-pr507f1f77bcf86cd799439011',
  article: 'ART-0001',
  category: 'medicine',
  status: 'active',
  price: 125.5,
  minPrice: 120,
  maxPrice: 140,
  imageUrl: 'https://example.test/products/representative-product.webp',
  manufacturer: 'Representative manufacturer',
  foundInPharmaciesCount: 25,
  availableInPharmaciesCount: 25,
  inStock: true,
  rating: 4.8,
  reviewsCount: 128,
  isFavorite: false,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-02T10:00:00.000Z',
};

const pharmacyBudgetFixture = {
  id: '507f1f77bcf86cd799439012',
  name: 'Representative pharmacy',
  publicSlugId: 'representative-pharmacy-ph507f1f77bcf86cd799439012',
  address: '1 Representative Street',
  city: 'Kyiv',
  phone: '+380441234567',
  rating: 4.9,
  imageUrl: 'https://example.test/pharmacies/representative-pharmacy.webp',
  availableProductsCount: 240,
  reviewsCount: 87,
  isFavorite: false,
};

const productBytes = Buffer.byteLength(JSON.stringify(productBudgetFixture));
const pharmacyBytes = Buffer.byteLength(JSON.stringify(pharmacyBudgetFixture));

if (productBytes > 1_200) {
  violations.push(
    `ProductCardSummary representative payload exceeds 1200 bytes (${productBytes}).`
  );
}

if (pharmacyBytes > 900) {
  violations.push(
    `PharmacyCardSummary representative payload exceeds 900 bytes (${pharmacyBytes}).`
  );
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Client catalog performance check passed (product ${productBytes} B, pharmacy ${pharmacyBytes} B).`
);
