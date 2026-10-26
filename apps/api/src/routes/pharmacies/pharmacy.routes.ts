import { Router } from 'express';

import {
  createPharmacyDraft,
  getOwnedPharmacyProfile,
  updateOwnedPharmacyDraft,
  submitOwnedPharmacyForVerification,
  uploadOwnedPharmacyDocument,
  downloadOwnedPharmacyDocument,
  getOwnedPharmacyDetail,
  getOwnedPharmacyStatistics,
  listOwnedPharmacies,
  listOwnedPharmacyOptions,
  createPharmacyReview,
  getFavoritePharmacyIds,
  getFavoritePharmacies,
  getMyPharmacyDocument,
  getCurrentPharmacySummary,
  listMyPharmacyMemberships,
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
} from '../../controllers/pharmacies/pharmacy.controller';

import { USER_ROLES } from '../../constants/auth/auth';

import {
  authenticate,
  optionalAuthenticate,
} from '../../middlewares/auth/auth.middleware';

import { reviewRateLimit } from '../../middlewares/security/rateLimit.middleware';
import { authorizeRoles } from '../../middlewares/auth/role.middleware';
import { validate } from '../../middlewares/http/validate.middleware';

import {
  createPharmacyDraftSchema,
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
} from '../../schemas/pharmacies/pharmacy.schema';

import { emptyQuerySchema } from '../../schemas/shared';

import {
  ownedPharmacyRegistryListQuerySchema,
  ownedPharmacyRegistryOptionsQuerySchema,
  ownedPharmacyRegistryParamsSchema,
  ownedPharmacyDocumentParamsSchema,
} from '../../schemas/owners/owned-pharmacy-registry.schema';

import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

//===============================================================

export const pharmacyRoutes = Router();

//===============================================================

pharmacyRoutes.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ body: createPharmacyDraftSchema }),
  ctrlWrapper(createPharmacyDraft)
);

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

// Stage 14.18.8: authenticated, user-scoped pharmacy registry. Static routes
// precede the dynamic detail route; public /:pharmacyId remains unchanged.
pharmacyRoutes.get(
  '/me/pharmacies',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ query: ownedPharmacyRegistryListQuerySchema }),
  ctrlWrapper(listOwnedPharmacies)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/pharmacies/summary',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ query: emptyQuerySchema }),
  ctrlWrapper(getOwnedPharmacyStatistics)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/pharmacies/options',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ query: ownedPharmacyRegistryOptionsQuerySchema }),
  ctrlWrapper(listOwnedPharmacyOptions)
);

//=================================================================================

// Stage 14.18.10 scoped draft lifecycle. Keep all mutations owner-only.
pharmacyRoutes.get(
  '/me/pharmacies/:pharmacyId/profile',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),

  validate({
    params: ownedPharmacyRegistryParamsSchema,
    query: emptyQuerySchema,
  }),

  ctrlWrapper(getOwnedPharmacyProfile)
);

//=================================================================================

pharmacyRoutes.patch(
  '/me/pharmacies/:pharmacyId/profile',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),

  validate({
    params: ownedPharmacyRegistryParamsSchema,
    body: updateMyPharmacyProfileSchema,
  }),

  ctrlWrapper(updateOwnedPharmacyDraft)
);

//=================================================================================

pharmacyRoutes.post(
  '/me/pharmacies/:pharmacyId/send-for-verification',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),

  validate({
    params: ownedPharmacyRegistryParamsSchema,
    body: sendMyPharmacyForVerificationSchema,
  }),

  ctrlWrapper(submitOwnedPharmacyForVerification)
);

//=================================================================================

pharmacyRoutes.post(
  '/me/pharmacies/:pharmacyId/documents',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),

  validate({
    params: ownedPharmacyRegistryParamsSchema,
    body: uploadMyPharmacyDocumentSchema,
  }),

  ctrlWrapper(uploadOwnedPharmacyDocument)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/pharmacies/:pharmacyId/documents/:documentId',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  validate({ params: ownedPharmacyDocumentParamsSchema }),
  ctrlWrapper(downloadOwnedPharmacyDocument)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/pharmacies/:pharmacyId',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),

  validate({
    params: ownedPharmacyRegistryParamsSchema,
    query: emptyQuerySchema,
  }),

  ctrlWrapper(getOwnedPharmacyDetail)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/memberships',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  ctrlWrapper(listMyPharmacyMemberships)
);

//=================================================================================

pharmacyRoutes.get(
  '/me/summary',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY),
  ctrlWrapper(getCurrentPharmacySummary)
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
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.PHARMACY, USER_ROLES.ADMIN),
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
