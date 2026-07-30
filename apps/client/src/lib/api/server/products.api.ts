import 'server-only';

import { apiRoutes as ROUTES } from '@e-pharmacy/api-client/contracts';

import {
  publicBackendApiRequest,
  type PublicBackendRequestOptions,
} from '@e-pharmacy/next-api/server';

import { createPublicProductsReader } from '@/lib/api/readers/public-products-reader';
import type { PublicReadRequestOptions } from '@/lib/api/request-options';

//===================================================================

type ServerReadOptions = PublicReadRequestOptions<PublicBackendRequestOptions>;

//===================================================================

const publicProductsReader = createPublicProductsReader<ServerReadOptions>(
  (path, options) => publicBackendApiRequest(path, options),
  ROUTES.products
);

//===================================================================

export const getProducts = publicProductsReader.getProducts;
export const getProductFilters = publicProductsReader.getFilters;
export const getProductDetails = publicProductsReader.getDetails;
export const getProductReviews = publicProductsReader.getReviews;
