import type { Request } from 'express';

import { USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  CreatePharmacyReviewInput,
  ModeratePharmacyReviewInput,
  PendingPharmacyReviewsQuery,
  PharmaciesQuery,
  PharmacyDocumentParams,
  PharmacyIdParams,
  PharmacyReviewParams,
  SendMyPharmacyForVerificationInput,
  SubmitMyPharmacyModerationInput,
  UpdateMyPharmacyProfileInput,
} from '../schemas/pharmacy.schema';

import type { PharmacyDocumentUploadInput } from '../schemas/shared/pharmacy-document.schema';

import {
  createPharmacyReviewService,
  getFavoritePharmacyIdsService,
  getFavoritePharmaciesService,
  getMyPharmacyProfileService,
  getPendingPharmacyReviewsService,
  getPharmaciesService,
  getPharmacyCheckoutDetailsService,
  getPharmacyDetailsService,
  getPharmacyFiltersService,
  getPharmacyOptionsService,
  getPharmacyReviewsService,
  moderatePharmacyReviewService,
  sendMyPharmacyForVerificationService,
  submitMyPharmacyModerationService,
  setFavoritePharmacyService,
  updateMyPharmacyProfileService,
} from '../services/pharmacy.service';

import {
  createPrivatePharmacyDocumentUploadService,
  getPrivatePharmacyDocumentContentService,
} from '../services/pharmacy-document.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function uploadMyPharmacyDocument(
  req: Request,
  res: ValidatedResponse<PharmacyDocumentUploadInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const data = await createPrivatePharmacyDocumentUploadService(
    req.user?.id ?? '',
    input
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function getMyPharmacyDocument(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyDocumentParams>
): Promise<void> {
  const { documentId } = res.locals.validated.params;

  const data = await getPrivatePharmacyDocumentContentService(
    req.user?.id ?? '',
    documentId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getMyPharmacyProfile(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getMyPharmacyProfileService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateMyPharmacyProfile(
  req: Request,
  res: ValidatedResponse<UpdateMyPharmacyProfileInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const data = await updateMyPharmacyProfileService(req.user?.id ?? '', body);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function submitMyPharmacyModeration(
  req: Request,
  res: ValidatedResponse<SubmitMyPharmacyModerationInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const data = await submitMyPharmacyModerationService(req.user?.id ?? '', body);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function sendMyPharmacyForVerification(
  req: Request,
  res: ValidatedResponse<SendMyPharmacyForVerificationInput>
): Promise<void> {
  const data = await sendMyPharmacyForVerificationService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getPharmaciesService(
    query,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyFilters(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyFiltersService();
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOptions(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyOptionsService();
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacyIds(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getFavoritePharmacyIdsService(req.user?.id ?? '');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getFavoritePharmaciesService(query, req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyDetails(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyDetailsService(
    pharmacyId,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyCheckoutDetails(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyCheckoutDetailsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPendingPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, PendingPharmacyReviewsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getPendingPharmacyReviewsService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyReviewsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createPharmacyReview(
  req: Request,
  res: ValidatedResponse<CreatePharmacyReviewInput, PharmacyIdParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await createPharmacyReviewService(params.pharmacyId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function moderatePharmacyReview(
  req: Request,
  res: ValidatedResponse<ModeratePharmacyReviewInput, PharmacyReviewParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const data = await moderatePharmacyReviewService(
    params.pharmacyId,
    params.reviewId,
    {
      status: body.status,
      reason: body.reason,
      moderatorId: req.user?.id ?? '',
    }
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function setFavoritePharmacy(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await setFavoritePharmacyService(
    pharmacyId,
    req.user?.id ?? '',
    req.method === 'PUT'
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
