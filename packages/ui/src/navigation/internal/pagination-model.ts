export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

//===================================================================

const SIBLING_COUNT = 1;

//===================================================================

export function normalizePaginationState(
  currentPage: number,
  totalPages: number
): { currentPage: number; totalPages: number } | null {
  if (!Number.isInteger(totalPages) || totalPages < 1) return null;

  const normalizedCurrentPage = Number.isInteger(currentPage)
    ? Math.min(Math.max(currentPage, 1), totalPages)
    : 1;

  return { currentPage: normalizedCurrentPage, totalPages };
}

//===================================================================

export function getPaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 2);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages - 1);

  if (leftSibling > 2) items.push('ellipsis-left');

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    items.push(page);
  }

  if (rightSibling < totalPages - 1) items.push('ellipsis-right');
  items.push(totalPages);

  return items;
}
