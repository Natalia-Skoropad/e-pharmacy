import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  getProductDetailsService,
  getProductReviewsService,
  getProductsService,
} from '../services/product.service';
import { sendSuccessResponse } from '../utils/apiResponse';

import type { ProductCategory } from '../types/product';

//===============================================================

type ProductParams = {
  productId: string;
};

//===============================================================

export async function getProducts(req: Request, res: Response): Promise<void> {
  const data = await getProductsService(
    req.query as unknown as {
      page: number;
      perPage: number;
      keyword?: string;
      category?: ProductCategory;
      storeId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      sort?: 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';
    }
  );

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
