// Canonical URL grammar for client detail Orders and Products tables.
// These list controls are not a selected-pharmacy permission boundary.

export type ClientDetailListTab = 'orders' | 'products';

//===================================================================

export type ClientDetailPagination = Readonly<{
  page: number;
  perPage: 20 | 50 | 100;
}>;

export const DEFAULT_CLIENT_DETAIL_PAGINATION: ClientDetailPagination = {
  page: 1,
  perPage: 20,
};

//===================================================================

export function parseClientDetailPaginationSegments(
  segments: readonly string[]
): ClientDetailPagination {
  let page = 1;
  let perPage: 20 | 50 | 100 = 20;

  const seen = new Set<string>();

  for (const segment of segments) {
    const matchPage = /^page-([1-9]\d*)$/.exec(segment);
    const matchSize = /^per-page-(20|50|100)$/.exec(segment);

    if (matchPage && !seen.has('page')) {
      seen.add('page');

      const nextPage = Number(matchPage[1]);

      if (!Number.isSafeInteger(nextPage)) {
        throw new TypeError('Invalid client detail page.');
      }

      page = nextPage;
    } else if (matchSize && !seen.has('perPage')) {
      seen.add('perPage');
      perPage = Number(matchSize[1]) as 20 | 50 | 100;
    } else {
      throw new TypeError(
        'Invalid or duplicate client detail pagination segment.'
      );
    }
  }

  return { page, perPage };
}

//===================================================================

export function buildClientDetailPaginationPath(
  clientId: string,
  tab: ClientDetailListTab,
  pagination: ClientDetailPagination
): string {
  if (!/^[0-9a-f]{24}$/i.test(clientId))
    throw new TypeError('Invalid client ID.');

  const segments = [`/pharmacy/clients/${clientId.toLowerCase()}/${tab}`];

  if (pagination.perPage !== 20) {
    segments.push(`per-page-${pagination.perPage}`);
  }

  if (pagination.page > 1) {
    segments.push(`page-${pagination.page}`);
  }

  return segments.join('/');
}

//===================================================================

export function parseClientDetailPaginationPath(
  pathname: string,
  clientId: string,
  tab: ClientDetailListTab
): ClientDetailPagination {
  const base = `/pharmacy/clients/${clientId}/${tab}`;

  if (pathname === base) return DEFAULT_CLIENT_DETAIL_PAGINATION;
  if (!pathname.startsWith(`${base}/`)) return DEFAULT_CLIENT_DETAIL_PAGINATION;

  return parseClientDetailPaginationSegments(
    pathname.slice(base.length + 1).split('/')
  );
}
