import { Router } from 'express';

import {
  createProductReview,
  getFavoriteProductIds,
  getFavoriteProducts,
  getPendingProductReviews,
  moderateProductReview,
  getProductDetails,
  getProductFilters,
  getProductReviews,
  getProducts,
  setFavoriteProduct,
} from '../controllers/product.controller';

import { USER_ROLES } from '../constants/auth';

import {
  authenticate,
  optionalAuthenticate,
} from '../middlewares/auth.middleware';

import { reviewRateLimit } from '../middlewares/rateLimit.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createProductReviewSchema,
  moderateProductReviewSchema,
  pendingProductReviewsQuerySchema,
  productIdParamsSchema,
  productReviewParamsSchema,
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

//=================================================================================

productRoutes.get('/filters', ctrlWrapper(getProductFilters));

//=================================================================================


productRoutes.get(
  '/favorites/ids',
  authenticate,
  ctrlWrapper(getFavoriteProductIds)
);

//=================================================================================

productRoutes.get(
  '/favorites',
  authenticate,
  validate({
    query: productsQuerySchema,
  }),
  ctrlWrapper(getFavoriteProducts)
);

//=================================================================================

productRoutes.get(
  '/reviews/pending',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    query: pendingProductReviewsQuerySchema,
  }),
  ctrlWrapper(getPendingProductReviews)
);

//=================================================================================

productRoutes.get(
  '/:productId/reviews',
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductReviews)
);

//=================================================================================

productRoutes.post(
  '/:productId/reviews',
  reviewRateLimit,
  authenticate,
  validate({
    params: productIdParamsSchema,
    body: createProductReviewSchema,
  }),
  ctrlWrapper(createProductReview)
);

//=================================================================================

productRoutes.patch(
  '/:productId/reviews/:reviewId/moderation',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: productReviewParamsSchema,
    body: moderateProductReviewSchema,
  }),
  ctrlWrapper(moderateProductReview)
);

//=================================================================================

productRoutes.put(
  '/:productId/favorite',
  authenticate,
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(setFavoriteProduct)
);

//=================================================================================

productRoutes.delete(
  '/:productId/favorite',
  authenticate,
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(setFavoriteProduct)
);

//=================================================================================

productRoutes.get(
  '/:productId',
  optionalAuthenticate,
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductDetails)
);
