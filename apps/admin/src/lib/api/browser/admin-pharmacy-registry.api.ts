import 'client-only';

import {
  parseApiResponseData,
  parseAdminPharmacyListResponse,
  parseAdminPharmacyStatistics,
  parseAdminPharmacyOptionsResponse,
  parseAdminPharmacyRegistryOwnerOptionsResponse,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AdminPharmacyListResponse,
  AdminPharmacyStatistics,
  AdminPharmacyOptionsResponse,
  AdminPharmacyRegistryOwnerOptionsResponse,
} from '@e-pharmacy/types/admin';

import type { AdminPharmacyStatus } from '@/lib/pharmacies/admin-pharmacy';

import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';

//===================================================================

export type AdminPharmacyRegistryQueryParams = Readonly<{
  pharmacyId?: string;
  ownerId?: string;
  pharmacySearch?: string;
  ownerSearch?: string;
  status?: AdminPharmacyStatus;
  createdFrom?: string;
  createdTo?: string;
  rating?: '0-0.9' | '1-1.9' | '2-2.9' | '3-3.9' | '4-5';
  sort?: 'created_desc' | 'created_asc';
  page?: number;
  perPage?: 20 | 50 | 100;
}>;

export type AdminPharmacyRegistryOptionsQueryParams = Readonly<{
  search?: string;
  ownerId?: string;
  pharmacyId?: string;
  limit?: number;
}>;

//===================================================================

export async function getAdminPharmacies(
  params: AdminPharmacyRegistryQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyListResponse> {
  const path = appendQueryParams(adminApiRoutes.pharmacyRegistry.list, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacySummary(
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyStatistics> {
  const path = adminApiRoutes.pharmacyRegistry.summary;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyStatistics,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyOptions(
  params: AdminPharmacyRegistryOptionsQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyOptionsResponse> {
  const path = appendQueryParams(
    adminApiRoutes.pharmacyRegistry.options,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyOptionsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminPharmacyRegistryOwnerOptions(
  params: AdminPharmacyRegistryOptionsQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminPharmacyRegistryOwnerOptionsResponse> {
  const path = appendQueryParams(
    adminApiRoutes.pharmacyRegistry.ownerOptions,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),

    parseAdminPharmacyRegistryOwnerOptionsResponse,
    { url: path, method: 'GET' }
  );
}
