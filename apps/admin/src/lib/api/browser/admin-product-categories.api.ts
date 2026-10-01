import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  CreateProductCategoryPayload,
  ProductCategoryListResponse,
  UpdateProductCategoryPayload,
} from '@e-pharmacy/types/reference-data';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parseProductCategoryListResponse,
  parseProductCategoryMutationResponse,
  type ProductCategoryMutationResponse,
  type SettingsDictionaryListQuery,
} from '@/lib/settings/settings-dictionary';

//===================================================================

export async function getAdminProductCategories(
  params: SettingsDictionaryListQuery = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<ProductCategoryListResponse> {
  const path = appendQueryParams(
    ADMIN_API_ROUTES.productCategories.list,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseProductCategoryListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function createAdminProductCategory(
  payload: CreateProductCategoryPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<ProductCategoryMutationResponse> {
  const path = ADMIN_API_ROUTES.productCategories.list;

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    parseProductCategoryMutationResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function updateAdminProductCategory(
  categoryId: string,
  payload: UpdateProductCategoryPayload,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<ProductCategoryMutationResponse> {
  const path = ADMIN_API_ROUTES.productCategories.details(categoryId);

  return parseApiResponseData(
    await localApiRequest(path, {
      method: 'PATCH',
      body: payload,
      signal: options?.signal,
    }),

    parseProductCategoryMutationResponse,
    { url: path, method: 'PATCH' }
  );
}

//===================================================================

export async function deleteAdminProductCategory(
  categoryId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<void> {
  const path = ADMIN_API_ROUTES.productCategories.details(categoryId);

  await localApiRequest(path, {
    method: 'DELETE',
    responseType: 'no-content',
    signal: options?.signal,
  });
}
