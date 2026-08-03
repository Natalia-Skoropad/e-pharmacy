import {
  getProductCategoryLabel,
  isProductCatalogNoIndex,
  type ProductCatalogFilters,
  type ProductCatalogSeoContext,
} from './product-catalog-filters';

//===================================================================

export type ProductCatalogSeoContent = Readonly<{
  intro: string;
  comparison: string;
  ordering: string;
}>;

//===================================================================

export function getProductCatalogTitle(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
) {
  const categoryLabel = getProductCategoryLabel(filters, context.categoryLabel);

  if (filters.category !== 'all' && context.pharmacyName && categoryLabel) {
    return `Choose ${categoryLabel.toLowerCase()} from ${context.pharmacyName}`;
  }

  if (filters.category !== 'all' && categoryLabel) {
    return `Choose trusted ${categoryLabel.toLowerCase()} online`;
  }

  if (context.pharmacyName) {
    return `Choose products from ${context.pharmacyName}`;
  }

  return 'Product catalog';
}

//===================================================================

export function getProductCatalogDescription(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
) {
  const categoryLabel = getProductCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';

  if (filters.category !== 'all' && context.pharmacyName) {
    return `Explore ${categoryText} from ${context.pharmacyName}, compare availability, ratings, and details, then prepare an order request with the selected pharmacy.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and prepare an order request with a selected pharmacy.`;
  }

  if (context.pharmacyName) {
    return `Browse products from ${context.pharmacyName}, compare prices, availability, ratings, and product details before preparing an order request.`;
  }

  return 'Search products by name or article, filter by category and pharmacy, compare ratings and availability, and prepare an order request with a selected pharmacy.';
}

//===================================================================

export function getProductCatalogSeoContent(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
): ProductCatalogSeoContent {
  const categoryLabel = getProductCategoryLabel(filters, context.categoryLabel);

  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';

  const pharmacyText = context.pharmacyName ?? 'active pharmacies';

  return {
    intro: `Browse ${categoryText} available from ${pharmacyText}.`,
    comparison:
      'Compare pharmacy prices, current availability, ratings, and product information before opening a product page.',
    ordering:
      'Use search and filters to narrow the catalog, then choose a pharmacy offer and prepare an order request for pharmacy confirmation.',
  };
}

//===================================================================

export function shouldShowProductCatalogSeoText(
  filters: ProductCatalogFilters
): boolean {
  return !isProductCatalogNoIndex(filters);
}
