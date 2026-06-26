import { Router } from 'express';

import {
  createPharmacyReview,
  getFavoritePharmacyIds,
  getFavoritePharmacies,
  getMyPharmacyProfile,
  getPendingPharmacyReviews,
  getPharmacyCheckoutDetails,
  getPharmacyDetails,
  getPharmacyFilters,
  getPharmacyOptions,
  getPharmacyReviews,
  getPharmacies,
  moderatePharmacyReview,
  sendMyPharmacyForVerification,
  setFavoritePharmacy,
  updateMyPharmacyProfile,
} from '../controllers/pharmacy.controller';

import { USER_ROLES } from '../constants/auth';

import {
  authenticate,
  optionalAuthenticate,
} from '../middlewares/auth.middleware';

import { reviewRateLimit } from '../middlewares/rateLimit.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

import {
  createPharmacyReviewSchema,
  moderatePharmacyReviewSchema,
  pendingPharmacyReviewsQuerySchema,
  pharmacyIdParamsSchema,
  pharmacyReviewParamsSchema,
  pharmaciesQuerySchema,
  sendMyPharmacyForVerificationSchema,
  updateMyPharmacyProfileSchema,
} from '../schemas/pharmacy.schema';

import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const pharmacyRoutes = Router();

//===============================================================


pharmacyRoutes.get(
  '/me/profile',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  ctrlWrapper(getMyPharmacyProfile)
);

//=================================================================================

pharmacyRoutes.patch(
  '/me/profile',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: updateMyPharmacyProfileSchema }),
  ctrlWrapper(updateMyPharmacyProfile)
);

//=================================================================================

pharmacyRoutes.post(
  '/me/profile/send-for-verification',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: sendMyPharmacyForVerificationSchema }),
  ctrlWrapper(sendMyPharmacyForVerification)
);

//=================================================================================

pharmacyRoutes.get(
  '/',
  optionalAuthenticate,
  validate({
    query: pharmaciesQuerySchema,
  }),
  ctrlWrapper(getPharmacies)
);

//=================================================================================

pharmacyRoutes.get('/filters', ctrlWrapper(getPharmacyFilters));

//=================================================================================

pharmacyRoutes.get('/options', ctrlWrapper(getPharmacyOptions));

//=================================================================================


pharmacyRoutes.get(
  '/favorites/ids',
  authenticate,
  ctrlWrapper(getFavoritePharmacyIds)
);

//=================================================================================

pharmacyRoutes.get(
  '/favorites',
  authenticate,
  validate({
    query: pharmaciesQuerySchema,
  }),
  ctrlWrapper(getFavoritePharmacies)
);

//=================================================================================

pharmacyRoutes.get(
  '/reviews/pending',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    query: pendingPharmacyReviewsQuerySchema,
  }),
  ctrlWrapper(getPendingPharmacyReviews)
);

//=================================================================================

pharmacyRoutes.get(
  '/:pharmacyId/checkout-details',
  authenticate,
  validate({ params: pharmacyIdParamsSchema }),
  ctrlWrapper(getPharmacyCheckoutDetails)
);

//=================================================================================

pharmacyRoutes.get(
  '/:pharmacyId/reviews',
  validate({
    params: pharmacyIdParamsSchema,
  }),
  ctrlWrapper(getPharmacyReviews)
);

//=================================================================================

pharmacyRoutes.post(
  '/:pharmacyId/reviews',
  reviewRateLimit,
  authenticate,
  validate({
    params: pharmacyIdParamsSchema,
    body: createPharmacyReviewSchema,
  }),
  ctrlWrapper(createPharmacyReview)
);

//=================================================================================

pharmacyRoutes.patch(
  '/:pharmacyId/reviews/:reviewId/moderation',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: pharmacyReviewParamsSchema,
    body: moderatePharmacyReviewSchema,
  }),
  ctrlWrapper(moderatePharmacyReview)
);

//=================================================================================

pharmacyRoutes.put(
  '/:pharmacyId/favorite',
  authenticate,
  validate({
    params: pharmacyIdParamsSchema,
  }),
  ctrlWrapper(setFavoritePharmacy)
);

//=================================================================================

pharmacyRoutes.delete(
  '/:pharmacyId/favorite',
  authenticate,
  validate({
    params: pharmacyIdParamsSchema,
  }),
  ctrlWrapper(setFavoritePharmacy)
);

//=================================================================================

pharmacyRoutes.get(
  '/:pharmacyId',
  optionalAuthenticate,
  validate({
    params: pharmacyIdParamsSchema,
  }),
  ctrlWrapper(getPharmacyDetails)
);
