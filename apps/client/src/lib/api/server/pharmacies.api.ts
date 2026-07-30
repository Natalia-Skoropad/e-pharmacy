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

export const getPharmacies = publicPharmaciesReader.getPharmacies;
export const getPharmacyOptions = publicPharmaciesReader.getOptions;
export const getPharmacyFilters = publicPharmaciesReader.getFilters;
export const getPharmacyDetails = publicPharmaciesReader.getDetails;
export const getPharmacyReviews = publicPharmaciesReader.getReviews;
