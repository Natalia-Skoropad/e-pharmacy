export function getProductListTotalPages(
  totalItems: number,
  rowsPerPage: number
): number {
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / rowsPerPage));
}

//===================================================================

export function clampProductListPage(
  currentPage: number,
  totalItems: number,
  rowsPerPage: number
): number {
  return Math.min(
    Math.max(1, currentPage),
    getProductListTotalPages(totalItems, rowsPerPage)
  );
}
