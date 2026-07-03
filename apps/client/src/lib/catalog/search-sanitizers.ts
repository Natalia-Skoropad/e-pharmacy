import {
  sanitizeArticleParam,
  sanitizeSearchText,
  sanitizeTextParam,
} from '@e-pharmacy/validation';

//===================================================================

export function sanitizeCatalogTextSearch(value: string): string {
  return sanitizeTextParam(sanitizeSearchText(value));
}

export function sanitizeCatalogArticleSearch(value: string): string {
  return sanitizeArticleParam(sanitizeSearchText(value));
}

//===================================================================

export function normalizeCatalogSearchValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,'’/#-]+/g, ' ')
    .replace(/\s+/g, ' ');
}
