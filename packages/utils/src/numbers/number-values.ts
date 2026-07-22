export function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

//===================================================================

export function normalizeCount(value: number): number | null {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

//===================================================================

export function formatCountLabel(
  count: number,
  singular: string,
  plural = `${singular}s`
): string | null {
  const normalizedCount = normalizeCount(count);
  if (normalizedCount === null) return null;

  return `${normalizedCount} ${normalizedCount === 1 ? singular : plural}`;
}

//===================================================================

export function formatAvailableProductsCount(count: number): string | null {
  const label = formatCountLabel(count, 'product');
  return label ? `${label} available` : null;
}

//===================================================================

export function formatPharmaciesCount(count: number): string | null {
  return formatCountLabel(count, 'pharmacy', 'pharmacies');
}

//===================================================================

export function formatStockLabel(stockQuantity: number): string | null {
  const label = formatCountLabel(stockQuantity, 'item');
  return label ? `${label} available in this pharmacy` : null;
}
