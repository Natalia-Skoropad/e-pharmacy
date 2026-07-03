import { getNumberValue, isRecord } from '../guards';

//=============================================================================

export type NormalizedPaginationResponse<TItem> = Readonly<{
  items: TItem[];
  total: number;
}>;

export type NormalizePaginationOptions<TItem> = Readonly<{
  itemKeys?: readonly string[];
  normalizeItem: (item: unknown) => TItem | null;
}>;

//=============================================================================

function getRawItems(
  payload: Record<string, unknown>,
  itemKeys: readonly string[]
): unknown[] {
  for (const key of itemKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

//=============================================================================

export function normalizePaginatedResponse<TItem>(
  payload: unknown,
  {
    itemKeys = ['items'],
    normalizeItem,
  }: NormalizePaginationOptions<TItem>
): NormalizedPaginationResponse<TItem> {
  if (!isRecord(payload)) return { items: [], total: 0 };

  const items = getRawItems(payload, itemKeys).flatMap((item) => {
    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [normalizedItem] : [];
  });

  return {
    items,
    total: getNumberValue(payload.total) ?? items.length,
  };
}
