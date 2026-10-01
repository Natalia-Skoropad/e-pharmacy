import 'client-only';

import {
  parseApiResponseData,
  parseProductCategoryReferencesResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

//===================================================================

export async function getProductCategories(
  options?: BrowserReadRequestOptions
): Promise<readonly ProductCategoryReference[]> {
  const path = PHARMACY_API_ROUTES.productCategories.list;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parseProductCategoryReferencesResponse,
    { url: path, method: 'GET' }
  );
}
