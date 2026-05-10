import { Router } from 'express';

import {
  createStoreReview,
  getStoreDetails,
  getStoreReviews,
  getStores,
  toggleFavoriteStore,
} from '../controllers/store.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createStoreReviewSchema,
  storeIdParamsSchema,
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

storeRoutes.get(
  '/:storeId/reviews',
  validate({
    params: storeIdParamsSchema,
  }),
  ctrlWrapper(getStoreReviews)
);

storeRoutes.post(
  '/:storeId/reviews',
  authenticate,
  validate({
    params: storeIdParamsSchema,
    body: createStoreReviewSchema,
  }),
  ctrlWrapper(createStoreReview)
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
