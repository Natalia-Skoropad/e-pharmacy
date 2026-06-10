import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createProductReviewSchema,
  moderateProductReviewSchema,
  pendingProductReviewsQuerySchema,
  productsQuerySchema,
} from '../schemas/product.schema';

import {
  createProductReviewService,
  getProductDetailsService,
  getProductFiltersService,
  getPendingProductReviewsService,
  getProductReviewsService,
  getProductsService,
  moderateProductReviewService,
  toggleFavoriteProductService,
} from '../services/product.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type ProductParams = {
  productId: string;
};

//===============================================================

export async function getProductFilters(
  _req: Request,
  res: Response
): Promise<void> {
  const data = await getProductFiltersService();

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
    moderatedBy: req.user?.id,
  });

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function toggleFavoriteProduct(
  req: Request,
  res: Response
): Promise<void> {
  const { productId } = req.params as ProductParams;

  const data = await toggleFavoriteProductService(
    productId,
    req.user?.id ?? ''
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
