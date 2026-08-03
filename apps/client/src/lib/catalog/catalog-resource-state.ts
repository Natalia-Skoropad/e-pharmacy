export type CatalogEmptyReason = 'catalog-empty' | 'no-matches';

//===================================================================

export type CatalogResourceState =
  | Readonly<{ status: 'success' }>
  | Readonly<{ status: 'empty'; reason: CatalogEmptyReason }>
  | Readonly<{ status: 'unavailable' }>;

//===================================================================

export function getCatalogRedirectPage(
  requestedPage: number,
  totalPages: number,
  state: CatalogResourceState
): number | null {
  if (state.status === 'unavailable') return null;
  if (totalPages <= 0 || requestedPage <= totalPages) return null;

  return totalPages;
}
