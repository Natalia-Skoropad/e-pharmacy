function formatCount(count = 0, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatAvailableProductsCount(count = 0): string {
  return `${formatCount(count, 'product')} available`;
}

export function formatPharmaciesCount(count = 0): string {
  return formatCount(count, 'pharmacy', 'pharmacies');
}

export function formatStoresCount(count = 0): string {
  return formatCount(count, 'store');
}

export function formatProductsCount(count = 0): string {
  return formatCount(count, 'product');
}

export function formatReviewsCount(count = 0): string {
  return formatCount(count, 'review');
}

export function formatOrdersCount(count = 0): string {
  return formatCount(count, 'order');
}

export function formatItemsCount(count = 0): string {
  return formatCount(count, 'item');
}

export function formatVisiblePharmaciesCount(visibleCount = 0, totalCount = 0): string {
  return `Showing ${visibleCount} of ${totalCount} ${totalCount === 1 ? 'pharmacy' : 'pharmacies'}`;
}
