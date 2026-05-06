import { Router } from 'express';

import {
  getProductDetails,
  getProductReviews,
  getProducts,
} from '../controllers/product.controller';

import { validate } from '../middlewares/validate.middleware';
import {
  productIdParamsSchema,
  productsQuerySchema,
} from '../schemas/product.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const productRoutes = Router();

//===============================================================

productRoutes.get(
  '/',
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

productRoutes.get(
  '/:productId',
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductDetails)
);
