import { Router } from 'express';

import {
  createProductReview,
  getProductDetails,
  getProductReviews,
  getProducts,
  toggleFavoriteProduct,
} from '../controllers/product.controller';

import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProductReviewSchema,
  productIdParamsSchema,
  productsQuerySchema,
} from '../schemas/product.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const productRoutes = Router();

//===============================================================

productRoutes.get(
  '/',
  optionalAuthenticate,
  validate({
    query: productsQuerySchema,
  }),
  ctrlWrapper(getProducts)
);

productRoutes.get(
  '/:productId/reviews',
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductReviews)
);

productRoutes.post(
  '/:productId/reviews',
  authenticate,
  validate({
    params: productIdParamsSchema,
    body: createProductReviewSchema,
  }),
  ctrlWrapper(createProductReview)
);

productRoutes.patch(
  '/:productId/favorite',
  authenticate,
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(toggleFavoriteProduct)
);

productRoutes.get(
  '/:productId',
  optionalAuthenticate,
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductDetails)
);
