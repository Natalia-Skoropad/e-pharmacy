import 'server-only';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';

import {
  publicBackendApiRequest,
  type PublicBackendRequestOptions,
} from '@e-pharmacy/next-api/server';

import { createPublicProductsReader } from '@/lib/api/readers/public-products-reader';

//===================================================================

const publicProductsReader =
  createPublicProductsReader<PublicBackendRequestOptions>(
    (path, options) => publicBackendApiRequest(path, options),
    ROUTES.products
  );

export const getProductsFromBackend = publicProductsReader.getProducts;
export const getProductFiltersFromBackend = publicProductsReader.getFilters;
export const getProductDetailsFromBackend = publicProductsReader.getDetails;
export const getProductReviewsFromBackend = publicProductsReader.getReviews;
