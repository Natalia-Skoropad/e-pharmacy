import { Router } from 'express';

import {
  addProductToMyPharmacy,
  createProductReview,
  getFavoriteProductIds,
  getFavoriteProducts,
  getPendingProductReviews,
  getManagedProductDetails,
  getManagedProducts,
  moderateProductReview,
  removeProductFromMyPharmacy,
  getProductDetails,
  getProductFilters,
  getProductReviews,
  getProductStockMovements,
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
  productFiltersQuerySchema,
  productIdParamsSchema,
  productReviewParamsSchema,
  managedProductsQuerySchema,
  publicProductsQuerySchema,
} from '../schemas/product.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const productRoutes = Router();

//===============================================================

productRoutes.get(
  '/',
  optionalAuthenticate,
  validate({
    query: publicProductsQuerySchema,
  }),
  ctrlWrapper(getProducts)
);

//=================================================================================

productRoutes.get(
  '/filters',
  validate({ query: productFiltersQuerySchema }),
  ctrlWrapper(getProductFilters)
);

//=================================================================================

productRoutes.get(
  '/management',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY, USER_ROLES.ADMIN),
  validate({ query: managedProductsQuerySchema }),
  ctrlWrapper(getManagedProducts)
);

//=================================================================================

productRoutes.get(
  '/management/:productId',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY, USER_ROLES.ADMIN),
  validate({ params: productIdParamsSchema }),
  ctrlWrapper(getManagedProductDetails)
);

//=================================================================================

productRoutes.get(
  '/favorites/ids',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),
  ctrlWrapper(getFavoriteProductIds)
);

//=================================================================================

productRoutes.get(
  '/favorites',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),
  validate({
    query: publicProductsQuerySchema,
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

productRoutes.post(
  '/:productId/my-pharmacy',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(addProductToMyPharmacy)
);

//=================================================================================

productRoutes.delete(
  '/:productId/my-pharmacy',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(removeProductFromMyPharmacy)
);

//=================================================================================

productRoutes.get(
  '/:productId/stock-movements',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(getProductStockMovements)
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
  authorizeRoles(USER_ROLES.CLIENT),
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
  authorizeRoles(USER_ROLES.CLIENT),
  validate({
    params: productIdParamsSchema,
  }),
  ctrlWrapper(setFavoriteProduct)
);

//=================================================================================

productRoutes.delete(
  '/:productId/favorite',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),
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
