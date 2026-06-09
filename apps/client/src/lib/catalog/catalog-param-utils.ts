import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation';

const CATALOG_URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .-]/g;
const CATALOG_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9.-]/g;
const CATALOG_SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9]+/g;

//===================================================================

export function sanitizeCatalogTextParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(CATALOG_URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
  );
}

//===================================================================

export function sanitizeCatalogArticleParam(value?: string): string {
  return (
    value
      ?.trim()
      .replace(CATALOG_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN, '')
      .slice(0, USER_SEARCH_MAX_LENGTH) ?? ''
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
    .replace(CATALOG_SLUG_SEGMENT_SEPARATOR_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USER_SEARCH_MAX_LENGTH);
}
