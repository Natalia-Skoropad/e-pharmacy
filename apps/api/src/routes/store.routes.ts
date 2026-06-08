import { Router } from 'express';

import {
  createStoreReview,
  getPendingStoreReviews,
  getStoreDetails,
  getStoreFilters,
  getStoreReviews,
  getStores,
  moderateStoreReview,
  toggleFavoriteStore,
} from '../controllers/store.controller';

import { USER_ROLES } from '../constants/auth';

import {
  authenticate,
  optionalAuthenticate,
} from '../middlewares/auth.middleware';

import { reviewRateLimit } from '../middlewares/rateLimit.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createStoreReviewSchema,
  moderateStoreReviewSchema,
  pendingStoreReviewsQuerySchema,
  storeIdParamsSchema,
  storeReviewParamsSchema,
  storesQuerySchema,
} from '../schemas/store.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const storeRoutes = Router();

//===============================================================

storeRoutes.get(
  '/',
  optionalAuthenticate,
  validate({
    query: storesQuerySchema,
  }),
  ctrlWrapper(getStores)
);

storeRoutes.get('/filters', ctrlWrapper(getStoreFilters));

storeRoutes.get(
  '/reviews/pending',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    query: pendingStoreReviewsQuerySchema,
  }),
  ctrlWrapper(getPendingStoreReviews)
);

storeRoutes.get(
  '/:storeId/reviews',
  validate({
    params: storeIdParamsSchema,
  }),
  ctrlWrapper(getStoreReviews)
);

storeRoutes.post(
  '/:storeId/reviews',
  reviewRateLimit,
  authenticate,
  validate({
    params: storeIdParamsSchema,
    body: createStoreReviewSchema,
  }),
  ctrlWrapper(createStoreReview)
);

storeRoutes.patch(
  '/:storeId/reviews/:reviewId/moderation',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: storeReviewParamsSchema,
    body: moderateStoreReviewSchema,
  }),
  ctrlWrapper(moderateStoreReview)
);

storeRoutes.patch(
  '/:storeId/favorite',
  authenticate,
  validate({
    params: storeIdParamsSchema,
  }),
  ctrlWrapper(toggleFavoriteStore)
);

storeRoutes.get(
  '/:storeId',
  optionalAuthenticate,
  validate({
    params: storeIdParamsSchema,
  }),
  ctrlWrapper(getStoreDetails)
);
