import 'server-only';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';

import {
  publicBackendApiRequest,
  type PublicBackendRequestOptions,
} from '@e-pharmacy/next-api/server';

import { createPublicPharmaciesReader } from '@/lib/api/readers/public-pharmacies-reader';
import type { PublicReadRequestOptions } from '@/lib/api/request-options';

//===================================================================

type ServerReadOptions = PublicReadRequestOptions<PublicBackendRequestOptions>;

//===================================================================

const publicPharmaciesReader = createPublicPharmaciesReader<ServerReadOptions>(
  (path, options) => publicBackendApiRequest(path, options),
  ROUTES.pharmacies
);

//===================================================================

// The public catalog and the full detail read are heavier than the small
// search-option dictionaries. Give only these two reads a larger budget;
// retain the shared timeout/retry policy for all other public endpoints.
const PHARMACY_CONTENT_READ_TIMEOUT_MS = 18_000;

//===================================================================

export const getPharmacies = (
  params?: Parameters<typeof publicPharmaciesReader.getPharmacies>[0],
  options?: ServerReadOptions
) =>
  publicPharmaciesReader.getPharmacies(params, {
    ...options,
    timeoutMs: PHARMACY_CONTENT_READ_TIMEOUT_MS,
  });

//===================================================================

export const getPharmacyOptions = publicPharmaciesReader.getOptions;
export const getPharmacySearchOptions = publicPharmaciesReader.getSearchOptions;
export const getPharmacyFilters = publicPharmaciesReader.getFilters;

//===================================================================

export const getPharmacyDetails = (id: string, options?: ServerReadOptions) =>
  publicPharmaciesReader.getDetails(id, {
    ...options,
    timeoutMs: PHARMACY_CONTENT_READ_TIMEOUT_MS,
  });

//===================================================================

export const getPharmacyReviews = publicPharmaciesReader.getReviews;
