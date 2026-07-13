import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createProductReviewSchema,
  moderateProductReviewSchema,
  pendingProductReviewsQuerySchema,
  productFiltersQuerySchema,
  productsQuerySchema,
} from '../schemas/product.schema';

import {
  addProductToMyPharmacyService,
  createProductReviewService,
  getFavoriteProductIdsService,
  getFavoriteProductsService,
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
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type ProductParams = {
  productId: string;
};

//===============================================================

export async function getProductFilters(
  req: Request,
  res: Response
): Promise<void> {
  const query = productFiltersQuerySchema.parse(req.query);
  const data = await getProductFiltersService(query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getProducts(req: Request, res: Response): Promise<void> {
  const query = productsQuerySchema.parse(req.query);
  const data = await getProductsService(query, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getFavoriteProductIds(
  req: Request,
  res: Response
): Promise<void> {
  const data = await getFavoriteProductIdsService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getFavoriteProducts(
  req: Request,
  res: Response
): Promise<void> {
  const query = productsQuerySchema.parse(req.query);
  const data = await getFavoriteProductsService(query, req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getProductDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;

  const data = await getProductDetailsService(productId, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getProductStockMovements(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;
  const data = await getProductStockMovementsService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function addProductToMyPharmacy(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;
  const data = await addProductToMyPharmacyService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function removeProductFromMyPharmacy(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;
  const data = await removeProductFromMyPharmacyService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPendingProductReviews(
  req: Request,
  res: Response
): Promise<void> {
  const query = pendingProductReviewsQuerySchema.parse(req.query);
  const data = await getPendingProductReviewsService(query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getProductReviews(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;

  const data = await getProductReviewsService(productId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function createProductReview(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;
  const body = createProductReviewSchema.parse(req.body);

  const data = await createProductReviewService(productId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'Client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function moderateProductReview(
  req: Request,
  res: Response
): Promise<void> {
  const { productId, reviewId } = req.params as ProductParams & {
    reviewId: string;
  };
  const body = moderateProductReviewSchema.parse(req.body);

  const data = await moderateProductReviewService(productId, reviewId, {
    status: body.status,
    reason: body.reason,
    moderatorId: req.user?.id ?? '',
  });

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function setFavoriteProduct(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;

  const data = await setFavoriteProductService(
    productId,
    req.user?.id ?? '',
    req.method === 'PUT'
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
