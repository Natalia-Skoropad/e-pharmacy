export function formatAvailableProductsCount(count = 0): string {
  return `${count} ${count === 1 ? 'product' : 'products'} available`;
}

export function formatPharmaciesCount(count = 0): string {
  return `${count} ${count === 1 ? 'pharmacy' : 'pharmacies'}`;
}

export function formatReviewsCount(count = 0): string {
  return count === 1 ? '1 review' : `${count} reviews`;
}
