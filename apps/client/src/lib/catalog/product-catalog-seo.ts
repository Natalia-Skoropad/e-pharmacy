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

/** Keep SEO highlights tied to selected filter values, not arbitrary matches. */
export function getProductCatalogSeoParts(
  text: string,
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
): readonly Readonly<{ text: string; highlighted: boolean }>[] {
  const labels = [
    filters.productId ? context.productName : undefined,
    filters.category !== 'all' ? context.categoryLabel : undefined,
    filters.pharmacyId ? context.pharmacyName : undefined,
  ].filter((label): label is string => Boolean(label?.trim()));

  const terms = [...new Set(labels)].sort((a, b) => b.length - a.length);

  if (!terms.length) return [{ text, highlighted: false }];

  const expression = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );

  const normalized = new Set(terms.map((term) => term.toLocaleLowerCase()));

  return text
    .split(expression)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      highlighted: normalized.has(part.toLocaleLowerCase()),
    }));
}

//===================================================================

export function getProductCatalogTitle(
  filters: ProductCatalogFilters,
  context: ProductCatalogSeoContext = {}
) {
  const categoryLabel = getProductCategoryLabel(filters, context.categoryLabel);

  if (filters.productId && context.productName) {
    const category =
      filters.category !== 'all' && categoryLabel ? ` – ${categoryLabel}` : '';

    return context.pharmacyName
      ? `${context.productName}${category} at ${context.pharmacyName}`
      : `${context.productName}${category} – product catalog`;
  }

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

  if (filters.productId && context.productName) {
    const pharmacyText = context.pharmacyName
      ? ` at ${context.pharmacyName}`
      : '';

    const categoryText =
      filters.category !== 'all' && categoryLabel
        ? ` in ${categoryLabel.toLowerCase()}`
        : '';

    return `Explore ${context.productName}${categoryText}${pharmacyText}, compare prices, ratings and available pharmacy offers.`;
  }

  const categoryText =
    filters.category !== 'all' && categoryLabel
      ? categoryLabel.toLowerCase()
      : 'products';

  if (filters.category !== 'all' && context.pharmacyName) {
    return `Explore ${categoryText} from ${context.pharmacyName}, compare availability, ratings, and details, then prepare an order with the selected pharmacy.`;
  }

  if (filters.category !== 'all') {
    return `Explore ${categoryText}, compare availability in active pharmacies, review ratings and product details, and prepare an order with a selected pharmacy.`;
  }

  if (context.pharmacyName) {
    return `Browse products from ${context.pharmacyName}, compare prices, availability, ratings, and product details before preparing an order.`;
  }

  return 'Search products by name or article, filter by category and pharmacy, compare ratings and availability, and prepare an order with a selected pharmacy.';
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
    intro:
      filters.productId && context.productName
        ? `Explore ${context.productName}${filters.category !== 'all' && categoryLabel ? ` (${categoryLabel})` : ''} and compare offers filtered to ${pharmacyText}.`
        : `Browse ${categoryText} available from ${pharmacyText}.`,

    comparison:
      'Compare pharmacy prices, current availability, ratings, and product information before opening a product page.',

    ordering:
      'Use search and filters to narrow the catalog, then choose a pharmacy offer and prepare an order for pharmacy confirmation.',
  };
}

//===================================================================

export function shouldShowProductCatalogSeoText(
  filters: ProductCatalogFilters
): boolean {
  return Boolean(filters.productId) || !isProductCatalogNoIndex(filters);
}
