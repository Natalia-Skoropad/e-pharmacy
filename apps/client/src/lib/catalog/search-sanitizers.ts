import { sanitizeSearchText } from '@e-pharmacy/validation';

import {
  sanitizeCatalogArticleParam,
  sanitizeCatalogTextParam,
} from './catalog-param-utils';

//===================================================================

export function sanitizeCatalogTextSearch(value: string): string {
  return sanitizeCatalogTextParam(sanitizeSearchText(value));
}

export function sanitizeCatalogArticleSearch(value: string): string {
  return sanitizeCatalogArticleParam(sanitizeSearchText(value));
}
