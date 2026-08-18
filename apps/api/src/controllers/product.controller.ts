import type { Request } from 'express';

import { USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  CreateProductReviewInput,
  ModerateProductReviewInput,
  PendingProductReviewsQuery,
  ProductFiltersQuery,
  ProductIdParams,
  ProductReviewParams,
  ManagedProductsQuery,
  PublicProductsQuery,
} from '../schemas/product.schema';

import {
  addProductToMyPharmacyService,
  createProductReviewService,
  getFavoriteProductIdsService,
  getFavoriteProductsService,
  getManagedProductDetailsService,
  getManagedProductsService,
  getProductDetailsService,
  getProductFiltersService,
  getPendingProductReviewsService,
  getProductReviewsService,
  getProductsService,
  moderateProductReviewService,
  removeProductFromMyPharmacyService,
  setFavoriteProductService,
} from '../services/product.service';

import { getProductStockMovementsService } from '../services/stockMovement.service';
import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getProductFilters(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, ProductFiltersQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getProductFiltersService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProducts(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PublicProductsQuery>
): Promise<void> {
  const { query } = res.locals.validated;

  const data = await getProductsService(
    query,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getManagedProducts(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, ManagedProductsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getManagedProductsService(query, { includeOffers: true });

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getManagedProductDetails(
  _req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;
  const data = await getManagedProductDetailsService(productId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoriteProductIds(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getFavoriteProductIdsService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoriteProducts(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PublicProductsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getFavoriteProductsService(query, req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProductDetails(
  req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;
  const data = await getProductDetailsService(
    productId,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProductStockMovements(
  req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;

  const data = await getProductStockMovementsService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function addProductToMyPharmacy(
  req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;

  const data = await addProductToMyPharmacyService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function removeProductFromMyPharmacy(
  req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;
  const data = await removeProductFromMyPharmacyService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPendingProductReviews(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, PendingProductReviewsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getPendingProductReviewsService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getProductReviews(
  _req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;
  const data = await getProductReviewsService(productId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createProductReview(
  req: Request,
  res: ValidatedResponse<CreateProductReviewInput, ProductIdParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await createProductReviewService(params.productId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'Client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function moderateProductReview(
  req: Request,
  res: ValidatedResponse<ModerateProductReviewInput, ProductReviewParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await moderateProductReviewService(
    params.productId,
    params.reviewId,
    {
      status: body.status,
      reason: body.reason,
      moderatorId: req.user?.id ?? '',
    }
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function setFavoriteProduct(
  req: Request,
  res: ValidatedResponse<unknown, ProductIdParams>
): Promise<void> {
  const { productId } = res.locals.validated.params;
  const data = await setFavoriteProductService(
    productId,
    req.user?.id ?? '',
    req.method === 'PUT'
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
