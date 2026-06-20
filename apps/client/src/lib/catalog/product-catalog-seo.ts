import {
  getProductCategoryLabel,
  isProductCatalogNoIndex,
  type ProductCatalogFilters,
  type ProductCatalogSeoContext,
} from './product-catalog-filters';

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
    return `Explore ${categoryText} from ${context.pharmacyName}, compare availability, ratings, and details, then choose the right online pharmacy offer with confidence.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and choose a trusted online pharmacy offer.`;
  }

  if (context.pharmacyName) {
    return `Browse products from ${context.pharmacyName}, compare prices, availability, ratings, and product details before choosing a trusted online pharmacy offer.`;
  }

  return 'Search products by name or article, filter products by category and pharmacy, compare ratings and availability, and choose trusted online pharmacy offers.';
}

//===================================================================

export function getProductCatalogSeoTextParts(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
): string[] {
  const categoryLabel = getProductCategoryLabel(filters, context.categoryLabel);
  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';
  const pharmacyText = context.pharmacyName ?? 'active online pharmacies';

  return [
    'Find the right',
    categoryText,
    'without opening a dozen tabs. In the E-PHARMACY catalog, you can compare products from',
    pharmacyText,
    'check availability, review ratings, and move to the product details when something looks promising. Use the filters to narrow the list by category or pharmacy, search by name or article, and choose the offer that fits your needs faster. Calm, clear, and pharmacy-shopping friendly — almost like a tiny assistant in a white coat. Perfect for quick comparison before adding products to your cart.',
  ];
}

//===================================================================

export function shouldShowProductCatalogSeoText(
  filters: ProductCatalogFilters
): boolean {
  return !isProductCatalogNoIndex(filters);
}
