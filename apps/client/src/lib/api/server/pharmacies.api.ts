import 'server-only';

import type { RequestOptions } from '@e-pharmacy/api-client/core';
import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';
import { publicBackendApiRequest } from '@e-pharmacy/next-api/server';

import { createPublicPharmaciesReader } from '@/lib/api/readers/public-pharmacies-reader';

//===================================================================

const publicPharmaciesReader = createPublicPharmaciesReader<RequestOptions>(
  (path, options) => publicBackendApiRequest(path, options),
  ROUTES.pharmacies
);

export const getPharmaciesFromBackend = publicPharmaciesReader.getPharmacies;
export const getPharmacyOptionsFromBackend = publicPharmaciesReader.getOptions;
export const getPharmacyFiltersFromBackend = publicPharmaciesReader.getFilters;
export const getPharmacyDetailsFromBackend = publicPharmaciesReader.getDetails;
export const getPharmacyReviewsFromBackend = publicPharmaciesReader.getReviews;
