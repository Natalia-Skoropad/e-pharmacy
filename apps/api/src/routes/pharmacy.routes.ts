import { Router } from 'express';

import {
  createPharmacyReview,
  getFavoritePharmacyIds,
  getFavoritePharmacies,
  getMyPharmacyDocument,
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
  submitMyPharmacyModeration,
  setFavoritePharmacy,
  updateMyPharmacyProfile,
  uploadMyPharmacyDocument,
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
  pharmacyDocumentParamsSchema,
  pharmacyIdParamsSchema,
  pharmacyReviewParamsSchema,
  pharmaciesQuerySchema,
  sendMyPharmacyForVerificationSchema,
  submitMyPharmacyModerationSchema,
  updateMyPharmacyProfileSchema,
  uploadMyPharmacyDocumentSchema,
} from '../schemas/pharmacy.schema';

import { emptyQuerySchema } from '../schemas/shared';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const pharmacyRoutes = Router();

//===============================================================

pharmacyRoutes.post(
  '/me/documents',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: uploadMyPharmacyDocumentSchema }),
  ctrlWrapper(uploadMyPharmacyDocument)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/documents/:documentId',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ params: pharmacyDocumentParamsSchema }),
  ctrlWrapper(getMyPharmacyDocument)
);

//=================================================================================

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
  '/me/profile/moderation-submission',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: submitMyPharmacyModerationSchema }),
  ctrlWrapper(submitMyPharmacyModeration)
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

pharmacyRoutes.get(
  '/filters',
  validate({ query: emptyQuerySchema }),
  ctrlWrapper(getPharmacyFilters)
);

//=================================================================================

pharmacyRoutes.get(
  '/options',
  validate({ query: emptyQuerySchema }),
  ctrlWrapper(getPharmacyOptions)
);

//=================================================================================

pharmacyRoutes.get(
  '/favorites/ids',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),
  ctrlWrapper(getFavoritePharmacyIds)
);

//=================================================================================

pharmacyRoutes.get(
  '/favorites',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),

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
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.PHARMACY),
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
  authorizeRoles(USER_ROLES.CLIENT),

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
  authorizeRoles(USER_ROLES.CLIENT),

  validate({
    params: pharmacyIdParamsSchema,
  }),

  ctrlWrapper(setFavoritePharmacy)
);

//=================================================================================

pharmacyRoutes.delete(
  '/:pharmacyId/favorite',
  authenticate,
  authorizeRoles(USER_ROLES.CLIENT),

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
