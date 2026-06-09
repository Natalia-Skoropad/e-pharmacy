function formatCount(count = 0, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatAvailableProductsCount(count = 0): string {
  return `${formatCount(count, 'product')} available`;
}

export function formatPharmaciesCount(count = 0): string {
  return formatCount(count, 'pharmacy', 'pharmacies');
}

