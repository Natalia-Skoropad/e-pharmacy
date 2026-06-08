const CATALOG_TEXT_MAX_LENGTH = 80;

//===================================================================

export function sanitizeCatalogTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[^A-Za-z0-9 .-]/g, '')
      .slice(0, CATALOG_TEXT_MAX_LENGTH) ?? ''
  );
}

//===================================================================

export function sanitizeCatalogArticleParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(/[^A-Za-z0-9.-]/g, '')
      .slice(0, CATALOG_TEXT_MAX_LENGTH) ?? ''
  );
}

//===================================================================

export function parsePositivePageParam(value?: string): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

//===================================================================

export function slugifyCatalogSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CATALOG_TEXT_MAX_LENGTH);
}
