import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { productsQuerySchema } from '../schemas/product.schema';
import {
  getProductDetailsService,
  getProductReviewsService,
  getProductsService,
} from '../services/product.service';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type ProductParams = {
  productId: string;
};

//===============================================================

export async function getProducts(req: Request, res: Response): Promise<void> {
  const query = productsQuerySchema.parse(req.query);
  const data = await getProductsService(query);

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

  const data = await getProductDetailsService(productId);

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
