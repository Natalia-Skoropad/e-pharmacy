import { getNumberValue, isRecord } from '../guards';

//=============================================================================

export type NormalizedPaginationResponse<TItem> = Readonly<{
  items: TItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}>;

export type NormalizePaginationOptions<TItem> = Readonly<{
  itemKeys?: readonly string[];
  normalizeItem: (item: unknown) => TItem | null;
  defaultPage?: number;
  defaultPerPage?: number;
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
    defaultPage = 1,
    defaultPerPage = 20,
  }: NormalizePaginationOptions<TItem>
): NormalizedPaginationResponse<TItem> {
  if (!isRecord(payload)) {
    return {
      items: [],
      page: defaultPage,
      perPage: defaultPerPage,
      total: 0,
      totalPages: 0,
    };
  }

  const items = getRawItems(payload, itemKeys).flatMap((item) => {
    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [normalizedItem] : [];
  });
  const page = Math.max(1, getNumberValue(payload.page) ?? defaultPage);
  const perPage = Math.max(
    1,
    getNumberValue(payload.perPage) ?? defaultPerPage
  );
  const total = Math.max(0, getNumberValue(payload.total) ?? items.length);
  const totalPages = Math.max(
    0,
    getNumberValue(payload.totalPages) ?? Math.ceil(total / perPage)
  );

  return {
    items,
    page,
    perPage,
    total,
    totalPages,
  };
}
